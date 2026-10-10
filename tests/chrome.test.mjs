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

test('real song chrome keeps studio strip out and preserves navigation and loads no hosted footer scripts', async () => {
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
    assert.equal(appended.filter((element) => element.tagName === 'script').length, 0, 'no hosted loader scripts');
    assert.equal(created.has('tag:ai-chat-footer'), false);

    const recovery = readFileSync(new URL('../404.html', import.meta.url), 'utf8');
    assert.doesNotMatch(recovery, /sassmaker\.com\/(project-strip|ai-chat-footer|newsletter-capture|feedback-launcher)/);
    assert.match(recovery, /<studio-footer\b[^>]*catalog-id="every-song-is-a-website"/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.window = previousWindow;
    globalThis.addEventListener = previousAddEventListener;
  }
});

test('gallery and recovery use the static StudioFooter, not the Precise loaders', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /sassmaker\.com\/(project-strip|ai-chat-footer|newsletter-capture|feedback-launcher)/);
  assert.match(html, /<studio-footer\b[^>]*catalog-id="every-song-is-a-website"[^>]*capture="newsletter"/);
  assert.match(html, /<script type="module" src="footer\.js"><\/script>/);
  assert.match(html, /href="footer\.css"/);
  const song = readFileSync(new URL('../digital-love/index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(song, /<studio-footer\b|project-strip\.js/, 'song worlds stay footer-free');
});

test('gallery footer art mirror preserves the approved bytes', () => {
  const artPath = new URL('../footer-art/every-song-is-a-website.webp', import.meta.url);
  const artProvenance = JSON.parse(readFileSync(new URL('../footer-art/provenance.json', import.meta.url), 'utf8'));
  assert.equal(createHash('sha256').update(readFileSync(artPath)).digest('hex'), artProvenance.publicDerivative.sha256);
});
