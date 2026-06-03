// Promesa global resuelta cuando la sesión está verificada
let _sessionReadyResolve;
const sessionReady = new Promise(resolve => { _sessionReadyResolve = resolve; });

appState.token = localStorage.getItem('cyl_token') || null;

async function _doRestoreSession() {
  if (!appState.token) {
    updateAuthUI();
    _sessionReadyResolve();
    return;
  }
  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': 'Bearer ' + appState.token }
    });
    if (res.ok) {
      appState.currentUser = await res.json();
      updateAuthUI();
      unlockFeatures();
      loadFavorites();
    } else {
      appState.token = null;
      localStorage.removeItem('cyl_token');
      updateAuthUI();
    }
  } catch(e) {
    updateAuthUI();
  }
  _sessionReadyResolve();
}

// Esperar a que auth.js haya cargado updateAuthUI, luego restaurar sesión
(function waitForAuthUI() {
  if (typeof updateAuthUI === 'function') {
    _doRestoreSession();
  } else {
    setTimeout(waitForAuthUI, 50);
  }
})();

// Helper: cabeceras con token para peticiones autenticadas
function authHeaders(extra) {
  return { 'Content-Type': 'application/json', ...(appState.token ? { 'Authorization': 'Bearer ' + appState.token } : {}), ...extra };
}

// ============================================================
// MARKERS DATA — cargados desde MongoDB (las fotos persisten)
// ============================================================
(async function loadMarkers() {
  try {
    const res = await fetch('/api/markers');
    appState.markers = await res.json();
    updateAuthUI();
    if (!appState.selectedProvince) {
      loadAllMarkersOnMap();
    }
  } catch(e) {
    console.error('Error loading markers:', e);
  }
})();

// ============================================================
// RATINGS SYSTEM
// ============================================================
