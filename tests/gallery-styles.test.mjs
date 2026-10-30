import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const root = new URL('../', import.meta.url);
test('gallery delivers its canonical CSS inline, byte-for-byte and in cascade order', () => {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  const styles = [...html.matchAll(/<style data-gallery-source="([^"]+)">([\s\S]*?)<\/style>/g)];
  assert.deepEqual(styles.map((style) => style[1]), ['gallery.css', 'footer.css', 'gallery-footer.css']);
  for (const [, file, css] of styles) assert.equal(css, readFileSync(new URL(file, root), 'utf8'));
  assert.doesNotMatch(html, /<link rel="stylesheet" href="(?:gallery|footer|gallery-footer)\.css">/);
});
