import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../shared/app-health.js', import.meta.url), 'utf8');

function boot(pathname, hostname = 'music.significanthobbies.com') {
  const elements = [];
  const listeners = new Map();
  const windowListeners = new Map();
  const sent = [];
  const tracked = [];
  function element(tag) {
    const node = { tag, dataset: {}, attributes: {}, isConnected: false, children: [],
      setAttribute(name, value) { this.attributes[name] = value; },
      append(child) { child.isConnected = this.isConnected; this.children.push(child); },
    };
    elements.push(node);
    return node;
  }
  const document = {
    visibilityState: 'visible',
    head: { append(node) { node.isConnected = true; } },
    body: { append(node) { node.isConnected = true; } },
    createElement: element,
    querySelector(tag) { return elements.find((node) => node.tag === tag) || null; },
    addEventListener(name, callback) { listeners.set(name, callback); },
  };
  const window = {
    appHealth: { track(name) { tracked.push(name); } },
    addEventListener(name, callback) { windowListeners.set(name, callback); },
  };
  const context = {
    document, window, location: { pathname, hostname }, navigator: {},
    crypto: { randomUUID: () => 'test-id' },
    fetch(url, options) { sent.push({ url, body: JSON.parse(options.body) }); return Promise.resolve(); },
  };
  runInNewContext(source, context);
  return { elements, listeners, windowListeners, sent, tracked, window, context };
}

for (const pathname of ['/', '/index.html', '/surfin-usa/', '/404.html', '/unknown-song/']) {
  test(`all-route telemetry: ${pathname}`, () => {
    const state = boot(pathname);
    assert.equal(state.elements.filter((node) => /newsletter-capture|fleet-footer-extension/.test(node.tag)).length, 0, 'footer is static markup, not injected');
    const tracker = state.elements.find((node) => node.src === 'https://health.sassmaker.com/tracker.js');
    assert.ok(tracker, 'tracker remains on every production route');
    assert.equal(tracker.dataset.identity, 'session');
    assert.equal(typeof state.window.appHealthLog, 'function');
    assert.ok(state.listeners.has('submit'));
    assert.ok(state.windowListeners.has('error'));
    assert.ok(state.windowListeners.has('unhandledrejection'));
    state.listeners.get('click')({ target: { closest(selector) { return selector.startsWith('a.door') ? {} : null; } } });
    assert.deepEqual(state.tracked, ['song_world_opened']);
    state.window.appHealthLog('capture.test');
    state.windowListeners.get('error')({ message: 'test error' });
    assert.deepEqual(state.sent.map((request) => request.body.logs[0].event), ['capture.test', 'client.error']);
    assert.equal(state.sent[1].body.logs[0].props.page, pathname);
  });
}

test('origin pin rejects tracker, capture and logs on other hosts', () => {
  const state = boot('/', 'example.test');
  assert.equal(state.elements.length, 0);
  assert.equal(state.listeners.size, 0);
  assert.equal(state.window.appHealthLog, undefined);
});
