import { manifest, pages, routes, ORIGIN, pageMetadata } from './agent-content.mjs';
import { createAgentSurfaceHandler } from './agent-surfaces/handler.mjs';
import { markdownPathFor, wantsMarkdown, markdownResponse } from './agent-surfaces/http.mjs';
import { advertiseMarkdown } from './agent-surfaces/adapters/static-assets.mjs';

const handle = createAgentSurfaceHandler({ manifest });
const escape = text => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
export const openapi = {
  openapi: '3.1.0', info: { title: 'Every Song public Markdown', version: '1.0.0' }, servers: [{ url: ORIGIN }],
  paths: Object.fromEntries(['/api/ai', '/api/md', '/api/md/_catalog', '/api/md/{path}'].map(path => [path, {
    get: { summary: path.endsWith('_catalog') ? 'Enumerate public pages' : 'Read public website content',
      ...(path.includes('{path}') ? { parameters: [{ name: 'path', in: 'path', required: true, schema: { type: 'string' } }] } : {}),
      responses: { 200: { description: 'Public content' }, 404: { description: 'Unknown public page' } } },
  }])),
};
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    const publicPath = routes.includes(path) ? path : null;
    if (path.startsWith('/.well-known/') || (path.startsWith('/api/') && path !== '/api/ai' && !path.startsWith('/api/md'))) return env.ASSETS.fetch(request);
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      if (path === '/openapi.json') {
        const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS' };
        return new Response(request.method === 'GET' ? JSON.stringify(openapi) : null, { status: request.method === 'OPTIONS' ? 204 : 200, headers });
      }
      const response = await handle(request);
      if (response) return response;
      if (path.endsWith('.md') || (wantsMarkdown(request) && !publicPath && !/\.[a-z0-9]+$/i.test(path))) {
        const response = markdownResponse('# Not found\n\nNo public Markdown page exists at this path.\n', request, { 'Cache-Control': 'no-store' });
        return new Response(response.body, { status: 404, headers: response.headers });
      }
    }
    let response = await env.ASSETS.fetch(request);
    if (publicPath && response.ok && response.headers.get('content-type')?.includes('text/html')) {
      const summary = pageMetadata[publicPath].description;
      response = new HTMLRewriter().on('head', { element(element) {
        element.append(`<meta name="ai-summary" content="${escape(summary)}"><link rel="alternate" type="text/markdown" href="${ORIGIN}${markdownPathFor(publicPath)}">`, { html: true });
      } }).transform(response);
      response = advertiseMarkdown(response, ORIGIN, markdownPathFor(publicPath));
    }
    return request.method === 'HEAD' ? new Response(null, { status: response.status, headers: response.headers }) : response;
  },
};
