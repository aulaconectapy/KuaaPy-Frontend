'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getGeneralTaskReport } from '@/services/api';

import {
  generateCalificacionesPDF,
} from '@/components/teacher/CalificacionPdf';

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

export default function CalificacionesPage() {
  const { user, loading } = useAuth();

  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState('');
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

        const data = await getGeneralTaskReport(
          selectedGrade,
          institutionId
        );

        setReport(data);

      } catch (err) {
        console.error(err);
        setError('Error al cargar calificaciones');
      } finally {
        setLoadingReport(false);
      }
    };

    loadReport();
  }, [user, selectedGrade]);

  const groupedSubjects = useMemo(() => {
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

  if (loading || loadingReport) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress sx={{ color: COLORS.primary }} />
        <Typography sx={{ mt: 2, fontWeight: 600, color: '#64748B' }}>Cargando calificaciones...</Typography>
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
    return null;
  }

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        backgroundColor: COLORS.bg,
        minHeight: '100vh',
      }}
    >
      {/* Tarjeta de Encabezado Institucional */}
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
              {user?.institution?.name ||
                user?.institution?.institutionName ||
                user?.docente?.institution?.name ||
                'KuaaPy Institución'}
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
              Planilla General de Calificaciones
            </Typography>

            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                flexWrap: 'wrap',
                mb: 2.5,
              }}
            >
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
                label={`Docente: ${user?.firstName || ''} ${user?.lastName || ''}`}
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
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>Seleccionar grado</InputLabel>

                <Select
                  value={selectedGrade}
                  label="Seleccionar grado"
                  onChange={(e) =>
                    setSelectedGrade(e.target.value)
                  }
                  sx={{ borderRadius: '12px', bgcolor: '#fff' }}
                >
                  {availableGrades.map((grade) => (
                    <MenuItem
                      key={grade}
                      value={grade}
                    >
                      {grade}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                startIcon={<PictureAsPdfIcon />}
                onClick={() =>
                  generateCalificacionesPDF({
                    report,
                    groupedSubjects,
                    user,
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
                Generar PDF
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Tabla de Calificaciones Generales */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '24px',
          border: `1px solid ${COLORS.border}`,
          overflowX: 'auto',
          bgcolor: '#fff'
        }}
      >
        <Table
          size="small"
          sx={{
            minWidth: 1200,
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
                  minWidth: 250,
                  p: 2
                }}
              >
                ALUMNO
              </TableCell>

              {Object.entries(groupedSubjects).map(
                ([subject]) => (
                  <TableCell
                    key={subject}
                    colSpan={2}
                    align="center"
                    sx={{
                      color: '#fff',
                      fontWeight: 900,
                      border: '1px solid rgba(255,255,255,0.2)',
                      p: 2
                    }}
                  >
                    {subject}
                  </TableCell>
                )
              )}
            </TableRow>

            <TableRow
              sx={{
                backgroundColor: COLORS.primaryDark,
              }}
            >
              {Object.entries(groupedSubjects).map(
                ([subject, cols]) => {
                  const totalPoints = cols.reduce(
                    (sum, col) =>
                      sum + (col.maxPoints || 0),
                    0
                  );

                  return (
                    <React.Fragment key={subject}>
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
                        {totalPoints} pts
                      </TableCell>

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
                        Calif.
                      </TableCell>
                    </React.Fragment>
                  );
                }
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {report.rows.map((student) => (
              <TableRow key={student.studentId} hover>
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

                {Object.entries(groupedSubjects).map(
                  ([subject, cols]) => {
                    const obtainedPoints =
                      cols.reduce((sum, col) => {
                        return (
                          sum +
                          (student.scores?.[
                            col.taskId
                          ]?.score || 0)
                        );
                      }, 0);

                    const totalPoints =
                      cols.reduce((sum, col) => {
                        return (
                          sum +
                          (col.maxPoints || 0)
                        );
                      }, 0);

                    const grade =
                      calculateGrade(
                        obtainedPoints,
                        totalPoints
                      );

                    return (
                      <React.Fragment
                        key={`${student.studentId}-${subject}`}
                      >
                        <TableCell
                          align="center"
                          sx={{
                            border: `1px solid ${COLORS.border}`,
                            color: '#475569',
                            fontWeight: 600,
                            p: 2
                          }}
                        >
                          {obtainedPoints}
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{
                            border: `1px solid ${COLORS.border}`,
                            fontWeight: 900,
                            color: COLORS.primary,
                            fontSize: '1rem',
                            p: 2
                          }}
                        >
                          {grade}
                        </TableCell>
                      </React.Fragment>
                    );
                  }
                )}
              </TableRow>
            ))}

            {report.rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={Object.keys(groupedSubjects).length * 2 + 1} align="center" sx={{ py: 6 }}>
                  <Typography sx={{ color: '#64748B', fontWeight: 600 }}>
                    No hay estudiantes registrados para este grado.
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