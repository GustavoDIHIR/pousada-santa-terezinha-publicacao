import './demo.js?v=935aa02d';
const content = document.querySelector('#account-content');
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dates = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'UTC' });
let user = null;
let creating = false;
let busy = false;
let revision = 0;
let pendingRefresh;
let includeReservations = false;
let reservationRequest = 0;
let currentPanel = 'principal';
let reservationTotal = 0;

if (content) content.innerHTML = `
  <p id="account-status" class="status" role="status"></p>
  <div id="account-guest" class="account-access">
    <aside class="access-story" aria-label="Sobre a pousada">
      <p class="eyebrow" data-property-name>Pousada Santa Terezinha do Menino Jesus</p>
      <p class="access-headline">Sua estadia em frente à <em>Canção Nova</em></p>
      <p class="access-description">Hospedagem familiar, a poucos passos do portão principal.</p>
      <figure><img src="./pousada-fachada-azul.webp" width="680" height="510" alt="Fachada azul da Pousada Santa Terezinha"><figcaption>Fachada da Pousada Santa Terezinha</figcaption></figure>
      <div class="access-values"><span>Quartos privativos</span><span>Vagas compartilhadas</span><span>Minha conta</span></div>
    </aside>
    <section class="access-form-side" aria-labelledby="account-form-title">
     <div class="access-form-wrap">
      <div class="access-icon" aria-hidden="true"><svg class="icon" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/></svg></div>
      <h1 id="account-form-title">Entrar na conta</h1>
      <p id="account-form-intro">Entre com seu e-mail e senha para acessar sua conta.</p>
      <form id="account-login" method="post">
        <label>E-mail<input name="email" type="email" autocomplete="username" maxlength="254" required></label>
        <label data-registration hidden>Nome completo<input name="fullName" autocomplete="name" maxlength="120" disabled></label>
        <label data-registration hidden>Telefone para contato<input name="phone" type="tel" autocomplete="tel" maxlength="32" disabled></label>
        <label>Senha<span class="access-password"><input name="password" type="password" autocomplete="current-password" maxlength="128" required><button type="button" id="account-show-password" aria-label="Mostrar senha" aria-pressed="false"><svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path data-password-slash d="m3 3 18 18" hidden/></svg></button></span></label>
        <p id="account-password-help" class="muted" hidden>Use pelo menos 12 caracteres. Na demonstração, use um e-mail de teste e uma senha exclusiva.</p>
        <p id="account-login-error" class="access-error" role="alert" hidden></p>
        <button id="account-submit">Entrar</button>
      </form>
      <button id="account-switch" type="button" class="account-link">Criar conta</button>
      <p class="access-privacy"><a href="#privacidade">Como usamos seus dados</a></p>
      <p class="access-security">Acompanhe suas reservas e comprovantes em Minha conta.</p>
     </div>
    </section>
  </div>
  <section id="account-client" hidden aria-labelledby="account-client-title">
    <div class="account-heading">
      <div><h2 id="account-client-title" tabindex="-1">Área do cliente</h2><p id="account-email"></p></div>
      <button type="button" class="account-secondary" data-account-logout>Sair da conta</button>
    </div>
    <nav class="account-nav account-client-nav" aria-label="Menu da conta">
      <button type="button" data-account-view="principal" aria-controls="account-principal-panel" aria-current="page">Principal</button>
      <button type="button" data-account-view="dados" aria-controls="conta-dados">Meus dados</button>
      <button type="button" data-account-view="reservas" aria-controls="conta-reservas">Minhas reservas</button>
      <button type="button" data-account-view="codigo" aria-controls="account-code-panel">Consultar por código</button>
      <a href="#inicio">Voltar ao início</a>
    </nav>
    <section class="account-section" id="account-principal-panel" data-account-panel="principal" aria-labelledby="account-welcome-title">
      <h3 id="account-welcome-title">Bem-vindo à sua conta</h3>
      <p>Confira seus dados de contato e acompanhe suas hospedagens.</p>
      <div class="account-overview">
        <article><h4>Seus dados</h4><p id="account-profile-summary"></p><button type="button" class="account-link" data-account-view="dados">Conferir meus dados →</button></article>
        <article><h4>Suas reservas</h4><p id="account-reservation-summary">Consulte suas reservas e comprovantes.</p><button type="button" class="account-link" data-account-view="reservas">Acompanhar reservas →</button></article>
        <article><h4>Tem um código?</h4><p>Encontre uma reserva para registrar o check-in ou baixar o comprovante.</p><button type="button" class="account-link" data-account-view="codigo">Consultar uma reserva →</button></article>
      </div>
    </section>
    <section class="account-section" id="conta-reservas" data-account-panel="reservas" hidden aria-labelledby="account-reservations-title">
      <h3 id="account-reservations-title">Minhas reservas</h3>
      <p class="muted">Aqui aparecem suas solicitações e reservas feitas com esta conta.</p>
      <p id="account-reservation-status" class="status" role="status"></p>
      <div id="account-reservation-list"></div>
    </section>
    <section class="account-section" id="conta-dados" data-account-panel="dados" hidden aria-labelledby="account-data-title">
      <h3 id="account-data-title">Meus dados</h3>
      <p id="account-profile-help">O nome identifica seu comprovante. O telefone é usado para contato sobre a estadia.</p>
      <form id="account-profile-form" method="post" aria-describedby="account-profile-help">
        <label>Nome completo<input name="fullName" autocomplete="name" maxlength="120" required></label>
        <label>Telefone para contato<input name="phone" type="tel" autocomplete="tel" maxlength="32" required></label>
        <button>Salvar dados de contato</button>
      </form>
      <p id="account-profile-status" class="status" role="status"></p>
      <button type="button" class="account-secondary" id="account-download">Baixar meus dados</button>
      <details class="account-delete">
        <summary>Excluir minha conta</summary>
        <p>A exclusão remove seus dados de contato, suas credenciais e o vínculo com suas reservas. Guarde os códigos dos comprovantes antes de continuar.</p>
        <form id="account-delete-form" method="post">
          <label>Confirme sua senha<input name="password" type="password" autocomplete="current-password" maxlength="128" required></label>
          <button class="account-danger">Excluir conta definitivamente</button>
        </form>
        <p id="account-delete-status" class="status" role="status"></p>
      </details>
    </section>
    <section class="account-section" id="account-code-panel" data-account-panel="codigo" hidden aria-labelledby="account-code-title">
      <h3 id="account-code-title">Consultar por código</h3>
      <p>Informe o código recebido na confirmação. Reservas vinculadas a outra conta exigem o acesso do respectivo titular.</p>
      <form id="account-code-lookup" method="post">
        <label>Código da reserva<input name="code" maxlength="18" required autocomplete="off" spellcheck="false"></label>
        <button>Consultar reserva</button>
      </form>
      <p id="account-code-status" class="status" role="status"></p>
      <div id="account-code-output"></div>
    <section class="surface supporting-info booking-help" aria-labelledby="account-booking-help-title">
      <h2 id="account-booking-help-title">Dúvidas sobre sua estadia</h2>
      <details open><summary>Onde encontro meu código?</summary><p>O site mostra o código assim que você envia a solicitação. O comprovante fica disponível após a pousada confirmar a reserva. Guarde-o para abrir sua reserva novamente.</p></details>
      <details open><summary>O que aparece no comprovante?</summary><p>O quarto escolhido, as datas de entrada e saída, a quantidade de hóspedes, a opção de café da manhã, o valor simulado e o status da reserva.</p></details>
      <details open><summary>O check-in online altera o horário de chegada?</summary><p>Entrada presencial: <span data-property-checkin>horário a confirmar</span>. O registro online é uma etapa antecipada da demonstração.</p></details>
      <details open><summary>Posso chegar antes ou sair mais tarde?</summary><p>A pousada informa que entrada antecipada e saída estendida dependem de disponibilidade e têm cobrança adicional na hospedagem real.</p></details>
      <details open><summary>Quais orientações devo conferir antes de viajar?</summary><p>Tenha em mãos os documentos dos hóspedes. A pousada informa que animais não são permitidos nas áreas sociais nem nos quartos.</p></details>
      <details open><summary>A reserva é cobrada?</summary><p>Esta versão é de demonstração. O total apresentado é simulado e o site não solicita pagamento.</p></details>
    </section>
    </section>
  </section>
  <section id="account-admin" class="surface account-admin" hidden aria-labelledby="account-admin-title">
    <div class="account-heading">
      <div><h2 id="account-admin-title" tabindex="-1">Minha conta</h2><p id="account-admin-email"></p></div>
      <button type="button" class="account-secondary" data-account-logout>Sair da conta</button>
    </div>
    <p class="account-section">Sua conta tem acesso à administração da pousada. Você também pode navegar pelo site.</p>
    <nav class="account-nav" aria-label="Menu da conta administrativa">
      <a href="#inicio">Voltar ao início</a>
      <a class="button" href="#admin">Administração</a>
      <button type="button" id="admin-edit-own-profile">Meus dados</button>
    </nav>
  </section>`;

const find = selector => content?.querySelector(selector);

async function request(endpoint, data = {}) {
  const response = await fetch('/api/account/' + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload.error || 'Não foi possível concluir a solicitação.');
    error.status = response.status;
    throw error;
  }
  return payload;
}

export async function downloadReceipt(code) {
  const response = await fetch('/api/receipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
    cache: 'no-store',
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || 'Não foi possível baixar o comprovante.');
  }
  if (!response.headers.get('content-type')?.startsWith('application/pdf')) {
    throw new Error('O comprovante recebido não é um PDF.');
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = 'comprovante-reserva-' + code.replace(/[^a-z0-9-]/gi, '') + '.pdf';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function writeStatus(selector, text) {
  find(selector).textContent = text;
  if(selector==='#account-status'){
    const error=find('#account-login-error');error.textContent=user?'':text;error.hidden=!error.textContent;
  }
}

function make(tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}

function showPanel(panel) {
  currentPanel = ['principal', 'dados', 'reservas', 'codigo'].includes(panel) ? panel : 'principal';
  for (const section of content.querySelectorAll('[data-account-panel]')) {
    section.hidden = section.dataset.accountPanel !== currentPanel;
  }
  for (const button of content.querySelectorAll('.account-client-nav [data-account-view]')) {
    if (button.dataset.accountView === currentPanel) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
}

function lookupCode(code) {
  showPanel('codigo');
  const form = find('#account-code-lookup');
  form.elements.code.value = code;
  document.dispatchEvent(new CustomEvent('account-code-lookup', { detail: { code } }));
}

export function openAccountPanel(panel) {
  if (user?.role === 'client') showPanel(panel);
}

export function openAccountReservation(code) {
  if (user?.role === 'client') lookupCode(code);
}

function renderReservations(reservations) {
  const list = find('#account-reservation-list');
  list.replaceChildren();
  reservationTotal = reservations.length;
  find('#account-reservation-summary').textContent = reservationTotal
    ? reservationTotal + (reservationTotal === 1 ? ' reserva vinculada à sua conta.' : ' reservas vinculadas à sua conta.')
    : 'Você ainda não tem reservas vinculadas à conta.';
  if (!reservations.length) {
    list.append(make('p', 'Nenhuma reserva nesta conta.', 'account-empty'));
    return;
  }
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
  for (const { code, offer, checkedIn, cancelled, approval } of reservations) {
    const row = make('article', '', 'account-reservation');
    const info = make('div', '');
    const status = cancelled ? 'Cancelada' : offer.departure <= today ? 'Encerrada' : checkedIn ? 'Check-in registrado' : approval === 'pending' ? 'Aguardando verificação' : 'Confirmada';
    const period = dates.format(new Date(offer.arrival)) + ' a ' + dates.format(new Date(offer.departure));
    const guests = offer.adults + offer.children;
    const occupancy = guests + (guests === 1 ? ' hóspede' : ' hóspedes');
    info.append(make('h4', offer.name), make('p', period + ' · ' + occupancy + ' · ' + money.format(offer.total / 100)));
    info.append(make('code', code));
    const actions = make('div', '', 'account-reservation-actions');
    actions.append(make('span', status, 'tag'));
    if (approval !== 'pending' && !cancelled) {
      const button = make('button', 'Baixar comprovante', 'account-secondary');
      button.type = 'button';
      button.onclick = () => act(button, () => downloadReceipt(code), '#account-reservation-status');
      actions.append(button);
    }
    if (approval !== 'pending' && !checkedIn && !cancelled && offer.departure > today) {
      const button = make('button', 'Fazer check-in', 'account-secondary');
      button.type = 'button';
      button.onclick = () => lookupCode(code);
      actions.append(button);
    }
    row.append(info, actions);
    list.append(row);
  }
}

async function loadReservations() {
  const version = ++reservationRequest;
  writeStatus('#account-reservation-status', 'Carregando suas reservas…');
  try {
    const { reservations } = await request('reservations');
    if (version !== reservationRequest || user?.role !== 'client') return;
    renderReservations(reservations);
    writeStatus('#account-reservation-status', '');
  } catch (error) {
    if (version !== reservationRequest || user?.role !== 'client') return;
    if (error.status === 401) setUser(null, 'Sua sessão terminou. Entre novamente.');
    else writeStatus('#account-reservation-status', error.message);
  }
}

function setUser(next, message = '', focus = false, withReservations = false) {
  const previous = user;
  user = next;
  const isClient = user?.role === 'client';
  const isAdmin = user?.role === 'admin';
  find('#account-guest').hidden = !!user;
  find('#account-client').hidden = !isClient;
  find('#account-admin').hidden = !isAdmin;
  find('#account-admin-email').textContent = isAdmin ? user.email : '';
  const dataPanel = find('#conta-dados');
  (isAdmin ? find('#account-admin') : find('#account-client')).append(dataPanel);
  if (isAdmin && previous?.email !== user.email) dataPanel.hidden = true;
  dataPanel.querySelector('.account-delete').hidden = isAdmin;
  find('#account-download').hidden = isAdmin;
  find('#account-email').textContent = isClient ? user.email : '';
  find('#account-welcome-title').textContent = isClient && user.fullName ? 'Olá, ' + user.fullName : 'Bem-vindo à sua conta';
  find('#account-profile-summary').textContent = isClient
    ? [user.fullName || 'Complete seu nome', user.phone || 'Complete seu telefone'].join(' · ')
    : '';
  if (!user || previous?.email !== user.email) {
    showPanel('principal');
    find('#account-code-lookup').reset();
    find('#account-code-output').replaceChildren();
    writeStatus('#account-code-status', '');
    find('#account-reservation-summary').textContent = 'Consulte suas reservas e comprovantes.';
  }
  const profile = find('#account-profile-form');
  if (!isClient || previous?.email !== user.email || previous?.fullName !== user.fullName || previous?.phone !== user.phone) {
    profile.elements.fullName.value = user ? user.fullName || '' : '';
    profile.elements.phone.value = user ? user.phone || '' : '';
    writeStatus('#account-profile-status', '');
  }
  writeStatus('#account-status', message);
  document.dispatchEvent(new CustomEvent('account-session', { detail: user }));
  if (!isClient || previous?.email !== user.email) {
    reservationRequest++;
    find('#account-reservation-list').replaceChildren();
    writeStatus('#account-reservation-status', '');
  }
  if (isClient && withReservations) void loadReservations();
  if (focus) {
    if (isClient) find('#account-client-title').focus();
    else if (isAdmin) find('#account-admin-title').focus();
    else find('#account-login input').focus();
  }
}

export function refreshAccount(withReservations = true) {
  if (!content || busy) return Promise.resolve();
  includeReservations ||= withReservations;
  if (pendingRefresh) return pendingRefresh;
  const version = revision;
  pendingRefresh = request('session').then(payload => {
    if (version === revision) setUser(payload.user, '', false, includeReservations);
  }).catch(error => {
    if (version === revision) writeStatus('#account-status', error.message);
  }).finally(() => { pendingRefresh = undefined; includeReservations = false; });
  return pendingRefresh;
}

export async function logoutAccount() {
  if (!content) return;
  await request('logout');
  revision++;
  if (['#conta-reservas', '#conta-dados'].includes(location.hash)) history.replaceState(null, '', '#conta');
  setUser(null, 'Você saiu da conta.', location.hash === '#conta');
}

async function act(button, action, statusSelector = '#account-status') {
  if (busy) return;
  busy = true;
  revision++;
  button.disabled = true;
  writeStatus(statusSelector, '');
  try { await action(); }
  catch (error) { writeStatus(statusSelector, error.message); }
  finally { button.disabled = false; busy = false; }
}

if (content) {
  const login = find('#account-login');
  const passwordToggle=find('#account-show-password');
  function concealPassword(){login.elements.password.type='password';passwordToggle.setAttribute('aria-label','Mostrar senha');passwordToggle.setAttribute('aria-pressed','false');passwordToggle.querySelector('[data-password-slash]').setAttribute('hidden','');}
  passwordToggle.onclick=()=>{const visible=login.elements.password.type==='password';login.elements.password.type=visible?'text':'password';passwordToggle.setAttribute('aria-label',visible?'Ocultar senha':'Mostrar senha');passwordToggle.setAttribute('aria-pressed',String(visible));passwordToggle.querySelector('[data-password-slash]').toggleAttribute('hidden',!visible);};
  login.addEventListener('input',()=>login.elements.password.removeAttribute('aria-invalid'));
  const deleteForm = find('#account-delete-form');
  const profile = find('#account-profile-form');
  find('#admin-edit-own-profile').onclick = () => { find('#conta-dados').hidden = !find('#conta-dados').hidden; };
  for (const button of content.querySelectorAll('[data-account-view]')) {
    button.onclick = () => showPanel(button.dataset.accountView);
  }
  find('#account-code-lookup').onsubmit = event => {
    event.preventDefault();
    lookupCode(event.target.elements.code.value.trim());
  };

  function setCreating(next) {
    creating = next;
    const password = login.elements.password;
    password.autocomplete = creating ? 'new-password' : 'current-password';
    password.minLength = creating ? 12 : 1;
    if (creating) password.setAttribute('aria-describedby', 'account-password-help');
    else password.removeAttribute('aria-describedby');
    password.value = '';
    password.removeAttribute('aria-invalid');concealPassword();
    for (const label of login.querySelectorAll('[data-registration]')) {
      const input = label.querySelector('input');
      label.hidden = !creating;
      input.required = creating;
      input.disabled = !creating;
      if (!creating) input.value = '';
    }
    find('#account-password-help').hidden = !creating;
    writeStatus('#account-form-title', creating ? 'Criar conta' : 'Entrar na conta');
    writeStatus('#account-form-intro', creating ? 'Cadastre seus dados de contato e escolha uma senha para acompanhar suas reservas.' : 'Entre com seu e-mail e senha para acessar sua conta.');
    writeStatus('#account-submit', creating ? 'Criar conta' : 'Entrar');
    writeStatus('#account-switch', creating ? 'Já tenho conta' : 'Criar conta');
  }

  find('#account-switch').onclick = () => {
    if (busy) return;
    setCreating(!creating);
    writeStatus('#account-status', '');
    login.elements.email.focus();
  };

  login.onsubmit = event => {
    event.preventDefault();
    void act(event.submitter, async () => {
      const credentials = { email: login.elements.email.value, password: login.elements.password.value };
      if (creating) {
        credentials.fullName = login.elements.fullName.value;
        credentials.phone = login.elements.phone.value;
      }
      concealPassword();writeStatus('#account-submit',creating?'Criando conta…':'Verificando acesso…');
      try {
        const response = await request(creating ? 'register' : 'login', credentials);
        login.reset();
        setCreating(false);
        setUser(response.user, '', true, true);
      } catch(error){if(error.status===401&&!creating){login.elements.password.setAttribute('aria-invalid','true');login.elements.password.focus();}throw error;} finally { login.elements.password.value = '';concealPassword();writeStatus('#account-submit',creating?'Criar conta':'Entrar'); }
    });
  };

  for (const button of content.querySelectorAll('[data-account-logout]')) {
    button.onclick = () => act(button, logoutAccount);
  }

  profile.onsubmit = event => {
    event.preventDefault();
    void act(event.submitter, async () => {
      const { user: updated } = await request('profile', {
        fullName: profile.elements.fullName.value,
        phone: profile.elements.phone.value,
      });
      setUser(updated);
      writeStatus('#account-profile-status', 'Dados de contato salvos.');
    }, '#account-profile-status');
  };

  deleteForm.onsubmit = event => {
    event.preventDefault();
    void act(event.submitter, async () => {
      try {
        await request('delete', { password: deleteForm.elements.password.value });
        deleteForm.closest('details').open = false;
        history.replaceState(null, '', '#conta');
        setUser(null, 'Conta excluída.', true);
      } finally { deleteForm.reset(); }
    }, '#account-delete-status');
  };

  find('#account-download').onclick = event => act(event.currentTarget, async () => {
    const { reservations } = await request('reservations');
    const data = {
      email: user.email,
      fullName: user.fullName || null,
      phone: user.phone || null,
      reservations: reservations.map(({ code, checkedIn, cancelled, offer, purchaseNumber, confirmedAt, checkedInAt }) => {
        const { key, ...stay } = offer;
        return { code, checkedIn, cancelled, purchaseNumber, confirmedAt, checkedInAt, ...stay };
      }),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'meus-dados-pousada.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    writeStatus('#account-status', 'Cópia dos dados preparada.');
  });
}
