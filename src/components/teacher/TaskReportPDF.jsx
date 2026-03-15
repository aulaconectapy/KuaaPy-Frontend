import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Genera un reporte PDF de la tarea con los indicadores y puntajes.
 * @param {Object} taskInfo - Información general de la tarea.
 * @param {Array} submissions - Lista de entregas de los alumnos.
 * @param {Object} user - Datos del docente (firstName, lastName).
 */
export const generateTaskPDF = async (taskInfo, submissions, user) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const PRIMARY_COLOR = [125, 15, 21]; // #7D0F15

  // --- 1. CARGAR LOGO ---
  const loadImage = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null); // Si falla, sigue sin logo
    });
  };

  const logo = await loadImage('/logo.png');

  // --- 2. ENCABEZADO ---
  if (logo) {
    doc.addImage(logo, 'PNG', 14, 10, 22, 22);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.text("REGISTRO PEDAGÓGICO DE EVALUACIÓN", 42, 18);
  
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(`Institución: ${user?.institution?.name || 'N/A'}`, 42, 25);
  doc.text(`Docente: ${user?.firstName || ''} ${user?.lastName || ''}`, 42, 30);

  // Datos a la derecha
  doc.setFont("helvetica", "normal");
  doc.text(`Materia: ${taskInfo?.subject || 'N/A'}`, 210, 20);
  doc.text(`Tema: ${taskInfo?.topic || 'N/A'}`, 210, 25);
  doc.text(`Grado: ${taskInfo?.grade || 'N/A'}`, 210, 30);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 210, 35);

  // --- 3. TABLA DE CALIFICACIONES ---
  const indicators = taskInfo?.indicators || [];
  
  // Definir encabezados
  const tableHeaders = [
    { content: 'N°', styles: { halign: 'center' } },
    { content: 'Apellidos y Nombres', styles: { halign: 'left' } },
    ...indicators.map(ind => ({ 
      content: ind.description || ind.name, 
      styles: { halign: 'center' } 
    })),
    { content: 'Total', styles: { halign: 'center' } },
    { content: 'Observaciones', styles: { halign: 'left' } }
  ];

  // Definir filas
  const tableRows = submissions.map((sub, index) => {
    const row = [
      index + 1,
      `${sub.student.lastName.toUpperCase()}, ${sub.student.firstName}`
    ];

    indicators.forEach(indicator => {
      const scoreObj = sub.indicatorScores?.find(s => 
        (s.indicatorId?._id || s.indicatorId) === indicator._id
      );
      row.push(scoreObj ? scoreObj.points : '0');
    });

    row.push(sub.score || '0');
    row.push(sub.comments || ''); 

    return row;
  });

  // USAMOS autoTable COMO FUNCIÓN (esto soluciona el error)
  autoTable(doc, {
    startY: 42,
    head: [tableHeaders],
    body: tableRows,
    theme: 'grid',
    styles: { 
      fontSize: 8, 
      cellPadding: 2,
      valign: 'middle'
    },
    headStyles: {
      fillColor: PRIMARY_COLOR,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 60, fontStyle: 'bold' },
      // La columna de total es la penúltima
      [tableHeaders.length - 2]: { cellWidth: 15, fontStyle: 'bold' },
      // La columna de observaciones es la última
      [tableHeaders.length - 1]: { cellWidth: 'auto' }
    },
    margin: { left: 14, right: 14 },
    didParseCell: function (data) {
      // Centrar notas de indicadores
      if (data.column.index > 1 && data.column.index < (tableHeaders.length - 1)) {
        data.cell.styles.halign = 'center';
      }
    }
  });

  // --- 4. FIRMA ---
  const finalY = doc.lastAutoTable.finalY + 25;
  doc.setDrawColor(150);
  doc.line(110, finalY, 190, finalY); 
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("Firma y Sello del Docente", 150, finalY + 5, { align: "center" });

  // --- 5. DESCARGAR ---
  doc.save(`Planilla_${taskInfo?.topic || 'Evaluacion'}.pdf`);
};
