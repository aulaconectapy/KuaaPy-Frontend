'use client';

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTaskById, getStudentTasksByGrade, updateStudentTask } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { generateTaskPDF } from "@/components/teacher/TaskReportPDF";

import {
  Box, Typography, CircularProgress, Paper, Stack, Button, Container,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, TextField, Grid, ToggleButton, ToggleButtonGroup,
  Tooltip, Menu, MenuItem
} from "@mui/material";

import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
  School as SchoolIcon,
  Book as BookIcon,
  Assignment as TaskIcon,
  CloudDone as SavedIcon,
  Sync as SyncIcon,
  PictureAsPdf as PdfIcon,
  MoreVert as MoreIcon,
  DeleteSweep as ClearIcon,
  DoneAll as DoneAllIcon,
  ArrowDownward as DownIcon
} from '@mui/icons-material';

const COLORS = {
  primary: "#7D0F15",
  success: "#059669",
  error: "#DC2626",
  bgLight: "#F8FAFC",
  border: "#E2E8F0"
};

export default function TaskSubmissionsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [submissions, setSubmissions] = useState([]);
  const [taskInfo, setTaskInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [selectedMoment, setSelectedMoment] = useState(3);
  const [anchorEl, setAnchorEl] = useState(null);
  const [focusedCell, setFocusedCell] = useState(null);

  const isRubrica = taskInfo?.instrumentType === 'rubrica';

  const getIndicatorMaxPoints = (ind) => {
    return Number(ind?.points || ind?.score || ind?.value || 1);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const taskData = await getTaskById(id);
        setTaskInfo(taskData);

        const studentTasks = await getStudentTasksByGrade(taskData.grade);

        const filtered = studentTasks.filter(st =>
          (st.task?._id || st.task) === id && st.student !== null
        );

        setSubmissions(filtered);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const calculateInstantScore = (scores) => {
    if (!scores) return 0;

    return scores
      .filter(s => isRubrica ? true : s.moment === selectedMoment)
      .reduce((acc, curr) => acc + (Number(curr.points) || 0), 0);
  };

  const handleCellChange = (submissionId, criterionId, points) => {
    setHasChanges(true);

    setSubmissions(prev => prev.map(sub => {
      if (sub._id !== submissionId) return sub;

      const currentScores = isRubrica ? (sub.rubricScores || []) : (sub.indicatorScores || []);

      const existingScore = currentScores.find(s => {
        const sId = s.indicatorId?._id || s.indicatorId || s._id;
        return isRubrica ? sId === criterionId : (sId === criterionId && s.moment === selectedMoment);
      });

      if (isRubrica && existingScore && Number(existingScore.points) === Number(points)) {
        const clearedScores = currentScores.filter(s => {
          const sId = s.indicatorId?._id || s.indicatorId || s._id;
          return sId !== criterionId;
        });

        return {
          ...sub,
          rubricScores: clearedScores,
          score: calculateInstantScore(clearedScores)
        };
      }

      const newScores = currentScores.filter(s => {
        const sId = s.indicatorId?._id || s.indicatorId || s._id;
        return isRubrica ? sId !== criterionId : !(sId === criterionId && s.moment === selectedMoment);
      });

      const newEntry = { points: Number(points), moment: isRubrica ? 1 : selectedMoment };

      if (isRubrica) {
        newEntry._id = criterionId;
      } else {
        newEntry.indicatorId = criterionId;
      }

      newScores.push(newEntry);

      return {
        ...sub,
        [isRubrica ? 'rubricScores' : 'indicatorScores']: newScores,
        score: calculateInstantScore(newScores)
      };
    }));
  };

  const handleColumnAction = (criterionId, points) => {
    setHasChanges(true);

    const allAlreadyMarked = submissions.every(sub => {
      const currentScores = isRubrica ? (sub.rubricScores || []) : (sub.indicatorScores || []);

      return currentScores.some(s => {
        const sId = s.indicatorId?._id || s.indicatorId || s._id;
        const matchesId = sId === criterionId;
        const matchesMoment = isRubrica ? true : s.moment === selectedMoment;

        return matchesId && matchesMoment && Number(s.points) === Number(points);
      });
    });

    setSubmissions(prev => prev.map(sub => {
      const currentScores = isRubrica ? (sub.rubricScores || []) : (sub.indicatorScores || []);

      const filteredScores = currentScores.filter(s => {
        const sId = s.indicatorId?._id || s.indicatorId || s._id;
        return isRubrica ? sId !== criterionId : !(sId === criterionId && s.moment === selectedMoment);
      });

      let newScores;

      if (allAlreadyMarked) {
        newScores = filteredScores;
      } else {
        const newEntry = { points: Number(points), moment: isRubrica ? 1 : selectedMoment };

        if (isRubrica) {
          newEntry._id = criterionId;
        } else {
          newEntry.indicatorId = criterionId;
        }

        newScores = [...filteredScores, newEntry];
      }

      return {
        ...sub,
        [isRubrica ? 'rubricScores' : 'indicatorScores']: newScores,
        score: calculateInstantScore(newScores)
      };
    }));
  };

  const handleBulkAction = (type) => {
    setHasChanges(true);

    setSubmissions(prev => prev.map(sub => {
      let newScores = [];

      if (type === 'all') {
        if (isRubrica) {
          newScores = taskInfo.rubricCriteria.map(crit => ({
            _id: crit._id,
            points: Math.max(...crit.levels.map(l => Number(l.points) || 0)),
            moment: 1
          }));
        } else {
          newScores = taskInfo.indicators.map(ind => ({
            indicatorId: ind._id,
            points: getIndicatorMaxPoints(ind),
            moment: selectedMoment
          }));
        }
      } else {
        newScores = [];
      }

      return {
        ...sub,
        [isRubrica ? 'rubricScores' : 'indicatorScores']: newScores,
        score: calculateInstantScore(newScores)
      };
    }));

    setAnchorEl(null);
  };

  const handleStudentToggle = (submissionId) => {
    setHasChanges(true);

    setSubmissions(prev => prev.map(sub => {
      if (sub._id !== submissionId) return sub;

      const currentScores = isRubrica ? (sub.rubricScores || []) : (sub.indicatorScores || []);

      let allMarked = false;
      let newScores = [];

      if (isRubrica) {
        allMarked = taskInfo.rubricCriteria.every(crit => {
          const maxPoints = Math.max(...crit.levels.map(l => Number(l.points) || 0));

          return currentScores.some(s => {
            const sId = s.indicatorId?._id || s.indicatorId || s._id;
            return sId === crit._id && Number(s.points) === maxPoints;
          });
        });

        newScores = allMarked
          ? []
          : taskInfo.rubricCriteria.map(crit => ({
              _id: crit._id,
              points: Math.max(...crit.levels.map(l => Number(l.points) || 0)),
              moment: 1
            }));
      } else {
        allMarked = taskInfo.indicators.every(ind => {
          const maxPoints = getIndicatorMaxPoints(ind);

          return currentScores.some(s => {
            const sId = s.indicatorId?._id || s.indicatorId || s._id;
            return sId === ind._id && s.moment === selectedMoment && Number(s.points) === maxPoints;
          });
        });

        const otherMomentScores = currentScores.filter(s => s.moment !== selectedMoment);

        newScores = allMarked
          ? otherMomentScores
          : [
              ...otherMomentScores,
              ...taskInfo.indicators.map(ind => ({
                indicatorId: ind._id,
                points: getIndicatorMaxPoints(ind),
                moment: selectedMoment
              }))
            ];
      }

      return {
        ...sub,
        [isRubrica ? 'rubricScores' : 'indicatorScores']: newScores,
        score: calculateInstantScore(newScores)
      };
    }));
  };

  const handleCommentChange = (submissionId, text) => {
    setHasChanges(true);

    setSubmissions(prev => prev.map(sub =>
      sub._id === submissionId ? { ...sub, comments: text } : sub
    ));
  };

  const handleSaveAll = useCallback(async () => {
    if (!hasChanges || saving) return;

    setSaving(true);

    try {
      const promises = submissions.map(sub => {
        const updateData = {
          comments: sub.comments,
          score: sub.score,
          status: "corregido",
          [isRubrica ? 'rubricScores' : 'indicatorScores']: isRubrica ? sub.rubricScores : sub.indicatorScores
        };

        return updateStudentTask(sub._id, updateData);
      });

      await Promise.all(promises);

      setHasChanges(false);
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setSaving(false);
    }
  }, [submissions, hasChanges, saving, isRubrica]);

  useEffect(() => {
    const timer = setInterval(() => {
      handleSaveAll();
    }, 60000);

    return () => clearInterval(timer);
  }, [handleSaveAll]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.back()}
            sx={{ color: '#64748B', fontWeight: 700 }}
          >
            Volver
          </Button>

          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ display: 'flex', alignItems: 'center', color: hasChanges ? '#D97706' : COLORS.success, mr: 2 }}>
              {saving ? (
                <CircularProgress size={14} color="inherit" />
              ) : hasChanges ? (
                <SyncIcon sx={{ fontSize: 16 }} />
              ) : (
                <SavedIcon sx={{ fontSize: 16 }} />
              )}

              <Typography variant="caption" sx={{ fontWeight: 800, ml: 1 }}>
                {saving ? "GUARDANDO..." : hasChanges ? "CAMBIOS PENDIENTES" : `SINCRONIZADO ${lastSaved || ""}`}
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={<MoreIcon />}
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ borderRadius: 2, fontWeight: 800 }}
            >
              Acciones
            </Button>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
              <MenuItem onClick={() => handleBulkAction('all')} sx={{ gap: 1, fontWeight: 600 }}>
                <DoneAllIcon fontSize="small" color="success" />
                Marcar Todo Máximo
              </MenuItem>

              <MenuItem onClick={() => handleBulkAction('clear')} sx={{ gap: 1, fontWeight: 600, color: COLORS.error }}>
                <ClearIcon fontSize="small" />
                Desmarcar Todo
              </MenuItem>
            </Menu>

            <Button
              variant="outlined"
              startIcon={<PdfIcon />}
              onClick={() => generateTaskPDF(taskInfo, submissions, user, selectedMoment)}
              sx={{ color: COLORS.primary, borderColor: COLORS.primary, fontWeight: 800, borderRadius: 2 }}
            >
              Exportar PDF
            </Button>

            <Button
              variant="contained"
              onClick={handleSaveAll}
              disabled={saving || !hasChanges}
              sx={{ bgcolor: COLORS.primary, borderRadius: 2, fontWeight: 800 }}
            >
              Guardar Ahora
            </Button>
          </Stack>
        </Stack>

        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 4, border: `1px solid ${COLORS.border}` }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={2}>
                <Box sx={{ p: 1, bgcolor: '#FFF1F2', borderRadius: 2 }}>
                  <SchoolIcon sx={{ color: COLORS.primary }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>GRADO</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{taskInfo?.grade}</Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={2}>
                <Box sx={{ p: 1, bgcolor: '#F0F9FF', borderRadius: 2 }}>
                  <BookIcon sx={{ color: '#0369A1' }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>ASIGNATURA</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{taskInfo?.subject || "General"}</Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={2}>
                <Box sx={{ p: 1, bgcolor: '#F0FDF4', borderRadius: 2 }}>
                  <TaskIcon sx={{ color: '#15803D' }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>TEMA</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{taskInfo?.topic}</Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {!isRubrica && taskInfo?.instrumentType === 'rsa' && (
          <ToggleButtonGroup
            value={selectedMoment}
            exclusive
            onChange={(_, v) => v && setSelectedMoment(v)}
            size="small"
            sx={{ mb: 2, bgcolor: 'white' }}
          >
            {[1, 2, 3].map(m => (
              <ToggleButton key={m} value={m} sx={{ px: 3, fontWeight: 700 }}>
                Momento {m}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}

        <Paper sx={{ borderRadius: 4, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: '70vh' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell rowSpan={isRubrica ? 3 : 2} sx={{ fontWeight: 900, bgcolor: '#F8FAFC' }}>
                    ESTUDIANTE
                  </TableCell>

                  {isRubrica ? (
                    taskInfo?.rubricCriteria.map((crit) => (
                      <TableCell
                        key={crit._id}
                        colSpan={crit.levels.length}
                        align="center"
                        sx={{ fontWeight: 900, bgcolor: '#F1F5F9' }}
                      >
                        {crit.criterion.toUpperCase()}
                      </TableCell>
                    ))
                  ) : (
                    taskInfo?.indicators.map((ind) => {
                      const maxPoints = getIndicatorMaxPoints(ind);

                      return (
                        <TableCell
                          key={`header-${ind._id}`}
                          align="center"
                          sx={{ fontWeight: 900, bgcolor: '#F8FAFC', minWidth: 110 }}
                        >
                          <Stack alignItems="center">
                            <Tooltip title={`Poner ${maxPoints} puntos a todos en este indicador`}>
                              <IconButton
                                size="small"
                                onClick={() => handleColumnAction(ind._id, maxPoints)}
                                sx={{ color: COLORS.success, mb: 0.5 }}
                              >
                                <DownIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                              {(ind?.description || "").substring(0, 25)}...
                            </Typography>

                            <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 900, color: COLORS.primary }}>
                              Máx: {maxPoints} pts
                            </Typography>
                          </Stack>
                        </TableCell>
                      );
                    })
                  )}

                  <TableCell rowSpan={isRubrica ? 3 : 2} align="center" sx={{ fontWeight: 900 }}>
                    PUNTOS
                  </TableCell>

                  <TableCell rowSpan={isRubrica ? 3 : 2} sx={{ fontWeight: 900 }}>
                    OBSERVACIONES
                  </TableCell>
                </TableRow>

                {isRubrica && (
                  <>
                    <TableRow>
                      {taskInfo?.rubricCriteria.map((crit) =>
                        crit.levels.map((lvl) => (
                          <TableCell key={`col-btn-${crit._id}-${lvl._id}`} align="center" sx={{ py: 0, bgcolor: '#F8FAFC' }}>
                            <Tooltip title={`Alternar todos como ${lvl.level}`}>
                              <IconButton
                                size="small"
                                onClick={() => handleColumnAction(crit._id, lvl.points)}
                                sx={{ color: COLORS.primary }}
                              >
                                <DownIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        ))
                      )}
                    </TableRow>

                    <TableRow>
                      {taskInfo?.rubricCriteria.map((crit) =>
                        crit.levels.map((lvl) => (
                          <TableCell key={`level-${crit._id}-${lvl._id}`} align="center">
                            <Stack spacing={0.3}>
                              <Typography sx={{ fontSize: 10, fontWeight: 900 }}>{lvl.level}</Typography>
                              <Typography sx={{ fontSize: 9 }}>({lvl.points})</Typography>
                            </Stack>
                          </TableCell>
                        ))
                      )}
                    </TableRow>
                  </>
                )}
              </TableHead>

              <TableBody>
                {submissions.map((sub) => (
                  <TableRow key={sub._id} hover>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Tooltip title="Marcar todo o poner en cero a este alumno">
                          <IconButton
                            size="small"
                            onClick={() => handleStudentToggle(sub._id)}
                            sx={{ color: COLORS.primary }}
                          >
                            <DoneAllIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Box
                          onClick={() => handleStudentToggle(sub._id)}
                          sx={{ cursor: 'pointer' }}
                        >
                          {sub.student?.lastName?.toUpperCase() || 'S/A'}, {sub.student?.firstName || 'Eliminado'}
                        </Box>
                      </Stack>
                    </TableCell>

                    {isRubrica ? (
                      taskInfo?.rubricCriteria.map((crit) => {
                        const score = sub.rubricScores?.find((s) => {
                          const sId = s.indicatorId?._id || s.indicatorId || s._id;
                          return sId === crit._id;
                        });

                        return crit.levels.map((lvl) => {
                          const isSelected = score && Number(score.points) === Number(lvl.points);

                          return (
                            <Tooltip key={`${sub._id}-${crit._id}-${lvl._id}`} title={lvl.descriptor || "Sin descripción"} arrow placement="top">
                              <TableCell
                                align="center"
                                onClick={() => handleCellChange(sub._id, crit._id, lvl.points)}
                                sx={{
                                  cursor: 'pointer',
                                  bgcolor: isSelected ? '#FFF1F2' : 'inherit',
                                  borderLeft: lvl === crit.levels[0] ? '1px solid #E2E8F0' : 'none',
                                  transition: '0.2s',
                                  '&:hover': { bgcolor: '#F1F5F9' }
                                }}
                              >
                                {isSelected ? (
                                  <CheckIcon sx={{ color: COLORS.primary, fontSize: 20 }} />
                                ) : (
                                  <UncheckedIcon sx={{ color: '#CBD5E1', fontSize: 20 }} />
                                )}
                              </TableCell>
                            </Tooltip>
                          );
                        });
                      })
                    ) : (
                      taskInfo?.indicators.map(ind => {
                        const maxPoints = getIndicatorMaxPoints(ind);

                        const score = sub.indicatorScores?.find((s) => {
                          const sId = s.indicatorId?._id || s.indicatorId || s._id;
                          return sId === ind._id && s.moment === selectedMoment;
                        });

                        const currentValue = score?.points ?? 0;
                        const cellKey = `${sub._id}-${ind._id}`;

                        return (
                          <TableCell key={cellKey} align="center">
                            <TextField
                              type="number"
                              size="small"
                              value={focusedCell === cellKey && currentValue === 0 ? "" : currentValue}
                              onFocus={() => setFocusedCell(cellKey)}
                              onBlur={() => setFocusedCell(null)}
                              onChange={(e) => {
                                let value = Number(e.target.value);

                                if (e.target.value === "") value = 0;
                                if (Number.isNaN(value)) value = 0;
                                if (value < 0) value = 0;
                                if (value > maxPoints) value = maxPoints;

                                handleCellChange(sub._id, ind._id, value);
                              }}
                              inputProps={{
                                min: 0,
                                max: maxPoints,
                                style: {
                                  textAlign: "center",
                                  width: "55px",
                                  fontWeight: 800,
                                  padding: "6px"
                                }
                              }}
                              sx={{
                                '& input[type=number]': {
                                  MozAppearance: 'textfield',
                                },
                                '& input[type=number]::-webkit-outer-spin-button': {
                                  WebkitAppearance: 'auto',
                                  margin: 0,
                                },
                                '& input[type=number]::-webkit-inner-spin-button': {
                                  WebkitAppearance: 'auto',
                                  margin: 0,
                                },
                              }}
                            />
                          </TableCell>
                        );
                      })
                    )}

                    <TableCell align="center">
                      <Chip
                        label={sub.score || 0}
                        size="small"
                        sx={{ fontWeight: 900, bgcolor: COLORS.primary, color: 'white', borderRadius: 1 }}
                      />
                    </TableCell>

                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        variant="standard"
                        value={sub.comments || ""}
                        onChange={(e) => handleCommentChange(sub._id, e.target.value)}
                        InputProps={{ disableUnderline: true, style: { fontSize: '0.75rem' } }}
                        sx={{ bgcolor: '#F1F5F9', px: 1, py: 0.5, borderRadius: 2 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </Box>
  );
}