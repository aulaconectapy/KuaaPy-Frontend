import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Azul principal KuaaPy (#0038A8)
const PRIMARY_COLOR = [0, 56, 168];
const RED_ALERT_COLOR = [213, 43, 30];
const DARK_TEXT_COLOR = [15, 23, 42];

const roundDecimal = (value, decimals = 2) => {
  const factor = Math.pow(10, decimals);
  return Math.round((Number(value || 0) + Number.EPSILON) * factor) / factor;
};

const fetchImageElement = (url, useCors = true) => {
  return new Promise((resolve) => {
    const img = new Image();
    if (useCors) {
      img.crossOrigin = 'Anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

const loadImage = async (url) => {
  if (!url) return null;

  if (typeof url === 'string' && url.startsWith('data:image/')) {
    return fetchImageElement(url, false);
  }

  const withCors = await fetchImageElement(url, true);
  if (withCors) return withCors;

  return fetchImageElement(url, false);
};

const getImageFormat = (src) => {
  if (typeof src !== 'string') return 'PNG';
  const lower = src.toLowerCase();
  if (lower.includes('jpeg') || lower.includes('.jpg')) return 'JPEG';
  if (lower.includes('webp')) return 'WEBP';
  return 'PNG';
};

const getUserInfo = (user, selectedGrade) => {
  const institutionObj =
    user?.institution && typeof user.institution === 'object'
      ? user.institution
      : user?.docente?.institution && typeof user.docente.institution === 'object'
        ? user.docente.institution
        : null;

  const institutionName =
    institutionObj?.name ||
    institutionObj?.institutionName ||
    'KuaaPy Institución';

  const institutionLogo =
    institutionObj?.logo ||
    institutionObj?.logoUrl ||
    institutionObj?.image ||
    institutionObj?.avatar ||
    user?.institutionLogo ||
    '/logo.png';

  const grades =
    user?.grades ||
    user?.assignedGrade ||
    user?.docente?.grades ||
    '';

  const gradesText =
    selectedGrade ||
    (Array.isArray(grades) ? grades.join(', ') : grades);

  const teacherName =
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

  return {
    institutionName,
    institutionLogo,
    gradesText,
    teacherName,
  };
};

/**
 * Equivalente exacto a la fórmula de Excel:
 * =SI(K15<70;"1";SI(K15<77,5;"2";SI(K15<85,5;"3";SI(K15<93,5;"4";"5"))))
 */
const calculateGrade = (obtained, total) => {
  if (!total || total <= 0) return 1;

  const cleanObtained = roundDecimal(obtained, 2);
  const cleanTotal = roundDecimal(total, 2);

  const percentage = (cleanObtained / cleanTotal) * 100;

  if (percentage < 70) return 1;
  if (percentage < 77.5) return 2;
  if (percentage < 85.5) return 3;
  if (percentage < 93.5) return 4;
  return 5;
};

const addHeader = async (doc, user, selectedGrade) => {
  const {
    institutionName,
    institutionLogo,
    gradesText,
    teacherName,
  } = getUserInfo(user, selectedGrade);

  let logo = await loadImage(institutionLogo);
  let usedSrc = institutionLogo;

  if (!logo && institutionLogo !== '/logo.png') {
    logo = await loadImage('/logo.png');
    usedSrc = '/logo.png';
  }

  const imageFormat = getImageFormat(usedSrc);
  const now = new Date().toLocaleString();

  doc.setFontSize(6);
  doc.setTextColor(150);

  doc.text(
    `Generado el: ${now} | Por: ${teacherName}`,
    doc.internal.pageSize.width - 14,
    7,
    { align: 'right' }
  );

  autoTable(doc, {
    startY: 10,
    theme: 'plain',

    body: [
      [
        {
          content: '',
          rowSpan: 4,
          styles: { cellWidth: 26 },
        },
        {
          content: institutionName.toUpperCase(),
          styles: {
            fontSize: 13,
            fontStyle: 'bold',
            textColor: PRIMARY_COLOR,
          },
        },
      ],
      [
        {
          content: 'PLANILLA GENERAL DE CALIFICACIONES',
          styles: {
            fontSize: 10,
            fontStyle: 'bold',
          },
        },
      ],
      [
        {
          content:
            `Docente: ${teacherName || '-'} | ` +
            `Grado: ${gradesText || '-'}`,
          styles: {
            fontSize: 8,
          },
        },
      ],
      [
        {
          content: 'Calificaciones automáticas según escala porcentual',
          styles: {
            fontSize: 8,
            fontStyle: 'bold',
          },
        },
      ],
    ],

    didDrawCell: (data) => {
      if (data.column.index === 0 && logo) {
        try {
          doc.addImage(
            logo,
            imageFormat,
            data.cell.x + 1,
            data.cell.y + 1,
            22,
            22
          );
        } catch (err) {
          console.warn('No se pudo dibujar el logo en el PDF:', err);
        }
      }
    },
  });

  return doc.lastAutoTable.finalY + 8;
};

const addFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setFontSize(7);
    doc.setTextColor(120);

    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width - 14,
      doc.internal.pageSize.height - 8,
      { align: 'right' }
    );
  }
};

export const generateCalificacionesPDF = async ({
  report,
  groupedSubjects,
  user,
  selectedGrade,
}) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const startY = await addHeader(doc, user, selectedGrade);

  const headRow1 = [
    {
      content: 'Alumno',
      rowSpan: 2,
    },
  ];

  const headRow2 = [];

  Object.entries(groupedSubjects).forEach(
    ([subject, cols]) => {
      const totalPoints = roundDecimal(
        cols.reduce(
          (sum, col) => sum + Number(col.maxPoints || 0),
          0
        )
      );

      headRow1.push({
        content: subject,
        colSpan: 2,
      });

      headRow2.push({
        content: `${totalPoints} pts`,
      });

      headRow2.push({
        content: 'Calif.',
      });
    }
  );

  const body = (report?.rows || []).map((student) => {
    const row = [student.studentName];

    Object.entries(groupedSubjects).forEach(
      ([subject, cols]) => {
        const obtainedPoints = roundDecimal(
          cols.reduce((sum, col) => {
            return (
              sum +
              Number(student.scores?.[col.taskId]?.score || 0)
            );
          }, 0)
        );

        const totalPoints = roundDecimal(
          cols.reduce((sum, col) => {
            return sum + Number(col.maxPoints || 0);
          }, 0)
        );

        const grade = calculateGrade(
          obtainedPoints,
          totalPoints
        );

        row.push(obtainedPoints);
        row.push({
          content: String(grade),
          styles: {
            fontStyle: 'bold',
            textColor: grade === 1 ? RED_ALERT_COLOR : DARK_TEXT_COLOR,
          },
        });
      }
    );

    return row;
  });

  autoTable(doc, {
    startY,
    head: [headRow1, headRow2],
    body,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      halign: 'center',
      valign: 'middle',
    },
    headStyles: {
      fillColor: PRIMARY_COLOR,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: {
        cellWidth: 55,
        halign: 'left',
      },
    },
    margin: {
      left: 8,
      right: 8,
    },
  });

  addFooter(doc);

  doc.save(
    `Planilla_Calificaciones_${Date.now()}.pdf`
  );
};