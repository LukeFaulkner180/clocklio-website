import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const config = JSON.parse(await readFile(new URL('../content/site.json', import.meta.url), 'utf8'));
const metadata = JSON.parse(await readFile(new URL('../content/seo.json', import.meta.url), 'utf8'));
const origin = new URL(config.websiteURL);
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const absolute = value => new URL(value.replace(/^\//, ''), origin).href;
const tidyHead = html => html.replace(/<head\b[^>]*>[\s\S]*?<\/head>/i, head => head.replace(/^[\t ]+$/gm, '').replace(/\n{3,}/g, '\n\n'));

function setHeadTag(html, pattern, tag) {
  return html.replace(new RegExp(pattern.source + '[\\t ]*(?:\\r?\\n)?', pattern.flags), '').replace('</head>', `${tag}\n</head>`);
}

export function applySeo(html, pathname) {
  const entry = metadata[pathname];
  if (!entry) throw new Error(`Missing SEO content for ${pathname}`);
  const canonical = absolute(pathname);
  const noindex = pathname === '/404.html';
  html = setHeadTag(html, /<title\b[^>]*>[\s\S]*?<\/title>/gi, `<title>${escape(entry.title)}</title>`);
  for (const [name, value] of Object.entries({ description: entry.description, robots: noindex ? 'noindex, follow' : 'index, follow', 'twitter:card': 'summary_large_image', 'twitter:title': entry.title, 'twitter:description': entry.description, 'twitter:image': absolute('assets/dayridge-social-banner.jpg') })) {
    html = setHeadTag(html, new RegExp(`<meta\\b[^>]*\\bname=["']${name}["'][^>]*>`, 'gi'), `<meta name="${name}" content="${escape(value)}">`);
  }
  for (const [name, value] of Object.entries({ 'og:type': 'website', 'og:site_name': config.brandName, 'og:locale': 'en_GB', 'og:title': entry.title, 'og:description': entry.description, 'og:url': canonical, 'og:image': absolute('assets/dayridge-social-banner.jpg'), 'og:image:alt': 'DayRidge — rotas, time tracking and staff management' })) {
    html = setHeadTag(html, new RegExp(`<meta\\b[^>]*\\bproperty=["']${name}["'][^>]*>`, 'gi'), `<meta property="${name}" content="${escape(value)}">`);
  }
  html = html.replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>[\t ]*(?:\r?\n)?/gi, '');
  html = html.replace(/<script\b[^>]*\bid=["']dayridge-seo["'][^>]*>[\s\S]*?<\/script>[\t ]*(?:\r?\n)?/gi, '');
  if (noindex) return tidyHead(html);
  html = html.replace('</head>', `<link rel="canonical" href="${escape(canonical)}">\n</head>`);
  const graph = [
    { '@type': 'Organization', '@id': absolute('#organization'), name: config.brandName, url: origin.href, logo: absolute('assets/dayridge-logo-horizontal.svg'), sameAs: ['https://www.tiktok.com/@dayridge.app'] },
    { '@type': 'WebSite', '@id': absolute('#website'), name: config.brandName, url: origin.href, inLanguage: 'en-GB', publisher: { '@id': absolute('#organization') } },
    { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: entry.title, description: entry.description, inLanguage: 'en-GB', isPartOf: { '@id': absolute('#website') } },
  ];
  if (pathname !== '/') {
    const crumbs = [{ name: 'Home', item: origin.href }];
    if (pathname.startsWith('/help/') && pathname !== '/help/') crumbs.push({ name: 'Help centre', item: absolute('help/') });
    crumbs.push({ name: entry.label, item: canonical });
    graph.push({ '@type': 'BreadcrumbList', '@id': `${canonical}#breadcrumb`, itemListElement: crumbs.map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, ...crumb })) });
    graph[2].breadcrumb = { '@id': `${canonical}#breadcrumb` };
  }
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('<', '\\u003c');
  return tidyHead(html.replace('</head>', `<script id="dayridge-seo" type="application/ld+json">${json}</script>\n</head>`));
}

export async function prepareSeo(directory) {
  const pages = [];
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (entry.name.endsWith('.html')) {
        const relative = path.relative(directory, file).split(path.sep).join('/');
        const pathname = '/' + (relative === 'index.html' ? '' : relative.replace(/index\.html$/, ''));
        await writeFile(file, applySeo(await readFile(file, 'utf8'), pathname));
        if (pathname !== '/404.html') pages.push(absolute(pathname));
      }
    }
  }
  await walk(directory);
  pages.sort();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(url => `<url><loc>${escape(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
  await writeFile(path.join(directory, 'sitemap.xml'), xml);
  await writeFile(path.join(directory, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${absolute('sitemap.xml')}\n`);
  console.log(`Prepared SEO metadata, structured data and sitemap for ${pages.length} indexable pages.`);
}
