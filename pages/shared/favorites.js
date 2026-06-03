const express   = require('express');
const router    = express.Router();
const Favorite  = require('../../models/Favorite');
const { requireAuth } = require('../../middleware/auth');

// Todas las rutas de favoritos requieren auth
router.use(requireAuth);

// GET /api/favorites — favoritos del usuario autenticado
router.get('/', async (req, res) => {
  try {
    const favs = await Favorite.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(favs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/favorites
router.post('/', async (req, res) => {
  const { markerId, name, province, cat, photo } = req.body;
  if (!markerId) return res.status(400).json({ error: 'Falta markerId' });
  try {
    const fav = await Favorite.findOneAndUpdate(
      { userId: req.user.id, markerId },
      { userId: req.user.id, markerId, name, province, cat, photo },
      { upsert: true, new: true }
    );
    res.status(201).json(fav);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/favorites
router.delete('/', async (req, res) => {
  const { markerId } = req.body;
  if (!markerId) return res.status(400).json({ error: 'Falta markerId' });
  try {
    await Favorite.deleteOne({ userId: req.user.id, markerId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
