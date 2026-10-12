const express = require('express');
const router  = express.Router();
const rateLimit       = require('../../middleware/rateLimit');
const { serverError } = require('../../middleware/errors');

const KEY = process.env.GOOGLE_PLACES_KEY;

// Estas rutas son públicas (el mapa las usa sin sesión) y cada llamada a
// Google cuesta dinero, así que se protegen con tres capas:
//  1. límite por IP, 2. caché en memoria, 3. tope diario global de llamadas.
const detailsLimiter   = rateLimit({ windowMs: 60 * 1000, max: 30 });
const staticmapLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });

const DAILY_CAP = Number(process.env.GOOGLE_DAILY_CAP || 1000);
let budget = { day: '', used: 0 };
function spendGoogleCall(n = 1) {
  const today = new Date().toISOString().slice(0, 10);
  if (budget.day !== today) budget = { day: today, used: 0 };
  if (budget.used + n > DAILY_CAP) return false;
  budget.used += n;
  return true;
}

const CACHE_TTL = 24 * 60 * 60 * 1000;
const CACHE_MAX = 2000;
const cache = new Map();
function cacheGet(k) {
  const hit = cache.get(k);
  if (!hit) return null;
  if (hit.exp < Date.now()) { cache.delete(k); return null; }
  return hit.value;
}
function cacheSet(k, value) {
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(k, { value, exp: Date.now() + CACHE_TTL });
}

const isStr = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

// ── Helper: busca el place_id por nombre + provincia ────────
async function findPlaceId(name, province) {
  const query = encodeURIComponent(`${name} ${province || ''} España`);
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.results || data.results.length === 0) return null;
  return data.results[0].place_id;
}

// ── Helper: URL de foto de Google Places ────────────────────
function photoUrl(ref, maxwidth = 800) {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photo_reference=${encodeURIComponent(ref)}&key=${KEY}`;
}

// GET /api/photos/details?name=...&province=...
// Devuelve reseñas + horarios + fotos en una sola llamada
router.get('/details', detailsLimiter, async (req, res) => {
  const { name, province } = req.query;
  if (!isStr(name, 120)) return res.status(400).json({ error: 'Parámetro name no válido' });
  if (province !== undefined && (typeof province !== 'string' || province.length > 40)) {
    return res.status(400).json({ error: 'Parámetro province no válido' });
  }
  if (!KEY) return res.json({ reviews: [], photos: [], schedule: null });

  const cacheKey = `${name.trim().toLowerCase()}|${(province || '').trim().toLowerCase()}`;
  const cached = cacheGet(cacheKey);
  if (cached) return res.json(cached);

  // textsearch + details = 2 llamadas a Google
  if (!spendGoogleCall(2)) {
    return res.status(503).json({ error: 'Servicio de fotos no disponible temporalmente' });
  }

  try {
    const placeId = await findPlaceId(name, province);
    if (!placeId) {
      const empty = { reviews: [], photos: [], schedule: null };
      cacheSet(cacheKey, empty);
      return res.json(empty);
    }

    const fields = 'name,rating,user_ratings_total,reviews,photos,opening_hours,current_opening_hours';
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&language=es&key=${KEY}`;
    const detailsRes = await fetch(detailsUrl);
    const detailsData = await detailsRes.json();
    const r = detailsData.result || {};

    // Fotos — devolvemos hasta 6 URLs
    const photos = (r.photos || []).slice(0, 6).map(p => photoUrl(p.photo_reference, 800));

    // Horarios
    const hours = r.opening_hours || r.current_opening_hours || null;
    const schedule = hours ? {
      open_now: hours.open_now ?? null,
      weekday_text: hours.weekday_text || []
    } : null;

    // Reseñas
    const reviews = (r.reviews || []).slice(0, 5).map(rv => ({
      author: rv.author_name,
      stars: rv.rating,
      text: rv.text,
      date: rv.relative_time_description,
      photo: rv.profile_photo_url
    }));

    const result = {
      place_name: r.name || name,
      place_id: placeId,
      rating: r.rating || null,
      total_ratings: r.user_ratings_total || 0,
      reviews,
      photos,
      schedule
    };
    cacheSet(cacheKey, result);
    res.json(result);

  } catch (e) {
    serverError(res, e);
  }
});

// GET /api/photos/staticmap?places=[{lat,lng,name}]
// Devuelve imagen PNG del mapa estático con los marcadores numerados
router.get('/staticmap', staticmapLimiter, async (req, res) => {
  const { places } = req.query;
  if (typeof places !== 'string' || places.length > 20000) {
    return res.status(400).json({ error: 'Falta places' });
  }
  if (!KEY) return res.status(503).json({ error: 'Mapa estático no disponible' });

  let pts;
  try { pts = JSON.parse(places); } catch { return res.status(400).json({ error: 'places no es JSON válido' }); }
  if (!Array.isArray(pts) || !pts.length) return res.status(400).json({ error: 'Sin lugares' });
  pts = pts.slice(0, 26); // URL de Google acotada

  // Solo coordenadas numéricas dentro de rango: nada de texto libre en la URL de Google
  const coords = [];
  for (const p of pts) {
    const lat = Number(p && p.lat), lng = Number(p && p.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return res.status(400).json({ error: 'Coordenadas no válidas' });
    }
    coords.push([lat.toFixed(6), lng.toFixed(6)]);
  }

  if (!spendGoogleCall(1)) {
    return res.status(503).json({ error: 'Mapa estático no disponible temporalmente' });
  }

  try {
    // Construir markers numerados
    const markerParams = coords.map(([lat, lng], i) =>
      `markers=color:0xC9A84C%7Clabel:${i + 1}%7C${lat},${lng}`
    ).join('&');

    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=800x400&maptype=roadmap&${markerParams}&key=${KEY}`;

    const mapRes = await fetch(mapUrl);
    if (!mapRes.ok) return res.status(502).json({ error: 'Error en Google Static Maps' });

    const buffer = await mapRes.arrayBuffer();
    res.set('Content-Type', 'image/png');
    res.send(Buffer.from(buffer));

  } catch (e) {
    serverError(res, e);
  }
});

module.exports = router;
