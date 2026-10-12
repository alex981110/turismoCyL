const crypto = require('crypto');
const jwt    = require('jsonwebtoken');

// El secreto debe venir de JWT_SECRET. Sin él, en producción no se arranca;
// en desarrollo se usa uno aleatorio por proceso (nunca uno fijo en el código,
// porque cualquiera que lea el repo podría firmar tokens de admin).
let SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 32) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET no definido o demasiado corto (mínimo 32 caracteres)');
  }
  SECRET = crypto.randomBytes(48).toString('hex');
  console.warn('⚠️  JWT_SECRET no definido o corto: usando uno aleatorio (las sesiones se pierden al reiniciar)');
}

/**
 * requireAuth — verifica que la petición lleve un JWT válido.
 * Añade req.user = { id, name, email, role } si es válido.
 */
function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado — token requerido' });
  }

  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, SECRET, { algorithms: ['HS256'] });
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

/**
 * requireAdmin — igual que requireAuth pero además exige role === 'admin'.
 */
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso restringido a administradores' });
    }
    next();
  });
}

/**
 * signToken — genera un token JWT para un usuario.
 */
function signToken(user) {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email, role: user.role },
    SECRET,
    { algorithm: 'HS256', expiresIn: '7d' }
  );
}

module.exports = { requireAuth, requireAdmin, signToken };
