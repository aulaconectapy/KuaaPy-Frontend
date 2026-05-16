'use client';

import React, { useEffect, useMemo, useState } from 'react';

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

const COLORS = {
  primary: '#7D0F15',
  primaryDark: '#5c080d',
  bg: '#F8FAFC',
  border: '#E2E8F0',
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
    if (total === 0) return 1;

    const percentage = (obtained / total) * 100;

    if (percentage >= 90) return 5;
    if (percentage >= 70) return 4;
    if (percentage >= 60) return 3;
    if (percentage >= 50) return 2;

    return 1;
  };

  if (loading || loadingReport) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress sx={{ color: COLORS.primary }} />
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
    return null;
  }

  return (
    <Box
      sx={{
        p: 3,
        backgroundColor: COLORS.bg,
        minHeight: '100vh',
      }}
    >
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
              {user?.institution?.name ||
                user?.institution?.institutionName ||
                user?.docente?.institution?.name ||
                'Colegio Privado María Auxiliadora'}
            </Typography>

            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
              }}
            >
              Planilla General de Calificaciones
            </Typography>

            <Box
              sx={{
                mt: 1,
                display: 'flex',
                gap: 1,
                flexWrap: 'wrap',
              }}
            >
              <Chip
                label={`Grado: ${selectedGrade}`}
                sx={{
                  backgroundColor: COLORS.primary,
                  color: '#fff',
                  fontWeight: 'bold',
                }}
              />

              <Chip
                label={`Docente: ${user?.firstName || ''} ${user?.lastName || ''}`}
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
                alignItems: 'center',
              }}
            >
              <FormControl sx={{ minWidth: 250 }}>
                <InputLabel>
                  Seleccionar grado
                </InputLabel>

                <Select
                  value={selectedGrade}
                  label="Seleccionar grado"
                  onChange={(e) =>
                    setSelectedGrade(e.target.value)
                  }
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
                  fontWeight: 'bold',
                  height: 56,

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
            minWidth: 1200,
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
                  minWidth: 250,
                }}
              >
                Alumno
              </TableCell>

              {Object.entries(groupedSubjects).map(
                ([subject]) => (
                  <TableCell
                    key={subject}
                    colSpan={2}
                    align="center"
                    sx={{
                      color: '#fff',
                      fontWeight: 'bold',
                      border: '1px solid #fff',
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
                          fontWeight: 'bold',
                          border: '1px solid #fff',
                        }}
                      >
                        {totalPoints} pts
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{
                          color: '#fff',
                          fontWeight: 'bold',
                          border: '1px solid #fff',
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
              <TableRow key={student.studentId}>
                <TableCell
                  sx={{
                    border: `1px solid ${COLORS.border}`,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
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
                          }}
                        >
                          {obtainedPoints}
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{
                            border: `1px solid ${COLORS.border}`,
                            fontWeight: 'bold',
                            color: COLORS.primary,
                            fontSize: '1rem',
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
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}