'use strict';

(() => {
  const form = document.getElementById('login-form');
  const institution = document.getElementById('institution');
  const password = document.getElementById('password');
  const error = document.getElementById('login-error');
  const modal = document.getElementById('modal');
  const shared = globalThis.AegisShared;
  let previousFocus = null;

  function clearError() {
    error.textContent = '';
    for (const input of [institution, password]) {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    }
  }

  function setError(message, input) {
    clearError();
    error.textContent = message;
    if (input) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', 'login-error');
      input.focus({ preventScroll: true });
    }
  }

  if (!shared) {
    setError('Não foi possível carregar a aplicação. Atualize a página para tentar novamente.');
    document.querySelectorAll('[type="submit"], [data-action="demo-login"]').forEach(button => { button.disabled = true; });
    form.addEventListener('submit', event => event.preventDefault());
    return;
  }

  const legacy = location.hash.replace(/^#\/?/, '').split('?')[0];
  if (legacy && legacy !== 'login' && Object.hasOwn(shared.pageFiles, legacy)) {
    location.replace(shared.pageHref(legacy));
    return;
  }

  function doLogin(name, secret) {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Informe o nome da instituição.', institution);
      return;
    }
    if (secret !== 'AEGIS2026') {
      setError('Senha incorreta. Para a demonstração, utilize AEGIS2026.', password);
      return;
    }
    try {
      sessionStorage.setItem(shared.SESSION_KEY, JSON.stringify({ institution: trimmed.slice(0, 80) }));
    } catch {
      setError('O navegador bloqueou a sessão. Permita o armazenamento deste site para entrar.');
      return;
    }
    location.assign(shared.pageHref('dashboard'));
  }

  function closeModal() {
    if (modal.open) modal.close();
  }

  form.addEventListener('input', clearError);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (form.reportValidity()) doLogin(institution.value, password.value);
  });

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    switch (button.dataset.action) {
      case 'toggle-password': {
        const visible = password.type === 'password';
        password.type = visible ? 'text' : 'password';
        button.setAttribute('aria-label', visible ? 'Ocultar senha' : 'Mostrar senha');
        button.setAttribute('aria-pressed', String(visible));
        button.innerHTML = shared.icon(visible ? 'eyeoff' : 'eye');
        break;
      }
      case 'demo-login':
        doLogin('CIMOL', 'AEGIS2026');
        break;
      case 'open-credentials':
        previousFocus = button;
        modal.showModal();
        break;
      case 'close-modal':
        closeModal();
        break;
    }
  });

  modal.addEventListener('click', event => {
    if (event.target !== modal) return;
    const bounds = modal.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeModal();
  });
  modal.addEventListener('close', () => previousFocus?.isConnected && previousFocus.focus({ preventScroll: true }));
  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      closeModal();
      clearError();
    }
  });
})();
