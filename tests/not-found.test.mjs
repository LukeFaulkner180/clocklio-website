import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const html = readFileSync(new URL('../public/404.html', import.meta.url), 'utf8')
const css = readFileSync(new URL('../public/not-found.css', import.meta.url), 'utf8')

test('Marketing 404 uses real homepage and features links with a noindex directive', () => {
  assert.match(html, /<meta name="robots" content="noindex, follow">/)
  assert.match(html, /class="dr404-main"/)
  assert.match(html, /<h1 id="dr404-title">/)
  assert.match(html, /href="\/"[^>]*>Back to homepage/)
  assert.match(html, /href="\/features\/">Explore features/)
  assert.match(html, /class="dr404-cal"/)
  assert.match(html, /rel="stylesheet" href="\/not-found\.css"/)
  assert.equal((html.match(/<h1\b/g) || []).length, 1)
})

test('Marketing 404 inherits the real site navigation, footer and mobile layout', () => {
  assert.match(html, /class="site-header"/)
  assert.match(html, /class="site-footer"/)
  assert.match(css, /\.dr404-hero/)
  assert.match(css, /\.dr404-art/)
  assert.match(css, /@media\(max-width:700px\)/)
  assert.match(css, /@media\(max-width:430px\)/)
})
