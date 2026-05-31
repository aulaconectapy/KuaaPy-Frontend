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

const COLORS = {
  primary: '#7D0F15',
  primaryDark: '#5c080d',
  bg: '#F8FAFC',
  border: '#E2E8F0',
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
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress sx={{ color: COLORS.primary }} />
        <Typography sx={{ mt: 2 }}>Cargando calificaciones...</Typography>
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
        <Alert severity="info">No hay calificaciones para mostrar.</Alert>
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
              Mis calificaciones
            </Typography>

            <Typography sx={{ fontWeight: 600 }}>
              Estudiante: {report.student?.studentName}
            </Typography>

            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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

            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={() => router.push('/taskReport/taskReportStudent')}
                sx={{
                  backgroundColor: COLORS.primary,
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: COLORS.primaryDark,
                  },
                }}
              >
                Volver a mi proceso
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Paper
        elevation={2}
        sx={{
          borderRadius: 3,
          overflowX: 'auto',
        }}
      >
        <Table
          size="small"
          sx={{
            minWidth: 700,
          }}
        >
          <TableHead>
            <TableRow sx={{ backgroundColor: COLORS.primary }}>
              <TableCell
                sx={{
                  color: '#fff',
                  fontWeight: 'bold',
                  border: '1px solid #fff',
                }}
              >
                Asignatura
              </TableCell>

              <TableCell
                align="center"
                sx={{
                  color: '#fff',
                  fontWeight: 'bold',
                  border: '1px solid #fff',
                }}
              >
                Puntaje logrado
              </TableCell>

              <TableCell
                align="center"
                sx={{
                  color: '#fff',
                  fontWeight: 'bold',
                  border: '1px solid #fff',
                }}
              >
                Puntaje total
              </TableCell>

              <TableCell
                align="center"
                sx={{
                  color: '#fff',
                  fontWeight: 'bold',
                  border: '1px solid #fff',
                }}
              >
                Calificación
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {subjects.map(item => (
              <TableRow key={item.subject} hover>
                <TableCell
                  sx={{
                    border: `1px solid ${COLORS.border}`,
                    fontWeight: 600,
                  }}
                >
                  {item.subject}
                </TableCell>

                <TableCell
                  align="center"
                  sx={{
                    border: `1px solid ${COLORS.border}`,
                  }}
                >
                  {item.obtainedPoints}
                </TableCell>

                <TableCell
                  align="center"
                  sx={{
                    border: `1px solid ${COLORS.border}`,
                  }}
                >
                  {item.totalPoints}
                </TableCell>

                <TableCell
                  align="center"
                  sx={{
                    border: `1px solid ${COLORS.border}`,
                    fontWeight: 'bold',
                    color: COLORS.primary,
                    fontSize: '1.2rem',
                  }}
                >
                  {item.grade}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}