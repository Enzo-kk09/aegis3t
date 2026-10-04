'use strict';

(() => {
  const MAX_RECORDS = 1000;
  const MAX_BYTES = 8 * 1024 * 1024;
  const classifyObservation = (expected, faces) => {
    const result = { scored:false, correct:false, tp:0, fp:0, fn:0, tn:0, reason:'unannotated' };
    if (!expected) return result;
    if (faces.length > 1) return { ...result, reason:'multiple_faces' };
    if (!faces.length && expected === '__unknown__') return { ...result, reason:'no_face_unknown' };
    const prediction = faces[0]?.status === 'matched' ? faces[0].profile?.id || null : null;
    if (expected === '__unknown__') return { ...result, scored:true, correct:!prediction, fp:prediction ? 1 : 0, tn:prediction ? 0 : 1, reason:prediction ? 'false_positive' : 'true_negative' };
    if (prediction === expected) return { ...result, scored:true, correct:true, tp:1, reason:'true_positive' };
    return { ...result, scored:true, fp:prediction ? 1 : 0, fn:1, reason:prediction ? 'wrong_identity' : 'false_negative' };
  };
  const aggregateObservations = records => {
    const total = records.reduce((sum, record) => {
      const observation = record.observation || classifyObservation(record.expected, record.faces || []);
      ['tp','fp','fn','tn'].forEach(key => { sum[key] += observation[key]; });
      sum.scored += Number(observation.scored);
      sum.correct += Number(observation.scored && observation.correct);
      sum.excluded += Number(!observation.scored);
      return sum;
    }, { tp:0, fp:0, fn:0, tn:0, scored:0, correct:0, excluded:0 });
    return { ...total, precision:total.tp + total.fp ? total.tp / (total.tp + total.fp) : null, recall:total.tp + total.fn ? total.tp / (total.tp + total.fn) : null, accuracy:total.scored ? total.correct / total.scored : null };
  };
  const csvCell = value => {
    let text = String(value ?? '');
    if (/^[\s\uFEFF]*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  const summarizeBenchmark = (rows, expected) => rows.map(row => {
    const faces = Array.isArray(row.faces) ? row.faces : null;
    const observation = faces ? classifyObservation(expected, faces) : null;
    return { ...row, faceCount:faces ? faces.length : Number(row.faces) || 0, observation };
  });
  const utilities = { classifyObservation, aggregateObservations, csvCell, summarizeBenchmark };
  if (typeof module !== 'undefined' && module.exports) module.exports = utilities;
  if (typeof document === 'undefined') return;

  const el = id => document.getElementById('dev-' + id);
  const state = { connected:false, ready:false, token:'', healthPending:false, profiles:[], stream:null, live:false, starting:false, busy:false, imageLoading:false, liveController:null, operationController:null, timer:null, generation:0, enroll:[], image:null, imageBitmap:null, imageURL:null, imageGeneration:0, records:[], lastResult:null, cameraTimes:[], deviceGeneration:0, menuOpen:false };
  const video = el('video');
  const overlay = el('overlay');
  const liveCaptureCanvas = document.createElement('canvas');
  const formats = new Intl.NumberFormat('pt-BR', { maximumFractionDigits:1 });
  const scoreFormat = new Intl.NumberFormat('pt-BR', { minimumFractionDigits:3, maximumFractionDigits:3 });
  const decimal = value => value != null && Number.isFinite(Number(value)) ? formats.format(Number(value)) : '—';
  const score = value => value != null && Number.isFinite(Number(value)) ? scoreFormat.format(Number(value)) : '—';
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const percent = value => value === null ? '—' : decimal(value * 100) + '%';
  const showMessage = (message, kind='info') => {
    el('message').textContent = message;
    el('message').dataset.kind = kind;
    el('message').hidden = !message;
  };
  const showError = error => {
    if (error?.name === 'AbortError') return;
    showMessage(error.message || 'Não foi possível concluir esta operação.', 'error');
  };
  const errorText = payload => {
    const detail = payload?.detail;
    if (typeof detail === 'string') return detail;
    if (typeof detail?.message === 'string') return detail.message;
    if (typeof payload?.message === 'string') return payload.message;
    return 'O servidor recusou a operação.';
  };
  const request = async (path, { method='GET', body, signal, timeout=30000 }={}) => {
    const controller = new AbortController();
    const relay = () => controller.abort();
    if (signal?.aborted) controller.abort();
    signal?.addEventListener('abort', relay, { once:true });
    const timeoutId = setTimeout(() => controller.abort('timeout'), timeout);
    try {
      const headers = method === 'GET' ? {} : { 'X-AEGIS-Token':state.token };
      const response = await fetch('/api/dev' + path, { method, headers, body, signal:controller.signal, credentials:'same-origin', cache:'no-store' });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        if ([403,500,503].includes(response.status)) {
          state.ready = false;
          el('health-badge').dataset.status = 'error';
          el('health-label').textContent = 'Reconexão necessária';
          el('setup').hidden = false;
          el('setup-message').textContent = 'Verifique o servidor local e clique em Reconectar para atualizar a conexão.';
        }
        throw new Error(errorText(payload));
      }
      if (!payload) throw new Error('Resposta inválida. Abra a página pelo servidor Python local.');
      return payload;
    } catch (error) {
      if (controller.signal.aborted && !signal?.aborted) throw new Error('O servidor demorou demais para responder. Tente novamente.');
      if (error instanceof TypeError && /fetch|network|load/i.test(error.message)) {
        state.connected = false;
        state.ready = false;
        el('health-badge').dataset.status = 'offline';
        el('health-label').textContent = 'Python desconectado';
        el('setup').hidden = false;
        el('setup-message').textContent = 'A conexão com o servidor Python foi interrompida. Inicie o laboratório e clique em Reconectar.';
        throw new Error('Não foi possível conectar ao servidor Python local. Inicie o laboratório e reconecte.');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', relay);
    }
  };
  const controls = () => {
    const occupied = state.busy || state.starting || state.imageLoading;
    el('start').disabled = !state.ready || occupied || state.live;
    el('start').textContent = state.starting ? 'Abrindo…' : state.stream ? 'Retomar análise' : 'Iniciar câmera';
    el('stop').disabled = !state.stream && !state.starting;
    el('device').disabled = occupied;
    el('enroll-submit').disabled = !state.ready || occupied || !state.enroll.length;
    el('capture-enroll').disabled = !state.stream || occupied || state.enroll.length >= 5;
    el('capture-test').disabled = !state.stream || occupied;
    el('recognize-image').disabled = !state.ready || occupied || !state.image;
    el('benchmark').disabled = !state.ready || occupied || !state.image;
    el('clear-image').disabled = occupied || !state.image;
    el('test-image').disabled = occupied;
    el('enroll-images').disabled = occupied;
    el('name').disabled = occupied;
    el('scale').disabled = occupied;
    el('threshold').disabled = occupied;
    el('ground-truth').disabled = occupied;
    el('refresh-profiles').disabled = !state.connected || occupied;
    el('export').disabled = !state.records.length;
    el('clear-records').disabled = !state.records.length;
    el('profiles').querySelectorAll('button').forEach(button => { button.disabled = occupied || !state.connected; });
  };
  const refreshProfiles = async () => {
    const payload = await request('/profiles');
    state.profiles = payload.profiles || [];
    el('profile-count').textContent = state.profiles.length;
    const selected = el('ground-truth').value;
    el('ground-truth').innerHTML = '<option value="">Sem anotação · apenas desempenho</option><option value="__unknown__">Pessoa não cadastrada</option>' + state.profiles.map(profile => `<option value="${escapeHTML(profile.id)}">${escapeHTML(profile.name)}</option>`).join('');
    if ([...el('ground-truth').options].some(option => option.value === selected)) el('ground-truth').value = selected;
    el('profiles').innerHTML = state.profiles.length ? state.profiles.map(profile => `<div class="dev-profile"><span class="avatar" aria-hidden="true">${escapeHTML(profile.name.trim().split(/\s+/).slice(0,2).map(part => part[0]).join('').toUpperCase())}</span><div class="dev-profile-info"><strong>${escapeHTML(profile.name)}</strong><small>${Number(profile.samples)} ${Number(profile.samples) === 1 ? 'foto' : 'fotos'} de referência</small></div><button class="icon-button dev-profile-delete" data-profile="${escapeHTML(profile.id)}" aria-label="Excluir perfil ${escapeHTML(profile.name)}"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M3 6h18M8 6V3h8v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/></svg></button></div>`).join('') : '<p class="muted">Nenhum perfil cadastrado. Adicione suas primeiras fotos para começar.</p>';
    controls();
  };
  const health = async () => {
    if (state.healthPending) return;
    state.healthPending = true;
    el('reconnect').disabled = true;
    try {
      const payload = await request('/health', { timeout:10000 });
      state.connected = true;
      state.ready = payload.status === 'ready';
      state.token = payload.token || '';
      el('health-badge').dataset.status = payload.status;
      el('health-label').textContent = state.ready ? 'Python conectado' : payload.status === 'models_missing' ? 'Modelos pendentes' : 'Servidor indisponível';
      el('setup').hidden = state.ready;
      el('setup-message').textContent = payload.message || 'Baixe os modelos e reinicie o laboratório.';
      await refreshProfiles();
    } catch {
      state.connected = false;
      state.ready = false;
      el('health-badge').dataset.status = 'offline';
      el('health-label').textContent = 'Python desconectado';
      el('setup').hidden = false;
      el('setup-message').textContent = 'Execute os comandos abaixo no diretório do projeto e abra esta página pelo servidor local.';
      el('profile-count').textContent = '—';
    } finally {
      state.healthPending = false;
      el('reconnect').disabled = false;
      controls();
    }
  };
  const mediaDevices = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const current = el('device').value;
    const devices = (await navigator.mediaDevices.enumerateDevices()).filter(device => device.kind === 'videoinput');
    el('device').innerHTML = '<option value="">Câmera padrão</option>' + devices.map((device, index) => `<option value="${escapeHTML(device.deviceId)}">${escapeHTML(device.label || 'Câmera ' + (index + 1))}</option>`).join('');
    if (devices.some(device => device.deviceId === current)) el('device').value = current;
  };
  const stopLive = (release=true) => {
    state.live = false;
    state.generation += 1;
    clearTimeout(state.timer);
    state.timer = null;
    state.liveController?.abort();
    state.liveController = null;
    state.cameraTimes = [];
    el('fps').textContent = '—';
    if (release) {
      state.deviceGeneration += 1;
      state.starting = false;
      state.stream?.getTracks().forEach(track => track.stop());
      state.stream = null;
      video.srcObject = null;
      el('camera-empty').hidden = false;
      overlay.getContext('2d').clearRect(0, 0, overlay.width, overlay.height);
    }
    el('camera-state').textContent = state.stream ? 'Análise pausada' : 'Câmera desligada';
    el('camera-state').className = 'badge';
    el('stage-label').textContent = state.stream ? 'Câmera ativa · análise pausada' : 'Aguardando câmera';
    controls();
  };
  const captureFrame = async (canvas=document.createElement('canvas')) => {
    if (!state.stream || video.readyState < 2 || !video.videoWidth) throw new Error('Aguarde a câmera fornecer uma imagem.');
    if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
    if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) throw new Error('Não foi possível capturar a imagem da câmera.');
    return new File([blob], 'camera-' + Date.now() + '.jpg', { type:'image/jpeg' });
  };
  const buildForm = (image, config) => {
    const form = new FormData();
    form.append('image', image, image.name || 'camera.jpg');
    form.append('scale', config.scale);
    form.append('threshold', config.threshold);
    return form;
  };
  const configuration = () => ({ scale:Number(el('scale').value), threshold:Number(el('threshold').value), expected:el('ground-truth').value });
  const drawFaces = (context, result, width, height) => {
    const factorX = width / result.image.width;
    const factorY = height / result.image.height;
    const unit = Math.max(1, width / 800);
    context.lineWidth = 2.5 * unit;
    context.font = `${Math.round(14 * unit)}px "Segoe UI",Arial,sans-serif`;
    const statuses = { unknown:'Não identificado', uncertain:'Correspondência incerta', low_quality:'Qualidade insuficiente' };
    for (const face of result.faces) {
      const box = face.box;
      const x = box.x * factorX;
      const y = box.y * factorY;
      const w = box.width * factorX;
      const h = box.height * factorY;
      const color = face.status === 'matched' ? '#63e19b' : face.status === 'low_quality' ? '#ffc16a' : '#82b6ff';
      context.strokeStyle = color;
      context.strokeRect(x, y, w, h);
      const label = (face.status === 'matched' ? face.profile?.name : statuses[face.status]) || 'Rosto';
      const text = label + (face.similarity == null ? '' : ' · ' + score(face.similarity));
      const labelWidth = Math.min(width, context.measureText(text).width + 16 * unit);
      const labelX = Math.max(0, Math.min(x, width - labelWidth));
      const labelY = Math.max(0, y - 26 * unit);
      context.fillStyle = '#061526e6';
      context.fillRect(labelX, labelY, labelWidth, 25 * unit);
      context.fillStyle = color;
      context.fillText(text, labelX + 8 * unit, labelY + 17 * unit, labelWidth - 16 * unit);
    }
  };
  const renderMetrics = () => {
    const metrics = aggregateObservations(state.records);
    el('precision').textContent = percent(metrics.precision);
    el('recall').textContent = percent(metrics.recall);
    el('accuracy').textContent = percent(metrics.accuracy);
    el('scored').textContent = metrics.scored;
    el('metric-detail').textContent = `TP ${metrics.tp} · FP ${metrics.fp} · FN ${metrics.fn} · TN ${metrics.tn} · ${metrics.excluded} sem pontuação`;
    controls();
  };
  const recordResult = (result, config, source, roundtrip) => {
    const faces = result.faces || [];
    state.records.push({ at:new Date().toISOString(), source, ...config, faces, timings:result.timings, detection:result.detection, roundtrip, observation:classifyObservation(config.expected, faces) });
    if (state.records.length > MAX_RECORDS) state.records.splice(0, state.records.length - MAX_RECORDS);
    renderMetrics();
  };
  const renderResult = (result, roundtrip) => {
    state.lastResult = result;
    el('latency').textContent = decimal(roundtrip);
    el('server-time').textContent = decimal(result.timings?.total_ms);
    el('stage-times').textContent = `Det. ${decimal(result.timings?.detect_ms)} ms · Rec. ${decimal(result.timings?.recognize_ms)} ms`;
    const labels = { matched:'Identificado', unknown:'Não identificado', uncertain:'Correspondência incerta', low_quality:'Qualidade insuficiente' };
    el('result').innerHTML = result.faces.length ? result.faces.map(face => `<div class="dev-result-item"><div class="dev-result-identity"><strong>${escapeHTML(face.status === 'matched' ? face.profile?.name : labels[face.status] || 'Rosto detectado')}</strong><small>${escapeHTML(face.reason || labels[face.status] || '')}</small></div><div class="dev-result-score">${face.similarity == null ? 'Sem similaridade' : 'Similaridade ' + score(face.similarity)}<br><small>Detecção ${score(face.detector_score)}</small></div></div>`).join('') : '<p class="muted">Nenhum rosto detectado neste quadro.</p>';
    const detection = result.detection;
    if (detection) el('stage-label').textContent = `${result.image.width} × ${result.image.height} → ${detection.width} × ${detection.height} · ${result.faces.length} ${result.faces.length === 1 ? 'rosto' : 'rostos'}`;
  };
  const liveTick = async generation => {
    if (!state.live || generation !== state.generation) return;
    const config = configuration();
    const controller = new AbortController();
    state.liveController = controller;
    const started = performance.now();
    try {
      const image = await captureFrame(liveCaptureCanvas);
      if (!state.live || generation !== state.generation) return;
      const result = await request('/recognize', { method:'POST', body:buildForm(image, config), signal:controller.signal });
      if (!state.live || generation !== state.generation) return;
      const completed = performance.now();
      renderResult(result, completed - started);
      if (overlay.width !== video.videoWidth) overlay.width = video.videoWidth;
      if (overlay.height !== video.videoHeight) overlay.height = video.videoHeight;
      overlay.getContext('2d').clearRect(0, 0, overlay.width, overlay.height);
      drawFaces(overlay.getContext('2d'), result, overlay.width, overlay.height);
      state.cameraTimes.push(completed);
      state.cameraTimes = state.cameraTimes.filter(time => completed - time < 5000);
      const elapsed = state.cameraTimes.length > 1 ? completed - state.cameraTimes[0] : 0;
      el('fps').textContent = elapsed ? decimal((state.cameraTimes.length - 1) * 1000 / elapsed) : '—';
      recordResult(result, config, 'camera', completed - started);
    } catch (error) {
      if (generation !== state.generation || error.name === 'AbortError') return;
      stopLive(false);
      showError(error);
    } finally {
      if (state.liveController === controller) state.liveController = null;
      if (state.live && generation === state.generation) state.timer = setTimeout(() => liveTick(generation), Math.max(100, 200 - (performance.now() - started)));
    }
  };
  const startCamera = async () => {
    if (state.starting || state.live || state.busy || state.imageLoading || !state.ready) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      showMessage('A câmera precisa de localhost ou HTTPS e de um navegador com suporte a getUserMedia.', 'error');
      return;
    }
    state.starting = true;
    const generation = ++state.deviceGeneration;
    controls();
    try {
      if (!state.stream) {
        const device = el('device').value;
        const stream = await navigator.mediaDevices.getUserMedia({ audio:false, video:{ width:{ ideal:1280 }, height:{ ideal:720 }, ...(device ? { deviceId:{ exact:device } } : { facingMode:'user' }) } });
        if (generation !== state.deviceGeneration) { stream.getTracks().forEach(track => track.stop()); return; }
        state.stream = stream;
        stream.getVideoTracks().forEach(track => track.addEventListener('ended', () => { if (state.stream === stream) stopLive(); }, { once:true }));
        video.srcObject = stream;
        await video.play();
        if (!video.videoWidth) await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('A câmera não forneceu uma imagem.')), 5000);
          video.addEventListener('loadedmetadata', () => { clearTimeout(timer); resolve(); }, { once:true });
        });
        if (generation !== state.deviceGeneration) return;
        el('camera-stage').style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`;
        await mediaDevices();
      }
      if (generation !== state.deviceGeneration) return;
      state.live = true;
      state.generation += 1;
      el('camera-empty').hidden = true;
      el('camera-state').textContent = 'Analisando';
      el('camera-state').className = 'badge success';
      showMessage('');
      liveTick(state.generation);
    } catch (error) {
      if (generation !== state.deviceGeneration) return;
      stopLive();
      const cameraErrors = { NotAllowedError:'Permita o acesso à câmera no navegador e tente novamente.', NotFoundError:'Nenhuma câmera foi encontrada neste computador.', NotReadableError:'A câmera está ocupada por outro aplicativo.', OverconstrainedError:'A câmera selecionada não está disponível. Escolha outra.' };
      showMessage(cameraErrors[error.name] || error.message || 'Não foi possível iniciar a câmera.', 'error');
    } finally {
      if (generation === state.deviceGeneration) state.starting = false;
      controls();
    }
  };
  const runOperation = async (button, workingLabel, operation) => {
    if (state.busy || state.imageLoading) return;
    stopLive(false);
    state.busy = true;
    const controller = new AbortController();
    state.operationController = controller;
    const label = button.innerHTML;
    button.textContent = workingLabel;
    showMessage('');
    controls();
    try { await operation(controller.signal); }
    catch (error) { showError(error); }
    finally {
      state.operationController = null;
      state.busy = false;
      button.innerHTML = label;
      controls();
    }
  };
  const validFile = file => {
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Selecione uma imagem JPG, PNG ou WebP.');
    if (file.size > MAX_BYTES) throw new Error('Cada imagem deve ter no máximo 8 MB.');
    if (!file.size) throw new Error('A imagem selecionada está vazia.');
  };
  const renderEnroll = () => {
    el('enroll-previews').innerHTML = state.enroll.map((entry, index) => `<div class="dev-photo"><img src="${entry.url}" alt="Foto de referência ${index + 1}"><button type="button" data-photo="${index}" aria-label="Remover foto ${index + 1}">✕</button></div>`).join('');
    controls();
  };
  const clearEnroll = () => {
    state.enroll.forEach(entry => URL.revokeObjectURL(entry.url));
    state.enroll = [];
    el('enroll-images').value = '';
    renderEnroll();
  };
  const addEnroll = files => {
    if (state.enroll.length + files.length > 5) throw new Error('O cadastro aceita no máximo 5 fotos. Remova uma foto para adicionar outra.');
    files.forEach(validFile);
    state.enroll.push(...files.map(file => ({ file, url:URL.createObjectURL(file) })));
    renderEnroll();
  };
  const clearImage = (invalidate=true) => {
    if (invalidate) {
      state.imageGeneration += 1;
      state.imageLoading = false;
    }
    state.imageBitmap?.close?.();
    if (state.imageURL) URL.revokeObjectURL(state.imageURL);
    state.image = null;
    state.imageBitmap = null;
    state.imageURL = null;
    el('image-preview').hidden = true;
    el('image-name').textContent = 'Nenhuma imagem selecionada';
    el('test-image').value = '';
    el('benchmark-results').innerHTML = '<p class="muted">Os tempos serão medidos no seu computador.</p>';
    controls();
  };
  const setImage = async file => {
    validFile(file);
    const generation = ++state.imageGeneration;
    state.imageLoading = true;
    controls();
    let bitmap;
    let objectURL = null;
    try {
      try {
        if (typeof createImageBitmap === 'function') bitmap = await createImageBitmap(file);
        else {
          objectURL = URL.createObjectURL(file);
          bitmap = await new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = objectURL; });
        }
      } catch {
        throw new Error('Não foi possível abrir a imagem. Selecione um JPEG, PNG ou WebP válido.');
      }
      if (generation !== state.imageGeneration) return;
      if (bitmap.width * bitmap.height > 8_000_000 || Math.max(bitmap.width, bitmap.height) > 8192) throw new Error('Use uma imagem com até 8 megapixels e até 8.192 pixels por lado.');
      clearImage(false);
      state.image = file;
      state.imageBitmap = bitmap;
      state.imageURL = objectURL;
      const canvas = el('image-canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext('2d').drawImage(bitmap, 0, 0);
      el('image-preview').hidden = false;
      el('image-name').textContent = `${file.name} · ${bitmap.width} × ${bitmap.height}`;
    } finally {
      if (state.imageBitmap !== bitmap) bitmap?.close?.();
      if (objectURL && state.imageURL !== objectURL) URL.revokeObjectURL(objectURL);
      if (generation === state.imageGeneration) state.imageLoading = false;
      controls();
    }
  };
  const renderBenchmark = (payload, config) => {
    const expected = config.expected;
    const rows = summarizeBenchmark(payload.results, expected);
    const expectedProfile = state.profiles.find(profile => profile.id === expected);
    const observationLabels = { true_positive:'Correto', true_negative:'Correto: desconhecido', false_positive:'Falso positivo', false_negative:'Falso negativo', wrong_identity:'Identidade incorreta', multiple_faces:'Múltiplos rostos', no_face_unknown:'Sem rosto: não pontuado', unannotated:'Sem anotação' };
    el('benchmark-results').innerHTML = `<div class="table-scroll"><table><caption class="visually-hidden">Comparação de escalas na mesma imagem</caption><thead><tr><th scope="col">Escala</th><th scope="col">Média</th><th scope="col">P95</th><th scope="col">Rostos</th><th scope="col">Identificação</th></tr></thead><tbody>${rows.map(row => {
      const matchedFaces = Array.isArray(row.faces) ? row.faces.filter(face => face.status === 'matched') : [];
      const identified = matchedFaces.length ? matchedFaces.map(face => face.profile?.name).filter(Boolean).join(', ') : Array.isArray(row.matched) ? row.matched.map(item => typeof item === 'object' ? item.name || item.id : item).join(', ') : Number(row.matched) ? row.matched + ' correspondência(s)' : 'Nenhuma';
      return `<tr><td>${Math.round(row.scale * 100)}%${Number(row.scale) === 0.1 ? ' *' : ''}</td><td>${decimal(row.mean_ms)} ms</td><td>${decimal(row.p95_ms)} ms</td><td>${row.faceCount}</td><td>${escapeHTML(identified)}${row.observation && expected ? '<br><small>' + escapeHTML(observationLabels[row.observation.reason]) + '</small>' : ''}</td></tr>`;
    }).join('')}</tbody></table></div><p class="dev-help">Tempos de processamento Python; P95 calculado sobre 3 medições, uma amostra pequena.${expected ? ' Esperado: ' + escapeHTML(expectedProfile?.name || 'pessoa não cadastrada') + '.' : ' Selecione a identidade esperada para avaliar as correspondências.'} * 10% é experimental.</p>`;
    rows.forEach(row => {
      if (Array.isArray(row.faces)) recordResult({ faces:row.faces, timings:{ total_ms:row.mean_ms }, detection:row.detection }, { ...config, scale:row.scale }, 'benchmark', null);
    });
  };
  const exportRecords = () => {
    const header = ['horario_utc','origem','escala','limiar','identidade_esperada','rostos','identidades_previstas','similaridades','resultado','tp','fp','fn','tn','resposta_ms','python_ms','detectar_ms','reconhecer_ms','deteccao_largura','deteccao_altura'];
    const rows = state.records.map(record => [record.at,record.source,record.scale,record.threshold,record.expected,record.faces.length,record.faces.map(face => face.status === 'matched' ? face.profile?.name : face.status).join(' | '),record.faces.map(face => face.similarity ?? '').join(' | '),record.observation.reason,record.observation.tp,record.observation.fp,record.observation.fn,record.observation.tn,record.roundtrip,record.timings?.total_ms,record.timings?.detect_ms,record.timings?.recognize_ms,record.detection?.width,record.detection?.height]);
    const csv = '\uFEFF' + [header,...rows].map(row => row.map(csvCell).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type:'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'aegis-developer-test-' + new Date().toISOString().replace(/[:.]/g, '-') + '.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const setMenu = open => {
    const wasOpen = state.menuOpen;
    state.menuOpen = open;
    document.getElementById('sidebar').classList.toggle('open', open);
    el('menu-scrim').classList.toggle('visible', open);
    el('menu-open').setAttribute('aria-expanded', String(open));
    if (open) el('menu-close').focus();
    else if (wasOpen) el('menu-open').focus();
  };

  el('menu-open').addEventListener('click', () => setMenu(true));
  el('menu-close').addEventListener('click', () => setMenu(false));
  el('menu-scrim').addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', event => {
    if (!state.menuOpen) return;
    if (event.key === 'Escape') { event.preventDefault(); setMenu(false); }
    if (event.key === 'Tab' && matchMedia('(max-width:760px)').matches) {
      const items=[...document.getElementById('sidebar').querySelectorAll('a,button')].filter(item=>!item.disabled&&item.getClientRects().length);
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0]?.focus(); }
    }
  });
  el('reconnect').addEventListener('click', health);
  el('start').addEventListener('click', startCamera);
  el('stop').addEventListener('click', () => stopLive());
  el('device').addEventListener('change', () => { if (state.stream) { stopLive(); startCamera(); } });
  el('threshold').addEventListener('input', () => { el('threshold-value').textContent = Number(el('threshold').value).toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 }); });
  el('enroll-images').addEventListener('change', event => { try { addEnroll([...event.target.files]); showMessage(''); } catch (error) { showError(error); } event.target.value = ''; });
  el('enroll-previews').addEventListener('click', event => { const button = event.target.closest('[data-photo]'); if (!button || state.busy) return; const [entry] = state.enroll.splice(Number(button.dataset.photo), 1); URL.revokeObjectURL(entry.url); renderEnroll(); });
  el('capture-enroll').addEventListener('click', async () => { try { addEnroll([await captureFrame()]); showMessage('Quadro adicionado às fotos de cadastro. Confira a nitidez antes de cadastrar.'); } catch (error) { showError(error); } });
  el('enroll-form').addEventListener('submit', event => {
    event.preventDefault();
    const name = el('name').value.trim();
    if (!name || !state.enroll.length) { showMessage('Informe um nome e adicione pelo menos uma foto.', 'error'); return; }
    runOperation(el('enroll-submit'), 'Cadastrando…', async signal => {
      const form = new FormData();
      form.append('name', name);
      state.enroll.forEach(entry => form.append('images', entry.file, entry.file.name));
      await request('/profiles', { method:'POST', body:form, signal, timeout:60000 });
      clearEnroll();
      el('name').value = '';
      await refreshProfiles();
      showMessage(`Perfil ${name} cadastrado. Inicie ou retome a câmera para testar.`, 'success');
    });
  });
  el('refresh-profiles').addEventListener('click', () => runOperation(el('refresh-profiles'), 'Atualizando…', refreshProfiles));
  el('profiles').addEventListener('click', event => {
    const button = event.target.closest('[data-profile]');
    if (!button || state.busy) return;
    const profile = state.profiles.find(item => item.id === button.dataset.profile);
    if (!profile || !window.confirm(`Excluir o perfil ${profile.name} e seus descritores faciais deste computador?`)) return;
    runOperation(button, '…', async signal => { await request('/profiles/' + encodeURIComponent(profile.id), { method:'DELETE', signal }); await refreshProfiles(); showMessage('Perfil excluído.', 'success'); });
  });
  el('test-image').addEventListener('change', async event => { const file = event.target.files[0]; if (!file) return; try { await setImage(file); showMessage(''); } catch (error) { showError(error); } });
  el('capture-test').addEventListener('click', async () => { try { await setImage(await captureFrame()); showMessage('Imagem capturada. As quatro escalas usarão este mesmo quadro.'); } catch (error) { showError(error); } });
  el('clear-image').addEventListener('click', () => clearImage());
  el('recognize-image').addEventListener('click', () => runOperation(el('recognize-image'), 'Analisando…', async signal => {
    const config = configuration();
    const started = performance.now();
    const result = await request('/recognize', { method:'POST', body:buildForm(state.image, config), signal });
    const roundtrip = performance.now() - started;
    const canvas = el('image-canvas');
    canvas.getContext('2d').drawImage(state.imageBitmap, 0, 0);
    drawFaces(canvas.getContext('2d'), result, canvas.width, canvas.height);
    renderResult(result, roundtrip);
    recordResult(result, config, 'image', roundtrip);
    showMessage(`${result.faces.length} ${result.faces.length === 1 ? 'rosto detectado' : 'rostos detectados'} na imagem.`, 'success');
  }));
  el('benchmark').addEventListener('click', () => runOperation(el('benchmark'), 'Comparando…', async signal => {
    const config = configuration();
    const form = buildForm(state.image, config);
    form.append('iterations', '3');
    const payload = await request('/benchmark', { method:'POST', body:form, signal, timeout:120000 });
    renderBenchmark(payload, config);
    showMessage('Comparação concluída na mesma imagem, com três medições por escala.', 'success');
  }));
  el('export').addEventListener('click', exportRecords);
  el('clear-records').addEventListener('click', () => { state.records = []; renderMetrics(); showMessage('Medições desta sessão limpas.'); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state.stream) stopLive(); });
  video.addEventListener('resize', () => { if (video.videoWidth && video.videoHeight) el('camera-stage').style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`; });
  window.addEventListener('pagehide', () => { stopLive(); state.operationController?.abort(); clearEnroll(); clearImage(); });
  navigator.mediaDevices?.addEventListener?.('devicechange', () => mediaDevices().catch(() => {}));
  try {
    const session = JSON.parse(sessionStorage.getItem('aegis.demo.session') || 'null');
    if (typeof session?.institution === 'string' && session.institution.trim() && session.institution.length <= 80) el('avatar').textContent = session.institution.trim().split(/\s+/).slice(0,2).map(word => word[0]).join('').toUpperCase();
  } catch {}
  mediaDevices().catch(() => {});
  health();
})();
