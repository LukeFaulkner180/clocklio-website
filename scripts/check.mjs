import { fullWorkspaceAnnualPence, clockxPlan } from '../public/pricing.js';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve(process.env.SITE_CHECK_DIRECTORY || 'public');
const basePath = (process.env.SITE_BASE_PATH || '').replace(/\/+$/, '');
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
    const base = new URL('https://example.test' + basePath + '/' + path.relative(root, file));
    const url = new URL(raw.replaceAll('&amp;', '&'), base);
    assert.ok(url.pathname.startsWith(basePath + '/'), file + ': local link escapes site base ' + raw);
    let target = path.join(root, decodeURIComponent(url.pathname.slice(basePath.length)));
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

for (const [size,price] of [[1,29999],[5,29999],[6,34499],[9,47999],[10,64999],[15,64999],[16,114999],[30,114999],[31,189999],[50,189999],[51,null]]) assert.equal(fullWorkspaceAnnualPence(size),price);
for (const size of [0,-1,5.5,10001,NaN]) assert.equal(fullWorkspaceAnnualPence(size),null);
console.log('Checked small-team pricing, fixed annual plan boundaries and Custom quotes.');

for (const [size,price,limit] of [[1,9999,5],[5,9999,5],[6,16999,10],[10,16999,10],[11,31999,20],[20,31999,20]]) {assert.equal(clockxPlan(size).price,price);assert.equal(clockxPlan(size).employeeLimit,limit);}
for (const size of [0,-1,5.5,21,10001,NaN]) assert.equal(clockxPlan(size),null);
console.log('Checked Clockx fixed annual tiers and custom quote boundary.');
