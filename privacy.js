import './demo.js?v=f4fab036';
const key = 'pousada-mapa-v1';
const duration = 180 * 86400000;
const notice = document.querySelector('#cookie-notice');
const map = document.querySelector('.location-map iframe');
const placeholder = document.querySelector('#map-consent');

function readChoice() {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved?.expires > Date.now() && typeof saved.allowed === 'boolean') return saved.allowed;
  } catch {
    // Storage may be disabled by browser preferences.
  }
  return null;
}

let allowed = readChoice();
notice.hidden = allowed !== null;

function updateMap() {
  const load = Boolean(map.dataset.src) && allowed === true && document.body.dataset.access === 'open' && location.hash === '#localizacao';
  if (load && !map.hasAttribute('src')) map.src = map.dataset.src;
  if (!load) map.removeAttribute('src');
  map.hidden = !load;
  placeholder.hidden = load;
}

function choose(value) {
  allowed = value;
  try {
    localStorage.setItem(key, JSON.stringify({ allowed, expires: Date.now() + duration }));
  } catch {
    // The preference remains effective in this page.
  }
  notice.hidden = true;
  updateMap();
}

document.querySelector('#allow-optional').onclick = () => choose(true);
document.querySelector('#deny-optional').onclick = () => choose(false);
function dismissNotice() {
  if (allowed === null) choose(false);
  else notice.hidden = true;
}
document.querySelector('#close-cookie-notice').onclick = dismissNotice;
document.addEventListener('pointerdown', event => {
  if (!notice.hidden && !notice.contains(event.target) && !event.target.closest('[data-cookie-settings]')) dismissNotice();
});
document.querySelector('#allow-map').onclick = () => choose(true);
for (const button of document.querySelectorAll('[data-cookie-settings]')) {
  button.onclick = () => {
    notice.hidden = false;
    document.querySelector('#deny-optional').focus();
  };
}
notice.querySelector('a').onclick = () => { notice.hidden = true; };
window.addEventListener('hashchange', updateMap);
document.addEventListener('property-updated',updateMap);
document.addEventListener('account-session', () => queueMicrotask(updateMap));
window.addEventListener('storage', event => {
  if (event.key === key || event.key === null) {
    allowed = readChoice();
    notice.hidden = allowed !== null;
    updateMap();
  }
});
updateMap();
