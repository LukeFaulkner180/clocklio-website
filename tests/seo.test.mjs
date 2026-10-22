import assert from 'node:assert/strict';
import test from 'node:test';
import { applySeo } from '../scripts/seo.mjs';

const sample = '<!doctype html><html lang="en"><head><title>Old title</title><meta name="description" content="Old description"><link rel="canonical" href="https://preview.example/features/"></head><body><h1>Explore DayRidge</h1></body></html>';

test('metadata consistently identifies the primary domain and escapes title text', () => {
  const result = applySeo(sample, '/features/');
  assert.match(result, /<link rel="canonical" href="https:\/\/dayridge.co.uk\/features\/">/);
  assert.match(result, /Rota, Time Tracking &amp; Staff Management Features/);
  assert.doesNotMatch(result, /preview.example/);
  const schema = JSON.parse(result.match(/type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(schema['@graph'].find(item => item['@type'] === 'WebSite').name, 'DayRidge');
  assert.equal(schema['@graph'].find(item => item['@type'] === 'WebPage').url, 'https://dayridge.co.uk/features/');
});

test('applying SEO again keeps one stable metadata and structured data block', () => {
  const first = applySeo(sample, '/features/');
  assert.equal(applySeo(first, '/features/'), first);
  assert.equal((first.match(/rel="canonical"/g) || []).length, 1);
});

test('404 pages are excluded from indexing without pointing their canonical at home', () => {
  const result = applySeo(sample, '/404.html');
  assert.match(result, /content="noindex, follow"/);
  assert.doesNotMatch(result, /rel="canonical"|application\/ld\+json/);
});
