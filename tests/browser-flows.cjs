const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=(process.env.AEGIS_BASE_URL||'http://aegis.test:8080').replace(/\/$/,''),out=process.env.AEGIS_ARTIFACT_DIR||require('node:path').join(require('node:os').tmpdir(),'aegis-visual-review');
fs.mkdirSync(out,{recursive:true});
const results=[];
async function check(name,fn){await fn();results.push(name);}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--host-resolver-rules=MAP aegis.test 127.0.0.1']});
 try{
 for(const [width,height] of [[1366,768],[360,640]]){
  const context=await browser.newContext({viewport:{width,height},acceptDownloads:true,hasTouch:width<600});
  const page=await context.newPage();const tag=width+'x'+height;
  const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('aegis.frontend.v1')));
  const go=file=>page.goto(base+'/'+file,{waitUntil:'networkidle'});
  await check(tag+' login: validação, senha e demonstração',async()=>{
   await go('index.html');await page.locator('.auth-submit').click();
   assert.equal(await page.locator('#institution').evaluate(e=>e.validity.valueMissing),true);
   await page.locator('#institution').fill('CIMOL');await page.locator('#password').fill('incorreta');await page.locator('.auth-submit').click();
   assert.match(await page.locator('#login-error').innerText(),/Senha incorreta/);
   assert.equal(await page.locator('#password').getAttribute('aria-invalid'),'true');
   await page.screenshot({path:out+'/login-error-'+tag+'.png'});
   await page.locator('[data-action=toggle-password]').click();assert.equal(await page.locator('#password').getAttribute('type'),'text');
   await page.locator('[data-action=open-credentials]').click();assert.equal(await page.locator('#modal').evaluate(e=>e.open),true);
   await page.keyboard.press('Escape');assert.equal(await page.locator('[data-action=open-credentials]').evaluate(e=>e===document.activeElement),true);
   await page.locator('[data-action=open-credentials]').click();await page.locator('[data-action=demo-login]').click();await page.waitForURL('**/DadosGerais.html');
  });
  for(const file of ['DadosGerais.html','Identificacoes.html','Movimentacao.html','Alunos.html','Relatorio.html','Eventos.html','PRB.html','Configuracoes.html','Suporte.html','DeveloperTest.html']){
   await check(tag+' menu: '+file,async()=>{
    await go(file);const trigger=page.locator('.mobile-menu');
    assert.equal(await trigger.evaluate(e=>Boolean(e.compareDocumentPosition(document.querySelector('.topbar-brand .brand'))&Node.DOCUMENT_POSITION_FOLLOWING)),true);
    assert.equal(await page.locator('#sidebar').evaluate(e=>e.inert),true);
    if(width<600)await trigger.tap();else await trigger.click();await page.waitForFunction(()=>Math.abs(document.querySelector('#sidebar').getBoundingClientRect().left)<1);
    assert.equal(await trigger.getAttribute('aria-expanded'),'true');
    assert.equal(await page.locator('#sidebar').getAttribute('aria-modal'),'true');
    assert.equal(await page.locator('.workspace').evaluate(e=>e.inert),true);
    assert.equal(await page.locator('#sidebar').evaluate(e=>e.contains(document.activeElement)),true);
    await page.locator('.drawer-heading .brand').focus();await page.keyboard.press('Shift+Tab');
    assert.equal(await page.locator('.drawer-footer a').evaluate(e=>e===document.activeElement),true);
    await page.keyboard.press('Tab');assert.equal(await page.locator('.drawer-heading .brand').evaluate(e=>e===document.activeElement),true);
    await page.locator('.sidebar-close').focus();await page.keyboard.press('Tab');assert.equal(await page.locator('#global-search-form input').evaluate(e=>e===document.activeElement),true);
    if(file==='DadosGerais.html')await page.screenshot({path:out+'/menu-'+tag+'.png'});
    await page.keyboard.press('Escape');assert.equal(await trigger.getAttribute('aria-expanded'),'false');
    assert.equal(await trigger.evaluate(e=>e===document.activeElement),true);
    assert.equal(await page.locator('.workspace').evaluate(e=>e.inert),false);
   });
  }
  await check(tag+' tabelas: rolagem interna sem ampliar a página',async()=>{
   await go('DadosGerais.html');const region=page.locator('.table-scroll').first();
   const dimensions=await region.evaluate(e=>({client:e.clientWidth,scroll:e.scrollWidth}));
   if(width<600){assert.ok(dimensions.scroll>dimensions.client);await region.evaluate(e=>{e.scrollLeft=e.scrollWidth;});assert.ok(await region.evaluate(e=>e.scrollLeft>0));}
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  });
  await check(tag+' busca no menu e lista vazia',async()=>{
   await page.locator('.mobile-menu').click();await page.locator('#global-search-form input').fill('Sem aluno de teste');
   await page.locator('#global-search-form input').press('Enter');await page.waitForURL('**/Alunos.html?q=*');
   await page.locator('.empty-state').waitFor();assert.match(await page.locator('.empty-state').innerText(),/Nenhum/);
  });
  await check(tag+' alunos: cadastro, erro, edição, persistência e exclusão',async()=>{
   await go('Alunos.html');await page.locator('[data-action=new-student]').click();
   await page.locator('#student-name').fill('Aluno Revisão Visual');await page.locator('#student-enrollment').fill('QA2026');await page.locator('#student-class-name').fill('INFO QA');
   await page.locator('#student-form button[type=submit]').click();await page.locator('#modal').waitFor({state:'hidden'});
   assert.equal((await state()).students.some(s=>s.enrollment==='QA2026'),true);
   await page.reload({waitUntil:'networkidle'});const row=page.locator('tbody tr').filter({hasText:'Aluno Revisão Visual'});await row.waitFor();
   await page.locator('[data-action=new-student]').click();
   await page.locator('#student-name').fill('Aluno Duplicado');await page.locator('#student-enrollment').fill('QA2026');await page.locator('#student-class-name').fill('INFO QA');
   await page.locator('#student-form button[type=submit]').click();assert.match(await page.locator('#student-form .form-error').innerText(),/já está cadastrada/);
   assert.equal(await page.locator('#student-form .form-error').getAttribute('role'),'alert');
   await page.locator('#modal [data-action=close-modal]').first().click();
   await row.locator('[data-action=edit-student]').click();await page.locator('#student-name').fill('Aluno Revisão Atualizado');
   await page.locator('#student-form button[type=submit]').click();await page.locator('#modal').waitFor({state:'hidden'});
   await page.reload({waitUntil:'networkidle'});const updated=page.locator('tbody tr').filter({hasText:'Aluno Revisão Atualizado'});await updated.waitFor();
   await updated.locator('[data-action=delete-student]').click();await page.locator('[data-action=confirm-delete]').click();
   await page.locator('#modal').waitFor({state:'hidden'});await page.reload({waitUntil:'networkidle'});
   assert.equal((await state()).students.some(s=>s.enrollment==='QA2026'),false);
  });
  await check(tag+' movimentação: salvar e recuperar observação',async()=>{
   await go('Movimentacao.html');await page.locator('.note-area textarea').first().fill('Observação de revisão visual.');
   await page.locator('.note-area button[type=submit]').first().click();await page.reload({waitUntil:'networkidle'});
   assert.equal(await page.locator('.note-area textarea').first().inputValue(),'Observação de revisão visual.');
  });
  await check(tag+' PRB: código incorreto, acesso e encerramento',async()=>{
   await go('PRB.html');await page.locator('#prb-code').fill('000000');await page.locator('#prb-form button[type=submit]').click();
   assert.ok((await page.locator('#prb-form .form-error').innerText()).length>0);
   await page.locator('#prb-code').fill('123456');await page.locator('#prb-form button[type=submit]').click();
   await page.locator('#prb-records-title').waitFor();await page.locator('[data-action=lock-prb]').click();await page.locator('#prb-form').waitFor();
  });
  await check(tag+' configurações: preferências e consulta persistidas',async()=>{
   await go('Configuracoes.html');await page.locator('#threshold').evaluate(e=>{e.value='85';e.dispatchEvent(new Event('input',{bubbles:true}));});
   await page.locator('#settings-form button[type=submit]').click();await page.reload({waitUntil:'networkidle'});
   assert.equal(await page.locator('#threshold').inputValue(),'85');
   await page.locator('#consult-days').selectOption('7');await page.locator('#consult-reason').fill('Consulta para validação visual.');
   await page.locator('#consult-form button[type=submit]').click();assert.equal((await state()).settings.consultaDays,'7');
  });
  await check(tag+' suporte: registro e leitura após recarregar',async()=>{
   await go('Suporte.html');await page.locator('#help-need').fill('Solicitação para revisão visual do site.');
   await page.locator('#help-form button[type=submit]').click();await page.reload({waitUntil:'networkidle'});
   assert.equal((await state()).tickets.length,1);assert.match(await page.locator('.ticket-row').innerText(),/revisão visual/);
  });
  await check(tag+' solicitação de acesso: validação, protocolo e persistência',async()=>{
   await go('SolicitarAcesso.html');await page.locator('#request-form button[type=submit]').click();
   assert.equal(await page.locator('#request-name').evaluate(e=>e.validity.valueMissing),true);
   await page.locator('#request-name').fill('Pessoa de Teste');await page.locator('#request-email').fill('teste@example.com');
   await page.locator('#request-institution').fill('CIMOL');await page.locator('#request-role').selectOption({label:'Coordenação'});
   await page.locator('#request-reason').fill('Solicitação para validar a apresentação do sistema.');
   await page.locator('[name=consent]').check();await page.locator('#request-form button[type=submit]').click();
   await page.locator('.request-status[data-status=registered]').waitFor();
   assert.equal(await page.locator('.request-status').evaluate(e=>e===document.activeElement),true);
   await page.locator('.toasts .toast').waitFor({state:'detached'});
   await page.evaluate(()=>window.scrollTo(0,0));
   await page.screenshot({path:out+'/request-success-'+tag+'.png'});
   await page.reload({waitUntil:'networkidle'});assert.match(await page.locator('.protocol').innerText(),/AEGIS-/);
   assert.equal((await state()).requests.length,1);
  });
  if(width===1366)await check(tag+' exportação CSV',async()=>{
   await go('Relatorio.html');const [download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-action=export-report]').click()]);
   assert.ok(download.suggestedFilename().endsWith('.csv'));
  });
  await context.close();
 }
 await check('instituição com 80 caracteres: cabeçalho e menu no celular',async()=>{
  const context=await browser.newContext({viewport:{width:360,height:640}});
  await context.addInitScript(()=>sessionStorage.setItem('aegis.demo.session',JSON.stringify({institution:'I'.repeat(80)})));
  const page=await context.newPage();await page.goto(base+'/DadosGerais.html',{waitUntil:'networkidle'});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('.mobile-menu').click();assert.ok(await page.locator('#sidebar').evaluate(e=>e.scrollWidth<=e.clientWidth));
  await context.close();
 });
 await check('200% equivalente: viewport CSS 683x384, escala 2 e conteúdo acessível',async()=>{
  const context=await browser.newContext({viewport:{width:683,height:384},deviceScaleFactor:2});
  const page=await context.newPage();await page.goto(base+'/index.html',{waitUntil:'networkidle'});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#institution').fill('CIMOL');await page.locator('#password').fill('erro');await page.locator('.auth-submit').click();
  await page.locator('.auth-request').scrollIntoViewIfNeeded();
  assert.ok(await page.locator('.auth-request').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}));
  await page.screenshot({path:out+'/login-200-percent.png',fullPage:true});await context.close();
 });
 await check('teclado virtual equivalente: viewport reduzido e botão alcançável',async()=>{
  const context=await browser.newContext({viewport:{width:390,height:420}});
  const page=await context.newPage();await page.goto(base+'/index.html',{waitUntil:'networkidle'});await page.locator('#password').focus();
  await page.locator('.auth-submit').scrollIntoViewIfNeeded();assert.ok(await page.locator('.auth-submit').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight));
  await context.close();
 });
 await check('movimento reduzido: menu sem deslocamento animado',async()=>{
  const context=await browser.newContext({viewport:{width:360,height:640},reducedMotion:'reduce'});
  await context.addInitScript(()=>sessionStorage.setItem('aegis.demo.session',JSON.stringify({institution:'CIMOL'})));
  const page=await context.newPage();await page.goto(base+'/DadosGerais.html',{waitUntil:'networkidle'});await page.locator('.mobile-menu').click();
  assert.ok(await page.locator('#sidebar').evaluate(e=>getComputedStyle(e).transitionDuration.split(',').every(v=>parseFloat(v)<=.00001)));
  await page.keyboard.press('Escape');await context.close();
 });
 }finally{await browser.close();fs.writeFileSync(out+'/flows.json',JSON.stringify({passed:results.length,results},null,2));}
 console.log(JSON.stringify({passed:results.length,results}));
})().catch(e=>{fs.writeFileSync(out+'/flow-failure.txt',String(e.stack));console.error(e);process.exitCode=1;});
