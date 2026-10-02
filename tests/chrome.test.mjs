import assert from 'node:assert/strict';
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

    for (const route of ['index.html', '404.html']) {
      const html = readFileSync(new URL(`../${route}`, import.meta.url), 'utf8');
      assert.doesNotMatch(html, /project-strip\.js/);
      assert.match(html, /ai-chat-footer\.js/);
    }
  } finally {
    globalThis.document = previousDocument;
    globalThis.window = previousWindow;
    globalThis.addEventListener = previousAddEventListener;
  }
});
