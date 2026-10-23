'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getGeneralTaskReport } from '@/services/api';

import {
  generateAllTaskReportPDF,
  generateTaskReportBySubjectPDF,
} from '@/components/teacher/taksReportPdf';

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

// CONSTANTES DE ESTILO KUAAPY
const COLORS = {
  primary: '#0038A8',     // Azul principal KuaaPy
  primaryDark: '#00257A', // Azul oscuro
  red: '#D52B1E',         // Acento rojo
  bg: '#F8FAFC',
  border: '#E2E8F0',
  gradient: 'linear-gradient(135deg, #0038A8 0%, #00257A 100%)'
};

const ALLOWED_ROLES = [
  'docente',
  'director',
  'directora',
  'secretario',
  'secretaria',
];

export default function TaskReportPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('');

  const isAllowed = user?.role && ALLOWED_ROLES.includes(user.role.toLowerCase());

  const userGrades =
    user?.role?.toLowerCase() === 'docente'
      ? user?.grades || user?.assignedGrade || user?.docente?.grades || ''
      : user?.grades || user?.assignedGrade || user?.docente?.grades || [];

  const availableGrades = Array.isArray(userGrades)
    ? userGrades
    : userGrades
      ? [userGrades]
      : [];

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (!loading && user && !isAllowed) {
      router.push('/dashboard');
    }
  }, [loading, user, isAllowed, router]);

  useEffect(() => {
    if (availableGrades.length > 0 && !selectedGrade) {
      setSelectedGrade(availableGrades[0]);
    }
  }, [availableGrades, selectedGrade]);

  useEffect(() => {
    const loadReport = async () => {
      try {
        if (!user || !isAllowed || !selectedGrade) return;

        setLoadingReport(true);
        setError('');

        const institutionId =
          user.institution?._id ||
          user.institution ||
          user.docente?.institution?._id ||
          user.docente?.institution;

        if (!institutionId) {
          setError('No se encontró la institución del usuario.');
          return;
        }

        console.log("🔍 Cargando reporte para Grado:", selectedGrade, "Institución:", institutionId);
        const data = await getGeneralTaskReport(selectedGrade, institutionId);
        console.log("📊 Datos recibidos del reporte:", data);

        setReport(data);
        setSelectedSubject('all');
      } catch (err) {
        console.error("❌ Error cargando reporte general:", err);

        const backendMessage =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Error al cargar el reporte general.';

        setError(backendMessage);
      } finally {
        setLoadingReport(false);
      }
    };

    loadReport();
  }, [user, selectedGrade, isAllowed]);

  const institutionName =
    user?.institution?.name ||
    user?.institution?.institutionName ||
    user?.docente?.institution?.name ||
    'KuaaPy Institución';

  const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

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
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress sx={{ color: COLORS.primary }} />
        <Typography sx={{ mt: 2, fontWeight: 600, color: '#64748B' }}>Cargando reporte...</Typography>
      </Box>
    );
  }

  if (!user || !isAllowed) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress sx={{ color: COLORS.primary }} />
        <Typography sx={{ mt: 2, fontWeight: 600, color: '#64748B' }}>Redirigiendo...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>
      </Box>
    );
  }

  if (!selectedGrade) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" sx={{ borderRadius: '12px' }}>
          No se encontró ningún grado asignado para mostrar el reporte.
        </Alert>
      </Box>
    );
  }

  if (!report) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" sx={{ borderRadius: '12px' }}>No hay datos para mostrar.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: COLORS.bg, minHeight: '100vh' }}>
      
      {/* Tarjeta de Encabezado Institucional Dinámico */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mb: 4,
          borderRadius: '24px',
          border: `1px solid ${COLORS.border}`,
          bgcolor: '#fff',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '8px', height: '100%', background: COLORS.gradient }} />

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
            src={user?.institution?.logoUrl || "/logo.png"}
            alt="Logo institucional"
            sx={{
              width: 80,
              height: 80,
              objectFit: 'contain',
              borderRadius: '20px',
              bgcolor: '#F1F5F9',
              p: 1
            }}
          />

          <Box sx={{ flex: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                color: COLORS.primary,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                mb: 0.5
              }}
            >
              {institutionName}
            </Typography>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                color: '#0F172A',
                letterSpacing: '-0.02em',
                mb: 1.5
              }}
            >
              Reporte General de Tareas - KuaaPy
            </Typography>

            <Box sx={{ mt: 1, display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2.5 }}>
              <Chip
                label={`Grado: ${selectedGrade}`}
                sx={{
                  backgroundColor: `${COLORS.primary}12`,
                  color: COLORS.primary,
                  fontWeight: 800,
                  borderRadius: '8px'
                }}
              />

              <Chip
                label={`Usuario: ${userName || '-'}`}
                variant="outlined"
                sx={{
                  borderColor: COLORS.primary,
                  color: COLORS.primary,
                  fontWeight: 800,
                  borderRadius: '8px'
                }}
              />

              <Chip
                label={`Rol: ${user?.role || '-'}`}
                variant="outlined"
                sx={{
                  borderColor: COLORS.primary,
                  color: COLORS.primary,
                  fontWeight: 800,
                  borderRadius: '8px'
                }}
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              {user?.role?.toLowerCase() === 'docente' && (
                <Button
                  variant="contained"
                  onClick={() => router.push('/teacher/calificaciones')}
                  sx={{
                    backgroundColor: '#0284C7',
                    borderRadius: '12px',
                    fontWeight: 800,
                    textTransform: 'none',
                    px: 3,
                    height: 40,
                    boxShadow: '0 8px 20px rgba(2,132,199,0.2)',
                    '&:hover': {
                      backgroundColor: '#0369A1',
                    },
                  }}
                >
                  Ir a calificaciones
                </Button>
              )}

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
                  borderRadius: '12px',
                  fontWeight: 800,
                  textTransform: 'none',
                  px: 3,
                  height: 40,
                  boxShadow: '0 8px 20px rgba(0,56,168,0.2)',
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

      {/* Contenedor de Filtros */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: '20px',
          border: `1px solid ${COLORS.border}`,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2.5,
          bgcolor: '#fff'
        }}
      >
        <FormControl fullWidth size="small">
          <InputLabel>Filtrar por grado</InputLabel>
          <Select
            value={selectedGrade}
            label="Filtrar por grado"
            onChange={(e) => setSelectedGrade(e.target.value)}
            sx={{ borderRadius: '12px', bgcolor: '#fff' }}
          >
            {availableGrades.map(grade => (
              <MenuItem key={grade} value={grade}>
                {grade}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Filtrar por asignatura</InputLabel>
          <Select
            value={selectedSubject}
            label="Filtrar por asignatura"
            onChange={(e) => setSelectedSubject(e.target.value)}
            sx={{ borderRadius: '12px', bgcolor: '#fff' }}
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
        <Alert severity="info" sx={{ borderRadius: '12px' }}>
          No hay tareas cargadas para este grado o asignatura.
        </Alert>
      )}

      {Object.entries(groupedColumns).map(([subject, columns]) => (
        <Paper
          key={subject}
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: '24px',
            border: `1px solid ${COLORS.border}`,
            overflowX: 'auto',
            bgcolor: '#fff'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
              mb: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: COLORS.primary,
                fontWeight: 900,
                letterSpacing: '-0.01em'
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
                borderRadius: '10px',
                fontWeight: 800,
                textTransform: 'none',
                '&:hover': {
                  borderColor: COLORS.primaryDark,
                  backgroundColor: '#EFF6FF',
                },
              }}
            >
              PDF de asignatura
            </Button>
          </Box>

          <Divider sx={{ mb: 3, borderColor: '#F1F5F9' }} />

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
                    fontWeight: 900,
                    border: '1px solid rgba(255,255,255,0.2)',
                    p: 2
                  }}
                >
                  N°
                </TableCell>

                <TableCell
                  rowSpan={2}
                  sx={{
                    color: '#fff',
                    fontWeight: 900,
                    border: '1px solid rgba(255,255,255,0.2)',
                    p: 2
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
                      fontWeight: 900,
                      border: '1px solid rgba(255,255,255,0.2)',
                      minWidth: 140,
                      p: 2
                    }}
                  >
                    {col.topic}
                  </TableCell>
                ))}

                <TableCell
                  align="center"
                  sx={{
                    color: '#fff',
                    fontWeight: 900,
                    border: '1px solid rgba(255,255,255,0.2)',
                    minWidth: 100,
                    p: 2
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
                      fontWeight: 800,
                      border: '1px solid rgba(255,255,255,0.2)',
                      fontSize: '0.8rem',
                      py: 1.5
                    }}
                  >
                    {col.maxPoints} pts
                  </TableCell>
                ))}

                <TableCell
                  align="center"
                  sx={{
                    color: '#fff',
                    fontWeight: 800,
                    border: '1px solid rgba(255,255,255,0.2)',
                    fontSize: '0.8rem',
                    py: 1.5
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
                        backgroundColor: '#F8FAFC',
                      },
                    }}
                  >
                    <TableCell sx={{ border: `1px solid ${COLORS.border}`, p: 2, fontWeight: 600 }}>
                      {index + 1}
                    </TableCell>

                    <TableCell
                      sx={{
                        border: `1px solid ${COLORS.border}`,
                        fontWeight: 700,
                        color: '#0F172A',
                        whiteSpace: 'nowrap',
                        p: 2
                      }}
                    >
                      {student.studentName}
                    </TableCell>

                    {columns.map(col => (
                      <TableCell
                        key={col.taskId}
                        align="center"
                        sx={{ border: `1px solid ${COLORS.border}`, color: '#475569', fontWeight: 600, p: 2 }}
                      >
                        {student.scores?.[col.taskId]?.score ?? 0}
                      </TableCell>
                    ))}

                    <TableCell
                      align="center"
                      sx={{
                        border: `1px solid ${COLORS.border}`,
                        fontWeight: 900,
                        color: COLORS.primary,
                        fontSize: '0.95rem',
                        p: 2
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