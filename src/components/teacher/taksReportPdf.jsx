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

const getUserInfo = (user) => {
  const institutionName =
    user?.institution?.name ||
    user?.institution?.institutionName ||
    user?.docente?.institution?.name ||
    'KuaaPy Institución';

  const grades =
    user?.grades ||
    user?.assignedGrade ||
    user?.docente?.grades ||
    '';

  const gradesText = Array.isArray(grades) ? grades.join(', ') : grades;

  const teacherName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

  // URL del logo institucional
  const logoUrl = user?.institution?.logoUrl || '/logo.png';

  return { institutionName, gradesText, teacherName, logoUrl };
};

const addHeader = async (doc, user, title, subject = '') => {
  const { institutionName, gradesText, teacherName, logoUrl } = getUserInfo(user);
  const logo = await loadImage(logoUrl);
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
        { content: '', rowSpan: 4, styles: { cellWidth: 26 } },
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
          content: title.toUpperCase(),
          styles: { fontSize: 10, fontStyle: 'bold' },
        },
      ],
      [
        {
          content: `Docente: ${teacherName || '-'} | Grado: ${gradesText || '-'}`,
          styles: { fontSize: 8 },
        },
      ],
      [
        {
          content: subject ? `Asignatura: ${subject}` : 'Todas las asignaturas',
          styles: { fontSize: 8, fontStyle: 'bold' },
        },
      ],
    ],
    didDrawCell: (data) => {
      if (data.column.index === 0 && logo) {
        doc.addImage(logo, 'PNG', data.cell.x + 1, data.cell.y + 1, 22, 22);
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

const buildSubjectTable = (doc, report, subject, columns, startY) => {

  // 🔥 SUMA TOTAL DE LOS TEMAS
  const totalMaxPoints = columns.reduce(
    (sum, col) => sum + Number(col.maxPoints || 0),
    0
  );

  const head = [
    [
      {
        content: 'N°',
        rowSpan: 2,
      },

      {
        content: 'Estudiante',
        rowSpan: 2,
      },

      ...columns.map(col => ({
        content: col.topic || '-',
      })),

      {
        content: `Total\n${totalMaxPoints} pts`,
        rowSpan: 2,
      },
    ],

    [
      ...columns.map(col => ({
        content: `${Number(col.maxPoints || 0)} pts`,
      })),
    ],
  ];

  const body = report.rows.map((student, index) => {

    // 🔥 TOTAL DEL ALUMNO
    const subjectTotal = columns.reduce((sum, col) => {

      return (
        sum +
        Number(student.scores?.[col.taskId]?.score || 0)
      );

    }, 0);

    return [
      index + 1,

      student.studentName,

      ...columns.map(col =>
        Number(student.scores?.[col.taskId]?.score || 0)
      ),

      // 🔥 TOTAL FINAL
      subjectTotal,
    ];
  });

  autoTable(doc, {
    startY,

    head,

    body,

    theme: 'grid',

    tableWidth: 'auto',

    styles: {
      fontSize: 7,
      cellPadding: 1.4,
      halign: 'center',
      valign: 'middle',
      overflow: 'linebreak',
    },

    headStyles: {
      fillColor: PRIMARY_COLOR,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },

    columnStyles: {
      0: {
        cellWidth: 10,
      },

      1: {
        cellWidth: 55,
        halign: 'left',
      },
    },

    margin: {
      left: 8,
      right: 8,
    },
  });

  return doc.lastAutoTable.finalY + 10;
};

// 🔴 PDF POR ASIGNATURA
export const generateTaskReportBySubjectPDF = async ({
  report,
  user,
  subject,
  columns,
}) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const startY = await addHeader(
    doc,
    user,
    'Reporte general de tareas',
    subject
  );

  buildSubjectTable(doc, report, subject, columns, startY);

  addFooter(doc);

  doc.save(`Reporte_${subject.replace(/\s+/g, '_')}.pdf`);
};

// 🔴 PDF COMPLETO
export const generateAllTaskReportPDF = async ({
  report,
  user,
  groupedColumns,
}) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const subjects = Object.entries(groupedColumns);

  for (let i = 0; i < subjects.length; i++) {
    const [subject, columns] = subjects[i];

    if (i > 0) doc.addPage();

    const startY = await addHeader(
      doc,
      user,
      'Reporte general de tareas',
      subject
    );

    buildSubjectTable(doc, report, subject, columns, startY);
  }

  addFooter(doc);

  doc.save(`Reporte_General_Tareas_${Date.now()}.pdf`);
};