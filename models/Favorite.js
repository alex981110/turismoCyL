const mongoose = require('mongoose');

const FavoriteSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  markerId: { type: String, required: true },
  name:     { type: String },
  province: { type: String },
  cat:      { type: String },
  photo:    { type: String },
  createdAt:{ type: Date, default: Date.now }
});

FavoriteSchema.index({ userId: 1, markerId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', FavoriteSchema);
