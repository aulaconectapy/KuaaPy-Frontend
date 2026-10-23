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

export default function StudentCalificacionPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState('');
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
          'Error al cargar tus calificaciones.';

        setError(backendMessage);
      } finally {
        setLoadingReport(false);
      }
    };

    loadReport();
  }, [user]);

  const calculateGrade = (obtained, total) => {
    if (!total || total <= 0) return 1;

    const minimumPass = Math.floor(total * 0.7);

    if (obtained < minimumPass) return 1;
    if (obtained === minimumPass) return 2;

    const start = minimumPass + 1;
    const upperLimit = total;
    const range = upperLimit - start + 1;
    const baseInterval = Math.floor(range / 3);
    const remainder = range % 3;

    let currentStart = start;

    for (let grade = 3; grade <= 5; grade++) {
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

  const subjects = useMemo(() => {
    if (!report?.subjects) return [];

    return report.subjects.map(subject => {
      const obtainedPoints = subject.totalScore || 0;
      const totalPoints = subject.totalMaxPoints || 0;
      const grade = calculateGrade(obtainedPoints, totalPoints);

      return {
        subject: subject.subject,
        obtainedPoints,
        totalPoints,
        grade,
      };
    });
  }, [report]);

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
        <Typography sx={{ mt: 2, fontWeight: 600, color: '#64748B' }}>Cargando calificaciones...</Typography>
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
        <Alert severity="info" sx={{ borderRadius: '12px' }}>No hay calificaciones para mostrar.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: COLORS.bg, minHeight: '100vh' }}>
      
      {/* Tarjeta de Encabezado / Perfil */}
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
              variant="h4"
              sx={{
                fontWeight: 900,
                color: COLORS.primary,
                letterSpacing: '-0.02em',
                mb: 0.5
              }}
            >
              Mis Calificaciones - KuaaPy
            </Typography>

            <Typography variant="body1" sx={{ fontWeight: 700, color: '#0F172A', mb: 1.5 }}>
              Estudiante: {report.student?.studentName}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
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

            <Button
              variant="contained"
              onClick={() => router.push('/taskReport/taskReportStudent')}
              sx={{
                backgroundColor: COLORS.primary,
                borderRadius: '12px',
                fontWeight: 800,
                textTransform: 'none',
                boxShadow: '0 8px 20px rgba(0,56,168,0.2)',
                '&:hover': {
                  backgroundColor: COLORS.primaryDark,
                },
              }}
            >
              Volver a mi proceso
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Tabla de Calificaciones */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '24px',
          border: `1px solid ${COLORS.border}`,
          overflow: 'hidden',
          bgcolor: '#fff'
        }}
      >
        <Table
          size="small"
          sx={{
            minWidth: 700,
          }}
        >
          <TableHead>
            <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
              <TableCell
                sx={{
                  color: '#0F172A',
                  fontWeight: 900,
                  p: 2,
                  borderBottom: `1px solid ${COLORS.border}`
                }}
              >
                ASIGNATURA
              </TableCell>

              <TableCell
                align="center"
                sx={{
                  color: '#0F172A',
                  fontWeight: 900,
                  p: 2,
                  borderBottom: `1px solid ${COLORS.border}`
                }}
              >
                PUNTAJE LOGRADO
              </TableCell>

              <TableCell
                align="center"
                sx={{
                  color: '#0F172A',
                  fontWeight: 900,
                  p: 2,
                  borderBottom: `1px solid ${COLORS.border}`
                }}
              >
                PUNTAJE TOTAL
              </TableCell>

              <TableCell
                align="center"
                sx={{
                  color: '#0F172A',
                  fontWeight: 900,
                  p: 2,
                  borderBottom: `1px solid ${COLORS.border}`
                }}
              >
                CALIFICACIÓN
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {subjects.map(item => (
              <TableRow key={item.subject} hover>
                <TableCell
                  sx={{
                    borderColor: COLORS.border,
                    fontWeight: 700,
                    color: '#0F172A',
                    p: 2
                  }}
                >
                  {item.subject}
                </TableCell>

                <TableCell
                  align="center"
                  sx={{
                    borderColor: COLORS.border,
                    fontWeight: 600,
                    color: '#475569',
                    p: 2
                  }}
                >
                  {item.obtainedPoints}
                </TableCell>

                <TableCell
                  align="center"
                  sx={{
                    borderColor: COLORS.border,
                    fontWeight: 600,
                    color: '#475569',
                    p: 2
                  }}
                >
                  {item.totalPoints}
                </TableCell>

                <TableCell
                  align="center"
                  sx={{
                    borderColor: COLORS.border,
                    p: 2
                  }}
                >
                  <Chip
                    label={item.grade}
                    sx={{
                      fontWeight: 900,
                      backgroundColor: `${COLORS.primary}12`,
                      color: COLORS.primary,
                      fontSize: '1rem',
                      borderRadius: '8px',
                      minWidth: 40
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}

            {subjects.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                  <Typography sx={{ color: '#64748B', fontWeight: 600 }}>
                    No hay asignaturas registradas para este periodo.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}