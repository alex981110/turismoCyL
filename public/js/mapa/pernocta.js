// ============================================================
// pernocta.js — Capa «Dormir en autocaravana»
//
// Áreas, campings, parkings y puntos de vaciado de la provincia elegida,
// con los datos del proyecto Caravana (OpenStreetMap + registros oficiales)
// que sirve /api/pernocta. Va en su propia agrupación, encima de los lugares.
// ============================================================

const RV_KINDS = {
  area:    { label: 'Área de autocaravanas', short: 'Áreas',    icon: _catSvg('<path d="M2 16V8a2 2 0 0 1 2-2h11l5 4.5V16z"/><path d="M15 6v4.5h5"/><circle cx="7" cy="17" r="2"/><circle cx="16" cy="17" r="2"/>') },
  camping: { label: 'Camping',               short: 'Campings', icon: _catSvg('<path d="M3 20 12 4l9 16z"/><path d="M12 20l-3-6h6z"/>') },
  parking: { label: 'Parking autorizado',    short: 'Parkings', icon: _catSvg('<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M9.5 17V7h3.5a3 3 0 0 1 0 6H9.5"/>') },
  vaciado: { label: 'Punto de vaciado',      short: 'Vaciado',  icon: _catSvg('<path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z"/><path d="M12 11v5M9.5 13.5 12 16l2.5-2.5"/>') },
};
// [campo del dato, etiqueta]
const RV_SERVICES = [['w', 'Agua'], ['e', 'Electricidad'], ['d', 'Vaciado'], ['toi', 'Aseos'], ['sh', 'Duchas'], ['wifi', 'Wifi']];
const RV_STORAGE_KEY = 'cyl.pernocta';

const rvState = {
  on: false,
  kinds: new Set(Object.keys(RV_KINDS)),
  data: null,        // { generado, registros, sitios }
  request: null,     // fetch en curso
  failed: false,
  layer: null,
  province: null,
};

try { rvState.on = localStorage.getItem(RV_STORAGE_KEY) === '1'; } catch { /* sin almacenamiento */ }

function loadRvData() {
  if (rvState.data) return Promise.resolve(rvState.data);
  if (!rvState.request) {
    rvState.request = fetch('/api/pernocta')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { rvState.data = d; rvState.failed = false; return d; })
      .catch(e => { console.error('Pernocta:', e); rvState.failed = true; return null; })
      .finally(() => { rvState.request = null; });
  }
  return rvState.request;
}

// ── Formato de los datos de OpenStreetMap ───────────────────
const RV_MONTHS = { Jan: 'ene', Feb: 'feb', Mar: 'mar', Apr: 'abr', May: 'may', Jun: 'jun', Jul: 'jul', Aug: 'ago', Sep: 'sep', Oct: 'oct', Nov: 'nov', Dec: 'dic' };
const RV_DAYS = { Mo: 'L', Tu: 'M', We: 'X', Th: 'J', Fr: 'V', Sa: 'S', Su: 'D', PH: 'festivos' };

function rvHours(oh) {
  if (!oh) return null;
  if (oh.trim() === '24/7') return '24 horas, todos los días';
  return oh.replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g, m => RV_MONTHS[m])
    .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g, d => RV_DAYS[d])
    .replace(/\boff\b/g, 'cerrado')
    .replace(/;\s*/g, ' · ');
}

function rvStay(ms) {
  if (!ms) return null;
  if (/^(no|none|unlimited)$/i.test(ms.trim())) return 'Sin límite';
  return ms.replace(/\bdays?\b/i, 'días').replace(/\bhours?\b/i, 'horas').replace(/\bnights?\b/i, 'noches');
}

function rvPrice(s) {
  if (s.fee === false) return 'Gratis';
  if (s.fee === true) return 'De pago' + (s.ch ? ' · ' + s.ch : '');
  return null;
}

// Qué se sabe de si un camping admite autocaravanas
function rvCampingFit(s) {
  if (s.k !== 'camping') return null;
  if (s.ok === 2) return 'Admite autocaravanas';
  if (s.ok === 1) return 'Admite caravanas; confirma que también autocaravanas';
  return 'Sin confirmar si admite autocaravanas: llama antes de ir';
}

const rvName = s => s.n || `${RV_KINDS[s.k].label}${s.c ? ' en ' + s.c : ''}`;

// Los sitios añadidos desde un registro oficial (id «x…») no están en OpenStreetMap
function rvOsmUrl(id) {
  const m = /^([nwr])(\d+)$/.exec(id);
  return m ? `https://www.openstreetmap.org/${{ n: 'node', w: 'way', r: 'relation' }[m[1]]}/${m[2]}` : null;
}

function rvSafeUrl(url) {
  return /^https?:\/\//i.test(url || '') ? url : null;
}

// ── Mapa ────────────────────────────────────────────────────
function createRvIcon(kind) {
  return L.divIcon({
    html: `<div class="cyl-pin" data-fam="cama">${RV_KINDS[kind].icon}</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
}

function buildRvPopup(s) {
  const kind = RV_KINDS[s.k];
  const fit = rvCampingFit(s);
  const services = RV_SERVICES.filter(([f]) => s[f] === true).map(([, label]) => label);
  const facts = [
    ['Precio', rvPrice(s)],
    ['Horario', rvHours(s.oh)],
    ['Estancia máx.', rvStay(s.ms)],
    ['Plazas', s.cap],
  ].filter(([, v]) => v);
  const registry = s.rg
    ? `Registro oficial${rvState.data.registros[s.rg] ? ' · ' + rvState.data.registros[s.rg] : ''}${s.cat ? ' · ' + s.cat : ''}`
    : null;
  const osm = rvOsmUrl(s.id);
  const web = rvSafeUrl(s.web);
  const links = [
    `<a href="https://www.google.com/maps/dir/?api=1&destination=${s.la},${s.lo}" target="_blank" rel="noopener">Cómo llegar</a>`,
    web && `<a href="${escHTML(web)}" target="_blank" rel="noopener">Web</a>`,
    s.tel && `<a href="tel:${escHTML(s.tel.replace(/[^\d+]/g, ''))}">Llamar</a>`,
    osm && `<a href="${osm}" target="_blank" rel="noopener">Corregir en OSM</a>`,
  ].filter(Boolean);

  const el = document.createElement('div');
  el.className = 'lf-popup lf-popup-rv';
  el.innerHTML = `
    <div class="lf-popup-hero" data-fam="cama">${kind.icon}<span class="lf-popup-code">${provinceCode[s.p] || ''} · ${escHTML(s.p)}</span></div>
    <div class="lf-popup-body">
      <strong class="lf-popup-name"><span>${escHTML(rvName(s))}</span></strong>
      ${s.n ? `<div class="lf-popup-meta">
        <span class="lf-popup-pill" data-fam="cama">${escHTML(kind.label)}</span>
        ${s.c ? `<span class="lf-popup-prov">${escHTML(s.c)}</span>` : ''}
      </div>` : ''}
      ${fit ? `<p class="rv-note${s.ok === 2 ? ' is-ok' : ''}">${escHTML(fit)}</p>` : ''}
      <p class="rv-services">${services.length ? services.map(escHTML).join(' · ') : 'Sin datos de servicios'}</p>
      ${facts.length ? `<dl class="rv-facts">${facts.map(([k, v]) => `<dt>${k}</dt><dd>${escHTML(v)}</dd>`).join('')}</dl>` : ''}
      ${registry ? `<p class="rv-registry">${escHTML(registry)}</p>` : ''}
      <p class="rv-links">${links.join('')}</p>
    </div>`;
  return el;
}

function clearRvLayer() {
  if (rvState.layer && map) map.removeLayer(rvState.layer);
  rvState.layer = null;
}

function drawRvLayer() {
  clearRvLayer();
  if (!rvState.on || !rvState.data || !rvState.province || !map) return;
  const layer = createClusterGroup({ maxClusterRadius: 45, showCoverageOnHover: false });
  rvState.data.sitios
    .filter(s => s.p === rvState.province && rvState.kinds.has(s.k))
    .forEach(s => {
      layer.addLayer(
        L.marker([s.la, s.lo], { icon: createRvIcon(s.k), zIndexOffset: 500 })
          .bindTooltip(`<span class="tt-name">${escHTML(rvName(s))}</span><br><span class="tt-cat">${escHTML(RV_KINDS[s.k].label)}</span>`, {
            direction: 'top', offset: [0, -8], className: 'leaflet-tooltip-cyl', opacity: 1
          })
          .bindPopup(() => buildRvPopup(s), POPUP_OPTIONS)
      );
    });
  map.addLayer(layer);
  rvState.layer = layer;
}

// ── Panel lateral ───────────────────────────────────────────
function renderRvSection() {
  const section = document.getElementById('rvSection');
  if (!section) return;
  section.hidden = !rvState.province;
  if (!rvState.province) return;

  const body = document.getElementById('rvBody');
  const toggle = document.getElementById('rvToggle');
  toggle.classList.toggle('is-active', rvState.on);
  toggle.setAttribute('aria-pressed', rvState.on ? 'true' : 'false');

  if (!rvState.on) { body.innerHTML = ''; return; }
  if (rvState.failed) { body.innerHTML = '<p class="rv-source">No se han podido cargar los sitios de pernocta. Prueba de nuevo más tarde.</p>'; return; }
  if (!rvState.data) { body.innerHTML = '<p class="rv-source">Cargando sitios…</p>'; return; }

  const inProv = rvState.data.sitios.filter(s => s.p === rvState.province);
  const counts = {};
  inProv.forEach(s => { counts[s.k] = (counts[s.k] || 0) + 1; });
  const date = rvState.data.generado
    ? new Date(rvState.data.generado + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  body.innerHTML = `
    <div class="msb-cat-filters">
      ${Object.entries(RV_KINDS).filter(([k]) => counts[k]).map(([k, kind]) => `
        <button type="button" data-action="rv-kind" data-kind="${k}" data-fam="cama" aria-pressed="${rvState.kinds.has(k)}" class="cat-chip${rvState.kinds.has(k) ? ' is-active' : ''}">
          ${kind.icon} ${kind.short} <span class="cat-chip-n">${counts[k]}</span>
        </button>`).join('')}
    </div>
    <p class="rv-source">
      ${inProv.length ? '' : 'No hay sitios de pernocta registrados en esta provincia. '}
      Datos de <a href="https://alex981110.github.io/caravana/" target="_blank" rel="noopener">Caravana</a>:
      © colaboradores de <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> (ODbL)
      y registros oficiales de campings${date ? `, actualizados el ${date}` : ''}. Confirma horarios y precios antes de ir.
    </p>`;
}

// Llamada por loadProvinceMarkers (provincia elegida) y loadAllMarkersOnMap (null)
function refreshPernocta(province) {
  rvState.province = province || null;
  renderRvSection();
  if (!rvState.on || !rvState.province) { clearRvLayer(); return; }
  if (rvState.data) { drawRvLayer(); return; }
  loadRvData().then(() => { renderRvSection(); drawRvLayer(); });
}

function toggleRvLayer() {
  rvState.on = !rvState.on;
  rvState.failed = false;
  try { localStorage.setItem(RV_STORAGE_KEY, rvState.on ? '1' : '0'); } catch { /* sin almacenamiento */ }
  refreshPernocta(rvState.province);
}

registerActions({
  'rv-toggle': () => toggleRvLayer(),
  'rv-kind': d => {
    if (rvState.kinds.has(d.kind)) rvState.kinds.delete(d.kind);
    else rvState.kinds.add(d.kind);
    renderRvSection();
    drawRvLayer();
  },
});
