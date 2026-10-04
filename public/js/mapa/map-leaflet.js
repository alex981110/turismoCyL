function initLeafletMap() {
  if (map) return; // Ya inicializado
  map = L.map('map', { zoomControl: true }).setView([41.5, -4.0], 7);
  // CARTO exige ya clave de API; teselas OSM con un filtro cálido en CSS (.tiles-warm)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
    className: 'tiles-warm'
  }).addTo(map);
  loadProvinceBoundaries();

  // En móvil, el sidebar arranca colapsado para no tapar el mapa
  if (window.innerWidth <= 768) {
    const sidebar = document.getElementById('mapSidebar');
    if (sidebar && !sidebar.classList.contains('collapsed')) {
      sidebar.classList.add('collapsed');
    }
  }
}

function createCustomIcon(cat) {
  const icon = catIcon[cat] || catIcon.default;
  return L.divIcon({
    html: `<div class="cyl-pin">${icon}</div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20]
  });
}

function createClusterGroup(extra) {
  return L.markerClusterGroup(Object.assign({
    maxClusterRadius: 60,
    iconCreateFunction: cluster => L.divIcon({
      html: `<div class="cyl-cluster">${cluster.getChildCount()}</div>`,
      className: '', iconSize: [38, 38], iconAnchor: [19, 19]
    })
  }, extra));
}

const POPUP_OPTIONS = { maxWidth: 260, className: 'lf-popup-wrap', autoPanPaddingTopLeft: [20, 70], autoPanPaddingBottomRight: [20, 110] };

function markerTooltipHTML(mk, withCategory) {
  return `<span class="tt-name">${escHTML(mk.name)}</span>` +
    (withCategory ? `<br><span class="tt-cat">${escHTML(catLabel[mk.cat] || mk.cat)}</span>` : '');
}

// Contenido del popup como elemento DOM: los eventos se enlazan aquí porque Leaflet
// detiene la propagación de los clics dentro de los popups.
// reloadProvince: tras marcar favorito, vuelve a pintar los marcadores de la provincia.
function buildMarkerPopup(mk, reloadProvince) {
  const icon = catIcon[mk.cat] || catIcon.default;
  const el = document.createElement('div');
  el.className = 'lf-popup';
  el.innerHTML = `
    <div class="lf-popup-hero">${icon}</div>
    <div class="lf-popup-body">
      <strong class="lf-popup-name">
        <button type="button" class="lf-popup-fav" title="Añadir a favoritos">${favIcon(isFavorite(mk._id))}</button>
        <span>${escHTML(mk.name)}</span>
      </strong>
      <div class="lf-popup-meta">
        <span class="lf-popup-pill">${icon} ${escHTML(catLabel[mk.cat] || mk.cat)}</span>
        <span class="lf-popup-prov">${escHTML(mk.province)}</span>
      </div>
      <p class="lf-popup-hint">Toca para ver detalles →</p>
    </div>`;
  el.addEventListener('click', () => {
    map.closePopup();
    openReviewsDrawer(mk.name, mk.province);
  });
  el.querySelector('.lf-popup-fav').addEventListener('click', e => {
    e.stopPropagation();
    toggleFavorite(mk._id, mk.name);
    setTimeout(() => {
      map.closePopup();
      if (reloadProvince) loadProvinceMarkers(mk.province);
    }, 150);
  });
  return el;
}

function loadProvinceMarkers(province) {
  if (!map) return;

  // Eliminar solo el cluster anterior — nunca el provinceBoundariesLayer
  if (appState.clusterGroup) {
    map.removeLayer(appState.clusterGroup);
    appState.clusterGroup = null;
  }
  appState.activeLeafletMarkers = [];

  const pMarkers = appState.markers.filter(m => m.province === province);
  const activeCat = appState.filterCat || null;
  const displayed = activeCat ? pMarkers.filter(m => m.cat === activeCat) : pMarkers;

  const latLngs = [];
  const clusterGroup = createClusterGroup();
  appState.clusterGroup = clusterGroup;
  displayed.forEach(mk => {
    const leafletMarker = L.marker([mk.lat, mk.lng], { icon: createCustomIcon(mk.cat) })
      .bindTooltip(markerTooltipHTML(mk, true), {
        direction: 'top',
        offset: [0, -8],
        className: 'leaflet-tooltip-cyl',
        opacity: 1
      })
      .bindPopup(() => buildMarkerPopup(mk, true), POPUP_OPTIONS);
    clusterGroup.addLayer(leafletMarker);
    appState.activeLeafletMarkers.push(leafletMarker);
    latLngs.push([mk.lat, mk.lng]);
  });

  // Fit map to all markers
  map.addLayer(clusterGroup);
  if (latLngs.length > 0) {
    map.fitBounds(L.latLngBounds(latLngs), { padding: [30, 30], maxZoom: 13, animate: true, duration: 1 });
  } else {
    const center = provinceCenters[province];
    if (center) map.setView(center, 10, { animate: true });
  }

  // Filtros de categoría
  const catCounts = {};
  pMarkers.forEach(m => { catCounts[m.cat] = (catCounts[m.cat] || 0) + 1; });

  const filterBar = document.getElementById('catFilterBar');
  if (filterBar) {
    filterBar.innerHTML = `
      <button type="button" data-map-action="cat-filter" data-cat="" data-province="${escHTML(province)}" class="cat-chip${!activeCat ? ' is-active' : ''}">
        Todos (${pMarkers.length})
      </button>
      ${Object.entries(catCounts).sort((a, b) => b[1] - a[1]).map(([c, n]) => `
        <button type="button" data-map-action="cat-filter" data-cat="${escHTML(c)}" data-province="${escHTML(province)}" class="cat-chip${activeCat === c ? ' is-active' : ''}">
          ${catIcon[c] || catIcon.default} ${escHTML(catLabel[c] || c)} (${n})
        </button>
      `).join('')}
    `;
  }

  const CARDS_PER_PAGE = 8;
  appState.visibleCards = CARDS_PER_PAGE;
  appState.currentDisplayed = displayed;

  renderMarkerCards();

  document.getElementById('markerCount').textContent = displayed.length > 0 ? displayed.length + ' lugares' : '';
}

function renderMarkerCards() {
  let displayed = [...(appState.currentDisplayed || [])];

  // Ordenar por valoración media (mayor primero), sin valoración al final
  displayed.sort((a, b) => (getAvgRating(b.name) || 0) - (getAvgRating(a.name) || 0));

  const visible = appState.visibleCards || 8;
  const slice = displayed.slice(0, visible);

  const grid = document.getElementById('markersGrid');
  const showMoreEl = document.getElementById('markersShowMore');

  grid.hidden = slice.length === 0;
  grid.innerHTML = slice.map(mk => {
    const avg   = getAvgRating(mk.name);
    const icon  = catIcon[mk.cat] || catIcon.default;
    const isFav = isFavorite(mk._id);
    const starsHtml = avg > 0
      ? `<span class="mc-stars">${'★'.repeat(Math.round(avg))}${'☆'.repeat(5 - Math.round(avg))}</span>`
      : '';
    return `
    <div class="mc-row" id="card-${escHTML(mk.id)}" data-map-action="open-place"
         data-name="${escHTML(mk.name)}" data-province="${escHTML(mk.province)}" data-lat="${mk.lat}" data-lng="${mk.lng}">
      <div class="mc-thumb">
        <div class="mc-thumb-fallback">${icon}</div>
      </div>
      <div class="mc-body">
        <div class="mc-name">${escHTML(mk.name)}</div>
        <div class="mc-meta">
          <span class="mc-pill">${icon} ${escHTML(catLabel[mk.cat] || mk.cat)}</span>
          ${starsHtml}
        </div>
      </div>
      <button type="button" class="mc-fav" id="fav-card-${escHTML(mk._id)}" data-map-action="fav"
              data-id="${escHTML(mk._id)}" data-name="${escHTML(mk.name)}"
              title="${isFav ? 'Quitar favorito' : 'Añadir favorito'}">
        ${favIcon(isFav)}
      </button>
    </div>`;
  }).join('');

  // Ver más / ver menos
  const remaining = displayed.length - visible;
  showMoreEl.hidden = displayed.length <= 8;
  if (!showMoreEl.hidden) {
    let html = '';
    if (remaining > 0) {
      html += `<button type="button" class="msb-more-btn" data-map-action="more" data-step="${Math.min(remaining, 8)}">
        Ver más <span class="msb-more-count">(${remaining} restantes)</span> ▼
      </button>`;
    }
    if (visible > 8) {
      html += `<button type="button" class="msb-more-btn" data-map-action="less">
        Ver menos ▲
      </button>`;
    }
    showMoreEl.innerHTML = html;
  }
}

// Acciones del mapa, el planificador y los favoritos por delegación:
// los datos viajan en atributos data-*, sin construir JavaScript dentro de cadenas
document.addEventListener('click', e => {
  const el = e.target.closest('[data-map-action]');
  if (!el) return;
  const d = el.dataset;
  switch (d.mapAction) {
    case 'cat-filter':
      setCatFilter(d.cat || null, d.province);
      break;
    case 'open-place':
      flyToMarker(+d.lat, +d.lng);
      openReviewsDrawer(d.name, d.province);
      break;
    case 'fav':
      e.stopPropagation();
      toggleFavorite(d.id, d.name);
      break;
    case 'more':
      appState.visibleCards += +d.step;
      renderMarkerCards();
      break;
    case 'less':
      appState.visibleCards = 8;
      renderMarkerCards();
      break;
    case 'focus':
      focusMarkerFromPlanner(+d.lat, +d.lng);
      break;
    case 'province':
      selectProvince(d.province);
      break;
    case 'fav-go':
      closeFavDrawer();
      goToMarker(+d.lat, +d.lng, d.province);
      break;
    case 'open-modal':
      openModal(d.modal);
      break;
  }
});

function loadAllMarkersOnMap() {
  if (!map) { setTimeout(loadAllMarkersOnMap, 200); return; }
  if (appState.clusterGroup) {
    map.removeLayer(appState.clusterGroup);
    appState.clusterGroup = null;
  }
  appState.activeLeafletMarkers = [];

  const clusterGroup = createClusterGroup({ showCoverageOnHover: false });
  appState.clusterGroup = clusterGroup;

  // Sample all markers (max 800 for performance)
  const all = appState.markers.filter(m => m.lat && m.lng);
  const sample = all.length > 800
    ? all.filter((_, i) => i % Math.ceil(all.length / 800) === 0)
    : all;

  sample.forEach(mk => {
    const leafletMarker = L.marker([mk.lat, mk.lng], { icon: createCustomIcon(mk.cat) })
      .bindTooltip(markerTooltipHTML(mk, false), {
        direction: 'top', offset: [0, -8], className: 'leaflet-tooltip-cyl', opacity: 1
      })
      .bindPopup(() => buildMarkerPopup(mk, false), POPUP_OPTIONS);

    clusterGroup.addLayer(leafletMarker);
    appState.activeLeafletMarkers.push(leafletMarker);
  });

  map.addLayer(clusterGroup);
  // Fit to CyL bounds
  map.setView([41.6, -4.0], 7);
}

function toggleSidebar() {
  const sidebar  = document.getElementById('mapSidebar');
  const fab      = document.getElementById('sidebarFab');
  if (!sidebar) return;
  sidebar.classList.toggle('collapsed');
  const isCollapsed = sidebar.classList.contains('collapsed');

  // Gestionar FAB con clase — el CSS decide si es visible según breakpoint
  if (fab) {
    fab.style.display = ''; // quitar cualquier inline style previo
    fab.classList.toggle('fab-hidden', !isCollapsed);
  }

  // Backdrop en móvil
  if (window.innerWidth <= 768) {
    let bd = document.getElementById('mapSidebarBackdrop');
    if (!bd) {
      bd = document.createElement('div');
      bd.id = 'mapSidebarBackdrop';
      bd.className = 'map-sidebar-backdrop';
      bd.onclick = toggleSidebar;
      sidebar.parentNode.insertBefore(bd, sidebar);
    }
    bd.classList.toggle('visible', !isCollapsed);
  }

  setTimeout(() => { if (map) map.invalidateSize(); }, 320);
}

function flyToMarker(lat, lng) {
  if (!map) return;
  map.setView([lat, lng], 14, { animate: true });
}

function focusMarkerFromPlanner(lat, lng) {
  if (!lat || !lng) return;
  if (!map) return;
  map.setView([lat, lng], 16, { animate: true, duration: 0.8 });
  setTimeout(() => {
    const lm = appState.activeLeafletMarkers.find(m =>
      Math.abs(m.getLatLng().lat - lat) < 0.0001 && Math.abs(m.getLatLng().lng - lng) < 0.0001
    );
    if (lm) {
      if (appState.clusterGroup) appState.clusterGroup.zoomToShowLayer(lm, () => lm.openPopup());
      else lm.openPopup();
    }
  }, 500);
}


// ============================================================
