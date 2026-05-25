import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PRIMARY_COLOR = [125, 15, 21];

const loadImage = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    img.crossOrigin = 'Anonymous';

    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
  });
};

const getUserInfo = (user) => {
  const institutionName =
    user?.institution?.name ||
    user?.institution?.institutionName ||
    user?.docente?.institution?.name ||
    'Colegio Privado María Auxiliadora';

  const grades =
    user?.grades ||
    user?.assignedGrade ||
    user?.docente?.grades ||
    '';

  const gradesText = Array.isArray(grades)
    ? grades.join(', ')
    : grades;

  const teacherName =
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

  return {
    institutionName,
    gradesText,
    teacherName,
  };
};

const calculateGrade = (obtained, total) => {
  if (!total || total <= 0) return 1;

  // Límite para nota 2: 70% redondeado hacia abajo
  const minimumPass = Math.floor(total * 0.7);

  // Si no llega al mínimo, nota 1
  if (obtained < minimumPass) return 1;

  // Si llega justo al mínimo, nota 2
  if (obtained === minimumPass) return 2;

  // Desde el punto siguiente al mínimo se reparten notas 3, 4 y 5
  const start = minimumPass + 1;
  const upperLimit = total;

  const range = upperLimit - start + 1;
  const baseInterval = Math.floor(range / 3);
  const remainder = range % 3;

  let currentStart = start;

  for (let grade = 3; grade <= 5; grade++) {
    // El sobrante se agrega a las notas superiores
    const extra = grade > 5 - remainder ? 1 : 0;

    const intervalSize = baseInterval + extra;
    const currentEnd = currentStart + intervalSize - 1;

    if (obtained >= currentStart && obtained <= currentEnd) {
      return grade;
    }

    currentStart = currentEnd + 1;
  }

  return 5;
};
const addHeader = async (doc, user) => {
  const logo = await loadImage('/logo.png');

  const {
    institutionName,
    gradesText,
    teacherName,
  } = getUserInfo(user);

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
          content: 'Calificaciones automáticas por rendimiento',

          styles: {
            fontSize: 8,
            fontStyle: 'bold',
          },
        },
      ],
    ],

    didDrawCell: (data) => {
      if (data.column.index === 0 && logo) {
        doc.addImage(
          logo,
          'PNG',
          data.cell.x + 1,
          data.cell.y + 1,
          22,
          22
        );
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
}) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const startY = await addHeader(doc, user);

  const headRow1 = [
    {
      content: 'Alumno',
      rowSpan: 2,
    },
  ];

  const headRow2 = [];

  Object.entries(groupedSubjects).forEach(
    ([subject, cols]) => {
      const totalPoints = cols.reduce(
        (sum, col) => sum + (col.maxPoints || 0),
        0
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

  const body = report.rows.map((student) => {
    const row = [student.studentName];

    Object.entries(groupedSubjects).forEach(
      ([subject, cols]) => {
        const obtainedPoints = cols.reduce(
          (sum, col) => {
            return (
              sum +
              (student.scores?.[col.taskId]?.score || 0)
            );
          },
          0
        );

        const totalPoints = cols.reduce(
          (sum, col) => {
            return sum + (col.maxPoints || 0);
          },
          0
        );

        const grade = calculateGrade(
          obtainedPoints,
          totalPoints
        );

        row.push(obtainedPoints);
        row.push(grade);
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