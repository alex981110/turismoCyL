// ============================================================
// pernocta.js — Dónde dormir en autocaravana (datos del proyecto Caravana)
//
// Caravana publica cada lunes data/sitios.json con las áreas, campings,
// parkings y puntos de vaciado de España (OpenStreetMap + registros oficiales).
// Aquí se descarga, se recorta a las nueve provincias con su GeoJSON y se
// guarda en memoria. Si Caravana no responde, se sirve la última copia
// guardada en public/assets/data/pernocta.json (npm run pernocta).
// ============================================================
const express = require('express');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();

const { provinceOf } = require('./geo');

const SOURCE        = process.env.PERNOCTA_URL || 'https://alex981110.github.io/caravana/data/sitios.json';
const SNAPSHOT_PATH = path.join(__dirname, '../../public/assets/data/pernocta.json');
const TTL_MS        = 12 * 60 * 60 * 1000;

async function buildPernocta() {
  const res = await fetch(SOURCE, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Caravana respondió HTTP ${res.status}`);
  const data = await res.json();
  const sitios = [];
  for (const s of data.sitios || []) {
    const p = provinceOf(s.lo, s.la);
    if (p) sitios.push({ ...s, p });
  }
  return { generado: data.generado, registros: data.registros || {}, sitios };
}

let cache = null;     // { at, data }
let pending = null;   // descarga en curso, compartida entre peticiones

function readSnapshot() {
  try { return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8')); }
  catch { return null; }
}

async function getPernocta() {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;
  if (!pending) {
    pending = buildPernocta()
      .then(data => { cache = { at: Date.now(), data }; return data; })
      .finally(() => { pending = null; });
  }
  try {
    return await pending;
  } catch (e) {
    console.error('⚠️ Pernocta: no se pudo descargar Caravana —', e.message);
    return cache ? cache.data : readSnapshot();
  }
}

// GET /api/pernocta — público
router.get('/', async (req, res) => {
  const data = await getPernocta();
  if (!data) return res.status(503).json({ error: 'Datos de pernocta no disponibles' });
  res.set('Cache-Control', 'public, max-age=3600');
  res.json(data);
});

module.exports = router;
module.exports.buildPernocta = buildPernocta;
module.exports.SNAPSHOT_PATH = SNAPSHOT_PATH;
