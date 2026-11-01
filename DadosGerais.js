'use strict';

(() => {
  const shared = globalThis.AegisShared;
  if (!shared) {
    const target=document.querySelector('.app-loading p') || document.querySelector('#app p');
    if(target){target.textContent='Não foi possível carregar a aplicação. Atualize a página para tentar novamente.';target.setAttribute('role','alert');}
    console.error('AEGIS: módulo compartilhado indisponível.');
    return;
  }
  const { images,imageSource,STORAGE_KEY,SESSION_KEY,icon,esc,normalize,copy,uid,now,time,dateTime,today,dateLabel,initials,validImage,defaultState,brand,demoBadge,badge,photoMarkup,avatar,empty,head,publicHeader,pageFiles,pageHref,pages,sideLinks,cameras } = shared;
  const favicon = document.getElementById('site-icon');
  if (favicon) { favicon.type = 'image/svg+xml'; favicon.href = images['./aegis-logo.png']; }
  const app = document.getElementById('app');
  const modal = document.getElementById('modal');
  const loaded = shared.loadState(()=>localStorage);
  let storageProblem = loaded.problem;
  let state = loaded.state;
  let storedSnapshot = loaded.serialized;
  let session = shared.readSession(()=>sessionStorage);
  const route = 'dashboard';
  let filters = {camera:'all',period:'today',status:'all',studentQuery:'',className:'all',studentStatus:'all',movementQuery:'',movementDate:today(),letter:'all'};
  let prbUnlocked = false;
  let lastProtocol = state.requests.at(-1)?.protocol || null;
  let passwordVisible = false;
  let menuOpen = false;
  let previousFocus = null;
  let toastTimers = new Set();

  function toast(message, error=false) {
    const item = document.createElement('div');
    item.className = `toast ${error ? 'error' : ''}`;
    item.setAttribute('role',error ? 'alert' : 'status');
    item.innerHTML = `${icon(error?'alert':'checkcircle')}<span>${esc(message)}</span><button type="button" aria-label="Fechar aviso">${icon('close')}</button>`;
    document.getElementById('toasts').append(item);
    item.querySelector('button').addEventListener('click',()=>{clearTimeout(timer);toastTimers.delete(timer);item.remove();});
    const timer = setTimeout(()=>{item.remove();toastTimers.delete(timer);},6000);
    toastTimers.add(timer);
  }
  function persist(next) {
    try {
      const saved=shared.saveState(()=>localStorage,next,storedSnapshot);
      storedSnapshot=saved.serialized;state=saved.state;storageProblem=false;return true;
    } catch(error) {
      if(['StateConflictError','StateRecoveryError'].includes(error.name)){toast(error.message,true);return false;}
      console.warn('AEGIS: falha ao salvar dados locais.');
      toast('Não foi possível salvar no navegador. Verifique o espaço disponível e a permissão de armazenamento.',true);
      return false;
    }
  }
  function audit(next,action) { next.audit.unshift({id:uid(),user:session?.institution || 'Visitante',action,at:now()}); next.audit=next.audit.slice(0,100); }
  const eventDescription = text => text === 'As configurações demonstrativas foram salvas.' ? 'As configurações foram salvas.' : text;
  function addEvent(next,title,description,type='info') { next.events.unshift({id:uid(),title,description,type,at:now()}); next.events=next.events.slice(0,100); }
  function setError(form,message) { const target=form.querySelector('.form-error'); target.textContent=message; target.setAttribute('role','alert'); }
  const tabs = () => shared.tabs(route);
  const pageParams = new URLSearchParams(location.search);
  filters.studentQuery = (pageParams.get('q') || '').slice(0, 100);
  filters.camera = pageParams.get('camera') || 'all';
  function openModal(title,content) {
    if(!modal.open)previousFocus=document.activeElement;
    modal.innerHTML=`<header class="modal-head">
        <h2 id="modal-title">${esc(title)}</h2>
        <button class="icon-button" type="button" data-action="close-modal" aria-label="Fechar janela">${icon('close')}</button>
      </header>
      <div class="modal-body">${content}</div>`;
    modal.showModal();
  }

  function setMenu(open) {
    menuOpen = open;
    shared.setMenu(open);
  }

  function closeModal(){if(modal.open)modal.close();previousFocus?.isConnected&&previousFocus.focus();}

  function renderShell(content) {
    return shared.renderShell({content, route, session, state, storageProblem, menuOpen});
  }

  function cameraName(c) { return c.name || state.students.find(s=>s.id===c.studentId)?.name || 'Cadastro não disponível'; }

  function cameraDetail(id) {
    const c=cameras.find(c=>c.id===id);if(!c)return;
    openModal('Detalhes da identificação',`${photoMarkup(c.photo,'Imagem da identificação','modal-image')}<div class="detail-spaced detail-hero">
        <div>
          <h3>${esc(cameraName(c))}</h3>
          <p>${esc(c.location)} · ${c.at}</p>
        </div>
      </div>${badge(c.status)}<div class="info-box">${icon('info')}<span>Uma identificação incerta ou não confirmada exige revisão humana.</span>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn" data-action="close-modal">Fechar</button>
        <a class="btn primary" href="Movimentacao.html">Consultar movimentação</a>
      </div>`);
  }

  function cameraCards() {
    const selected = cameras.filter(camera =>
      (filters.camera === 'all' || camera.id === filters.camera) &&
      (filters.status === 'all' || camera.status === filters.status)
    );
    if (!selected.length) return `<section class="panel">${empty('Nenhum ponto encontrado', 'Limpe os filtros para ver os pontos de acesso.', 'camera')}</section>`;
    return selected.map(camera => `<article class="panel access-card" aria-labelledby="camera-title-${camera.id}">
      <header class="access-heading"><span class="access-symbol">${icon(camera.id === 'cam04' ? 'file' : 'camera')}</span><div><h3 id="camera-title-${camera.id}">${esc(camera.location)}</h3><p>${camera.id.toUpperCase()} · Última identificação</p></div></header>
      <div class="access-meta">${badge(camera.status)}<time datetime="${camera.at}">${camera.at.slice(0,5)}</time></div>
      <button type="button" class="camera-detail" data-action="camera-detail" data-id="${camera.id}" aria-label="Ver identificação em ${esc(camera.location)}"></button>
    </article>`).join('');
  }

  function renderDashboard() {
    const recent = [...cameras].sort((a,b) => b.at.localeCompare(a.at));
    return `${head('Dados gerais', 'Visão geral dos pontos de acesso e dos registros da instituição.', '', session.institution)}
      <section aria-labelledby="access-title">
        <header class="section-heading"><h2 id="access-title">Pontos de acesso</h2><button type="button" class="btn small ghost" data-action="camera-filters" aria-label="Filtrar pontos de acesso">${icon('filter')}Filtrar${filters.status !== 'all' ? '<span class="status-dot"></span>' : ''}</button></header>
        ${filters.camera !== 'all' ? `<div class="toolbar"><label class="visually-hidden" for="camera-select">Selecionar ponto de acesso</label><select class="input" id="camera-select"><option value="all">Todos os pontos</option>${cameras.map(camera => `<option value="${camera.id}" ${filters.camera === camera.id ? 'selected' : ''}>${esc(camera.location)}</option>`).join('')}</select></div>` : ''}
        <div class="access-grid">${cameraCards()}</div>
      </section>
      <section class="dashboard-activity" aria-labelledby="activity-title">
        <header class="section-heading"><h2 id="activity-title">Atividade recente</h2><a href="Identificacoes.html">Ver todas ${icon('chevron')}</a></header>
        <div class="panel table-panel"><div class="table-scroll"><table>
          <caption class="visually-hidden">Última identificação registrada em cada ponto de acesso</caption>
          <thead><tr><th scope="col">Horário</th><th scope="col">Ponto de acesso</th><th scope="col">Identificação</th><th scope="col">Resultado</th><th scope="col"><span class="visually-hidden">Detalhes</span></th></tr></thead>
          <tbody>${recent.map(camera => `<tr><td><time datetime="${camera.at}">${camera.at}</time></td><td>${esc(camera.location)}</td><td>${esc(cameraName(camera))}</td><td>${badge(camera.status)}</td><td><button type="button" class="icon-button" data-action="camera-detail" data-id="${camera.id}" aria-label="Ver registro em ${esc(camera.location)}">${icon('chevron')}</button></td></tr>`).join('')}</tbody>
        </table></div></div>
        <p class="dashboard-note">${icon('clock')}Os horários correspondem aos últimos registros disponíveis.</p>
      </section>`;
  }
  function render(options = {}) {
    if (modal.open) closeModal();
    app.innerHTML = renderShell(renderDashboard());
    shared.enhanceTables();
    document.title = "Dados gerais · AEGIS";
    if (options.focus) document.getElementById('main')?.focus({ preventScroll: true });
  }
  function navigate(next) {
    if (route === next) { render(); return; }
    const query = new URLSearchParams();
    if (next === 'students' && filters.studentQuery) query.set('q', filters.studentQuery);
    if (next === 'dashboard' && filters.camera !== 'all') query.set('camera', filters.camera);
    location.assign(pageHref(next) + (query.size ? '?' + query.toString() : ''));
  }
  function startPage() {
    
    if (!session) { location.replace(pageHref('login')); return; }
    render();
    
  }

  document.addEventListener('submit', async event=>{
    const form=event.target;
    if(!(form instanceof HTMLFormElement))return;
    event.preventDefault();
    if(!form.reportValidity())return;
    const data=new FormData(form);
    const value=name=>String(data.get(name)||'').trim();
    try {
      if(form.id==='global-search-form'){
        const q=value('query');
        const camera=cameras.find(c=>q&&normalize(c.location).includes(normalize(q)));
        if(camera){filters.camera=camera.id;navigate('dashboard');}
        else{filters.studentQuery=q;filters.studentStatus='all';filters.className='all';navigate('students');}
        return;
      }
      if(form.id==='camera-filter-form'){filters.status=value('status');closeModal();render();return;}
    } catch { if(form.querySelector('.form-error'))setError(form,'Não foi possível concluir. Confira os dados e tente novamente.');else toast('Não foi possível concluir esta ação.',true); }
  });
  document.addEventListener('click', event=>{
    const button=event.target.closest('[data-action]');if(!button||button.disabled)return;
    const action=button.dataset.action;const id=button.dataset.id;
    switch(action){
      case 'close-modal':closeModal();break;
      case 'toggle-menu':setMenu(!menuOpen);break;
      case 'close-menu':setMenu(false);break;
      case 'profile':openModal('Instituição',`<div class="detail-hero"><span class="avatar">${esc(initials(session.institution))}</span><div><h3>${esc(session.institution)}</h3><p>Administrador</p></div></div><div class="modal-actions"><a class="btn" href="Configuracoes.html">Configurações</a><button type="button" class="btn primary" data-action="logout">${icon('logout')}Sair da plataforma</button></div>`);break;
      case 'logout':session=null;prbUnlocked=false;try{sessionStorage.removeItem(SESSION_KEY);}catch{}closeModal();navigate('login');break;
      case 'notifications':openModal('Notificações',state.events.length?`<ul class="activity-list">${state.events.slice(0,4).map(e=>`<li class="activity-row"><span class="activity-icon">${icon('bell')}</span><div class="activity-text"><strong>${esc(e.title)}</strong><p>${esc(eventDescription(e.description))}</p><p><time datetime="${esc(e.at)}">${dateTime(e.at)}</time></p></div></li>`).join('')}</ul><div class="modal-actions"><a class="btn primary" href="Eventos.html">Ver todos os eventos</a></div>`:empty('Tudo em dia','Nenhuma ação foi registrada.','bell'));break;
      case 'period':filters.period=button.dataset.value;render();break;
      case 'camera-filters':openModal('Filtrar identificações',`<form id="camera-filter-form"><div class="field"><label for="camera-status">Status da identificação</label><select id="camera-status" name="status" class="input">${[['all','Todos os status'],['confirmed','Identificado'],['uncertain','Identificação incerta'],['unknown','Não identificado']].map(([v,n])=>`<option value="${v}" ${filters.status===v?'selected':''}>${n}</option>`).join('')}</select></div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Cancelar</button><button class="btn primary" type="submit">Aplicar filtros</button></div></form>`);break;
      case 'camera-detail':cameraDetail(id);break;
    }
  });
  document.addEventListener('change', event => { if (event.target.id === 'camera-select') { filters.camera=event.target.value; render(); } });
  document.addEventListener('keydown', event=>{
    if(event.key==='Escape'&&menuOpen)setMenu(false);
    if(event.key==='Tab'&&menuOpen){
      const items=[...document.querySelectorAll('.sidebar button,.sidebar a')].filter(el=>!el.disabled&&el.getClientRects().length);const first=items[0],last=items.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
  });
  modal.addEventListener('click',event=>{if(event.target===modal){const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeModal();}});
  modal.addEventListener('close',()=>{previousFocus?.isConnected&&previousFocus.focus();});
  document.addEventListener('error', event => {
    const image = event.target;
    if (!image || image.tagName !== 'IMG') return;
    const blank = document.createElement('span');
    blank.className = `${image.className || 'image-space'} image-blank`;
    blank.setAttribute('role', 'img');
    blank.setAttribute('aria-label', 'Imagem indisponível');
    image.replaceWith(blank);
  }, true);

  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY || event.key === null) toast('Os dados mudaram em outra aba. Atualize a página para consultar a versão mais recente.');
  });
  window.addEventListener('pagehide',()=>{toastTimers.forEach(clearTimeout);toastTimers.clear();});
  window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
  startPage();
  const context=document.modelContext;
  if(context?.registerTool){
    const controller=new AbortController();
    const register=tool=>{try{Promise.resolve(context.registerTool(tool,{signal:controller.signal})).catch(()=>{});}catch{}};
    register({name:'aegis_list_students',title:'Consultar alunos AEGIS',description:'Consulta os cadastros locais já visíveis na tela Alunos. Requer uma sessão ativa.',inputSchema:{type:'object',properties:{query:{type:'string',maxLength:100}},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:input=>{if(!session)throw new Error('Entre na plataforma primeiro.');if(!input||typeof input!=='object'||(input.query!==undefined&&typeof input.query!=='string'))throw new Error('Consulta inválida.');const q=normalize(input.query||'');return {students:state.students.filter(s=>normalize(s.name+' '+s.enrollment).includes(q)).map(({name,enrollment,className,status})=>({name,enrollment,className,status}))};}});
    register({name:'aegis_open_student_creation',title:'Abrir cadastro de aluno',description:'Abre o formulário Novo aluno sem criar um registro. A conclusão exige o envio do formulário na interface.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!session)throw new Error('Entre na plataforma primeiro.');if(!input||typeof input!=='object'||Object.keys(input).length)throw new Error('Nenhum parâmetro é permitido.');if(route!=='students'){location.assign(pageHref('students')+'?novo=1');return {formOpen:false,navigating:true,created:false};}studentForm();return {formOpen:true,created:false};}});
    window.addEventListener('pagehide',()=>controller.abort(),{once:true});
  }

})();
