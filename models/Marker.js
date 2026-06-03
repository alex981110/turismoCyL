const mongoose = require('mongoose');

const MarkerSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  province: String,
  cat: String,
  desc: String,
  photo: String
});

module.exports = mongoose.model('Marker', MarkerSchema);