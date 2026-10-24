import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PRIMARY_COLOR = [0, 56, 168]; // Azul institucional KuaaPy (#0038A8)
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

export const generateSummaryPDF = async (summaryData, user, filterGrade) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const now = new Date().toLocaleString();
  const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  const userRole = (user?.role || 'Docente').toUpperCase();
  const institutionName = user?.institution?.name || 'KuaaPy Institución';
  
  const logoUrl = user?.institution?.logoUrl || '/logo.png';
  const logo = await loadImage(logoUrl);

  // Metadatos arriba a la derecha
  doc.setFontSize(6);
  doc.setTextColor(150);
  doc.text(
    `Generado el: ${now} | Por: ${userName} (${userRole})`,
    doc.internal.pageSize.width - 14,
    7,
    { align: 'right' }
  );

  // --- 1. ENCABEZADO ---
  autoTable(doc, {
    startY: 10,
    theme: 'plain',
    body: [
      [
        { content: '', rowSpan: 3, styles: { cellWidth: 24 } },
        { content: institutionName.toUpperCase(), styles: { fontSize: 13, fontStyle: 'bold', textColor: PRIMARY_COLOR } },
        { content: `Fecha: ${new Date().toLocaleDateString()}`, styles: { fontSize: 8, halign: 'right' } }
      ],
      [
        { content: 'RESUMEN ACADÉMICO GLOBAL Y ALERTAS', styles: { fontSize: 10, fontStyle: 'bold' } },
        { content: `Grado: ${filterGrade === 'all' ? 'Todos los Grados' : filterGrade}`, styles: { fontSize: 8, halign: 'right' } }
      ],
      [
        { content: `Impreso por: ${userName} [${userRole}]`, styles: { fontSize: 8 } },
        { content: '', styles: { fontSize: 8 } }
      ]
    ],
    didDrawCell: (data) => {
      if (data.column.index === 0 && logo) {
        doc.addImage(logo, 'PNG', data.cell.x, data.cell.y, 20, 20);
      }
    }
  });

  // --- 2. TABLA PRINCIPAL DE PUNTAJES (Con Columna de Grado) ---
  const tableRows = summaryData.map((row, index) => [
    index + 1,
    `${row.lastName?.toUpperCase()}, ${row.firstName}`,
    row.grade || 'N/A',
    row.corregidas || 0,
    row.pendientes || 0,
    `${row.listaCotejoLogrado || 0} pts`,
    `${row.rubricaLogrado || 0} pts`,
    `${row.rsaLogrado || 0} pts`,
    `${row.puntosGlobalLogrado || 0} pts`
  ]);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    head: [['N°', 'ESTUDIANTE', 'GRADO', 'CORR.', 'PEND.', 'L. COTEJO', 'RÚBRICA', 'RSA', 'TOTAL']],
    body: tableRows,
    theme: 'grid',
    styles: { fontSize: 8, halign: 'center', valign: 'middle' },
    headStyles: { fillColor: PRIMARY_COLOR, textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 
      1: { halign: 'left', cellWidth: 65 }, 
      2: { cellWidth: 25 },
      8: { fontStyle: 'bold' } 
    }
  });

  // --- 3. SECCIÓN DE ALERTAS (Pendientes) ---
  const studentsWithPending = summaryData.filter(s => s.pendientes > 0);
  
  if (studentsWithPending.length > 0) {
    let currentY = doc.lastAutoTable.finalY + 10;
    
    if (currentY > 150) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(9);
    doc.setTextColor(ALERT_COLOR[0], ALERT_COLOR[1], ALERT_COLOR[2]);
    doc.setFont(undefined, 'bold');
    doc.text("⚠️ ESTUDIANTES CON TAREAS PENDIENTES DE ENTREGA/CORRECCIÓN:", 14, currentY);

    const pendingRows = studentsWithPending.map(s => [
      `${s.lastName?.toUpperCase()}, ${s.firstName}`,
      s.grade || 'N/A',
      s.pendientes,
      "Requiere seguimiento"
    ]);

    autoTable(doc, {
      startY: currentY + 4,
      head: [['ESTUDIANTE', 'GRADO', 'CANTIDAD PENDIENTE', 'ESTADO']],
      body: pendingRows,
      theme: 'striped',
      styles: { fontSize: 8, valign: 'middle' },
      headStyles: { fillColor: ALERT_COLOR, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 
        0: { cellWidth: 75 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'center' }
      }
    });
  }

  // --- 4. FIRMAS ---
  let finalY = doc.lastAutoTable.finalY + 20;
  if (finalY > 175) {
    doc.addPage();
    finalY = 30;
  }

  doc.line(60, finalY, 120, finalY);
  doc.line(170, finalY, 230, finalY);
  doc.setFontSize(8);
  doc.setTextColor(0);
  doc.text("Firma del Docente", 90, finalY + 5, { align: "center" });
  doc.text("Secretaría Académica", 200, finalY + 5, { align: "center" });

  doc.save(`Resumen_Academico_${filterGrade}.pdf`);
};