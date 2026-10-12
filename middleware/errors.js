/**
 * serverError — registra el error en el servidor y responde con un mensaje
 * genérico, sin filtrar detalles internos (consultas, rutas, stack) al cliente.
 */
function serverError(res, e) {
  console.error(e);
  res.status(500).json({ error: 'Error interno del servidor' });
}

module.exports = { serverError };
