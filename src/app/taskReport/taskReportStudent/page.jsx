'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getStudentProcessReport } from '@/services/api';

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

const COLORS = {
  primary: '#7D0F15',
  primaryDark: '#5c080d',
  bg: '#F8FAFC',
  border: '#E2E8F0',
};

export default function TaskReportStudentPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [notStudent, setNotStudent] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'estudiante') {
      setNotStudent(true);

      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 1800);

      return () => clearTimeout(timer);
    }
  }, [loading, user, router]);

  useEffect(() => {
    const loadReport = async () => {
      try {
        if (!user?._id || user.role !== 'estudiante') return;

        setLoadingReport(true);
        setError('');

        const institutionId =
          user?.institution?._id ||
          user?.institution;

        const data = await getStudentProcessReport(user._id, institutionId);

        setReport(data);
      } catch (err) {
        console.error(err);

        const backendMessage =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Error al cargar tu proceso académico.';

        setError(backendMessage);
      } finally {
        setLoadingReport(false);
      }
    };

    loadReport();
  }, [user]);

  const subjects = useMemo(() => {
    if (!report?.subjects) return [];
    return report.subjects.map(item => item.subject);
  }, [report]);

  const filteredSubjects = useMemo(() => {
    if (!report?.subjects) return [];

    if (selectedSubject === 'all') {
      return report.subjects;
    }

    return report.subjects.filter(item => item.subject === selectedSubject);
  }, [report, selectedSubject]);

  const generalTotal = useMemo(() => {
    if (!report?.subjects) return { score: 0, max: 0 };

    return report.subjects.reduce(
      (acc, item) => {
        acc.score += item.totalScore || 0;
        acc.max += item.totalMaxPoints || 0;
        return acc;
      },
      { score: 0, max: 0 }
    );
  }, [report]);

  if (loading || loadingReport) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress sx={{ color: COLORS.primary }} />
        <Typography sx={{ mt: 2 }}>Cargando tu proceso...</Typography>
      </Box>
    );
  }

  if (notStudent) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          No eres un estudiante. Serás redirigido al dashboard.
        </Alert>
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
          <Box
            component="img"
            src="/logo.png"
            alt="Logo institucional"
            sx={{
              width: 90,
              height: 90,
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
              Mi proceso académico
            </Typography>

            <Typography sx={{ fontWeight: 600 }}>
              Estudiante: {report.student?.studentName}
            </Typography>

            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Box
  sx={{
    mt: 2,
    display: 'flex',
    gap: 2,
    flexWrap: 'wrap',
  }}
>
 {/*<Button
    variant="contained"
    onClick={() =>
      router.push('/teacher/calificaciones/stutdenCalificacion')
    }
    sx={{
      backgroundColor: '#1976d2',
      fontWeight: 'bold',
      '&:hover': {
        backgroundColor: '#1259a7',
      },
    }}
  >
    Ver calificaciones
  </Button>*/}
</Box>
              <Chip
                label={`Grado: ${report.student?.grade}`}
                sx={{
                  backgroundColor: COLORS.primary,
                  color: '#fff',
                  fontWeight: 'bold',
                }}
              />

              <Chip
                label={`Total general: ${generalTotal.score} / ${generalTotal.max} pts`}
                variant="outlined"
                sx={{
                  borderColor: COLORS.primary,
                  color: COLORS.primary,
                  fontWeight: 'bold',
                }}
              />
            </Box>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
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

      {filteredSubjects.length === 0 && (
        <Alert severity="info">
          No hay tareas sumativas cargadas para mostrar.
        </Alert>
      )}

      {filteredSubjects.map(subjectGroup => (
        <Paper
          key={subjectGroup.subject}
          elevation={2}
          sx={{
            p: 2,
            mb: 4,
            borderRadius: 3,
            overflowX: 'auto',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: COLORS.primary,
              fontWeight: 'bold',
              mb: 1,
            }}
          >
            Asignatura: {subjectGroup.subject}
          </Typography>

          <Chip
            label={`Total: ${subjectGroup.totalScore} / ${subjectGroup.totalMaxPoints} pts`}
            sx={{
              backgroundColor: COLORS.primary,
              color: '#fff',
              fontWeight: 'bold',
              mb: 2,
            }}
          />

          <Divider sx={{ mb: 2 }} />

          <Table
            size="small"
            sx={{
              minWidth: 750,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <TableHead>
              <TableRow sx={{ backgroundColor: COLORS.primary }}>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>N°</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Tema</TableCell>
                <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold' }}>
                  Puntaje
                </TableCell>
                <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold' }}>
                  Estado
                </TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>
                  Observación
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {subjectGroup.tasks.map((task, index) => (
                <TableRow key={task.taskId} hover>
                  <TableCell sx={{ border: `1px solid ${COLORS.border}` }}>
                    {index + 1}
                  </TableCell>

                  <TableCell
                    sx={{
                      border: `1px solid ${COLORS.border}`,
                      fontWeight: 600,
                    }}
                  >
                    {task.topic}
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      border: `1px solid ${COLORS.border}`,
                      fontWeight: 'bold',
                      color: COLORS.primary,
                    }}
                  >
                    {task.score} / {task.maxPoints}
                  </TableCell>

                  <TableCell align="center" sx={{ border: `1px solid ${COLORS.border}` }}>
                    <Chip
                      size="small"
                      label={
                        task.status === 'corregido'
                          ? 'Corregido'
                          : task.status === 'entregada'
                            ? 'Entregada'
                            : task.status === 'pendiente'
                              ? 'Pendiente'
                              : 'Sin registro'
                      }
                      color={
                        task.status === 'corregido'
                          ? 'success'
                          : task.status === 'entregada'
                            ? 'info'
                            : task.status === 'pendiente'
                              ? 'warning'
                              : 'default'
                      }
                    />
                  </TableCell>

                  <TableCell sx={{ border: `1px solid ${COLORS.border}` }}>
                    {task.comments || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      ))}
    </Box>
  );
}