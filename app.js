import './demo.js?v=78e49104';
import {paymentOptions,paymentLabel} from './reservation-utils.js?v=78e49104';
import { downloadReceipt, openAccountPanel, openAccountReservation, refreshAccount } from './account.js?v=78e49104';

const $ = selector => document.querySelector(selector);
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateLabel = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const weekdayDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeZone: 'UTC' });
const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
const day = 86400000;
const criteria = { arrival: '', departure: '', adults: 2, children: 0 };
let checkoutUser;
for(const option of paymentOptions){const item=document.createElement('option');item.value=option.id;item.textContent=option.label;document.querySelector('#checkout-payment').append(item);}
document.querySelector('#checkout-edit-customer').onclick=()=>setTimeout(()=>openAccountPanel('dados'),0);
let catalog = [];
let catalogReady = false;
let catalogError = "";
let roomFilter = "all";
let detailResult;
let results = null;
let selected = null;
let searchVersion = 0;
let detailVersion = 0;
let catalogPending = false;
let guestsApplied = false;
let propertyInfo={name:'Pousada Santa Terezinha do Menino Jesus',city:''};
document.addEventListener('property-updated',event=>{propertyInfo=event.detail;refreshSearchContext(detailId());if(detailId())renderProduct(detailId());});
let siteUser;
let pendingPage;
let catalogVersion = 0;

const detailId = () => location.hash.match(/^#quarto\/([a-z0-9-]+)$/)?.[1];
const roomType = room => room.type === 'shared' ? 'Compartilhado' : 'Privativo';
const roomCapacity = room => room.capacity === 1 ? 'Até 1 hóspede' : 'Até ' + room.capacity + ' hóspedes';
const formatDate = value => dateLabel.format(new Date(value));
const cash = cents => money.format(cents / 100);
const nightsLabel = nights => nights + (nights === 1 ? ' diária' : ' diárias');
const guestsLabel = ({ adults, children }) => adults + (adults === 1 ? ' adulto' : ' adultos') +
  (children ? ' e ' + children + (children === 1 ? ' criança' : ' crianças') : '');

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}

async function api(path, data = {}) {
  const response = await fetch('/api/' + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const payload = await response.json();
  if (!response.ok) {
    if (response.status === 401) await refreshAccount(false);
    throw new Error(payload.error);
  }
  return payload;
}

async function run(button, status, action) {
  button.disabled = true;
  status.textContent = '';
  try { await action(); } catch (error) { status.textContent = error.message; } finally { button.disabled = false; }
}

const search = $('#search-template').content.firstElementChild.cloneNode(true);
$('#home-search').append(search);

const menuToggle = $('.menu-toggle');
const mainNav = $('#main-nav');

function closeMenu() {
  if (menuToggle.getAttribute('aria-expanded') !== 'true') return;
  if (mainNav.contains(document.activeElement)) menuToggle.focus();
  menuToggle.setAttribute('aria-expanded', 'false');
}

menuToggle.onclick = () => {
  if (menuToggle.getAttribute('aria-expanded') === 'true') closeMenu();
  else menuToggle.setAttribute('aria-expanded', 'true');
};
mainNav.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});
$('.site-header').addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMenu();
});

function outsideDialog(event, dialog) {
  const box = dialog.getBoundingClientRect();
  return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
}
let backdropStart;
document.addEventListener('pointerdown', event => {
  const dialog = event.target.closest?.('dialog[open]');
  backdropStart = dialog && outsideDialog(event, dialog) ? dialog : null;
  if (!event.target.closest?.('.site-header')) closeMenu();
}, true);
document.addEventListener('click', event => {
  if (backdropStart?.open && event.target === backdropStart && outsideDialog(event, backdropStart)) backdropStart.close();
  backdropStart = null;
}, true);

function refreshSearchContext(id) {
  const room = catalog.find(item => item.id === id);
  search.querySelector('.destination strong').textContent = id ? 'Quarto selecionado' : 'Destino';
  search.querySelector('.destination small').textContent = room?.name || propertyInfo.city || 'Escolha sua estadia';
  const submit = search.querySelector('.search-submit');
  submit.replaceChildren(submit.querySelector('svg'), document.createTextNode(id ? 'Verificar disponibilidade' : 'Pesquisar quartos'));
}

function showPage() {
  closeMenu();
  const hash = location.hash.slice(1);
  if (hash === 'conta-administrador') {
    history.replaceState(null, '', '#conta');
    showPage();
    return;
  }
  if (hash === 'minha-reserva' || hash === 'checkin') {
    history.replaceState(null, '', '#conta');
    openAccountPanel(hash === 'checkin' ? 'codigo' : 'reservas');
    showPage();
    return;
  }
  const roomId = detailId();
  const section = document.getElementById(hash);
  const reservationLink=location.hash.match(/^#reserva\/([A-Fa-f0-9]{18})$/);
  const page = reservationLink?'conta':roomId ? 'quarto' :
    ['quarto', 'quartos', 'reserva', 'privativos', 'compartilhados'].includes(hash) ? 'acomodacoes' :
    section?.closest('[data-page]')?.id || 'inicio';
  if (!siteUser && !['conta', 'privacidade'].includes(page)) {
    pendingPage = location.hash || '#inicio';
    history.replaceState(null, '', '#conta');
    showPage();
    return;
  }
  if (page === 'admin' && siteUser?.role !== 'admin') {
    history.replaceState(null, '', '#conta');
    showPage();
    return;
  }
  if (siteUser && page !== 'conta') refreshAccount(false);
  if (siteUser && ['acomodacoes','quarto'].includes(page)) loadCatalog();
  if (page === 'checkout' && !selected) {
    location.replace('#acomodacoes');
    return;
  }
  if (hash === 'privativos') roomFilter = 'private';
  if (hash === 'compartilhados') roomFilter = 'shared';
  document.body.dataset.view = page;
  for (const panel of document.querySelectorAll('[data-page]')) panel.hidden = panel.id !== page;
  for (const link of document.querySelectorAll('.site-header a[href^="#"]')) {
    if (link.hash === '#' + (roomId ? 'acomodacoes' : page)) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  if (page === 'checkout') renderCheckout();
  if(reservationLink&&clientSignedIn)openAccountReservation(reservationLink[1].toUpperCase());
  if (page === 'conta') {
    if (siteUser === undefined || siteUser) refreshAccount();
  }
  const searchSlot = $(page === 'inicio' ? '#home-search' : roomId ? '#detail-search' : '#property-search');
  if (search.parentElement !== searchSlot) searchSlot.append(search);
  refreshSearchContext(roomId);
  if (roomId) renderProduct(roomId);
  if (page === 'acomodacoes') {
    if (criteria.departure && results === null) findRooms();
    else renderRooms();
  }
  if (section && section.id !== page && section.closest('[data-page]')) section.scrollIntoView();
  else window.scrollTo(0, 0);
}
window.addEventListener('hashchange', showPage);

function lines(rows) {
  const list = node('dl', undefined, 'lines');
  for (const [label, value] of rows) list.append(node('dt', label), node('dd', value));
  return list;
}

function stayLines(stay) {
  return [
    ['Check-in', stay.arrival ? weekdayDate.format(new Date(stay.arrival)) + (propertyInfo.checkInTime ? ' · a partir das '+propertyInfo.checkInTime : ' · horário a confirmar') : 'Selecione a entrada'],
    ['Check-out', stay.departure ? weekdayDate.format(new Date(stay.departure)) + (propertyInfo.checkOutTime ? ' · até as '+propertyInfo.checkOutTime : ' · horário a confirmar') : 'Selecione a saída'],
    ['Ocupação', '1 quarto · ' + guestsLabel(stay)],
  ];
}

function renderSummary() {
  const rows = stayLines(criteria);
  if (selected?.priceUnit === 'guest') rows.push(['Cobrança', (selected.adults + selected.children) + ' vagas × ' + selected.nights + ' noites = ' + ((selected.adults + selected.children) * selected.nights) + ' diárias unitárias']);
  if (selected) rows.push(['Suíte', selected.name], ['Tarifa', selected.planName || (selected.breakfast ? 'Com café da manhã' : 'Sem café da manhã')]);
  const summary = $('#trip-lines');
  summary.replaceChildren(lines(rows));
  if (selected) summary.append(node('p', cash(selected.total) + ' · ' + (selected.priceUnit === 'guest' ? (selected.adults + selected.children) * selected.nights + ' diárias unitárias' : nightsLabel(selected.nights)), 'summary-total'));
  $('#continue').disabled = !selected;
  $('#selection-help').textContent = selected ? 'Confira os detalhes e avance para confirmar sua reserva.' : 'Escolha uma tarifa disponível para continuar.';
}

function refreshCriteria() {
  $('#period-label').textContent = criteria.arrival ? formatDate(criteria.arrival) + ' – ' + formatDate(criteria.departure) : 'Selecione entrada e saída';
  $('#guest-label').textContent = '1 quarto, ' + guestsLabel(criteria);
}

function updateCriteria() {
  searchVersion++;
  detailVersion++;
  catalogPending = false;
  results = null;
  detailResult = undefined;
  selected = null;
  $('#search-status').textContent = '';
  refreshCriteria();
  renderRooms();
  renderDetailRates();
}

const calendar = $('#dates');
const firstMonth = today.slice(0, 7) + '-01';
const compactCalendar = window.matchMedia('(max-width:640px)');
let month = firstMonth;
let draftArrival;
let draftDeparture;
let dateStage = 'arrival';

function shiftMonth(date, offset) {
  const value = new Date(date);
  value.setUTCMonth(value.getUTCMonth() + offset);
  return value.toISOString().slice(0, 10);
}

function selectCalendarDate(value) {
  if (dateStage !== 'departure' || !draftArrival) {
    draftArrival = value;
    draftDeparture = '';
    dateStage = 'departure';
  } else {
    draftDeparture = value;
    dateStage = 'complete';
  }
  renderCalendar(value);
}

function renderCalendar(focusDate) {
  const complete = Boolean(draftArrival && draftDeparture);
  const nights = complete ? (Date.parse(draftDeparture) - Date.parse(draftArrival)) / day : 0;
  $('#calendar-status').textContent = complete ? 'Período selecionado. Confirme para continuar.' :
    draftArrival ? 'Agora escolha a data de saída, depois do check-in.' : 'Comece escolhendo a data de entrada.';
  $('#calendar-arrival').textContent = draftArrival ? formatDate(draftArrival) : 'Selecionar entrada';
  $('#calendar-departure').textContent = draftDeparture ? formatDate(draftDeparture) : 'Selecionar saída';
  $('#select-arrival').setAttribute('aria-pressed', String(dateStage === 'arrival'));
  $('#select-departure').setAttribute('aria-pressed', String(dateStage === 'departure'));
  $('#select-departure').disabled = !draftArrival;
  $('#calendar-total').textContent = complete ? nights + (nights === 1 ? ' noite selecionada' : ' noites selecionadas') : 'Até 30 noites por reserva';
  $('#apply-dates').disabled = !complete;
  $('#clear-dates').disabled = !draftArrival;
  $('#prev-month').disabled = month <= firstMonth;
  const months = $('#months');
  months.replaceChildren();
  for (const start of compactCalendar.matches ? [month] : [month, shiftMonth(month, 1)]) {
    const block = node('section', undefined, 'month');
    const heading = node('h3', monthLabel.format(new Date(start)));
    heading.id = 'month-' + start;
    block.setAttribute('aria-labelledby', heading.id);
    const grid = node('div', undefined, 'days');
    block.append(heading, grid);
    for (const label of ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']) grid.append(node('span', label, 'weekday'));
    for (let i = 0; i < new Date(start).getUTCDay(); i++) grid.append(node('span'));
    const startMs = Date.parse(start);
    const endMs = Date.parse(shiftMonth(start, 1));
    for (let ms = startMs; ms < endMs; ms += day) {
      const value = new Date(ms).toISOString().slice(0, 10);
      const button = node('button', String(Number(value.slice(-2))));
      button.type = 'button';
      button.dataset.date = value;
      button.disabled = value < today || Boolean(dateStage === 'departure' && draftArrival &&
        (value <= draftArrival || (ms - Date.parse(draftArrival)) / day > 30));
      button.setAttribute('aria-label', weekdayDate.format(new Date(value)) +
        (value === draftArrival ? ', check-in' : value === draftDeparture ? ', check-out' : ''));
      button.setAttribute('aria-pressed', String(value === draftArrival || value === draftDeparture));
      if (value === today) button.setAttribute('aria-current', 'date');
      if (value > draftArrival && value < draftDeparture) button.className = 'in-range';
      button.onclick = () => selectCalendarDate(value);
      grid.append(button);
    }
    months.append(block);
  }
  if (focusDate) {
    const target = months.querySelector('[data-date="' + focusDate + '"]');
    const next = [...months.querySelectorAll('[data-date]')].find(button => !button.disabled && button.dataset.date > focusDate);
    (target && !target.disabled ? target : next || $('#select-departure')).focus();
  }
}

$('#open-dates').onclick = () => {
  draftArrival = criteria.arrival;
  draftDeparture = criteria.departure;
  dateStage = draftArrival && draftDeparture ? 'complete' : draftArrival ? 'departure' : 'arrival';
  month = draftArrival ? draftArrival.slice(0, 7) + '-01' : firstMonth;
  renderCalendar();
  calendar.showModal();
};
$('#select-arrival').onclick = () => { dateStage = 'arrival'; renderCalendar(); };
$('#select-departure').onclick = () => { dateStage = 'departure'; renderCalendar(); };
$('#prev-month').onclick = () => { month = shiftMonth(month, -1); renderCalendar(); };
$('#next-month').onclick = () => { month = shiftMonth(month, 1); renderCalendar(); };
$('#clear-dates').onclick = () => {
  draftArrival = draftDeparture = '';
  dateStage = 'arrival';
  renderCalendar();
};
$('#months').addEventListener('keydown', event => {
  const value = event.target.dataset.date;
  const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
  if (!value || !offset) return;
  event.preventDefault();
  const next = new Date(Date.parse(value) + offset * day).toISOString().slice(0, 10);
  if (next < today) return;
  const visibleEnd = shiftMonth(month, compactCalendar.matches ? 1 : 2);
  if (next < month || next >= visibleEnd) month = next.slice(0, 7) + '-01';
  renderCalendar(next);
});
compactCalendar.addEventListener('change', () => { if (calendar.open) renderCalendar(); });
$('#apply-dates').onclick = () => {
  if (!draftArrival || !draftDeparture) return;
  Object.assign(criteria, { arrival: draftArrival, departure: draftDeparture });
  calendar.close();
  applySearchCriteria();
};

for (const field of $('#guests-form').querySelectorAll('select')) {
  const minimum = field.name === 'adults' ? 1 : 0;
  const maximum = field.name === 'adults' ? 12 : 11;
  field.replaceChildren(...Array.from({ length: maximum - minimum + 1 }, (_, index) =>
    new Option(String(minimum + index), String(minimum + index))));
}
$('#open-guests').onclick = () => {
  const { adults, children } = $('#guests-form').elements;
  adults.value = criteria.adults;
  children.value = criteria.children;
  $('#guest-status').textContent = '';
  $('#guests').showModal();
};
$('#guests-form').onsubmit = event => {
  event.preventDefault();
  const adults = Number(event.target.elements.adults.value);
  const children = Number(event.target.elements.children.value);
  if (adults + children > 12) {
    $('#guest-status').textContent = 'Escolha no máximo 12 hóspedes por quarto.';
    return;
  }
  Object.assign(criteria, { adults, children });
  $('#guests').close();
  guestsApplied = true;
  applySearchCriteria();
};

function roomLink(room, label, className) {
  const link = node('a', label, className);
  link.href = '#quarto/' + room.id;
  return link;
}

const queryField = $('#room-query');
const mealFilter = $('#meal-filter');
const ignoredWords = new Set(['a', 'o', 'as', 'os', 'de', 'da', 'do', 'das', 'dos', 'com', 'e', 'para', 'quarto', 'quartos']);
const sortField = $('#room-sort');
const words = text => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().match(/[a-z0-9]+/g) ?? [];

function matchesWord(query, word) {
  if (/^\d+$/.test(query)) return query === word;
  if (word.startsWith(query)) return true;
  if (query.length < 4 || Math.abs(query.length - word.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < query.length && j < word.length) {
    if (query[i] === word[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (query.length >= word.length) i++;
    if (word.length >= query.length) j++;
  }
  return edits + query.length - i + word.length - j <= 1;
}

const planName = offer => offer.planName || (offer.breakfast ? 'Com café da manhã' : 'Somente hospedagem');
function roomPlans(room) { return room.plans || (room.meal === 'optional' ? [{name:'Somente hospedagem'},{name:'Com café da manhã'}] : [{name:room.meal === 'included' ? 'Com café da manhã' : 'Somente hospedagem'}]); }
function refreshPlanFilter() {
  const value = mealFilter.value;
  mealFilter.replaceChildren(new Option('Todos os planos',''), ...[...new Set(catalog.flatMap(room => roomPlans(room).map(plan => plan.name)))].sort().map(name => new Option(name,name)));
  if ([...mealFilter.options].some(option => option.value === value)) mealFilter.value = value;
}
function roomPrice(room) {
  return room.options?.find(option => !mealFilter.value || planName(option) === mealFilter.value)?.total ?? room.plans?.find(plan => plan.name === mealFilter.value)?.nightly ?? room.nightly;
}
function matchMeal(room) { return !mealFilter.value || roomPlans(room).some(plan => plan.name === mealFilter.value); }

function renderRooms() {
  const list = $('#room-list');
  list.replaceChildren();
  for (const filter of document.querySelectorAll('[data-filter]')) {
    filter.setAttribute('aria-pressed', String(filter.dataset.filter === roomFilter));
  }
  const tokens = words(queryField.value).filter(word => !ignoredWords.has(word));
  const visibleRooms = (results ?? (criteria.departure ? [] : catalog)).filter(room => {
    if ((roomFilter !== 'all' && room.type !== roomFilter) || !matchMeal(room) ||
        (guestsApplied && room.capacity < criteria.adults + criteria.children)) return false;
    const searchable = words([room.name, room.description, room.beds, roomType(room), room.capacity, ...room.amenities, ...roomPlans(room).map(plan => plan.name)].join(' '));
    return tokens.every(token => searchable.some(word => matchesWord(token, word)));
  });
  if (sortField.value === 'price') visibleRooms.sort((a, b) => roomPrice(a) - roomPrice(b));
  if (sortField.value === 'capacity') visibleRooms.sort((a, b) => b.capacity - a.capacity);
  $('#clear-search').hidden = !criteria.departure;
  $('#clear-filters').hidden = !(tokens.length || roomFilter !== 'all' || mealFilter.value || sortField.value || guestsApplied);
  list.setAttribute('aria-busy', String(catalogPending));
  $('#catalog-count').textContent = catalogPending ? '' : catalogError || (catalogReady || results !== null
    ? visibleRooms.length + (visibleRooms.length === 1 ? ' quarto encontrado' : ' quartos encontrados')
    : 'Carregando acomodações…');
  if (criteria.departure && results === null) $('#catalog-count').textContent = '';
  if (!catalogPending && (catalogReady || results !== null) && !visibleRooms.length && (results?.length || (!criteria.departure && !catalogError))) {
    list.append(node('p', 'Nenhum quarto corresponde aos filtros. Ajuste a busca para ver outras opções.', 'surface catalog-empty'));
  }
  for (const room of visibleRooms) {
    const card = node('article', undefined, 'catalog-room surface');
    const photo = roomLink(room, undefined, 'catalog-photo');
    photo.setAttribute('aria-label', 'Verificar quarto ' + room.name);
    const image = node('img');
    image.src = room.image;
    image.alt = '';
    image.loading = 'lazy';
    photo.append(image, node('span', 'ILUSTRATIVO', 'illustrative-label'));
    const info = node('div', undefined, 'catalog-room-info');
    const title = node('h2');
    title.append(roomLink(room, room.name));
    const badges = node('div', undefined, 'room-badges');
    badges.append(node('span', roomType(room), 'tag'), node('span', roomCapacity(room), 'tag'));
    if (room.type === 'shared') badges.append(node('span', room.availableBeds + ' vagas livres' + (room.availabilityScope === 'period' ? ' no período' : ' hoje'), 'tag availability-tag'));
    info.append(title, badges, node('p', room.beds, 'room-beds'), node('p', room.description, 'muted'));
    const actions = node('div', undefined, 'catalog-room-actions');
    actions.append(node('small', room.options ? 'A partir de · total no período' : room.type === 'shared' ? 'Por vaga e por diária' : 'Diária base de demonstração'),
      node('strong', cash(roomPrice(room))),
      roomLink(room, 'Verificar quarto', 'button'));
    card.append(photo, info, actions);
    list.append(card);
  }
}

const photoDialog = $('#photo');
document.addEventListener('property-gallery',event=>openPhotos(event.detail.images,event.detail.index,event.detail.title));
let currentPhotos = [];
let currentPhoto = 0;

function renderPhoto() {
  const entry = currentPhotos[currentPhoto];
  const image = photoDialog.querySelector('.photo-frame > img');
  image.src = entry.src;
  image.alt = entry.label;
  const badge = photoDialog.querySelector('.illustrative-label');
  badge.textContent = entry.badge || '';
  badge.hidden = !entry.badge;
  $('#photo-prev').hidden = $('#photo-next').hidden = currentPhotos.length < 2;
  $('#photo-caption').textContent = entry.label;
  $('#photo-position').textContent = String(currentPhoto + 1).padStart(2, '0') + ' / ' + String(currentPhotos.length).padStart(2, '0');
  for (const [index, button] of [...$('#photo-thumbs').children].entries()) {
    if (index === currentPhoto) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  }
  $('#photo-thumbs [aria-current]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function openPhotos(entries, index, title = 'Galeria de fotos') {
  if (!entries.length) return;
  currentPhotos = entries;
  currentPhoto = Math.max(0, Math.min(index, entries.length - 1));
  $('#photo-title').textContent = title;
  const thumbnails = $('#photo-thumbs');
  thumbnails.replaceChildren();
  entries.forEach((entry, position) => {
    const button = node('button', undefined, 'photo-thumb');
    button.type = 'button';
    button.setAttribute('aria-label', 'Ver foto ' + (position + 1) + ': ' + entry.label);
    const image = node('img');
    image.src = entry.src;
    image.alt = '';
    image.loading = 'lazy';
    button.append(image);
    button.onclick = () => { currentPhoto = position; renderPhoto(); };
    thumbnails.append(button);
  });
  photoDialog.showModal();
  renderPhoto();
}

function turnPhoto(offset) {
  if (!currentPhotos.length) return;
  currentPhoto = (currentPhoto + offset + currentPhotos.length) % currentPhotos.length;
  renderPhoto();
}
$('#photo-prev').onclick = () => turnPhoto(-1);
$('#photo-next').onclick = () => turnPhoto(1);
photoDialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    turnPhoto(event.key === 'ArrowLeft' ? -1 : 1);
  }
});
photoDialog.addEventListener('close', () => {
  currentPhotos = [];
  photoDialog.querySelector('.photo-frame > img').removeAttribute('src');
  $('#photo-thumbs').replaceChildren();
});

for (const button of document.querySelectorAll('[data-gallery-photo]')) {
  button.onclick = () => {
    const group = button.closest('.restaurant-gallery,.hero-photos,.inn-gallery,.location-gallery');
    const buttons = group ? [...group.querySelectorAll('[data-gallery-photo]')] : [button];
    const title = button.closest('[data-page]')?.querySelector('h1')?.textContent || 'Fotos da pousada';
    openPhotos(buttons.map(tile => {
      const image = tile.querySelector('img');
      return { src: image.src, label: image.alt };
    }), buttons.indexOf(button), title);
  };
}

function renderProduct(id) {
  const product = $('#room-product');
  const room = catalog.find(item => item.id === id);
  $('#detail-booking').hidden = !room;
  $('#room-crumb').textContent = room?.name ?? 'Quarto';
  product.replaceChildren();
  if (!room) {
    product.append(node('h1', catalogError || (catalogReady ? 'Quarto indisponível' : 'Carregando quarto…')));
    if (catalogReady) {
      const back = node('a', 'Voltar às acomodações', 'button');
      back.href = '#acomodacoes';
      product.append(back);
    }
    return;
  }
  if (selected && selected.room !== room.id) selected = null;
  const heading = node('div', undefined, 'property-heading');
  refreshSearchContext(id);
  const intro = node('div');
  intro.append(node('p', 'Conheça sua acomodação', 'product-eyebrow eyebrow'), node('h1', room.name), node('p', roomType(room) + ' · ' + roomCapacity(room) + (propertyInfo.city ? ' · ' + propertyInfo.city : '')));
  const book = node('button', 'Ver disponibilidade ↓');
  book.type = 'button';
  book.onclick = () => {
    $('#detail-booking').scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('#open-dates').focus({ preventScroll: true });
  };
  heading.append(intro, book);

  const overview = node('div', undefined, 'product-overview');
  const highlights = node('div', undefined, 'product-highlights');
  for (const [label, value] of [['Acomodação', roomType(room)], ['Hóspedes', roomCapacity(room)], ['Camas', room.beds]]) {
    const item = node('article');
    item.append(node('small', label), node('strong', value));
    highlights.append(item);
  }
  overview.append(highlights);
  const gallery = node('div', undefined, 'gallery product-gallery');
  gallery.dataset.count = String(room.images.length);
  gallery.setAttribute('aria-label', 'Galeria do quarto');
  room.images.forEach((src, index) => {
    const tile = node('button');
    tile.type = 'button';
    const label = 'Foto ' + (index + 1) + ' de ' + room.name;
    const image = node('img');
    image.src = src;
    image.alt = label + ' (ilustrativa)';
    tile.append(image, node('span', 'ILUSTRATIVO', 'illustrative-label'));
    tile.onclick = () => openPhotos(room.images.map((path, position) => ({
      src: path, label: 'Foto ' + (position + 1) + ' de ' + room.name + ' (ilustrativa)', badge: 'ILUSTRATIVO',
    })), index, room.name);
    gallery.append(tile);
  });
  const information = node('div', undefined, 'product-facts');
  const body = node('section');
  const features = node('ul', undefined, 'features product-features');
  for (const feature of room.amenities) features.append(node('li', feature));
  body.append(node('h2', 'Sobre o quarto'), node('p', room.description), node('h3', 'Comodidades'), features,
    node('p', 'As fotos são ilustrativas. A imagem pode mostrar uma disposição de camas diferente da descrita nesta ficha.', 'muted product-photo-note'));
  const credits = node('a', 'Ver créditos das fotos');
  credits.href = '#creditos-fotos';
  credits.onclick = () => { $('#creditos-fotos').open = true; };
  body.append(credits);
  const facts = node('aside', undefined, 'surface product-facts-card');
  const breakfast = room.plans ? 'Conforme o plano contratado' : { included: 'Incluído na diária', optional: 'Opcional, com valor adicional', unavailable: 'Indisponível' }[room.meal];
  facts.append(node('h2', 'Destaques do quarto'), lines([
    ['Tipo', roomType(room)], ['Capacidade', roomCapacity(room)],
    ['Camas', room.beds], ['Café da manhã', breakfast],
    ['Check-in', propertyInfo.checkInTime ? 'A partir das '+propertyInfo.checkInTime : 'Horário a confirmar'], ['Check-out', propertyInfo.checkOutTime ? 'Até as '+propertyInfo.checkOutTime : 'Horário a confirmar'],
  ]));
  if (room.type === 'shared') facts.append(node('p', room.availableBeds + ' vagas livres hoje. Consulte as datas para ver as vagas do seu período.', 'available-beds'));
  if (room.type === 'shared') facts.append(node('p', 'As reservas são feitas por vagas. A disponibilidade considera todos os hóspedes em cada noite da estadia.', 'muted'));
  information.append(body, facts);
  product.append(heading, overview, gallery, information);
  renderDetailRates();
}

function renderDetailRates() {
  const id = detailId();
  if (!id) return;
  const details = $('#detail-rates');
  details.replaceChildren();
  const status = $('#detail-status');
  const checked = detailResult?.id === id;
  const availability = checked ? detailResult.availableBeds : results?.find(room => room.id === id)?.availableBeds;
  const sharedRoom = catalog.find(room => room.id === id)?.type === 'shared';
  const options = checked ? detailResult.options : results?.find(room => room.id === id)?.options;
  status.textContent = checked && detailResult.message ? detailResult.message : options?.length ?
    'Tarifas disponíveis para o período selecionado' : 'Pesquise um período para consultar disponibilidade.';
  if (sharedRoom && availability !== undefined) details.append(node('p', availability + ' vagas livres durante todo o período selecionado.', 'available-beds'));
  if (options?.length) {
    const fieldset = node('fieldset', undefined, 'surface room-options detail-offers');
    fieldset.append(node('legend', 'Escolha a tarifa'));
    for (const option of options) {
      const label = node('label', undefined, 'offer');
      const choice = node('input');
      choice.type = 'radio';
      choice.name = 'offer';
      choice.checked = selected?.key === option.key;
      choice.onchange = () => { selected = option; renderSummary(); };
      const info = node('span');
      info.append(node('strong', option.planName || (option.breakfast ? 'Com café da manhã' : 'Sem café da manhã')),
        node('small', option.dailyExtra ? '+' + cash(option.dailyExtra) + ' de café por diária, para esta estadia' :
          option.breakfast ? 'Café da manhã incluído na tarifa' : option.planName ? 'Plano por quarto e por diária' : 'Somente hospedagem'));
      const prices = node('span', undefined, 'offer-price');
      prices.append(node('strong', cash(option.total)), node('small', option.priceUnit === 'guest' ? cash(option.unitNightly + option.dailyExtra / (option.adults + option.children)) + ' / vaga e diária' : cash(option.nightly + option.dailyExtra) + ' / diária'));
      label.append(choice, info, prices);
      fieldset.append(label);
    }
    details.append(fieldset);
  } else if (!detailResult?.loading) {
    const empty = node('div', undefined, 'booking-empty');
    empty.append(node('h3', checked ? 'Vamos encontrar outra opção?' : 'Sua estadia começa pelas datas'),
      node('p', checked ? 'Experimente outro período ou confira as demais acomodações.' : 'Informe a entrada, a saída e os hóspedes. Depois, compare as tarifas disponíveis para este quarto.'));
    if (checked) {
      const change = node('button', 'Alterar datas', 'account-secondary');
      change.type = 'button';
      change.onclick = () => $('#open-dates').click();
      const back = node('a', 'Ver outros quartos →');
      back.href = '#acomodacoes';
      empty.append(change, back);
    }
    details.append(empty);
  }
  renderSummary();
}

for (const filter of document.querySelectorAll('[data-filter]')) {
  filter.onclick = () => {
    roomFilter = filter.dataset.filter;
    if (['#privativos', '#compartilhados'].includes(location.hash)) history.replaceState(null, '', '#acomodacoes');
    renderRooms();
  };
}
queryField.oninput = renderRooms;
mealFilter.onchange = sortField.onchange = renderRooms;
$('#clear-filters').onclick = () => {
  roomFilter = 'all';
  queryField.value = mealFilter.value = '';
  sortField.value = 'default';
  if (['#privativos', '#compartilhados'].includes(location.hash)) history.replaceState(null, '', '#acomodacoes');
  if (guestsApplied) {
    guestsApplied = false;
    Object.assign(criteria, { adults: 2, children: 0 });
    applySearchCriteria();
  } else renderRooms();
};
$('#clear-search').onclick = () => {
  Object.assign(criteria, { arrival: '', departure: '' });
  updateCriteria();
};

function applySearchCriteria() {
  updateCriteria();
  if (criteria.departure && (document.body.dataset.view === 'acomodacoes' || detailId())) findRooms(detailId());
}

search.onsubmit = event => {
  event.preventDefault();
  if (!criteria.departure) { $('#open-dates').click(); return; }
  const room = detailId();
  if (!room && document.body.dataset.view !== 'acomodacoes') location.hash = 'acomodacoes';
  findRooms(room);
};

async function findRooms(room) {
  const version = room ? ++detailVersion : ++searchVersion;
  selected = null;
  if (room) {
    detailResult = { id: room, options: [], loading: true, message: 'Verificando disponibilidade…' };
    renderDetailRates();
  } else {
    catalogPending = true;
    results = [];
    $('#search-status').textContent = 'Buscando quartos disponíveis…';
    renderRooms();
  }
  try {
    const response = await api('search', { ...criteria, ...(room ? { room } : {}) });
    if (version !== (room ? detailVersion : searchVersion)) return;
    if (room) {
      detailResult = { id: room, availableBeds: response.availability?.availableBeds ?? response.rooms[0]?.availableBeds, options: response.rooms[0]?.options ?? [],
        message: response.rooms.length ? '' : 'Quarto indisponível para o período ou a quantidade de hóspedes.' };
      renderDetailRates();
    } else {
      catalogPending = false;
      results = response.rooms;
      $('#search-status').textContent = results.length ? 'Disponibilidade para ' + formatDate(criteria.arrival) + ' a ' + formatDate(criteria.departure) + ' · ' + guestsLabel(criteria) : 'Nenhum quarto disponível para todo o período e a quantidade de hóspedes selecionados.';
      renderRooms();
    }
  } catch (error) {
    if (version !== (room ? detailVersion : searchVersion)) return;
    if (room) {
      detailResult.loading = false;
      detailResult.message = error.message;
      renderDetailRates();
    } else {
      catalogPending = false;
      $('#search-status').textContent = error.message;
      renderRooms();
    }
  }
}

function renderCheckout() {
  $('#checkout-back').href = '#quarto/' + selected.room;
  $('#checkout-customer').replaceChildren(lines([['Nome',checkoutUser?.fullName||'Complete em Meus dados'],['E-mail',checkoutUser?.email||''],['Telefone',checkoutUser?.phone||'Complete em Meus dados']]));
  $('#checkout-lines').replaceChildren(lines([...stayLines(selected), ['Suíte', selected.name],
    ['Plano', selected.planName || 'Hospedagem'], ['Condições', 'Conforme o plano selecionado']]));
  $('#checkout-price').replaceChildren(lines([
    [(selected.priceUnit === 'guest' ? (selected.adults + selected.children) + ' vagas × ' + selected.nights + ' noites' : nightsLabel(selected.nights)) + ' de hospedagem', cash(selected.nightly * selected.nights)],
    ...(selected.dailyExtra ? [['Adicional de café', cash(selected.dailyExtra * selected.nights)]] : []),
    ['Total da estadia', cash(selected.total)],
  ]));
  $('#confirm-status').textContent = '';
}
$('#continue').onclick = () => { location.hash = 'checkout'; };

let accountIdentity;
let clientSignedIn = false;
let reservationViewVersion = 0;
document.addEventListener('account-session', event => {
  const user = event.detail;checkoutUser=user;
  clientSignedIn = user?.role === 'client';
  $('#account-menu').setAttribute('aria-label', user ? 'Minha conta' : 'Minha conta: entrar ou criar conta');
  for (const link of document.querySelectorAll('[data-admin-link]')) link.hidden = user?.role !== 'admin';
  const identity = user?.email ?? user?.role ?? null;
  if (accountIdentity !== undefined && accountIdentity !== identity) {
    reservationViewVersion++;
    $('#account-code-lookup').reset();
    $('#account-code-output').replaceChildren();
    $('#account-code-status').textContent = '';
  }
  const identityChanged = accountIdentity !== identity;
  accountIdentity = identity;
  const previouslyAuthenticated = Boolean(siteUser);
  siteUser = user;
  document.body.dataset.access = user ? 'open' : 'locked';
  if (user) {
    if (identityChanged) loadCatalog();
    if (!previouslyAuthenticated) {
      if (pendingPage) {
        history.replaceState(null, '', pendingPage);
        pendingPage = undefined;
      }
      showPage();
    }
  } else {
    catalogVersion++;
    catalog = [];
    catalogReady = false;
    catalogError = '';
    updateCriteria();
    $('#room-product').replaceChildren();
    for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close();
    showPage();
  }
});
document.addEventListener('account-code-lookup', event => {
  const form = $('#account-code-lookup');
  const panel = $('#account-code-output');
  const status = $('#account-code-status');
  const version = ++reservationViewVersion;
  panel.replaceChildren();
  run(form.querySelector('button'), status, async () => {
    const reservation = await api('reservation', { code: event.detail.code });
    if (version === reservationViewVersion) renderReservation(reservation, panel, status);
  });
});

function renderReservation({ code, checkedIn, cancelled, accountBound, approval, offer,paymentMethod }, panel = $('#account-code-output'), status = $('#account-code-status')) {
  panel.replaceChildren(node('h3', cancelled ? 'Reserva cancelada' : checkedIn ? 'Check-in registrado' : approval === 'pending' ? 'Reserva enviada para verificação' : 'Reserva confirmada'),
    node('p', 'Guarde este código para consultar a reserva:', 'muted'), node('code', code, 'voucher'),
    lines([...stayLines(offer), ['Suíte', offer.name], ['Tarifa', offer.planName || (offer.breakfast ? 'Com café da manhã' : 'Sem café da manhã')],
      ['Total simulado', cash(offer.total)],['Pagamento escolhido',paymentLabel(paymentMethod)],['Situação do pagamento','Não cobrado neste protótipo']]));
  if (!checkedIn && !cancelled && approval !== 'pending') {
    const button = node('button', 'Registrar check-in online');
    button.type = 'button';
    button.onclick = () => run(button, status, async () => {
      const version = reservationViewVersion;
      const reservation = await api('checkin', { code });
      if (version === reservationViewVersion) {
        renderReservation(reservation, panel, status);
        refreshAccount();
      }
    });
    panel.append(button);
  }
  if (approval !== 'pending' && !cancelled && clientSignedIn && accountBound) {
    const button = node('button', 'Baixar comprovante');
    button.type = 'button';
    button.onclick = () => run(button, status, () => downloadReceipt(code));
    panel.append(button);
  }
}
$('#confirm-form').onsubmit = event => {
  event.preventDefault();
  if (!selected) return;
  run(event.submitter, $('#confirm-status'), async () => {
    const paymentMethod=$('#checkout-payment').value;if(!paymentMethod)throw new Error('Selecione a forma de pagamento.');
    const booking = await api('book', { ...criteria, key: selected.key,paymentMethod });
    updateCriteria();
    $('#account-code-lookup').elements.code.value = booking.code;
    $('#account-code-status').textContent = '';
    renderReservation(booking);
    if (clientSignedIn) {
      location.replace('#conta');
      await refreshAccount();
      openAccountReservation(booking.code);
    } else {
      location.replace('#admin');
    }
  });
};
async function loadCatalog() {
  const version = ++catalogVersion;
  try {
    const payload = await api('catalog');
    if (version !== catalogVersion || !siteUser) return;
    catalog = payload.rooms;
    refreshPlanFilter();
    catalogError = '';
  } catch (error) {
    if (version !== catalogVersion || !siteUser) return;
    catalogError = error.message;
  }
  catalogReady = true;
  renderRooms();
  if (detailId()) renderProduct(detailId());
}

document.addEventListener('catalog-updated', () => {
  updateCriteria();
  if (siteUser) loadCatalog();
});
refreshCriteria();
showPage();
refreshAccount(false);
