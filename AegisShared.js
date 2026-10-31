'use strict';

(() => {
  const images = bundledImages();
  const imageSource = value => images[value] || value;
  const STORAGE_KEY = 'aegis.frontend.v1';
  const SESSION_KEY = 'aegis.demo.session';
  const paths = {
    grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    shield:'<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    users:'<path d="M3 21v-3a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5v3m2-8a4 4 0 0 1 4 4v3"/><circle cx="9.5" cy="6" r="3.5"/><path d="M17 3a3 3 0 0 1 0 6"/>',
    user:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-3a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v3"/>',
    chart:'<path d="M4 3v17h17M7 14l4-5 4 3 5-8"/>',
    activity:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0v6l-2 3h16l-2-3Zm-8 13h4"/>',
    file:'<path d="M14 2H5a1 1 0 0 0-1 1v18a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V8Zm0 0v6h6M8 12h8M8 16h8"/>',
    camera:'<path d="M3 7h4l2-3h6l2 3h4v13H3Z"/><circle cx="12" cy="13" r="4"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 8a2.5 2.5 0 1 1 4 2c-1.5 1-1.5 1.5-1.5 3m0 3h.01"/>',
    settings:'<path d="m9 3-.7 2.4-2.4.9-2.2-.8-2 3.5 1.7 1.7v2.7L1.7 15l2 3.5 2.2-.8 2.4.9L9 21h4l.7-2.4 2.4-.9 2.2.8 2-3.5-1.7-1.7v-2.7L20.3 9l-2-3.5-2.2.8-2.4-.9L13 3Z"/><circle cx="11" cy="12" r="3"/>',
    check:'<path d="m5 12 4 4L20 5"/>',
    checkcircle:'<circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/>',
    alert:'<path d="M12 3 2 21h20ZM12 9v5m0 3h.01"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
    cloud:'<path d="M7 19a5 5 0 0 1-1-10 7 7 0 0 1 13-1 5.5 5.5 0 0 1 0 11Z"/>',
    chevron:'<path d="m9 5 7 7-7 7"/>',
    down:'<path d="m6 9 6 6 6-6"/>',
    move:'<path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4"/>',
    filter:'<path d="M3 4h18l-7 8v7l-4 2v-9Z"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff:'<path d="m3 3 18 18M10 5c6-1 12 7 12 7l-3 4M6 6c-3 2-4 6-4 6s4 7 10 7a12 12 0 0 0 5-1M10 10a3 3 0 0 0 4 4"/>',
    edit:'<path d="m15 4 5 5M4 20l5-1L21 7l-4-4L5 15ZM13 21h8"/>',
    trash:'<path d="M3 6h18M8 6V3h8v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
    lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3"/>',
    logout:'<path d="M9 3H4v18h5m5-14 5 5-5 5m-7-5h12"/>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    save:'<path d="M4 3h13l3 3v15H4ZM8 3v6h8V3M8 21v-7h8v7"/>',
    server:'<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01m4-11h6m-6 11h6"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6m10-6v6M3 10h18"/>',
    refresh:'<path d="M20 7a9 9 0 1 0 1 9M20 2v6h-6"/>',
    message:'<path d="M3 3h18v14H8l-5 4ZM7 7h10M7 11h7"/>',
    print:'<path d="M6 9V3h12v6M6 17H3V9h18v8h-3M6 14h12v7H6Z"/>',
    back:'<path d="m14 5-7 7 7 7m-7-7h14"/>'
  };
  const icon = (name, cls='') => `<svg class="icon ${cls}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${Object.hasOwn(paths,name) ? paths[name] : paths.info}</svg>`;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const copy = value => JSON.parse(JSON.stringify(value));
  const uid = () => globalThis.crypto?.randomUUID?.() || `aegis-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const now = () => new Date().toISOString();
  const clockFormat = new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'});
  const timestampFormat = new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'});
  const calendarFormat = new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo'});
  const labelFormat = new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric',timeZone:'America/Sao_Paulo'});
  const time = value => clockFormat.format(value ? new Date(value) : new Date());
  const dateTime = value => timestampFormat.format(new Date(value));
  const today = (value = new Date()) => calendarFormat.format(value);
  const dateLabel = value => {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return 'Data inválida';
    const date=new Date(value+'T12:00:00-03:00');
    if(!Number.isFinite(date.getTime())||calendarFormat.format(date)!==value)return 'Data inválida';
    return labelFormat.format(date);
  };
  const initials = name => name.split(/\s+/).filter(Boolean).slice(0,2).map(n=>n[0]).join('').toUpperCase();
  const validImage = value => /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(imageSource(value) || '');
  const seedStudents = [
    {id:'s1',name:'Roberto Almeida',enrollment:'2026001',className:'INFO 62',email:'',status:'active',photo:'./assets/roberto.png',last:'12:58'},
    {id:'s2',name:'Laura Braga',enrollment:'2026002',className:'INFO 62',email:'',status:'active',photo:'./assets/laura.png',last:'12:41'},
    {id:'s3',name:'Gabriel Pereira',enrollment:'2026003',className:'INFO 63',email:'',status:'active',photo:'./assets/gabriel.png',last:'13:50'},
    {id:'s4',name:'Augusto Barbosa',enrollment:'2026004',className:'INFO 62',email:'',status:'active',photo:'',last:'12:42'},
    {id:'s5',name:'Arthur Ribeiro',enrollment:'2026005',className:'INFO 63',email:'',status:'active',photo:'',last:'13:51'},
    {id:'s6',name:'Alan Zimmer',enrollment:'2026006',className:'INFO 62',email:'',status:'active',photo:'',last:'12:48'},
    {id:'s7',name:'Pedro Klein',enrollment:'2026007',className:'INFO 63',email:'',status:'inactive',photo:'',last:'—'},
    {id:'s8',name:'Julia Santos',enrollment:'2026008',className:'INFO 63',email:'',status:'inactive',photo:'',last:'—'}
  ];
  const defaultState = () => ({version:1,students:copy(seedStudents),notes:{},requests:[],tickets:[],events:[],audit:[],settings:{recognition:true,threshold:80,uncertainAlert:true,humanReview:true,twoFactor:true,role:'Administrador',consultaDays:'1'},lastUpdated:now()});
  const pageFiles = {
    "login": "index.html",
    "request": "SolicitarAcesso.html",
    "privacy": "Privacidade.html",
    "dashboard": "DadosGerais.html",
    "movement": "Movimentacao.html",
    "prb": "PRB.html",
    "report": "Relatorio.html",
    "identifications": "Identificacoes.html",
    "events": "Eventos.html",
    "students": "Alunos.html",
    "help": "Suporte.html",
    "settings": "Configuracoes.html"
};
  const pageHref = name => Object.hasOwn(pageFiles,name) ? pageFiles[name] : pageFiles.login;
  const pages = {
    "dashboard": [
        "Dados gerais",
        "Acompanhe as identificações e os pontos de acesso da instituição."
    ],
    "movement": [
        "Movimentação dos alunos",
        "Consulte entradas, saídas e observações administrativas."
    ],
    "prb": [
        "Área PRB",
        "Consulta restrita a pessoas autorizadas."
    ],
    "report": [
        "Relatório geral",
        "Uma visão consolidada das identificações e do sistema."
    ],
    "identifications": [
        "Identificações",
        "Consulte os registros e acompanhe a atividade ao longo do dia."
    ],
    "events": [
        "Eventos",
        "Registro das ações realizadas na plataforma."
    ],
    "students": [
        "Alunos",
        "Gerencie os cadastros e as turmas da instituição."
    ],
    "help": [
        "Ajuda e suporte",
        "Encontre orientações ou registre uma solicitação."
    ],
    "settings": [
        "Configurações",
        "Gerencie as preferências da instituição."
    ]
};
  const sideLinks = [["dashboard","grid","Dados gerais"],["identifications","scan","Identificações"],["events","activity","Eventos"],["students","users","Alunos"]];
  paths.scan = "<path d=\"M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5\"/><circle cx=\"12\" cy=\"9\" r=\"3\"/><path d=\"M7 18v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2\"/>";
  const cameras = [
    {
        "id": "cam01",
        "location": "Entrada principal",
        "studentId": null,
        "name": "Pessoa desconhecida",
        "photo": "./assets/desconhecido.png",
        "status": "unknown",
        "at": "12:43:39"
    },
    {
        "id": "cam02",
        "location": "Corredor B",
        "studentId": "s1",
        "photo": "./assets/roberto.png",
        "status": "confirmed",
        "at": "12:58:04"
    },
    {
        "id": "cam03",
        "location": "Corredor 2C",
        "studentId": "s2",
        "photo": "./assets/laura.png",
        "status": "confirmed",
        "at": "12:41:59"
    },
    {
        "id": "cam04",
        "location": "Biblioteca",
        "studentId": "s3",
        "photo": "./assets/gabriel.png",
        "status": "uncertain",
        "at": "13:50:47"
    }
];
  const brand = (destination = 'dashboard') => `<a class="brand" href="${pageHref(destination)}" aria-label="AEGIS · Página inicial"><img class="brand-logo" src="./assets/aegis-logo.png" width="288" height="88" alt="AEGIS"></a>`;
  const demoBadge = () => `<span class="badge blue">${icon('info')}Ambiente de demonstração</span>`;
  const badge = (status) => ({confirmed:`<span class="badge success">${icon('checkcircle')}Identificado</span>`,uncertain:`<span class="badge warning">${icon('help')}Identificação incerta</span>`,unknown:`<span class="badge danger">${icon('alert')}Não identificado</span>`,active:`<span class="badge success">${icon('checkcircle')}Ativo</span>`,inactive:`<span class="badge">${icon('user')}Inativo</span>`}[status] || '');
  const photoMarkup = (src, alt, cls='') => validImage(src)
    ? `<img class="${cls}" src="${esc(imageSource(src))}" alt="${esc(alt)}">`
    : `<span class="${cls} image-blank" role="img" aria-label="${esc(alt)}: espaço reservado"></span>`;
  const avatar = (student) => validImage(student.photo) ? `<img class="avatar" src="${esc(imageSource(student.photo))}" alt="Foto de ${esc(student.name)}">` : `<span class="avatar" role="img" aria-label="Iniciais de ${esc(student.name)}">${esc(initials(student.name))}</span>`;
  const empty = (title,text,type='search') => `<div class="empty-state"><div class="empty-icon">${icon(type)}</div><h2>${esc(title)}</h2><p>${esc(text)}</p></div>`;
  const head = (title,subtitle='',extra='',label='') => `<header class="page-heading"><div>${label?`<span class="eyebrow">${esc(label)}</span>`:''}<h1 id="page-title">${esc(title)}</h1>${subtitle?`<p>${esc(subtitle)}</p>`:''}</div><div class="heading-side">${extra}</div></header>`;
  const tabs = route => route === 'prb' ? `<nav class="breadcrumb" aria-label="Localização"><a href="${pageHref('dashboard')}">Dados gerais</a>${icon('chevron')}<span aria-current="page">Área PRB</span></nav>` : '';
  const primaryLinks = [['dashboard','grid','Dados gerais'],['identifications','scan','Identificações'],['movement','move','Movimentação'],['students','users','Alunos'],['report','chart','Relatórios']];
  const secondaryLinks = [['events','activity','Eventos'],['prb','shield','Área PRB'],['settings','settings','Configurações'],['help','help','Ajuda e suporte'],['developer','code','Laboratório']];
  paths.code = '<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18"/>';
  paths.building = '<path d="M4 21V7l8-4v18M12 10h8v11M2 21h20M7 9h2m-2 4h2m-2 4h2m6-4h2m-2 4h2"/>';
  const navigationLink = ([name, type, label], route) => `<a class="nav-item ${route === name ? 'active' : ''}" href="${name === 'developer' ? 'DeveloperTest.html' : pageHref(name)}" ${route === name ? 'aria-current="page"' : ''}>${icon(type)}<span>${label}</span></a>`;
  function renderShell({content, route, session, state, storageProblem = false, menuOpen = false}) {
    return `<div class="app-shell">
      <button type="button" class="sidebar-scrim ${menuOpen ? 'visible' : ''}" data-action="close-menu" aria-label="Fechar menu"></button>
      <aside class="sidebar ${menuOpen ? 'open' : ''}" id="sidebar" aria-label="Menu da instituição" ${menuOpen ? 'role="dialog" aria-modal="true"' : 'inert'}>
        <header class="drawer-heading">${brand()}<button type="button" class="icon-button sidebar-close" data-action="close-menu" aria-label="Fechar menu">${icon('close')}</button></header>
        <form id="global-search-form" class="search-input" role="search" aria-label="Busca geral">${icon('search')}<input class="input" type="search" name="query" aria-label="Buscar alunos ou câmeras" placeholder="Buscar aluno ou câmera" maxlength="100"></form>
        <nav class="side-nav" aria-label="Todas as páginas">${primaryLinks.map(link => navigationLink(link, route)).join('')}</nav>
        <p class="nav-section">Instituição</p>
        <nav class="side-nav" aria-label="Administração">${secondaryLinks.map(link => navigationLink(link, route)).join('')}</nav>
        <footer class="drawer-footer"><span>${esc(session.institution)}</span><a href="Privacidade.html">Privacidade</a></footer>
      </aside>
      <div class="workspace">
        <header class="topbar">
          <div class="topbar-inner">${brand()}
            <nav class="primary-nav" aria-label="Menu principal">${primaryLinks.map(link => navigationLink(link, route)).join('')}</nav>
            <div class="topbar-actions">
              <button type="button" class="profile-button" data-action="profile" aria-label="Abrir perfil de ${esc(session.institution)}">${icon('building')}<span class="profile-label">${esc(session.institution)}</span>${icon('down')}</button>
              <button type="button" class="icon-button mobile-menu" data-action="toggle-menu" aria-label="Abrir menu da instituição" aria-expanded="${menuOpen}" aria-controls="sidebar">${icon('menu')}</button>
            </div>
          </div>
        </header>
        <main class="main-content" id="main" tabindex="-1" aria-labelledby="page-title">${storageProblem ? `<div class="info-box warning" role="alert">${icon('alert')}<span>Os dados locais não puderam ser carregados. Verifique o armazenamento do navegador antes de fazer alterações.</span></div>` : ''}${content}</main>
        <footer class="app-footer"><span>AEGIS · Monitoramento de acesso escolar</span><nav aria-label="Links institucionais"><a href="Eventos.html">Eventos</a><a href="Suporte.html">Ajuda</a><a href="Privacidade.html">Privacidade</a></nav></footer>
      </div>
    </div>`;
  }
  function setMenu(open) {
    const drawer = document.querySelector('.sidebar');
    if (!drawer) return;
    drawer.classList.toggle('open', open);
    drawer.inert = !open;
    document.querySelector('.sidebar-scrim')?.classList.toggle('visible', open);
    document.querySelector('.mobile-menu')?.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
    const workspace = document.querySelector('.workspace');
    if (workspace) workspace.inert = open;
    if (open) {
      drawer.setAttribute('role', 'dialog');
      drawer.setAttribute('aria-modal', 'true');
    } else {
      drawer.removeAttribute('role');
      drawer.removeAttribute('aria-modal');
    }
    document.querySelector(open ? '.sidebar-close' : '.mobile-menu')?.focus({preventScroll:true});
  }
  function publicHeader(back='/login') { return `<header class="public-header">${brand(back.replace(/^\//, ''))}<a class="btn" href="${pageHref(back.replace(/^\//, ''))}">${icon('back')}Retornar</a>
      </header>`; }

  function enhanceTables() {
    document.querySelectorAll('.table-scroll').forEach(region => {
      region.tabIndex = 0;
      region.setAttribute('role', 'region');
      region.setAttribute('aria-label', region.querySelector('caption')?.textContent || 'Tabela de registros');
    });
  }

  const plainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const safeId = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(value) && !['constructor','prototype','__proto__'].includes(value);
  const textField = (record, name, limit) => typeof record[name] === 'string' && record[name].length <= limit;
  const validDate = value => typeof value === 'string' && value.length <= 40 && Number.isFinite(Date.parse(value));
  function parseState(saved) {
    if (!plainObject(saved) || saved.version !== 1) throw new Error('Dados locais incompatíveis.');
    for (const key of ['students','requests','tickets','events','audit']) {
      if (!Array.isArray(saved[key]) || saved[key].length > 10000) throw new Error('Lista local inválida.');
      const ids = new Set();
      for (const record of saved[key]) {
        if (!plainObject(record) || !safeId(record.id) || ids.has(record.id)) throw new Error('Identificador local inválido.');
        ids.add(record.id);
      }
    }
    const students = saved.students.map(student => {
      if (!textField(student,'name',100) || student.name.trim().length < 3 || !textField(student,'enrollment',20) || !/^[A-Za-z0-9-]+$/.test(student.enrollment) || !textField(student,'className',40) || !student.className.trim() || !textField(student,'email',120) || !textField(student,'photo',1200000) || !['active','inactive'].includes(student.status)) throw new Error('Cadastro local inválido.');
      if (student.last !== undefined && !textField(student,'last',80)) throw new Error('Horário local inválido.');
      const knownPhoto=seedStudents.some(seed=>seed.photo&&seed.photo===student.photo);
      return { id:student.id,name:student.name,enrollment:student.enrollment,className:student.className,email:student.email,status:student.status,photo:validImage(student.photo)||knownPhoto ? student.photo : '',last:student.last || '—' };
    });
    const enrollments = students.map(student => normalize(student.enrollment));
    if (new Set(enrollments).size !== enrollments.length) throw new Error('Matrículas locais duplicadas.');
    const settings = saved.settings;
    if (!plainObject(settings) || typeof settings.recognition !== 'boolean' || typeof settings.uncertainAlert !== 'boolean' || !Number.isInteger(settings.threshold) || settings.threshold < 50 || settings.threshold > 100 || !['1','7','30'].includes(settings.consultaDays) || !validDate(saved.lastUpdated)) throw new Error('Preferências locais inválidas.');
    for (const field of ['humanReview','twoFactor']) if (settings[field] !== undefined && typeof settings[field] !== 'boolean') throw new Error('Preferência local inválida.');
    if (settings.role !== undefined && !textField(settings,'role',80)) throw new Error('Perfil local inválido.');
    if (!plainObject(saved.notes) || Object.keys(saved.notes).length > 10000) throw new Error('Observações locais inválidas.');
    const notes = Object.create(null);
    for (const [id, value] of Object.entries(saved.notes)) {
      if (!safeId(id) || typeof value !== 'string' || value.length > 500) throw new Error('Observação local inválida.');
      notes[id] = value;
    }
    const records = (key, fields) => saved[key].map(record => {
      if (!validDate(record.at) || !Object.entries(fields).every(([field,limit]) => textField(record,field,limit))) throw new Error('Registro local inválido.');
      const item = {id:record.id};
      Object.keys(fields).forEach(field => { item[field]=record[field]; });
      item.at = record.at;
      return item;
    });
    const events = records('events',{title:200,description:1500,type:40});
    if (events.some(event => !['info','success','warning','danger'].includes(event.type))) throw new Error('Tipo de evento inválido.');
    return { version:1,students,notes,requests:records('requests',{protocol:100,name:100,email:120,institution:120,role:80,reason:1500}),tickets:records('tickets',{protocol:100,need:1500,institution:120}),events:events.slice(0,100),audit:records('audit',{user:120,action:1500}).slice(0,100),settings:{recognition:settings.recognition,threshold:settings.threshold,uncertainAlert:settings.uncertainAlert,humanReview:settings.humanReview ?? true,twoFactor:settings.twoFactor ?? true,role:settings.role ?? 'Administrador',consultaDays:settings.consultaDays},lastUpdated:saved.lastUpdated };
  }
  function loadState(storage) {
    let serialized = null;
    try {
      const target=typeof storage === 'function' ? storage() : storage;
      serialized=target.getItem(STORAGE_KEY);
      return {state:serialized ? parseState(JSON.parse(serialized)) : defaultState(),problem:false,serialized};
    } catch { console.warn('AEGIS: dados locais indisponíveis ou incompatíveis.'); return {state:defaultState(),problem:true,serialized}; }
  }
  function readSession(storage) {
    try {
      const target=typeof storage === 'function' ? storage() : storage;
      const saved=JSON.parse(target.getItem(SESSION_KEY)||'null');
      if (plainObject(saved) && typeof saved.institution === 'string' && saved.institution.trim() && saved.institution.length <= 80) return {institution:saved.institution.trim()};
    } catch {}
    return null;
  }
  function saveState(storage,next,snapshot) {
    const target=typeof storage === 'function' ? storage() : storage;
    if(target.getItem(STORAGE_KEY)!==snapshot){const error=new Error('Os dados mudaram em outra aba. Atualize a página antes de salvar.');error.name='StateConflictError';throw error;}
    if(snapshot!==null){
      try{parseState(JSON.parse(snapshot));}
      catch{const error=new Error('Os dados locais não puderam ser carregados. Para evitar perda de informações, restaure o armazenamento e atualize a página antes de salvar.');error.name='StateRecoveryError';throw error;}
    }
    const state=parseState({...next,lastUpdated:now()});
    const serialized=JSON.stringify(state);
    target.setItem(STORAGE_KEY,serialized);
    return {state,serialized};
  }
  const csvCell = value => {
    let text=String(value??'');
    if (/^[\s\uFEFF]*[=+@-]/.test(text)) text="'"+text;
    return '"'+text.replace(/"/g,'""')+'"';
  };
  function downloadCSV(filename,rows) {
    const data='\uFEFF'+rows.map(row=>row.map(csvCell).join(';')).join('\r\n');
    const url=URL.createObjectURL(new Blob([data],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function fileData(file) {
    if(!file || !file.size)return null;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Escolha uma imagem PNG, JPG ou WEBP.');
    if(file.size>800*1024)throw new Error('A imagem precisa ter até 800 KB.');
    if (typeof createImageBitmap === 'function') {
      let bitmap;
      try {
        bitmap=await createImageBitmap(file);
        if(bitmap.width*bitmap.height>8000000 || Math.max(bitmap.width,bitmap.height)>8192)throw new Error('Use uma foto com até 8 megapixels e até 8.192 pixels por lado.');
      } catch(error) {throw new Error(error.message.includes('megapixels')?error.message:'O arquivo não contém uma imagem válida.');}
      finally {bitmap?.close();}
    }
    return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Não foi possível ler a imagem.'));reader.readAsDataURL(file);});
  }
  function bundledImages() {
    return { './aegis-logo.png': './assets/aegis-mark.svg' };
  }
  const api = Object.freeze({images,imageSource,STORAGE_KEY,SESSION_KEY,paths,icon,esc,normalize,copy,uid,now,time,dateTime,today,dateLabel,initials,validImage,defaultState,seedStudents,brand,renderShell,setMenu,enhanceTables,demoBadge,badge,photoMarkup,avatar,empty,head,tabs,publicHeader,pageFiles,pageHref,pages,sideLinks,cameras,parseState,loadState,saveState,readSession,csvCell,downloadCSV,fileData});
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else globalThis.AegisShared = api;
})();
