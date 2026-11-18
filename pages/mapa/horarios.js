// ============================================================
// horarios.js — Horarios de apertura desde OpenStreetMap
//
// Sin clave de Google Places, los horarios salen de la etiqueta opening_hours de
// OpenStreetMap (ODbL). Se descargan con Overpass los lugares de Castilla y León que
// pueden estar en un plan (museos, monumentos, iglesias, teatros, restaurantes…) y
// tienen horario, se reparten por provincia y se guardan una semana en memoria. Si
// Overpass no responde, se sirve la última copia guardada en
// public/assets/data/horarios.json (npm run horarios). El cruce con cada lugar del plan
// (por nombre y cercanía) se hace en el navegador: public/js/shared/horarios.js.
// ============================================================
const express = require('express');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();
const { provinceOf, CYL_BBOX } = require('./geo');

// Servidores de Overpass, en orden: si uno está saturado se prueba el siguiente
const OVERPASS = [process.env.OVERPASS_URL, 'https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'].filter(Boolean);
const SNAPSHOT_PATH = path.join(__dirname, '../../public/assets/data/horarios.json');
const TTL_MS        = 7 * 24 * 60 * 60 * 1000;

// Una consulta sencilla por provincia (la de toda la comunidad con filtros satura Overpass);
// el tipo de lugar se filtra aquí con las etiquetas que llegan
const PROVINCE_BBOX = {
  'Ávila': '40.15,-5.75,41.21,-4.15', 'Burgos': '41.45,-4.45,43.25,-2.85', 'León': '42.0,-7.1,43.25,-4.7',
  'Palencia': '41.75,-4.95,43.1,-3.95', 'Salamanca': '40.2,-6.95,41.25,-5.0', 'Segovia': '40.65,-4.6,41.6,-3.2',
  'Soria': '41.05,-3.6,42.2,-1.75', 'Valladolid': '41.05,-5.65,42.3,-4.05', 'Zamora': '41.25,-6.95,42.35,-5.25',
};
const queryFor = bbox => `[out:json][timeout:120];nwr["name"]["opening_hours"](${bbox});out center tags;`;

// ¿Puede ser un lugar de un plan? (museo, monumento, iglesia, teatro, restaurante, parque…)
const RELEVANT = t =>
  /^(museum|attraction|gallery|zoo|theme_park|viewpoint|aquarium)$/.test(t.tourism || '') ||
  !!t.historic ||
  /^(place_of_worship|theatre|cinema|library|arts_centre|restaurant|exhibition_centre)$/.test(t.amenity || '') ||
  /^(park|garden|nature_reserve)$/.test(t.leisure || '');

async function fetchOverpass(query) {
  let lastError;
  for (const url of OVERPASS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'turismoCyL/1.0 (horarios de apertura)' },
        signal: AbortSignal.timeout(150000),
      });
      if (!res.ok) throw new Error(`${new URL(url).host} respondió HTTP ${res.status}`);
      return await res.json();
    } catch (e) { lastError = e; }
  }
  throw lastError;
}

// previous: datos anteriores; una provincia que falle conserva los suyos
async function buildHorarios(previous) {
  const byProvince = {}, failed = [];
  for (const [province, bbox] of Object.entries(PROVINCE_BBOX)) {
    try {
      const data = await fetchOverpass(queryFor(bbox));
      const seen = new Set();
      byProvince[province] = [];
      for (const e of data.elements || []) {
        const la = e.lat ?? e.center?.lat, lo = e.lon ?? e.center?.lon;
        if (la == null || !e.tags?.opening_hours || !RELEVANT(e.tags)) continue;
        if (provinceOf(lo, la) !== province) continue;   // el recuadro pisa provincias vecinas
        const id = e.type[0] + e.id;
        if (seen.has(id)) continue;
        seen.add(id);
        byProvince[province].push({ n: e.tags.name, la: +la.toFixed(5), lo: +lo.toFixed(5), oh: e.tags.opening_hours, id });
      }
    } catch (e) {
      failed.push(province);
      if (previous?.provincias?.[province]) byProvince[province] = previous.provincias[province];
    }
  }
  if (failed.length === Object.keys(PROVINCE_BBOX).length) throw new Error('Overpass no respondió para ninguna provincia');
  return { generado: new Date().toISOString().slice(0, 10), provincias: byProvince, ...(failed.length ? { sinActualizar: failed } : {}) };
}

let cache = null;     // { at, data }
let pending = null;   // descarga en curso, compartida entre peticiones

function readSnapshot() {
  try { return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8')); }
  catch { return null; }
}

async function getHorarios() {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;
  // Mientras se descarga (tarda), se responde con la copia guardada si la hay
  const snapshot = cache ? cache.data : readSnapshot();
  if (!pending) {
    pending = buildHorarios(snapshot)
      .then(data => { cache = { at: Date.now(), data }; return data; })
      .catch(e => { console.error('⚠️ Horarios: no se pudo descargar de Overpass —', e.message); return null; })
      .finally(() => { pending = null; });
  }
  if (snapshot) return snapshot;
  return (await pending) || null;
}

// GET /api/horarios?province=León — lugares con horario de esa provincia (o de todas)
router.get('/', async (req, res) => {
  const data = await getHorarios();
  if (!data) return res.status(503).json({ error: 'Horarios no disponibles' });
  const { province } = req.query;
  res.set('Cache-Control', 'public, max-age=86400');
  res.json(province
    ? { generado: data.generado, provincia: province, lugares: data.provincias[province] || [] }
    : data);
});

module.exports = router;
module.exports.buildHorarios = buildHorarios;
module.exports.SNAPSHOT_PATH = SNAPSHOT_PATH;
