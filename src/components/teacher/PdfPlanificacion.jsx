import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePlanificacionPDF = async (plan, user) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const PRIMARY_COLOR = [125, 15, 21]; // El guinda de tu app

  // --- Cargar Logo ---
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

  // --- Encabezado ---
  autoTable(doc, {
    startY: 10,
    theme: 'plain',
    body: [
      [
        { content: '', rowSpan: 3, styles: { cellWidth: 25 } },
        { 
          content: (user?.institution?.name || 'INSTITUCIÓN EDUCATIVA').toUpperCase(), 
          styles: { fontSize: 14, fontStyle: 'bold', textColor: PRIMARY_COLOR } 
        }
      ],
      [
        { content: 'PLANIFICACIÓN PEDAGÓGICA SEMANAL', styles: { fontSize: 11, fontStyle: 'bold' } }
      ],
      [
        { 
          content: `Docente: ${plan.profesor?.firstName || user?.firstName} ${plan.profesor?.lastName || user?.lastName}  |  Grado: ${plan.grado}`, 
          styles: { fontSize: 9 } 
        }
      ]
    ],
    didDrawCell: (data) => {
      if (data.column.index === 0 && logo) {
        doc.addImage(logo, 'PNG', data.cell.x, data.cell.y, 22, 22);
      }
    }
  });

  // --- Info de la Semana ---
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  const fechaStr = `Periodo: ${new Date(plan.fechaInicio).toLocaleDateString()} al ${new Date(plan.fechaFin).toLocaleDateString()}`;
  doc.text(fechaStr, 14, doc.lastAutoTable.finalY + 5);

  let currentY = doc.lastAutoTable.finalY + 10;

  // --- Renderizar cada Día ---
  plan.dias.forEach((dia) => {
    // Si no hay materias en este día, podrías saltarlo o mostrarlo vacío
    if (dia.materias.length === 0) return;

    // Título del Día
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text(dia.nombreDia.toUpperCase(), 14, currentY);
    
    const tableData = dia.materias.map(m => [
      m.asignatura,
      m.tema,
      m.guiaDocente || '-',
      m.cuadernilloEstudiante || '-',
      m.instrumentoEvaluacion
    ]);

    autoTable(doc, {
      startY: currentY + 2,
      head: [['ASIGNATURA', 'TEMA / CAPACIDAD', 'GUÍA', 'CUAD.', 'EVALUACIÓN']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [80, 80, 80], halign: 'center' },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 30 }
      },
      margin: { left: 14, right: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 10;

    // Control de salto de página manual si el siguiente día no cabe
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
  });

  // --- Observaciones de Dirección (Si existen) ---
  if (plan.observacionesGenerales) {
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0);
    doc.text("OBSERVACIONES DE DIRECCIÓN:", 14, currentY);
    doc.setFont(undefined, 'normal');
    const splitObs = doc.splitTextToSize(plan.observacionesGenerales, 180);
    doc.text(splitObs, 14, currentY + 5);
    currentY += (splitObs.length * 5) + 15;
  }

  // --- Firmas ---
  const pageHeight = doc.internal.pageSize.height;
  if (currentY + 30 > pageHeight) {
    doc.addPage();
    currentY = 30;
  }

  doc.line(40, currentY + 15, 90, currentY + 15);
  doc.line(120, currentY + 15, 170, currentY + 15);
  doc.setFontSize(8);
  doc.text("Firma del Docente", 65, currentY + 20, { align: "center" });
  doc.text("Dirección Académica", 145, currentY + 20, { align: "center" });

  doc.save(`Planificacion_${plan.grado.replace(/\s+/g, '_')}_${new Date(plan.fechaInicio).toLocaleDateString().replace(/\//g, '-')}.pdf`);
};