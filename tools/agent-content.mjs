import { DESC, ERAS, galleryIntro } from '../shared/gallery-copy.js';
import pageMetadata from './page-metadata.json' with { type: 'json' };
import { SONGS, ORDER, neighbors } from '../shared/songs.js';
import { photoCaptions } from '../shared/photo-captions.js';
import { createAgentSurfaceManifest } from './agent-surfaces/manifest.mjs';

export const ORIGIN = 'https://music.significanthobbies.com';
export const INTRO = galleryIntro(ORDER.length);
const link = (label, href) => `[${label.replaceAll('[', '\\[').replaceAll(']', '\\]')}](${href})`;
export function songMarkdown(song) {
  const lines = [`# ${song.title} — ${song.artist}`, `> ${pageMetadata[`/${song.slug}/`].description}`, `Canonical: ${ORIGIN}/${song.slug}/`, String(song.year), song.theme === 'kinetic' ? song.mood : null, pageMetadata[`/${song.slug}/`].hint];
  for (const frame of song.frames) {
    lines.push(`## ${frame.title}`);
    if (frame.type === 'player') lines.push(link(`${song.title} — ${song.artist} (official video)`, song.listen || `https://www.youtube.com/watch?v=${song.youtube}`));
    if (frame.type === 'lyrics') {
      if (song.genius) lines.push(link(`Read ${song.title} by ${song.artist} on Genius`, `https://genius.com/songs/${song.genius}`));
      else lines.push(...(song.lyrics || []), '· demo lyrics, written for this page ·');
    }
    if (frame.type === 'chat') lines.push(...(song.chat || []).map(row => `${row.who}: ${row.text}`));
    if (frame.type === 'spec') lines.push(...(song.spec || []).map(text => `- ${text}`));
    if (frame.type === 'note') lines.push(...(frame.note === 'menu' ? song.menu || [] : song.lyrics || []).map(text => `- ${text}`));
    if (frame.type === 'photos') lines.push(...photoCaptions(song).map(photo => `- ${photo.cap}`));
  }
  const { prev, next } = neighbors(song.slug);
  lines.push('## Explore', link('All songs', `${ORIGIN}/`), link(`Previous song: ${prev.title}`, `${ORIGIN}/${prev.slug}/`), link(`Next song: ${next.title}`, `${ORIGIN}/${next.slug}/`));
  return lines.filter(Boolean).join('\n\n') + '\n';
}
function galleryListing() {
  const lines = [];
  let previous;
  for (const slug of ORDER) {
    const song = SONGS[slug];
    const decade = Math.floor(song.year / 10);
    if (decade !== previous) lines.push(`\n## ${ERAS[decade] || `the ${decade}0s`}\n`);
    lines.push('- ' + link(`${song.title} — ${song.artist} (${song.year})`, `${ORIGIN}/${slug}/`) + ' — ' + DESC[song.theme]);
    previous = decade;
  }
  return lines.join('\n');
}
export const pages = Object.fromEntries([
  ['/', `# every song is a website\n\n> ${pageMetadata['/'].description}\n\nCanonical: ${ORIGIN}/\n\n${INTRO}\n\n## Songs\n\n${galleryListing()}\n`],
  ...ORDER.map(slug => [`/${slug}/`, songMarkdown(SONGS[slug])]),
]);
export const manifest = createAgentSurfaceManifest({
  name: 'every song is a website', url: ORIGIN,
  summary: pageMetadata['/'].description,
  contact: 'https://sarthakagrawal.dev', updatedAt: '2026-10-27', trainingAllowed: true,
  sitemap: `${ORIGIN}/sitemap.xml`, openapi: `${ORIGIN}/openapi.json`, mode: 'collection', pages,
  excludedPaths: ['/api/* except public discovery', '/tools/*', '/404.html'],
  notes: ['Lyrics remain in the official Genius embed; Markdown links to Genius without copying embedded lyrics. Interactive layout and motion preferences are local browser state and are not exported.'],
});
export const routes = Object.keys(pages);

export { pageMetadata };
