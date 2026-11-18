// ============================================================
// MIS ITINERARIOS: los planes guardados (máximo 3 por usuario)
// ============================================================
// Cada tarjeta resume el viaje (provincias y días, lugares, km aproximados, noches en
// autocaravana), deja poner la fecha de salida (y avisa de lo que está cerrado esos días,
// ver horarios.js) y abre el plan en el mapa o su ruta. Los planes se crean con el
// cuestionario «Mis gustos» y se guardan desde el panel del mapa.

const ITIN_MAX = 3;

registerActions({
  'myitin-open':   d => openMyItinerary(d.id),
  'myitin-route':  d => routeMyItinerary(d.id),
  'myitin-delete': d => deleteMyItinerary(d.id),
  'myitin-new':    () => openOnboarding(),
});

// Fecha de salida desde la tarjeta: se guarda al momento
document.addEventListener('change', e => {
  const input = e.target.closest('.myitin-date');
  if (input) setMyItineraryDate(input.dataset.id, input.value);
});

// Fecha del día i de un viaje que sale el día dateStr (YYYY-MM-DD); null si no hay fecha
function tripDayDate(dateStr, i) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return null;
  d.setDate(d.getDate() + i);
  return d;
}

function loadMyItineraries() {
  const overlay = document.getElementById('myItinLockedOverlay');
  if (!appState.currentUser) {
    if (overlay) overlay.style.display = 'flex';
    document.getElementById('myItinList').innerHTML = '';
    document.getElementById('myItinEmpty').style.display = 'none';
    document.getElementById('myItinCounter').textContent = '';
    return;
  }
  if (overlay) overlay.style.display = 'none';

  fetch('/api/itineraries', { headers: authHeaders() })
    .then(r => r.ok ? r.json() : [])
    .then(items => {
      appState.savedItineraries = items;
      renderMyItineraries(items);
    })
    .catch(() => renderMyItineraries([]));
}

const _itinKm = (a, b) => {
  const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// Resumen de un itinerario guardado: días por provincia, lugares, noches y km aproximados
function _itinSummary(it) {
  const days = it.days || [];
  const provDays = [];
  days.forEach(d => {
    const p = d.province || it.province;
    const last = provDays[provDays.length - 1];
    if (last && last.p === p) last.n++;
    else provDays.push({ p, n: 1 });
  });
  let km = 0, prevNight = null;
  days.forEach(d => {
    const stops = (d.places || []).filter(p => p.lat && p.lng);
    const path = prevNight ? [prevNight, ...stops] : stops;
    for (let i = 1; i < path.length; i++) km += _itinKm(path[i - 1], path[i]);
    const last = stops[stops.length - 1];
    prevNight = last && last.cat === 'pernocta' ? last : null;
  });
  const places = days.reduce((s, d) => s + (d.places || []).filter(p => p.cat !== 'pernocta').length, 0);
  const nights = days.reduce((s, d) => s + (d.places || []).filter(p => p.cat === 'pernocta').length, 0);
  // Por carretera se recorre en torno a un 25 % más que en línea recta
  return { provDays, places, nights, km: Math.round(km * 1.25 / 5) * 5 };
}

function renderMyItineraries(items) {
  const list    = document.getElementById('myItinList');
  const empty   = document.getElementById('myItinEmpty');
  const counter = document.getElementById('myItinCounter');
  if (!list) return;

  if (!items || items.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    if (counter) counter.textContent = `0 de ${ITIN_MAX} itinerarios guardados`;
    return;
  }

  empty.style.display = 'none';
  if (counter) {
    const remaining = ITIN_MAX - items.length;
    counter.innerHTML = items.length >= ITIN_MAX
      ? `<strong>${items.length} de ${ITIN_MAX}</strong> guardados. Elimina alguno para guardar otro.`
      : `<strong>${items.length} de ${ITIN_MAX}</strong> guardados. Puedes guardar ${remaining} más.`;
  }

  const today = new Date().toISOString().split('T')[0];
  list.innerHTML = items.map(it => {
    const created = new Date(it.createdAt).toLocaleDateString('es-ES', { day:'numeric', month:'short', year:'numeric' });
    const s = _itinSummary(it);
    const id = escHTML(it._id);
    return `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="myitin-card">
          <div class="myitin-band">
            ${s.provDays.length === 1 && provinceCode[s.provDays[0].p] ? `<span class="myitin-code">${provinceCode[s.provDays[0].p]}</span>` : ''}
            <span class="myitin-title">${escHTML(it.title || it.province)}</span>
          </div>
          <dl class="myitin-fields">
            <div><dt>Días</dt><dd>${it.numDays || (it.days || []).length}</dd></div>
            <div><dt>Lugares</dt><dd>${s.places}</dd></div>
            <div><dt>Km aprox.</dt><dd>${s.km ? '≈ ' + s.km.toLocaleString('es-ES') : '—'}</dd></div>
          </dl>
          <div class="myitin-provs" aria-label="Días por provincia">
            ${s.provDays.map(({ p, n }) => `<span class="myitin-prov"><b>${provinceCode[p] || escHTML(p)}</b>${escHTML(p)} · ${n} día${n !== 1 ? 's' : ''}</span>`).join('')}
          </div>
          ${s.nights ? `<p class="myitin-rv">${catIcon.pernocta}<span>En autocaravana · ${s.nights} noche${s.nights !== 1 ? 's' : ''} con sitio para dormir</span></p>` : ''}
          <label class="myitin-date-wrap">
            <span>Fecha de salida</span>
            <input type="date" class="myitin-date form-control-cyl" data-id="${id}" min="${today}" value="${escHTML(it.dateStr || '')}">
          </label>
          <div class="myitin-closures" id="myitinClosures_${id}" hidden></div>
          <p class="myitin-saved">Guardado el ${created}</p>
          <div class="myitin-actions-row">
            <button type="button" class="btn myitin-open-btn" data-action="myitin-open" data-id="${id}">Abrir en el mapa</button>
            <button type="button" class="btn btn-outline myitin-route-btn" data-action="myitin-route" data-id="${id}">Ver ruta</button>
            <button type="button" class="itin-del-btn" data-action="myitin-delete" data-id="${id}" title="Eliminar itinerario" aria-label="Eliminar itinerario">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></svg>
            </button>
          </div>
        </div>
      </div>`;
  }).join('');

  items.forEach(it => { if (it.dateStr && typeof renderTripClosures === 'function') renderTripClosures(it); });
}

async function setMyItineraryDate(id, dateStr) {
  try {
    const res = await fetch('/api/itineraries/' + id, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ dateStr: dateStr || '' }) });
    if (!res.ok) { showToast('No se pudo guardar la fecha'); return; }
    const updated = await res.json();
    const items = appState.savedItineraries || [];
    const i = items.findIndex(x => x._id === id);
    if (i !== -1) items[i] = updated;
    const cp = appState.currentPlan;
    if (cp && cp._savedId === id) cp.dateStr = updated.dateStr || null;
    showToast(dateStr ? 'Fecha de salida guardada' : 'Fecha quitada');
    renderMyItineraries(items);
  } catch (e) {
    showToast('No se pudo guardar la fecha');
  }
}

// Itinerario guardado → días del plan con el formato del panel del mapa (los de buildTripPlan)
function savedToAllDays(it) {
  const multi = (it.provincesList || []).length > 1;
  return (it.days || []).map((d, i) => ({
    key: 'dia' + (i + 1),
    label: d.dayName || 'Día ' + (i + 1),
    province: d.province || it.province,
    items: (d.places || []).map(p => {
      const night = p.kind === 'night' || p.cat === 'pernocta';
      return {
        place: p.name,
        time: p.time || '',
        desc: p.desc || '',
        kind: night ? 'night' : (p.kind || 'visit'),
        photo: p.photo || null,
        lat: p.lat || null, lng: p.lng || null,
        marker: p.lat ? { name: p.name, lat: p.lat, lng: p.lng, cat: p.cat || null, province: p.province || d.province || it.province, _id: p.markerId } : null,
        _rv: night && p.rvId ? { id: p.rvId } : null,
        _rvWarn: p.notes && p.notes.length ? p.notes : undefined,
      };
    }),
    _multi: multi,
  }));
}

async function openMyItinerary(id) {
  try {
    const res = await fetch('/api/itineraries/' + id, { headers: authHeaders() });
    if (!res.ok) { showToast('No se pudo cargar el itinerario'); return; }
    const it = await res.json();
    const allDays = savedToAllDays(it);
    if (!allDays.length) { showToast('Este itinerario está vacío'); return; }
    showTripPlan({
      allDays,
      provincesList: it.provincesList && it.provincesList.length ? it.provincesList : [it.province],
      numDays: it.numDays || allDays.length,
      ranking: it.ranking || [],
      dateStr: it.dateStr || null,
      savedId: it._id,
      title: it.title,
      frozen: true,
    });
    showToast(`«${it.title}» abierto en el mapa`);
  } catch (e) {
    showToast('Error al cargar');
  }
}

// Ruta del itinerario guardado sin abrirlo (la misma vista que «Ver ruta» del plan)
function routeMyItinerary(id) {
  const it = (appState.savedItineraries || []).find(x => x._id === id);
  if (!it) return;
  const days = (it.days || []).map((d, i) => ({
    label: d.dayName || 'Día ' + (i + 1),
    places: (d.places || []).filter(p => p.lat && p.lng).map(p => ({ lat: p.lat, lng: p.lng, name: p.name, cat: p.cat })),
  })).filter(d => d.places.length);
  if (days.reduce((s, d) => s + d.places.length, 0) < 2) { showToast('No hay suficientes lugares con coordenadas'); return; }
  openRouteMap(null, it.title, days);
}

async function deleteMyItinerary(id) {
  if (!confirm('¿Eliminar este itinerario guardado? Esta acción no se puede deshacer.')) return;
  try {
    const res = await fetch('/api/itineraries/' + id, { method:'DELETE', headers: authHeaders() });
    if (!res.ok) { showToast('No se pudo eliminar'); return; }
    showToast('Itinerario eliminado');
    const cp = appState.currentPlan;
    if (cp && cp._savedId === id) { delete cp._savedId; cp.frozen = false; }
    loadMyItineraries();  // refrescar la vista
  } catch(e) {
    showToast('Error al eliminar');
  }
}
