appState.favorites = []; // [{ markerId, name, province, cat, photo }]

function isFavorite(markerId) {
  return appState.favorites.some(f => f.markerId === String(markerId));
}

async function loadFavorites() {
  if (!appState.currentUser || !appState.token) return;
  try {
    const res = await fetch('/api/favorites', { headers: authHeaders() });
    if (res.ok) appState.favorites = await res.json();
  } catch(e) {}
}

async function toggleFavorite(markerId, name) {
  if (!appState.currentUser) {
    showToast('⚠️ Inicia sesión para guardar favoritos');
    openModal('login');
    return;
  }
  const isFav = isFavorite(markerId);
  const mk = appState.markers.find(m => String(m._id) === String(markerId));

  if (isFav) {
    appState.favorites = appState.favorites.filter(f => f.markerId !== String(markerId));
    fetch('/api/favorites', {
      method: 'DELETE',
      headers: authHeaders(),
      body: JSON.stringify({ markerId: String(markerId) })
    }).catch(() => {});
    showToast('💔 Eliminado de favoritos');
  } else {
    const newFav = {
      markerId: String(markerId),
      name: mk?.name || name,
      province: mk?.province || '',
      cat: mk?.cat || '',
      photo: mk?.photo || ''
    };
    appState.favorites.push(newFav);
    fetch('/api/favorites', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(newFav)
    }).catch(() => {});
    showToast('Añadido a favoritos');
  }

  // Refresh heart icons wherever visible
  refreshFavIcons(markerId);
  if (document.getElementById('favDrawer')?.classList.contains('active')) renderFavDrawer();
}

function refreshFavIcons(markerId) {
  const isFav = isFavorite(markerId);
  const icon = favIcon(isFav);
  const popupBtn = document.getElementById(`fav-btn-${markerId}`);
  if (popupBtn) popupBtn.innerHTML = icon;
  const cardBtn = document.getElementById(`fav-card-${markerId}`);
  if (cardBtn) cardBtn.innerHTML = icon;
}

function openFavDrawer() {
  if (!appState.currentUser) { openModal('login'); return; }
  document.getElementById('favDrawer').classList.add('active');
  document.getElementById('favDrawerOverlay').classList.add('active');
  renderFavDrawer();
}

function closeFavDrawer() {
  document.getElementById('favDrawer').classList.remove('active');
  document.getElementById('favDrawerOverlay').classList.remove('active');
}

function renderFavDrawer() {
  const body = document.getElementById('favDrawerBody');
  const sub  = document.getElementById('favDrawerSubtitle');
  const favs = appState.favorites;
  sub.textContent = `${favs.length} lugar${favs.length !== 1 ? 'es' : ''} guardado${favs.length !== 1 ? 's' : ''}`;

  if (!favs.length) {
    body.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--ink-muted);font-style:italic;">
      <div class="fav-empty-ico">${favIcon(false)}</div>
      Aún no tienes favoritos.<br>Haz clic en el corazón de cualquier lugar para guardarlo aquí.
    </div>`;
    return;
  }

  body.innerHTML = favs.map(f => {
    const mk = appState.markers.find(m => String(m._id) === f.markerId);
    const photo = f.photo || (mk && mk.photo) || '';
    return `
    <div class="fav-row" data-map-action="fav-go" data-lat="${mk?.lat||0}" data-lng="${mk?.lng||0}" data-province="${escHTML(f.province)}">
      <div class="fav-row-thumb">
        ${photo ? `<img src="${escHTML(photo)}" alt="" onerror="this.hidden = true">` : `<div class="fav-row-icon">${catIcon[f.cat] || catIcon.default}</div>`}
      </div>
      <div class="fav-row-text">
        <div class="fav-row-name">${escHTML(f.name)}</div>
        <div class="fav-row-meta">${escHTML(f.province)} · ${escHTML(catLabel[f.cat]||f.cat||'')}</div>
      </div>
      <button type="button" data-map-action="fav" data-id="${escHTML(f.markerId)}" data-name="${escHTML(f.name)}"
        class="mc-fav" title="Quitar favorito" aria-label="Quitar favorito">${favIcon(true)}</button>
    </div>`;
  }).join('');
}

// Load favorites on login
const _origLoginSuccess = loginSuccess;
loginSuccess = function(user) {
  _origLoginSuccess(user);
  loadFavorites();
};

// ============================================================
// VISTA DE RUTA — overlay con mapa Leaflet propio
// ============================================================
let _routeMap       = null;
let _routeRouting   = null;
let _routePolyline  = null;

// Colores por día
