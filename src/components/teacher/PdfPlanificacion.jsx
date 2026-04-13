import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- FUNCIÓN 1: PARA DESCARGAR UNA SOLA SEMANA ---
export const generatePlanificacionPDF = async (plan, user) => {
  const doc = new jsPDF({
    orientation: 'portrait',
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

  // Metadatos arriba a la derecha
  doc.setFontSize(6);
  doc.setTextColor(150);
  doc.text(`Generado el: ${now} | Por: ${generadoPor}`, doc.internal.pageSize.width - 14, 7, { align: 'right' });

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

  plan.dias.forEach((dia) => {
    if (dia.materias.length === 0) return;
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
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [80, 80, 80], halign: 'center' },
      margin: { left: 14, right: 14 }
    });
    currentY = doc.lastAutoTable.finalY + 10;
  });

  const pageHeight = doc.internal.pageSize.height;
  if (currentY + 35 > pageHeight) { doc.addPage(); currentY = 25; }
  doc.line(30, currentY + 15, 85, currentY + 15);
  doc.line(125, currentY + 15, 180, currentY + 15);
  doc.text("Firma del Docente", 57.5, currentY + 20, { align: "center" });
  doc.text("Dirección Académica", 152.5, currentY + 20, { align: "center" });

  doc.save(`Planificacion_${plan.grado.replace(/\s+/g, '_')}_${new Date(plan.fechaInicio).toLocaleDateString().replace(/\//g, '-')}.pdf`);
};


// --- FUNCIÓN 2: PARA REPORTE ACUMULADO (CON METADATOS AÑADIDOS) ---
export const generateMassivePlanificacionPDF = async (planificaciones, user, rangoTexto = "") => {
  const doc = new jsPDF({
    orientation: 'portrait',
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

  for (let i = 0; i < planificaciones.length; i++) {
    const plan = planificaciones[i];
    if (i > 0) doc.addPage();

    // 🔹 AÑADIDO: Metadatos en cada página del reporte acumulado
    doc.setFontSize(6);
    doc.setTextColor(150);
    doc.text(`Generado el: ${now} | Por: ${generadoPor} | Pág: ${doc.internal.getNumberOfPages()}`, doc.internal.pageSize.width - 14, 7, { align: 'right' });

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
          { content: 'REPORTE ACUMULADO DE PLANIFICACIÓN', styles: { fontSize: 10, fontStyle: 'bold' } }
        ],
        [
          { 
            content: `Docente: ${user?.firstName} ${user?.lastName} | Grado: ${plan.grado} | Rango: ${rangoTexto}`, 
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

    let currentY = doc.lastAutoTable.finalY + 10;

    plan.dias.forEach((dia) => {
      if (dia.materias.length === 0) return;
      if (currentY > 240) { doc.addPage(); currentY = 20; }
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
      doc.text(dia.nombreDia.toUpperCase(), 14, currentY);
      
      const tableData = dia.materias.map(m => [
        m.asignatura, m.unidadTematica || '-', m.tema, m.guiaDocente || '-', m.cuadernilloEstudiante || '-', m.instrumentoEvaluacion
      ]);

      autoTable(doc, {
        startY: currentY + 2,
        head: [['ASIGNATURA', 'U. TEMÁTICA', 'TEMA', 'GUÍA', 'CUAD.', 'EVALUACIÓN']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [80, 80, 80], halign: 'center' },
        margin: { left: 14, right: 14 }
      });
      currentY = doc.lastAutoTable.finalY + 10;
    });

    if (currentY + 30 > 280) { doc.addPage(); currentY = 20; }
    doc.line(30, currentY + 15, 85, currentY + 15);
    doc.line(125, currentY + 15, 180, currentY + 15);
    doc.setFontSize(7);
    doc.text("Firma del Docente", 57.5, currentY + 20, { align: "center" });
    doc.text("Dirección Académica", 152.5, currentY + 20, { align: "center" });
  }

  doc.save(`Reporte_Acumulado_${new Date().getTime()}.pdf`);
};