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
  const clusterGroup = L.markerClusterGroup({
    maxClusterRadius: 60,
    iconCreateFunction: cluster => {
      const count = cluster.getChildCount();
      return L.divIcon({
        html: `<div class="cyl-cluster">${count}</div>`,
        className: '', iconSize: [38,38], iconAnchor: [19,19]
      });
    }
  });
  appState.clusterGroup = clusterGroup;
  displayed.forEach(mk => {
    const searchUrl = mk.url || `https://www.google.com/search?q=${encodeURIComponent(mk.name + ' ' + mk.province)}`;
    const safeName = mk.name.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    const leafletMarker = L.marker([mk.lat, mk.lng], { icon: createCustomIcon(mk.cat) })
      .bindTooltip(`<span style="font-family:'Instrument Serif',serif;font-size:0.82rem;color:var(--terra);font-weight:700;">${mk.name}</span><br><span style="font-size:0.72rem;color:#999;">${catLabel[mk.cat]||mk.cat}</span>`, {
        direction: 'top',
        offset: [0, -8],
        className: 'leaflet-tooltip-cyl',
        opacity: 1
      })
      .bindPopup(`
        <div class="lf-popup" onclick="map.closePopup();openReviewsDrawer('${safeName}','${mk.province}')" style="cursor:pointer;position:relative;">
          <div style="display:flex;align-items:center;justify-content:center;height:72px;background:rgba(184,92,56,0.07);font-size:2.2rem;color:var(--terra);">
            ${catIcon[mk.cat] || catIcon.default}
          </div>
          <div class="lf-popup-body">
            <strong class="lf-popup-name" style="display:flex;align-items:center;gap:6px;">
              <button onclick="event.stopPropagation();toggleFavorite('${mk._id}','${safeName}');setTimeout(()=>{map.closePopup();loadProvinceMarkers('${mk.province}');},150);"
                title="Añadir a favoritos"
                style="background:transparent;border:none;cursor:pointer;font-size:1rem;padding:0;line-height:1;flex-shrink:0;">
                ${favIcon(isFavorite(mk._id))}
              </button>
              <span>${mk.name}</span>
            </strong>
            <div class="lf-popup-meta">
              <span class="lf-popup-pill">${catIcon[mk.cat] || catIcon.default} ${catLabel[mk.cat]||mk.cat}</span>
              <span class="lf-popup-prov">${mk.province}</span>
            </div>
            <p class="lf-popup-hint">Toca para ver detalles →</p>
          </div>
        </div>
      `, { maxWidth: 260, className: 'lf-popup-wrap', autoPanPaddingTopLeft: [20, 70], autoPanPaddingBottomRight: [20, 110] })
      ;
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

  // Update markers grid with category filter buttons
  const catCounts = {};
  pMarkers.forEach(m => { catCounts[m.cat] = (catCounts[m.cat]||0)+1; });

  const filterBar = document.getElementById('catFilterBar');
  if (filterBar) {
    filterBar.innerHTML = `
      <button onclick="setCatFilter(null,'${province}')" class="cat-chip${!activeCat ? ' is-active' : ''}">
        Todos (${pMarkers.length})
      </button>
      ${Object.entries(catCounts).sort((a,b)=>b[1]-a[1]).map(([c,n])=>`
        <button onclick="setCatFilter('${c}','${province}')" class="cat-chip${activeCat===c ? ' is-active' : ''}">
          ${catIcon[c] || catIcon.default} ${catLabel[c]||c} (${n})
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
  displayed.sort((a, b) => {
    const avgA = getAvgRating(a.name) || 0;
    const avgB = getAvgRating(b.name) || 0;
    return avgB - avgA;
  });

  const visible = appState.visibleCards || 8;
  const slice = displayed.slice(0, visible);

  const grid = document.getElementById('markersGrid');
  const showMoreEl = document.getElementById('markersShowMore');

  grid.style.display = slice.length > 0 ? 'flex' : 'none';
  grid.style.flexDirection = 'column';
  grid.style.gap = '0';
  grid.innerHTML = slice.map((mk, idx) => {
    const safeName = mk.name.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    const cardId   = 'card-' + mk.id;
    const avg      = getAvgRating(mk.name);
    const icon     = catIcon[mk.cat] || catIcon.default;
    const label    = catLabel[mk.cat] || mk.cat;
    const photo    = mk.photo || '';
    const isFav    = isFavorite(mk._id);
    const starsHtml = avg > 0
      ? `<span class="mc-stars">${'★'.repeat(Math.round(avg))}${'☆'.repeat(5-Math.round(avg))}</span>`
      : '';
    const thumbHtml = '';
    return `
    <div class="mc-row" id="${cardId}"
         onclick="flyToMarker(${mk.lat},${mk.lng});openReviewsDrawer('${safeName}','${mk.province}')">
      <div class="mc-thumb">
        <div class="mc-thumb-fallback" style="display:flex">${icon}</div>
      </div>
      <div class="mc-body">
        <div class="mc-name">${mk.name}</div>
        <div class="mc-meta">
          <span class="mc-pill">${icon} ${label}</span>
          ${starsHtml}
        </div>
      </div>
      <button class="mc-fav" id="fav-card-${mk._id}"
              onclick="event.stopPropagation();toggleFavorite('${mk._id}','${safeName}')"
              title="${isFav ? 'Quitar favorito' : 'Añadir favorito'}">
        ${favIcon(isFav)}
      </button>
    </div>`;
  }).join('');

  // Show more / show less buttons
  const remaining = displayed.length - visible;
  if (displayed.length <= 8) {
    showMoreEl.style.display = 'none';
  } else {
    showMoreEl.style.display = 'block';
    const btnStyle = `display:inline-block;background:transparent;border:1px solid rgba(184,92,56,0.4);color:var(--terra);padding:9px 28px;cursor:pointer;font-family:'Instrument Serif',serif;font-size:0.88rem;letter-spacing:0.08em;transition:all 0.2s;margin:0 6px;`;
    const btnHover = `onmouseover="this.style.background='rgba(184,92,56,0.10)';this.style.borderColor='var(--terra)'" onmouseout="this.style.background='transparent';this.style.borderColor='rgba(184,92,56,0.4)'"`;
    let html = '';
    if (remaining > 0) {
      html += `<button style="${btnStyle}" ${btnHover} onclick="appState.visibleCards+=${Math.min(remaining,8)};renderMarkerCards()">
        Ver más <span style="opacity:0.6;font-size:0.8rem;">(${remaining} restantes)</span> ▼
      </button>`;
    }
    if (visible > 8) {
      html += `<button style="${btnStyle}" ${btnHover} onclick="appState.visibleCards=8;renderMarkerCards()">
        Ver menos ▲
      </button>`;
    }
    showMoreEl.innerHTML = html;
  }
}

function loadAllMarkersOnMap() {
  if (!map) { setTimeout(loadAllMarkersOnMap, 200); return; }
  if (appState.clusterGroup) {
    map.removeLayer(appState.clusterGroup);
    appState.clusterGroup = null;
  }
  appState.activeLeafletMarkers = [];

  const clusterGroup = L.markerClusterGroup({
    maxClusterRadius: 60,
    showCoverageOnHover: false,
    iconCreateFunction: function(cluster) {
      const count = cluster.getChildCount();
      return L.divIcon({
        html: `<div class="cyl-cluster">${count}</div>`,
        className: '', iconSize: [38,38], iconAnchor: [19,19]
      });
    }
  });

  appState.clusterGroup = clusterGroup;

  // Sample all markers (max 800 for performance)
  const all = appState.markers.filter(m => m.lat && m.lng);
  const sample = all.length > 800
    ? all.filter((_, i) => i % Math.ceil(all.length / 800) === 0)
    : all;

  sample.forEach(mk => {
    const safeName = mk.name.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    const leafletMarker = L.marker([mk.lat, mk.lng], { icon: createCustomIcon(mk.cat) })
      .bindTooltip(`<span style="font-family:'Instrument Serif',serif;font-size:0.82rem;color:var(--terra);font-weight:700;">${mk.name}</span>`, {
        direction: 'top', offset: [0,-8], className: 'leaflet-tooltip-cyl', opacity:1
      })
      .bindPopup(`
        <div class="lf-popup" onclick="map.closePopup();openReviewsDrawer('${safeName}','${mk.province}')" style="cursor:pointer;position:relative;">
          <div style="display:flex;align-items:center;justify-content:center;height:72px;background:rgba(184,92,56,0.07);font-size:2.2rem;color:var(--terra);">
            ${catIcon[mk.cat] || catIcon.default}
          </div>
          <div class="lf-popup-body">
            <strong class="lf-popup-name" style="display:flex;align-items:center;gap:6px;">
              <button onclick="event.stopPropagation();toggleFavorite('${mk._id}','${safeName}');setTimeout(()=>map.closePopup(),150);"
                title="Añadir a favoritos"
                style="background:transparent;border:none;cursor:pointer;font-size:1rem;padding:0;line-height:1;flex-shrink:0;">
                ${favIcon(isFavorite(mk._id))}
              </button>
              <span>${mk.name}</span>
            </strong>
            <div class="lf-popup-meta">
              <span class="lf-popup-pill">${catIcon[mk.cat] || catIcon.default} ${catLabel[mk.cat]||mk.cat}</span>
              <span class="lf-popup-prov">${mk.province}</span>
            </div>
            <p class="lf-popup-hint">Toca para ver detalles →</p>
          </div>
        </div>
      `, { maxWidth: 260, className: 'lf-popup-wrap', autoPanPaddingTopLeft: [20, 70], autoPanPaddingBottomRight: [20, 110] });

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
