const DAY_ROUTE_COLORS = ['#B85C38', '#4ca8c9', '#7ec94c', '#c94c7e', '#c9784c'];
const DAY_ROUTE_LABELS = ['🌅 Día 1', '🌄 Día 2', '🌇 Día 3', '🌆 Día 4', '🌃 Día 5'];

function buildGoogleMapsUrl(dayGroups) {
  const allPlaces = dayGroups.flatMap(d => d.places);
  if (allPlaces.length < 2) return '#';
  const origin      = `${allPlaces[0].lat},${allPlaces[0].lng}`;
  const destination = `${allPlaces[allPlaces.length - 1].lat},${allPlaces[allPlaces.length - 1].lng}`;
  const waypoints = allPlaces.slice(1, -1).slice(0, 9).map(p => `${p.lat},${p.lng}`).join('|');
  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
  if (waypoints) url += `&waypoints=${encodeURIComponent(waypoints)}`;
  return url;
}

function openRouteMap(places, title, days) {
  // Routing Machine se descarga la primera vez; si falla, la ruta queda como línea recta
  if (typeof L !== 'undefined' && !L.Routing && !openRouteMap._routingRequested) {
    openRouteMap._routingRequested = true;
    loadScriptOnce(LIB_ROUTING).catch(() => {}).then(() => openRouteMap(places, title, days));
    return;
  }

  // Normalizar: si no hay días, crear uno solo
  const dayGroups = days || [{ label: null, places }];

  const allPlaces = dayGroups.flatMap(d => d.places);
  if (!allPlaces || allPlaces.length < 2) {
    showToast('⚠️ Se necesitan al menos 2 lugares con coordenadas');
    return;
  }

  // Título y subtext
  document.getElementById('routeMapTitleText').textContent = '🗺️ ' + (title || 'Ruta');
  document.getElementById('routeMapSubtext').textContent   = `${allPlaces.length} paradas`;

  // Sidebar: por día si hay varios
  const list = document.getElementById('routeMapStopList');
  const multiDay = dayGroups.length > 1;
  list.innerHTML = dayGroups.map((day, di) => {
    const color = DAY_ROUTE_COLORS[di % DAY_ROUTE_COLORS.length];
    const header = multiDay ? `
      <div style="display:flex;align-items:center;gap:8px;padding:12px 10px 6px;margin-top:${di > 0 ? '10px' : '0'};">
        <div style="width:12px;height:12px;border-radius:50%;background:${color};flex-shrink:0;"></div>
        <span style="font-family:'Instrument Serif',serif;font-size:0.8rem;color:${color};letter-spacing:0.06em;">${day.label || DAY_ROUTE_LABELS[di]}</span>
        <span style="font-size:0.7rem;color:var(--parch2);">${day.places.length} paradas</span>
      </div>` : '';
    const stops = day.places.map((p, i) => {
      const mk  = appState.markers.find(m => m.name === p.name);
      const cat = mk ? (catLabel[mk.cat] || mk.cat) : '';
      return `
        <div class="route-stop-item" onclick="_routeMapFlyTo(${p.lat},${p.lng})" style="border-left:2px solid ${color}30;">
          <div class="route-stop-num" style="background:${color};">${i + 1}</div>
          <div class="route-stop-info">
            <div class="route-stop-name">${p.name}</div>
            ${cat ? `<div class="route-stop-cat">${catIcon[mk.cat] || catIcon.default} ${cat}</div>` : ''}
          </div>
        </div>`;
    }).join('');
    const gmapsUrl = day.places.length >= 2 ? buildGoogleMapsUrl([day]) : '#';
    const gmapsBtn = `
      <a href="${gmapsUrl}" target="_blank" rel="noopener"
         style="display:inline-flex;align-items:center;gap:6px;margin:8px 10px 4px;padding:8px 14px;
                background:var(--terra);border:none;
                border-radius:var(--radius-xl);color:white;font-size:0.78rem;font-weight:600;text-decoration:none;width:calc(100% - 20px);
                box-sizing:border-box;justify-content:center;box-shadow:0 2px 8px rgba(184,92,56,0.3);">
        <svg viewBox="0 0 24 24" fill="currentColor" style="width:13px;height:13px;flex-shrink:0;">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5z"/>
        </svg>
        ${multiDay ? `Abrir ${day.label || DAY_ROUTE_LABELS[di]} en Google Maps` : 'Abrir en Google Maps'}
      </a>`;
    return header + stops + (day.places.length >= 2 ? gmapsBtn : '');
  }).join('');

  // Mostrar overlay
  const overlay = document.getElementById('routeMapOverlay');
  overlay.style.display = 'flex';
  requestAnimationFrame(() => overlay.classList.add('active'));

  // Destruir mapa anterior
  const container = document.getElementById('routeMapContainer');
  if (_routeMap) { _routeMap.remove(); _routeMap = null; }
  _routeRouting = null; _routePolyline = null;
  container.innerHTML = '<div id="routeMapLeaflet" style="width:100%;height:100%;"></div>';

  _routeMap = L.map('routeMapLeaflet', { zoomControl: true }).setView([41.5, -4.0], 7);
  // CARTO exige ya clave de API; teselas OSM con un filtro cálido en CSS (.tiles-warm)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
    className: 'tiles-warm'
  }).addTo(_routeMap);

  const allLatLngs = [];

  // Dibujar cada día por separado
  dayGroups.forEach((day, di) => {
    const color    = DAY_ROUTE_COLORS[di % DAY_ROUTE_COLORS.length];
    const latlngs  = day.places.map(p => L.latLng(p.lat, p.lng));
    if (latlngs.length < 1) return;
    allLatLngs.push(...latlngs);

    // Marcadores numerados con color del día
    day.places.forEach((p, i) => {
      const icon = L.divIcon({
        html: `<div style="background:${color};color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'DM Sans',sans-serif;font-weight:700;font-size:0.75rem;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);">${i + 1}</div>`,
        className: '', iconSize: [28, 28], iconAnchor: [14, 14]
      });
      const label = multiDay ? `${day.label || DAY_ROUTE_LABELS[di]} · ${i + 1}. ${p.name}` : `${i + 1}. ${p.name}`;
      L.marker([p.lat, p.lng], { icon })
        .bindTooltip(`<strong>${label}</strong>`, { direction: 'top', offset: [0, -10], className: 'leaflet-tooltip-cyl' })
        .addTo(_routeMap);
    });

    if (latlngs.length < 2) return;

    // Polilínea de fallback inmediata
    const fallback = L.polyline(latlngs, { color, weight: 2.5, opacity: 0.5, dashArray: '7 9' }).addTo(_routeMap);

    // Ruta real por carretera
    try {
      const rc = L.Routing.control({
        waypoints: latlngs,
        routeWhileDragging: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: false,
        show: false,
        createMarker: () => null,
        lineOptions: { styles: [{ color, weight: 3.5, opacity: 0.9, dashArray: '7 9' }] },
        router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' })
      }).addTo(_routeMap);

      rc.on('routesfound', (e) => {
        const c = rc.getContainer();
        if (c) c.style.display = 'none';
        _routeMap.removeLayer(fallback);
        // Actualizar subtext con distancia total del primer día que responda
        if (di === 0) {
          const s    = e.routes[0].summary;
          const km   = (s.totalDistance / 1000).toFixed(1);
          const mins = Math.round(s.totalTime / 60);
          const hrs  = mins >= 60 ? `${Math.floor(mins/60)}h ${mins%60}min` : `${mins} min`;
          document.getElementById('routeMapSubtext').textContent =
            `🚧 Herramienta en desarrollo`;
        }
      });
      rc.on('routingerror', () => {});
    } catch(e) {}
  });

  // Ajustar mapa a todos los puntos
  if (allLatLngs.length > 0) {
    _routeMap.fitBounds(L.latLngBounds(allLatLngs), { padding: [40, 40] });
  }

  // Fix tile rendering tras display:flex
  setTimeout(() => _routeMap && _routeMap.invalidateSize(), 200);
}

function closeRouteMap() {
  const overlay = document.getElementById('routeMapOverlay');
  overlay.classList.remove('active');
  setTimeout(() => { overlay.style.display = 'none'; }, 250);
}

function _routeMapFlyTo(lat, lng) {
  if (_routeMap) _routeMap.setView([lat, lng], 15, { animate: true });
}

// Keep drawItineraryRoute as alias for backwards compat
function drawItineraryRoute(places) { openRouteMap(places); }

// Hook into itinerary result rendering to add route button

const _origItinRenderResult = typeof itinRenderResult !== 'undefined' ? itinRenderResult : null;

// ============================================================
// EDICIÓN COMPLETA DE MARCADORES (Admin)
// ============================================================
function openMarkerEditModal(markerId) {
  const mk = appState.markers.find(m => String(m._id) === String(markerId));
  if (!mk) return;

  document.getElementById('editMarkerId').value     = markerId;
  document.getElementById('editMarkerName').value    = mk.name || '';
  document.getElementById('editMarkerDesc').value    = mk.desc || '';
  document.getElementById('editMarkerProvince').value= mk.province || '';
  document.getElementById('editMarkerCat').value     = mk.cat || '';
  document.getElementById('editMarkerLat').value     = mk.lat || '';
  document.getElementById('editMarkerLng').value     = mk.lng || '';
  document.getElementById('editMarkerPhoto').value   = mk.photo || '';
  document.getElementById('editMarkerUrl').value     = mk.url || '';

  document.getElementById('markerEditModal').classList.add('active');
}

function closeMarkerEditModal() {
  document.getElementById('markerEditModal').classList.remove('active');
}

async function saveMarkerEdit() {
  const id   = document.getElementById('editMarkerId').value;
  const name = document.getElementById('editMarkerName').value.trim();
  const desc = document.getElementById('editMarkerDesc').value.trim();
  const province = document.getElementById('editMarkerProvince').value;
  const cat  = document.getElementById('editMarkerCat').value;
  const lat  = parseFloat(document.getElementById('editMarkerLat').value);
  const lng  = parseFloat(document.getElementById('editMarkerLng').value);
  const photo = document.getElementById('editMarkerPhoto').value.trim();
  const url  = document.getElementById('editMarkerUrl').value.trim();

  if (!name) { showToast('⚠️ El nombre es obligatorio'); return; }
  if (isNaN(lat) || isNaN(lng)) { showToast('⚠️ Coordenadas inválidas'); return; }

  try {
    const res = await fetch(`/api/markers/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ name, desc, province, cat, lat, lng, photo, url })
    });
    if (!res.ok) throw new Error('Error al guardar');

    const updated = await res.json();
    const idx = appState.markers.findIndex(m => String(m._id) === String(id));
    if (idx !== -1) appState.markers[idx] = { ...appState.markers[idx], ...updated };

    closeMarkerEditModal();
    refreshAdminData();
    showToast('✅ Marcador actualizado correctamente');

    // Refresh map if province is active
    if (appState.selectedProvince === province) {
      loadProvinceMarkers(province);
    }
  } catch(e) {
    showToast('❌ Error al guardar el marcador');
  }
}

document.getElementById('markerEditModal')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('markerEditModal')) closeMarkerEditModal();
});


// ============================================================
// ONBOARDING
// ============================================================

