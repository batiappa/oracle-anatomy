const { chromium } = require('playwright');
const path=require('path'); const R=path.resolve(__dirname,'..','..','..');
(async()=>{const b=await chromium.launch(); const errs=[];
for(const key of process.argv.slice(2)){
 for(const base of ['','en/']){
  const rel=base+'oracle/'+key+'/index.html';
  const p=await b.newPage({viewport:{width:390,height:844}});
  p.on('pageerror',e=>errs.push(rel+': '+e.message)); p.on('console',m=>{if(m.type()==='error'&&!/net::|font/i.test(m.text()))errs.push(rel+': '+m.text())});
  await p.route(/fonts\.(googleapis|gstatic)|gc\.zgo/, r=>r.abort());
  await p.goto('file://'+R+'/'+rel); await p.waitForTimeout(800);
  const n=await p.evaluate(()=>LESSON.steps.length); let bad=[], prac=0, maxw=0;
  for(let i=1;i<=n;i++){ await p.evaluate(i=>{location.hash='step-'+i},i); await p.waitForTimeout(250);
    const w=await p.evaluate(()=>document.documentElement.scrollWidth); maxw=Math.max(maxw,w);
    prac+=await p.$$eval('.practice a',a=>a.length);
    const ko=await p.evaluate(()=>/[가-힣]/.test(document.querySelector('#stepCard').innerText+document.querySelector('#consoleBody').innerText+document.querySelector('#scene').textContent));
    if(base && ko) bad.push(i);}
  const outl=await p.$$eval('#outline a',a=>a.map(x=>x.getAttribute('href')).join(' '));
  console.log(rel,'steps',n,'maxScrollW',maxw,'practiceLinks',prac,'koInEn',bad.join(','),'| outline',outl);
  await p.close();}}
console.log('ERRORS',errs); await b.close();})();
