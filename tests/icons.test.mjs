import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const fromPublic = name => readFileSync(new URL('../public/' + name, import.meta.url))
const pngSize = (name, size) => {
  const file = fromPublic(name)
  assert.deepEqual([...file.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], name + ' is a PNG')
  assert.equal(file.readUInt32BE(16), size, name + ' width')
  assert.equal(file.readUInt32BE(20), size, name + ' height')
  assert.equal(file[25], 6, name + ' has an alpha channel')
  return file
}

test('Google-supported, crawlable and stable root favicon files exist', () => {
  const ico = fromPublic('favicon.ico')
  assert.deepEqual([...ico.subarray(0, 6)], [0, 0, 1, 0, 1, 0])
  assert.equal(ico[6], 48)
  assert.equal(ico[7], 48)
  pngSize('favicon-48.png', 48)
  pngSize('favicon-96.png', 96)
  assert.match(fromPublic('robots.txt').toString(), /User-agent: \*/)
  assert.match(fromPublic('robots.txt').toString(), /Allow: \//)
})

test('iPhone Home Screen icon is full bleed, not double-rounded inside a white border', () => {
  const icon = pngSize('apple-touch-icon.png', 180)
  assert.deepEqual(icon, pngSize('assets/dayridge-apple-touch-icon.png', 180))
  assert.ok(icon.length > 180 * 10)
  const svg = fromPublic('assets/dayridge-app-icon.svg').toString()
  assert.match(svg, /Full bleed|rect width="512"/)
  assert.doesNotMatch(svg, /stroke="#fff" stroke-opacity=".2"/)
  assert.match(fromPublic('assets/dayridge-favicon.svg').toString(), /rounded-favicon/)
})

test('the website build publishes PNG/ICO favicon metadata on every page', () => {
  const build = readFileSync(new URL('../scripts/build.mjs', import.meta.url), 'utf8')
  for (const name of ['/favicon.ico', '/favicon-48.png', '/favicon-96.png', '/apple-touch-icon.png']) {
    assert.ok(build.includes(name), name + ' must be linked in HTML')
  }
  assert.match(build, /if \(entry\.name\.endsWith\('\.html'\)\)/)
  assert.match(build, /content\.replace\(.*<link/)
})
