import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateTaskPDF = async (taskInfo, submissions, user) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const PRIMARY_COLOR = [125, 15, 21];
  const isRSA = taskInfo?.instrumentType === 'rsa';
  const isRubrica = taskInfo?.instrumentType === 'rubrica';

  // --- 1. TÍTULOS ---
  const instrumentTitles = {
    'rsa': 'PLANILLA DE REGISTRO DE SECUENCIA DE APRENDIZAJE (RSA)',
    'rubrica': 'PLANILLA DE RÚBRICA DE EVALUACIÓN',
    'lista_cotejo': 'PLANILLA DE LISTA DE COTEJO',
    'default': 'PLANILLA DE REGISTRO PEDAGÓGICO'
  };
  const currentTitle = instrumentTitles[taskInfo?.instrumentType] || instrumentTitles.default;

  // --- 2. LÓGICA RSA ---
  const calculateRSAFinal = (m1, m2, m3) => {
    const check = (v) => v === 1 ? "L" : "ANL";
    const [g, h, i] = [check(m1), check(m2), check(m3)];
    if (g === "L" && h === "L" && i === "L") return "L";
    if (g === "ANL" && h === "L" && i === "L") return "L";
    if (g === "ANL" && h === "ANL" && i === "L") return "L";
    if (g === "L" && h === "ANL" && i === "L") return "L";
    return "ANL";
  };

  // --- 3. CARGAR LOGO ---
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

  // --- 4. ENCABEZADO INSTITUCIONAL ---
  autoTable(doc, {
    startY: 10,
    theme: 'plain',
    styles: { cellPadding: 1 },
    columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 160 }, 2: { halign: 'right' } },
    body: [
      [
        { content: '', rowSpan: 3 },
        { content: (user?.institution?.name || 'INSTITUCIÓN EDUCATIVA').toUpperCase(), styles: { fontSize: 14, fontStyle: 'bold', textColor: PRIMARY_COLOR } },
        { content: `Fecha: ${new Date().toLocaleDateString()}`, styles: { fontSize: 8, textColor: [100, 100, 100] } }
      ],
      [
        { content: currentTitle, styles: { fontSize: 11, fontStyle: 'bold' } },
        { content: `Tema: ${taskInfo?.topic || 'N/A'}`, styles: { fontSize: 8 } }
      ],
      [
        { content: `Docente: ${user?.firstName || ''} ${user?.lastName || ''}  |  Grado: ${taskInfo?.grade || 'N/A'}  |  Materia: ${taskInfo?.subject || 'General'}`, styles: { fontSize: 9 } },
        { content: '', styles: { fontSize: 8 } }
      ]
    ],
    didDrawCell: (data) => {
      if (data.column.index === 0 && logo) {
        doc.addImage(logo, 'PNG', data.cell.x, data.cell.y, 22, 22);
      }
    }
  });

  let currentY = doc.lastAutoTable.finalY + 5;

  // --- 5. CUADRO DE REFERENCIA DE DESCRIPTORES (Solo para Rúbrica) ---
  if (isRubrica && taskInfo.rubricCriteria?.length > 0) {
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text("REFERENCIA DE CRITERIOS Y DESCRIPTORES:", 14, currentY);
    
    const referenceRows = [];
    taskInfo.rubricCriteria.forEach(crit => {
      crit.levels.forEach((lvl, idx) => {
        referenceRows.push([
          idx === 0 ? crit.criterion.toUpperCase() : '', // Solo pone el nombre del criterio en la primera fila del grupo
          lvl.level.toUpperCase(),
          lvl.points,
          lvl.descriptor
        ]);
      });
    });

    autoTable(doc, {
      startY: currentY + 2,
      head: [['CRITERIO', 'NIVEL', 'PTS', 'DESCRIPTOR']],
      body: referenceRows,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1 },
      headStyles: { fillColor: [80, 80, 80] },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 25 },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 'auto' }
      }
    });
    
    currentY = doc.lastAutoTable.finalY + 8;
  }

  // --- 6. ESTRUCTURA DE LA TABLA DE CALIFICACIONES ---
  const criteria = isRubrica ? (taskInfo?.rubricCriteria || []) : (taskInfo?.indicators || []);
  
  let headerRow1 = [
    { content: 'N°', rowSpan: isRSA ? 2 : 1 },
    { content: 'ESTUDIANTE', rowSpan: isRSA ? 2 : 1 }
  ];
  let headerRow2 = [];

  criteria.forEach((item) => {
    const title = isRubrica ? item.criterion : (item.name || item.description);
    if (isRSA) {
      headerRow1.push({ content: title, colSpan: 4, styles: { halign: 'center', fontSize: 7 } });
      headerRow2.push({ content: '1°O' }, { content: '2°O' }, { content: '3°O' }, { content: 'R' });
    } else {
      headerRow1.push({ content: title.toUpperCase(), styles: { halign: 'center', fontSize: 7 } });
    }
  });

  headerRow1.push({ content: isRSA ? 'TOTAL L' : 'PUNTOS', rowSpan: isRSA ? 2 : 1 });
  headerRow1.push({ content: 'OBSERVACIONES', rowSpan: isRSA ? 2 : 1 });

  // --- 7. PROCESAMIENTO DE FILAS ---
  const tableRows = submissions.map((sub, index) => {
    const row = [index + 1, `${sub.student.lastName.toUpperCase()}, ${sub.student.firstName}`];
    let totalL = 0;

    criteria.forEach(crit => {
      const score = sub.indicatorScores?.find(s => (s.indicatorId?._id || s.indicatorId) === crit._id);
      
      if (isRSA) {
        const getPts = (m) => {
          const s = sub.indicatorScores?.find(is => (is.indicatorId?._id || is.indicatorId) === crit._id && is.moment === m);
          return s ? s.points : 0;
        };
        const m1 = getPts(1), m2 = getPts(2), m3 = getPts(3);
        const res = calculateRSAFinal(m1, m2, m3);
        row.push(m1 === 1 ? 'L' : 'ANL', m2 === 1 ? 'L' : 'ANL', m3 === 1 ? 'L' : 'ANL', res);
        if (res === 'L') totalL++;
      } else {
        // Para Rúbrica o Lista de Cotejo, mostramos el valor directo
        const p = score ? score.points : 0;
        if (isRubrica) {
          row.push(p);
        } else {
          row.push(p === 1 ? 'L' : 'ANL');
          if (p === 1) totalL++;
        }
      }
    });

    row.push(isRSA ? totalL : sub.score);
    row.push(sub.comments || '');
    return row;
  });

  // --- 8. RENDERIZADO FINAL ---
  autoTable(doc, {
    startY: currentY,
    head: isRSA ? [headerRow1, headerRow2] : [headerRow1],
    body: tableRows,
    theme: 'grid',
    styles: { 
      fontSize: 7, 
      halign: 'center', 
      valign: 'middle',
      cellPadding: 1 
    },
    headStyles: { 
      fillColor: PRIMARY_COLOR, 
      textColor: [255, 255, 255], 
      fontStyle: 'bold'
    },
    columnStyles: { 
      1: { halign: 'left', cellWidth: 50 } 
    }
  });

  // --- 9. FIRMAS ---
  const finalY = doc.lastAutoTable.finalY + 15;
  const pageHeight = doc.internal.pageSize.height;
  if (finalY + 20 < pageHeight) {
    doc.line(60, finalY + 10, 120, finalY + 10);
    doc.line(170, finalY + 10, 230, finalY + 10);
    doc.setFontSize(8);
    doc.text("Firma del Docente", 90, finalY + 15, { align: "center" });
    doc.text("Dirección Académica", 200, finalY + 15, { align: "center" });
  }

  doc.save(`Reporte_${taskInfo?.topic?.replace(/\s+/g, '_') || 'Tarea'}.pdf`);
};