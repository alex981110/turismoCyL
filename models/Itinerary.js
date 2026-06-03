const mongoose = require('mongoose');

const ItinerarySchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  // Nombre que el usuario da al itinerario (ej: "Escapada a León")
  title:     { type: String, default: 'Mi itinerario' },
  province:  { type: String, required: true },
  dateStr:   { type: String },                  // ISO date string (YYYY-MM-DD)
  numDays:   { type: Number, default: 2 },
  // Datos serializados del itinerario generado
  days:      { type: Array, default: [] },      // [{ date, dayName, jsDay, places: [{name, time, ...}] }]
  warnings:  { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Itinerary', ItinerarySchema);
