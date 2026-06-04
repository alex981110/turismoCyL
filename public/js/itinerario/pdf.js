// ================================================================
//  CyL Turismo — Generador de PDF
//  Paleta: cream / sand / terra / ink  (consonante con la web)
// ================================================================

function downloadItinerarioPDF() {

  // ── Normalizar fuente de datos ───────────────────────────────
  // itinResult (dinámico): { province, dateStr, days:[{date:Date, dayName, places:[{name,cat,desc,time}]}] }
  // dayPlans   (estático): { dia1:[{time,place,desc}], dia2:... }
  let province, headerDate, days;

  const useDynamic = typeof itinResult !== 'undefined' && itinResult && itinResult.days && itinResult.days.length;

  if (useDynamic) {
    province   = itinResult.province;
    const d0   = itinResult.days[0].date;
    headerDate = (d0 instanceof Date ? d0 : new Date(d0 + 'T00:00:00'))
      .toLocaleDateString('es-ES', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

    days = itinResult.days.map((day, di) => {
      const dateObj  = day.date instanceof Date ? day.date : new Date(day.date + 'T00:00:00');
      const dayLabel = day.dayName
        ? `${day.dayName} — ${dateObj.toLocaleDateString('es-ES',{day:'numeric',month:'long'})}`
        : `Día ${di + 1}`;
      return {
        label:  dayLabel,
        places: (day.places || []).map((p, i) => ({
          time:  p.time  || _autoTime(i),
          name:  p.name  || p.place || '—',
          cat:   p.cat   || '',
          desc:  p.desc  || ''
        }))
      };
    });

  } else {
    province = appState.selectedProvince || 'Castilla y León';
    const plan = (typeof dayPlans !== 'undefined') && dayPlans[province];
    if (!plan) { showToast('⚠️ No hay itinerario para esta provincia'); return; }
    headerDate = new Date().toLocaleDateString('es-ES', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

    // dayPlans puede tener dia1, dia2, dia3…
    const keys = Object.keys(plan).filter(k => k.startsWith('dia')).sort();
    days = keys.map((k, di) => ({
      label:  `Día ${di + 1}`,
      places: (plan[k] || []).map(p => ({
        time:  p.time  || _autoTime(di),
        name:  p.place || p.name || '—',
        cat:   p.cat   || '',
        desc:  p.desc  || ''
      }))
    }));
  }

  // ── Colores ──────────────────────────────────────────────────
  const TERRA_D = [139,  58,  31];
  const TERRA   = [184,  92,  56];
  const TERRA_L = [212, 132,  90];
  const CREAM   = [253, 251, 247];
  const SAND    = [247, 243, 236];
  const SAND_D  = [237, 230, 216];
  const INK     = [ 42,  33,  24];
  const INK_M   = [107,  92,  78];
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
  doc.text('TURISMO  ✦  turismo.jcyl.es', W / 2, 16, { align: 'center' });

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
  const CAT_EMOJI = {
    monumento:'🏰', museo:'🏛️', naturaleza:'🌿', gastronomia:'🍷',
    alojamiento:'🏨', bar:'🍺', teatro:'🎭', cine:'🎬',
    exposicion:'🖼️', biblioteca:'📚', historia:'⚔️', cultura:'🎨'
  };

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
      if (y + ROW > 278) {
        doc.addPage(); initPage(); y = 20;
        fillRR(ML, y, CW, 9, 2, TERRA);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(...WHITE);
        doc.text(`${day.label.toUpperCase()} (cont.)`, W / 2, y + 6, { align: 'center' });
        y += 14;
      }

      // Fondo fila alternante
      fillRR(ML, y, CW, ROW, 1.5, i % 2 === 0 ? SAND : WHITE);

      // Acento izquierdo
      doc.setFillColor(...TERRA_L);
      doc.rect(ML, y, 2.5, ROW, 'F');

      // Badge hora
      fillRR(ML + 5, y + 3.5, 22, 6.5, 1.5, TERRA_D);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...WHITE);
      doc.text(item.time, ML + 16, y + 8, { align: 'center' });

      // Emoji
      const emoji = CAT_EMOJI[item.cat] || '📍';
      doc.setFontSize(9);
      doc.text(emoji, ML + 30, y + 8);

      // Nombre del lugar
      const nameX = ML + 40;
      const nameW = CW - 40 - 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...INK);
      doc.text(doc.splitTextToSize(item.name, nameW)[0], nameX, y + 7.5);

      // Descripción
      if (item.desc) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...INK_M);
        doc.text(doc.splitTextToSize(item.desc, nameW)[0], nameX, y + 13.5);
      }

      y += ROW + 1;
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
  showToast('📄 PDF descargado');
}

function _autoTime(i) {
  const mins = 600 + i * 90;
  return `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;
}
