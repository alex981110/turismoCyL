const express      = require('express');
const router       = express.Router();
const Itinerary    = require('../../models/Itinerary');
const { requireAuth } = require('../../middleware/auth');

// Todas las rutas requieren autenticación
router.use(requireAuth);

const MAX_ITINERARIES = 3;

// GET /api/itineraries — itinerarios del usuario autenticado (más reciente primero)
router.get('/', async (req, res) => {
  try {
    const items = await Itinerary.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/itineraries/:id — un itinerario concreto
router.get('/:id', async (req, res) => {
  try {
    const item = await Itinerary.findOne({ _id: req.params.id, userId: req.user.id });
    if (!item) return res.status(404).json({ error: 'No encontrado' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/itineraries — guardar un nuevo itinerario (máx. 3)
router.post('/', async (req, res) => {
  try {
    const count = await Itinerary.countDocuments({ userId: req.user.id });
    if (count >= MAX_ITINERARIES) {
      return res.status(409).json({
        error: `Has alcanzado el límite de ${MAX_ITINERARIES} itinerarios guardados. Elimina alguno antes de guardar uno nuevo.`,
        limit: MAX_ITINERARIES,
        current: count
      });
    }
    const { title, province, dateStr, numDays, days, warnings } = req.body;
    if (!province) return res.status(400).json({ error: 'Falta provincia' });
    const item = await Itinerary.create({
      userId:   req.user.id,
      title:    title    || `Itinerario en ${province}`,
      province,
      dateStr,
      numDays:  numDays  || 2,
      days:     days     || [],
      warnings: warnings || []
    });
    res.status(201).json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/itineraries/:id — actualizar (sobreescribir) un itinerario existente
router.put('/:id', async (req, res) => {
  try {
    const { title, province, dateStr, numDays, days, warnings } = req.body;
    const item = await Itinerary.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { title, province, dateStr, numDays, days, warnings },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'No encontrado' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/itineraries/:id
router.delete('/:id', async (req, res) => {
  try {
    const item = await Itinerary.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!item) return res.status(404).json({ error: 'No encontrado' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
