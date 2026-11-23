// ================================================================
//  CyL Turismo — Generador de PDF
//  Paleta: cream / sand / terra / ink  (consonante con la web)
// ================================================================

// source 'plan': el plan personalizado que se ve en el panel del mapa (appState.currentPlan)
function downloadItinerarioPDF(source) {
  loadScriptOnce(LIB_JSPDF)
    .then(() => _downloadItinerarioPDF(source))
    .catch(() => showToast('No se pudo cargar el generador de PDF. Revisa la conexión.'));
}

// Líneas extra de un lugar del plan: aparcamiento, avisos de autocaravana y horario del día.
// Devuelve [{ text, color? }]; color solo para la línea de «Cerrado» (rojo).
function _pdfPlaceExtras(p, date) {
  const out = [];
  if (p._rvPark) {
    const km = typeof _rvFmtKm === 'function'
      ? _rvFmtKm(p._rvPark.km)
      : (Number(p._rvPark.km) || 0).toFixed(1).replace('.', ',') + ' km';
    out.push({ text: `Aparcar: ${p._rvPark.name} · a ${km}` });
  }
  if (Array.isArray(p._rvWarn)) {
    p._rvWarn.forEach(w => { if (w) out.push({ text: String(w) }); });
  }
  if (date && p.kind !== 'night' && typeof placeHoursOn === 'function') {
    const h = placeHoursOn({
      name: p.place || p.marker?.name,
      lat: p.marker?.lat || p.lat,
      lng: p.marker?.lng || p.lng,
      province: p.marker?.province,
      desc: p.desc
    }, date);
    if (h && h.state === 'open')   out.push({ text: `Abierto ${h.text} (${h.source})` });
    if (h && h.state === 'closed') out.push({ text: `Cerrado este día (${h.source})`, color: [180, 35, 24] });
  }
  return out;
}

function _downloadItinerarioPDF(source) {

  // ── Normalizar fuente de datos ───────────────────────────────
  // currentPlan (panel del mapa): { province, provincesList?, dateStr?, allDays:[{label, items:[{time,place,desc,marker}]}] }
  // dayPlans   (estático): { dia1:[{time,place,desc}], dia2:... }
  let province, headerDate, days;

  const cp = appState.currentPlan;
  const usePlan = source === 'plan' && cp && cp.allDays && cp.allDays.length;
  const longDate = d => d.toLocaleDateString('es-ES', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  if (usePlan) {
    province   = Array.isArray(cp.provincesList) ? cp.provincesList.join(' · ') : cp.province;
    // Con fecha de salida: la cabecera y cada día llevan su fecha
    headerDate = cp.dateStr ? 'Salida el ' + longDate(tripDayDate(cp.dateStr, 0)) : longDate(new Date());
    days = cp.allDays.map((day, di) => {
      const date = tripDayDate(cp.dateStr, di);
      return {
        // Si la etiqueta ya es el día de la semana («Sábado»), la fecha va sin él
        label:  (day.label || `Día ${di + 1}`) + (date ? ' · ' + date.toLocaleDateString('es-ES',
          (day.label || '').toLowerCase() === date.toLocaleDateString('es-ES', { weekday: 'long' }) ? { day: 'numeric', month: 'long' } : { weekday: 'long', day: 'numeric', month: 'long' }) : ''),
        places: (day.items || []).map((p, i) => ({
          time:  p.time  || _autoTime(i),
          name:  p.place || p.marker?.name || '—',
          cat:   p.marker?.cat || '',
          desc:  p.kind === 'night' ? 'Dormir · ' + p.desc : (p.desc || ''),
          extras: _pdfPlaceExtras(p, date)
        }))
      };
    });

  } else {
    province = appState.selectedProvince || 'Castilla y León';
    const plan = (typeof dayPlans !== 'undefined') && dayPlans[province];
    if (!plan) { showToast('No hay itinerario para esta provincia'); return; }
    headerDate = new Date().toLocaleDateString('es-ES', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

    // dayPlans puede tener dia1, dia2, dia3…
    const keys = Object.keys(plan).filter(k => k.startsWith('dia')).sort();
    days = keys.map((k, di) => ({
      label:  `Día ${di + 1}`,
      places: (plan[k] || []).map(p => ({
        time:  p.time  || _autoTime(di),
        name:  p.place || p.name || '—',
        cat:   p.cat   || '',
        desc:  p.desc  || '',
        extras: []
      }))
    }));
  }

  // ── Colores ──────────────────────────────────────────────────
  // Paleta del sistema «billete y panel de salidas»
  const TERRA_D = [ 14,  17,  20];   // tinta
  const TERRA   = [ 28,  33,  39];   // pizarra
  const TERRA_L = [255, 212,   0];   // amarillo señal
  const CREAM   = [255, 255, 255];
  const SAND    = [241, 242, 243];
  const SAND_D  = [231, 233, 236];
  const INK     = [ 14,  17,  20];
  const INK_M   = [ 90,  99, 110];
  const WHITE   = [255, 255, 255];

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W  = 210;
  const ML = 16;
  const CW = W - ML * 2;

  const fillRR = (x, y, w, h, r, c) => {
    doc.setFillColor(...c);
    doc.roundedRect(x, y, w, h, r, r, 'F');
  };
  const initPage = () => {
    doc.setFillColor(...CREAM);
    doc.rect(0, 0, W, 297, 'F');
  };
  initPage();

  // ── CABECERA ─────────────────────────────────────────────────
  doc.setFillColor(...TERRA_D);
  doc.rect(0, 0, W, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...WHITE);
  doc.text('CASTILLA Y LEÓN', W / 2, 9.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...TERRA_L);
  doc.text('PLANIFICA TU ESCAPADA', W / 2, 16, { align: 'center' });

  doc.setFillColor(...SAND_D);
  doc.rect(0, 22, W, 3.5, 'F');

  // ── TÍTULO ───────────────────────────────────────────────────
  let y = 37;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...TERRA_D);
  doc.text(`Itinerario en ${province}`, W / 2, y, { align: 'center' });
  y += 7;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...INK_M);
  doc.text(headerDate, W / 2, y, { align: 'center' });
  y += 5;
  doc.setDrawColor(...TERRA);
  doc.setLineWidth(0.5);
  doc.line(ML + 20, y, W - ML - 20, y);
  y += 9;

  // ── DÍAS ─────────────────────────────────────────────────────
  days.forEach((day, di) => {
    if (y > 255) { doc.addPage(); initPage(); y = 20; }

    // Cabecera día
    fillRR(ML, y, CW, 9, 2, TERRA);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...WHITE);
    doc.text(day.label.toUpperCase(), W / 2, y + 6, { align: 'center' });
    y += 14;

    day.places.forEach((item, i) => {
      const ROW = 18;
      const nameX = ML + 40;
      const nameW = CW - 40 - 2;
      // Descripción en hasta dos líneas (con «…» si sigue); la segunda alarga la fila 4 mm
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const descAll = item.desc ? doc.splitTextToSize(item.desc, nameW) : [];
      const descLines = descAll.slice(0, 2);
      if (descAll.length > 2) descLines[1] = descLines[1].replace(/\s*\S*$/, '') + '…';
      const descExtra = descLines.length > 1 ? 4 : 0;
      const extras = item.extras || [];
      const rowH = ROW + descExtra + 4.5 * extras.length;   // y 4.5 mm por cada línea extra
      if (y + rowH > 278) {
        doc.addPage(); initPage(); y = 20;
        fillRR(ML, y, CW, 9, 2, TERRA);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(...WHITE);
        doc.text(`${day.label.toUpperCase()} (cont.)`, W / 2, y + 6, { align: 'center' });
        y += 14;
      }

      // Fondo fila alternante
      fillRR(ML, y, CW, rowH, 1.5, i % 2 === 0 ? SAND : WHITE);

      // Acento izquierdo
      doc.setFillColor(...TERRA_L);
      doc.rect(ML, y, 2.5, rowH, 'F');

      // Badge hora
      fillRR(ML + 5, y + 3.5, 22, 6.5, 1.5, TERRA_D);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...WHITE);
      doc.text(item.time, ML + 16, y + 8, { align: 'center' });


      // Nombre del lugar
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...INK);
      doc.text(doc.splitTextToSize(item.name, nameW)[0], nameX, y + 7.5);

      // Descripción
      if (descLines.length) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...INK_M);
        descLines.forEach((line, k) => doc.text(line, nameX, y + 13.5 + 4 * k));
      }

      // Líneas extra (aparcamiento, avisos, horario), una línea cada una, bajo la descripción
      extras.forEach((ex, k) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...(ex.color || INK_M));
        doc.text(doc.splitTextToSize(ex.text, nameW)[0], nameX, y + 13.5 + descExtra + 4.5 * (k + 1));
      });

      y += rowH + 1;
    });

    y += 7;
  });

  // ── PIE DE PÁGINA ─────────────────────────────────────────────
  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFillColor(...SAND_D);
    doc.rect(0, 285, W, 12, 'F');
    doc.setFillColor(...TERRA_D);
    doc.rect(0, 285, W, 1.5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...INK_M);
    doc.text(`Castilla y León Turismo  ·  turismo.jcyl.es  ·  ${headerDate}`, W / 2, 291.5, { align: 'center' });
    doc.setTextColor(...TERRA);
    doc.text(`${p} / ${total}`, W - ML, 291.5, { align: 'right' });
  }

  doc.save(`Itinerario_${province.replace(/\s+/g,'_')}.pdf`);
  showToast('PDF descargado');
}

function _autoTime(i) {
  const mins = 600 + i * 90;
  return `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;
}
