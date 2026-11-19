const $ = (id) => document.getElementById(id);
const money = (n) => '$' + n.toFixed(2);
const ICON = { starters: '🥗', mains: '🍜', drinks: '🧋', desserts: '🍰' };
let items = [];
let manageItems = [];
let cart = [];
let user = null;
let editingId = null;
let searchTimer;

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  node.append(...children.flat().filter(Boolean));
  return node;
}
function say(text) {
  $('message').textContent = text;
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
function picture(item) {
  if (item.imageUrl) return el('img', { src: item.imageUrl, alt: item.name, loading: 'lazy' });
  return el(
    'div',
    { className: 'photo', ariaHidden: 'true' },
    ICON[item.category.toLowerCase()] || '🍽️',
  );
}
const availability = (item) =>
  el(
    'span',
    { className: 'badge' + (item.available ? '' : ' off') },
    item.available ? 'Available' : 'Unavailable',
  );

/* ---- Customer menu: SCRUM-31, 33, 35, 36 ---- */
async function loadMenu() {
  const state = $('menuState');
  state.className = 'state';
  state.textContent = 'Loading menu…';
  $('menuGrid').replaceChildren();
  try {
    const params = new URLSearchParams({
      q: $('search').value,
      category: $('categoryFilter').value,
    });
    items = (await api('/menu?' + params)).items;
  } catch (error) {
    state.className = 'state error';
    state.replaceChildren(
      el('p', {}, 'We couldn’t load the menu. Check your connection and try again.'),
      el('button', { onclick: loadMenu }, 'Retry'),
    );
    return;
  }
  renderMenu();
}
function renderMenu() {
  const state = $('menuState');
  const grid = $('menuGrid');
  grid.replaceChildren();
  if (!items.length) {
    state.className = 'state';
    state.textContent = $('search').value
      ? `No dishes match “${$('search').value}”. Try a different word or clear the search.`
      : 'The menu is empty for now.';
    return;
  }
  state.className = 'state hidden';
  for (const item of items) {
    const add = el(
      'button',
      { disabled: !item.available, onclick: () => addToOrder(item) },
      'Add to order',
    );
    grid.append(
      el(
        'div',
        { className: 'menu-card' + (item.available ? '' : ' unavailable') },
        picture(item),
        el('strong', {}, item.name),
        el('span', {}, money(item.price)),
        availability(item),
        el(
          'div',
          { className: 'actions' },
          el('button', { className: 'secondary', onclick: () => showDetail(item.id) }, 'Details'),
          add,
        ),
      ),
    );
  }
}
async function loadCategories() {
  try {
    const all = (await api('/menu')).items;
    const select = $('categoryFilter');
    select.replaceChildren(el('option', { value: '' }, 'All categories'));
    for (const name of [...new Set(all.map((item) => item.category))])
      select.append(el('option', { value: name }, name));
  } catch {}
}
async function showDetail(id) {
  try {
    const { item } = await api('/menu/' + id);
    const dialog = $('detail');
    dialog.replaceChildren(
      picture(item),
      el('h2', {}, item.name),
      el('p', {}, item.description || 'No description yet.'),
      el('p', {}, el('strong', {}, money(item.price))),
      availability(item),
      el(
        'div',
        { className: 'row' },
        el('button', { className: 'secondary', onclick: () => dialog.close() }, 'Close'),
      ),
    );
    dialog.showModal();
  } catch (error) {
    say(error.message);
  }
}
function updateCart() {
  $('cartBar').classList.toggle('hidden', !cart.length);
  $('cartText').textContent = `${cart.length} item${cart.length === 1 ? '' : 's'} in your order`;
}
function addToOrder(item) {
  if (!item.available) return say(`${item.name} is unavailable.`);
  cart.push(item.id);
  say(`Added ${item.name}.`);
  updateCart();
}
async function checkout() {
  try {
    const { ok, unavailable } = await api('/menu/check', 'POST', { ids: cart });
    if (ok) {
      cart = [];
      say('Order checked. All items are available.');
    } else {
      cart = cart.filter((id) => !unavailable.includes(id));
      say('Some items became unavailable and were removed from your order.');
    }
    updateCart();
    loadMenu();
  } catch (error) {
    say(error.message);
  }
}

/* ---- Owner management: SCRUM-37 ---- */
async function loadManage() {
  manageItems = (await api('/menu/manage')).items;
  const list = $('manageList');
  list.replaceChildren();
  if (!manageItems.length)
    list.append(el('p', { className: 'muted' }, 'No items yet. Add one to get started.'));
  for (const item of manageItems) {
    list.append(
      el(
        'div',
        { className: 'manage-row' },
        el(
          'div',
          { className: 'grow' },
          el('strong', {}, item.name),
          ` · ${item.category} · ${money(item.price)}`,
        ),
        el(
          'span',
          { className: 'badge' + (item.active ? '' : ' bad') },
          item.active ? 'Active' : 'Inactive',
        ),
        availability(item),
        el('button', { className: 'secondary', onclick: () => openEditor(item) }, 'Edit'),
        el(
          'button',
          {
            className: 'secondary',
            onclick: () => change(item.id, { available: !item.available }),
          },
          item.available ? 'Mark unavailable' : 'Mark available',
        ),
        el(
          'button',
          { className: 'secondary', onclick: () => change(item.id, { active: !item.active }) },
          item.active ? 'Deactivate' : 'Reactivate',
        ),
        el('button', { className: 'danger', onclick: () => removeItem(item) }, 'Remove'),
      ),
    );
  }
}
async function change(id, body) {
  try {
    await api('/menu/' + id, 'PATCH', body);
    say('Saved.');
    await refreshAll();
  } catch (error) {
    say(error.message);
  }
}
async function removeItem(item) {
  if (!confirm(`Remove “${item.name}”? Deactivate it instead if you may need it again.`)) return;
  try {
    await api('/menu/' + item.id, 'DELETE');
    say('Item removed.');
    await refreshAll();
  } catch (error) {
    say(error.message);
  }
}
function openEditor(item) {
  editingId = item?.id ?? null;
  $('editorTitle').textContent = item ? 'Edit item' : 'Add item';
  const form = $('itemForm');
  form.reset();
  $('formError').textContent = '';
  if (item) {
    form.elements.name.value = item.name;
    form.elements.category.value = item.category;
    form.elements.price.value = item.price;
    form.elements.description.value = item.description;
    form.elements.imageUrl.value = item.imageUrl;
  }
  $('editor').showModal();
}
async function saveItem(event) {
  event.preventDefault();
  const form = event.target.elements;
  const body = {
    name: form.name.value,
    category: form.category.value,
    price: Number(form.price.value),
    description: form.description.value,
    imageUrl: form.imageUrl.value,
  };
  if (!form.price.value) return ($('formError').textContent = 'Enter a price.');
  try {
    await api(editingId ? '/menu/' + editingId : '/menu', editingId ? 'PATCH' : 'POST', body);
    $('editor').close();
    say('Item saved.');
    await refreshAll();
  } catch (error) {
    $('formError').textContent = error.message;
  }
}
async function refreshAll() {
  await Promise.all([loadCategories(), loadMenu(), user?.role === 'owner' ? loadManage() : null]);
}

$('search').addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadMenu, 250);
});
$('categoryFilter').addEventListener('change', loadMenu);
$('checkout').addEventListener('click', checkout);
$('clearCart').addEventListener('click', () => {
  cart = [];
  updateCart();
});
$('newItem').addEventListener('click', () => openEditor());
$('cancelEdit').addEventListener('click', () => $('editor').close());
$('itemForm').addEventListener('submit', saveItem);

(async () => {
  try {
    user = (await api('/me')).user;
    $('who').textContent = ` · ${user.name} (${user.role.replaceAll('_', ' ')})`;
    $('manage').classList.toggle('hidden', user.role !== 'owner');
  } catch {}
  await refreshAll();
})();