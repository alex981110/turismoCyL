// ============================================================
// geo.js — En qué provincia de Castilla y León cae un punto
// (polígonos de public/assets/data/cyl-provinces.geojson)
// ============================================================
const path = require('path');
const fs   = require('fs');

const GEOJSON_PATH = path.join(__dirname, '../../public/assets/data/cyl-provinces.geojson');

const provinces = JSON.parse(fs.readFileSync(GEOJSON_PATH, 'utf8')).features.map(f => ({
  name: f.properties.name,
  polygons: f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates,
}));

// Punto en anillo por trazado de rayos (coordenadas [lng, lat])
function inRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// El primer anillo de cada polígono es el contorno; los siguientes, huecos
function provinceOf(lng, lat) {
  const hit = provinces.find(p => p.polygons.some(([outer, ...holes]) =>
    inRing(lng, lat, outer) && !holes.some(h => inRing(lng, lat, h))));
  return hit ? hit.name : null;
}

// Rectángulo que contiene las nueve provincias (sur, oeste, norte, este), para Overpass
const CYL_BBOX = '40.08,-7.08,43.24,-1.77';

module.exports = { provinceOf, CYL_BBOX };
