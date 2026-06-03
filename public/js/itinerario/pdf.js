function downloadItinerarioPDF() {
  const province = appState.selectedProvince || 'Castilla y León';
  const plan = dayPlans[province];
  if (!plan) { showToast('⚠️ No hay itinerario para esta provincia'); return; }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const gold = [201, 168, 76];
  const dark = [26, 18, 9];
  const parch = [245, 237, 216];
  const W = 210;
  const margin = 18;

  // ── Background ──
  doc.setFillColor(...dark);
  doc.rect(0, 0, W, 297, 'F');

  // ── Gold top bar ──
  doc.setFillColor(...gold);
  doc.rect(0, 0, W, 28, 'F');

  // ── Header text ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...dark);
  doc.text('CASTILLA Y LEÓN', W / 2, 12, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('✦ Tierra de Historia ✦', W / 2, 19, { align: 'center' });

  // ── Title ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...gold);
  doc.text('Un fin de semana en', W / 2, 42, { align: 'center' });
  doc.setFontSize(28);
  doc.text(province, W / 2, 54, { align: 'center' });

  // ── Subtitle line ──
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.4);
  doc.line(margin, 60, W - margin, 60);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...parch);
  const today = new Date().toLocaleDateString('es-ES', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  doc.text(`Itinerario generado el ${today}`, W / 2, 67, { align: 'center' });

  // ── Days ──
  let y = 78;
  const days = [
    { label: 'Sábado — Día 1', items: plan.dia1, emoji: '🌅' },
    { label: 'Domingo — Día 2', items: plan.dia2, emoji: '🌄' }
  ];

  days.forEach((day, di) => {
    // Day header pill
    doc.setFillColor(...gold);
    doc.roundedRect(margin, y, W - margin * 2, 9, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...dark);
    doc.text(day.label.toUpperCase(), W / 2, y + 6.2, { align: 'center' });
    y += 14;

    day.items.forEach((item, i) => {
      // Alternating row bg
      if (i % 2 === 0) {
        doc.setFillColor(40, 28, 12);
        doc.roundedRect(margin, y - 1, W - margin * 2, 16, 1, 1, 'F');
      }

      // Time badge
      doc.setFillColor(...gold);
      doc.roundedRect(margin + 2, y + 1.5, 22, 7, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...dark);
      doc.text(item.time, margin + 13, y + 6.5, { align: 'center' });

      // Place name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...gold);
      doc.text(item.place, margin + 28, y + 5.5);

      // Description
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(180, 165, 130);
      const descLines = doc.splitTextToSize(item.desc, W - margin * 2 - 30);
      doc.text(descLines[0], margin + 28, y + 11);

      y += 17;

      // Page break safety
      if (y > 260 && !(di === days.length - 1 && i === day.items.length - 1)) {
        doc.addPage();
        doc.setFillColor(...dark);
        doc.rect(0, 0, W, 297, 'F');
        y = 20;
      }
    });
    y += 8;
  });

  // ── Footer ──
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.3);
  doc.line(margin, 280, W - margin, 280);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...gold);
  doc.text('Castilla y León Turismo  ·  turismo.jcyl.es  ·  Itinerario curado por expertos locales', W / 2, 286, { align: 'center' });

  doc.save(`Itinerario_${province.replace(/[^a-zA-Z0-9]/g,'_')}_fin_de_semana.pdf`);
  showToast('📄 PDF descargado');
}

// ══════════════════════════════════════════════════════


// ============================================================
// FAVORITOS
// ============================================================
