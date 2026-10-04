// ============================================================
// MI ITINERARIO PERSONALIZADO
// ============================================================

const ITIN_KEY = 'cyl_itinerary_v1';
let itinSelected = [];
let itinResult   = null;

const DAYS_ES  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const DAY_EMOJIS = ['🌅','🌄','🌇'];

registerActions({
  'myitin-open':   d => openMyItinerary(d.id),
  'myitin-delete': d => deleteMyItinerary(d.id),
  'itin-toggle':   d => itinToggle(+d.id),
  'itin-fav':      async d => { await Promise.resolve(toggleFavorite(d.id, d.name)); itinRenderResult(); },
  'itin-route':    () => itinDrawRoute(),
});

function itinUpdateLock() {
  const overlay = document.getElementById('itinerarioLockedOverlay');
  if (!overlay) return;
  if (appState.currentUser) {
    overlay.style.display = 'none';
    const dateInput = document.getElementById('itinDate');
    if (dateInput && !dateInput.value) {
      const today = new Date();
      dateInput.min = today.toISOString().split('T')[0];
      const sat = new Date();
      sat.setDate(sat.getDate() + ((6 - sat.getDay() + 7) % 7 || 7));
      dateInput.value = sat.toISOString().split('T')[0];
    }
  } else {
    overlay.style.display = 'flex';
  }
}

// ── Itinerarios guardados (máximo 3 por usuario) ────────────────────────
const ITIN_MAX = 3;

async function itinSaveCurrent() {
  if (!itinResult) { showToast('⚠️ No hay itinerario que guardar'); return; }
  if (!appState.currentUser) { showToast('⚠️ Inicia sesión para guardar'); return; }

  const defaultTitle = itinResult._title
    || `${itinResult.province} · ${itinResult.numDays} día${itinResult.numDays!==1?'s':''}`;
  const title = prompt('Nombre del itinerario:', defaultTitle);
  if (title === null) return;  // cancelado

  const payload = {
    title:    title.trim() || defaultTitle,
    province: itinResult.province,
    dateStr:  itinResult.dateStr,
    numDays:  itinResult.numDays,
    days:     itinResult.days,
    warnings: itinResult.warnings || []
  };

  try {
    let res;
    if (itinResult._savedId) {
      // Sobreescribir uno existente
      res = await fetch('/api/itineraries/' + itinResult._savedId, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify(payload)
      });
    } else {
      // Crear nuevo
      res = await fetch('/api/itineraries', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify(payload)
      });
    }
    const data = await res.json();
    if (!res.ok) { showToast('❌ ' + (data.error || 'No se pudo guardar')); return; }
    itinResult._savedId = data._id;
    itinResult._title   = data.title;
    showToast('💾 Itinerario guardado');
    if (typeof loadMyItineraries === 'function') loadMyItineraries();  // refrescar vista dedicada
  } catch(e) {
    showToast('❌ Error al guardar');
  }
}

// ============================================================
// PÁGINA "MIS ITINERARIOS" (vista dedicada)
// ============================================================
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
      ? `<strong style="color:var(--terra);">${items.length} de ${ITIN_MAX}</strong> itinerarios guardados · <span style="font-style:italic;">elimina alguno para guardar otro</span>`
      : `<strong style="color:var(--terra);">${items.length} de ${ITIN_MAX}</strong> itinerarios guardados · puedes guardar ${remaining} más`;
  }

  list.innerHTML = items.map(it => {
    const dateLabel = it.dateStr
      ? new Date(it.dateStr + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';
    const created = new Date(it.createdAt).toLocaleDateString('es-ES', { day:'numeric', month:'short', year:'numeric' });
    const totalPlaces = (it.days || []).reduce((s, d) => s + (d.places?.length || 0), 0);
    const provinces = it.province || '—';

    return `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="myitin-card">
          <div>
            <div style="font-family:'Instrument Serif',serif;color:var(--terra);font-size:1.15rem;font-weight:700;line-height:1.3;margin-bottom:6px;">
              ${escHTML(it.title || provinces)}
            </div>
            <div style="font-size:0.78rem;color:var(--ink-muted);line-height:1.6;">
              📍 ${escHTML(provinces)}<br>
              📅 ${it.numDays} día${it.numDays!==1?'s':''}${dateLabel ? ' · '+dateLabel : ''}<br>
              📌 ${totalPlaces} lugar${totalPlaces!==1?'es':''}
            </div>
          </div>
          <div style="font-size:0.7rem;color:var(--ink-muted);font-style:italic;opacity:0.7;border-top:1px solid rgba(184,92,56,0.15);padding-top:10px;">
            Guardado el ${created}
          </div>
          <div style="display:flex;gap:8px;margin-top:auto;">
            <button type="button" class="btn myitin-open-btn" data-action="myitin-open" data-id="${escHTML(it._id)}">
              📂 Abrir
            </button>
            <button type="button" class="itin-del-btn" data-action="myitin-delete" data-id="${escHTML(it._id)}" title="Eliminar">
              🗑️
            </button>
          </div>
        </div>
      </div>`;
  }).join('');
}

async function openMyItinerary(id) {
  try {
    const res = await fetch('/api/itineraries/' + id, { headers: authHeaders() });
    if (!res.ok) { showToast('❌ No se pudo cargar el itinerario'); return; }
    const item = await res.json();
    itinResult = {
      province: item.province,
      dateStr:  item.dateStr,
      numDays:  item.numDays,
      days:     (item.days || []).map(d => ({ ...d, date: new Date(d.date) })),
      warnings: item.warnings || [],
      _savedId: item._id,
      _title:   item.title
    };
    // Navegar al creador para verlo en su contexto natural
    navigateTo('/itinerario');
    setTimeout(() => {
      itinRenderResult();
      const step2 = document.getElementById('itin-step2');
      if (step2) step2.scrollIntoView({ behavior:'smooth', block:'start' });
    }, 100);
    showToast(`✦ "${item.title}" cargado`);
  } catch(e) {
    showToast('❌ Error al cargar');
  }
}

async function deleteMyItinerary(id) {
  if (!confirm('¿Eliminar este itinerario guardado? Esta acción no se puede deshacer.')) return;
  try {
    const res = await fetch('/api/itineraries/' + id, { method:'DELETE', headers: authHeaders() });
    if (!res.ok) { showToast('❌ No se pudo eliminar'); return; }
    showToast('🗑️ Itinerario eliminado');
    if (itinResult && itinResult._savedId === id) {
      itinResult = null;
      if (typeof itinReset === 'function') itinReset();
    }
    loadMyItineraries();  // refrescar la vista
  } catch(e) {
    showToast('❌ Error al eliminar');
  }
}

// Cache de horarios por nombre de lugar
const itinHoursCache = {};

function itinFilterMarkers(query) {
  itinRenderDayColumns(query.toLowerCase().trim());
}

async function itinLoadMarkers() {
  const province = document.getElementById('itinProvince').value;
  const dateStr  = document.getElementById('itinDate').value;
  const wrap     = document.getElementById('itinMarkersWrap');
  const loading  = document.getElementById('itinLoadingHours');

  if (!province || !dateStr) { wrap.style.display = 'none'; return; }

  const markers = appState.markers.filter(m => m.province === province);
  itinSelected = [];
  itinUpdateSelCount();
  const itinSrch = document.getElementById('itinSearch');
  if (itinSrch) itinSrch.value = '';

  wrap.style.display = 'none';
  loading.style.display = 'block';

  await Promise.all(markers.map(async m => {
    if (itinHoursCache[m.name] !== undefined) return;
    try {
      const res = await fetch(`/api/photos/details?name=${encodeURIComponent(m.name)}&province=${encodeURIComponent(m.province||'')}`);
      const data = await res.json();
      itinHoursCache[m.name] = data.schedule || null;
    } catch { itinHoursCache[m.name] = null; }
  }));

  loading.style.display = 'none';
  wrap.style.display = 'block';
  itinRenderDayColumns('');
  itinCheckReady();
}

function itinRenderDayColumns(query) {
  const province = document.getElementById('itinProvince').value;
  const dateStr  = document.getElementById('itinDate').value;
  const numDays  = parseInt(document.getElementById('itinDays').value);
  const colsEl   = document.getElementById('itinDayColumns');
  if (!colsEl || !province || !dateStr) return;

  const q = (query || '').toLowerCase().trim();
  const startDate  = new Date(dateStr + 'T00:00:00');
  const allMarkers = appState.markers.filter(m => m.province === province);
  const colWidth   = numDays === 1 ? 'col-12' : numDays === 2 ? 'col-12 col-md-6' : 'col-12 col-md-4';

  const cols = [];
  for (let d = 0; d < numDays; d++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + d);
    const jsDay    = date.getDay();
    const dateLabel = date.toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' });

    const open = [], closed = [];
    allMarkers.forEach(m => {
      const sched = itinHoursCache[m.name];
      if (!sched?.weekday_text?.length) {
        open.push({ ...m, hoursText: null });
      } else {
        const dayIdx = jsDay === 0 ? 6 : jsDay - 1;
        const line   = sched.weekday_text[dayIdx] || '';
        if (line.toLowerCase().includes('cerrado')) {
          closed.push(m);
        } else {
          const h = parseHours(sched.weekday_text, jsDay);
          open.push({ ...m, hoursText: h ? h.text : null });
        }
      }
    });

    const filteredOpen   = q ? open.filter(m => m.name.toLowerCase().includes(q) || (m.cat||'').toLowerCase().includes(q)) : open;
    const filteredClosed = q ? closed.filter(m => m.name.toLowerCase().includes(q) || (m.cat||'').toLowerCase().includes(q)) : closed;

    const chipHTML = (m, isOpen) => {
      const sel      = itinSelected.includes(m.id);
      const disabled = !isOpen ? 'opacity:0.45;cursor:not-allowed;' : 'cursor:pointer;';
      const bg       = sel ? 'rgba(184,92,56,0.15)' : 'rgba(245,237,216,0.03)';
      const border   = sel ? 'var(--terra)' : isOpen ? 'rgba(184,92,56,0.2)' : 'rgba(184,92,56,0.1)';
      const click    = isOpen ? `data-action="itin-toggle" data-id="${m.id}"` : '';
      return `<div class="itin-marker-chip" id="chip-${m.id}-d${d}" ${click}
        style="border:1px solid ${border};padding:9px 11px;transition:all 0.18s;background:${bg};display:flex;align-items:center;gap:8px;${disabled}">
        <span style="font-size:0.75rem;color:var(--terra);">${catEmoji(m.cat)}</span>
        <div style="flex:1;min-width:0;">
          <div style="font-size:0.8rem;color:${isOpen?'var(--ink)':'var(--ink-muted)'};line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHTML(m.name)}</div>
          ${!isOpen ? `<div style="font-size:0.68rem;color:#e57373;margin-top:2px;">No disponible este día</div>` : ''}
        </div>
      </div>`;
    };

    const openHTML = filteredOpen.length
      ? filteredOpen.map(m => chipHTML(m, true)).join('')
      : `<p style="color:var(--ink-muted);font-style:italic;font-size:0.8rem;padding:8px 0;">Sin resultados.</p>`;

    const closedSection = filteredClosed.length ? `
      <div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(184,92,56,0.1);">
        <div style="font-size:0.68rem;letter-spacing:0.1em;color:#e57373;margin-bottom:8px;">CERRADOS ESTE DÍA (${filteredClosed.length})</div>
        ${filteredClosed.map(m => chipHTML(m, false)).join('')}
      </div>` : '';

    cols.push(`
      <div class="${colWidth}">
        <div style="background:rgba(245,237,216,0.03);border:1px solid rgba(184,92,56,0.2);padding:16px;height:100%;">
          <div style="font-family:'Instrument Serif',serif;color:var(--terra);font-size:0.95rem;margin-bottom:4px;">${DAY_EMOJIS[d]} Día ${d+1}</div>
          <div style="font-size:0.78rem;color:var(--ink-muted);margin-bottom:14px;text-transform:capitalize;">${dateLabel}</div>
          <div style="display:flex;flex-direction:column;gap:6px;max-height:380px;overflow-y:auto;padding-right:4px;">
            ${openHTML}
            ${closedSection}
          </div>
        </div>
      </div>`);
  }

  colsEl.innerHTML = cols.join('');
}

function catEmoji(cat) {
  const map = { monumento:'🏛', naturaleza:'🌿', gastronomia:'🍽', museo:'🎨', religioso:'⛪', castillo:'🏰', otros:'📍' };
  return map[cat] || '📍';
}

function itinToggle(id) {
  const idx = itinSelected.indexOf(id);
  if (idx === -1) itinSelected.push(id);
  else itinSelected.splice(idx, 1);
  const q = document.getElementById('itinSearch')?.value || '';
  itinRenderDayColumns(q);
  itinUpdateSelCount();
  itinCheckReady();
}

function itinUpdateSelCount() {
  const el = document.getElementById('itinSelCount');
  if (el) el.textContent = `${itinSelected.length} seleccionado${itinSelected.length!==1?'s':''}`;
}

function itinCheckReady() {
  const btn = document.getElementById('itinGenerateBtn');
  if (!btn) return;
  const ready = document.getElementById('itinDate').value
    && document.getElementById('itinProvince').value;
  btn.disabled = !ready;
  btn.style.opacity = ready ? '1' : '0.4';
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function sortByProximity(markers) {
  if (markers.length <= 1) return markers;
  const remaining = [...markers];
  const sorted = [remaining.splice(0, 1)[0]];
  while (remaining.length) {
    const last = sorted[sorted.length - 1];
    let minDist = Infinity, minIdx = 0;
    remaining.forEach((m, i) => {
      const d = haversine(last.lat, last.lng, m.lat, m.lng);
      if (d < minDist) { minDist = d; minIdx = i; }
    });
    sorted.push(remaining.splice(minIdx, 1)[0]);
  }
  return sorted;
}

function parseHours(weekdayText, jsDay) {
  if (!weekdayText?.length) return null;
  const line  = weekdayText[jsDay === 0 ? 6 : jsDay - 1] || '';
  const match = line.match(/(\d{1,2}):(\d{2})\s*[–\-]\s*(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return {
    openH: parseInt(match[1]), openM: parseInt(match[2]),
    closeH: parseInt(match[3]), closeM: parseInt(match[4]),
    text: line.split(':').slice(1).join(':').trim()
  };
}

function timeStr(h, m) {
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

async function itinGenerate() {
  const btn = document.getElementById('itinGenerateBtn');
  btn.textContent = '⏳ Generando itinerario...';
  btn.disabled = true;

  const province  = document.getElementById('itinProvince').value;
  const dateStr   = document.getElementById('itinDate').value;
  const numDays   = parseInt(document.getElementById('itinDays').value);
  const startDate = new Date(dateStr + 'T00:00:00');

  // Si no hay gustos seleccionados, usar todos los marcadores de la provincia
  const pool = itinSelected.length > 0
    ? itinSelected.map(id => appState.markers.find(m => m.id === id)).filter(Boolean)
    : appState.markers.filter(m => m.province === province && m.lat && m.lng);

  const markers = pool;

  const details = await Promise.all(markers.map(async m => {
    try {
      const res  = await fetch(`/api/photos/details?name=${encodeURIComponent(m.name)}&province=${encodeURIComponent(m.province||'')}`);
      const data = await res.json();
      return { ...m, schedule: data.schedule, rating: data.rating };
    } catch { return { ...m, schedule: null, rating: null }; }
  }));

  const days = [], warnings = [];
  let remaining = sortByProximity(details);

  for (let d = 0; d < numDays; d++) {
    const date    = new Date(startDate);
    date.setDate(startDate.getDate() + d);
    const jsDay   = date.getDay();
    const dayName = DAYS_ES[jsDay];

    const openPlaces = [], closedPlaces = [];
    remaining.forEach(m => {
      if (!m.schedule?.weekday_text?.length) {
        openPlaces.push(m);
      } else {
        const h        = parseHours(m.schedule.weekday_text, jsDay);
        const isClosed = !h || m.schedule.weekday_text[jsDay === 0 ? 6 : jsDay - 1]?.toLowerCase().includes('cerrado');
        if (isClosed) { closedPlaces.push(m); warnings.push({ name: m.name, day: dayName }); }
        else openPlaces.push({ ...m, parsedHours: h });
      }
    });

    const maxPerDay   = Math.ceil(remaining.length / (numDays - d));
    const todayPlaces = sortByProximity(openPlaces).slice(0, Math.min(maxPerDay, 6));

    let currentMin = 9 * 60;
    const scheduled = todayPlaces.map(m => {
      const open = m.parsedHours ? m.parsedHours.openH * 60 + m.parsedHours.openM : 0;
      if (open > currentMin) currentMin = open;
      const slot = { ...m, time: timeStr(Math.floor(currentMin/60), currentMin%60) };
      currentMin += 90 + 15;
      return slot;
    });

    days.push({ date, dayName, jsDay, places: scheduled });
    remaining = remaining.filter(m => !todayPlaces.find(t => t.id === m.id));
  }

  itinResult = { province, dateStr, numDays, days, warnings };

  itinRenderResult();
  btn.textContent = '✦ Generar Itinerario';
  btn.disabled = false;
}

function itinRenderResult() {
  if (!itinResult) return;
  const { province, dateStr, days, warnings } = itinResult;
  const startDate = new Date(dateStr + 'T00:00:00');

  document.getElementById('itinResultTitle').textContent = `Tu itinerario en ${province}`;
  document.getElementById('itinResultSub').textContent =
    `${days.length} día${days.length>1?'s':''} · ${startDate.toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}`;

  document.getElementById('itinDayCards').innerHTML = days.map((day, di) => {
    const dateLabel  = day.date.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});
    const placesHTML = day.places.length
      ? day.places.map(p => {
          // Buscar el marker para obtener el _id (necesario para favoritos)
          const mk = appState.markers.find(m => m.name === p.name && m.province === province)
                  || appState.markers.find(m => m.name === p.name);
          const favBtn = (mk && mk._id) ? `
            <button type="button" class="itin-fav-btn" data-action="itin-fav" data-id="${escHTML(mk._id)}" data-name="${escHTML(p.name)}"
              title="${isFavorite(mk._id) ? 'Quitar de favoritos' : 'Añadir a favoritos'}">
              ${favIcon(isFavorite(mk._id))}
            </button>` : '';
          return `
            <div class="timeline-item" style="position:relative;">
              <div class="time-badge">${p.time}</div>
              <div class="timeline-content" style="padding-right:30px;">
                <h4>${escHTML(p.name)} ${p.rating ? `<span style="font-size:0.72rem;color:var(--terra);font-family:'DM Sans',sans-serif;">★ ${p.rating}</span>` : ''}</h4>
                <p style="margin:2px 0 0;">${p.parsedHours ? `Abierto: ${p.parsedHours.text}` : p.desc || p.cat || ''}</p>
              </div>
              ${favBtn}
            </div>`;
        }).join('')
      : `<p style="color:var(--ink-muted);font-style:italic;font-size:0.85rem;padding:12px 0;">Sin lugares disponibles este día.</p>`;

    return `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="day-plan-card h-100">
          <h3>${DAY_EMOJIS[di] || '📅'} Día ${di+1} — <span style="font-size:1rem;">${dateLabel}</span></h3>
          <div class="timeline">${placesHTML}</div>
        </div>
      </div>`;
  }).join('');

  const warnEl = document.getElementById('itinWarnings');
  if (warnings.length) {
    warnEl.innerHTML = `
      <div style="background:rgba(229,115,115,0.08);border:1px solid rgba(229,115,115,0.25);padding:14px 18px;">
        <div style="font-size:0.75rem;letter-spacing:0.1em;color:#e57373;margin-bottom:8px;">⚠ LUGARES NO DISPONIBLES ESTE DÍA</div>
        <div style="font-size:0.82rem;color:var(--ink-muted);">
          ${warnings.map(w => `<span style="display:inline-block;margin:3px 8px 3px 0;"><b style="color:var(--ink);">${escHTML(w.name)}</b> — cerrado el ${w.day}</span>`).join('')}
        </div>
      </div>`;
  } else {
    warnEl.innerHTML = '';
  }

  document.getElementById('itin-step1').style.display = 'none';
  document.getElementById('itin-step2').style.display = 'block';

  // Botón "Ver ruta en mapa"
  const routeWrap = document.getElementById('itinRouteWrap');
  if (routeWrap) {
    routeWrap.innerHTML = `
      <button type="button" class="btn planner-route-btn" data-action="itin-route">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3"/>
        </svg>&nbsp;Ver ruta en mapa
      </button>`;
  }
}

function itinDrawRoute() {
  if (!itinResult) return;

  const days = itinResult.days.map((day, di) => {
    const dateLabel = day.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const label     = `${DAY_EMOJIS[di] || '📅'} Día ${di + 1} — ${dateLabel}`;
    const places    = day.places.map(p => {
      const mk = appState.markers.find(m => m.name === p.name && m.province === itinResult.province);
      return mk ? { lat: mk.lat, lng: mk.lng, name: p.name } : null;
    }).filter(Boolean);
    return { label, places };
  }).filter(d => d.places.length > 0);

  const totalPlaces = days.reduce((s, d) => s + d.places.length, 0);
  if (totalPlaces < 2) {
    showToast('⚠️ No hay suficientes lugares con coordenadas para trazar la ruta');
    return;
  }

  openRouteMap(null, `Mi itinerario en ${itinResult.province}`, days);
}

function itinReset() {
  document.getElementById('itin-step1').style.display = 'block';
  document.getElementById('itin-step2').style.display = 'none';
}

function itinDownloadPDF() {
  if (!itinResult) return;
  loadScriptOnce(LIB_JSPDF)
    .then(_itinDownloadPDF)
    .catch(() => showToast('No se pudo cargar el generador de PDF. Revisa la conexión.'));
}

function _itinDownloadPDF() {
  if (!itinResult) return;

  const allPlaces = itinResult.days.flatMap((day, di) =>
    day.places.map(p => ({ ...p, dayIndex: di }))
  );

  const { jsPDF } = window.jspdf;
  const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const gold   = [201,168,76], dark = [26,18,9], parch = [245,237,216], W = 210, margin = 18;

  doc.setFillColor(...dark); doc.rect(0,0,W,297,'F');
  doc.setFillColor(...gold); doc.rect(0,0,W,28,'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.setTextColor(...dark);
  doc.text('CASTILLA Y LEÓN', W/2, 12, {align:'center'});
  doc.setFontSize(9); doc.setFont('helvetica','normal');
  doc.text('✦ Mi Itinerario Personalizado ✦', W/2, 19, {align:'center'});

  doc.setFont('helvetica','bold'); doc.setFontSize(24); doc.setTextColor(...gold);
  doc.text(itinResult.province, W/2, 44, {align:'center'});
  doc.setDrawColor(...gold); doc.setLineWidth(0.4); doc.line(margin,50,W-margin,50);
  doc.setFont('helvetica','italic'); doc.setFontSize(9); doc.setTextColor(...parch);
  const startDate = new Date(itinResult.dateStr+'T00:00:00');
  doc.text(startDate.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'}), W/2, 57, {align:'center'});

  let y = 68;
  itinResult.days.forEach((day, di) => {
    if (y > 260) { doc.addPage(); doc.setFillColor(...dark); doc.rect(0,0,W,297,'F'); y = 20; }
    const dateLabel = day.date.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});
    doc.setFillColor(...gold); doc.roundedRect(margin,y,W-margin*2,9,1,1,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...dark);
    doc.text(`DÍA ${di+1} — ${dateLabel.toUpperCase()}`, W/2, y+6, {align:'center'});
    y += 14;

    day.places.forEach((p, i) => {
      if (y > 275) { doc.addPage(); doc.setFillColor(...dark); doc.rect(0,0,W,297,'F'); y = 20; }
      if (i%2===0) { doc.setFillColor(40,28,12); doc.roundedRect(margin,y-1,W-margin*2,15,1,1,'F'); }
      const globalIdx = allPlaces.findIndex(pl => pl.name === p.name && pl.dayIndex === di);
      doc.setFillColor(...gold); doc.roundedRect(margin+2,y+1,10,7,1,1,'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...dark);
      doc.text(String(globalIdx+1), margin+7, y+6, {align:'center'});
      doc.setFillColor(60,40,15); doc.roundedRect(margin+14,y+1,18,7,1,1,'F');
      doc.setTextColor(...gold);
      doc.text(p.time, margin+23, y+6, {align:'center'});
      doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...parch);
      doc.text(p.name, margin+36, y+6);
      y += 16;
    });
    y += 6;
  });

  doc.save(`itinerario-${itinResult.province.toLowerCase()}.pdf`);
}
