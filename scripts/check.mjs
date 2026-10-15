import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve('public');
async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(file)); else files.push(file);
  }
  return files;
}
const files = (await walk(root)).filter(file => file.endsWith('.html'));
for (const file of files) {
  const html = await readFile(file, 'utf8');
  assert.equal((html.match(/<h1\b/g) || []).length, 1, file + ': one main heading');
  assert.match(html, /<meta name="description" content="[^"]+"/);
  assert.match(html, /<html lang="en"/);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size, file + ': unique IDs');
  for (const [, raw] of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
    if (/^(?:https?:|mailto:|tel:|data:)/.test(raw)) continue;
    const base = new URL('https://example.test/' + path.relative(root, file));
    const url = new URL(raw.replaceAll('&amp;', '&'), base);
    let target = path.join(root, decodeURIComponent(url.pathname));
    const metadata = await stat(target).catch(() => null);
    assert.ok(metadata, file + ': missing local link ' + raw);
    if (metadata.isDirectory()) target = path.join(target, 'index.html');
    await stat(target);
    if (url.hash && target.endsWith('.html')) {
      const targetHTML = await readFile(target, 'utf8');
      assert.ok(targetHTML.includes('id="' + decodeURIComponent(url.hash.slice(1)) + '"'), file + ': missing anchor ' + raw);
    }
  }
}
console.log('Checked ' + files.length + ' pages: headings, metadata, IDs, assets, links and anchors.');
