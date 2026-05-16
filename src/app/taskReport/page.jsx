'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getGeneralTaskReport } from '@/services/api';

import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';

import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

import {
  generateAllTaskReportPDF,
  generateTaskReportBySubjectPDF,
} from '@/components/teacher/taksReportPdf';

const COLORS = {
  primary: '#7D0F15',
  primaryDark: '#5c080d',
  bg: '#F8FAFC',
  border: '#E2E8F0',
};

export default function TaskReportPage() {
    const router = useRouter();

  const { user, loading } = useAuth();

  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('');

  const userGrades =
    user?.grades ||
    user?.assignedGrade ||
    user?.docente?.grades ||
    '';

  const availableGrades = Array.isArray(userGrades)
    ? userGrades
    : userGrades
      ? [userGrades]
      : [];

  useEffect(() => {
    if (availableGrades.length > 0 && !selectedGrade) {
      setSelectedGrade(availableGrades[0]);
    }
  }, [availableGrades, selectedGrade]);

  useEffect(() => {
    const loadReport = async () => {
      try {
        if (!user || !selectedGrade) return;

        setLoadingReport(true);
        setError('');

        const institutionId =
          user.institution?._id ||
          user.institution ||
          user.docente?.institution?._id ||
          user.docente?.institution;

        if (!institutionId) {
          setError('No se encontró la institución del docente.');
          return;
        }

        const data = await getGeneralTaskReport(selectedGrade, institutionId);
        setReport(data);
        setSelectedSubject('all');

      } catch (err) {
        console.error(err);
        setError('Error al cargar el reporte general.');
      } finally {
        setLoadingReport(false);
      }
    };

    loadReport();
  }, [user, selectedGrade]);

  const institutionName =
    user?.institution?.name ||
    user?.institution?.institutionName ||
    user?.docente?.institution?.name ||
    'Colegio Privado María Auxiliadora';

  const teacherName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

  const subjects = useMemo(() => {
    if (!report?.columns) return [];
    return [...new Set(report.columns.map(col => col.subject).filter(Boolean))];
  }, [report]);

  const allGroupedColumns = useMemo(() => {
    if (!report?.columns) return {};

    return report.columns.reduce((acc, col) => {
      const subject = col.subject || 'Sin asignatura';

      if (!acc[subject]) {
        acc[subject] = [];
      }

      acc[subject].push(col);
      return acc;
    }, {});
  }, [report]);

  const groupedColumns = useMemo(() => {
    if (!report?.columns) return {};

    return report.columns.reduce((acc, col) => {
      const subject = col.subject || 'Sin asignatura';

      if (selectedSubject !== 'all' && subject !== selectedSubject) {
        return acc;
      }

      if (!acc[subject]) {
        acc[subject] = [];
      }

      acc[subject].push(col);
      return acc;
    }, {});
  }, [report, selectedSubject]);

  if (loading || loadingReport) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress sx={{ color: COLORS.primary }} />
        <Typography sx={{ mt: 2 }}>Cargando reporte...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!report) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">No hay datos para mostrar.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: COLORS.bg, minHeight: '100vh' }}>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          borderTop: `8px solid ${COLORS.primary}`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            flexWrap: 'wrap',
          }}
        >
          <Box
            component="img"
            src="/logo.png"
            alt="Logo institucional"
            sx={{
              width: 95,
              height: 95,
              objectFit: 'contain',
              borderRadius: '50%',
            }}
          />

          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 'bold',
                color: COLORS.primary,
                textTransform: 'uppercase',
              }}
            >
              {institutionName}
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Reporte general de tareas
            </Typography>

            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={`Grado: ${selectedGrade}`}
                sx={{
                  backgroundColor: COLORS.primary,
                  color: '#fff',
                  fontWeight: 'bold',
                }}
              />

              <Chip
                label={`Docente: ${teacherName || '-'}`}
                variant="outlined"
                sx={{
                  borderColor: COLORS.primary,
                  color: COLORS.primary,
                  fontWeight: 'bold',
                }}
              />
            </Box>

<Box
  sx={{
    mt: 2,
    display: 'flex',
    gap: 2,
    flexWrap: 'wrap',
  }}
>
  <Button
    variant="contained"
    onClick={() => router.push('/teacher/calificaciones')}
    sx={{
      backgroundColor: '#1976d2',
      fontWeight: 'bold',
      '&:hover': {
        backgroundColor: '#1259a7',
      },
    }}
  >
    Ir a calificaciones
  </Button>

  <Button
    variant="contained"
    startIcon={<PictureAsPdfIcon />}
    onClick={() =>
      generateAllTaskReportPDF({
        report,
        user,
        groupedColumns: allGroupedColumns,
      })
    }
    sx={{
      backgroundColor: COLORS.primary,
      fontWeight: 'bold',
      '&:hover': {
        backgroundColor: COLORS.primaryDark,
      },
    }}
  >
    Generar PDF completo
  </Button>
</Box>
          </Box>
        </Box>
      </Paper>

      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
        }}
      >
        <FormControl fullWidth>
          <InputLabel>Filtrar por grado</InputLabel>
          <Select
            value={selectedGrade}
            label="Filtrar por grado"
            onChange={(e) => setSelectedGrade(e.target.value)}
          >
            {availableGrades.map(grade => (
              <MenuItem key={grade} value={grade}>
                {grade}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Filtrar por asignatura</InputLabel>
          <Select
            value={selectedSubject}
            label="Filtrar por asignatura"
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <MenuItem value="all">Todas las asignaturas</MenuItem>

            {subjects.map(subject => (
              <MenuItem key={subject} value={subject}>
                {subject}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {Object.entries(groupedColumns).length === 0 && (
        <Alert severity="info">
          No hay tareas cargadas para este grado o asignatura.
        </Alert>
      )}

      {Object.entries(groupedColumns).map(([subject, columns]) => (
        <Paper
          key={subject}
          elevation={2}
          sx={{
            p: 2,
            mb: 4,
            borderRadius: 3,
            overflowX: 'auto',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
              mb: 1,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: COLORS.primary,
                fontWeight: 'bold',
              }}
            >
              Asignatura: {subject}
            </Typography>

            <Button
              variant="outlined"
              size="small"
              startIcon={<PictureAsPdfIcon />}
              onClick={() =>
                generateTaskReportBySubjectPDF({
                  report,
                  user,
                  subject,
                  columns,
                })
              }
              sx={{
                borderColor: COLORS.primary,
                color: COLORS.primary,
                fontWeight: 'bold',
                '&:hover': {
                  borderColor: COLORS.primaryDark,
                  backgroundColor: '#fff5f5',
                },
              }}
            >
              PDF de asignatura
            </Button>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Table
            size="small"
            sx={{
              minWidth: 900,
              border: `1px solid ${COLORS.border}`,
            }}
          >
<TableHead>
  <TableRow sx={{ backgroundColor: COLORS.primary }}>
    <TableCell
      rowSpan={2}
      sx={{
        color: '#fff',
        fontWeight: 'bold',
        border: '1px solid #fff',
      }}
    >
      N°
    </TableCell>

    <TableCell
      rowSpan={2}
      sx={{
        color: '#fff',
        fontWeight: 'bold',
        border: '1px solid #fff',
      }}
    >
      Estudiante
    </TableCell>

    {columns.map(col => (
      <TableCell
        key={col.taskId}
        align="center"
        sx={{
          color: '#fff',
          fontWeight: 'bold',
          border: '1px solid #fff',
          minWidth: 140,
        }}
      >
        {col.topic}
      </TableCell>
    ))}

    <TableCell
      align="center"
      sx={{
        color: '#fff',
        fontWeight: 'bold',
        border: '1px solid #fff',
        minWidth: 100,
      }}
    >
      Total
    </TableCell>
  </TableRow>

  <TableRow sx={{ backgroundColor: COLORS.primaryDark }}>
    {columns.map(col => (
      <TableCell
        key={col.taskId}
        align="center"
        sx={{
          color: '#fff',
          fontWeight: 'bold',
          border: '1px solid #fff',
        }}
      >
        {col.maxPoints} pts
      </TableCell>
    ))}

    <TableCell
      align="center"
      sx={{
        color: '#fff',
        fontWeight: 'bold',
        border: '1px solid #fff',
      }}
    >
      {columns.reduce((sum, col) => sum + (col.maxPoints || 0), 0)} pts
    </TableCell>
  </TableRow>
</TableHead>

            <TableBody>
              {report.rows.map((student, index) => {
                const subjectTotal = columns.reduce((sum, col) => {
                  return sum + (student.scores?.[col.taskId]?.score ?? 0);
                }, 0);

                return (
                  <TableRow
                    key={student.studentId}
                    hover
                    sx={{
                      '&:nth-of-type(even)': {
                        backgroundColor: '#FAFAFA',
                      },
                    }}
                  >
                    <TableCell sx={{ border: `1px solid ${COLORS.border}` }}>
                      {index + 1}
                    </TableCell>

                    <TableCell
                      sx={{
                        border: `1px solid ${COLORS.border}`,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {student.studentName}
                    </TableCell>

                    {columns.map(col => (
                      <TableCell
                        key={col.taskId}
                        align="center"
                        sx={{ border: `1px solid ${COLORS.border}` }}
                      >
                        {student.scores?.[col.taskId]?.score ?? 0}
                      </TableCell>
                    ))}

                    <TableCell
                      align="center"
                      sx={{
                        border: `1px solid ${COLORS.border}`,
                        fontWeight: 'bold',
                        color: COLORS.primary,
                      }}
                    >
                      {subjectTotal}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      ))}
    </Box>
  );
}