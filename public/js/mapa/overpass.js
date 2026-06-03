// ============================================================
// overpass.js — Capa de Bares y Restaurantes
//
// Reemplaza la llamada a Overpass API por la API local
// (/api/markers?cat=bar&province=X) que sirve datos pre-importados
// desde los datasets de JCyL.
//
// Expone las mismas funciones globales que el código de app.js espera:
//   - overpassState
//   - clearOverpassLayer()
//   - loadOverpassBars(province)  (llamada desde el UI)
// ============================================================

// Estado global esperado por app.js
const overpassState = {
  province: null,
  layer: null,
  loading: false,
  markers: [],
};

/**
 * Elimina todos los marcadores de la capa Overpass del mapa.
 */
function clearOverpassLayer() {
  if (overpassState.layer && typeof map !== 'undefined' && map) {
    map.removeLayer(overpassState.layer);
  }
  overpassState.layer = null;
  overpassState.markers = [];
  overpassState.province = null;

  // Ocultar contador si existe
  const counter = document.getElementById('overpassCount');
  if (counter) counter.textContent = '';
}

/**
 * Carga bares y restaurantes de una provincia desde la API local.
 * Los datos vienen de MongoDB (importados con import-jcyl.js).
 */
async function loadOverpassBars(province) {
  if (!province || overpassState.loading) return;
  if (overpassState.province === province && overpassState.layer) return; // ya cargados

  clearOverpassLayer();
  overpassState.loading = true;
  overpassState.province = province;

  const statusEl = document.getElementById('overpassStatus');
  if (statusEl) statusEl.textContent = 'Cargando bares y restaurantes…';

  try {
    const res = await fetch(`/api/markers?cat=bar&province=${encodeURIComponent(province)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const bars = await res.json();

    if (!bars.length) {
      if (statusEl) statusEl.textContent = 'No se encontraron bares en esta provincia.';
      overpassState.loading = false;
      return;
    }

    // Crear cluster group con estilo propio para bares
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      iconCreateFunction: cluster => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div style="background:rgba(220,80,60,0.9);color:#fff;width:32px;height:32px;
                  border-radius:50%;display:flex;align-items:center;justify-content:center;
                  font-family:'Playfair Display',serif;font-weight:700;font-size:0.8rem;
                  border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);">${count}</div>`,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
      },
    });

    const barIcon = L.divIcon({
      html: '<div style="font-size:1.4rem;text-align:center;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5));">🍺</div>',
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    bars.forEach(bar => {
      if (!bar.lat || !bar.lng) return;

      const searchUrl = bar.url || `https://www.google.com/search?q=${encodeURIComponent(bar.name + ' ' + bar.province)}`;

      const marker = L.marker([bar.lat, bar.lng], { icon: barIcon })
        .bindTooltip(
          `<span style="font-weight:700;color:#dc5040;">${bar.name}</span>`,
          { direction: 'top', offset: [0, -6], className: 'leaflet-tooltip-cyl' }
        )
        .bindPopup(`
          <div style="font-family:'Playfair Display',serif;min-width:200px;">
            <strong style="color:#dc5040;font-size:0.95rem;">${bar.name}</strong>
            <div style="color:#888;font-size:0.75rem;margin:4px 0;">${bar.desc || ''}</div>
            <a href="${searchUrl}" target="_blank" rel="noopener"
               style="display:inline-block;margin-top:6px;padding:4px 10px;background:#1a1209;
                      color:#c9a84c;border:1px solid #c9a84c;text-decoration:none;font-size:0.74rem;">
              🔗 ${bar.url ? 'Sitio web' : 'Buscar'}
            </a>
          </div>
        `);

      clusterGroup.addLayer(marker);
      overpassState.markers.push(marker);
    });

    if (typeof map !== 'undefined' && map) {
      map.addLayer(clusterGroup);
    }
    overpassState.layer = clusterGroup;

    if (statusEl) statusEl.textContent = `${bars.length} bares y restaurantes cargados.`;

    const counter = document.getElementById('overpassCount');
    if (counter) counter.textContent = `(${bars.length})`;

  } catch (err) {
    console.error('Error cargando bares:', err);
    if (statusEl) statusEl.textContent = 'Error al cargar bares. Inténtalo de nuevo.';
  } finally {
    overpassState.loading = false;
  }
}
