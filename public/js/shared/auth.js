// Helper i18n seguro: si t() no está cargado, usa el fallback en español
function _t(key, vars, fallback) {
  if (typeof t === 'function') {
    const result = t(key, vars);
    if (result !== key) return result;
  }
  return fallback;
}

function openModal(tab) {
  document.getElementById('authModal').classList.add('active');
  switchTab(tab);
}
function closeModal() {
  document.getElementById('authModal').classList.remove('active');
}
document.getElementById('authModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('authModal')) closeModal();
});

function switchTab(tab) {
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
  document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
}

async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;
  if (!email || !pass) { showToast('⚠️ Introduce email y contraseña'); return; }
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const data = await res.json();
    if (!res.ok) { showToast('❌ ' + (data.error || 'Credenciales incorrectas')); return; }
    // GUARDAR TOKEN DIRECTAMENTE AQUÍ — sin depender de loginSuccess
    // por si algún otro script ha sobreescrito esa función
    if (data.token) {
      appState.token = data.token;
      localStorage.setItem('cyl_token', data.token);
    }
    loginSuccess(data.user, data.token);
  } catch (e) {
    showToast('❌ Error de conexión al servidor');
  }
}

async function doRegister() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPassword').value;
  const pass2 = document.getElementById('regPassword2')?.value;
  if (!name || !email || pass.length < 6) { showToast('⚠️ Completa todos los campos (mín. 6 caracteres)'); return; }
  if (pass2 !== undefined && pass !== pass2) { showToast('⚠️ Las contraseñas no coinciden'); return; }
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password: pass })
    });
    const data = await res.json();
    if (!res.ok) { showToast('❌ ' + (data.error || 'Error al registrarse')); return; }
    if (data.token) {
      appState.token = data.token;
      localStorage.setItem('cyl_token', data.token);
    }
    loginSuccess(data.user, data.token);
    showToast('✅ ¡Bienvenido/a! Cuenta creada correctamente.');
  } catch (e) {
    showToast('❌ Error de conexión al servidor');
  }
}

function loginSuccess(user, token) {
  appState.currentUser = user;
  // doLogin/doRegister ya guardó el token, pero por si llaman aquí directo:
  if (token && !appState.token) {
    appState.token = token;
    try { localStorage.setItem('cyl_token', token); } catch(e) {}
  }
  closeModal();
  updateAuthUI();
  unlockFeatures();
  loadFavorites();
  showToast(_t('toast.welcome', { name: user.name.split(' ')[0] }, `✦ Bienvenido/a, ${user.name.split(' ')[0]}`));
  if (appState.personalizedPlan) {
    const { ranking } = appState.personalizedPlan;
    const cp = appState.currentPlan;
    if (cp) setTimeout(() => renderPersonalizedDayPlanner(cp.province, cp.dia1, cp.dia2, ranking, true), 300);
  }
}

function updateAuthUI() {
  const u = appState.currentUser;
  if (typeof itinUpdateLock === 'function') itinUpdateLock();
  if (typeof itinLoadSaved === 'function') itinLoadSaved();
  const area = document.getElementById('authArea');
  const areaMobile = document.getElementById('authAreaMobile');
  const adminLink = document.getElementById('adminNavLink');
  if (adminLink) adminLink.style.display = (u && u.role === 'admin') ? '' : 'none';
  const favLink = document.getElementById('favNavLink');
  if (favLink) favLink.style.display = u ? '' : 'none';
  const myItinLink = document.getElementById('myItinNavLink');
  if (myItinLink) myItinLink.style.display = '';

  const loggedInHTML = `
    <div class="user-status">
      <div class="user-avatar" title="${u ? escHTML(u.email) : ''}">${u ? escHTML(u.name[0].toUpperCase()) : ''}</div>
      <span class="user-status-name">${u ? escHTML(u.name.split(' ')[0]) : ''}</span>
      <button type="button" class="btn btn-outline btn-logout" data-action="logout">${_t('navbar.logout', null, 'Salir')}</button>
    </div>`;
  const loggedOutHTML = `
    <button type="button" class="btn btn-outline" data-action="open-modal" data-modal="login">${_t('navbar.login', null, 'Iniciar Sesión')}</button>
    <button type="button" class="btn" data-action="open-modal" data-modal="register">${_t('navbar.register', null, 'Registrarse')}</button>`;

  if (area) area.innerHTML = u ? loggedInHTML : loggedOutHTML;
  if (areaMobile) areaMobile.innerHTML = u ? loggedInHTML : loggedOutHTML;
}

registerActions({ 'logout': () => doLogout() });

function doLogout() {
  appState.currentUser = null;
  appState.token = null;
  appState.favorites = [];
  localStorage.removeItem('cyl_token');
  updateAuthUI();
  lockFeatures();
  showToast(_t('toast.loggedOut', null, '✦ Sesión cerrada'));
}

// El planificador muestra u oculta el segundo día según la sesión: se vuelve a pintar
function refreshPlannerForSession() {
  if (appState.personalizedPlan || !appState.selectedProvince) return;
  if (typeof updateDayPlanner === 'function' && document.getElementById('dayPlanContainer')) {
    updateDayPlanner(appState.selectedProvince);
  }
}
function unlockFeatures() { refreshPlannerForSession(); }
function lockFeatures() { refreshPlannerForSession(); }
