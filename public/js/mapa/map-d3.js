// D3 REAL MAP — GeoJSON provinces
// ============================================================
const PROVINCE_COLORS = {
  'León':       '#e8a598',
  'Zamora':     '#a8d4e8',
  'Salamanca':  '#e8d8a8',
  'Valladolid': '#a8e8c8',
  'Palencia':   '#c8b8e8',
  'Burgos':     '#b8c8e8',
  'Ávila':      '#c8b89a',
  'Segovia':    '#e8c8a8',
  'Soria':      '#e8e8a8',
};

const CYL_PROVINCES = new Set(['León','Zamora','Salamanca','Valladolid','Palencia','Burgos','Ávila','Segovia','Soria']);

const PROVINCE_NAME_MAP = {
  'León': 'León', 'Zamora': 'Zamora', 'Salamanca': 'Salamanca',
  'Valladolid': 'Valladolid', 'Palencia': 'Palencia', 'Burgos': 'Burgos',
  'Ávila': 'Ávila', 'Segovia': 'Segovia', 'Soria': 'Soria',
  'Avila': 'Ávila'
};

const tooltip = document.getElementById('provinceTooltip');

async function initD3Map() {
  const container = document.getElementById('d3-map-container');
  const W = container.clientWidth || 340;
  const H = W * 0.78;

  const svg = d3.select('#d3-map-container')
    .append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  let geojson;
  try {
    geojson = await d3.json('/assets/data/cyl-provinces.geojson');
  } catch(e) {
    // Fallback: draw simplified shapes
    drawFallbackMap(svg, W, H);
    return;
  }

  // Filter only CyL provinces
  const cylFeatures = geojson.features.filter(f => {
    const n = f.properties.name || f.properties.Name || '';
    return CYL_PROVINCES.has(n) || CYL_PROVINCES.has(PROVINCE_NAME_MAP[n]);
  });

  const featureCollection = { type: 'FeatureCollection', features: cylFeatures };

  const projection = d3.geoMercator().fitExtent([[10, 10], [W-10, H-10]], featureCollection);
  const path = d3.geoPath().projection(projection);

  // Draw provinces
  svg.selectAll('.province-path')
    .data(cylFeatures)
    .enter()
    .append('path')
    .attr('class', 'province-path')
    .attr('d', path)
    .attr('fill', d => {
      const n = PROVINCE_NAME_MAP[d.properties.name] || d.properties.name;
      return PROVINCE_COLORS[n] || '#ccc';
    })
    .attr('data-province', d => PROVINCE_NAME_MAP[d.properties.name] || d.properties.name)
    .on('mouseenter', function(event, d) {
      const n = PROVINCE_NAME_MAP[d.properties.name] || d.properties.name;
      tooltip.textContent = n;
      tooltip.style.display = 'block';
      d3.select(this).raise();
    })
    .on('mousemove', function(event) {
      tooltip.style.left = (event.clientX + 14) + 'px';
      tooltip.style.top = (event.clientY - 36) + 'px';
    })
    .on('mouseleave', function() {
      tooltip.style.display = 'none';
    })
    .on('click', function(event, d) {
      const n = PROVINCE_NAME_MAP[d.properties.name] || d.properties.name;
      svg.selectAll('.province-path').classed('active', false);
      d3.select(this).classed('active', true);
      selectProvince(n);
    });

  // Province labels omitted — names shown on hover via tooltip
}

function drawFallbackMap(svg, W, H) {
  // Simple colored blocks as fallback
  const fallbackData = [
    { name:'León',       x:0.05, y:0.05, w:0.32, h:0.35 },
    { name:'Zamora',     x:0.05, y:0.40, w:0.22, h:0.30 },
    { name:'Salamanca',  x:0.05, y:0.70, w:0.28, h:0.28 },
    { name:'Valladolid', x:0.28, y:0.42, w:0.22, h:0.25 },
    { name:'Palencia',   x:0.30, y:0.10, w:0.16, h:0.32 },
    { name:'Burgos',     x:0.46, y:0.05, w:0.35, h:0.38 },
    { name:'Ávila',      x:0.28, y:0.67, w:0.22, h:0.28 },
    { name:'Segovia',    x:0.47, y:0.52, w:0.25, h:0.30 },
    { name:'Soria',      x:0.69, y:0.38, w:0.28, h:0.38 },
  ];
  fallbackData.forEach(p => {
    const rx = p.x*W, ry = p.y*H, rw = p.w*W, rh = p.h*H;
    svg.append('rect').attr('x',rx).attr('y',ry).attr('width',rw).attr('height',rh)
      .attr('fill', PROVINCE_COLORS[p.name]).attr('stroke','rgba(255,255,255,0.6)').attr('stroke-width',1.5)
      .attr('class','province-path').attr('data-province',p.name)
      .style('cursor','pointer')
      .on('mouseenter', function() { tooltip.textContent=p.name; tooltip.style.display='block'; })
      .on('mousemove', function(event) { tooltip.style.left=(event.clientX+14)+'px'; tooltip.style.top=(event.clientY-36)+'px'; })
      .on('mouseleave', function() { tooltip.style.display='none'; })
      .on('click', function() {
        svg.selectAll('.province-path').classed('active', false);
        d3.select(this).classed('active',true);
        selectProvince(p.name);
      });
  });
}

initD3Map();

// ============================================================
// PROVINCE BOUNDARIES ON LEAFLET MAP
// ============================================================
let provinceBoundariesLayer = null;

async function loadProvinceBoundaries() {
  try {
    const geojson = await fetch('/assets/data/cyl-provinces.geojson').then(r => r.json());
    const CYL = new Set(['León','Zamora','Salamanca','Valladolid','Palencia','Burgos','Ávila','Segovia','Soria','Avila']);
    const cylFeatures = geojson.features.filter(f => CYL.has(f.properties.name));

    provinceBoundariesLayer = L.geoJSON({ type:'FeatureCollection', features: cylFeatures }, {
      style: {
        color: '#6B5C4E',
        weight: 1.2,
        opacity: 0.55,
        fillColor: 'transparent',
        fillOpacity: 0,
        dashArray: null
      },
      onEachFeature: function(feature, layer) {
        layer.on('click', function() {
          const n = PROVINCE_NAME_MAP[feature.properties.name] || feature.properties.name;
          if (n && CYL_PROVINCES.has(n)) {
            selectProvince(n);
            d3.selectAll('.province-path').classed('active', false);
            d3.selectAll('.province-path').filter(function() {
              return d3.select(this).attr('data-province') === n;
            }).classed('active', true);
          }
        });
      }
    }).addTo(map);
  } catch(e) {
    console.warn('Could not load province boundaries:', e);
  }
}

function highlightProvinceBoundary(name) {
  if (!provinceBoundariesLayer) return;
  provinceBoundariesLayer.eachLayer(layer => {
    const n = PROVINCE_NAME_MAP[layer.feature.properties.name] || layer.feature.properties.name;
    if (n === name) {
      layer.setStyle({ color: '#B85C38', weight: 2.5, opacity: 1, fillColor: '#B85C38', fillOpacity: 0.06 });
      layer.bringToFront();
    } else {
      layer.setStyle({ color: '#6B5C4E', weight: 1.2, opacity: 0.55, fillOpacity: 0 });
    }
  });
}

// Province list buttons — show 3 initially + "Ver más"
// province list rendered via renderProvinceList()

function renderProvinceList() {
  ['province-list', 'province-list-explore'].forEach(id => {
    const list = document.getElementById(id);
    if (!list) return;
    list.innerHTML = provinces.map(p => {
      const active = p === appState.selectedProvince ? 'active' : '';
      return `<button class="province-pill ${active}" data-province="${p}" onclick="selectProvince('${p}')">${p}</button>`;
    }).join('');
  });
}

function renderProvinceListExplore() {
  const list = document.getElementById('province-list-explore');
  if (!list) return;
  list.innerHTML = provinces.map(p => {
    const active = p === appState.selectedProvince ? 'active' : '';
    return `<button class="province-pill ${active}" data-province="${p}" onclick="selectProvince('${p}')">${p}</button>`;
  }).join('');
}

renderProvinceList();

function selectProvince(name, skipPlanner = false) {
  appState.selectedProvince = name;

  const titleEl    = document.getElementById('provinceTitle');
  const subtitleEl = document.getElementById('provinceSubtitle');
  const tabsWrap   = document.getElementById('mapTabsWrap');
  const emptyState = document.getElementById('mapEmptyState');
  const plannerProv = document.getElementById('plannerProvince');

  if (titleEl)    titleEl.textContent    = name;
  if (subtitleEl) subtitleEl.textContent = 'Puntos de interés cargados exclusivamente para esta provincia';
  if (plannerProv) plannerProv.textContent = name;
  if (tabsWrap)   tabsWrap.style.display  = 'block';
  if (emptyState) emptyState.style.display = 'none';
  const plannerBtn = document.getElementById('plannerBtnWrap');
  if (plannerBtn) plannerBtn.style.display = 'block';

  const chip = document.getElementById('provinceChip');
  if (chip) chip.style.display = 'flex';
  const catSection = document.getElementById('catFilterSection');
  if (catSection) catSection.style.display = 'block';
  const strip = document.getElementById('msb-prov-strip');
  if (strip) strip.style.display = 'none';

  // Ocultar el mapa D3 de provincias para dar espacio al filtro de categorías
  const d3map = document.getElementById('d3-map-container');
  if (d3map) d3map.style.display = 'none';

  document.querySelectorAll('.province-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.province === name);
  });

  renderProvinceList();
  if (!skipPlanner) updateDayPlanner(name);
  highlightProvinceBoundary(name);
  loadProvinceMarkers(name);
}
// ============================================================
appState.searchProv = null;

function setSearchProv(prov) {
  appState.searchProv = prov;
  doSearch(document.getElementById('searchInput')?.value || '');
}

function toggleInlineSearch() {
  // Buscador siempre visible — enfoca directamente
  document.getElementById('searchInput')?.focus();
}

function doSearch(query) {
  const q = query.trim().toLowerCase();
  const resultsEl = document.getElementById('searchResults');
  const gridEl = document.getElementById('searchResultsGrid');
  const countEl = document.getElementById('searchResultCount');

  if (q.length < 2) {
    if (resultsEl) resultsEl.style.display = 'none';
    return;
  }

  const activeProv = appState.selectedProvince || appState.searchProv;
  let results = appState.markers.filter(m => {
    const matchesQuery = m.name.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q);
    const matchesProv = !activeProv || m.province === activeProv;
    return matchesQuery && matchesProv;
  });

  resultsEl.style.display = 'block';
  countEl.textContent = results.length > 0
    ? `${results.length} resultado${results.length !== 1 ? 's' : ''} encontrado${results.length !== 1 ? 's' : ''}`
    : 'No se encontraron resultados';

  gridEl.innerHTML = results.slice(0, 40).map(mk => {
    const searchUrl = mk.url || `https://www.google.com/search?q=${encodeURIComponent(mk.name + ' ' + mk.province)}`;
    return `
    <div onclick="goToMarker(${mk.lat},${mk.lng},'${mk.province}')"
      style="background:var(--sand);border:1px solid rgba(42,33,24,0.13);padding:14px 16px;cursor:pointer;transition:all 0.2s;"
      onmouseover="this.style.borderColor='var(--terra)';this.style.background='rgba(42,33,24,0.05)'"
      onmouseout="this.style.borderColor='rgba(42,33,24,0.13)';this.style.background='var(--sand)'">
      <div style="font-size:1.3rem;margin-bottom:6px;">${catIcon[mk.cat] || catIcon.default}</div>
      <div style="font-family:'Instrument Serif',serif;font-size:0.95rem;color:var(--ink);font-weight:700;margin-bottom:3px;">${mk.name}</div>
      <div style="font-size:0.78rem;color:var(--terra);margin-bottom:6px;">${mk.province} · ${catLabel[mk.cat]||mk.cat}</div>
      <div style="font-size:0.8rem;color:var(--ink-muted);line-height:1.4;">${mk.desc.slice(0,90)}${mk.desc.length>90?'…':''}</div>
      <a href="${searchUrl}" target="_blank" rel="noopener" class="marker-link" onclick="event.stopPropagation()" style="margin-top:10px;">
        ${mk.url ? '🔗 Sitio web' : '🔍 Buscar'}
      </a>
    </div>`;
  }).join('');

  if (results.length > 40) {
    gridEl.innerHTML += `<div style="grid-column:1/-1;text-align:center;color:var(--ink-muted);font-style:italic;font-size:0.88rem;padding:12px;">
      Mostrando 40 de ${results.length}. Refina la búsqueda para ver más resultados.
    </div>`;
  }
}

function goToMarker(lat, lng, province) {
  selectProvince(province);
  d3.selectAll('.province-path').classed('active', false);
  d3.selectAll('.province-path').filter(function() {
    return d3.select(this).attr('data-province') === province;
  }).classed('active', true);
  setTimeout(() => {
    navigateTo('/mapa');
    setTimeout(() => map.setView([lat, lng], 16, { animate: true }), 250);
  }, 400);
}

// ============================================================
// DAY PLANNER
// ============================================================
// ============================================================
// MAPA — CAMBIO DE PESTAÑA
// ============================================================

