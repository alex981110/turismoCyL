const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'cyl_dev_secret_change_in_production';

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
    req.user = jwt.verify(token, SECRET);
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
    { expiresIn: '7d' }
  );
}

module.exports = { requireAuth, requireAdmin, signToken };
