"""Keep Geo Clock-in marketing and product details aligned with the release."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1];P=ROOT/'public'
BADGE='<span class="geo-new">NEW</span>'
MAP='''<div class="geo-visual" aria-label="Illustration of an allowed workplace clock-in area"><div class="geo-visual-top"><span>WORKPLACE CLOCK-IN AREA</span><span class="geo-live-dot">Location check</span></div><div class="geo-map"><div class="geo-street geo-street-a"></div><div class="geo-street geo-street-b"></div><div class="geo-area"><div class="geo-site"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 21V7l8-4 8 4v14M9 21v-5h6v5M8 8h2m4 0h2M8 12h2m4 0h2"/></svg></div><span class="geo-map-label">Your workplace</span><span class="geo-person geo-person-in">✓</span></div><span class="geo-person geo-person-out">↗</span></div><div class="geo-check-result"><span class="geo-result-icon">✓</span><div><b>At the workplace. Ready to clock in.</b><span>A fresh location check when the shift starts.</span></div></div><small>Illustrative view · Location checked only on clock-in</small></div>'''
def home():return '''<section class="geo-home wrap" id="new-geo-clockin"><div><div class="geo-kicker">'''+BADGE+'''<span>GEO CLOCK-IN ADD-ON</span></div><h2>Start the shift.<br><span class="purple">At the workplace.</span></h2><p>Give personal-phone clock-ins a workplace location check. Set your location and radius, then help prevent staff clocking in before they arrive.</p><div class="geo-package-tags"><span>Clockx</span><span>Full Workspace</span><span>No per-employee add-on fee</span></div><div class="geo-price"><strong>£4.99<small>/ business / month</small></strong><span>or <b>£49.99 per business / year</b></span></div><div class="geo-cta-row"><a class="button button-dark" href="/add-ons/#geo-clockin">Discover Geo Clock-in <span aria-hidden="true">→</span></a><a class="inline-link" href="/knowledge-base/geo-clockin/">Read the setup guide →</a></div><small class="geo-fine">Covers your agreed employee allowance. Device location accuracy varies; Manager overrides remain available.</small></div>'''+MAP+'''</section>'''
def detail():return '''<section class="geo-detail wrap" id="geo-clockin"><div><div class="geo-kicker">'''+BADGE+'''<span>GEO CLOCK-IN</span></div><h2>A workplace check.<br><span class="purple">Before the clock starts.</span></h2><p>Help keep remote clock-ins out of the working day. Employees allow a fresh location check when they clock in on their own phone.</p><div class="geo-package-tags"><span>Available with Clockx</span><span>Available with Full Workspace</span></div><div class="geo-price"><strong>£4.99<small>/ business / month</small></strong><span>or <b>£49.99 per business / year</b></span></div><ul class="geo-check-list"><li>Owner-set workplace coordinates and a 50–1,000 metre radius</li><li>Fresh location and accuracy checks before a personal-phone clock-in</li><li>Clear guidance for outside-area, blocked or inaccurate locations</li><li>Manager arrival overrides require a recorded reason</li><li>Clock-out stays available without a location check</li><li>No continuous tracking or stored raw employee coordinates</li></ul><div class="geo-cta-row"><a class="button button-dark" href="/contact/?topic=plan&amp;geo=monthly">Add Geo Clock-in →</a><a class="inline-link" href="/contact/?topic=plan&amp;geo=annual">Choose annual billing →</a></div><a class="inline-link" href="/knowledge-base/geo-clockin/">Setup and employee training →</a><p class="geo-fine">One business location. Covers everyone within the agreed employee allowance. Registered workplace kiosks retain their existing flow. Browser locations can be inaccurate or spoofed; this is an arrival check, not a guarantee of physical presence.</p></div>'''+MAP+'''</section>'''
def apply(path,fn):
 p=P/path;s=p.read_text();s=fn(s)
 if 'href="/geo-clockin.css"' not in s:s=s.replace('</head>','<link rel="stylesheet" href="/geo-clockin.css">\n</head>')
 p.write_text(s)
for path in ['index.html','platform/index.html']:
 def edit(s):
  s=re.sub(r'<section class="geo-home wrap".*?</section>','',s,flags=re.S)
  i=s.index('<section class="addons-home">');end=s.index('</section>',i)+len('</section>')
  s=s[:end]+home()+s[end:]
  s=s.replace('Annual platform.</span>', 'Annual platform.</span>')
  return s
 apply(path,edit)
def addons(s):
 s=s.replace('OPTIONAL MONTHLY ADD-ONS','OPTIONAL ADD-ONS')
 s=s.replace('Tasks and Stock Management are optional monthly tools for the full workspace. Add either or both to bring more of the day into DayRidge.','Choose the extras that fit your business. New Geo Clock-in works with Clockx and Full Workspace. Tasks and Stock Management are optional monthly tools for Full Workspace.')
 if 'href="#geo-clockin"' not in s:s=s.replace('<div class="anchor-pills">','<div class="anchor-pills"><a href="#geo-clockin">Geo Clock-in · New</a>')
 s=re.sub(r'<section class="geo-detail wrap".*?</section>','',s,flags=re.S)
 s=s.replace('<section id="tasks"',detail()+'<section id="tasks"')
 s=s.replace('Start with Tasks, Stock Management or both. Your annual core platform stays complete.','Choose Geo Clock-in with either package, or add Tasks and Stock Management to Full Workspace.')
 return s
apply('add-ons/index.html',addons)
def pricing(s):
 if 'data-geo-price-card' not in s:
  card='''<section class="wrap geo-price-card" data-geo-price-card><div><div class="geo-kicker">'''+BADGE+'''<span>GEO CLOCK-IN · BOTH PACKAGES</span></div><h2>A location check.<br>A clear business price.</h2><p>Add Geo Clock-in to Clockx or Full Workspace. £4.99 per business per month or £49.99 per business per year, covering your agreed employee allowance.</p><a class="inline-link" href="/add-ons/#geo-clockin">See how Geo Clock-in works →</a></div><div class="geo-price"><strong>£4.99<small>/ business / month</small></strong><span>or <b>£49.99 / business / year</b></span></div></section>'''
  s=s.replace('<section class="wrap full-workspace-pricing-heading">',card+'<section class="wrap full-workspace-pricing-heading">')
 if 'data-quote-geo' not in s:
  marker='</label></div></div>\n <aside class="quote-card"'
  controls='''</label><label class="quote-addon"><input type="checkbox" data-quote-geo><span class="custom-check"></span><span><b>Geo Clock-in · New</b><small>£4.99 / business / month or £49.99 / year</small></span></label><div class="geo-billing" data-geo-billing-wrap hidden><label for="geo-billing">Geo Clock-in billing</label><select id="geo-billing" data-geo-billing><option value="monthly">Monthly · £4.99 / business</option><option value="annual">Annual · £49.99 / business</option></select></div></div></div>\n <aside class="quote-card"'''
  assert marker in s;s=s.replace(marker,controls)
  s=s.replace('<div class="quote-monthly"><span>Optional extras</span>','<div class="quote-line"><span>Geo Clock-in</span><b data-quote-geo-total>Not selected</b></div><div class="quote-monthly"><span>Monthly extras</span>')
 if 'Geo Clock-in location checks' not in s:s=s.replace('</tbody></table></div>','<tr><th scope="row">Geo Clock-in location checks</th><td>Optional add-on</td><td>Optional add-on</td></tr></tbody></table></div>')
 return s
apply('pricing/index.html',pricing)
def features(s):
 if 'data-geo-feature' not in s:
  card='''<article class="feature-result" data-feature data-geo-feature data-category="addons" data-roles="owner manager employee" data-search="geo clock-in geofencing geolocation gps workplace location radius onsite clockx full workspace"><span class="feature-category">Geo Clock-in add-on · New</span><h3>Workplace location checks</h3><p>Check personal-phone clock-ins against the workplace area. Available with Clockx and Full Workspace.</p><div class="feature-result-bottom"><span>Employee · Business Owner · Manager</span><small>£4.99 / business / month or £49.99 / year</small></div><a class="inline-link" href="/add-ons/#geo-clockin">Explore Geo Clock-in →</a></article>'''
  i=s.index('<article class="feature-result"');s=s[:i]+card+s[i:]
 return s
apply('features/index.html',features)
print('Updated Geo Clock-in home, add-on, pricing and feature pages.')
