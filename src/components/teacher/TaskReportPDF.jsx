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

  // -----------------------------
  // TITULOS
  // -----------------------------
  const instrumentTitles = {
    rsa: 'PLANILLA DE REGISTRO DE SECUENCIA DE APRENDIZAJE (RSA)',
    rubrica: 'PLANILLA DE RÚBRICA DE EVALUACIÓN',
    lista_cotejo: 'PLANILLA DE LISTA DE COTEJO',
    default: 'PLANILLA DE REGISTRO PEDAGÓGICO'
  };

  const currentTitle =
    instrumentTitles[taskInfo?.instrumentType] ||
    instrumentTitles.default;

  // -----------------------------
  // RSA
  // -----------------------------
  const calculateRSAFinal = (m1, m2, m3) => {
    const check = (v) => (Number(v) >= 1 ? 'L' : 'ANL');

    const [g, h, i] = [check(m1), check(m2), check(m3)];

    if (g === 'L' && h === 'L' && i === 'L') return 'L';
    if (g === 'ANL' && h === 'L' && i === 'L') return 'L';
    if (g === 'ANL' && h === 'ANL' && i === 'L') return 'L';
    if (g === 'L' && h === 'ANL' && i === 'L') return 'L';

    return 'ANL';
  };

  // -----------------------------
  // LOGO
  // -----------------------------
  const loadImage = (url) => {
    return new Promise((resolve) => {
      const img = new Image();

      img.src = url;
      img.crossOrigin = 'Anonymous';

      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });
  };

  const logo = await loadImage('/logo.png');

  // -----------------------------
  // ENCABEZADO
  // -----------------------------
  autoTable(doc, {
    startY: 10,
    theme: 'plain',
    styles: {
      cellPadding: 1
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 160 },
      2: { halign: 'right' }
    },
    body: [
      [
        { content: '', rowSpan: 3 },

        {
          content: (
            user?.institution?.name ||
            'INSTITUCIÓN EDUCATIVA'
          ).toUpperCase(),
          styles: {
            fontSize: 14,
            fontStyle: 'bold',
            textColor: PRIMARY_COLOR
          }
        },

        {
          content: `Fecha de entrega: ${
            taskInfo?.dueDate
              ? new Date(taskInfo.dueDate).toLocaleDateString(
                  'es-ES',
                  {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  }
                )
              : 'N/A'
          }`,
          styles: {
            fontSize: 8,
            textColor: [100, 100, 100]
          }
        }
      ],

      [
        {
          content: currentTitle,
          styles: {
            fontSize: 11,
            fontStyle: 'bold'
          }
        },

        {
          content: `Tema: ${taskInfo?.topic || 'N/A'}`,
          styles: {
            fontSize: 8
          }
        }
      ],

      [
        {
          content: `Docente: ${user?.firstName || ''} ${
            user?.lastName || ''
          }  |  Grado: ${
            taskInfo?.grade || 'N/A'
          }  |  Materia: ${
            taskInfo?.subject || 'General'
          }`,
          styles: {
            fontSize: 9
          }
        },

        {
          content: '',
          styles: {
            fontSize: 8
          }
        }
      ]
    ],

    didDrawCell: (data) => {
      if (data.column.index === 0 && logo) {
        doc.addImage(
          logo,
          'PNG',
          data.cell.x,
          data.cell.y,
          22,
          22
        );
      }
    }
  });

  let currentY = doc.lastAutoTable.finalY + 5;

  // -----------------------------
  // REFERENCIA RÚBRICA
  // -----------------------------
  if (isRubrica && taskInfo.rubricCriteria?.length > 0) {
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');

    doc.text(
      'REFERENCIA DE CRITERIOS Y DESCRIPTORES:',
      14,
      currentY
    );

    const referenceRows = [];

    taskInfo.rubricCriteria.forEach((crit) => {
      crit.levels.forEach((lvl, idx) => {
        referenceRows.push([
          idx === 0
            ? crit.criterion.toUpperCase()
            : '',
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

      styles: {
        fontSize: 7,
        cellPadding: 1
      },

      headStyles: {
        fillColor: [80, 80, 80]
      },

      columnStyles: {
        0: {
          cellWidth: 50,
          fontStyle: 'bold'
        },
        1: {
          cellWidth: 25
        },
        2: {
          cellWidth: 15,
          halign: 'center'
        },
        3: {
          cellWidth: 'auto'
        }
      }
    });

    currentY = doc.lastAutoTable.finalY + 8;
  }

  // -----------------------------
  // TABLA
  // -----------------------------
  const criteria = isRubrica
    ? taskInfo?.rubricCriteria || []
    : taskInfo?.indicators || [];

  let headerRow1 = [
    {
      content: 'N°',
      rowSpan: isRSA ? 2 : 1
    },
    {
      content: 'ESTUDIANTE',
      rowSpan: isRSA ? 2 : 1
    }
  ];

  let headerRow2 = [];

  criteria.forEach((item) => {
    const title = isRubrica
      ? item.criterion
      : item.name || item.description;

    const maxPoints =
      Number(item.points) ||
      Number(item.score) ||
      Number(item.value) ||
      1;

    if (isRSA) {
      headerRow1.push({
        content: title,
        colSpan: 4,
        styles: {
          halign: 'center',
          fontSize: 7
        }
      });

      headerRow2.push(
        { content: '1°O' },
        { content: '2°O' },
        { content: '3°O' },
        { content: 'R' }
      );
    } else {
      headerRow1.push({
        content: `${title.toUpperCase()}\n(${maxPoints} pts)`,
        styles: {
          halign: 'center',
          fontSize: 7
        }
      });
    }
  });

  headerRow1.push({
    content: isRSA ? 'TOTAL L' : 'PUNTOS',
    rowSpan: isRSA ? 2 : 1
  });

  headerRow1.push({
    content: 'OBSERVACIONES',
    rowSpan: isRSA ? 2 : 1
  });

  // -----------------------------
  // FILAS
  // -----------------------------
  const tableRows = submissions.map((sub, index) => {
    const row = [
      index + 1,
      `${sub.student?.lastName?.toUpperCase() || ''}, ${
        sub.student?.firstName || ''
      }`
    ];

    const currentScores = isRubrica
      ? sub.rubricScores || []
      : sub.indicatorScores || [];

    criteria.forEach((crit) => {
      if (isRSA) {
        const getPts = (m) => {
          const s = currentScores.find(
            (is) =>
              (is.indicatorId?._id ||
                is.indicatorId ||
                is._id) === crit._id &&
              is.moment === m
          );

          return s ? Number(s.points) || 0 : 0;
        };

        const m1 = getPts(1);
        const m2 = getPts(2);
        const m3 = getPts(3);

        const res = calculateRSAFinal(
          m1,
          m2,
          m3
        );

        row.push(
          m1 >= 1 ? 'L' : 'ANL',
          m2 >= 1 ? 'L' : 'ANL',
          m3 >= 1 ? 'L' : 'ANL',
          res
        );
      } else {
        const score = currentScores.find(
          (s) =>
            (s.indicatorId?._id ||
              s.indicatorId ||
              s._id) === crit._id
        );

        const p = score
          ? Number(score.points) || 0
          : 0;

        // CAMBIO IMPORTANTE:
        // Mostrar puntaje real
        row.push(p);
      }
    });

    row.push(sub.score || 0);
    row.push(sub.comments || '');

    return row;
  });

  // -----------------------------
  // TABLA FINAL
  // -----------------------------
  autoTable(doc, {
    startY: currentY,

    head: isRSA
      ? [headerRow1, headerRow2]
      : [headerRow1],

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
      1: {
        halign: 'left',
        cellWidth: 50
      }
    }
  });

  // -----------------------------
  // FIRMAS
  // -----------------------------
  const finalY =
    doc.lastAutoTable.finalY + 15;

  const pageHeight =
    doc.internal.pageSize.height;

  if (finalY + 20 < pageHeight) {
    doc.line(60, finalY + 10, 120, finalY + 10);

    doc.line(170, finalY + 10, 230, finalY + 10);

    doc.setFontSize(8);

    doc.text(
      'Firma del Docente',
      90,
      finalY + 15,
      {
        align: 'center'
      }
    );

    doc.text(
      'Dirección Académica',
      200,
      finalY + 15,
      {
        align: 'center'
      }
    );
  }

  doc.save(
    `Reporte_${
      taskInfo?.topic?.replace(/\s+/g, '_') ||
      'Tarea'
    }.pdf`
  );
};