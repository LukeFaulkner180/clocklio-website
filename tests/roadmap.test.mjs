import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../public/coming-soon/index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../public/roadmap.css', import.meta.url), 'utf8');
const seo = JSON.parse(readFileSync(new URL('../content/seo.json', import.meta.url), 'utf8'));
const home = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const updates = readFileSync(new URL('../public/updates/index.html', import.meta.url), 'utf8');
const nav = readFileSync(new URL('../public/main.js', import.meta.url), 'utf8');
const homeStyles = readFileSync(new URL('../public/polish.css', import.meta.url), 'utf8');
const build = readFileSync(new URL('../scripts/build.mjs', import.meta.url), 'utf8');

test('a distinct 2027 Coming Soon page has one heading and three ordered milestone dates', () => {
  assert.equal((page.match(/<h1\b/g) || []).length, 1);
  assert.equal((page.match(/class="roadmap-milestone /g) || []).length, 3);
  const dates = [...page.matchAll(/<time class="roadmap-date" datetime="([^"]+)">/g)].map(m => m[1]);
  assert.deepEqual(dates, ['2027-01', '2027-05', '2027-09']);
  assert.match(page, /DayRidge Assets/);
  assert.match(page, /Design phase/);
  assert.match(page, /Exploring ideas/);
});

test('roadmap language keeps targets distinct from confirmed releases', () => {
  assert.match(page, /Dates are targets rather than promises/);
  assert.match(page, /working name/i);
  assert.match(page, /Features subject to change/);
  assert.match(page, /No launch announced/);
  assert.match(page, /Share your idea/);
  assert.doesNotMatch(page, /Guaranteed launch|Available now|Reserve today/i);
});

test('animated illustrations are decorative, readable, and reduce motion when requested', () => {
  assert.match(css, /@keyframes design-sketch/);
  assert.match(css, /@keyframes idea-float/);
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(css, /@media\(max-width:480px\)/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(page, /aria-label="Animated design board/);
  assert.match(page, /aria-label="Animated idea illustration/);
});

test('roadmap stays out of primary navigation but remains in the footer and homepage teaser', () => {
  assert.match(nav, /sitePath\('coming-soon\/'\)/);
  assert.doesNotMatch(nav, /nav-roadmap/);
  assert.match(nav, /Coming soon · Roadmap/);
  assert.match(home, /class="home-roadmap-teaser wrap"/);
  assert.match(home, /class="button button-dark home-roadmap-cta" href="\/coming-soon\/"/);
  assert.match(homeStyles, /\.home-roadmap-teaser-inner/);
  assert.match(homeStyles, /@media\(max-width:430px\)/);
  assert.match(nav, /Explore DayRidge/);
  assert.match(home, /href="\/coming-soon\/"/);
  assert.match(updates, /href="\/coming-soon\/"/);
});

test('SEO metadata and build pipeline cover the new page and stylesheet', () => {
  assert.equal(seo['/coming-soon/'].title, 'Coming Soon | DayRidge Product Roadmap');
  assert.match(page, /https:\/\/dayridge\.co\.uk\/coming-soon\//);
  assert.match(page, /href="\/roadmap\.css"/);
  assert.match(build, /'roadmap\.css'/);
  assert.match(build, /geo-clockin\|roadmap/);
});
