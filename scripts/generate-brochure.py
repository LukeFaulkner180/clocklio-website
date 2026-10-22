"""Create the illustrated DayRidge guide; prices share the website calculator."""
from pathlib import Path
import json, subprocess, shutil
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import simpleSplit
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF
ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {clockxPlan,fullWorkspacePlan} from './public/pricing.js'; console.log(JSON.stringify({clockx:[5,10,20].map(clockxPlan),full:[5,15,30,50].map(fullWorkspacePlan)}))"],cwd=ROOT,text=True))
for name,file in [('UI','DejaVuSans.ttf'),('Bold','DejaVuSans-Bold.ttf')]:pdfmetrics.registerFont(TTFont(name,'/usr/share/fonts/truetype/dejavu/'+file))
OUT=ROOT/'output/pdf/dayridge-product-brochure.pdf';OUT.parent.mkdir(parents=True,exist_ok=True)
W,H=A4;M=42;CW=W-84
INK='#202A3C';PURPLE='#6748DE';MUTED='#657080';PAPER='#FAF9F6';LILAC='#EEE9FC';LINE='#DDDDE6';MINT='#DDF2E9';GREEN='#28705A';ORANGE='#F8E3C7'
c=canvas.Canvas(str(OUT),pagesize=A4,pageCompression=1)
c.setTitle('DayRidge | Illustrated Product Brochure');c.setAuthor('DayRidge');c.setSubject('Clockx, Full Workspace, pricing and early access for the 2027 launch')
def text(x,y,s,size=10,color=INK,bold=False):
 c.setFillColor(HexColor(color));c.setFont('Bold' if bold else 'UI',size);c.drawString(x,y,s)
def para(x,y,s,w=CW,size=10,leading=16,color=MUTED,bold=False):
 for line in simpleSplit(s,'Bold' if bold else 'UI',size,w):text(x,y,line,size,color,bold);y-=leading
 return y

def box(x,y,w,h,fill='white',border=None,r=12):
 c.setFillColor(HexColor(fill));c.setStrokeColor(HexColor(border or fill));c.roundRect(x,y,w,h,r,stroke=bool(border),fill=1)
def line(x,y,x2,y2,color=LINE,width=.7):
 c.setStrokeColor(HexColor(color));c.setLineWidth(width);c.line(x,y,x2,y2)
def pill(x,y,s,fill=LILAC,color=PURPLE):
 width=pdfmetrics.stringWidth(s,'Bold',8)+20;box(x,y-6,width,21,fill,r=10);text(x+10,y+1,s,8,color,True)
def price(p):return '£'+format(p/100,',.2f')
def begin(n,label,title,sub):
 c.setFillColor(HexColor(PAPER));c.rect(0,0,W,H,stroke=0,fill=1)
 text(M,H-48,'Day',18,INK,True);text(M+39,H-48,'Ridge',18,PURPLE,True)
 text(W-M-133,H-44,'PRODUCT GUIDE / 2026',7.3,MUTED,True)
 line(M,43,W-M,43);text(M,27,'dayridge.co.uk   •   Coming in 2027',7.6,MUTED);text(W-M-31,27,f'{n} / 8',7.6,MUTED)
 text(M,746,label.upper(),8.5,PURPLE,True)
 y=706
 for t in title.split('\n'):text(M,y,t,31,INK,True);y-=39
 return para(M,y-2,sub,CW,10.5,17)
def end():c.showPage()
def feature(x,y,num,title,body,w=235):
 pill(x,y,num);text(x+42,y,title,11,INK,True);return para(x+42,y-22,body,w-42,9.1,14)
def note(y,title,body,fill=LILAC):
 box(M,y,CW,75,fill);text(M+18,y+51,title,11,INK,True);para(M+18,y+31,body,CW-36,9,14)
def browser(x,y,w,h,title):
 box(x+5,y-5,w,h,'#E4DFEE');box(x,y,w,h,'#FFFFFF',LINE);box(x,y+h-35,w,35,INK,r=10)
 for i in range(3):c.setFillColor(HexColor(['#A391D8','#D6CBEF','#EEE9FC'][i]));c.circle(x+16+i*11,y+h-17,2.6,fill=1,stroke=0)
 text(x+58,y+h-21,title,8,'#FFFFFF',True)
def check(x,y,yes=True):
 if yes:
  c.setStrokeColor(HexColor(GREEN));c.setLineWidth(1.6);p=c.beginPath();p.moveTo(x,y+3);p.lineTo(x+4,y);p.lineTo(x+11,y+8);c.drawPath(p)
 else:line(x,y+4,x+10,y+4,MUTED,1.2)
# 1 Cover
begin(1,'Your working day, more connected','Your team.\nYour business.\nIn good rhythm.','A practical guide to DayRidge: simpler staff management, clearer recorded hours and room to grow.')
pill(M,492,'2027 LAUNCH');text(M+126,493,'Business tester registration is open',9,MUTED)
browser(M,188,CW,270,'DAYRIDGE / A CLEARER WORKING DAY')
for i,(title,val) in enumerate([('TODAY’S SHIFTS','08'),('ON THE CLOCK','05'),('LEAVE TO REVIEW','02')]):
 x=M+17+i*160;box(x,355,149,48,LILAC);text(x+12,385,title,6.7,MUTED,True);text(x+12,363,val,17,PURPLE,True)
text(M+18,329,'Your week at a glance',12,INK,True)
for i,day in enumerate(['MON','TUE','WED','THU','FRI']):
 x=M+18+i*96;text(x+7,307,day,7,MUTED,True)
 for j in range(2):
  box(x,262-j*40,86,32,MINT if (i+j)%3 else LILAC,r=5);text(x+7,282-j*40,['Alex','Sam','Jamie'][(i+j)%3],7,INK,True);text(x+7,270-j*40,'09:00 – 17:00',6.7,MUTED)
text(M+18,203,'Illustrative product view',7,MUTED)
para(M,152,'Plan the week. Record the day. Review with confidence.',CW,13,19,INK,True)
para(M,117,'Explore Clockx, Full Workspace and optional Tasks and Stock Management add-ons. Includes example workflows and a clear price guide.',CW,10,16)
end()
# 2 Time
begin(2,'Clockx + Full Workspace','A clearer record\nof the working day.','Clock in, record breaks and review hours in one place. Employees can use My Time Clock or a registered workplace kiosk with their employee number and PIN.')
box(M,258,208,310,INK,r=24);box(M+9,268,190,288,'#FFFFFF',r=18)
text(M+26,526,'MY TIME CLOCK',8,PURPLE,True);text(M+26,495,'Good morning, Alex',11,INK,True);pill(M+26,464,'CLOCKED IN',MINT,GREEN)
text(M+26,415,'03h 15m',29,INK,True);text(M+26,393,'Paid time recorded',9,MUTED)
line(M+26,376,M+179,376);text(M+26,351,'£42.25',25,PURPLE,True);text(M+26,332,'Illustrative gross estimate',8,MUTED)
box(M+26,286,156,30,PURPLE);text(M+52,297,'Record a break',9,'#FFFFFF',True)
feature(274,551,'01','Record the real day','A rota is a plan. A clock-in records when work starts; clock-outs and breaks complete the record.',237)
feature(274,439,'02','Review and correct','Managers can review records, clock employees in or out and correct entries where needed.',237)
feature(274,327,'03','Prepare payroll hours','Review recorded hours and export a CSV for your existing payroll process.',237)
note(139,'An example you can follow','09:00–12:30 is 3h 30m elapsed. Less a 15-minute unpaid break gives 3h 15m paid. At £13/hour, the illustrative gross estimate is £42.25.',MINT)
para(M,110,'Break rules and manager corrections affect paid hours. Gross estimates exclude tax, pensions and other deductions; DayRidge does not generate payslips.',CW,8.8,14)
end()
# 3 Rota
begin(3,'Clockx + Full Workspace','Plan the week.\nKeep everyone informed.','Build a rota, check availability and publish shifts so employees can see their working week in My shifts.')
browser(M,351,CW,214,'ROTAS / WEEK VIEW')
cols=[M+18,M+113,M+208,M+303,M+398]
for i,d in enumerate(['MON 04','TUE 05','WED 06','THU 07','FRI 08']):
 text(cols[i]+4,505,d,7.5,MUTED,True)
 for j in range(2):
  fill=ORANGE if (i==3 and j==1) else MINT;box(cols[i],449-j*47,86,39,fill,r=5);text(cols[i]+7,474-j*47,['Alex','Sam'][j],7.3,INK,True);text(cols[i]+7,461-j*47,'09:00 – 17:00',6.5,MUTED)
pill(M+18,370,'PUBLISHED',MINT,GREEN);pill(M+138,370,'DRAFT',ORANGE,'#8A5A24')
text(M,311,'Leave requests, with a clear decision',16,INK,True)
for i,(title,body) in enumerate([('Request','Choose dates and review estimated hours and balance.'),('Review','Manager checks cover, balances and published shifts.'),('Decide','Keep the request status clear: approved or declined.')]):
 x=M+i*174;box(x,174,163,110,'#FFFFFF',LINE);pill(x+13,258,str(i+1));text(x+13,226,title,11,INK,True);para(x+13,207,body,137,8.5,13)
para(M,143,'Leave estimates depend on published shifts, working patterns and the configured leave year. Requests crossing the leave-year boundary should be split.',CW,8.8,14)
para(M,91,'Need cover? Full Workspace also includes Open shifts and extra-hours requests.',CW,9.4,15,PURPLE,True)
end()
# 4 Full
begin(4,'Full Workspace','More of your people\npicture, together.','Bring the core rota and time tools together with the records and workflows that support your team throughout their time with you.')
browser(M,340,CW,226,'PEOPLE / EMPLOYEE WORKSPACE')
box(M+18,441,56,56,LILAC,r=28);text(M+30,461,'AJ',20,PURPLE,True);text(M+90,478,'Alex Jones',15,INK,True);text(M+90,457,'Illustrative employee profile',8,MUTED)
for i,(title,status) in enumerate([('Onboarding','In progress'),('Company policies','Available'),('Personnel records','Access controlled')]):
 yy=408-i*23;text(M+20,yy,title,8.4,INK,True);text(M+298,yy,status,8.2,PURPLE);line(M+18,yy-8,W-M-18,yy-8)
feature(M,300,'01','Start with structure','Keep onboarding, contracts and company policies alongside employee information.',244)
feature(310,300,'02','Support the full journey','Manage sickness and return-to-work records with the wider employee record.',243)
feature(M,176,'03','Give the right access','Use wider role permissions and protected personnel files to control who can see and manage records.',244)
feature(310,176,'04','Respond to changes','Use Open shifts for cover and extra-hours requests when the working week changes.',243)
end()
# 5 Addons
begin(5,'Optional monthly add-ons','Useful extras.\nOnly when you need them.','Tasks and Stock Management are available with Full Workspace. Add the tools that fit how your business works.')
box(M,310,244,248,'#FFFFFF',LINE);box(309,310,244,248,'#FFFFFF',LINE)
text(M+17,530,'Tasks',20,INK,True);text(326,530,'Stock Management',16,INK,True)
for i,(label,status,fill) in enumerate([('Opening checks','To do',LILAC),('Restock supplies','In progress',ORANGE),('Close-down checklist','Complete',MINT)]):
 yy=478-i*42;box(M+16,yy,211,34,fill,r=6);text(M+25,yy+21,label,8.1,INK,True);text(M+25,yy+8,status,7,MUTED)
for i,(label,val) in enumerate([('Expected takings','£840'),('Actual takings','£830'),('Difference','−£10')]):
 yy=484-i*43;text(326,yy,label,8.7,MUTED);text(469,yy,val,11,PURPLE,True);line(326,yy-13,535,yy-13)
text(M+17,328,'Illustrative task board',7,MUTED);text(326,328,'Illustrative reconciliation',7,MUTED)
text(M,281,'Clear actions for the team',12,INK,True);para(M,260,'Assign instructions and deadlines. Employees use My Tasks to see their work and record completion.',244,9.1,14)
text(309,281,'Understand your stock',12,INK,True);para(309,260,'Record opening and closing counts, deliveries, adjustments and waste. Review usage and compare expected with actual takings.',244,9.1,14)
box(M,114,244,78,LILAC);text(M+15,168,'£4.99 / business / month',11,PURPLE,True);text(M+15,148,'+ £2.35 per agreed chargeable user',8.5,INK);text(M+15,130,'5 chargeable users = £16.74 / month',8.1,MUTED)
box(309,114,244,78,LILAC);text(324,168,'£9.99 / business / month',11,PURPLE,True);para(324,148,'Manual stock counts and till figures. No direct till integration in version 0.1.',214,8.2,12)
para(M,86,'Stock units must stay consistent. Recipes, portions and yields are not converted automatically.',CW,8.4,13)
end()
# 6 Matrix
begin(6,'Choose your workspace','Two packages.\nOne clear starting point.','Clockx covers everyday staff management. Full Workspace adds the wider people tools and access to optional business add-ons.')
box(M,510,CW,40,INK);text(M+16,525,'WHAT YOUR TEAM NEEDS',8,'#FFFFFF',True);text(358,525,'CLOCKX',8,'#FFFFFF',True);text(435,525,'FULL',8,'#FFFFFF',True)
rows=[('Rotas and published shifts',1,1),('Clocking, breaks and manager corrections',1,1),('Annual leave requests and approvals',1,1),('Recorded payroll hours and CSV exports',1,1),('Basic employee details',1,1),('Open shifts and extra-hours requests',0,1),('Contracts and company policies / documents',0,1),('Onboarding and protected personnel files',0,1),('Sickness and return-to-work records',0,1),('Wider role permissions',0,1)]
for i,(label,a,b) in enumerate(rows):
 yy=510-(i+1)*33;box(M,yy,CW,33,'#FFFFFF' if i%2==0 else '#F0EEF5',r=0);text(M+14,yy+12,label,8.5,INK);check(378,yy+11,a);check(451,yy+11,b)
note(79,'Optional extras for Full Workspace','Tasks and Stock Management are separate monthly add-ons. Choose either or both; they are not included in the annual package price.')
end()
# 7 Pricing
begin(7,'Transparent package guide','A plan for your\nteam size.','Annual prices are per business. Your agreed quote confirms the package, employee allowance and any monthly add-ons.')
text(M,554,'CLOCKX',10,PURPLE,True)
for i,p in enumerate(DATA['clockx']):
 x=M+i*174;box(x,437,163,96,LILAC);text(x+13,508,'Up to '+str(p['employeeLimit'])+' employees',8.5,INK,True);text(x+13,474,price(p['price']),23,PURPLE,True);text(x+13,453,'per business / year',8,MUTED)
text(M,402,'FULL WORKSPACE',10,PURPLE,True)
for i,p in enumerate(DATA['full']):
 yy=348-i*35;box(M,yy,CW,35,'#FFFFFF' if i%2==0 else '#F0EEF5',r=0);text(M+14,yy+13,p['name'],10,INK,True);text(M+165,yy+13,['1–5 employees','10–15 employees','16–30 employees','31–50 employees'][i],9,MUTED);text(M+393,yy+13,price(p['price']),11,PURPLE,True)
para(M,213,'For 6–9 employees, add £45 per year for each employee above the first five. Example: 8 employees = £434.99 per year. Fixed bands apply from 10 employees.',CW,9,14)
para(M,156,'Managers are included. A manager with an employee shift profile uses one employee slot. Extra staff above the approved allowance need platform approval.',CW,8.8,14)
para(M,104,'Over 20 employees on Clockx or over 50 on Full Workspace? Ask for a custom quote. Annual subscriptions are arranged by bank transfer or direct agreement.',CW,8.8,14)
end()
# 8 CTA
begin(8,'Coming in 2027','Help shape a better\nworking day.','We are inviting businesses to register their interest in testing DayRidge ahead of launch. Tell us about your team and how you work.')
steps=[('01','Register your business','Share your team size, the tools you need and your interest in testing.'),('02','Agree the testing plan','We will agree access, testing and feedback before you get started.'),('03','Try it with your team','Explore the relevant workflows and share practical feedback.'),('04','Choose your next step','If you continue, confirm the right package and employee allowance.')]
for i,(num,title,body) in enumerate(steps):feature(M,547-i*87,num,title,body,CW)
box(M,123,CW,91,LILAC);text(M+18,189,'10% off your annual subscription',15,PURPLE,True);para(M+18,166,'Business testers who complete the agreed testing and feedback qualify if they continue with DayRidge. Registering alone does not qualify or start a paid subscription.',CW-36,9,14)
text(M,91,'Explore the platform and register:',9,INK,True);text(M,71,'dayridge.co.uk/early-access/',11,PURPLE,True)
c.linkURL('https://dayridge.co.uk/early-access/',(M,63,350,107),relative=0,thickness=0)
end();c.save()
for name in ['dayridge-product-brochure.pdf','clocknexa-product-brochure.pdf']:shutil.copy2(OUT,ROOT/'public/downloads'/name)
shutil.copy2(OUT,OUT.parent/'DayRidge-Product-Brochure.pdf')
print(OUT)
