import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePlanificacionPDF = async (plan, user) => {
  const doc = new jsPDF({
    orientation: 'portrait', // 🔹 Regresamos a vertical
    unit: 'mm',
    format: 'a4'
  });

  const PRIMARY_COLOR = [125, 15, 21];
  const now = new Date().toLocaleString();
  const generadoPor = `${user?.firstName || ''} ${user?.lastName || ''}`;

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

  // --- Metadatos de generación (Arriba a la derecha, muy pequeño) ---
  doc.setFontSize(6);
  doc.setTextColor(150);
  doc.text(`Generado el: ${now} | Por: ${generadoPor}`, doc.internal.pageSize.width - 14, 7, { align: 'right' });

  // --- Encabezado ---
  autoTable(doc, {
    startY: 10,
    theme: 'plain',
    body: [
      [
        { content: '', rowSpan: 3, styles: { cellWidth: 22 } },
        { 
          content: (user?.institution?.name || 'INSTITUCIÓN EDUCATIVA').toUpperCase(), 
          styles: { fontSize: 12, fontStyle: 'bold', textColor: PRIMARY_COLOR } 
        }
      ],
      [
        { content: 'PLANIFICACIÓN PEDAGÓGICA SEMANAL', styles: { fontSize: 10, fontStyle: 'bold' } }
      ],
      [
        { 
          content: `Docente: ${plan.profesor?.firstName || user?.firstName} ${plan.profesor?.lastName || user?.lastName}  |  Grado: ${plan.grado}`, 
          styles: { fontSize: 8 } 
        }
      ]
    ],
    didDrawCell: (data) => {
      if (data.column.index === 0 && logo) {
        doc.addImage(logo, 'PNG', data.cell.x, data.cell.y, 18, 18);
      }
    }
  });

  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  const fechaStr = `Periodo: ${new Date(plan.fechaInicio).toLocaleDateString()} al ${new Date(plan.fechaFin).toLocaleDateString()}`;
  doc.text(fechaStr, 14, doc.lastAutoTable.finalY + 5);

  let currentY = doc.lastAutoTable.finalY + 10;

  // --- Renderizar cada Día ---
  plan.dias.forEach((dia) => {
    if (dia.materias.length === 0) return;

    // Control de salto de página
    if (currentY > 240) { doc.addPage(); currentY = 20; }

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text(dia.nombreDia.toUpperCase(), 14, currentY);
    
    const tableData = dia.materias.map(m => [
      m.asignatura,
      m.unidadTematica || '-',
      m.tema,
      m.guiaDocente || '-',
      m.cuadernilloEstudiante || '-',
      m.instrumentoEvaluacion
    ]);

    autoTable(doc, {
      startY: currentY + 2,
      head: [['ASIGNATURA', 'U. TEMÁTICA', 'TEMA', 'GUÍA', 'CUAD.', 'EVALUACIÓN']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
      headStyles: { fillColor: [80, 80, 80], halign: 'center', fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 30, fontStyle: 'bold' }, // Asignatura
        1: { cellWidth: 30 },                    // Unidad Temática
        2: { cellWidth: 'auto' },                // Tema (se expande)
        3: { cellWidth: 10, halign: 'center' },  // Guía
        4: { cellWidth: 10, halign: 'center' },  // Cuad.
        5: { cellWidth: 25 }                     // Evaluación
      },
      margin: { left: 14, right: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 10;
  });

  // --- Observaciones de Dirección ---
  if (plan.observacionesGenerales) {
    if (currentY > 250) { doc.addPage(); currentY = 20; }
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0);
    doc.text("OBSERVACIONES DE DIRECCIÓN:", 14, currentY);
    doc.setFont(undefined, 'normal');
    const splitObs = doc.splitTextToSize(plan.observacionesGenerales, 180);
    doc.text(splitObs, 14, currentY + 4);
    currentY += (splitObs.length * 4) + 10;
  }

  // --- Firmas ---
  const pageHeight = doc.internal.pageSize.height;
  if (currentY + 35 > pageHeight) {
    doc.addPage();
    currentY = 25;
  }

  const midX = doc.internal.pageSize.width / 2;
  doc.line(30, currentY + 15, 85, currentY + 15);      // Firma Docente
  doc.line(125, currentY + 15, 180, currentY + 15);   // Firma Dirección
  
  doc.setFontSize(8);
  doc.text("Firma del Docente", 57.5, currentY + 20, { align: "center" });
  doc.text("Dirección Académica", 152.5, currentY + 20, { align: "center" });

  doc.save(`Planificacion_${plan.grado.replace(/\s+/g, '_')}_${new Date(plan.fechaInicio).toLocaleDateString().replace(/\//g, '-')}.pdf`);
};