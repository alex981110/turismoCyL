const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const { requireAuth, requireAdmin } = require('../../middleware/auth');
const { serverError } = require('../../middleware/errors');

const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const markerSchema = new mongoose.Schema({
  id:       { type: Number, unique: true },
  name:     String,
  lat:      Number,
  lng:      Number,
  province: String,
  cat:      String,
  desc:     String,
  photo:    String,
  website:  String,
});
const Marker = mongoose.models.Marker || mongoose.model('Marker', markerSchema);

// GET /api/markers — público
router.get('/', async (req, res) => {
  try {
    const { province, cat, q } = req.query;
    const filter = {};
    if (typeof province === 'string' && province) filter.province = province;
    if (typeof cat === 'string' && cat)           filter.cat = cat;
    if (typeof q === 'string' && q) {
      // Texto literal: sin metacaracteres de regex (evita ReDoS) y acotado
      filter.name = { $regex: escapeRegex(q.slice(0, 100)), $options: 'i' };
    }
    res.json(await Marker.find(filter));
  } catch (e) {
    serverError(res, e);
  }
});

// GET /api/markers/:id — público
router.get('/:id', async (req, res) => {
  try {
    const marker = await Marker.findById(req.params.id);
    if (!marker) return res.status(404).json({ error: 'Marcador no encontrado' });
    res.json(marker);
  } catch (e) {
    serverError(res, e);
  }
});

// POST /api/markers — solo admin
router.post('/', requireAdmin, async (req, res) => {
  try {
    const newMarker = await new Marker(req.body).save();
    res.status(201).json(newMarker);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/markers/:id — solo admin
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const marker = await Marker.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!marker) return res.status(404).json({ error: 'Marcador no encontrado' });
    res.json(marker);
  } catch (e) {
    serverError(res, e);
  }
});

// PATCH /api/markers/:id/photo — solo admin
router.patch('/:id/photo', requireAdmin, async (req, res) => {
  try {
    const { photo } = req.body;
    if (photo === undefined) return res.status(400).json({ error: 'El campo photo es requerido' });
    const marker = await Marker.findByIdAndUpdate(req.params.id, { photo }, { new: true });
    if (!marker) return res.status(404).json({ error: 'Marcador no encontrado' });
    res.json({ _id: marker._id, photo: marker.photo });
  } catch (e) {
    serverError(res, e);
  }
});

// DELETE /api/markers/:id — solo admin
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const result = await Marker.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Marcador no encontrado' });
    res.json({ success: true });
  } catch (e) {
    serverError(res, e);
  }
});

module.exports = router;
module.exports.Marker = Marker;
