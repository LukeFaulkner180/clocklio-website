import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { clockxPlan, fullWorkspaceAnnualPence } from '../public/pricing.js';

const root = path.resolve(process.argv[2] || process.env.SITE_CHECK_DIRECTORY || 'public');
const money = pence => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100);
async function pages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => entry.isDirectory() ? pages(path.join(directory, entry.name)) : entry.name.endsWith('.html') ? [path.join(directory, entry.name)] : []));
  return nested.flat();
}
const files = await pages(root);
for (const file of files) {
  const html = await readFile(file, 'utf8');
  // The retired prices must never survive in copy, metadata or structured data.
  assert.doesNotMatch(html, /£\s*(?:99\.99|169\.99|319\.99)(?!\d)/, `${file}: retired Clockx price`);
}
for (const route of ['index.html', 'platform/index.html', 'pricing/index.html', 'features/index.html', 'subscriptions/index.html']) {
  const html = await readFile(path.join(root, route), 'utf8');
  for (const allowance of [5, 10, 20]) assert.ok(html.includes(money(clockxPlan(allowance).price)), `${route}: current Clockx ${allowance} price`);
}
for (const route of ['pricing/index.html', 'subscriptions/index.html']) {
  const html = await readFile(path.join(root, route), 'utf8');
  for (const allowance of [5, 15, 30, 50]) assert.ok(html.includes(money(fullWorkspaceAnnualPence(allowance))), `${route}: Full Workspace ${allowance} price`);
}
for (const route of ['index.html', 'platform/index.html', 'pricing/index.html', 'features/index.html', 'subscriptions/index.html', 'add-ons/index.html']) {
  const html = await readFile(path.join(root, route), 'utf8');
  for (const amount of [499, 235, 999]) assert.ok(html.includes(money(amount)), `${route}: current monthly add-on price`);
}
for (const route of ['index.html','platform/index.html','pricing/index.html','features/index.html','subscriptions/index.html','add-ons/index.html']) {
 const html=await readFile(path.join(root,route),'utf8');
 assert.ok(html.includes('£49.99'),`${route}: Geo annual price`);
}
console.log(`Checked all ${files.length} pages for retired prices, plus published package tiers and add-on rates.`);
