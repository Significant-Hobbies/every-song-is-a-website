import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { manifest, pages, routes, INTRO, ORIGIN } from './agent-content.mjs';
import { SONGS, ORDER } from '../shared/songs.js';
import { markdownPathFor } from './agent-surfaces/http.mjs';
import worker from './agent-worker.mjs';

const assets = { ASSETS: { fetch: () => new Response('ordinary asset', { headers: { 'Content-Type': 'text/plain' } }) } };
test('144 public source routes preserve authored text and official media links', async () => {
  assert.equal(routes.length, 144);
  for (const entry of await readdir(new URL('../', import.meta.url), { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    try { await readFile(new URL(`../${entry.name}/index.html`, import.meta.url)); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    assert.ok(routes.includes(`/${entry.name}/`), `Public HTML route lacks renderer: ${entry.name}`);
  }
  assert.ok(pages['/'].includes(INTRO));
  for (const slug of ORDER) {
    const song = SONGS[slug]; const body = pages[`/${slug}/`];
    assert.ok(body.includes(song.title));
    assert.ok(body.includes(song.artist));
    assert.ok((await readFile(new URL(`../${slug}/index.html`, import.meta.url), 'utf8')).includes(`${ORIGIN}/${slug}/`));
    for (const frame of song.frames) {
      assert.ok(body.includes(frame.title));
      if (frame.type === 'chat') for (const row of song.chat || []) assert.ok(body.includes(row.text));
      if (frame.type === 'lyrics' && song.genius) assert.ok(body.includes(`https://genius.com/songs/${song.genius}`));
      if (frame.type === 'note') for (const text of song.menu || []) assert.ok(body.includes(text));
    }
    assert.ok(!body.includes('<iframe'));
    assert.ok(!body.includes('embed.js'));
  }
});
test('all registered public representations agree on canonical text and HTTP semantics', async () => {
  for (const path of routes) {
    const canonical = ORIGIN + path;
    const suffix = await worker.fetch(new Request(ORIGIN + markdownPathFor(path)), assets);
    assert.equal(suffix.status, 200);
    assert.equal(suffix.headers.get('Content-Location'), canonical);
    assert.match(suffix.headers.get('X-Robots-Tag'), /noindex/);
    assert.match(suffix.headers.get('Content-Type'), /text\/markdown/);
    const body = await suffix.text(); assert.equal(body, pages[path]);
    for (const url of [ORIGIN + path, ORIGIN + '/api/md' + path]) {
      const response = await worker.fetch(new Request(url, { headers: { Accept: 'text/markdown' } }), assets);
      assert.equal(await response.text(), body);
    }
    const head = await worker.fetch(new Request(canonical, { method: 'HEAD', headers: { Accept: 'text/markdown' } }), assets);
    assert.equal(await head.text(), '');
    assert.equal(head.headers.get('X-Markdown-Tokens'), suffix.headers.get('X-Markdown-Tokens'));
  }
});
test('negotiation does not reinterpret ordinary browser assets or unknown/private paths', async () => {
  for (const accept of ['text/html', '*/*', 'text/markdown;q=0,text/html', 'text/markdown;q=0.5,text/html;q=0.5']) {
    const response = await worker.fetch(new Request(ORIGIN, { headers: { Accept: accept } }), assets);
    assert.equal(await response.text(), 'ordinary asset');
  }
  for (const path of ['/missing.md', '/api/md/private', '/admin/private.md', '/AGENTS.md', '/tools/agent-worker.md']) {
    assert.equal((await worker.fetch(new Request(ORIGIN + path), assets)).status, 404);
  }
  const response = await worker.fetch(new Request(ORIGIN + '/api/md/humble/', { method: 'OPTIONS' }), assets);
  assert.equal(response.status, 204); assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
  const full = await (await worker.fetch(new Request(ORIGIN + '/llms-full.txt'), assets)).text();
  assert.ok(full.length < 500000); assert.equal((full.match(/Canonical:/g) || []).length, 50);
  const policy = await (await worker.fetch(new Request(ORIGIN + '/ai.txt'), assets)).text();
  assert.ok(policy.includes('training: allowed on public pages only'));
  assert.equal(manifest.catalog.markdown.negotiation, true);
});

test('unknown Markdown paths cannot advertise off-origin canonicals', async () => {
  const { createAgentSurfaceManifest } = await import('./agent-surfaces/manifest.mjs');
  const { createAgentSurfaceHandler } = await import('./agent-surfaces/handler.mjs');
  const fixtureOrigin = 'https://public.example';
  const manifest = createAgentSurfaceManifest({ name: 'Public fixture', url: fixtureOrigin, summary: 'Public fixture', pages: { '/': '# Public' } });
  const handler = createAgentSurfaceHandler({ manifest });
  for (const path of ['/api/md//evil.example/x', '//evil.example/x.md']) {
    const response = await handler(new Request(fixtureOrigin + path));
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('content-location'), fixtureOrigin + '//evil.example/x');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, follow');
    assert.ok(response.headers.get('link').includes(fixtureOrigin + '/llms.txt'));
  }
});
