/**
 * rateLimit — límite de peticiones por IP en memoria (ventana fija).
 * Suficiente para un solo proceso; con varias instancias haría falta Redis.
 */

// En Render (define RENDER=true) el tráfico entra por Cloudflare, que
// sobrescribe CF-Connecting-IP con la IP real del cliente. X-Forwarded-For no
// sirve ahí: el proxy de Render añade a la cadena sin limpiarla, así que el
// cliente podría falsearla. Fuera de Render se usa req.ip (ver TRUST_PROXY).
let loggedSource = false;
function clientIp(req) {
  const cf = process.env.RENDER ? req.get('cf-connecting-ip') : null;
  if (!loggedSource) {
    loggedSource = true;
    console.log(`ℹ️  Límite de peticiones: IP de ${cf ? 'CF-Connecting-IP' : 'req.ip'} (${cf || req.ip})`);
  }
  return cf || req.ip;
}

function rateLimit({ windowMs, max, message }) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits) if (entry.reset <= now) hits.delete(ip);
  }, windowMs).unref();

  return (req, res, next) => {
    const now = Date.now();
    const ip = clientIp(req);
    let entry = hits.get(ip);
    if (!entry || entry.reset <= now) {
      entry = { count: 0, reset: now + windowMs };
      hits.set(ip, entry);
    }
    if (++entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
      return res.status(429).json({ error: message || 'Demasiadas peticiones, inténtalo más tarde' });
    }
    next();
  };
}

module.exports = rateLimit;
