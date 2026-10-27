import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { SONGS } from '../shared/songs.js';
import assert from 'node:assert/strict';
import { ORIGIN, pages, routes } from './agent-content.mjs';
import { markdownPathFor } from './agent-surfaces/http.mjs';
const runtime = process.env.READABILITY_TEST_ORIGIN;
if (!runtime || !['127.0.0.1', 'localhost'].includes(new URL(runtime).hostname)) throw new Error('Explicit loopback READABILITY_TEST_ORIGIN required');

test('actual Worker serves all 144 canonical mirrors and complete discovery', async () => {
  const registrySource = await readFile(new URL('../shared/songs.js', import.meta.url), 'utf8');
  let decorativeVariants = 0;
  const catalog = await (await fetch(`${runtime}/api/md/_catalog`)).json();
  assert.equal(catalog.length, routes.length);
  for (const route of catalog) {
    assert.equal(route.url, ORIGIN + route.path);
    const response = await fetch(runtime + markdownPathFor(route.path));
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/markdown/);
    assert.match(response.headers.get('x-robots-tag'), /noindex/);
    assert.equal(response.headers.get('access-control-allow-origin'), '*');
    assert.ok([route.url, runtime + route.path].includes(response.headers.get('content-location')));
    const body = await response.text();
    const song = SONGS[route.path.split('/')[1]];
    const menu = song?.frames.find(frame => frame.type === 'note' && frame.note === 'menu');
    if (menu && body !== pages[route.path]) {
      // Existing random-comparator sorting can select a different authored menu across JS engines.
      // Keep all stable text exact and require every differing decorative line to exist in source.
      const section = text => {
        const start = text.indexOf(`## ${menu.title}\n\n`) + menu.title.length + 5;
        const end = text.indexOf('\n\n## ', start);
        return { body: text.slice(start, end), stable: text.slice(0, start) + text.slice(end) };
      };
      const actual = section(body); const expected = section(pages[route.path]);
      assert.equal(actual.stable, expected.stable);
      for (const line of actual.body.split('\n').filter(Boolean)) assert.ok(registrySource.includes(line.replace(/^- /, '')));
      decorativeVariants++;
    } else assert.equal(body, pages[route.path]);
    for (const target of [route.path, '/api/md' + route.path]) {
      assert.equal(await (await fetch(runtime + target, { headers: { Accept: 'text/markdown' } })).text(), body);
    }
  }
  console.log(JSON.stringify({ publicRoutes: catalog.length, engineDependentDecorativeMenus: decorativeVariants }));
  for (const path of ['/', '/humble/', '/digital-love/', '/watermelon-sugar/', '/blinding-lights/']) {
    const html = await fetch(runtime + path);
    assert.equal(html.status, 200); assert.match(html.headers.get('content-type'), /text\/html/);
    assert.match(html.headers.get('vary'), /Accept/);
    const body = await html.text(); assert.ok(body.includes('name="ai-summary"')); assert.ok(body.includes(`${ORIGIN}${markdownPathFor(path)}`));
    for (const target of [path, '/api/md' + path]) {
      const response = await fetch(runtime + target, { headers: { Accept: 'text/markdown' } });
      const suffix = await fetch(runtime + markdownPathFor(path));
      assert.equal(await response.text(), await suffix.text());
    }
    const head = await fetch(runtime + path, { method: 'HEAD', headers: { Accept: 'text/markdown' } });
    assert.equal(await head.text(), ''); assert.ok(Number(head.headers.get('x-markdown-tokens')) > 0);
    for (const accept of ['text/markdown;q=0,text/html', 'text/markdown;q=0.5,text/html;q=0.5', '*/*']) assert.match((await fetch(runtime + path, { headers: { Accept: accept } })).headers.get('content-type'), /text\/html/);
  }
  for (const path of ['/api/md/private', '/missing.md', '/admin/private.md', '/AGENTS.md']) assert.equal((await fetch(runtime + path)).status, 404);
  assert.equal((await fetch(`${runtime}/api/md/humble/`, { method: 'OPTIONS' })).status, 204);
  assert.equal((await fetch(`${runtime}/tools/agent-worker.mjs`)).status, 404);
  const full = await (await fetch(`${runtime}/llms-full.txt`)).text(); assert.ok(full.length <= 500000); assert.equal((full.match(/Canonical:/g) || []).length, 50);
  const robots = await (await fetch(`${runtime}/robots.txt`)).text();
  for (const bot of ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Bytespider']) assert.ok(robots.includes(`User-agent: ${bot}\nAllow: /`));
});
