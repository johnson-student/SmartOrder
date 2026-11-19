const $ = (id) => document.getElementById(id);
const money = (n) => '$' + n.toFixed(2);
const ICON = { starters: '🥗', mains: '🍜', drinks: '🧋', desserts: '🍰' };
let items = [];
let category = '';
const cart = new Map(); // item id -> quantity

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  node.append(...children.flat().filter(Boolean));
  return node;
}
async function api(path, method = 'GET', data) {
  const response = await fetch('/api' + path, {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  return result;
}
function notice(text) {
  const box = $('notice');
  box.textContent = text;
  box.classList.toggle('hidden', !text);
}
function picture(item) {
  if (item.imageUrl)
    return el('img', { className: 'pic', src: item.imageUrl, alt: item.name, loading: 'lazy' });
  return el(
    'div',
    { className: 'pic', ariaHidden: 'true' },
    ICON[item.category.toLowerCase()] || '🍽️',
  );
}
const badge = (item) =>
  el(
    'span',
    { className: 'badge' + (item.available ? '' : ' off') },
    item.available ? 'Available' : 'Unavailable',
  );

/* ---- Loading, filtering, rendering ---- */
async function load() {
  const state = $('state');
  state.className = 'state hidden';
  $('grid').replaceChildren(
    ...Array.from({ length: 6 }, () => el('div', { className: 'skeleton' })),
  );
  try {
    items = (await api('/menu')).items;
  } catch {
    $('grid').replaceChildren();
    state.className = 'state error';
    state.replaceChildren(
      el('p', {}, 'We couldn’t load the menu. Check your connection and try again.'),
      el('button', { className: 'btn', onclick: load }, 'Retry'),
    );
    return;
  }
  // Drop cart lines for items that no longer exist or are no longer sellable.
  for (const id of [...cart.keys()]) {
    const item = items.find((i) => i.id === id);
    if (!item || !item.available) cart.delete(id);
  }
  renderChips();
  render();
  renderCartButton();
}
function renderChips() {
  const names = [...new Set(items.map((i) => i.category))];
  if (category && !names.includes(category)) category = '';
  $('chips').replaceChildren(
    ...['', ...names].map((name) =>
      el(
        'button',
        {
          className: 'chip',
          ariaPressed: String(category === name),
          onclick: () => {
            category = name;
            renderChips();
            render();
          },
        },
        name || 'All',
      ),
    ),
  );
}
function render() {
  const term = $('search').value.trim().toLowerCase();
  const list = items.filter(
    (i) =>
      (!category || i.category === category) &&
      (i.name + ' ' + i.description).toLowerCase().includes(term),
  );
  const state = $('state');
  const grid = $('grid');
  grid.replaceChildren();
  if (!list.length) {
    state.className = 'state';
    state.textContent = term
      ? `No dishes match “${$('search').value.trim()}”. Try a different word or clear the search.`
      : 'The menu is empty for now. Please check back soon.';
    return;
  }
  state.className = 'state hidden';
  for (const item of list) {
    const add = el(
      'button',
      { className: 'btn', disabled: !item.available, onclick: () => addItem(item) },
      item.available ? 'Add' : 'Sold out',
    );
    grid.append(
      el(
        'article',
        { className: 'card' + (item.available ? '' : ' off') },
        picture(item),
        el(
          'div',
          { className: 'body' },
          el('strong', {}, item.name),
          el('p', { className: 'desc' }, item.description || 'Freshly prepared.'),
          el(
            'div',
            { className: 'meta' },
            el('span', { className: 'price' }, money(item.price)),
            badge(item),
          ),
          el(
            'div',
            { className: 'actions' },
            el('button', { className: 'btn ghost', onclick: () => showDetail(item.id) }, 'Details'),
            add,
          ),
        ),
      ),
    );
  }
}

/* ---- Details ---- */
async function showDetail(id) {
  try {
    const { item } = await api('/menu/' + id);
    const dialog = $('detail');
    const add = el(
      'button',
      {
        className: 'btn',
        disabled: !item.available,
        onclick: () => {
          addItem(item);
          dialog.close();
        },
      },
      item.available ? 'Add to order' : 'Unavailable',
    );
    dialog.replaceChildren(
      picture(item),
      el('h2', {}, item.name),
      el('p', {}, item.description || 'No description yet.'),
      el('p', {}, el('span', { className: 'price' }, money(item.price)), ' ', badge(item)),
      el(
        'div',
        { className: 'row' },
        el('button', { className: 'btn ghost', onclick: () => dialog.close() }, 'Close'),
        add,
      ),
    );
    dialog.showModal();
  } catch (error) {
    notice(error.message);
    load();
  }
}

/* ---- Cart ---- */
const cartLines = () =>
  [...cart]
    .map(([id, qty]) => ({ item: items.find((i) => i.id === id), qty }))
    .filter((l) => l.item);
const cartTotal = () => cartLines().reduce((sum, l) => sum + l.item.price * l.qty, 0);
function addItem(item) {
  if (!item.available) return notice(`${item.name} is unavailable.`);
  cart.set(item.id, Math.min((cart.get(item.id) || 0) + 1, 20));
  notice(`Added ${item.name} to your order.`);
  renderCartButton();
}
function renderCartButton() {
  const count = [...cart.values()].reduce((a, b) => a + b, 0);
  $('cartButton').classList.toggle('hidden', !count);
  $('cartCount').textContent = count;
  $('cartTotal').textContent = money(cartTotal());
}
function openCart(message = '', ok = false) {
  const dialog = $('cart');
  const lines = cartLines();
  if (!lines.length) {
    dialog.close();
    return renderCartButton();
  }
  const setQty = (id, qty) => {
    if (qty <= 0) cart.delete(id);
    else cart.set(id, Math.min(qty, 20));
    renderCartButton();
    openCart();
  };
  dialog.replaceChildren(
    el('h2', {}, 'Your order'),
    ...lines.map(({ item, qty }) =>
      el(
        'div',
        { className: 'line' },
        el(
          'div',
          { className: 'name' },
          el('strong', {}, item.name),
          el('small', {}, money(item.price) + ' each'),
        ),
        el(
          'div',
          { className: 'qty' },
          el(
            'button',
            { ariaLabel: `Remove one ${item.name}`, onclick: () => setQty(item.id, qty - 1) },
            '−',
          ),
          el('span', {}, String(qty)),
          el(
            'button',
            { ariaLabel: `Add one ${item.name}`, onclick: () => setQty(item.id, qty + 1) },
            '+',
          ),
        ),
        el('strong', {}, money(item.price * qty)),
      ),
    ),
    el(
      'div',
      { className: 'total' },
      el('span', {}, 'Total'),
      el('strong', {}, money(cartTotal())),
    ),
    el('p', { className: 'dialog-msg' + (ok ? ' ok' : ''), role: 'status' }, message),
    el(
      'div',
      { className: 'row' },
      el('button', { className: 'btn ghost', onclick: () => dialog.close() }, 'Keep browsing'),
      el('button', { className: 'btn', onclick: checkout }, 'Check out'),
    ),
  );
  if (!dialog.open) dialog.showModal();
}
async function checkout() {
  try {
    const { ok, unavailable } = await api('/menu/check', 'POST', { ids: [...cart.keys()] });
    if (ok) return openCart('Good news: everything in your order is available.', true);
    const names = unavailable.map((id) => items.find((i) => i.id === id)?.name).filter(Boolean);
    unavailable.forEach((id) => cart.delete(id));
    renderCartButton();
    const message = `Sorry, ${names.length ? names.join(', ') : 'an item'} just became unavailable and was removed.`;
    if (!cart.size) $('cart').close();
    else openCart(message);
    notice(message);
    load();
  } catch (error) {
    openCart(error.message);
  }
}

let timer;
$('search').addEventListener('input', () => {
  clearTimeout(timer);
  timer = setTimeout(render, 150);
});
$('cartButton').addEventListener('click', () => openCart());
load();