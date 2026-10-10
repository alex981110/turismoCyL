const OB_PREFS = [
  { id: 'monumentos', label: 'Monumentos e historia',   icon: catIcon.monumento, cats: ['monumento', 'historia'] },
  { id: 'museos',     label: 'Museos y arte',            icon: catIcon.museo, cats: ['museo', 'exposicion'] },
  { id: 'naturaleza', label: 'Naturaleza y senderismo',  icon: catIcon.naturaleza, cats: ['naturaleza'] },
  { id: 'gastro',     label: 'Gastronomía',              icon: catIcon.gastronomia, cats: ['gastronomia', 'bar'] },
  { id: 'religioso',  label: 'Religioso / Patrimonio',   icon: _catSvg('<path d="M10 9h4M12 7v5M14 21v-3a2 2 0 0 0-4 0v3"/><path d="m18 9 3.5 2a1 1 0 0 1 .5.9V20a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-8.1a1 1 0 0 1 .5-.9L6 9"/><path d="M18 22V5l-6-3-6 3v17"/>'), cats: ['cultura', 'monumento'] },
  { id: 'teatro',     label: 'Teatro y cultura viva',    icon: catIcon.teatro, cats: ['teatro', 'cultura'] },
  { id: 'pueblos',    label: 'Pueblos con encanto',      icon: _catSvg('<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .7-1.5l7-6a2 2 0 0 1 2.6 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'), cats: ['naturaleza', 'historia', 'monumento'] },
];

const OB_KEYWORDS = {
  monumentos: ['muralla','castillo','catedral','acueducto','alcázar','palacio','torre','arco','basílica','monumento','románico','gótico','medieval'],
  museos:     ['museo','exposición','colección','arte','pintura','escultura','galería','yacimiento','fósil','evolución'],
  naturaleza: ['sierra','lago','laguna','parque natural','hoces','senderismo','ruta','montaña','bosque','glaciar'],
  gastro:     ['gastronomía','lechazo','cochinillo','vino','cata','bodega','tapas','jamón','queso','trucha','ribera'],
  religioso:  ['catedral','basílica','ermita','monasterio','colegiata','iglesia','convento','panteón','claustro','santuario'],
  teatro:     ['teatro','música','cultura','festival','danza','espectáculo','actuación'],
  pueblos:    ['pueblo','villa','conjunto histórico','casco','medieval','porticada','barrio'],
};

// ── Paleta del onboarding ──────────────────────────────────────────────────
// Superficie clara · tinta para el texto y la selección · amarillo señal para lo elegido
const OB_C = {
  bg:           'var(--surface)',
  bgCard:       'var(--surface)',
  bgCardSel:    'var(--signal)',          // tarjeta elegida
  border:       'rgba(14,17,20,0.26)',
  borderSel:    'var(--ink)',
  accent:       'var(--ink)',
  accentLight:  'var(--steel)',
  accentBg:     'var(--panel)',
  accentBg2:    'rgba(14,17,20,0.12)',
  text:         'var(--ink)',
  textMuted:    'var(--steel)',
  textSoft:     'var(--ink-soft)',
  badge:        'var(--ink)',             // número de orden
  badgeText:    'var(--signal)',
  progressBg:   'rgba(14,17,20,0.12)',
  rankBg:       'var(--panel)',
  rankBorder:   'rgba(14,17,20,0.26)',
  rankText:     'var(--ink)',
  btnPrimary:   'var(--ink)',
  btnPrimaryHov:'var(--slate-2)',
  btnSecBg:     'transparent',
  btnSecBorder: 'rgba(14,17,20,0.26)',
  btnSecText:   'var(--ink)',
  lockBg:       'var(--panel)',
  lockBorder:   'rgba(14,17,20,0.14)',
  shadow:       'var(--shadow-md)',
};

const OB_STORAGE_KEY = 'cyl_prefs';
let obStep = 1;
let obRanking = [];

function obSavePrefs() {
  obUpdateNavBadge(obRanking.length);
}

function obUpdateNavBadge(count) {
  const badge = document.getElementById('prefsNavBadge');
  const link  = document.getElementById('prefsNavLink');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count; badge.style.display = 'inline-flex';
    if (link) { link.style.color = OB_C.accent; link.style.fontWeight = '700'; link.title = `Tienes ${count} gustos guardados`; }
  } else {
    badge.style.display = 'none';
    if (link) { link.style.color = ''; link.style.fontWeight = ''; link.title = ''; }
  }
}

function obLoadPrefs() {
  return [];
}

function openOnboarding() {
  obStep = 1;
  const saved = obLoadPrefs();
  obRanking = saved;

  // ── Aplicar estilos al modal en modo claro ─────────────────────────────
  const modal = document.getElementById('onboardingModal');
  if (modal) {
    const inner = modal.querySelector('.modal-cyl');
    if (inner) {
      inner.style.background = OB_C.bg;
      inner.style.color = OB_C.text;
      inner.style.boxShadow = OB_C.shadow;

      // Barra de progreso base
      const progBar = inner.querySelector('#obProgressBar, [style*="height:3px"]');
      if (progBar) progBar.style.background = OB_C.progressBg;

      // Cabecera del modal
      const hdr = document.getElementById('obStepLabel');
      if (hdr) {
        hdr.style.color = OB_C.accent;
        hdr.style.fontWeight = '600';
        hdr.style.fontSize = '0.8rem';
        hdr.style.letterSpacing = '0.08em';
        hdr.style.textTransform = 'uppercase';
      }

      // Botón cerrar
      const closeBtn = inner.querySelector('.modal-close, [onclick*="closeOnboarding"]');
      if (closeBtn && closeBtn.classList.contains('modal-close')) {
        closeBtn.style.color = OB_C.textMuted;
        closeBtn.style.background = 'transparent';
      }

      // Botones de acción
      const btnBack = document.getElementById('obBtnBack');
      const btnNext = document.getElementById('obBtnNext');
      if (btnBack) {
        btnBack.style.background = OB_C.btnSecBg;
        btnBack.style.border = `1.5px solid ${OB_C.btnSecBorder}`;
        btnBack.style.color = OB_C.textSoft;
        btnBack.style.borderRadius = '10px';
        btnBack.style.padding = '10px 22px';
        btnBack.style.fontWeight = '600';
        btnBack.style.fontSize = '0.85rem';
        btnBack.style.cursor = 'pointer';
        btnBack.style.transition = 'all 0.2s';
      }
      if (btnNext) {
        btnNext.style.background = OB_C.btnPrimary;
        btnNext.style.border = 'none';
        btnNext.style.color = '#fff';
        btnNext.style.borderRadius = '10px';
        btnNext.style.padding = '10px 26px';
        btnNext.style.fontWeight = '700';
        btnNext.style.fontSize = '0.87rem';
        btnNext.style.cursor = 'pointer';
        btnNext.style.transition = 'all 0.2s';
        btnNext.style.boxShadow = '0 4px 16px rgba(14,17,20,0.35)';
        btnNext.onmouseover = () => { btnNext.style.background = OB_C.btnPrimaryHov; btnNext.style.boxShadow = '0 6px 20px rgba(14,17,20,0.45)'; };
        btnNext.onmouseout  = () => { btnNext.style.background = OB_C.btnPrimary;    btnNext.style.boxShadow = '0 4px 16px rgba(14,17,20,0.35)'; };
      }
    }
    const progress = document.getElementById('obProgress');
    if (progress) {
      progress.style.background = `linear-gradient(90deg, ${OB_C.accent}, ${OB_C.accentLight})`;
    }
  }

  modal.style.display = 'flex';
  if (saved.length > 0) renderObResumeStep();
  else renderObStep();
}

registerActions({
  'ob-change-prefs': () => { obRanking = []; renderObStep(); document.getElementById('obBtnNext').onclick = obNext; },
  'ob-reset':        () => obResetRanking(),
  'ob-pref':         d => obTogglePref(d.pref),
  'ob-days':         d => obSelectDays(+d.days),
  'ob-province':     d => obToggleProvince(d.province),
  'ob-register':     () => { closeOnboarding(); openModal('register'); },
  'ob-open':         () => openOnboarding(),
});

function closeOnboarding() { document.getElementById('onboardingModal').style.display = 'none'; }

function _obTag(icon, label) {
  return `<span style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;background:${OB_C.accentBg};border:1px solid ${OB_C.rankBorder};border-radius:var(--radius);font-size:0.8rem;color:${OB_C.accent};font-weight:600;">${icon} ${label}</span>`;
}

function renderObResumeStep() {
  const header  = document.getElementById('obStepLabel');
  const progress= document.getElementById('obProgress');
  const body    = document.getElementById('obBody');
  const btnBack = document.getElementById('obBtnBack');
  const btnNext = document.getElementById('obBtnNext');
  header.textContent = 'Tus gustos guardados';
  progress.style.width = '30%';
  btnBack.style.display = 'none';
  btnNext.textContent = 'Mantener y elegir provincia →';
  btnNext.onclick = () => { obStep = 2; renderObStep(); btnNext.onclick = obNext; };

  const topLabels = obRanking.map(id => {
    const p = OB_PREFS.find(x => x.id === id);
    return p ? _obTag(p.icon, p.label) : '';
  }).join('');

  body.innerHTML = `
    <h3 style="font-family:var(--font-display);color:${OB_C.text};font-size:1.15rem;margin:0 0 6px;font-weight:700;">¿Mantenemos tus gustos?</h3>
    <p style="color:${OB_C.textMuted};font-size:0.85rem;margin:0 0 18px;line-height:1.6;">Tienes ${obRanking.length} preferencias guardadas.</p>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px;">${topLabels}</div>
    <button type="button" class="ob-link-btn" data-action="ob-change-prefs">
      Cambiar mis gustos
    </button>`;
}

function renderObStep() {
  const header  = document.getElementById('obStepLabel');
  const progress= document.getElementById('obProgress');
  const body    = document.getElementById('obBody');
  const btnBack = document.getElementById('obBtnBack');
  const btnNext = document.getElementById('obBtnNext');

  header.textContent = `Paso ${obStep} de 3`;
  progress.style.width = obStep === 1 ? '33%' : obStep === 2 ? '66%' : '100%';
  btnBack.style.display = obStep > 1 ? 'block' : 'none';
  btnNext.textContent = obStep < 3 ? 'Siguiente →' : 'Ver mi itinerario';
  btnNext.onclick = obNext;

  if (obStep === 1) {
    body.innerHTML = `
      <h3 style="font-family:var(--font-display);color:${OB_C.text};font-size:1.2rem;margin:0 0 4px;font-weight:700;">¿Qué te gusta más?</h3>
      <p style="color:${OB_C.textMuted};font-size:0.85rem;margin:0 0 20px;line-height:1.6;">Haz clic en las tarjetas en orden de preferencia.</p>
      <div id="obPrefGrid" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"></div>
      <div id="obRankingList" style="margin-top:20px;display:none;">
        <p style="font-size:0.72rem;color:${OB_C.textMuted};letter-spacing:0.09em;text-transform:uppercase;margin-bottom:8px;font-weight:600;">Tu orden:</p>
        <div id="obRankItems" style="display:flex;flex-wrap:wrap;gap:6px;"></div>
        <button type="button" class="ob-link-btn ob-link-btn--sm" data-action="ob-reset">
          Reiniciar
        </button>
      </div>`;
    renderObPrefGrid();

  } else if (obStep === 2) {
    // ── PASO 2: Selector de días ──────────────────────────────────────────
    const isLogged = !!appState.currentUser;
    const dayOpts = [
      { d: 2, label: 'Fin de semana', sub: '2 días', free: true },
      { d: 3, label: 'Escapada',      sub: '3 días', free: false },
      { d: 4, label: 'Escapada',      sub: '4 días', free: false },
      { d: 5, label: 'Viaje',         sub: '5 días', free: false },
      { d: 6, label: 'Viaje',         sub: '6 días', free: false },
      { d: 7, label: 'Gran tour',     sub: '7 días', free: false },
    ];
    if (!window._obSelectedDays) window._obSelectedDays = 2;

    body.innerHTML = `
      <h3 style="font-family:var(--font-display);color:${OB_C.text};font-size:1.2rem;margin:0 0 4px;font-weight:700;">¿Cuántos días tienes?</h3>
      <p style="color:${OB_C.textMuted};font-size:0.85rem;margin:0 0 20px;line-height:1.6;">Los itinerarios de 3 a 7 días requieren registro.</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
        ${dayOpts.map(opt => {
          const locked = !opt.free && !isLogged;
          const sel    = window._obSelectedDays === opt.d;
          return `<button type="button"
            id="obDay_${opt.d}"
            class="ob-day${sel ? ' is-selected' : ''}${locked ? ' is-locked' : ''}"
            ${locked ? 'data-action="ob-register"' : `data-action="ob-days" data-days="${opt.d}"`}>
            ${locked ? `<span class="ob-day-lock"><svg class="cat-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>` : ''}
            <div class="ob-day-num">${opt.d}</div>
            <div class="ob-day-label">${opt.label}</div>
          </button>`;
        }).join('')}
      </div>
      ${!isLogged ? `<div style="margin-top:16px;padding:12px 16px;background:${OB_C.lockBg};border:1px solid ${OB_C.lockBorder};border-radius:var(--radius);font-size:0.8rem;color:${OB_C.textMuted};line-height:1.6;">
        <svg class="cat-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg> Itinerarios de 3-7 días disponibles con cuenta gratuita.
        <a href="#" class="ob-lock-link" data-action="ob-register">Registrarse →</a>
      </div>` : ''}`;

  } else {
    // ── PASO 3: Selector de provincias (multi-selección) ──────────────────
    const provs = ['Ávila','Burgos','León','Palencia','Salamanca','Segovia','Soria','Valladolid','Zamora'];
    if (!Array.isArray(window._obSelectedProvinces)) window._obSelectedProvinces = [];
    const numDays = window._obSelectedDays || 2;
    body.innerHTML = `
      <h3 style="font-family:var(--font-display);color:${OB_C.text};font-size:1.2rem;margin:0 0 4px;font-weight:700;">¿A qué provincias viajas?</h3>
      <p style="color:${OB_C.textMuted};font-size:0.85rem;margin:0 0 6px;line-height:1.6;">
        Itinerario de <strong style="color:${OB_C.accent};font-weight:700;">${numDays} días</strong> · Puedes elegir <strong>varias provincias</strong>.
      </p>
      <p id="obProvHint" style="color:${OB_C.textMuted};font-size:0.78rem;margin:0 0 14px;">
        ${numDays === 1 ? 'Selecciona 1 provincia.' : `Hasta ${Math.min(numDays, provs.length)} provincias (los días se reparten entre ellas).`}
      </p>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
        ${provs.map(p => `
          <button type="button" class="ob-prov" data-action="ob-province" data-province="${p}" id="obProv_${p.replace(/\s/g,'_')}">
            <span class="ob-prov-badge" id="obProvBadge_${p.replace(/\s/g,'_')}"></span>
            <div class="ob-prov-icon">${provinceCode[p]}</div>
            ${p}
          </button>`).join('')}
      </div>
      <div id="obProvSummary" style="margin-top:14px;font-size:0.78rem;color:${OB_C.textMuted};min-height:20px;"></div>`;

    // Re-pintar las provincias ya seleccionadas (si vuelve atrás)
    setTimeout(() => {
      window._obSelectedProvinces.forEach(p => _obPaintProvince(p, true));
      _obUpdateProvSummary();
    }, 30);
  }
}

function renderObPrefGrid() {
  const grid = document.getElementById('obPrefGrid');
  if (!grid) return;
  grid.innerHTML = OB_PREFS.map(pref => {
    const rank = obRanking.indexOf(pref.id); const selected = rank !== -1;
    return `<button type="button" class="ob-card${selected ? ' is-selected' : ''}" data-action="ob-pref" data-pref="${pref.id}" id="obCard_${pref.id}">
      ${selected ? `<span class="ob-card-rank">${rank+1}</span>` : ''}
      <div class="ob-card-icon">${pref.icon}</div>
      <div class="ob-card-label">${pref.label}</div>
    </button>`;
  }).join('');

  const list  = document.getElementById('obRankingList');
  const items = document.getElementById('obRankItems');
  if (list) list.style.display = obRanking.length ? 'block' : 'none';
  if (items) items.innerHTML = obRanking.map((id, i) => {
    const p = OB_PREFS.find(x => x.id === id);
    return `<span style="background:${OB_C.accentBg};border:1px solid ${OB_C.rankBorder};border-radius:var(--radius);padding:4px 12px;font-size:0.78rem;color:${OB_C.rankText};font-weight:600;">${i+1}. ${p.icon} ${p.label}</span>`;
  }).join('');
}

function obTogglePref(id) {
  const idx = obRanking.indexOf(id);
  if (idx !== -1) obRanking.splice(idx, 1);
  else obRanking.push(id);
  renderObPrefGrid();
}

function obResetRanking() { obRanking = []; renderObPrefGrid(); }

function _obPaintProvince(name, selected) {
  const btn   = document.getElementById('obProv_' + name.replace(/\s/g, '_'));
  const badge = document.getElementById('obProvBadge_' + name.replace(/\s/g, '_'));
  if (!btn) return;
  btn.classList.toggle('is-selected', selected);
  if (badge && selected) badge.textContent = (window._obSelectedProvinces.indexOf(name) + 1).toString();
}

function _obUpdateProvSummary() {
  const sum = document.getElementById('obProvSummary');
  if (!sum) return;
  const list = window._obSelectedProvinces || [];
  const numDays = window._obSelectedDays || 2;
  if (!list.length) {
    sum.innerHTML = `<span style="color:${OB_C.textMuted};">Aún no has elegido ninguna provincia.</span>`;
    return;
  }
  // Distribución de días sugerida
  const split = _obSplitDays(numDays, list.length);
  const parts = list.map((p, i) => `<strong style="color:${OB_C.accent};">${p}</strong> <span style="color:${OB_C.textMuted};">(${split[i]} día${split[i] !== 1 ? 's' : ''})</span>`).join(' · ');
  sum.innerHTML = `${parts}`;
}

// Reparte numDays entre numProvs lo más equitativamente posible
function _obSplitDays(numDays, numProvs) {
  const base = Math.floor(numDays / numProvs);
  const extra = numDays % numProvs;
  const split = [];
  for (let i = 0; i < numProvs; i++) split.push(base + (i < extra ? 1 : 0));
  return split;
}

function obToggleProvince(name) {
  if (!Array.isArray(window._obSelectedProvinces)) window._obSelectedProvinces = [];
  const list = window._obSelectedProvinces;
  const numDays = window._obSelectedDays || 2;
  const maxProvs = Math.min(numDays, 9);

  const idx = list.indexOf(name);
  if (idx !== -1) {
    // Deseleccionar
    list.splice(idx, 1);
    _obPaintProvince(name, false);
    // Repintar el resto para actualizar números de orden
    list.forEach(p => _obPaintProvince(p, true));
  } else {
    // Comprobar límite
    if (list.length >= maxProvs) {
      showToast(`Para ${numDays} días puedes elegir hasta ${maxProvs} provincia${maxProvs !== 1 ? 's' : ''}`);
      return;
    }
    list.push(name);
    _obPaintProvince(name, true);
  }
  _obUpdateProvSummary();
}

function obPrev() { if (obStep > 1) { obStep--; renderObStep(); } }

function obSelectDays(d) {
  window._obSelectedDays = d;
  document.querySelectorAll('[id^="obDay_"]').forEach(btn => {
    btn.classList.toggle('is-selected', btn.id === 'obDay_' + d);
  });
}

function obNext() {
  if (obStep === 1) {
    obStep = 2; renderObStep();
  } else if (obStep === 2) {
    if (!window._obSelectedDays) { showToast('Selecciona cuántos días'); return; }
    obStep = 3; renderObStep();
  } else {
    const provList = window._obSelectedProvinces || [];
    if (!provList.length) { showToast('Selecciona al menos una provincia'); return; }
    obSavePrefs();
    closeOnboarding();
    const days = window._obSelectedDays || 2;
    launchTripPlan(provList, obRanking, days);
  }
}

// Monta el plan con plan-builder.js y lo muestra en la pestaña «Itinerario» del mapa
function launchTripPlan(provincesList, ranking, numDays) {
  numDays = numDays || 2;
  const isLogged = !!appState.currentUser;
  const allDays = buildTripPlan(provincesList, ranking, numDays);
  if (!allDays.length) { showToast('No se pudo generar el itinerario'); return; }

  const mainProv = provincesList[0];
  const multi = provincesList.length > 1;
  const dia1 = allDays[0]?.items || [];
  const dia2 = allDays[1]?.items || [];
  appState.currentPlan = { province: mainProv, dia1, dia2, allDays, numDays, ...(multi ? { provincesList, isMultiProvince: true } : {}) };
  appState.personalizedPlan = { ranking, isLogged };
  appState.selectedProvince = mainProv;

  const title = provincesList.join(' · ');
  const plannerProv = document.getElementById('plannerProvince');
  if (plannerProv) plannerProv.textContent = title;
  selectProvince(mainProv, true);
  navigateTo('/mapa');
  setTimeout(() => {
    const tabsWrap = document.getElementById('mapTabsWrap');
    if (tabsWrap) tabsWrap.style.display = 'block';
    const emptyState = document.getElementById('mapEmptyState');
    if (emptyState) emptyState.style.display = 'none';
    switchMapTab('planificador');
    setTimeout(() => renderPersonalizedDayPlanner(title, dia1, dia2, ranking, isLogged, allDays), 100);
  }, 300);
}

function renderPersonalizedDayPlanner(province, dia1, dia2, ranking, _ignored, allDays) {
  const isLogged = !!appState.currentUser;
  const container = document.getElementById('dayPlanContainer');
  if (!container) return;
  const overlay = document.getElementById('lockedOverlay');
  if (overlay) overlay.style.display = 'none';
  let badge = document.getElementById('personalizedBadge');
  if (!badge) { badge = document.createElement('div'); badge.id = 'personalizedBadge'; badge.style.cssText = 'grid-column:1/-1;'; container.parentNode.insertBefore(badge, container); }
  const topPrefs = ranking.slice(0, 3).map(id => { const p = OB_PREFS.find(x => x.id === id); return p ? `<span class="plan-pref">${p.icon} ${escHTML(p.label)}</span>` : ''; }).filter(Boolean);
  badge.innerHTML = `<div class="plan-prefs"><span class="plan-prefs-label">Ordenado por tus gustos</span><div class="plan-prefs-list">${topPrefs.join('')}</div><button type="button" class="plan-prefs-btn" data-action="ob-open">Cambiar</button></div>`;
  const _allScores = (allDays && allDays.length ? allDays.flatMap(d => d.items) : [...dia1, ...dia2]).map(i => planAffinity(i, ranking));
  const _maxScore = Math.max(..._allScores, 1);
  const renderItem = (item) => {
    const mk = item.marker;
    const photo = item.photo || mk?.photo || '';
    const cat = mk ? (catLabel[mk.cat] || mk.cat) : '';
    const icon = mk ? (catIcon[mk.cat] || catIcon.default) : catIcon.default;
    const score = planAffinity(item, ranking);
    const matchPct = _maxScore > 0 ? score / _maxScore : 0;
    const matchBadge = matchPct >= 0.75
      ? `<span class="plan-match plan-match--top">Para ti</span>`
      : matchPct >= 0.35
      ? `<span class="plan-match">Recomendado</span>` : '';
    const lowNote = matchPct < 0.2 && ranking.length > 0
      ? `<span class="plan-match plan-match--low">Menos afín</span>` : '';
    const sched = (() => {
      if (!isLogged) return '';
      const desc = item.desc || ''; const w = [];
      [/cierra a las [\d:]+/i, /horario[^.]+/i, /requiere reserva[^.]*/i, /acceso regulado[^.]*/i, /\d{2}:\d{2}-\d{2}:\d{2}/].forEach(re => {
        const m = desc.match(re); if (m) w.push(m[0]);
      });
      return w.length ? `<div class="plan-sched">${w.map(x => `<span>${escHTML(x)}</span>`).join('')}</div>` : '';
    })();
    const lat = mk?.lat || 0; const lng = mk?.lng || 0;
    return `<div class="timeline-item has-marker plan-item${matchPct >= 0.75 ? ' is-match' : ''}" data-action="focus" data-lat="${lat}" data-lng="${lng}">
      ${isLogged ? `<div class="time-badge">${item.time}</div>` : `<div class="time-badge is-hidden" aria-label="Hora visible con cuenta">--:--</div>`}
      <div class="timeline-content">
        <div class="plan-item-row">
          ${photo ? `<div class="plan-item-photo"><img src="${photo}" alt="" onerror="this.parentNode.style.display='none'"></div>` : ''}
          <div class="plan-item-text">
            <h4>${escHTML(item.place)}</h4>
            <div class="plan-tags">${cat ? `<span class="plan-item-cat" data-fam="${catFam(mk?.cat)}">${escHTML(cat)}</span>` : ''}${matchBadge}${lowNote}</div>
            <p class="plan-item-desc">${item.desc}</p>
            ${sched}
            ${!isLogged ? `<span class="plan-locked-note"><a href="#" class="plan-register-link" data-action="open-modal" data-modal="register">Regístrate</a> para ver los horarios</span>` : ''}
            <span class="plan-map-link">${catIcon.default} Ver en el mapa</span>
          </div>
        </div>
      </div>
    </div>`;
  };
  const renderDay = (items, dayLabel) =>
    `<div class="col-12 col-md-6"><div class="day-plan-card h-100"><h3>${dayLabel} en ${province}</h3><div class="timeline">${items.length ? items.map(renderItem).join('') : '<p class="plan-day-empty">Sin lugares disponibles.</p>'}</div></div></div>`;
  const planAllDays = allDays || appState.currentPlan?.allDays;
  if (planAllDays && planAllDays.length > 0) {
    container.innerHTML = planAllDays.map(d => renderDay(d.items, d.label)).join('');
  } else {
    container.innerHTML = renderDay(dia1, 'Sábado') + renderDay(dia2, 'Domingo');
  }
  appState.currentPlan = { province, dia1, dia2, allDays: allDays || appState.currentPlan?.allDays, numDays: appState.currentPlan?.numDays };
  const pdfBtn = document.getElementById('pdfBtn');
  if (pdfBtn) pdfBtn.style.display = appState.currentUser ? 'inline-flex' : 'none';

  // Mostrar la barra de botones (Guardar + PDF + Ver ruta)
  const btnWrap = document.getElementById('plannerBtnWrap');
  if (btnWrap) btnWrap.style.display = 'flex';

  // Botón Guardar: visible solo si hay sesión
  const saveBtn = document.getElementById('plannerSaveBtn');
  if (saveBtn) saveBtn.style.display = appState.currentUser ? 'inline-flex' : 'none';

  let routeBtn = document.getElementById('plannerRouteBtn');
  if (!routeBtn) {
    routeBtn = document.createElement('button');
    routeBtn.id = 'plannerRouteBtn'; routeBtn.className = 'pdf-btn';
    routeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3"/></svg> Ver ruta`;
    const bw = document.getElementById('plannerBtnWrap'); if (bw) bw.appendChild(routeBtn);
  }
  routeBtn.style.display = 'inline-flex';
  routeBtn.onclick = () => {
    const cp = appState.currentPlan; if (!cp) return;
    let days;
    if (cp.allDays && cp.allDays.length > 0) {
      days = cp.allDays.map((d, i) => ({
        label: d.label,
        places: d.items.filter(p => p.marker?.lat).map(p => ({ lat: p.marker.lat, lng: p.marker.lng, name: p.marker.name }))
      })).filter(d => d.places.length > 0);
    } else {
      days = [
        { label: 'Sábado',  places: (cp.dia1 || []).filter(p => p.marker?.lat).map(p => ({ lat: p.marker.lat, lng: p.marker.lng, name: p.marker.name })) },
        { label: 'Domingo', places: (cp.dia2 || []).filter(p => p.marker?.lat).map(p => ({ lat: p.marker.lat, lng: p.marker.lng, name: p.marker.name })) },
      ].filter(d => d.places.length > 0);
    }
    if (days.reduce((s, d) => s + d.places.length, 0) < 2) { showToast('No hay suficientes marcadores'); return; }
    openRouteMap(null, cp.province || province, days);
  };
}

// ============================================================
// GUARDAR PLANIFICADOR DEL CUESTIONARIO (límite 3, vía MongoDB)
// ============================================================
async function savePlannerItinerary() {
  if (!appState.currentUser) {
    showToast('Inicia sesión para guardar tu itinerario');
    openModal('login');
    return;
  }
  const cp = appState.currentPlan;
  if (!cp) { showToast('No hay itinerario que guardar'); return; }

  // Convertir el plan del cuestionario al formato del modelo Itinerary
  // (mismo shape que usa "Mi Itinerario" para que se vea igual al cargarlo)
  const provLabel = Array.isArray(cp.provincesList) ? cp.provincesList.join(' · ') : cp.province;
  const days = (cp.allDays && cp.allDays.length > 0)
    ? cp.allDays.map((d, i) => ({
        date: new Date(Date.now() + i * 86400000),
        dayName: d.label || ('Día ' + (i + 1)),
        jsDay: i,
        places: (d.items || []).map(it => ({
          name:    it.place || it.marker?.name || '',
          time:    it.time || '',
          desc:    it.desc || '',
          cat:     it.marker?.cat || null,
          lat:     it.marker?.lat || 0,
          lng:     it.marker?.lng || 0,
          photo:   it.photo || it.marker?.photo || null,
          province: it.marker?.province || cp.province
        }))
      }))
    : [
        { date: new Date(), dayName: 'Día 1', jsDay: 0,
          places: (cp.dia1 || []).map(it => ({
            name: it.place, time: it.time, desc: it.desc,
            cat: it.marker?.cat, lat: it.marker?.lat || 0, lng: it.marker?.lng || 0,
            photo: it.photo || it.marker?.photo, province: it.marker?.province || cp.province
          })) },
        { date: new Date(Date.now() + 86400000), dayName: 'Día 2', jsDay: 1,
          places: (cp.dia2 || []).map(it => ({
            name: it.place, time: it.time, desc: it.desc,
            cat: it.marker?.cat, lat: it.marker?.lat || 0, lng: it.marker?.lng || 0,
            photo: it.photo || it.marker?.photo, province: it.marker?.province || cp.province
          })) }
      ];

  const defaultTitle = `${provLabel} · ${cp.numDays || days.length} día${(cp.numDays || days.length) !== 1 ? 's' : ''}`;
  const title = prompt('Nombre del itinerario:', defaultTitle);
  if (title === null) return;

  const payload = {
    title:    title.trim() || defaultTitle,
    province: cp.province,
    dateStr:  new Date().toISOString().split('T')[0],
    numDays:  cp.numDays || days.length,
    days,
    warnings: []
  };

  try {
    const url = cp._savedId ? '/api/itineraries/' + cp._savedId : '/api/itineraries';
    const method = cp._savedId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) { showToast('' + (data.error || 'No se pudo guardar')); return; }
    cp._savedId = data._id;
    showToast('Itinerario guardado en "Mis Itinerarios"');
    // Refrescar listas si están visibles
    if (typeof loadMyItineraries === 'function') loadMyItineraries();
  } catch(e) {
    showToast('Error al guardar');
  }
}

(function () { const s = obLoadPrefs(); if (s.length) setTimeout(() => obUpdateNavBadge(s.length), 400); })();

// ============================================================
// SPA ROUTER
// ============================================================
