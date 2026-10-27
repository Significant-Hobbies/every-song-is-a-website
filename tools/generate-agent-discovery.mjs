import { readFile, writeFile } from 'node:fs/promises';
import { ORDER, SONGS } from '../shared/songs.js';
import { buildMarkdownIndex, buildFullMarkdown, buildAiTxt, listMarkdownRoutes } from './agent-surfaces/documents.mjs';
const metadata = {};
for (const path of ['/', ...ORDER.map(slug => `/${slug}/`)]) {
  const html = await readFile(new URL(`..${path}index.html`, import.meta.url), 'utf8');
  const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1];
  if (!description) throw new Error(`Missing source description: ${path}`);
  metadata[path] = { description: description.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'") };
  const song = SONGS[path.split('/')[1]];
  if (song) {
    const theme = await readFile(new URL(`../themes/${song.theme}.js`, import.meta.url), 'utf8');
    metadata[path].hint = theme.match(/<p class="[^"]*hint">(.+?)<\/p>/)?.[1];
    if (metadata[path].hint?.startsWith('${')) metadata[path].hint = [...metadata[path].hint.matchAll(/'([^']+)'/g)].map(match => match[1]).join(' / ');
    if (!metadata[path].hint) throw new Error(`Missing authored theme instruction: ${song.theme}`);
  }
}
await writeFile(new URL('./page-metadata.json', import.meta.url), JSON.stringify(metadata, null, 2) + '\n');
const { manifest, ORIGIN } = await import('./agent-content.mjs');
const routes = listMarkdownRoutes(manifest);
for (const [file, body] of Object.entries({
  'llms.txt': buildMarkdownIndex(manifest, routes),
  'llms-full.txt': await buildFullMarkdown(manifest, routes, path => manifest.pages[path]),
  'ai.txt': buildAiTxt(manifest, routes),
  'robots.txt': ['*', 'GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Bytespider', 'OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User'].map(bot => `User-agent: ${bot}\nAllow: /\nDisallow: /api/\nAllow: /api/ai\nAllow: /api/md\nDisallow: /tools/\nDisallow: /404.html`).join('\n\n') + `\n\nSitemap: ${ORIGIN}/sitemap.xml\n# Keep in sync with /llms.txt and /ai.txt. Public routes share the song registry.\n`,
})) await writeFile(new URL('../'+file, import.meta.url), body);
console.log(`Generated discovery for ${routes.length} public pages`);
