const { chromium } = require('playwright');
const path=require('path'); const R=path.resolve(__dirname,'..','..','..');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1400,height:1000}});
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.route(/fonts\.(googleapis|gstatic)/, r=>r.abort());
const steps=(process.argv[2]||'1').split(',');
for(const s of steps){ await p.goto('file://'+R+'/'+(process.argv[3]||'oracle/instance/index.html')+'#step-'+s); await p.waitForTimeout(1500);
 await p.screenshot({path:'shot-'+s+'.png'}); }
console.log('errors',errs);
const prac=await p.$$eval('.practice a', a=>a.map(x=>x.textContent.trim()+' -> '+x.getAttribute('href')));
console.log(prac);
await b.close();})();
