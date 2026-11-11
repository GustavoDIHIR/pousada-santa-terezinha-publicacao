import './demo.js?v=829487a0';
import {paymentLabel} from './reservation-utils.js?v=829487a0';
import { logoutAccount, refreshAccount } from './account.js?v=829487a0';

const admin = document.querySelector('#admin-content');

if (admin) {
  admin.innerHTML = `
    <div class="surface admin-login" id="admin-access">
      <h2>Acesso administrativo</h2><p>Acesse Minha conta com o e-mail e a senha de uma conta autorizada.</p>
      <a class="button" href="#conta">Acessar Minha conta</a>
    </div>
    <p id="admin-load-status" class="status admin-status" role="status"></p>
    <div id="admin-dashboard" class="admin-shell" hidden>
      <aside class="admin-sidebar">
        <div class="admin-brand"><span>Painel de gestão</span><strong data-property-name>Pousada Santa Terezinha</strong></div>
        <nav aria-label="Áreas da administração">
          <button type="button" data-admin-view="rooms" aria-current="page" aria-pressed="true"><span>01</span>Catálogo de quartos</button>
          <button type="button" data-admin-view="rates" aria-pressed="false"><span>02</span>Tarifas e planos</button>
          <button type="button" data-admin-view="reservations" aria-pressed="false"><span>03</span>Reservas</button>
          <button type="button" data-admin-view="receipts" aria-pressed="false"><span>04</span>Comprovantes</button>
        </nav>
        <div class="admin-sidebar-footer"><a href="#inicio">Voltar ao site ↗</a><button type="button" class="admin-secondary" id="admin-logout">Sair da conta</button></div>
      </aside>
      <div class="admin-main">
        <div class="admin-topline"><span>ADMINISTRAÇÃO DA POUSADA</span><span>Ambiente de demonstração</span></div>
        <div class="admin-section-heading"><div><h2 id="admin-view-title">Catálogo de quartos</h2><p id="admin-view-description">Organize as acomodações, as fotos e a publicação no site.</p></div><button type="button" id="admin-add-room">+ Novo quarto</button></div>
        <div class="admin-stats" aria-label="Resumo da gestão">
          <div><strong id="admin-total-rooms">0</strong><span>quartos cadastrados</span></div>
          <div><strong id="admin-active-rooms">0</strong><span>quartos publicados</span></div>
          <div><strong id="admin-total-reservations">0</strong><span>reservas em andamento</span></div>
        </div>
        <p id="catalog-admin-status" class="status admin-status" role="status"></p>
        <div id="admin-catalog-tools" class="admin-tools">
          <label class="admin-search">Pesquisar quartos<input type="search" id="admin-filter" placeholder="Nome, camas ou comodidade"></label>
          <label>Tipo<select id="admin-type-filter"><option value="">Todos os tipos</option><option value="private">Privativos</option><option value="shared">Compartilhados</option></select></label>
          <label>Publicação<select id="admin-publication-filter"><option value="">Todos</option><option value="active">Publicados</option><option value="hidden">Ocultos</option></select></label>
        </div>
        <section id="admin-rooms" data-admin-panel="rooms" aria-label="Catálogo de quartos"><div id="admin-room-list" class="admin-table-scroll"></div></section>
        <section id="admin-rates" data-admin-panel="rates" hidden aria-label="Tarifas e planos"><p class="admin-section-note">Valores por quarto e por diária. Cadastre nomes livres e valores por diária para cada plano.</p><div id="admin-rate-list" class="admin-table-scroll"></div></section>
        <section id="admin-reservations" data-admin-panel="reservations" hidden aria-label="Reservas">
          <div class="admin-tools"><label class="admin-search">Pesquisar reserva<input type="search" id="admin-reservation-filter" placeholder="Código ou nome do quarto"></label><label>Status<select id="admin-reservation-state"><option value="">Todos os status</option><option value="pending">Aguardando verificação</option><option value="confirmed">Confirmadas</option><option value="checkedin">Check-in registrado</option><option value="ended">Encerradas</option><option value="cancelled">Canceladas</option></select></label></div>
          <div id="admin-reservation-list" class="admin-table-scroll"></div>
        </section>
        <section id="admin-receipts" data-admin-panel="receipts" hidden aria-label="Comprovantes">
          <p class="admin-section-note">Registre a forma de pagamento e anexe os PDFs da pousada. O cliente recebe um único comprovante após o check-in.</p>
          <div class="admin-tools"><label class="admin-search">Pesquisar comprovante<input type="search" id="admin-receipt-filter" placeholder="Código da reserva ou quarto"></label></div>
          <div id="admin-receipt-list" class="admin-table-scroll"></div>
        </section>
      </div>
    </div>
    <dialog id="admin-delete-room-dialog" aria-labelledby="admin-delete-room-title"><div class="admin-modal-heading"><h2 id="admin-delete-room-title">Excluir quarto?</h2><form method="dialog"><button class="admin-close" aria-label="Fechar exclusão">×</button></form></div><p id="admin-delete-room-note"></p><p id="admin-delete-room-status" class="status" role="status"></p><p>O quarto sairá do catálogo e da gestão. O histórico das reservas será preservado.</p><div class="admin-dialog-buttons"><button type="button" class="admin-secondary" id="admin-keep-room">Manter quarto</button><button type="button" id="admin-confirm-delete-room">Excluir quarto</button></div></dialog>
    <dialog id="admin-room-dialog" class="admin-room-dialog" aria-labelledby="admin-editor-title">
      <div class="admin-modal-heading"><div><span class="admin-eyebrow">Catálogo de acomodações</span><h2 id="admin-editor-title">Novo quarto</h2></div><form method="dialog"><button class="admin-close" aria-label="Fechar edição do quarto">×</button></form></div>
      <form id="admin-room-editor">
        <nav class="admin-editor-tabs" aria-label="Seções do quarto">
          <button type="button" data-editor-view="information" aria-current="page">Informações</button><button type="button" data-editor-view="photos">Fotos</button><button type="button" data-editor-view="rates">Planos e valores</button>
        </nav>
        <div class="admin-editor-body">
          <section data-editor-panel="information"><h3>Informações da acomodação</h3><p class="admin-section-note">Estes dados aparecem na ficha do quarto no site.</p>
            <div class="admin-fields">
              <label class="admin-wide">Nome do quarto<input name="name" required maxlength="100" placeholder="Ex.: Suíte casal"></label>
              <label>Tipo de acomodação<select name="type"><option value="private">Privativo</option><option value="shared">Compartilhado</option></select></label>
              <label>Capacidade de hóspedes<input name="capacity" type="number" min="1" max="12" required></label>
              <label class="admin-wide">Camas disponíveis<input name="beds" required maxlength="180" placeholder="Ex.: 1 cama de casal e 2 de solteiro"></label>
              <label class="admin-wide">Descrição<textarea name="description" rows="4" maxlength="1200" required></textarea></label>
              <label class="admin-wide">Comodidades<textarea name="amenities" rows="4" maxlength="976" placeholder="Uma por linha. Ex.: Wi-Fi"></textarea></label>
            </div>
            <label class="admin-inline admin-publication"><input name="active" type="checkbox" checked><span>Publicado no catálogo<small>Aceitar novas reservas para esta acomodação.</small></span></label>
          </section>
          <section data-editor-panel="photos" hidden><h3>Galeria do quarto</h3><p class="admin-section-note">Selecione de uma a cinco imagens. A foto de capa aparece primeiro no catálogo.</p><p id="admin-photo-status" class="status" role="status"></p><label class="admin-cover-field">Foto de capa<select name="cover" required></select></label><label>Carregar fotos<input type="file" id="admin-upload-photos" accept="image/jpeg,image/png,image/webp" multiple></label><p class="admin-section-note">Até 5 fotos por quarto. JPEG, PNG ou WebP de até 300 KB cada.</p><div id="admin-photo-list"></div></section>
          <section data-editor-panel="rates" hidden><h3>Planos e valores por diária</h3><p class="admin-section-note">Cadastre o nome e o valor total de cada opção. O cliente escolhe o plano que preferir.</p><div id="admin-custom-plans"></div><button type="button" class="admin-secondary" id="admin-add-plan">+ Adicionar plano</button><div hidden><select name="meal"><option value="optional">Opcional</option><option value="included">Incluído</option><option value="unavailable">Sem café</option></select><label id="admin-nightly-field"><input name="nightly"></label><label id="admin-breakfast-field"><input name="nightlyWithBreakfast"></label><p id="admin-rate-note"></p></div></section>
        </div>
        <div class="admin-editor-footer"><p id="admin-editor-status" class="status" role="status"></p><div class="admin-dialog-buttons"><button type="button" class="admin-secondary" data-close-room>Fechar</button><button type="submit">Salvar quarto</button></div></div>
      </form>
    </dialog>
    <dialog id="admin-review-dialog" aria-labelledby="admin-review-title">
      <div class="admin-modal-heading"><h2 id="admin-review-title">Verificar dados da reserva</h2><form method="dialog"><button class="admin-close" aria-label="Fechar conferência da reserva">×</button></form></div>
      <p id="admin-review-status" class="status" role="status"></p><div id="admin-review-content"></div>
      <div class="admin-dialog-buttons"><button type="button" class="admin-secondary" id="admin-review-close">Fechar</button><button type="button" id="admin-review-confirm" hidden>Confirmar reserva após conferência</button></div>
    </dialog>
    <dialog id="admin-receipt-dialog" aria-labelledby="admin-receipt-title">
      <div class="admin-modal-heading"><h2 id="admin-receipt-title">Comprovante da reserva e compra</h2><form method="dialog"><button class="admin-close" aria-label="Fechar comprovante">×</button></form></div>
      <p id="admin-receipt-code" class="admin-document-code"></p><p id="admin-receipt-status" class="status" role="status"></p>
      <div id="admin-receipt-fields" hidden>
        <form id="admin-payment-form" method="post"><label>Forma de pagamento informada<select name="paymentMethod"><option value="">Não informada</option><option value="pix">Pix</option><option value="credit">Cartão de crédito</option><option value="debit">Cartão de débito</option><option value="cash">Dinheiro</option><option value="transfer">Transferência</option></select></label><p>A demonstração registra a modalidade e não realiza cobranças.</p></form>
        <h3>Documentos da pousada</h3><p>Anexe PDFs destinados ao titular. Eles serão incluídos no mesmo comprovante.</p><ul id="admin-attachment-list"></ul>
        <form id="admin-attachment-form" method="post"><label>Documento PDF<input type="file" name="file" multiple accept="application/pdf,.pdf" aria-describedby="admin-attachment-limit"></label><p id="admin-attachment-limit">Até três documentos, com 2 MB por arquivo.</p></form>
      </div>
      <p class="admin-section-note">A prévia e a versão final reúnem todos os anexos em um único PDF. Alterações só são aplicadas ao salvar.</p><div class="admin-dialog-buttons"><button type="button" class="admin-secondary" id="admin-preview-receipt">Conferir via do cliente (PDF)</button><button type="button" id="admin-save-receipt">Salvar comprovante e anexos</button></div>
    </dialog>
    <dialog id="admin-cancel-dialog" aria-labelledby="admin-cancel-title"><div class="admin-modal-heading"><h2 id="admin-cancel-title">Cancelar reserva?</h2><form method="dialog"><button class="admin-close" aria-label="Fechar cancelamento">×</button></form></div><p id="admin-cancel-note"></p><div class="admin-dialog-buttons"><button type="button" class="admin-secondary" id="admin-keep-reservation" autofocus>Manter reserva</button><button type="button" id="admin-confirm-cancel">Confirmar cancelamento</button></div></dialog>
  `;

  const find = selector => admin.querySelector(selector);
  const access = find('#admin-access');
  const editor = find('#admin-room-editor');
  const dashboard = find('#admin-dashboard');
  const fields = editor.elements;
  const status = find('#catalog-admin-status');
  const loadStatus = find('#admin-load-status');
  const editorStatus = find('#admin-editor-status');
  const roomDialog = find('#admin-room-dialog');
  const cancelDialog = find('#admin-cancel-dialog');
  const confirmCancel = find('#admin-confirm-cancel');
  const receiptDialog = find('#admin-receipt-dialog');
  const reviewDialog=find('#admin-review-dialog');let reviewCode;let reviewRevision=0;
  const receiptStatus = find('#admin-receipt-status');
  const receiptFields = find('#admin-receipt-fields');
  const paymentForm = find('#admin-payment-form');
  const attachmentForm = find('#admin-attachment-form');
  const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const decimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dates = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'UTC' });
  const viewInformation = {
    rooms: ['Catálogo de quartos', 'Organize as acomodações, as fotos e a publicação no site.'],
    rates: ['Tarifas e planos', 'Confira os nomes e valores de todos os planos de cada quarto.'],
    reservations: ['Reservas', 'Acompanhe as datas, os hóspedes e o status de cada estadia.'],
    receipts: ['Comprovantes', 'Gerencie pagamentos informados e documentos anexos por reserva.'],
  };
  const photoNames = {
    './quarto-privativo-01.webp': 'Privativo ilustrativo 1', './quarto-privativo-02.webp': 'Privativo ilustrativo 2',
    './quarto-privativo-03.webp': 'Privativo ilustrativo 3', './quarto-privativo-04.webp': 'Privativo ilustrativo 4', './quarto-privativo-05.webp': 'Privativo ilustrativo 5', './quarto-privativo-06.webp': 'Privativo ilustrativo 6',
    './quarto-beliche-cinza.webp': 'Quarto cinza com beliche', './quarto-beliche-claro.webp': 'Quarto claro com beliche', './quarto-beliche-mar.webp': 'Quarto azul com cama e beliche',
    './quarto-beliche-parede-laranja.webp': 'Quarto de parede laranja com beliche',

  };
  let administrator = false;
  let dashboardVersion = 0;
  let editedRoom = '';
  let deleteRoomId = '';
  find('#admin-keep-room').onclick = () => find('#admin-delete-room-dialog').close();
  find('#admin-confirm-delete-room').onclick = event => action(event.currentTarget, async () => {
    await request({ deleteRoom: deleteRoomId }); find('#admin-delete-room-dialog').close(); renderAll(); status.textContent = 'Quarto excluído. Histórico preservado.'; document.dispatchEvent(new Event('catalog-updated'));
  }, find('#admin-delete-room-status'));
  let pendingCancel = '';
  let receiptCode = '';
  let currentView = 'rooms';
  let busy = false;
  let data = { rooms: [], reservations: [], images: [] };

  function element(tag, content, className) {
    const node = document.createElement(tag);
    if (content !== undefined) node.textContent = content;
    if (className) node.className = className;
    return node;
  }

  const normalize = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR');
  const price = cents => money.format(cents / 100);
  function parseMoney(value) {
    const text = value.trim().replace(/^R\$\s*/i, '');
    const brazilian = /^(?:\d+|\d{1,3}(?:\.\d{3})+),\d{1,2}$/;
    if (!(text.includes(',') ? brazilian.test(text) : /^\d+(?:\.\d{1,2})?$/.test(text))) throw new Error('Informe um valor válido, como 180,00 ou 1.250,50.');
    const normalized = text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text;
    const [whole, fraction = ''] = normalized.split('.');
    const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
    if (!Number.isSafeInteger(cents) || cents < 1 || cents > 10000000) throw new Error('A diária deve ficar entre R$ 0,01 e R$ 100.000,00.');
    return cents;
  }

  async function request(payload = {}) {
    const response = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 401) refreshAccount(false);
      throw new Error(result.error);
    }
    if (administrator) data = result;
  }

  async function action(button, work, feedback = status) {
    if (busy) return;
    busy = true;
    button.disabled = true;
    feedback.textContent = '';
    try { await work(); }
    catch (error) { feedback.textContent = error.message; }
    finally { busy = false; button.disabled = false; }
  }

  function setEditorView(view) {
    for (const panel of editor.querySelectorAll('[data-editor-panel]')) panel.hidden = panel.dataset.editorPanel !== view;
    for (const tab of editor.querySelectorAll('[data-editor-view]')) {
      if (tab.dataset.editorView === view) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    }
  }
  for (const tab of editor.querySelectorAll('[data-editor-view]')) tab.onclick = () => setEditorView(tab.dataset.editorView);
  editor.addEventListener('invalid', event => {
    const panel = event.target.closest('[data-editor-panel]');
    if (panel) setEditorView(panel.dataset.editorPanel);
  }, true);

  function showRates() {
    const included = fields.meal.value === 'included';
    const unavailable = fields.meal.value === 'unavailable';
    find('#admin-nightly-field').hidden = included;
    fields.nightly.disabled = included;
    fields.nightly.required = !included;
    find('#admin-breakfast-field').hidden = unavailable;
    fields.nightlyWithBreakfast.disabled = unavailable;
    fields.nightlyWithBreakfast.required = !unavailable;
    const legacy = data.rooms.find(room => room.id === editedRoom);
    find('#admin-rate-note').textContent = !included && !unavailable && !fields.nightlyWithBreakfast.value && legacy?.fee
      ? 'Tarifa anterior por pessoa. Defina o valor total da diária com café para atualizar este quarto.'
      : included ? 'O cliente verá apenas o plano com café da manhã incluso.'
        : unavailable ? 'O cliente verá apenas o plano sem café da manhã.' : 'O cliente poderá comparar e escolher entre os dois valores. O total com café deve ser igual ou maior que o valor sem café.';
  }
  fields.meal.onchange = showRates;
  for (const input of [fields.nightly, fields.nightlyWithBreakfast]) {
    input.oninput = () => { input.setCustomValidity(''); showRates(); };
    input.onblur = () => {
      if (!input.value.trim()) return;
      try { input.value = decimal.format(parseMoney(input.value) / 100); input.setCustomValidity(''); }
      catch (error) { input.setCustomValidity(error.message); }
    };
  }

  function addPlan(plan = { name: '', nightly: 0, breakfast: false }) {
    const list = find('#admin-custom-plans');
    if (list.children.length >= 10) return;
    const row = element('div', '', 'admin-plan-row');
    row.innerHTML = '<label>Nome do plano<input data-plan-name maxlength="80" required placeholder="Ex.: Diária com café"></label><label>Valor por diária (R$)<input data-plan-value inputmode="decimal" required placeholder="220,00"></label>';
    row.querySelector('[data-plan-value]').parentElement.firstChild.textContent = fields.type.value === 'shared' ? 'Valor por vaga / diária (R$)' : 'Valor por quarto / diária (R$)';
    row.querySelector('[data-plan-name]').value = plan.name;
    row.querySelector('[data-plan-value]').value = plan.nightly ? decimal.format(plan.nightly / 100) : '';
    row.append(button('Remover plano', () => row.remove())); list.append(row);
  }
  find('#admin-add-plan').onclick = () => addPlan();
  fields.type.onchange = () => { for (const input of editor.querySelectorAll('[data-plan-value]')) input.parentElement.firstChild.textContent = fields.type.value === 'shared' ? 'Valor por vaga / diária (R$)' : 'Valor por quarto / diária (R$)'; };
  find('#admin-upload-photos').onchange = async event => {
    const files = [...event.target.files];
    if (selectedPhotos().length + files.length > 5 || files.some(file => !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 300 * 1024)) { find('#admin-photo-status').textContent = 'Use até cinco fotos JPEG, PNG ou WebP de até 300 KB cada.'; event.target.value = ''; return; }
    for (const file of files) {
      const path = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
      const label = element('label', '', 'admin-photo');
      const image = element('img'); image.src = path; image.alt = file.name;
      const choice = element('input'); choice.type = 'checkbox'; choice.name = 'photos'; choice.value = path; choice.checked = true;
      label.append(image, choice, element('span', file.name), button('Remover foto', () => { label.remove(); showCover(); }));
      choice.onchange = () => showCover(); find('#admin-photo-list').append(label);
    }
    event.target.value = ''; showCover();
  };
  const selectedPhotos = () => [...editor.querySelectorAll('[name="photos"]:checked')].map(input => input.value);
  function showCover(cover = fields.cover.value) {
    const paths = selectedPhotos();
    fields.cover.replaceChildren(...paths.map(path => new Option(photoNames[path] || 'Foto carregada', path)));
    if (paths.includes(cover)) fields.cover.value = cover;
    find('#admin-photo-status').textContent = paths.length + ' de 5 fotos selecionadas.';
  }

  function openEditor(room, view = 'information') {
    editedRoom = room?.id || '';
    editor.reset();
    editorStatus.textContent = '';
    find('#admin-editor-title').textContent = room ? 'Editar ' + room.name : 'Novo quarto';
    for (const field of ['name', 'type', 'capacity', 'beds', 'description', 'meal']) if (room) fields[field].value = room[field];
    fields.nightly.value = room ? decimal.format(room.nightly / 100) : '';
    const withBreakfast = room?.nightlyWithBreakfast ?? (room?.meal === 'included' ? room.nightly : null);
    fields.nightlyWithBreakfast.value = withBreakfast ? decimal.format(withBreakfast / 100) : '';
    fields.nightly.setCustomValidity('');
    fields.nightlyWithBreakfast.setCustomValidity('');
    fields.amenities.value = room?.amenities.join('\n') || '';
    fields.active.checked = room?.active ?? true;
    showRates();
    const photos = find('#admin-photo-list');
    photos.replaceChildren();
    const gallery = room?.images || [];
    for (const path of gallery) {
      const label = element('label', '', 'admin-photo');
      const checkbox = element('input');
      checkbox.type = 'checkbox'; checkbox.name = 'photos'; checkbox.value = path; checkbox.checked = gallery.includes(path);
      checkbox.onchange = () => {
        if (selectedPhotos().length > 5) { checkbox.checked = false; find('#admin-photo-status').textContent = 'O limite é de cinco fotos por quarto.'; return; }
        showCover();
      };
      const image = element('img'); image.src = path; image.alt = ''; image.loading = 'lazy';
      label.append(image, checkbox, element('span', photoNames[path] || 'Foto carregada'), button('Excluir foto', () => { label.remove(); showCover(); }));
      photos.append(label);
    }
    showCover(gallery[0]);
    find('#admin-custom-plans').replaceChildren();
    const plans = room?.plans || (room ? [{ name: room.meal === 'included' ? 'Diária com café' : 'Hospedagem', nightly: room.nightly, breakfast: room.meal === 'included' }, ...(room.meal === 'optional' && room.nightlyWithBreakfast ? [{ name: 'Diária com café', nightly: room.nightlyWithBreakfast, breakfast: true }] : [])] : [{ name: '', nightly: 0, breakfast: false }]);
    for (const plan of plans) addPlan(plan);
    fields.nightly.required = fields.nightlyWithBreakfast.required = false;
    setEditorView(view);
    roomDialog.showModal();
  }

  function table(headers) {
    const node = element('table');
    const head = element('thead');
    const row = element('tr');
    for (const title of headers) { const cell = element('th', title); cell.scope = 'col'; row.append(cell); }
    head.append(row);
    const body = element('tbody');
    node.append(head, body);
    return { node, body };
  }
  function cell(row, content, className) {
    const td = element('td', undefined, className);
    td.append(content);
    row.append(td);
    return td;
  }
  function button(label, onClick, className = 'admin-secondary') {
    const node = element('button', label, className); node.type = 'button'; node.onclick = onClick;
    return node;
  }
  function emptyList(list, text) { list.replaceChildren(element('p', text, 'admin-empty')); }
  function roomCell(room) {
    const content = element('div', undefined, 'admin-product-cell');
    const image = element('img'); image.src = room.image; image.alt = ''; image.loading = 'lazy';
    const text = element('div');
    text.append(element('strong', room.name), element('small', room.type === 'shared' ? 'Compartilhado · valor por vaga/diária' : 'Privativo'));
    content.append(image, text);
    return content;
  }
  function filteredRooms() {
    const query = normalize(find('#admin-filter').value.trim());
    const type = find('#admin-type-filter').value;
    const publication = find('#admin-publication-filter').value;
    return data.rooms.filter(room => (!type || room.type === type) && (!publication || room.active === (publication === 'active')) &&
      normalize([room.name, room.beds, ...room.amenities].join(' ')).includes(query));
  }
  function renderRooms() {
    const rooms = filteredRooms();
    const list = find('#admin-room-list');
    const rates = find('#admin-rate-list');
    if (!rooms.length) { emptyList(list, 'Nenhum quarto encontrado para estes filtros.'); emptyList(rates, 'Nenhuma tarifa encontrada para estes filtros.'); return; }
    const catalog = table(['Acomodação', 'Capacidade e camas', 'Publicação', 'Ações']);
    const pricing = table(['Acomodação', 'Planos e valores por diária', 'Editar']);
    for (const room of rooms) {
      const row = element('tr');
      cell(row, roomCell(room));
      const occupancy = element('div'); occupancy.append(element('strong', room.capacity + ' hóspedes'), element('small', room.beds), ...(room.type === 'shared' ? [element('small', room.availableBeds + ' vagas livres hoje')] : []));
      cell(row, occupancy);
      cell(row, element('span', room.active ? 'Publicado' : 'Oculto', 'admin-pill' + (room.active ? '' : ' admin-pill-muted')));
      const actions = element('div', '', 'admin-row-actions');
      actions.append(button('Editar quarto', () => openEditor(room)), button(room.active ? 'Inativar' : 'Ativar', event => action(event.currentTarget, async () => {
        await request({ setRoomActive: room.id, active: !room.active }); renderAll(); status.textContent = room.active ? 'Quarto inativado. Reservas existentes preservadas.' : 'Quarto ativado.'; document.dispatchEvent(new Event('catalog-updated'));
      })), button('Excluir', () => {
        deleteRoomId = room.id; find('#admin-delete-room-status').textContent = ''; find('#admin-delete-room-note').textContent = 'Quarto: ' + room.name; find('#admin-delete-room-dialog').showModal();
      }, 'admin-danger-link'));
      cell(row, actions);
      catalog.body.append(row);
      const rate = element('tr');
      cell(rate, roomCell(room));
      cell(rate, room.plans?.map(plan => plan.name + ': ' + price(plan.nightly)).join(' · ') || 'Hospedagem: ' + price(room.nightly));
      cell(rate, button('Editar tarifas', () => openEditor(room, 'rates')));
      pricing.body.append(rate);
    }
    list.replaceChildren(catalog.node); rates.replaceChildren(pricing.node);
  }

  function reservationState(reservation) {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
    if (reservation.cancelled) return ['cancelled', 'Cancelada'];
    if (reservation.offer.departure <= today) return ['ended', 'Encerrada'];
    if (reservation.approval === 'pending') return ['pending', 'Aguardando verificação'];
    return reservation.checkedIn ? ['checkedin', 'Check-in registrado'] : ['confirmed', 'Confirmada'];
  }
  async function openReview(code){
    const version=++reviewRevision;reviewCode=code;find('#admin-review-status').textContent='Carregando os dados…';find('#admin-review-content').replaceChildren();find('#admin-review-confirm').hidden=true;reviewDialog.showModal();
    try{
      const response=await fetch('/api/reservation/review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});const result=await response.json();if(!response.ok)throw new Error(result.error);
      if(version!==reviewRevision||!administrator||!reviewDialog.open)return;
      const {reservation,customer,notifications,emailMode,whatsappConfigured,whatsappMode,whatsappMessages,calendarMode,calendarMirror}=result;const offer=reservation.offer;const body=find('#admin-review-content');
      const facts=element('dl',undefined,'lines');
      for(const[label,value]of [['Código',code],['Cliente',customer?.fullName||'Cadastro indisponível'],['E-mail',customer?.email||'Não informado'],['Telefone',customer?.phone||'Não informado'],['Quarto',offer.name],['Período',dates.format(new Date(offer.arrival))+' a '+dates.format(new Date(offer.departure))],['Hóspedes',String(offer.adults+offer.children)],['Plano',offer.planName||'Hospedagem'],['Total',price(offer.total)],['Pagamento escolhido',paymentLabel(reservation.paymentMethod)],['Pagamento','A escolha não comprova quitação']])facts.append(element('dt',label),element('dd',value));body.append(facts);
      const contacts=element('div',undefined,'admin-row-actions');
      if(customer?.email){const link=element('a','Enviar e-mail ao cliente','button admin-secondary');link.href='mailto:'+customer.email;contacts.append(link);}
      if(customer?.phone){const link=element('a','Ligar para o cliente','button admin-secondary');link.href='tel:'+customer.phone.replace(/[^+0-9]/g,'');contacts.append(link);}body.append(contacts);
      body.append(element('h3','Comunicação da reserva'),element('p',emailMode==='gmail'?'Envio pelo Gmail configurado. Confira o status de cada mensagem.':'Prévia de teste. Os e-mails abaixo não foram enviados.'));
      const labels={preview:'Prévia — não enviado',queued:'Na fila de envio',sending:'Envio em andamento',sent:'Enviado pelo provedor',synced:'Sincronizado na Google Agenda',failed:'Falha no envio',uncertain:'Envio não confirmado — conferir caixa de saída'};
      for(const message of notifications||[]){const details=element('details');details.append(element('summary',(message.kind==='confirmed'?'Aprovação':'Recebimento da solicitação')+' · '+(labels[message.status]||message.status)),element('p','Destinatário: '+message.recipient),element('h4',message.subject),element('pre',message.body,'email-preview'));if(message.error)details.append(element('p',message.error,'status'));body.append(details);}
      body.append(element('p',whatsappMode==='meta'?'WhatsApp Cloud API configurado.':whatsappConfigured?'Webhook do WhatsApp configurado em modo de validação (sem disparo externo).':'WhatsApp automático ainda não conectado à API. O telefone acima permite contato com o cliente.','muted'));
      for(const item of whatsappMessages||[]){const details=element('details');details.append(element('summary','WhatsApp ('+item.recipient+') · '+(labels[item.status]||item.status)),element('pre',item.body,'email-preview'));if(item.error)details.append(element('p',item.error,'status'));body.append(details);}
      if(calendarMirror){const details=element('details');details.append(element('summary','Google Agenda ('+(calendarMirror.action==='delete'?'Remoção de espelho':'Espelho de estadia v'+calendarMirror.version)+') · '+(labels[calendarMirror.status]||calendarMirror.status)),element('p','Event ID: '+calendarMirror.eventId+' · Modo: '+(calendarMode||'preview')),element('h4',calendarMirror.summary),element('pre',calendarMirror.description,'email-preview'));if(calendarMirror.error)details.append(element('p',calendarMirror.error,'status'));body.append(details);}
      find('#admin-review-confirm').hidden=reservation.cancelled||reservation.approval!=='pending'||offer.departure<=new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'});find('#admin-review-status').textContent='Confira os dados antes de aprovar a hospedagem.';
    }catch(error){if(version===reviewRevision)find('#admin-review-status').textContent=error.message;}
  }
  find('#admin-review-close').onclick=()=>reviewDialog.close();
  reviewDialog.addEventListener('close',()=>{reviewRevision++;reviewCode=undefined;find('#admin-review-content').replaceChildren();});
  find('#admin-review-confirm').onclick=event=>action(event.currentTarget,async()=>{const code=reviewCode;if(!code)return;await request({confirmReservation:code});reviewDialog.close();renderAll();status.textContent='Reserva confirmada. Confira a comunicação em Verificar dados.';document.dispatchEvent(new Event('catalog-updated'));},find('#admin-review-status'));
  function matchesReservation(reservation, query) { return normalize(reservation.code + ' ' + reservation.offer.name).includes(query); }
  function renderReservations() {
    const list = find('#admin-reservation-list');
    const query = normalize(find('#admin-reservation-filter').value.trim());
    const state = find('#admin-reservation-state').value;
    const reservations = data.reservations.filter(reservation => matchesReservation(reservation, query) && (!state || reservationState(reservation)[0] === state));
    const receipts = find('#admin-receipt-list');
    const receiptQuery = normalize(find('#admin-receipt-filter').value.trim());
    const receiptReservations = data.reservations.filter(reservation => !reservation.cancelled && matchesReservation(reservation, receiptQuery));
    if (!reservations.length) emptyList(list, 'Nenhuma reserva encontrada.');
    else {
      const result = table(['Reserva e acomodação', 'Período e hóspedes', 'Total', 'Status', 'Ações']);
      for (const reservation of reservations) {
        const { code, offer } = reservation;
        const row = element('tr');
        const identity = element('div'); identity.append(element('strong', offer.name), element('code', code)); cell(row, identity);
        const stay = element('div'); stay.append(element('span', dates.format(new Date(offer.arrival)) + ' a ' + dates.format(new Date(offer.departure))), element('small', (offer.adults + offer.children) + ' hóspedes')); cell(row, stay);
        cell(row, price(offer.total));
        const [key, label] = reservationState(reservation); cell(row, element('span', label, 'admin-pill' + (key === 'cancelled' || key === 'ended' ? ' admin-pill-muted' : '')));
        const actions = element('div', undefined, 'admin-row-actions');
        if (!reservation.cancelled) actions.append(button('Comprovante', event => openReceipt(event.currentTarget, code)));
        actions.append(button('Verificar dados',()=>openReview(code)));
        if(key==='pending')actions.append(button('Confirmar reserva',()=>openReview(code)));
        if (['confirmed','pending'].includes(key)) actions.append(button('Cancelar', () => {
          pendingCancel = code; find('#admin-cancel-note').textContent = offer.name + ' · ' + dates.format(new Date(offer.arrival)) + ' a ' + dates.format(new Date(offer.departure)) + '. O quarto voltará a ficar disponível.'; cancelDialog.showModal();
        }, 'admin-danger-link'));
        cell(row, actions.childElementCount ? actions : '—'); result.body.append(row);
      }
      list.replaceChildren(result.node);
    }
    if (!receiptReservations.length) emptyList(receipts, 'Nenhum comprovante encontrado.');
    else {
      const result = table(['Reserva e acomodação', 'Check-in', 'Disponibilização', 'Documentos e pagamento']);
      for (const reservation of receiptReservations) {
        const row = element('tr');
        const identity = element('div'); identity.append(element('strong', reservation.offer.name), element('code', reservation.code)); cell(row, identity);
        cell(row, reservation.checkedIn ? 'Registrado' : 'Aguardando check-in');
        cell(row, reservation.checkedIn ? 'Disponível na conta do cliente' : 'Após registrar o check-in');
        cell(row, button('Editar comprovante', event => openReceipt(event.currentTarget, reservation.code)));
        result.body.append(row);
      }
      receipts.replaceChildren(result.node);
    }
  }

  function renderStats() {
    find('#admin-total-rooms').textContent = data.rooms.length;
    find('#admin-active-rooms').textContent = data.rooms.filter(room => room.active).length;
    find('#admin-total-reservations').textContent = data.reservations.filter(reservation => ['confirmed', 'pending', 'checkedin'].includes(reservationState(reservation)[0])).length;
  }
  function renderAll() { renderRooms(); renderReservations(); renderStats(); }
  function setView(view) {
    currentView = view;
    for (const panel of dashboard.querySelectorAll('[data-admin-panel]')) panel.hidden = panel.dataset.adminPanel !== view;
    for (const tab of dashboard.querySelectorAll('[data-admin-view]')) {
      tab.setAttribute('aria-pressed', String(tab.dataset.adminView === view));
      if (tab.dataset.adminView === view) tab.setAttribute('aria-current', 'page'); else tab.removeAttribute('aria-current');
    }
    find('#admin-view-title').textContent = viewInformation[view][0];
    find('#admin-view-description').textContent = viewInformation[view][1];
    find('#admin-catalog-tools').hidden = !['rooms', 'rates'].includes(view);
    find('#admin-add-room').hidden = !['rooms', 'rates'].includes(view);
  }
  for (const tab of dashboard.querySelectorAll('[data-admin-view]')) tab.onclick = () => {
    if (busy) return;
    setView(tab.dataset.adminView);
    if (['reservations', 'receipts'].includes(currentView)) action(tab, async () => { await request(); renderAll(); });
  };
  for (const id of ['#admin-filter', '#admin-type-filter', '#admin-publication-filter']) find(id).addEventListener('input', renderRooms);
  for (const id of ['#admin-reservation-filter', '#admin-reservation-state', '#admin-receipt-filter']) find(id).addEventListener('input', renderReservations);
  find('#admin-add-room').onclick = () => { if (!busy) openEditor(); };
  for (const node of admin.querySelectorAll('[data-close-room]')) node.onclick = () => roomDialog.close();
  find('#admin-keep-reservation').onclick = () => cancelDialog.close();

  async function requestReceipt(payload = {}) {
    const response = await fetch('/api/receipt/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: receiptCode, ...payload }), cache: 'no-store' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) refreshAccount(false);
      throw new Error(result.error || 'Não foi possível atualizar o comprovante.');
    }
    return result;
  }
  let receiptDraft = [];
  function showReceipt({ paymentMethod, attachments }) {
    paymentForm.elements.paymentMethod.value = paymentMethod || '';
    receiptDraft = attachments.map(file => ({ ...file })); renderReceiptDraft(); receiptFields.hidden = false;
  }
  function renderReceiptDraft() {
    const list = find('#admin-attachment-list'); list.replaceChildren();
    if (!receiptDraft.length) list.append(element('li','Nenhum documento anexado.'));
    receiptDraft.forEach((file,index) => {
      const row = element('li'); row.append(element('span',file.name),button('Remover PDF', () => { receiptDraft.splice(index,1); renderReceiptDraft(); })); list.append(row);
    });
    attachmentForm.hidden = receiptDraft.length >= 3;
  }
  function openReceipt(button, code) {
    if (busy) return;
    receiptCode = code; find('#admin-receipt-code').textContent = 'Reserva ' + code;
    receiptFields.hidden = true; attachmentForm.reset(); receiptDialog.showModal();
    action(button, async () => showReceipt(await requestReceipt()), receiptStatus);
  }
  paymentForm.onsubmit = event => event.preventDefault();
  attachmentForm.onsubmit = event => event.preventDefault();
  attachmentForm.elements.file.onchange = event => {
    action(event.target, async () => {
      const files = [...event.target.files];
      if (receiptDraft.length + files.length > 3) throw new Error('Anexe até três PDFs.');
      const added = [];
      for (const file of files) {
        if (!file.size || file.size > 2 * 1024 * 1024 || !/\.pdf$/i.test(file.name)) throw new Error('Use PDFs de até 2 MB.');
        const pdf = await new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = reject; reader.readAsDataURL(file); });
        added.push({ name:file.name,pdf });
      }
      receiptDraft.push(...added); event.target.value = ''; renderReceiptDraft(); receiptStatus.textContent = 'Alterações pendentes. Confira a via do cliente e salve.';
    },receiptStatus);
  };
  find('#admin-save-receipt').onclick = event => action(event.currentTarget, async () => {
    showReceipt(await requestReceipt({ save:true, paymentMethod:paymentForm.elements.paymentMethod.value, documents:receiptDraft })); receiptStatus.textContent = 'Comprovante e anexos salvos.';
  }, receiptStatus);
  find('#admin-preview-receipt').onclick = event => action(event.currentTarget,async () => {
    const response = await fetch('/api/receipt/admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:receiptCode,preview:true,paymentMethod:paymentForm.elements.paymentMethod.value,documents:receiptDraft})});
    if (!response.ok) throw new Error((await response.json()).error);
    const url = URL.createObjectURL(await response.blob());
    const link = element('a',''); link.href=url; link.download='previa-cliente-'+receiptCode+'.pdf'; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
    receiptStatus.textContent = 'Prévia da via do cliente baixada. Esta ação não salva alterações.';
  },receiptStatus);

  async function loadDashboard() {
    if (!administrator || location.hash !== '#admin' || !dashboard.hidden) return;
    const version = ++dashboardVersion;
    loadStatus.textContent = 'Carregando administração…';
    try {
      await request();
      if (version !== dashboardVersion || !administrator) return;
      access.hidden = true; dashboard.hidden = false; renderAll(); setView(currentView); loadStatus.textContent = '';
    } catch (error) { if (version === dashboardVersion) loadStatus.textContent = error.message; }
  }
  document.addEventListener('account-session', event => {
    administrator = event.detail?.role === 'admin';
    if (administrator) { access.hidden = true; loadDashboard(); }
    else {
      dashboardVersion++;
      for (const dialog of [reviewDialog, roomDialog, receiptDialog, cancelDialog, find('#admin-delete-room-dialog')]) if (dialog.open) dialog.close();
      data = { rooms: [], reservations: [], images: [] };
      for (const id of ['#admin-room-list', '#admin-rate-list', '#admin-reservation-list', '#admin-receipt-list']) find(id).replaceChildren();
      editor.reset(); dashboard.hidden = true; access.hidden = false; status.textContent = ''; loadStatus.textContent = ''; currentView = 'rooms';
    }
  });
  window.addEventListener('hashchange', loadDashboard);
  find('#admin-logout').onclick = event => action(event.currentTarget, async () => { await logoutAccount(); location.hash = 'conta'; });

  editor.onsubmit = event => {
    event.preventDefault();
    action(event.submitter, async () => {
      const cover = fields.cover.value;
      const photos = selectedPhotos();
      if (!photos.length || photos.length > 5) { setEditorView('photos'); throw new Error('Selecione de uma a cinco fotos para este quarto.'); }
      const amenities = fields.amenities.value.split('\n').map(value => value.trim()).filter(Boolean);
      if (amenities.length > 16 || amenities.some(value => value.length > 60)) { setEditorView('information'); throw new Error('Use até 16 comodidades de 60 caracteres cada, uma por linha.'); }
      const plans = [...find('#admin-custom-plans').children].map(row => ({ name: row.querySelector('[data-plan-name]').value.trim(), nightly: parseMoney(row.querySelector('[data-plan-value]').value) }));
      if (!plans.length || plans.some(plan => !plan.name)) { setEditorView('rates'); throw new Error('Informe nome e valor de cada plano.'); }
      const nightly = Math.min(...plans.map(plan => plan.nightly));
      const withCoffee = []; // Planos livres: inclusões descritas pelo nome, sem classificação fixa.
      const meal = !withCoffee.length ? 'unavailable' : withCoffee.length === plans.length ? 'included' : 'optional';
      const nightlyWithBreakfast = meal === 'unavailable' ? null : meal === 'included' ? nightly : Math.max(nightly, Math.min(...withCoffee.map(plan => plan.nightly)));
      const previousImages = data.rooms.find(room => room.id === editedRoom)?.images || [];
      const images = [cover, ...new Set([...previousImages, ...photos].filter(path => path !== cover && photos.includes(path)))];
      const isNew = !editedRoom;
      await request({ ...(editedRoom && { room: editedRoom }), name: fields.name.value.trim(), description: fields.description.value.trim(), beds: fields.beds.value.trim(), type: fields.type.value, capacity: Number(fields.capacity.value), images, amenities, nightly, nightlyWithBreakfast, plans, meal, active: fields.active.checked });
      renderAll(); roomDialog.close(); status.textContent = isNew ? 'Quarto cadastrado.' : 'Quarto atualizado.';
      document.dispatchEvent(new Event('catalog-updated'));
    }, editorStatus);
  };
  confirmCancel.onclick = () => {
    const code = pendingCancel; cancelDialog.close();
    action(confirmCancel, async () => { await request({ cancelReservation: code }); renderAll(); status.textContent = 'Reserva cancelada.'; document.dispatchEvent(new Event('catalog-updated')); });
  };
}
