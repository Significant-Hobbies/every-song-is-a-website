import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { mountChrome } from '../shared/chrome.js';
import { SONGS } from '../shared/songs.js';

class ElementStub {
  constructor(tag, created) {
    this.tagName = tag;
    this.created = created;
    this.attributes = new Map();
    this.listeners = new Map();
    this.classList = { toggle() {}, contains() { return false; } };
  }

  setAttribute(name, value) { this.attributes.set(name, value); }
  addEventListener(name, callback) { this.listeners.set(name, callback); }
  querySelector(selector) {
    if (!this.created.has(`query:${selector}`)) {
      this.created.set(`query:${selector}`, new ElementStub(`query:${selector}`, this.created));
    }
    return this.created.get(`query:${selector}`);
  }
}

test('real song chrome keeps studio strip out and preserves navigation plus chat footer', async () => {
  const created = new Map();
  const appended = [];
  const queried = [];
  const previousDocument = globalThis.document;
  const previousWindow = globalThis.window;
  const previousAddEventListener = globalThis.addEventListener;
  globalThis.document = {
    createElement(tag) {
      const element = new ElementStub(tag, created);
      created.set(`tag:${tag}`, element);
      return element;
    },
    body: {
      append(element) {
        appended.push(element);
        if (element.tagName === 'script') queueMicrotask(() => element.onload?.());
      },
    },
    querySelector(selector) { queried.push(selector); return null; },
  };
  globalThis.window = {};
  globalThis.addEventListener = () => {};

  try {
    const mounted = [];
    const song = SONGS['billie-jean'];
    const result = mountChrome({
      song,
      theme: 'desktop',
      seed: 42,
      layers: { chrome: { append(element) { mounted.push(element); } } },
      artifacts: [],
      frames: [],
      setTheme() {},
      setArtifactVisible() {},
      recompose() {},
    });
    await new Promise((resolve) => setImmediate(resolve));

    assert.equal(mounted.length, 2, 'song navigation and experiment panel mount in the scene');
    assert.match(mounted[0].innerHTML ?? '', /class="chip-home"/);
    assert.match(mounted[1].innerHTML ?? '', /class="panel-head">experiment</);
    assert.ok(result.panelArtifactsEl, 'artifact controls remain available');
    assert.equal(queried.includes('portfolio-project-strip'), false);
    assert.equal(created.has('tag:portfolio-project-strip'), false);
    assert.deepEqual(
      appended.filter((element) => element.tagName === 'script').map((element) => element.src),
      ['https://sassmaker.com/ai-chat-footer.js'],
    );
    assert.equal(created.get('tag:ai-chat-footer')?.attributes.get('product-name'), 'Every Song Is a Website');

    const recovery = readFileSync(new URL('../404.html', import.meta.url), 'utf8');
    assert.doesNotMatch(recovery, /project-strip\.js/);
    assert.match(recovery, /ai-chat-footer\.js/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.window = previousWindow;
    globalThis.addEventListener = previousAddEventListener;
  }
});

test('gallery alone loads the hosted capture strip before the chat footer', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const strip = 'https://sassmaker.com/project-strip.js?v=precise-b0adaa67';
  const chat = 'https://sassmaker.com/ai-chat-footer.js?v=precise-b0adaa67';
  assert.equal(html.split(strip).length - 1, 1, 'gallery mounts one shared strip');
  assert.equal(html.split(chat).length - 1, 1, 'gallery mounts one chat footer');
  assert.ok(html.indexOf(strip) < html.indexOf(chat), 'strip loads before its capture extension');
  assert.match(html, /<fleet-footer-extension\b[^>]*data-fleet-footer-project="every-song-is-a-website"/);
  assert.match(html, /font-base="\/fonts\/fleet-footer-precise-v1\/"/);
  assert.match(html, /data-project="every-song-is-a-website" data-theme="dark" data-host-only="true"/);
  assert.match(html, /data-surface="web" data-host-only="true"/);
  assert.doesNotMatch(html, /data-capture\s*=\s*["']false["']/i, 'auto newsletter capture remains enabled');

  const recovery = readFileSync(new URL('../404.html', import.meta.url), 'utf8');
  const song = readFileSync(new URL('../digital-love/index.html', import.meta.url), 'utf8');
  for (const [name, source] of [['404', recovery], ['song', song]]) {
    assert.doesNotMatch(source, /<fleet-footer-extension\b|project-strip\.js/, `${name} stays outside the composed footer`);
  }
});

test('gallery footer mirrors preserve the approved art and font bytes', () => {
  const artPath = new URL('../footer-art/every-song-is-a-website.webp', import.meta.url);
  const artProvenance = JSON.parse(readFileSync(new URL('../footer-art/provenance.json', import.meta.url), 'utf8'));
  assert.equal(createHash('sha256').update(readFileSync(artPath)).digest('hex'), artProvenance.publicDerivative.sha256);

  const fontRoot = new URL('../fonts/fleet-footer-precise-v1/', import.meta.url);
  const fontProvenance = JSON.parse(readFileSync(new URL('provenance.json', fontRoot), 'utf8'));
  for (const font of fontProvenance.fonts) {
    const fontPath = new URL(font.asset, fontRoot);
    const licensePath = new URL(font.license, fontRoot);
    assert.equal(createHash('sha256').update(readFileSync(fontPath)).digest('hex'), font.sha256, font.asset);
    assert.ok(readFileSync(licensePath).byteLength > 0, font.license);
  }
});
