const mongoose = require('mongoose');

const ItinerarySchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  // Nombre que el usuario da al itinerario (ej: "Escapada a León")
  title:     { type: String, default: 'Mi itinerario' },
  province:  { type: String, required: true },  // primera provincia (la del código de la tarjeta)
  provincesList: { type: [String], default: undefined }, // todas, en orden de viaje
  ranking:   { type: [String], default: undefined },     // gustos con los que se montó el plan
  rv:        { type: Boolean, default: false },          // viaje en autocaravana (con noches)
  dateStr:   { type: String },                  // fecha de salida (YYYY-MM-DD), opcional
  numDays:   { type: Number, default: 2 },
  // Datos serializados del itinerario generado
  days:      { type: Array, default: [] },      // [{ dayName, province, places: [{name, time, kind, lat, lng, cat, ...}] }]
  warnings:  { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Itinerary', ItinerarySchema);
