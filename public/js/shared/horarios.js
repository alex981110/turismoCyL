// ============================================================
// horarios.js — ¿Está abierto ese día? Sin Google Places
//
// Dos fuentes, por este orden:
//   1. OpenStreetMap: etiqueta opening_hours de los lugares de /api/horarios (por
//      provincia), cruzados con cada lugar por nombre y cercanía (< 400 m).
//   2. La descripción curada del lugar: «Cierra los lunes», «lunes cerrado»…
// Se interpreta solo la sintaxis habitual de opening_hours (meses, días, tramos, off,
// 24/7). Si un horario trae algo que no se entiende, ese día queda «sin confirmar»:
// nunca se da por abierto ni por cerrado lo que no se sabe.
// ============================================================

const _hoursByProvince = {};   // provincia → promesa de [{ n, la, lo, oh, id }]
const _hoursLoaded = {};       // provincia → lista ya recibida (para consultar sin esperar)

function loadProvinceHours(province) {
  if (!province) return Promise.resolve([]);
  if (!_hoursByProvince[province]) {
    _hoursByProvince[province] = fetch('/api/horarios?province=' + encodeURIComponent(province))
      .then(r => r.ok ? r.json() : { lugares: [] })
      .then(d => (_hoursLoaded[province] = (d.lugares || []).map(l => ({ ...l, _n: _hoursNorm(l.n) }))))
      .catch(() => { delete _hoursByProvince[province]; return []; });
  }
  return _hoursByProvince[province];
}

// Horarios de todas las provincias de un plan con fecha de salida
function loadTripHours(cp) {
  if (!cp || !cp.dateStr || !cp.allDays) return Promise.resolve();
  const provs = new Set();
  cp.allDays.forEach(d => { if (d.province) provs.add(d.province); d.items.forEach(i => { if (i.marker?.province) provs.add(i.marker.province); }); });
  return Promise.all([...provs].map(loadProvinceHours));
}

const _hoursNorm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\([^)]*\)/g, ' ')
  .split(/[^a-z0-9]+/).filter(w => w && !['de', 'del', 'la', 'las', 'el', 'los', 'y', 'san', 'santa', 'en'].includes(w)).join(' ');

function _hoursKm(a, b) {
  const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Entrada de OSM de un lugar { name, lat, lng, province }: mismo nombre (o uno contenido en el
// otro) a menos de 400 m. Solo usa datos ya cargados; null si no hay o aún no han llegado.
function osmHoursFor(place) {
  const list = _hoursLoaded[place.province];
  if (!list || !place.lat) return null;
  const n = _hoursNorm(place.name);
  if (!n) return null;
  let best = null, bestKm = 0.4;
  for (const l of list) {
    if (!(l._n === n || (n.length > 5 && l._n.length > 5 && (l._n.includes(n) || n.includes(l._n))))) continue;
    const km = _hoursKm(place, { lat: l.la, lng: l.lo });
    if (km < bestKm) { bestKm = km; best = l; }
  }
  return best;
}

// ── opening_hours de OpenStreetMap ──────────────────────────
const _OH_DAYS = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };
const _OH_MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
const _OH_MONTH_RE = '(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)';
const _OH_DAY_RE = '(?:Mo|Tu|We|Th|Fr|Sa|Su|PH)';

// Conjunto de valores de un selector tipo «Mo-Fr,Su» o «Oct-Jun»; null si no se entiende
function _ohRange(sel, table, size) {
  const out = new Set();
  for (const part of sel.split(',')) {
    const [a, b] = part.trim().split('-');
    if (a === 'PH') continue;                       // festivos: no se sabe cuándo caen
    if (!(a in table) || (b && !(b in table))) return null;
    if (!b) { out.add(table[a]); continue; }
    for (let i = table[a]; ; i = (i + 1) % size) { out.add(i); if (i === table[b]) break; }
  }
  return out;
}

// Una regla → { months?, days?, times: ['10:00-14:00'] | 'off' } o null si no se entiende
function _ohRule(rule) {
  let r = rule.trim().replace(/\s+/g, ' ').replace(/\s*-\s*/g, '-');   // «08:30 - 17:00» → «08:30-17:00»
  if (!r) return { skip: true };
  if (r === '24/7') return { times: ['abierto 24 horas'] };
  let months = null, days = null;
  const m = r.match(new RegExp(`^(${_OH_MONTH_RE}(?:-${_OH_MONTH_RE})?(?:,${_OH_MONTH_RE}(?:-${_OH_MONTH_RE})?)*)\\s*:?\\s*(?=[A-Z0-9]|$)`));
  if (m) { months = _ohRange(m[1], _OH_MONTHS, 12); if (!months) return null; r = r.slice(m[0].length).trim(); }
  const d = r.match(new RegExp(`^(${_OH_DAY_RE}(?:-${_OH_DAY_RE})?(?:,${_OH_DAY_RE}(?:-${_OH_DAY_RE})?)*)\\s*`));
  if (d) {
    days = _ohRange(d[1], _OH_DAYS, 7);
    if (!days) return null;
    if (!days.size) return { skip: true };          // solo festivos
    r = r.slice(d[0].length).trim();
  }
  if (/^(off|closed)$/i.test(r)) return { months, days, times: 'off' };
  if (/^sunrise-sunset$/i.test(r)) return { months, days, times: ['de sol a sol'] };
  if (!r && (days || months)) return { months, days, times: ['abierto'] };
  const times = r.split(/\s*,\s*/);
  if (!times.every(t => /^\d{1,2}:\d{2}-\d{1,2}:\d{2}\+?$/.test(t))) return null;
  return { months, days, times: times.map(t => t.replace(/^(\d):/, '0$1:').replace(/-(\d):/, '-0$1:')) };
}

// Estado del horario OSM un día concreto: { state: 'open'|'closed'|'unknown', text }
function osmHoursOn(oh, date) {
  // «;» separa reglas; una «,» seguida de días o meses también empieza regla nueva
  const rules = oh.split(/\s*(?:;|\|\|)\s*/).flatMap(r => r.split(new RegExp(`\\s*,\\s*(?=(?:${_OH_DAY_RE}|${_OH_MONTH_RE})\\b)`)));
  let result = null, understood = false;
  for (const raw of rules) {
    const rule = _ohRule(raw);
    if (!rule) {
      // Excepción de fechas concretas («Dec 25 off»): solo importa si cae en ese mes
      const dm = raw.match(new RegExp(`^(${_OH_MONTH_RE})\\s+\\d`));
      if (dm && _OH_MONTHS[dm[1]] !== date.getMonth()) continue;
      return { state: 'unknown', text: '' };
    }
    if (rule.skip) continue;
    understood = true;
    if (rule.months && !rule.months.has(date.getMonth())) continue;
    if (rule.days && !rule.days.has(date.getDay())) continue;
    result = rule.times;                             // las reglas posteriores mandan
  }
  if (!understood) return { state: 'unknown', text: '' };
  if (!result || result === 'off') return { state: 'closed', text: 'cerrado' };
  return { state: 'open', text: result.join(', ') };
}

// Texto legible de un opening_hours completo (para la ficha del lugar)
function fmtOSMHours(oh) {
  if (!oh) return null;
  if (oh.trim() === '24/7') return '24 horas, todos los días';
  const M = { Jan: 'ene', Feb: 'feb', Mar: 'mar', Apr: 'abr', May: 'may', Jun: 'jun', Jul: 'jul', Aug: 'ago', Sep: 'sep', Oct: 'oct', Nov: 'nov', Dec: 'dic' };
  const D = { Mo: 'L', Tu: 'M', We: 'X', Th: 'J', Fr: 'V', Sa: 'S', Su: 'D', PH: 'festivos' };
  return oh.replace(new RegExp(`\\b${_OH_MONTH_RE}\\b`, 'g'), m => M[m])
    .replace(new RegExp(`\\b${_OH_DAY_RE}\\b`, 'g'), d => D[d])
    .replace(/\boff\b|\bclosed\b/g, 'cerrado')
    .replace(/sunrise-sunset/g, 'de sol a sol')
    .replace(/;\s*/g, ' · ');
}

// ── Cierres escritos en la descripción curada ──────────────
const _DESC_DAYS = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 };
function descClosedDays(desc) {
  const text = (desc || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const days = new Set();
  const day = '(domingo|lunes|martes|miercoles|jueves|viernes|sabado)s?';
  const patterns = [
    new RegExp(`cierran? (?:los |el )?${day}(?:\\s*y\\s*(?:los |el )?${day})?`, 'g'),
    new RegExp(`cerrados? (?:los |el )?${day}(?:\\s*y\\s*(?:los |el )?${day})?`, 'g'),
    new RegExp(`${day}:? cerrado`, 'g'),
  ];
  patterns.forEach(re => { for (const m of text.matchAll(re)) [m[1], m[2]].forEach(d => { if (d) days.add(_DESC_DAYS[d]); }); });
  return days;
}

// Horario de un lugar { name, lat, lng, province, desc } un día: lo que se sepa y de dónde sale
function placeHoursOn(place, date) {
  const osm = osmHoursFor(place);
  if (osm) {
    const h = osmHoursOn(osm.oh, date);
    if (h.state !== 'unknown') return { ...h, source: 'OSM', osm };
  }
  if (descClosedDays(place.desc).has(date.getDay())) return { state: 'closed', text: 'cerrado', source: 'descripción' };
  return { state: 'unknown', text: '', source: osm ? 'OSM' : null };
}

const _planPlace = item => ({
  name: item.place || item.marker?.name, lat: item.marker?.lat || item.lat, lng: item.marker?.lng || item.lng,
  province: item.marker?.province, desc: item.desc,
});

// Chip bajo un lugar del plan: abierto con su horario o cerrado ese día (nada si no se sabe)
function placeDayHoursHTML(item, date) {
  if (item.kind === 'night') return '';
  const h = placeHoursOn(_planPlace(item), date);
  if (h.state === 'open') return `<span class="plan-hours">Abierto ${escHTML(h.text)} <small>${h.source}</small></span>`;
  if (h.state === 'closed') return `<span class="plan-hours is-closed">Cerrado este día <small>${h.source}</small></span>`;
  return '';
}

// Nota bajo la fecha de salida: cuántos lugares tienen horario confirmado y cuántos cierran
function tripHoursNoteHTML(cp) {
  let known = 0, total = 0, closed = 0;
  cp.allDays.forEach((d, i) => {
    const date = tripDayDate(cp.dateStr, i);
    d.items.forEach(item => {
      if (item.kind === 'night') return;
      total++;
      const h = placeHoursOn(_planPlace(item), date);
      if (h.state !== 'unknown') known++;
      if (h.state === 'closed') closed++;
    });
  });
  return `<p class="plan-hours-note">${closed ? `<strong>${closed} lugar${closed !== 1 ? 'es' : ''} cerrado${closed !== 1 ? 's' : ''} el día que toca.</strong> ` : ''}Horario confirmado en ${known} de ${total} lugares (OpenStreetMap y descripciones); comprueba el resto antes de ir.</p>`;
}

// Tarjeta de «Mis itinerarios»: lugares cerrados el día que se visitan
function renderTripClosures(it) {
  const box = document.getElementById('myitinClosures_' + it._id);
  if (!box || !it.dateStr) return;
  const provs = new Set();
  (it.days || []).forEach(d => (d.places || []).forEach(p => provs.add(p.province || d.province || it.province)));
  Promise.all([...provs].map(loadProvinceHours)).then(() => {
    const closures = [];
    let known = 0, total = 0;
    (it.days || []).forEach((d, i) => {
      const date = tripDayDate(it.dateStr, i);
      (d.places || []).forEach(p => {
        if (p.kind === 'night' || p.cat === 'pernocta') return;
        total++;
        const h = placeHoursOn({ name: p.name, lat: p.lat, lng: p.lng, province: p.province || d.province || it.province, desc: p.desc }, date);
        if (h.state !== 'unknown') known++;
        if (h.state === 'closed') closures.push(`Día ${i + 1} (${date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}): ${p.name}`);
      });
    });
    box.hidden = false;
    box.classList.toggle('is-ok', !closures.length);
    box.innerHTML = closures.length
      ? `<strong>Cerrado el día que toca</strong><ul>${closures.map(c => `<li>${escHTML(c)}</li>`).join('')}</ul><small>Horario confirmado en ${known} de ${total} lugares.</small>`
      : `<strong>Nada cerrado en tus fechas</strong><small>Horario confirmado en ${known} de ${total} lugares; comprueba el resto antes de ir.</small>`;
  });
}
