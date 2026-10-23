import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PRIMARY_COLOR = [0, 56, 168]; // Azul institucional KuaaPy (#0038A8)

// Función auxiliar para cargar el logo institucional de forma dinámica
const loadImage = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
  });
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

// --- FUNCIÓN 1: PARA DESCARGAR UNA SOLA SEMANA ---
export const generatePlanificacionPDF = async (plan, user) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const now = new Date().toLocaleString();
  const generadoPor = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  const institutionName = user?.institution?.name || plan?.institution?.name || 'KuaaPy Institución';
  const logoUrl = user?.institution?.logoUrl || plan?.institution?.logoUrl || '/logo.png';
  const logo = await loadImage(logoUrl);

  // Metadatos arriba a la derecha
  doc.setFontSize(6);
  doc.setTextColor(150);
  doc.text(
    `Generado el: ${now} | Por: ${generadoPor}`,
    doc.internal.pageSize.width - 14,
    7,
    { align: 'right' }
  );

  autoTable(doc, {
    startY: 10,
    theme: 'plain',
    body: [
      [
        { content: '', rowSpan: 3, styles: { cellWidth: 24 } },
        {
          content: institutionName.toUpperCase(),
          styles: {
            fontSize: 13,
            fontStyle: 'bold',
            textColor: PRIMARY_COLOR
          }
        }
      ],
      [
        {
          content: 'PLANIFICACIÓN PEDAGÓGICA SEMANAL',
          styles: {
            fontSize: 10,
            fontStyle: 'bold'
          }
        }
      ],
      [
        {
          content: `Docente: ${plan.profesor?.firstName || user?.firstName || ''} ${plan.profesor?.lastName || user?.lastName || ''}  |  Grado: ${plan.grado || 'N/A'}`,
          styles: { fontSize: 8 }
        }
      ]
    ],
    didDrawCell: (data) => {
      if (data.column.index === 0 && logo) {
        doc.addImage(logo, 'PNG', data.cell.x, data.cell.y, 20, 20);
      }
    }
  });

  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  const fechaStr = `Periodo: ${formatDate(plan.fechaInicio)} al ${formatDate(plan.fechaFin)}`;
  doc.text(fechaStr, 14, doc.lastAutoTable.finalY + 6);

  let currentY = doc.lastAutoTable.finalY + 12;

  (plan.dias || []).forEach((dia) => {
    if (!dia.materias || dia.materias.length === 0) return;

    if (currentY > 235) {
      doc.addPage();
      currentY = 20;
    }

    const fechaDia = dia.fecha ? formatDate(dia.fecha) : '';

    // Cabecera del Día
    doc.setFillColor(241, 245, 249);
    doc.rect(14, currentY, 182, 7, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text(`${dia.nombreDia.toUpperCase()}  (${fechaDia})`, 18, currentY + 5);

    currentY += 10;

    const tableData = dia.materias.map(m => {
      const indicadoresTexto = m.indicadores && m.indicadores.length > 0
        ? m.indicadores.map((ind, idx) => `${idx + 1}. ${ind.descripcion} (${ind.puntos}p)`).join('\n')
        : '-';

      const contenidoTemaCapacidad = `Tema: ${m.tema || '-'}\nCapacidad: ${m.capacidad || '-'}`;
      const momentosEInd = `Momentos:\n${m.momentosDidacticos || '-'}\n\nIndicadores:\n${indicadoresTexto}`;
      const paginas = `Guía: ${m.guiaDocente || '-'}\nCuad: ${m.cuadernilloEstudiante || '-'}`;

      return [
        m.asignatura || 'N/A',
        m.unidadTematica || '-',
        contenidoTemaCapacidad,
        momentosEInd,
        paginas,
        m.instrumentoEvaluacion || 'Lista de cotejo'
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [[
        'ASIGNATURA',
        'U. TEMÁTICA',
        'TEMA / CAPACIDAD',
        'MOMENTOS / INDICADORES',
        'PÁGS.',
        'EVALUACIÓN'
      ]],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        valign: 'top'
      },
      headStyles: {
        fillColor: PRIMARY_COLOR,
        halign: 'center',
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 26, fontStyle: 'bold' },
        1: { cellWidth: 28 },
        2: { cellWidth: 45 },
        3: { cellWidth: 45 },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' }
      },
      margin: {
        left: 14,
        right: 14
      }
    });

    currentY = doc.lastAutoTable.finalY + 10;
  });

  const pageHeight = doc.internal.pageSize.height;
  if (currentY + 35 > pageHeight) {
    doc.addPage();
    currentY = 25;
  }

  doc.line(30, currentY + 15, 85, currentY + 15);
  doc.line(125, currentY + 15, 180, currentY + 15);

  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text("Firma del Docente", 57.5, currentY + 20, { align: "center" });
  doc.text("Dirección Académica", 152.5, currentY + 20, { align: "center" });

  doc.save(
    `Planificacion_${(plan.grado || 'grado').replace(/\s+/g, '_')}_${formatDate(plan.fechaInicio).replace(/\//g, '-')}.pdf`
  );
};


// --- FUNCIÓN 2: PARA REPORTE ACUMULADO ---
export const generateMassivePlanificacionPDF = async (
  planificaciones,
  user,
  rangoTexto = ""
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const now = new Date().toLocaleString();
  const generadoPor = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  const institutionName = user?.institution?.name || 'KuaaPy Institución';
  const logoUrl = user?.institution?.logoUrl || '/logo.png';
  const logo = await loadImage(logoUrl);

  for (let i = 0; i < planificaciones.length; i++) {
    const plan = planificaciones[i];

    if (i > 0) doc.addPage();

    doc.setFontSize(6);
    doc.setTextColor(150);
    doc.text(
      `Generado el: ${now} | Por: ${generadoPor} | Pág: ${doc.internal.getNumberOfPages()}`,
      doc.internal.pageSize.width - 14,
      7,
      { align: 'right' }
    );

    autoTable(doc, {
      startY: 10,
      theme: 'plain',
      body: [
        [
          { content: '', rowSpan: 3, styles: { cellWidth: 24 } },
          {
            content: institutionName.toUpperCase(),
            styles: {
              fontSize: 13,
              fontStyle: 'bold',
              textColor: PRIMARY_COLOR
            }
          }
        ],
        [
          {
            content: 'REPORTE ACUMULADO DE PLANIFICACIÓN',
            styles: {
              fontSize: 10,
              fontStyle: 'bold'
            }
          }
        ],
        [
          {
            content: `Docente: ${generadoPor} | Grado: ${plan.grado || 'N/A'} | Rango: ${rangoTexto}`,
            styles: { fontSize: 8 }
          }
        ]
      ],
      didDrawCell: (data) => {
        if (data.column.index === 0 && logo) {
          doc.addImage(logo, 'PNG', data.cell.x, data.cell.y, 20, 20);
        }
      }
    });

    let currentY = doc.lastAutoTable.finalY + 12;

    (plan.dias || []).forEach((dia) => {
      if (!dia.materias || dia.materias.length === 0) return;

      if (currentY > 235) {
        doc.addPage();
        currentY = 20;
      }

      const fechaDia = dia.fecha ? formatDate(dia.fecha) : '';

      doc.setFillColor(241, 245, 249);
      doc.rect(14, currentY, 182, 7, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
      doc.text(`${dia.nombreDia.toUpperCase()}  (${fechaDia})`, 18, currentY + 5);

      currentY += 10;

      const tableData = dia.materias.map(m => {
        const indicadoresTexto = m.indicadores && m.indicadores.length > 0
          ? m.indicadores.map((ind, idx) => `${idx + 1}. ${ind.descripcion} (${ind.puntos}p)`).join('\n')
          : '-';

        const contenidoTemaCapacidad = `Tema: ${m.tema || '-'}\nCapacidad: ${m.capacidad || '-'}`;
        const momentosEInd = `Momentos:\n${m.momentosDidacticos || '-'}\n\nIndicadores:\n${indicadoresTexto}`;
        const paginas = `Guía: ${m.guiaDocente || '-'}\nCuad: ${m.cuadernilloEstudiante || '-'}`;

        return [
          m.asignatura || 'N/A',
          m.unidadTematica || '-',
          contenidoTemaCapacidad,
          momentosEInd,
          paginas,
          m.instrumentoEvaluacion || 'Lista de cotejo'
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [[
          'ASIGNATURA',
          'U. TEMÁTICA',
          'TEMA / CAPACIDAD',
          'MOMENTOS / INDICADORES',
          'PÁGS.',
          'EVALUACIÓN'
        ]],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 7,
          cellPadding: 1.5,
          valign: 'top'
        },
        headStyles: {
          fillColor: PRIMARY_COLOR,
          halign: 'center',
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 26, fontStyle: 'bold' },
          1: { cellWidth: 28 },
          2: { cellWidth: 45 },
          3: { cellWidth: 45 },
          4: { cellWidth: 18, halign: 'center' },
          5: { cellWidth: 20, halign: 'center' }
        },
        margin: {
          left: 14,
          right: 14
        }
      });

      currentY = doc.lastAutoTable.finalY + 10;
    });

    if (currentY + 35 > 280) {
      doc.addPage();
      currentY = 25;
    }

    doc.line(30, currentY + 15, 85, currentY + 15);
    doc.line(125, currentY + 15, 180, currentY + 15);

    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("Firma del Docente", 57.5, currentY + 20, { align: "center" });
    doc.text("Dirección Académica", 152.5, currentY + 20, { align: "center" });
  }

  doc.save(`Reporte_Acumulado_${new Date().getTime()}.pdf`);
};