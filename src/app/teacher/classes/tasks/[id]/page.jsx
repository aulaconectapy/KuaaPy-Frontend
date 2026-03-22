'use client';

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTaskById, getStudentTasksByGrade, updateStudentTask } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { generateTaskPDF } from "@/components/teacher/TaskReportPDF"; 

import {
  Box, Typography, CircularProgress, Paper, Stack, Button, Container, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, TextField, Grid, ToggleButton, ToggleButtonGroup
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
  PictureAsPdf as PdfIcon
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

  const isRubrica = taskInfo?.instrumentType === 'rubrica';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const taskData = await getTaskById(id);
        setTaskInfo(taskData);
        const studentTasks = await getStudentTasksByGrade(taskData.grade);
        
        // MODIFICACIÓN: Filtramos para que solo queden las tareas que tienen un estudiante existente
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

      const newScores = [...currentScores].filter(s => {
        const sId = s.indicatorId?._id || s.indicatorId || s._id;
        return isRubrica ? sId !== criterionId : !(sId === criterionId && s.moment === selectedMoment);
      });

      const newEntry = { 
        points, 
        moment: isRubrica ? 1 : selectedMoment 
      };

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
          status: "corregido"
        };

        if (isRubrica) {
          updateData.rubricScores = sub.rubricScores;
        } else {
          updateData.indicatorScores = sub.indicatorScores;
        }

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
    const timer = setInterval(() => { handleSaveAll(); }, 60000);
    return () => clearInterval(timer);
  }, [handleSaveAll]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress sx={{ color: COLORS.primary }} /></Box>;

  return (
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        
        {/* HEADER DE ACCIONES */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()} sx={{ color: '#64748B', fontWeight: 700 }}>Volver</Button>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ display: 'flex', alignItems: 'center', color: hasChanges ? '#D97706' : COLORS.success, mr: 2 }}>
              {saving ? <CircularProgress size={14} color="inherit" /> : hasChanges ? <SyncIcon sx={{ fontSize: 16 }} /> : <SavedIcon sx={{ fontSize: 16 }} />}
              <Typography variant="caption" sx={{ fontWeight: 800, ml: 1 }}>
                {saving ? "GUARDANDO..." : hasChanges ? "CAMBIOS PENDIENTES" : `SINCRONIZADO ${lastSaved || ""}`}
              </Typography>
            </Box>
            <Button variant="outlined" startIcon={<PdfIcon />} onClick={() => generateTaskPDF(taskInfo, submissions, user, selectedMoment)} sx={{ color: COLORS.primary, borderColor: COLORS.primary, fontWeight: 800, borderRadius: 2 }}>Exportar PDF</Button>
            <Button variant="contained" onClick={handleSaveAll} disabled={saving || !hasChanges} sx={{ bgcolor: COLORS.primary, borderRadius: 2, fontWeight: 800 }}>Guardar Ahora</Button>
          </Stack>
        </Stack>

        {/* INFO ACADÉMICA */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 4, border: `1px solid ${COLORS.border}` }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><Stack direction="row" spacing={2}><Box sx={{ p: 1, bgcolor: '#FFF1F2', borderRadius: 2 }}><SchoolIcon sx={{ color: COLORS.primary }} /></Box><Box><Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>GRADO</Typography><Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{taskInfo?.grade}</Typography></Box></Stack></Grid>
            <Grid item xs={12} md={4}><Stack direction="row" spacing={2}><Box sx={{ p: 1, bgcolor: '#F0F9FF', borderRadius: 2 }}><BookIcon sx={{ color: '#0369A1' }} /></Box><Box><Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>ASIGNATURA</Typography><Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{taskInfo?.subject || "General"}</Typography></Box></Stack></Grid>
            <Grid item xs={12} md={4}><Stack direction="row" spacing={2}><Box sx={{ p: 1, bgcolor: '#F0FDF4', borderRadius: 2 }}><TaskIcon sx={{ color: '#15803D' }} /></Box><Box><Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>TEMA</Typography><Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{taskInfo?.topic}</Typography></Box></Stack></Grid>
          </Grid>
        </Paper>

        {!isRubrica && taskInfo?.instrumentType === 'rsa' && (
          <ToggleButtonGroup value={selectedMoment} exclusive onChange={(_, v) => v && setSelectedMoment(v)} size="small" sx={{ mb: 2, bgcolor: 'white' }}>
            {[1, 2, 3].map(m => <ToggleButton key={m} value={m} sx={{ px: 3, fontWeight: 700 }}>Momento {m}</ToggleButton>)}
          </ToggleButtonGroup>
        )}

        <Paper sx={{ borderRadius: 4, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: '70vh' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell rowSpan={isRubrica ? 2 : 1} sx={{ fontWeight: 900, bgcolor: '#F8FAFC' }}>ESTUDIANTE</TableCell>
                  {isRubrica ? (
                    taskInfo?.rubricCriteria.map((crit) => (
                      <TableCell key={crit._id} colSpan={crit.levels.length} align="center" sx={{ fontWeight: 900, bgcolor: '#F1F5F9' }}>{crit.criterion.toUpperCase()}</TableCell>
                    ))
                  ) : (
                    taskInfo?.indicators.map((ind) => (
                      <TableCell key={ind._id} align="center" sx={{ fontWeight: 900, bgcolor: '#F8FAFC' }}>{ind.description.substring(0,30)}...</TableCell>
                    ))
                  )}
                  <TableCell rowSpan={isRubrica ? 2 : 1} align="center" sx={{ fontWeight: 900 }}>PUNTOS</TableCell>
                  <TableCell rowSpan={isRubrica ? 2 : 1} sx={{ fontWeight: 900 }}>OBSERVACIONES</TableCell>
                </TableRow>
                {isRubrica && (
                  <TableRow>
                    {taskInfo?.rubricCriteria.map((crit) =>
                      crit.levels.map((lvl) => (
                        <TableCell key={lvl._id} align="center">
                          <Stack spacing={0.3}>
                            <Typography sx={{ fontSize:11, fontWeight:900 }}>{lvl.level}</Typography>
                            <Typography sx={{ fontSize:10 }}>({lvl.points})</Typography>
                          </Stack>
                        </TableCell>
                      ))
                    )}
                  </TableRow>
                )}
              </TableHead>

              <TableBody>
                {submissions.map((sub) => (
                  <TableRow key={sub._id} hover>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                      {/* MODIFICACIÓN: Agregamos opcional chaining extra y valor por defecto */}
                      {sub.student?.lastName?.toUpperCase() || 'S/A'}, {sub.student?.firstName || 'Eliminado'}
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
                            <TableCell
                              key={lvl._id}
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
                              {isSelected ? <CheckIcon sx={{ color: COLORS.primary, fontSize: 20 }} /> : <UncheckedIcon sx={{ color: '#CBD5E1', fontSize: 20 }} />}
                            </TableCell>
                          );
                        });
                      })
                    ) : (
                      taskInfo?.indicators.map(ind => {
                        const score = sub.indicatorScores?.find((s) => {
                          const sId = s.indicatorId?._id || s.indicatorId || s._id;
                          return sId === ind._id && s.moment === selectedMoment;
                        });
                        return (
                          <TableCell key={ind._id} align="center">
                            <Stack direction="row" justifyContent="center" spacing={0.5}>
                              <IconButton size="small" onClick={() => handleCellChange(sub._id, ind._id, 1)} sx={{ color: score?.points === 1 ? COLORS.success : '#CBD5E1' }}>
                                <CheckIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleCellChange(sub._id, ind._id, 0)} sx={{ color: score?.points === 0 ? COLORS.error : '#CBD5E1' }}>
                                <UncheckedIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        );
                      })
                    )}

                    <TableCell align="center">
                      <Chip label={sub.score || 0} size="small" sx={{ fontWeight: 900, bgcolor: COLORS.primary, color: 'white', borderRadius: 1 }} />
                    </TableCell>

                    <TableCell>
                      <TextField
                        fullWidth size="small" variant="standard"
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