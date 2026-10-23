'use client';

import React, { useEffect, useMemo, useState } from 'react';
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

// CONSTANTES DE ESTILO KUAAPY
const COLORS = {
  primary: '#0038A8',     // Azul principal KuaaPy
  primaryDark: '#00257A', // Azul oscuro
  red: '#D52B1E',         // Acento rojo
  bg: '#F8FAFC',
  border: '#E2E8F0',
  gradient: 'linear-gradient(135deg, #0038A8 0%, #00257A 100%)'
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
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress sx={{ color: COLORS.primary }} />
        <Typography sx={{ mt: 2, fontWeight: 600, color: '#64748B' }}>Cargando tu proceso...</Typography>
      </Box>
    );
  }

  if (notStudent) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ borderRadius: '12px' }}>
          No eres un estudiante. Serás redirigido al dashboard.
        </Alert>
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

  if (!report) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" sx={{ borderRadius: '12px' }}>No hay datos para mostrar.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: COLORS.bg, minHeight: '100vh' }}>
      
      {/* Tarjeta de Encabezado / Perfil del Estudiante */}
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
          <Box
            component="img"
            src="/logo.png"
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
              KuaaPy Institución
            </Typography>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                color: '#0F172A',
                letterSpacing: '-0.02em',
                mb: 0.5
              }}
            >
              Mi Proceso Académico
            </Typography>

            <Typography variant="body1" sx={{ fontWeight: 700, color: '#475569', mb: 1.5 }}>
              Estudiante: {report.student?.studentName}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Chip
                label={`Grado: ${report.student?.grade}`}
                sx={{
                  backgroundColor: `${COLORS.primary}12`,
                  color: COLORS.primary,
                  fontWeight: 800,
                  borderRadius: '8px'
                }}
              />

              <Chip
                label={`Total general: ${generalTotal.score} / ${generalTotal.max} pts`}
                variant="outlined"
                sx={{
                  borderColor: COLORS.primary,
                  color: COLORS.primary,
                  fontWeight: 800,
                  borderRadius: '8px'
                }}
              />
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
          bgcolor: '#fff'
        }}
      >
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

      {filteredSubjects.length === 0 && (
        <Alert severity="info" sx={{ borderRadius: '12px' }}>
          No hay tareas sumativas cargadas para mostrar.
        </Alert>
      )}

      {filteredSubjects.map(subjectGroup => (
        <Paper
          key={subjectGroup.subject}
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 1.5 }}>
            <Typography
              variant="h6"
              sx={{
                color: COLORS.primary,
                fontWeight: 900,
                letterSpacing: '-0.01em'
              }}
            >
              Asignatura: {subjectGroup.subject}
            </Typography>

            <Chip
              label={`Total: ${subjectGroup.totalScore} / ${subjectGroup.totalMaxPoints} pts`}
              sx={{
                backgroundColor: `${COLORS.primary}12`,
                color: COLORS.primary,
                fontWeight: 800,
                borderRadius: '8px'
              }}
            />
          </Box>

          <Divider sx={{ mb: 3, borderColor: '#F1F5F9' }} />

          <Table
            size="small"
            sx={{
              minWidth: 750,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <TableHead>
              <TableRow sx={{ backgroundColor: COLORS.primary }}>
                <TableCell sx={{ color: '#fff', fontWeight: 900, p: 2 }}>N°</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 900, p: 2 }}>Tema</TableCell>
                <TableCell align="center" sx={{ color: '#fff', fontWeight: 900, p: 2 }}>
                  Puntaje
                </TableCell>
                <TableCell align="center" sx={{ color: '#fff', fontWeight: 900, p: 2 }}>
                  Estado
                </TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 900, p: 2 }}>
                  Observación
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {subjectGroup.tasks.map((task, index) => (
                <TableRow key={task.taskId} hover>
                  <TableCell sx={{ border: `1px solid ${COLORS.border}`, p: 2, fontWeight: 600 }}>
                    {index + 1}
                  </TableCell>

                  <TableCell
                    sx={{
                      border: `1px solid ${COLORS.border}`,
                      fontWeight: 700,
                      color: '#0F172A',
                      p: 2
                    }}
                  >
                    {task.topic}
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      border: `1px solid ${COLORS.border}`,
                      fontWeight: 900,
                      color: COLORS.primary,
                      p: 2
                    }}
                  >
                    {task.score} / {task.maxPoints}
                  </TableCell>

                  <TableCell align="center" sx={{ border: `1px solid ${COLORS.border}`, p: 2 }}>
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
                      sx={{
                        fontWeight: 800,
                        borderRadius: '6px',
                        bgcolor: task.status === 'corregido' ? '#DCFCE7' : task.status === 'entregada' ? '#E0F2FE' : '#FEF3C7',
                        color: task.status === 'corregido' ? '#166534' : task.status === 'entregada' ? '#0369A1' : '#B45309'
                      }}
                    />
                  </TableCell>

                  <TableCell sx={{ border: `1px solid ${COLORS.border}`, p: 2, color: '#475569', fontWeight: 500 }}>
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