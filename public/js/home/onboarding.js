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
// Fondo crema cálido · acentos terracota/ámbar · texto tinta oscura
const OB_C = {
  bg:           '#FDFAF5',          // crema cálido (var(--cream))
  bgCard:       '#FFFFFF',          // blanco puro para tarjetas
  bgCardSel:    'rgba(184,92,56,0.07)', // terracota tenue al seleccionar
  border:       'rgba(184,92,56,0.18)', // borde terracota suave
  borderSel:    '#B85C38',          // borde terracota al seleccionar (var(--terra))
  accent:       '#B85C38',          // terracota principal
  accentLight:  '#D4845C',          // terracota claro
  accentBg:     'rgba(184,92,56,0.08)', // fondo accent
  accentBg2:    'rgba(184,92,56,0.15)', // fondo accent más intenso
  text:         '#2A2118',          // tinta oscura (var(--ink))
  textMuted:    '#8C7E6E',          // tinta apagada (var(--ink-muted))
  textSoft:     '#5A4D3E',          // tinta suave (var(--ink-soft))
  badge:        '#B85C38',          // color badge número
  badgeText:    '#FFFFFF',
  progressBg:   'rgba(184,92,56,0.12)',
  rankBg:       'rgba(184,92,56,0.08)',
  rankBorder:   'rgba(184,92,56,0.25)',
  rankText:     '#B85C38',
  btnPrimary:   'linear-gradient(135deg,#B85C38,#D4845C)',
  btnPrimaryHov:'linear-gradient(135deg,#8B3A1F,#B85C38)',
  btnSecBg:     'rgba(184,92,56,0.06)',
  btnSecBorder: 'rgba(184,92,56,0.25)',
  btnSecText:   '#B85C38',
  lockBg:       'rgba(184,92,56,0.06)',
  lockBorder:   'rgba(184,92,56,0.15)',
  shadow:       '0 8px 40px rgba(42,33,24,0.12)',
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
        btnNext.style.boxShadow = '0 4px 16px rgba(184,92,56,0.35)';
        btnNext.onmouseover = () => { btnNext.style.background = OB_C.btnPrimaryHov; btnNext.style.boxShadow = '0 6px 20px rgba(184,92,56,0.45)'; };
        btnNext.onmouseout  = () => { btnNext.style.background = OB_C.btnPrimary;    btnNext.style.boxShadow = '0 4px 16px rgba(184,92,56,0.35)'; };
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

function closeOnboarding() { document.getElementById('onboardingModal').style.display = 'none'; }

function _obTag(icon, label) {
  return `<span style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;background:${OB_C.accentBg};border:1px solid ${OB_C.rankBorder};border-radius:20px;font-size:0.8rem;color:${OB_C.accent};font-weight:600;">${icon} ${label}</span>`;
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
    <h3 style="font-family:'Instrument Serif',serif;color:${OB_C.text};font-size:1.15rem;margin:0 0 6px;font-weight:700;">¿Mantenemos tus gustos?</h3>
    <p style="color:${OB_C.textMuted};font-size:0.85rem;margin:0 0 18px;line-height:1.6;">Tienes ${obRanking.length} preferencias guardadas.</p>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px;">${topLabels}</div>
    <button onclick="obRanking=[];renderObStep();document.getElementById('obBtnNext').onclick=obNext;"
      style="background:none;border:none;color:${OB_C.textMuted};font-size:0.82rem;cursor:pointer;text-decoration:underline;padding:0;transition:color 0.2s;"
      onmouseover="this.style.color='${OB_C.accent}'" onmouseout="this.style.color='${OB_C.textMuted}'">
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
      <h3 style="font-family:'Instrument Serif',serif;color:${OB_C.text};font-size:1.2rem;margin:0 0 4px;font-weight:700;">¿Qué te gusta más?</h3>
      <p style="color:${OB_C.textMuted};font-size:0.85rem;margin:0 0 20px;line-height:1.6;">Haz clic en las tarjetas en orden de preferencia.</p>
      <div id="obPrefGrid" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"></div>
      <div id="obRankingList" style="margin-top:20px;display:none;">
        <p style="font-size:0.72rem;color:${OB_C.textMuted};letter-spacing:0.09em;text-transform:uppercase;margin-bottom:8px;font-weight:600;">Tu orden:</p>
        <div id="obRankItems" style="display:flex;flex-wrap:wrap;gap:6px;"></div>
        <button onclick="obResetRanking()"
          style="margin-top:10px;background:none;border:none;color:${OB_C.textMuted};font-size:0.78rem;cursor:pointer;text-decoration:underline;padding:0;transition:color 0.2s;"
          onmouseover="this.style.color='${OB_C.accent}'" onmouseout="this.style.color='${OB_C.textMuted}'">
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
      <h3 style="font-family:'Instrument Serif',serif;color:${OB_C.text};font-size:1.2rem;margin:0 0 4px;font-weight:700;">¿Cuántos días tienes?</h3>
      <p style="color:${OB_C.textMuted};font-size:0.85rem;margin:0 0 20px;line-height:1.6;">Los itinerarios de 3 a 7 días requieren registro.</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
        ${dayOpts.map(opt => {
          const locked = !opt.free && !isLogged;
          const sel    = window._obSelectedDays === opt.d;
          return `<button
            id="obDay_${opt.d}"
            onclick="${locked ? "closeOnboarding();openModal('register')" : `obSelectDays(${opt.d})`}"
            style="padding:18px 6px;background:${sel ? OB_C.bgCardSel : OB_C.bgCard};
                   border:2px solid ${sel ? OB_C.borderSel : OB_C.border};border-radius:12px;
                   cursor:${locked ? 'default' : 'pointer'};transition:all 0.2s;position:relative;
                   opacity:${locked ? '0.45' : '1'};box-shadow:${sel ? '0 4px 16px rgba(184,92,56,0.15)' : '0 1px 4px rgba(42,33,24,0.06)'};"
            ${!locked ? `onmouseover="if(window._obSelectedDays!==${opt.d}){this.style.borderColor='${OB_C.accentLight}';this.style.background='rgba(212,132,92,0.05)'}"
              onmouseout="if(window._obSelectedDays!==${opt.d}){this.style.borderColor='${OB_C.border}';this.style.background='${OB_C.bgCard}'}"` : ''}>
            ${locked ? `<span style="position:absolute;top:5px;right:7px;opacity:0.6;"><svg class="cat-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>` : ''}
            <div style="font-family:'Instrument Serif',serif;font-size:2rem;font-weight:900;color:${OB_C.accent};">${opt.d}</div>
            <div style="font-size:0.7rem;color:${OB_C.textMuted};margin-top:3px;line-height:1.4;font-weight:500;">${opt.label}</div>
          </button>`;
        }).join('')}
      </div>
      ${!isLogged ? `<div style="margin-top:16px;padding:12px 16px;background:${OB_C.lockBg};border:1px solid ${OB_C.lockBorder};border-radius:10px;font-size:0.8rem;color:${OB_C.textMuted};line-height:1.6;">
        <svg class="cat-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg> Itinerarios de 3-7 días disponibles con cuenta gratuita.
        <a href="#" onclick="closeOnboarding();openModal('register');return false;" style="color:${OB_C.accent};margin-left:4px;font-weight:600;">Registrarse →</a>
      </div>` : ''}`;
    setTimeout(() => {
      const b = document.getElementById('obDay_' + window._obSelectedDays);
      if (b) { b.style.borderColor = OB_C.borderSel; b.style.background = OB_C.bgCardSel; }
    }, 30);

  } else {
    // ── PASO 3: Selector de provincias (multi-selección) ──────────────────
    const provs = ['Ávila','Burgos','León','Palencia','Salamanca','Segovia','Soria','Valladolid','Zamora'];
    const provIcons = { 'Ávila':'🏰','Burgos':'⛪','León':'🦁','Palencia':'🌾','Salamanca':'📚','Segovia':'🏛️','Soria':'🌿','Valladolid':'🍷','Zamora':'🌊' };
    if (!Array.isArray(window._obSelectedProvinces)) window._obSelectedProvinces = [];
    const numDays = window._obSelectedDays || 2;
    body.innerHTML = `
      <h3 style="font-family:'Instrument Serif',serif;color:${OB_C.text};font-size:1.2rem;margin:0 0 4px;font-weight:700;">¿A qué provincias viajas?</h3>
      <p style="color:${OB_C.textMuted};font-size:0.85rem;margin:0 0 6px;line-height:1.6;">
        Itinerario de <strong style="color:${OB_C.accent};font-weight:700;">${numDays} días</strong> · Puedes elegir <strong>varias provincias</strong>.
      </p>
      <p id="obProvHint" style="color:${OB_C.textMuted};font-size:0.78rem;margin:0 0 14px;font-style:italic;">
        ${numDays === 1 ? 'Selecciona 1 provincia.' : `Hasta ${Math.min(numDays, provs.length)} provincias (los días se reparten entre ellas).`}
      </p>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
        ${provs.map(p => `
          <button onclick="obToggleProvince('${p}')" id="obProv_${p.replace(/\s/g,'_')}"
            style="padding:16px 8px;background:${OB_C.bgCard};border:1.5px solid ${OB_C.border};
                   border-radius:12px;color:${OB_C.textSoft};font-family:'Instrument Serif',serif;font-size:0.85rem;
                   cursor:pointer;transition:all 0.2s;box-shadow:0 1px 4px rgba(42,33,24,0.06);position:relative;"
            onmouseover="if(!this.classList.contains('ob-prov-selected')){this.style.borderColor='${OB_C.accentLight}';this.style.background='rgba(212,132,92,0.06)';this.style.color='${OB_C.text}'}"
            onmouseout="if(!this.classList.contains('ob-prov-selected')){this.style.borderColor='${OB_C.border}';this.style.background='${OB_C.bgCard}';this.style.color='${OB_C.textSoft}'}">
            <span class="obProvBadge" id="obProvBadge_${p.replace(/\s/g,'_')}" style="display:none;position:absolute;top:6px;right:8px;background:${OB_C.badge};color:${OB_C.badgeText};width:20px;height:20px;border-radius:50%;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700;box-shadow:0 2px 6px rgba(184,92,56,0.4);"></span>
            <div style="font-size:1.2rem;margin-bottom:4px;">${provIcons[p] || '🗺️'}</div>
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
    return `<button onclick="obTogglePref('${pref.id}')" id="obCard_${pref.id}"
      style="padding:16px 14px;background:${selected ? OB_C.bgCardSel : OB_C.bgCard};
             border:1.5px solid ${selected ? OB_C.borderSel : OB_C.border};
             border-radius:12px;text-align:left;cursor:pointer;position:relative;transition:all 0.2s;
             box-shadow:${selected ? '0 4px 16px rgba(184,92,56,0.15)' : '0 1px 4px rgba(42,33,24,0.05)'};"
      onmouseover="if(!${selected}){this.style.borderColor='${OB_C.accentLight}';this.style.background='rgba(212,132,92,0.04)'}"
      onmouseout="if(!${selected}){this.style.borderColor='${OB_C.border}';this.style.background='${OB_C.bgCard}'}">
      ${selected ? `<span style="position:absolute;top:8px;right:10px;background:${OB_C.badge};color:${OB_C.badgeText};width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700;box-shadow:0 2px 6px rgba(184,92,56,0.4);">${rank+1}</span>` : ''}
      <div style="font-size:1.6rem;margin-bottom:6px;color:var(--terra);line-height:1;">${pref.icon}</div>
      <div style="font-size:0.82rem;color:${selected ? OB_C.accent : OB_C.textSoft};font-weight:${selected ? '700' : '500'};line-height:1.3;transition:color 0.2s;">${pref.label}</div>
    </button>`;
  }).join('');

  const list  = document.getElementById('obRankingList');
  const items = document.getElementById('obRankItems');
  if (list) list.style.display = obRanking.length ? 'block' : 'none';
  if (items) items.innerHTML = obRanking.map((id, i) => {
    const p = OB_PREFS.find(x => x.id === id);
    return `<span style="background:${OB_C.accentBg};border:1px solid ${OB_C.rankBorder};border-radius:20px;padding:4px 12px;font-size:0.78rem;color:${OB_C.rankText};font-weight:600;">${i+1}. ${p.icon} ${p.label}</span>`;
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
  if (selected) {
    btn.classList.add('ob-prov-selected');
    btn.style.borderColor = OB_C.borderSel;
    btn.style.background  = OB_C.bgCardSel;
    btn.style.color       = OB_C.accent;
    btn.style.boxShadow   = '0 4px 16px rgba(184,92,56,0.15)';
    if (badge) {
      const idx = window._obSelectedProvinces.indexOf(name);
      badge.textContent = (idx + 1).toString();
      badge.style.display = 'flex';
    }
  } else {
    btn.classList.remove('ob-prov-selected');
    btn.style.borderColor = OB_C.border;
    btn.style.background  = OB_C.bgCard;
    btn.style.color       = OB_C.textSoft;
    btn.style.boxShadow   = '0 1px 4px rgba(42,33,24,0.06)';
    if (badge) badge.style.display = 'none';
  }
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
  sum.innerHTML = `📍 ${parts}`;
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
      showToast(`⚠️ Para ${numDays} días puedes elegir hasta ${maxProvs} provincia${maxProvs !== 1 ? 's' : ''}`);
      return;
    }
    list.push(name);
    _obPaintProvince(name, true);
  }
  _obUpdateProvSummary();
}

// Mantenida por compatibilidad — selección única (delega en toggle)
function obSelectProvince(name) {
  window._obSelectedProvinces = [];
  document.querySelectorAll('[id^="obProv_"]').forEach(btn => {
    const provName = btn.id.replace('obProv_', '').replace(/_/g, ' ');
    _obPaintProvince(provName, false);
  });
  obToggleProvince(name);
}

function obPrev() { if (obStep > 1) { obStep--; renderObStep(); } }

function obSelectDays(d) {
  window._obSelectedDays = d;
  document.querySelectorAll('[id^="obDay_"]').forEach(btn => {
    btn.classList.remove('ob-day-selected');
    btn.style.borderColor = OB_C.border;
    btn.style.background  = OB_C.bgCard;
    btn.style.boxShadow   = '0 1px 4px rgba(42,33,24,0.06)';
  });
  const btn = document.getElementById('obDay_' + d);
  if (btn) {
    btn.classList.add('ob-day-selected');
    btn.style.borderColor = OB_C.borderSel;
    btn.style.background  = OB_C.bgCardSel;
    btn.style.boxShadow   = '0 4px 16px rgba(184,92,56,0.15)';
  }
}

function obNext() {
  if (obStep === 1) {
    obStep = 2; renderObStep();
  } else if (obStep === 2) {
    if (!window._obSelectedDays) { showToast('⚠️ Selecciona cuántos días'); return; }
    obStep = 3; renderObStep();
  } else {
    const provList = window._obSelectedProvinces || [];
    if (!provList.length) { showToast('⚠️ Selecciona al menos una provincia'); return; }
    obSavePrefs();
    closeOnboarding();
    const days = window._obSelectedDays || 2;
    if (provList.length === 1) {
      launchPersonalizedPlan(provList[0], obRanking, days);
    } else {
      launchMultiProvincePlan(provList, obRanking, days);
    }
  }
}

function scoreItem(item, ranking) {
  const text = ((item.place || '') + ' ' + (item.desc || '')).toLowerCase();
  let score = 0;
  ranking.forEach((prefId, rankPos) => {
    const weight = ranking.length - rankPos;
    (OB_KEYWORDS[prefId] || []).forEach(kw => { if (text.includes(kw)) score += weight * 2; });
    ((OB_PREFS.find(p => p.id === prefId) || {}).cats || []).forEach(cat => {
      if ((item.marker?.cat || '') === cat) score += weight * 3;
    });
  });
  return score;
}

function launchPersonalizedPlan(province, ranking, numDays) {
  numDays = numDays || 2;
  // Usar itinerarios enriquecidos con extras temáticos si están disponibles
  const base = (typeof buildEnrichedDayPlans === 'function')
    ? buildEnrichedDayPlans(province, ranking)
    : dayPlans[province];
  if (!base) { showToast('⚠️ No hay itinerario para ' + province); return; }
  const isLogged = !!appState.currentUser;
  const enrich = item => {
    let marker = appState.markers.find(m => m.name === item.place)
              || appState.markers.find(m => m.name.toLowerCase() === (item.place || '').toLowerCase());
    const photo = item.photo || (marker && marker.photo) || null;
    if (marker) { marker = { ...marker, photo }; } else { marker = { name: item.place, photo, cat: null, lat: 0, lng: 0 }; }
    return { ...item, marker };
  };

  const EMOJIS     = ['🌅','🌄','🌇','🌆','🌃','🌉','🌁'];
  const DAY_LABELS = ['Sábado','Domingo','Día 3','Día 4','Día 5','Día 6','Día 7'];
  const allDays = [];
  for (let d = 1; d <= numDays; d++) {
    const key = 'dia' + d;
    if (base[key] && base[key].length > 0) {
      allDays.push({
        key, label: DAY_LABELS[d - 1] || ('Día ' + d),
        emoji: EMOJIS[d - 1] || '📅',
        items: base[key].map(enrich)
      });
    }
  }

  const dia1 = allDays[0]?.items || (base.dia1 || []).map(enrich);
  const dia2 = allDays[1]?.items || (base.dia2 || []).map(enrich);
  appState.currentPlan = { province, dia1, dia2, allDays, numDays };
  appState.personalizedPlan = { ranking, isLogged };
  appState.selectedProvince = province;
  const plannerProv = document.getElementById('plannerProvince');
  if (plannerProv) plannerProv.textContent = province;
  selectProvince(province, true);
  navigateTo('/mapa');
  setTimeout(() => {
    const tabsWrap = document.getElementById('mapTabsWrap');
    if (tabsWrap) tabsWrap.style.display = 'block';
    const emptyState = document.getElementById('mapEmptyState');
    if (emptyState) emptyState.style.display = 'none';
    switchMapTab('planificador');
    setTimeout(() => renderPersonalizedDayPlanner(province, dia1, dia2, ranking, isLogged, appState.currentPlan.allDays), 100);
  }, 300);
}

// Itinerario multi-provincia: reparte los días entre las provincias elegidas
function launchMultiProvincePlan(provincesList, ranking, numDays) {
  numDays = numDays || 2;
  const isLogged = !!appState.currentUser;
  const split = _obSplitDays(numDays, provincesList.length);

  const enrich = item => {
    let marker = appState.markers.find(m => m.name === item.place)
              || appState.markers.find(m => m.name.toLowerCase() === (item.place || '').toLowerCase());
    const photo = item.photo || (marker && marker.photo) || null;
    if (marker) { marker = { ...marker, photo }; } else { marker = { name: item.place, photo, cat: null, lat: 0, lng: 0 }; }
    return { ...item, marker };
  };

  const EMOJIS = ['🌅','🌄','🌇','🌆','🌃','🌉','🌁'];
  const allDays = [];
  let dayIdx = 0;

  // Para cada provincia, coge los primeros N días de su itinerario base/enriquecido
  for (let pi = 0; pi < provincesList.length; pi++) {
    const prov     = provincesList[pi];
    const daysHere = split[pi];
    const base = (typeof buildEnrichedDayPlans === 'function')
      ? buildEnrichedDayPlans(prov, ranking)
      : dayPlans[prov];
    if (!base) continue;
    for (let d = 1; d <= daysHere; d++) {
      const key = 'dia' + d;
      if (base[key] && base[key].length > 0) {
        allDays.push({
          key: `${prov}_dia${d}`,
          label: `${prov} · Día ${d}`,
          emoji: EMOJIS[dayIdx] || '📅',
          province: prov,
          items: base[key].map(enrich)
        });
        dayIdx++;
      }
    }
  }

  if (!allDays.length) { showToast('⚠️ No se pudo generar itinerario'); return; }

  const dia1 = allDays[0]?.items || [];
  const dia2 = allDays[1]?.items || [];

  // Provincia "principal" para el header del planificador (la primera elegida)
  const mainProv = provincesList[0];
  appState.currentPlan = {
    province: mainProv,
    provincesList,
    dia1, dia2, allDays, numDays,
    isMultiProvince: true
  };
  appState.personalizedPlan = { ranking, isLogged };
  appState.selectedProvince = mainProv;

  const plannerProv = document.getElementById('plannerProvince');
  if (plannerProv) plannerProv.textContent = provincesList.join(' · ');

  selectProvince(mainProv, true);
  navigateTo('/mapa');
  setTimeout(() => {
    const tabsWrap = document.getElementById('mapTabsWrap');
    if (tabsWrap) tabsWrap.style.display = 'block';
    const emptyState = document.getElementById('mapEmptyState');
    if (emptyState) emptyState.style.display = 'none';
    switchMapTab('planificador');
    setTimeout(() => renderPersonalizedDayPlanner(provincesList.join(' · '), dia1, dia2, ranking, isLogged, allDays), 100);
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
  const topPrefs = ranking.slice(0, 3).map(id => { const p = OB_PREFS.find(x => x.id === id); return p ? p.icon + ' ' + p.label : ''; }).filter(Boolean);
  badge.innerHTML = `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:10px 18px;background:rgba(42,33,24,0.04);border-bottom:1px solid rgba(184,92,56,0.08);"><span style="font-size:0.78rem;color:var(--ink-muted);">✨ Personalizado para:</span><span style="font-size:0.82rem;color:var(--terra);font-weight:600;">${topPrefs.join(' · ')}</span><button onclick="openOnboarding()" style="margin-left:auto;display:inline-flex;align-items:center;gap:6px;padding:5px 12px;background:rgba(184,92,56,0.08);border:1px solid rgba(184,92,56,0.35);border-radius:6px;color:var(--terra);cursor:pointer;font-size:0.75rem;font-weight:600;transition:all 0.2s;" onmouseover="this.style.background='rgba(42,33,24,0.14)'" onmouseout="this.style.background='rgba(184,92,56,0.08)'">🎯 Cambiar gustos</button></div>`;
  const _allScores = [...dia1, ...dia2].map(i => scoreItem(i, ranking));
  const _maxScore = Math.max(..._allScores, 1);
  const renderItem = (item) => {
    const mk = item.marker;
    const photo = item.photo || mk?.photo || '';
    const cat = mk ? (catLabel[mk.cat] || mk.cat) : '';
    const icon = mk ? (catIcon[mk.cat] || catIcon.default) : catIcon.default;
    const score = scoreItem(item, ranking);
    const matchPct = _maxScore > 0 ? score / _maxScore : 0;
    const matchBadge = matchPct >= 0.75
      ? `<span style="font-size:0.62rem;background:rgba(184,92,56,0.12);border:1px solid rgba(184,92,56,0.4);border-radius:20px;color:var(--terra-dark);padding:1px 6px;margin-left:5px;vertical-align:middle;">★ Para ti</span>`
      : matchPct >= 0.35
      ? `<span style="font-size:0.62rem;background:rgba(42,33,24,0.06);border:1px solid rgba(42,33,24,0.18);border-radius:20px;color:var(--ink-soft);padding:1px 6px;margin-left:5px;vertical-align:middle;">✦ Rec.</span>` : '';
    const lowNote = matchPct < 0.2 && ranking.length > 0
      ? `<span style="font-size:0.66rem;color:var(--ink-muted);margin-left:5px;font-style:italic;vertical-align:middle;">· menos afín</span>` : '';
    const sched = (() => {
      if (!isLogged) return '';
      const desc = item.desc || ''; const w = [];
      [/cierra a las [\d:]+/i, /horario[^.]+/i, /requiere reserva[^.]*/i, /acceso regulado[^.]*/i, /\d{2}:\d{2}-\d{2}:\d{2}/].forEach(re => {
        const m = desc.match(re); if (m) w.push(m[0]);
      });
      return w.length ? `<div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:3px;">${w.map(x => `<span style="font-size:0.68rem;background:rgba(42,33,24,0.06);border:1px solid rgba(42,33,24,0.15);border-radius:20px;color:var(--ink-soft);padding:1px 6px;">🕐 ${x}</span>`).join('')}</div>` : '';
    })();
    const lat = mk?.lat || 0; const lng = mk?.lng || 0;
    return `<div class="timeline-item has-marker" onclick="focusMarkerFromPlanner(${lat},${lng})" style="cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background='rgba(184,92,56,0.05)'" onmouseout="this.style.background=''">
      ${isLogged ? `<div class="time-badge">${item.time}</div>` : `<div class="time-badge" style="opacity:0.3;filter:blur(3px);user-select:none;font-size:0.68rem;">--:--</div>`}
      <div class="timeline-content" style="flex:1;">
        <div style="display:flex;gap:8px;align-items:flex-start;">
          ${photo ? `<div style="width:44px;height:44px;flex-shrink:0;overflow:hidden;border-radius:6px;border:1px solid rgba(42,33,24,0.14);"><img src="${photo}" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentNode.style.display='none'"></div>` : ''}
          <div style="flex:1;min-width:0;">
            <h4 style="margin:0 0 2px;font-size:0.85rem;color:var(--ink);line-height:1.3;">${item.place}
              <span style="font-size:0.62rem;background:rgba(184,92,56,0.08);border:1px solid rgba(42,33,24,0.14);border-radius:4px;color:var(--terra);padding:1px 5px;margin-left:4px;vertical-align:middle;">${icon} ${cat}</span>
              ${matchBadge}${lowNote}
            </h4>
            <p style="margin:0;font-size:0.78rem;color:var(--ink-soft);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${item.desc}</p>
            ${sched}
            ${!isLogged ? `<span style="font-size:0.68rem;color:var(--ink-muted);margin-top:3px;display:inline-block;">🔒 <a href="#" onclick="openModal('register');return false;" style="color:var(--terra);text-decoration:none;font-weight:600;">Regístrate</a> para ver horarios</span>` : ''}
            <span style="font-size:0.68rem;color:var(--terra);margin-top:2px;display:inline-block;">🗺️ Ver en mapa</span>
          </div>
        </div>
      </div>
    </div>`;
  };
  const renderDay = (items, dayLabel, emoji) =>
    `<div class="col-12 col-md-6"><div class="day-plan-card h-100"><h3>${emoji} ${dayLabel} en ${province}</h3><div class="timeline">${items.length ? items.map(renderItem).join('') : '<p style="color:var(--ink-muted);font-style:italic;font-size:0.85rem;padding:12px;">Sin lugares disponibles.</p>'}</div></div></div>`;
  const planAllDays = allDays || appState.currentPlan?.allDays;
  if (planAllDays && planAllDays.length > 0) {
    container.innerHTML = planAllDays.map(d => renderDay(d.items, d.label, d.emoji)).join('');
  } else {
    container.innerHTML = renderDay(dia1, 'Sábado', '🌅') + renderDay(dia2, 'Domingo', '🌄');
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
    routeBtn.style.cssText = 'background:rgba(184,92,56,0.08);border:1px solid var(--terra);margin-left:8px;border-radius:8px;';
    routeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3"/></svg>&nbsp;Ver ruta`;
    const bw = document.getElementById('plannerBtnWrap'); if (bw) bw.appendChild(routeBtn);
  }
  routeBtn.style.display = 'inline-flex';
  routeBtn.onclick = () => {
    const cp = appState.currentPlan; if (!cp) return;
    const emojis = ['🌅','🌄','🌇','🌆','🌃','🌉','🌁'];
    let days;
    if (cp.allDays && cp.allDays.length > 0) {
      days = cp.allDays.map((d, i) => ({
        label: (emojis[i] || '📅') + ' ' + d.label,
        places: d.items.filter(p => p.marker?.lat).map(p => ({ lat: p.marker.lat, lng: p.marker.lng, name: p.marker.name }))
      })).filter(d => d.places.length > 0);
    } else {
      days = [
        { label: '🌅 Sábado',  places: (cp.dia1 || []).filter(p => p.marker?.lat).map(p => ({ lat: p.marker.lat, lng: p.marker.lng, name: p.marker.name })) },
        { label: '🌄 Domingo', places: (cp.dia2 || []).filter(p => p.marker?.lat).map(p => ({ lat: p.marker.lat, lng: p.marker.lng, name: p.marker.name })) },
      ].filter(d => d.places.length > 0);
    }
    if (days.reduce((s, d) => s + d.places.length, 0) < 2) { showToast('⚠️ No hay suficientes marcadores'); return; }
    openRouteMap(null, cp.province || province, days);
  };
}

// ============================================================
// GUARDAR PLANIFICADOR DEL CUESTIONARIO (límite 3, vía MongoDB)
// ============================================================
async function savePlannerItinerary() {
  if (!appState.currentUser) {
    showToast('⚠️ Inicia sesión para guardar tu itinerario');
    openModal('login');
    return;
  }
  const cp = appState.currentPlan;
  if (!cp) { showToast('⚠️ No hay itinerario que guardar'); return; }

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
    if (!res.ok) { showToast('❌ ' + (data.error || 'No se pudo guardar')); return; }
    cp._savedId = data._id;
    showToast('💾 Itinerario guardado en "Mis Itinerarios"');
    // Refrescar listas si están visibles
    if (typeof itinLoadSaved === 'function') itinLoadSaved();
    if (typeof loadMyItineraries === 'function') loadMyItineraries();
  } catch(e) {
    showToast('❌ Error al guardar');
  }
}

(function () { const s = obLoadPrefs(); if (s.length) setTimeout(() => obUpdateNavBadge(s.length), 400); })();

// ============================================================
// SPA ROUTER
// ============================================================
