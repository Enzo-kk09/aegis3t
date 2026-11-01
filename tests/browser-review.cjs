const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const AxeBuilder=require('@axe-core/playwright').default;
const root=path.resolve(__dirname,'..'),out=process.env.AEGIS_ARTIFACT_DIR||path.join(require('node:os').tmpdir(),'aegis-visual-review'),base=(process.env.AEGIS_BASE_URL||'http://aegis.test:8080').replace(/\/$/,'');
const sizes=[[1440,900],[1366,768],[1280,720],[390,844],[360,640]];
(async()=>{
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--host-resolver-rules=MAP aegis.test 127.0.0.1']});
const matrix=[],a11y=[],issues=[];
try {
for(const [width,height] of sizes){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
 await context.addInitScript(()=>sessionStorage.setItem('aegis.demo.session',JSON.stringify({institution:'CIMOL'})));
 const page=await context.newPage();let errors=[],failures=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 page.on('response',r=>{if(r.status()>=400)failures.push(r.url()+':'+r.status());});
 page.on('requestfailed',r=>failures.push(r.url()+':'+r.failure()?.errorText));
 for(const file of fs.readdirSync(root).filter(x=>x.endsWith('.html')).sort()){
  errors=[];failures=[];
  await page.goto(base+'/'+file,{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  const metrics=await page.evaluate(()=>{
   const d=document.documentElement;
   const rect=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
   const a=document.querySelector('.auth-submit'),b=document.querySelector('.auth-request');
   return{width:innerWidth,height:innerHeight,scrollWidth:d.scrollWidth,scrollHeight:d.scrollHeight,h1:document.querySelectorAll('h1').length,images:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src),buttons:a&&b?{enter:rect(a),request:rect(b)}:null,
    overflow:[...document.querySelectorAll('main *, .topbar *')].filter(e=>{if(e.closest('.table-scroll')||e.classList.contains('visually-hidden'))return false;const r=e.getBoundingClientRect();return r.width>0&&(r.left<-.5||r.right>innerWidth+.5);}).slice(0,8).map(e=>e.tagName+'.'+e.className)};
  });
  const label=file.replace('.html','')+'-'+width+'x'+height;
  await page.screenshot({path:out+'/'+label+'.png'});
  assert.ok(metrics.scrollWidth<=width+1,JSON.stringify({file,width,metrics}));
  assert.equal(metrics.images.length,0,JSON.stringify({file,width,images:metrics.images}));
  assert.equal(metrics.h1,1,file+': H1');
  assert.equal(errors.length,0,JSON.stringify({file,width,errors}));
  assert.equal(failures.length,0,JSON.stringify({file,width,failures}));
  if(file==='index.html'){assert.ok(metrics.scrollHeight<=height+1,JSON.stringify({file,width,metrics}));const b=metrics.buttons;assert.equal(b.enter.width,b.request.width);assert.equal(b.enter.height,b.request.height);}
  if(width===1440||width===360){
   const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
   a11y.push({file,width,violations:result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});
  }
  matrix.push({file,width,height,...metrics,errors,failures,screenshot:label+'.png'});
 }
 await context.close();
}
fs.writeFileSync(out+'/matrix.json',JSON.stringify({matrix,a11y},null,2));
console.log(JSON.stringify({renders:matrix.length,viewports:sizes,a11yRuns:a11y.length,a11yViolations:a11y.filter(x=>x.violations.length),overflows:matrix.filter(x=>x.overflow.length).map(x=>({file:x.file,width:x.width,overflow:x.overflow}))}));
} finally { await browser.close(); }
})().catch(e=>{fs.writeFileSync(out+'/matrix-failure.txt',String(e.stack));console.error(e);process.exitCode=1;});
