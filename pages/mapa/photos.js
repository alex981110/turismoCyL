const express = require('express');
const router  = express.Router();

const KEY = process.env.GOOGLE_PLACES_KEY;

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
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photo_reference=${ref}&key=${KEY}`;
}

// GET /api/photos/search?name=...&province=...
// Devuelve la URL de la primera foto del lugar
router.get('/search', async (req, res) => {
  const { name, province } = req.query;
  if (!name) return res.status(400).json({ error: 'Falta el parámetro name' });
  try {
    const query = encodeURIComponent(`${name} ${province || ''} España`);
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${KEY}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    if (!searchData.results?.length) return res.json({ photo: null });
    const place = searchData.results[0];
    if (!place.photos?.length) return res.json({ photo: null });
    res.json({
      photo: photoUrl(place.photos[0].photo_reference),
      place_name: place.name,
      place_id: place.place_id
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/photos/details?name=...&province=...
// Devuelve reseñas + horarios + fotos en una sola llamada
router.get('/details', async (req, res) => {
  const { name, province } = req.query;
  if (!name) return res.status(400).json({ error: 'Falta el parámetro name' });

  try {
    const placeId = await findPlaceId(name, province);
    if (!placeId) return res.json({ reviews: [], photos: [], hours: null });

    const fields = 'name,rating,user_ratings_total,reviews,photos,opening_hours,current_opening_hours';
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&language=es&key=${KEY}`;
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

    res.json({
      place_name: r.name || name,
      place_id: placeId,
      rating: r.rating || null,
      total_ratings: r.user_ratings_total || 0,
      reviews,
      photos,
      schedule
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/photos/staticmap?places=[{lat,lng,name}]
// Devuelve imagen PNG del mapa estático con los marcadores numerados
router.get('/staticmap', async (req, res) => {
  const { places } = req.query;
  if (!places) return res.status(400).json({ error: 'Falta places' });

  try {
    const pts = JSON.parse(places);
    if (!pts.length) return res.status(400).json({ error: 'Sin lugares' });

    // Construir markers numerados
    const markerParams = pts.map((p, i) =>
      `markers=color:0xC9A84C%7Clabel:${i+1}%7C${p.lat},${p.lng}`
    ).join('&');

    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=800x400&maptype=roadmap&${markerParams}&key=${KEY}`;

    const mapRes = await fetch(mapUrl);
    if (!mapRes.ok) return res.status(500).json({ error: 'Error en Google Static Maps' });

    const buffer = await mapRes.arrayBuffer();
    res.set('Content-Type', 'image/png');
    res.send(Buffer.from(buffer));

  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
