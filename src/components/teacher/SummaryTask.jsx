import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateSummaryPDF = async (summaryData, user, filterGrade) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const PRIMARY_COLOR = [125, 15, 21];
  const ALERT_COLOR = [220, 38, 38]; // Rojo para alertas

  const loadImage = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.crossOrigin = "Anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });
  };

  const logo = await loadImage('/logo.png');

  // --- 1. ENCABEZADO ---
  autoTable(doc, {
    startY: 10,
    theme: 'plain',
    body: [
      [
        { content: '', rowSpan: 3, styles: { cellWidth: 25 } },
        { content: (user?.institution?.name || 'AULA CONECTA PY').toUpperCase(), styles: { fontSize: 14, fontStyle: 'bold', textColor: PRIMARY_COLOR } },
        { content: `Fecha: ${new Date().toLocaleDateString()}`, styles: { fontSize: 8, halign: 'right' } }
      ],
      [
        { content: 'RESUMEN ACADÉMICO GLOBAL Y ALERTAS', styles: { fontSize: 11, fontStyle: 'bold' } },
        { content: `Grado: ${filterGrade === 'all' ? 'Todos los Grados' : filterGrade}`, styles: { fontSize: 8, halign: 'right' } }
      ]
    ],
    didDrawCell: (data) => {
      if (data.column.index === 0 && logo) {
        doc.addImage(logo, 'PNG', data.cell.x, data.cell.y, 20, 20);
      }
    }
  });

  // --- 2. TABLA PRINCIPAL DE PUNTAJES ---
  const tableRows = summaryData.map((row, index) => [
    index + 1,
    `${row.lastName?.toUpperCase()}, ${row.firstName}`,
    row.corregidas || 0,
    row.pendientes || 0,
    `${row.listaCotejoLogrado || 0} pts`,
    `${row.rubricaLogrado || 0} pts`,
    `${row.rsaLogrado || 0} pts`,
    `${row.puntosGlobalLogrado || 0} pts`
  ]);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 5,
    head: [['N°', 'ESTUDIANTE', 'CORR.', 'PEND.', 'L. COTEJO', 'RÚBRICA', 'RSA', 'TOTAL']],
    body: tableRows,
    theme: 'grid',
    styles: { fontSize: 8, halign: 'center' },
    headStyles: { fillColor: PRIMARY_COLOR },
    columnStyles: { 1: { halign: 'left', cellWidth: 70 }, 7: { fontStyle: 'bold' } }
  });

  // --- 3. SECCIÓN DE ALERTAS (Pendientes) ---
  const studentsWithPending = summaryData.filter(s => s.pendientes > 0);
  
  if (studentsWithPending.length > 0) {
    const currentY = doc.lastAutoTable.finalY + 10;
    
    // Verificar si hay espacio en la página, si no, crear nueva
    if (currentY > 160) doc.addPage();

    doc.setFontSize(10);
    doc.setTextColor(ALERT_COLOR[0], ALERT_COLOR[1], ALERT_COLOR[2]);
    doc.setFont(undefined, 'bold');
    doc.text("⚠️ ESTUDIANTES CON TAREAS PENDIENTES DE ENTREGA/CORRECCIÓN:", 14, doc.lastAutoTable.finalY + 10);

    const pendingRows = studentsWithPending.map(s => [
      `${s.lastName?.toUpperCase()}, ${s.firstName}`,
      s.pendientes,
      "Requiere seguimiento"
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12,
      head: [['ESTUDIANTE', 'CANTIDAD PENDIENTE', 'ESTADO']],
      body: pendingRows,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: ALERT_COLOR },
      columnStyles: { 0: { cellWidth: 80 } }
    });
  }

  // --- 4. FIRMAS ---
  const finalY = doc.lastAutoTable.finalY + 20;
  doc.line(60, finalY, 120, finalY);
  doc.line(170, finalY, 230, finalY);
  doc.setFontSize(8);
  doc.setTextColor(0);
  doc.text("Firma del Docente", 90, finalY + 5, { align: "center" });
  doc.text("Secretaría Académica", 200, finalY + 5, { align: "center" });

  doc.save(`Resumen_Faltantes_${filterGrade}.pdf`);
};