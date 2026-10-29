"""Build the public DayRidge training library from reviewed, editable content."""
from pathlib import Path
import html,json,re,math
ROOT=Path(__file__).resolve().parents[1];PUBLIC=ROOT/'public'
DATA=json.loads((ROOT/'content/knowledge-base.json').read_text());GUIDES=DATA['guides'];esc=lambda s:html.escape(str(s),quote=True)
ROLES={'all':'All roles','owner':'Business owners','manager':'Managers','employee':'Employees','leader':'Team Leaders'}
TOPICS={'all':'All topics','getting-started':'Getting started','rotas':'Rotas & schedules','clocking':'Clocking & breaks','leave':'Leave & sickness','people':'People & access','payroll':'Payroll hours','tasks':'Tasks & checklists','stock':'Stock Management'}
template=(PUBLIC/'about/index.html').read_text();HEAD=template.split('</head>')[0]
HEADER=re.search(r'<header class="site-header".*?</header>',template,re.S)[0];FOOTER=re.search(r'<footer class="site-footer".*?</footer>',template,re.S)[0]
SEO=json.loads((ROOT/'content/seo.json').read_text())
def slug(s):return re.sub('[^a-z0-9]+','-',s.lower()).strip('-')
def link(path,label,cls='kb-link'):return '<a class="'+cls+'" href="'+esc(path)+'">'+esc(label)+' <span aria-hidden="true">→</span></a>'
def note(title,text):return '<aside class="kb-note"><b>'+esc(title)+'</b><p>'+text+'</p></aside>'
def block(b):
 kind=b[0]
 if kind=='p':return '<p>'+b[1]+'</p>'
 if kind=='h':return '<h3>'+esc(b[1])+'</h3>'
 if kind=='steps':return '<ol class="kb-steps">'+''.join('<li><div>'+s+'</div></li>' for s in b[1])+'</ol>'
 if kind=='bullets':return '<ul class="kb-bullets">'+''.join('<li>'+s+'</li>' for s in b[1])+'</ul>'
 if kind=='note':return note(b[1],b[2].replace('The calendar above illustrates the colour key.','The colour key above explains the calendar indicators.'))
 if kind=='table':return '<div class="kb-table-wrap" tabindex="0" role="region" aria-label="Reference table"><table><thead><tr>'+''.join('<th scope="col">'+esc(x)+'</th>' for x in b[1])+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+esc(x)+'</td>' for x in row)+'</tr>' for row in b[2])+'</tbody></table></div>'
 if kind=='flow':return '<ol class="kb-flow">'+''.join('<li><span>0'+str(i)+'</span>'+esc(s)+'</li>' for i,s in enumerate(b[1],1))+'</ol>'
 if kind=='visual':
  return {'calendar':note('Calendar colour key','<span class="kb-key"><i class="green"></i>Shifts</span><span class="kb-key"><i class="orange"></i>Overtime</span><span class="kb-key"><i class="purple"></i>Sick / holiday</span><br/>Split colours mean more than one type on the same date. Select the date to read the details.'),'hours':note('Worked-hours example','09:00 to 17:00 = 8 elapsed hours. Less a 30-minute unpaid break = <b>7 hours 30 minutes paid</b>.'),'stock':note('Stock example','20 opening + 10 delivered - 18 closing - 2 waste = 10 sold.<br/>10 × £5.00 = £50.00 expected.<br/>£48.00 till sales - £50.00 expected = <b>£2.00 short</b>.')}[b[1]]
 raise ValueError(kind)
def page(path,title,summary,body):
 h=HEAD
 h=re.sub(r'<title>.*?</title>','<title>'+esc(title+' | DayRidge Training')+'</title>',h)
 h=h.replace('</head>','')+'\n<link rel="stylesheet" href="/knowledge-base.css">\n<script type="module" src="/knowledge-base.js"></script>\n'
 p=PUBLIC/path/'index.html';p.parent.mkdir(parents=True,exist_ok=True)
 p.write_text(h+'</head><body data-page="knowledge-base"><a class="skip-link" href="#main">Skip to content</a>'+re.sub(' aria-current="page"','',HEADER)+'<main id="main" tabindex="-1">'+body+'</main>'+FOOTER+'</body></html>\n')
 pathname='/'+path+'/'
 SEO[pathname]={'title':title+' | DayRidge Training','description':summary,'label':title}
def card(g):
 words=re.sub('<[^>]+>',' ',json.dumps(g['sections']));minutes=max(3,math.ceil(len(words.split())/190))
 search=' '.join([g['title'],g['summary'],g['keywords'],TOPICS[g['topic']],*[ROLES[r] for r in g['roles']]])
 return '<article class="kb-card" data-kb-card data-topic="'+g['topic']+'" data-roles="'+' '.join(g['roles'])+'" data-search="'+esc(search.lower())+'"><div class="kb-card-top"><span>'+TOPICS[g['topic']]+(' <span class="kb-new">NEW</span>' if g.get('new') else '')+'</span><small>'+str(minutes)+' MIN READ</small></div><h3>'+link('/knowledge-base/'+g['slug']+'/',g['title'])+'</h3><p>'+esc(g['summary'])+'</p><div class="kb-card-bottom"><span>'+esc(' · '.join(ROLES[r] for r in g['roles']))+'</span><small>'+esc(g['package'])+'</small></div></article>'
cards=''.join(card(g) for g in GUIDES)
hero='<section class="kb-hero wrap"><div><span class="eyebrow">THE DAYRIDGE KNOWLEDGE BASE</span><h1>A clearer answer.<br/><span>For your working day.</span></h1><p>Choose your role, find the tool and follow the steps. Practical training for your team, from the first published rota to the payroll handover.</p><div class="kb-hero-links">'+link('/knowledge-base/rotas/','Start with rotas')+link('/knowledge-base/employee-start/','New employee? Start here')+'</div></div><aside class="kb-handbook"><img class="kb-book-icon" src="/assets/dayridge-mark.svg" width="44" height="44" alt=""><span class="eyebrow">THE COMPLETE OWNER HANDBOOK</span><h2>Everything in one place.</h2><p>39 branded pages of setup steps, permissions, worked examples and checklists.</p><a class="button button-dark" href="/downloads/dayridge-business-owner-guide.pdf?v=20261029-geo-map" download>Download owner guide <span aria-hidden="true">↓</span></a><small>PDF · Complete business owner handbook</small></aside></section>'
filters='<section class="wrap kb-library" aria-labelledby="library-title"><div class="kb-library-heading"><div><span class="eyebrow">TRAINING THAT FITS YOUR ROLE</span><h2 id="library-title">What would you like to do?</h2></div><p>Each guide shows who it is for and which tools it uses.</p></div><div class="kb-role-row" role="group" aria-label="Choose your role">'+''.join('<button type="button" data-kb-role="'+r+'" aria-pressed="'+('true' if r=='all' else 'false')+'" disabled>'+label+'</button>' for r,label in ROLES.items())+'</div><div class="kb-search-row"><label for="kb-search">Search the training guides<input id="kb-search" type="search" data-kb-search placeholder="Try publish a rota, clocking or camera…" autocomplete="off" disabled></label><label for="kb-topic">Browse by topic<select id="kb-topic" data-kb-topic disabled>'+''.join('<option value="'+v+'">'+s+'</option>' for v,s in TOPICS.items())+'</select></label></div><p class="kb-count" data-kb-count role="status" aria-live="polite">'+str(len(GUIDES))+' training guides</p><noscript><p>All guides are available below. Search and filters work when JavaScript is enabled.</p></noscript><div class="kb-grid">'+cards+'</div><div class="kb-empty" data-kb-empty hidden><h3>No matching guides yet</h3><p>Try another role, a different topic or a shorter search.</p><button type="button" class="button button-dark" data-kb-reset>Show all guides</button></div></section>'
page('knowledge-base','Knowledge base and training guides','Step-by-step DayRidge training for Employees, Managers, Team Leaders and Business Owners. Search by topic or role and download the owner handbook.',hero+filters+'<section class="wrap kb-support"><div><span class="eyebrow">STILL NEED A HAND?</span><h2>A good question is a good start.</h2><p>Employees should ask their Manager about records, permissions and workplace rules. Owners can contact DayRidge for product and account help.</p></div>'+link('/contact/','Contact DayRidge','button button-outline')+'</section>')
for g in GUIDES:
 toc=''.join('<a href="#'+slug(s['title'])+'">'+esc(s['title'])+'</a>' for s in g['sections'])
 content=''
 for s in g['sections']:
  content+='<section class="kb-training-section" aria-labelledby="'+slug(s['title'])+'"><h2 id="'+slug(s['title'])+'">'+esc(s['title'])+'</h2><p class="kb-section-intro">'+esc(s['intro'])+'</p>'
  if s.get('where'):content+='<p class="kb-where"><b>Where to go</b> '+esc(s['where'])+'</p>'
  content+=''.join(block(b) for b in s['blocks'])+'</section>'
 roles=' · '.join(ROLES[r] for r in g['roles'])
 availability='Your package and permissions control what appears. Team Leaders use only the sections their owner grants. Employee instructions refer to their own records; management controls need the appropriate role.'
 if g['slug']=='rotas':availability+=' Open shifts and cover offers require Full Workspace. Rota planning, personal schedules and the calendar are available in both packages.'
 if g['slug']=='people-and-access':availability+=' Onboarding and protected personnel files require Full Workspace; wage and payroll reporting remain owner-only.'
 related=[x for x in GUIDES if x['slug']!=g['slug'] and (x['topic']==g['topic'] or set(x['roles'])&set(g['roles']))][:3]
 body='<div class="wrap kb-breadcrumb"><a href="/knowledge-base/">Knowledge base</a><span aria-hidden="true">/</span><span>'+TOPICS[g['topic']]+'</span></div><section class="wrap kb-article-head"><span class="eyebrow">DAYRIDGE · TRAINING GUIDE</span><h1>'+esc(g['title'])+'</h1><p>'+esc(g['summary'])+'</p><div class="kb-article-meta"><span>'+esc(roles)+'</span><span>'+esc(g['package'])+'</span></div><button type="button" class="button button-outline kb-print" data-kb-print disabled>Print / save PDF <span aria-hidden="true">↓</span></button></section><div class="wrap kb-article-layout"><article class="kb-article">'+note('Before you start',esc(availability))+content+'<section class="kb-training-section"><h2>Keep learning</h2><div class="kb-related">'+''.join(link('/knowledge-base/'+x['slug']+'/',x['title']) for x in related)+'</div>'+link('/knowledge-base/','Back to all training guides')+'</section><p class="kb-print-source">DayRidge training · dayridge.co.uk/knowledge-base/'+g['slug']+'/</p></article><aside class="kb-article-toc"><div><span class="eyebrow">IN THIS GUIDE</span>'+toc+'</div><div><span class="eyebrow">KEEP A COPY</span><p>Use Print / save PDF to keep this guide. Choose Save as PDF in your browser’s print window.</p>'+link('/downloads/dayridge-business-owner-guide.pdf?v=20261029-geo-map','Complete owner handbook')+'</div></aside></div>'
 page('knowledge-base/'+g['slug'],g['title'],g['summary'],body)

# Promote the knowledge base without breaking existing resource and help URLs.
for p in PUBLIC.rglob('*.html'):
 s=p.read_text();path='/'+p.relative_to(PUBLIC).as_posix().replace('index.html','')
 def nav(m):
  return '<a href="/knowledge-base/" class="nav-link"'+(' aria-current="page"' if path.startswith('/knowledge-base/') else '')+'>Knowledge base</a>'
 s=re.sub(r'<a href="/(?:resources|knowledge-base)/" class="nav-link"(?: aria-current="page")?>(?:Resources|Knowledge base)</a>',nav,s)
 s=s.replace('<a href="/help/">Help centre</a>','<a href="/knowledge-base/">Knowledge base</a>')
 if p==PUBLIC/'resources/index.html':
  s=s.replace('href="/help/"','href="/knowledge-base/"').replace('<h3>Help centre</h3>','<h3>Knowledge base</h3>').replace('Practical guides to the tools you already have.','Search training by role and topic, read complete workflows and download the owner handbook.')
 if p==PUBLIC/'help/index.html' and 'data-kb-legacy' not in s:
  banner='<section class="wrap resource-note" data-kb-legacy><b>Looking for complete training?</b><p>Our knowledge base brings together detailed workflows for each role, including rota planning, checklists and the downloadable owner handbook.</p>'+link('/knowledge-base/','Open the knowledge base')+'</section>'
  s=s.replace('<main id="main" tabindex="-1">','<main id="main" tabindex="-1">'+banner)
 p.write_text(s)
(ROOT/'content/seo.json').write_text(json.dumps(SEO,ensure_ascii=False,indent=2)+'\n')
print('Generated a role-based knowledge base and',len(GUIDES),'training articles.')
