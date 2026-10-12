const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const User     = require('../../models/User');
const { requireAuth, requireAdmin, signToken } = require('../../middleware/auth');
const rateLimit       = require('../../middleware/rateLimit');
const { serverError } = require('../../middleware/errors');

const SALT_ROUNDS = 12;

// Frena la fuerza bruta: 10 intentos de login/registro por IP cada 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Demasiados intentos. Espera unos minutos y vuelve a probar.'
});

const isStr = (v, min, max) => typeof v === 'string' && v.length >= min && v.length <= max;

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // bcrypt solo usa los primeros 72 bytes de la contraseña
    if (!isStr(name, 1, 60) || !isStr(email, 3, 254) || !isStr(password, 6, 72)) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios (mín. 6 caracteres)' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email no válido' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'El email ya está registrado' });

    const hash    = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = await new User({ name: name.trim(), email, password: hash }).save();
    const token   = signToken(newUser);
    res.status(201).json({
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (e) {
    serverError(res, e);
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!isStr(email, 1, 254) || !isStr(password, 1, 200)) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Email o contraseña incorrectos' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Email o contraseña incorrectos' });

    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (e) {
    serverError(res, e);
  }
});

// GET /api/auth/me — verifica token y devuelve usuario
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id, { password: 0 });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (e) {
    serverError(res, e);
  }
});

// GET /api/auth/users — solo admin
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    res.json(users);
  } catch (e) {
    serverError(res, e);
  }
});

module.exports = router;
