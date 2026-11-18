// Guarda la copia de respaldo de los horarios de OpenStreetMap (public/assets/data/horarios.json)
const fs = require('fs');
const { buildHorarios, SNAPSHOT_PATH } = require('../pages/mapa/horarios');

let previous = null;
try { previous = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8')); } catch { /* primera vez */ }

buildHorarios(previous)
  .then(data => {
    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(data));
    const counts = Object.fromEntries(Object.entries(data.provincias).map(([p, l]) => [p, l.length]));
    const total = Object.values(counts).reduce((a, n) => a + n, 0);
    console.log(`✅ ${total} lugares con horario (OpenStreetMap, ${data.generado})`, counts);
    if (data.sinActualizar) console.log('⚠️ Sin actualizar (Overpass no respondió):', data.sinActualizar.join(', '));
  })
  .catch(e => { console.error('❌', e.message); process.exit(1); });
