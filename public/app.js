const getElement = (id) => document.getElementById(id);
let currentUser;
function showMessage(text) {
  getElement('message').textContent = text;
}
async function apiRequest(path, method = 'GET', data) {
  const response = await fetch('/api' + path, {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  return result;
}
const formValues = (form) => Object.fromEntries(new FormData(form));
function setVisible(id, visible) {
  getElement(id).classList.toggle('hidden', !visible);
}
async function refreshWorkspace() {
  const { needsSetup } = await apiRequest('/setup');
  currentUser = null;
  if (!needsSetup) {
    try {
      currentUser = (await apiRequest('/me')).user;
    } catch {}
  }
  setVisible('setup', needsSetup);
  setVisible('login', !needsSetup && !currentUser);
  setVisible('workspace', !!currentUser);
  if (!currentUser) return;
  getElement('identity').textContent =
    `${currentUser.name} · ${currentUser.role.replaceAll('_', ' ')}`;
  for (const fieldName of ['name', 'email', 'phone'])
    getElement('profileForm').elements[fieldName].value = currentUser[fieldName];
  const isOwner = currentUser.role === 'owner';
  setVisible('createAccount', isOwner);
  setVisible('accounts', isOwner);
  if (isOwner) await loadAccounts();
}
function field(label, value, type = 'text') {
  const labelElement = document.createElement('label');
  labelElement.textContent = label;
  const input = document.createElement('input');
  input.type = type;
  input.value = value;
  labelElement.append(input);
  return { labelElement, input };
}
async function loadAccounts() {
  const { users } = await apiRequest('/users');
  getElement('accountList').replaceChildren();
  for (const user of users) {
    const details = document.createElement('details');
    details.className = 'account';
    const summary = document.createElement('summary');
    summary.textContent = `${user.name} · ${user.email} · ${user.active ? 'Active' : 'Inactive'}`;
    details.append(summary);
    const form = document.createElement('form');
    const fields = {};
    for (const fieldName of ['name', 'email', 'phone']) {
      const formField = field(fieldName, user[fieldName], fieldName === 'email' ? 'email' : 'text');
      fields[fieldName] = formField.input;
      form.append(formField.labelElement);
    }
    const label = document.createElement('label');
    label.textContent = 'Role';
    const role = document.createElement('select');
    for (const roleName of ['owner', 'restaurant_staff', 'kitchen_staff']) {
      const option = document.createElement('option');
      option.value = roleName;
      option.textContent = roleName.replaceAll('_', ' ');
      role.append(option);
    }
    role.value = user.role;
    label.append(role);
    form.append(label);
    const status = document.createElement('label');
    status.textContent = 'Account status';
    const active = document.createElement('select');
    for (const [value, text] of [
      ['true', 'Active'],
      ['false', 'Inactive'],
    ]) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = text;
      active.append(option);
    }
    active.value = String(user.active);
    status.append(active);
    form.append(status);
    const save = document.createElement('button');
    save.textContent = 'Save account';
    form.append(save);
    form.onsubmit = async (event) => {
      event.preventDefault();
      save.disabled = true;
      try {
        const changes = Object.fromEntries(
          Object.entries(fields).map(([fieldName, input]) => [fieldName, input.value]),
        );
        if (role.value !== user.role) changes.role = role.value;
        if ((active.value === 'true') !== user.active) changes.active = active.value === 'true';
        await apiRequest('/users/' + user.id, 'PATCH', changes);
        showMessage('Account saved.');
        await refreshWorkspace();
      } catch (error) {
        showMessage(error.message);
      } finally {
        save.disabled = false;
      }
    };
    details.append(form);
    getElement('accountList').append(details);
  }
}
function bindForm(id, action) {
  getElement(id).onsubmit = async (event) => {
    event.preventDefault();
    const button = event.target.querySelector('button');
    button.disabled = true;
    try {
      await action(event.target);
      await refreshWorkspace();
    } catch (error) {
      showMessage(error.message);
    } finally {
      button.disabled = false;
    }
  };
}
bindForm('setupForm', async (form) => {
  await apiRequest('/setup', 'POST', formValues(form));
  form.reset();
  showMessage('Owner created. Log in with your new account.');
});
bindForm('loginForm', async (form) => {
  await apiRequest('/auth/login', 'POST', formValues(form));
  form.reset();
  showMessage('Logged in.');
});
bindForm('profileForm', async (form) => {
  await apiRequest('/me', 'PATCH', formValues(form));
  showMessage('Profile saved.');
});
bindForm('accountForm', async (form) => {
  await apiRequest('/users', 'POST', formValues(form));
  form.reset();
  showMessage('Account created.');
});
getElement('logout').onclick = async () => {
  try {
    await apiRequest('/auth/logout', 'POST');
    showMessage('Logged out.');
    await refreshWorkspace();
  } catch (error) {
    showMessage(error.message);
  }
};
refreshWorkspace().catch((error) => showMessage(error.message));
