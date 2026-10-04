function switchMapTab(tab) {
  const explorar     = document.getElementById('mapPanelExplorar');
  const planificador = document.getElementById('mapPanelPlanificador');
  const btnExp       = document.getElementById('tabExplorar');
  const btnPlan      = document.getElementById('tabPlanificador');

  if (tab === 'explorar') {
    if (explorar)     explorar.style.display     = 'block';
    if (planificador) planificador.style.display = 'none';
    if (btnExp)  btnExp.classList.add('active');
    if (btnPlan) btnPlan.classList.remove('active');
    renderProvinceListExplore();
  } else {
    if (explorar)     explorar.style.display     = 'none';
    if (planificador) planificador.style.display = 'block';
    if (btnPlan) btnPlan.classList.add('active');
    if (btnExp)  btnExp.classList.remove('active');
    const plannerBtnWrap = document.getElementById('plannerBtnWrap');
    if (plannerBtnWrap) plannerBtnWrap.style.display = 'block';
  }
}

// ============================================================
// GENERADOR DE PLAN DE FIN DE SEMANA DINÁMICO
// ============================================================

// Prioridad de categorías para ordenar los marcadores
const CAT_PRIORITY = {
  monumento:  1,
  museo:      2,
  cultura:    3,
  exposicion: 4,
  teatro:     5,
  biblioteca: 6,
  cine:       7,
};

// Horarios por slot (mañana día 1, tarde día 1, mañana día 2, tarde día 2)
const DAY_SLOTS = [
  ['9:00', '10:30', '12:00', '16:00', '17:30', '19:30'],
  ['9:30', '11:00', '12:30', '16:00', '17:30', '19:00'],
];

// Descripción enriquecida por categoría si el marcador no tiene desc
const CAT_DESC_TEMPLATE = {
  monumento:  (name) => `Visita ${name}, uno de los referentes patrimoniales de la provincia.`,
  museo:      (name) => `Recorre las colecciones de ${name} y descubre la historia local.`,
  cultura:    (name) => `${name} es un espacio cultural imprescindible de la zona.`,
  exposicion: (name) => `Descubre la exposición permanente de ${name}.`,
  teatro:     (name) => `${name} acoge espectáculos y eventos culturales de primer nivel.`,
  biblioteca: (name) => `${name} conserva un importante fondo documental y patrimonial.`,
  cine:       (name) => `${name} es referente del ocio cultural en la provincia.`,
};

function generateWeekendPlan(province) {
  const markers = appState.markers.filter(m => m.province === province);
  if (!markers.length) return null;

  // Ordenar por prioridad de categoría
  const sorted = [...markers].sort((a, b) =>
    (CAT_PRIORITY[a.cat] || 9) - (CAT_PRIORITY[b.cat] || 9)
  );

  // Intentar diversidad: no más de 3 del mismo cat por día
  const selected = [];
  const catCount = {};
  for (const mk of sorted) {
    const c = mk.cat || 'otros';
    if ((catCount[c] || 0) < 6) {
      selected.push(mk);
      catCount[c] = (catCount[c] || 0) + 1;
    }
    if (selected.length >= 12) break;
  }

  // Distribuir 6 por día
  const dia1Markers = selected.slice(0, 6);
  const dia2Markers = selected.slice(6, 12);

  function toItems(mkList, dayIdx) {
    return mkList.map((mk, i) => ({
      time:   DAY_SLOTS[dayIdx][i] || `${9 + i * 2}:00`,
      place:  mk.name,
      desc:   (mk.desc && mk.desc.trim() && mk.desc !== mk.name && mk.desc.length > 8)
                ? mk.desc
                : (CAT_DESC_TEMPLATE[mk.cat] || CAT_DESC_TEMPLATE.cultura)(mk.name),
      marker: mk,
    }));
  }

  return {
    dia1: toItems(dia1Markers, 0),
    dia2: toItems(dia2Markers, 1),
  };
}

function updateDayPlanner(province) {
  const container = document.getElementById('dayPlanContainer');

  // Usar dayPlans fijos si existen, si no caer en el plan dinámico
  let plan;
  if (dayPlans[province]) {
    const enrichItem = (item) => {
      let marker = appState.markers.find(m => m.name === item.place)
                || appState.markers.find(m => m.name.toLowerCase() === (item.place||'').toLowerCase());
      // Always prefer dayPlan photo — it's curated and guaranteed to exist
      const photo = item.photo || (marker && marker.photo) || null;
      if (marker) {
        marker = { ...marker, photo };
      } else {
        // No marker in DB — create minimal object so renderItem can show photo
        marker = { name: item.place, photo, cat: null, lat: 0, lng: 0 };
      }
      return { ...item, marker };
    };
    plan = {
      dia1: (dayPlans[province].dia1 || []).map(enrichItem),
      dia2: (dayPlans[province].dia2 || []).map(enrichItem),
    };
  } else {
    plan = generateWeekendPlan(province);
  }

  if (!plan || (!plan.dia1.length && !plan.dia2.length)) {
    container.innerHTML = '<p class="plan-empty">No hay marcadores disponibles para esta provincia.</p>';
    return;
  }

  const renderItem = (item) => {
    const mk    = item.marker;
    const photo = item.photo || mk?.photo || '';
    const cat   = mk ? (catLabel[mk.cat] || mk.cat) : '';
    const icon  = mk ? (catIcon[mk.cat] || catIcon.default) : catIcon.default;
    return `
      <div class="timeline-item has-marker plan-item" data-action="focus" data-lat="${mk?.lat||0}" data-lng="${mk?.lng||0}">
        <div class="time-badge">${item.time}</div>
        <div class="timeline-content">
          <div class="plan-item-row">
            ${photo ? `
              <div class="plan-item-photo">
                <img src="${escHTML(photo)}" alt="${escHTML(mk.name)}" onerror="this.parentNode.hidden = true">
              </div>` : ''}
            <div class="plan-item-text">
              <h4>${escHTML(mk.name)}
                <span class="plan-item-cat">${icon} ${escHTML(cat)}</span>
              </h4>
              <p class="plan-item-desc">${escHTML(item.desc)}</p>
              <span class="plan-map-link">${catIcon.default} Ver en el mapa</span>
            </div>
          </div>
        </div>
      </div>`;
  };

  const renderDay = (items, dayLabel) => `
    <div class="col-12 col-md-6">
      <div class="day-plan-card h-100">
        <h3>${dayLabel} en ${province}</h3>
        <div class="timeline">
          ${items.length ? items.map(renderItem).join('') : '<p class="plan-day-empty">Sin lugares disponibles.</p>'}
        </div>
      </div>
    </div>
  `;

  // Sin cuenta: el sábado completo y un adelanto del domingo con la invitación a registrarse
  const renderGatedDay = (items, dayLabel) => `
    <div class="col-12 col-md-6">
      <div class="day-plan-card h-100 plan-gated">
        <h3>${dayLabel} en ${province}</h3>
        <div class="timeline plan-gated-preview" aria-hidden="true">${items.slice(0, 2).map(renderItem).join('')}</div>
        <div class="plan-gate">
          <p class="plan-gate-title">El domingo, con tu cuenta</p>
          <p>Regístrate gratis para ver el segundo día, guardar el itinerario y descargarlo en PDF.</p>
          <div class="plan-gate-actions">
            <button type="button" class="btn" data-action="open-modal" data-modal="register">Crear cuenta gratis</button>
            <button type="button" class="plan-gate-login" data-action="open-modal" data-modal="login">Ya tengo cuenta</button>
          </div>
        </div>
      </div>
    </div>`;

  container.innerHTML =
    renderDay(plan.dia1, 'Sábado') +
    (appState.currentUser || !plan.dia2.length ? renderDay(plan.dia2, 'Domingo') : renderGatedDay(plan.dia2, 'Domingo'));

  // Guardar para ruta y PDF
  appState.currentPlan = { province, dia1: plan.dia1, dia2: plan.dia2 };

  // Botón PDF
  const pdfBtn = document.getElementById('pdfBtn');
  if (pdfBtn) pdfBtn.style.display = appState.currentUser ? 'inline-flex' : 'none';

  // Botón Ver ruta
  let routeBtn = document.getElementById('plannerRouteBtn');
  if (!routeBtn) {
    routeBtn = document.createElement('button');
    routeBtn.id = 'plannerRouteBtn';
    routeBtn.className = 'btn planner-route-btn';
    routeBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3"/></svg>&nbsp;Ver ruta en mapa`;
    if (pdfBtn) {
      pdfBtn.parentNode.insertBefore(routeBtn, pdfBtn.nextSibling);
    } else {
      const btnWrap = document.querySelector('#spa-planificador .text-center');
      if (btnWrap) btnWrap.appendChild(routeBtn);
    }
  }
  routeBtn.style.display = 'inline-flex';
  routeBtn.onclick = () => {
    const cp = appState.currentPlan;
    if (!cp) return;
    const emojis = ['🌅','🌄','🌇','🌆','🌃','🌉','🌁'];
    const labels = ['Sábado','Domingo','Día 3','Día 4','Día 5','Día 6','Día 7'];
    let days;
    if (cp.allDays && cp.allDays.length > 0) {
      days = cp.allDays.map((d, i) => ({
        label: emojis[i] + ' ' + d.label,
        places: d.items.filter(p => p.marker && p.marker.lat).map(p => ({ lat: p.marker.lat, lng: p.marker.lng, name: p.marker.name }))
      })).filter(d => d.places.length > 0);
    } else {
      days = [
        { label: '🌅 Sábado',  places: (cp.dia1||[]).filter(p=>p.marker?.lat).map(p => ({ lat: p.marker.lat, lng: p.marker.lng, name: p.marker.name })) },
        { label: '🌄 Domingo', places: (cp.dia2||[]).filter(p=>p.marker?.lat).map(p => ({ lat: p.marker.lat, lng: p.marker.lng, name: p.marker.name })) },
      ].filter(d => d.places.length > 0);
    }
    const total = days.reduce((s, d) => s + d.places.length, 0);
    if (total < 2) { showToast('⚠️ No hay suficientes marcadores con coordenadas'); return; }
    openRouteMap(null, cp.province || province, days);
  };
}

// ============================================================
// AUTH
// ============================================================
