// ============================================================
// MONTAJE DEL PLAN PERSONALIZADO (cuestionario «Mis gustos»)
// ============================================================
// En lugar de copiar los días curados tal cual, se usa todo lo curado de la provincia
// (dayPlans + dayPlansExtra) como una bolsa de lugares:
//   1. puntuar cada lugar con los gustos (orden del ranking) + un extra a los imprescindibles
//   2. montar cada día alrededor del mejor lugar que quede, con los mejores a menos de 25 km
//      (cada día, una zona); comidas y planes de noche según los gustos
//   3. ordenar cada día como ruta y calcular las horas (10:00, comida 14:00, tarde, noche)
// Los eventos de temporada (festivales, mercados medievales…) no se proponen: dependen de la fecha.

const PLAN_CFG = {
  visitsPerDay: 3,
  visitMin: 90,        // duración de cada visita
  startMin: 10 * 60,   // primera visita
  lunchMin: 14 * 60,   // comida
  afternoonMin: 16 * 60 + 30,
  eveningMin: 20 * 60 + 30,
  speedKmh: 45,        // para estimar trayectos entre lugares
  zoneKm: [25, 50, 100, Infinity], // radios para completar un día alrededor de su mejor lugar
};

// Categorías del mapa que corresponden a cada gusto
const PREF_CATS = {
  monumentos: ['monumento', 'historia'],
  museos:     ['museo', 'exposicion'],
  naturaleza: ['naturaleza'],
  gastro:     ['gastronomia', 'bar'],
  religioso:  [],
  teatro:     ['teatro'],
  pueblos:    [],
};
const SEASONAL_EVENT = /festival|seminci|noche en las velas|mercado medieval/i;

// Gusto al que corresponde cada grupo de extras curados
const EXTRA_GROUP_PREF = { gastro: 'gastro', naturaleza: 'naturaleza', pueblos: 'pueblos', teatro: 'teatro' };

function _planKm(a, b) {
  const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
function _planTime(min) { return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0'); }
function _planTravelMin(a, b) { return Math.max(15, Math.ceil(_planKm(a, b) / PLAN_CFG.speedKmh * 60 / 15) * 15); }

// Tipo de parada: visita (horario de día), comida (14:00) o noche (20:30)
function _planKind(item) {
  const name = (item.place || '').toLowerCase();
  if (item._group === 'gastro') {
    if (/tapeo|tapas/.test(name)) return 'evening';
    if (/restaurante|mesón|meson|asador/.test(name)) return 'meal';
    return 'visit';                                   // bodegas, mercados, quesos
  }
  if (item._group === 'teatro') return 'evening';     // teatros y festivales
  if ((item.time || '') >= '20:00') return 'evening';
  if (/restaurante|mesón|meson|asador/.test(name)) return 'meal';
  return 'visit';
}

// Todos los lugares curados de una provincia con coordenadas dentro de ella
function planPool(province) {
  const base = dayPlans[province] || {};
  const extras = (typeof dayPlansExtra !== 'undefined' && dayPlansExtra[province]) || {};
  const raw = [];
  Object.keys(base).filter(k => /^dia\d+$/.test(k))
    .sort((a, b) => +a.slice(3) - +b.slice(3))
    .forEach((k, di) => (base[k] || []).forEach((it, ii) => raw.push({ ...it, _day: di, _pos: ii, _group: null })));
  Object.entries(extras).forEach(([group, arr]) => (arr || []).forEach(it => raw.push({ ...it, _day: null, _pos: 0, _group: group })));

  const seen = new Set(), pool = [];
  for (const it of raw) {
    const key = (it.place || '').toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    if (PLACES_OUTSIDE_PROVINCE.has(province + '|' + it.place)) continue;
    if (SEASONAL_EVENT.test(it.place)) continue;
    // Solo marcadores de la misma provincia (hay nombres repetidos en varias)
    const mk = appState.markers.find(m => m.province === province && m.lat && m.name.toLowerCase() === key);
    const c = mk ? [mk.lat, mk.lng] : PLACE_COORDS[it.place];
    if (!c) continue;
    const marker = mk
      ? { ...mk, photo: it.photo || mk.photo || null }
      : { name: it.place, photo: it.photo || null, cat: it.cat || null, lat: c[0], lng: c[1], province };
    const item = { ...it, marker, lat: c[0], lng: c[1], kind: _planKind(it), _norm: _planNorm(it.place) };
    // Casi duplicados («Hoces del Duratón» / «Hoces del Río Duratón», o un museo dentro del
    // palacio que ya está): mismo nombre normalizado, o uno contenido en otro a menos de 1 km
    const dup = pool.find(p => p.kind === item.kind && (p._norm === item._norm ||
      (_planKm(p, item) < 1 && (p._norm.includes(item._norm) || item._norm.includes(p._norm)))));
    if (!dup) pool.push(item);
  }
  return pool;
}

// Nombre sin artículos, preposiciones, «río» ni paréntesis, para detectar casi duplicados
function _planNorm(name) {
  return (name || '').toLowerCase().replace(/\([^)]*\)/g, ' ')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/).filter(w => w && !['de', 'del', 'la', 'las', 'el', 'los', 'y', 'rio', 'san'].includes(w))
    .join(' ');
}

// Cuánto encaja un lugar con un gusto: 1 por categoría o grupo temático, 0,6 por palabra clave
function _planFit(item, pref) {
  const cat = (item.marker && item.marker.cat) || item.cat || '';
  if (EXTRA_GROUP_PREF[item._group] === pref || (PREF_CATS[pref] || []).includes(cat)) return 1;
  const text = ((item.place || '') + ' ' + (item.desc || '')).toLowerCase();
  // Gustos sin categoría propia en el mapa (religioso, pueblos) dependen solo de las palabras clave
  const kwFit = (PREF_CATS[pref] || []).length ? 0.6 : 1;
  return (OB_KEYWORDS[pref] || []).some(kw => text.includes(kw)) ? kwFit : 0;
}

// Afinidad con los gustos: cada gusto cuenta una vez; el 1.º pesa 1, el 2.º 0,75… (mín. 0,25).
// También la usan las etiquetas «★ Para ti» / «✦ Rec.» del plan.
function planAffinity(item, ranking) {
  let fit = 0;
  ranking.forEach((pref, pos) => { fit += Math.max(0.25, 1 - pos * 0.25) * _planFit(item, pref); });
  return fit;
}

// Puntuación: afinidad + imprescindibles curados (los de los primeros días de cada provincia),
// para que entre lugares afines ganen los mejores
function planScore(item, ranking) {
  const fit = planAffinity(item, ranking);
  const MUST = [6, 5, 3.5, 2.5, 1.5, 1.5, 1.5];
  const highlight = item._day !== null ? (MUST[item._day] || 1.5) - item._pos * 0.1 : 1;
  return fit * 10 + highlight;
}

// Días por zona: cada día empieza por el mejor lugar que quede y se completa con los mejores
// que estén cerca; el radio solo se amplía si no hay bastantes. Los días salen ya ordenados
// de más a menos interesantes porque cada uno arranca con el mejor lugar disponible.
function _planZones(visits, numDays) {
  const left = visits.slice();              // ya ordenadas por puntuación
  const days = [];
  while (days.length < numDays && left.length) {
    const seed = left.shift();
    const day = [seed];
    for (const r of PLAN_CFG.zoneKm) {
      for (let i = 0; i < left.length && day.length < PLAN_CFG.visitsPerDay; ) {
        if (_planKm(seed, left[i]) <= r) day.push(left.splice(i, 1)[0]);
        else i++;
      }
      if (day.length >= PLAN_CFG.visitsPerDay) break;
    }
    days.push(day);
  }
  return days;
}

// Orden de visita más corto (pocas paradas: se prueban todas las permutaciones)
function _planRoute(stops) {
  if (stops.length <= 2) return stops.slice();
  let best = null, bestLen = Infinity;
  const permute = (arr, done) => {
    if (!arr.length) {
      let len = 0;
      for (let i = 1; i < done.length; i++) len += _planKm(done[i - 1], done[i]);
      if (len < bestLen) { bestLen = len; best = done; }
      return;
    }
    arr.forEach((x, i) => permute([...arr.slice(0, i), ...arr.slice(i + 1)], [...done, x]));
  };
  permute(stops, []);
  return best;
}

// Horario de un día: visitas de mañana, comida, visitas de tarde y plan de noche
function _planSchedule(visits, meal, evening) {
  const route = _planRoute(visits);
  const out = [];
  let t = PLAN_CFG.startMin, prev = null, lunchDone = false;
  for (const v of route) {
    if (prev) t += _planTravelMin(prev, v);
    // Si la visita no termina antes de comer, se pasa a la tarde
    if (!lunchDone && t + PLAN_CFG.visitMin > PLAN_CFG.lunchMin) {
      if (meal) { out.push({ ...meal, time: _planTime(PLAN_CFG.lunchMin) }); prev = meal; }
      lunchDone = true;
      t = Math.max(t, PLAN_CFG.afternoonMin);
    }
    out.push({ ...v, time: _planTime(t) });
    t += PLAN_CFG.visitMin;
    prev = v;
  }
  if (!lunchDone && meal) out.push({ ...meal, time: _planTime(PLAN_CFG.lunchMin) });
  if (evening) out.push({ ...evening, time: _planTime(Math.max(t, PLAN_CFG.eveningMin)) });
  return out;
}

// Días de una provincia
function planProvinceDays(province, ranking, numDays) {
  const pool = planPool(province)
    .map(it => ({ ...it, score: planScore(it, ranking) }))
    .sort((a, b) => b.score - a.score);
  const likes = id => ranking.includes(id);

  const meals = likes('gastro') ? pool.filter(i => i.kind === 'meal').slice(0, numDays) : [];
  const evenings = (likes('teatro') || likes('gastro')) ? pool.filter(i => i.kind === 'evening').slice(0, numDays) : [];
  const groups = _planZones(pool.filter(i => i.kind === 'visit'), numDays)
    .map(g => ({ visits: g, lat: g.reduce((s, v) => s + v.lat, 0) / g.length, lng: g.reduce((s, v) => s + v.lng, 0) / g.length }));
  if (!groups.length) return [];

  // Comidas y planes de noche: al día con la zona más cercana que aún no tenga uno
  const assign = (extras) => {
    const taken = new Map();
    for (const e of extras) {
      const order = groups.map((g, i) => [i, _planKm(g, e)]).sort((a, b) => a[1] - b[1]);
      const free = order.find(([i]) => !taken.has(i));
      if (free) taken.set(free[0], e);
    }
    return taken;
  };
  const mealOf = assign(meals), eveningOf = assign(evenings);

  return groups.map((g, i) => _planSchedule(g.visits, mealOf.get(i), eveningOf.get(i)));
}

// Plan completo: una o varias provincias, con los días repartidos entre ellas
function buildTripPlan(provinces, ranking, numDays) {
  const EMOJIS = ['🌅', '🌄', '🌇', '🌆', '🌃', '🌉', '🌁'];
  const DAY_LABELS = ['Sábado', 'Domingo', 'Día 3', 'Día 4', 'Día 5', 'Día 6', 'Día 7'];
  const multi = provinces.length > 1;
  const split = multi ? _obSplitDays(numDays, provinces.length) : [numDays];
  const allDays = [];
  provinces.forEach((prov, pi) => {
    planProvinceDays(prov, ranking, split[pi]).forEach((items, d) => {
      const n = allDays.length;
      allDays.push({
        key: multi ? `${prov}_dia${d + 1}` : 'dia' + (n + 1),
        label: multi ? `${prov} · Día ${d + 1}` : (DAY_LABELS[n] || 'Día ' + (n + 1)),
        emoji: EMOJIS[n] || '📅',
        province: prov,
        items,
      });
    });
  });
  return allDays;
}
