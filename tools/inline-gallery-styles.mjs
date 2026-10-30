import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const index = new URL('index.html', root);
const current = readFileSync(index, 'utf8');
let updated = current;
for (const file of ['gallery.css', 'footer.css', 'gallery-footer.css']) {
  const css = readFileSync(new URL(file, root), 'utf8');
  if (/<\/style/i.test(css)) throw new Error(`${file} cannot contain a closing style tag`);
  const name = file.replaceAll('.', '\\.');
  const pattern = new RegExp(`<link rel="stylesheet" href="${name}">|<style data-gallery-source="${name}">[\\s\\S]*?<\\/style>`, 'g');
  if ([...updated.matchAll(pattern)].length !== 1) {
    throw new Error(`Expected one gallery stylesheet slot for ${file}`);
  }
  updated = updated.replace(pattern, () => `<style data-gallery-source="${file}">${css}</style>`);
}
if (process.argv.includes('--check')) {
  if (updated !== current) {
    console.error('Gallery CSS changed. Run node tools/inline-gallery-styles.mjs.');
    process.exitCode = 1;
  }
} else if (updated !== current) {
  writeFileSync(index, updated);
}
