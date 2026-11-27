const { chromium } = require('playwright'); const path=require('path'); const R=path.resolve(__dirname,'..','..','..');
(async()=>{const b=await chromium.launch(); const errs=[];
for(const base of ['','en/']){const p=await b.newPage(); p.on('pageerror',e=>errs.push(base+e.message));
 await p.route(/fonts\.(googleapis|gstatic)|gc\.zgo/, r=>r.abort());
 await p.goto('file://'+R+'/'+base+'dba/index.html'); await p.waitForTimeout(800);
 const ids=(process.argv[2]||'27').split(',').map(Number);
 const o=await p.evaluate(ids=>ids.map(id=>id+': '+Course.theoryFor(id).map(t=>t.label+' '+t.href).join(' | ')),ids);
 console.log(base||'ko'); o.forEach(x=>console.log('  '+x));
 const bad=await p.evaluate(()=>Course.THEORY.filter(x=>!Course.TITLES[x.lessons[0]]).length); console.log('  missing titles',bad);
 await p.close();}
console.log('ERR',errs); await b.close();})();
