import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = {
  primary: [125, 15, 21],
  text: [31, 41, 55],
  lightGrey: [248, 250, 252],
  secondary: [100, 116, 139]
};

// Función auxiliar para cargar el logo (misma lógica que usas en tareas)
const loadImage = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
  });
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('es-PY', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

// ==========================================
// FUNCIÓN DE ENCABEZADO INSTITUCIONAL ÚNICO
// ==========================================
const drawInstitutionalHeader = async (doc, title, subtitle, user, reportData) => {
  const logo = await loadImage('/logo.png');
  
  const docenteNombre = `${user?.firstName || ''} ${user?.lastName || ''}`;
  const grado = reportData?.grade || 'N/A';

  autoTable(doc, {
    startY: 10,
    theme: 'plain',
    styles: { cellPadding: 1 },
    columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 120 }, 2: { halign: 'right' } },
    body: [
      [
        { content: '', rowSpan: 3 },
        { content: (user?.institution?.name || 'INSTITUCIÓN EDUCATIVA').toUpperCase(), styles: { fontSize: 14, fontStyle: 'bold', textColor: COLORS.primary } },
        { content: `Fecha Impresión: ${new Date().toLocaleDateString()}`, styles: { fontSize: 8, textColor: [100, 100, 100] } }
      ],
      [
        { content: title, styles: { fontSize: 11, fontStyle: 'bold' } },
        { content: subtitle, styles: { fontSize: 8 } }
      ],
      [
        { content: `Docente: ${docenteNombre}  |  Grado: ${grado}`, styles: { fontSize: 9 } },
        { content: '', styles: { fontSize: 8 } }
      ]
    ],
    didDrawCell: (data) => {
      if (data.column.index === 0 && logo) {
        doc.addImage(logo, 'PNG', data.cell.x, data.cell.y, 22, 22);
      }
    }
  });
  return doc.lastAutoTable.finalY + 10;
};
// ==========================================
// 1. REPORTE INDIVIDUAL (ACTA ÚNICA)
// ==========================================
export const generateIndividualPDF = async (report, user) => {
  const doc = new jsPDF();
  const studentName = `${report.student?.firstName || ''} ${report.student?.lastName || ''}`;

  const currentY = await drawInstitutionalHeader(
    doc, 
    "REPORTE DISCIPLINARIO INDIVIDUAL", 
    `Estudiante: ${studentName}`, 
    user, 
    report
  );

  autoTable(doc, {
    startY: currentY,
    head: [['FECHA DEL HECHO', 'GRAVEDAD', 'ESTADO']],
    body: [[formatDate(report.date), report.severity, report.status]],
    headStyles: { fillColor: COLORS.secondary },
    theme: 'grid'
  });

  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setFont("helvetica", "bold");
  doc.text("TIPO DE FALTA:", 14, doc.lastAutoTable.finalY + 10);
  doc.setTextColor(0, 0, 0);
  doc.text(report.faultType || "No especificado", 48, doc.lastAutoTable.finalY + 10);

  doc.text("DESCRIPCIÓN DE LOS HECHOS:", 14, doc.lastAutoTable.finalY + 20);
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 22,
    body: [[report.description || "Sin descripción detallada."]],
    styles: { fillColor: COLORS.lightGrey, fontStyle: 'normal' },
    margin: { left: 14, right: 14 }
  });

  doc.setFont("helvetica", "bold");
  doc.text("ACCIÓN TOMADA:", 14, doc.lastAutoTable.finalY + 10);
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 12,
    body: [[report.actionTaken || "No registrada."]],
    styles: { fillColor: COLORS.lightGrey, fontStyle: 'normal' },
    margin: { left: 14, right: 14 }
  });

  const footerY = 270;
  doc.line(20, footerY, 80, footerY);
  doc.text("Firma Docente", 35, footerY + 5);
  doc.line(130, footerY, 190, footerY);
  doc.text("Firma Padre/Tutor", 145, footerY + 5);

  doc.save(`Reporte_${studentName.replace(/\s+/g, '_')}.pdf`);
};

// ==========================================
// 2. REPORTE GENERAL (TABLA RESUMEN)
// ==========================================
export const generateGeneralPDF = async (reports, user, filterName = "") => {
  const doc = new jsPDF('landscape');
  
  // Aquí pasamos el grado "Múltiples" si es general
  const currentY = await drawInstitutionalHeader(
    doc, 
    "RESUMEN DISCIPLINARIO GENERAL", 
    filterName ? `Filtro: ${filterName}` : "Todos los registros", 
    user, 
    { grade: 'Múltiples' } 
  );

  autoTable(doc, {
    startY: currentY,
    head: [['Estudiante', 'Grado', 'Fecha', 'Falta', 'Gravedad', 'Estado']],
    body: reports.map(r => [
      `${r.student?.lastName || ''}, ${r.student?.firstName || ''}`, 
      r.grade || 'N/A', 
      formatDate(r.date), 
      r.faultType || 'N/A', 
      r.severity || 'N/A', 
      r.status || 'N/A'
    ]),
    headStyles: { fillColor: COLORS.primary },
    styles: { fontSize: 8 }
  });

  doc.save("Resumen_Disciplinario.pdf");
};

// ==========================================
// 3. EXPEDIENTE COMPLETO (HISTORIAL DETALLADO)
// ==========================================
// ==========================================
// 3. EXPEDIENTE COMPLETO (HISTORIAL DETALLADO)
// ==========================================
export const generateFullStudentHistoryPDF = async (allReports, student, user) => {
  const doc = new jsPDF();
  const studentFullName = `${student?.lastName || ''}, ${student?.firstName || ''}`;
  
  // Título y Subtítulo para el encabezado
  const title = "EXPEDIENTE DISCIPLINARIO ACUMULATIVO";
  const subtitle = `Historial Completo: ${studentFullName}`;

  // Primera página: Dibujamos el encabezado institucional
  let currentY = await drawInstitutionalHeader(
    doc, 
    title, 
    subtitle, 
    user, 
    allReports[0] // Grado del reporte más reciente
  );

  // Ordenar reportes por fecha (más recientes primero)
  const sortedReports = [...allReports].sort((a, b) => new Date(b.date) - new Date(a.date));

  for (let index = 0; index < sortedReports.length; index++) {
    const report = sortedReports[index];

    // Control de salto de página: si el contenido va a superar el margen inferior (aprox 250)
    if (currentY > 230) {
      doc.addPage();
      // En la nueva página, reiniciamos el encabezado institucional para mantener la formalidad
      currentY = await drawInstitutionalHeader(doc, title, subtitle, user, allReports[0]);
    }

    // Dibujar franja gris de título de incidente
    doc.setFillColor(245, 245, 245);
    doc.rect(14, currentY, 182, 8, 'F');
    
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(
      `INCIDENTE #${sortedReports.length - index} - FECHA: ${formatDate(report.date)}`, 
      18, 
      currentY + 6
    );
    
    currentY += 14;
    
    // Detalles del reporte
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Falta: ${report.faultType || 'N/A'}`, 14, currentY);
    doc.text(`Gravedad: ${report.severity || 'N/A'}`, 100, currentY);
    
    currentY += 7;
    
    // Descripción con ajuste de texto (Multi-línea)
    doc.setFont("helvetica", "normal");
    const descLines = doc.splitTextToSize(`Descripción: ${report.description || 'Sin descripción detallada.'}`, 175);
    doc.text(descLines, 14, currentY);
    
    currentY += (descLines.length * 5) + 3;
    
    // Acción tomada con ajuste de texto (Multi-línea)
    const actionLines = doc.splitTextToSize(`Acción: ${report.actionTaken || 'No registrada.'}`, 175);
    doc.text(actionLines, 14, currentY);
    
    // Espaciado y línea divisoria final de incidente
    currentY += (actionLines.length * 5) + 8;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, currentY - 4, 196, currentY - 4);
    currentY += 5;
  }

  // Guardar archivo
  const fileName = `Expediente_${studentFullName.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};