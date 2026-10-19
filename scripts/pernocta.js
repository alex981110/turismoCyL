// Guarda la copia de respaldo de los datos de pernocta (public/assets/data/pernocta.json)
const fs = require('fs');
const { buildPernocta, SNAPSHOT_PATH } = require('../pages/mapa/pernocta');

buildPernocta()
  .then(data => {
    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(data));
    const byProv = {};
    data.sitios.forEach(s => { byProv[s.p] = (byProv[s.p] || 0) + 1; });
    console.log(`✅ ${data.sitios.length} sitios de pernocta (datos del ${data.generado})`, byProv);
  })
  .catch(e => { console.error('❌', e.message); process.exit(1); });
