'use client';

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTaskById, getStudentTasksByGrade } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
// IMPORTANTE: Asegúrate de que la ruta al archivo PDF sea correcta
import { generateTaskPDF } from "@/components/teacher/TaskReportPDF"; 

import {
  Box, Typography, CircularProgress, Paper, Stack, Chip,
  Accordion, AccordionSummary, AccordionDetails, IconButton,
  Container, Avatar, Grid, LinearProgress, Tooltip, Button, Divider
} from "@mui/material";

import {
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  Analytics as AnalyticsIcon,
  PictureAsPdf as PdfIcon 
} from '@mui/icons-material';

const COLORS = {
  primary: "#7D0F15",
  primaryLight: "#a31a20",
  bgLight: "#F8FAFC",
  border: "#E2E8F0",
  success: "#059669",
  pending: "#D97706"
};

export default function TaskSubmissionsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: loadingAuth } = useAuth();

  const [submissions, setSubmissions] = useState([]);
  const [taskInfo, setTaskInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // 🛡️ PROTECCIÓN DE RUTA
  useEffect(() => {
    if (!loadingAuth) {
      if (!user) {
        router.push("/login");
        return;
      }
      const role = user.role?.toLowerCase();
      const allowedRoles = ["director/a", "secretario/a", "secretaria", "docente", "administrador"];
      if (!allowedRoles.includes(role)) {
        router.push("/dashboard");
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, loadingAuth, router]);

  const canGrade = user?.role?.toLowerCase() === "docente";

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !isAuthorized) return;
      try {
        const taskData = await getTaskById(id);
        setTaskInfo(taskData);

        const studentTasks = await getStudentTasksByGrade(taskData.grade);
        const filtered = studentTasks.filter(st => st.task._id === id);
        setSubmissions(filtered);
      } catch (error) {
        console.error("Error al cargar entregas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isAuthorized]);

  const totalMaxScore = useMemo(() => {
    return taskInfo?.indicators?.reduce((acc, curr) => acc + (curr.points || 0), 0) || 0;
  }, [taskInfo]);

  const stats = useMemo(() => {
    const total = submissions.length;
    const corregidos = submissions.filter(s => s.status === "corregido").length;
    const promedio = total > 0 ? (submissions.reduce((acc, curr) => acc + (curr.score || 0), 0) / total).toFixed(1) : 0;
    const progreso = total > 0 ? (corregidos / total) * 100 : 0;
    return { total, corregidos, promedio, progreso };
  }, [submissions]);

  if (loadingAuth || !isAuthorized) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: 'center', height: '90vh', bgcolor: COLORS.bgLight }}>
        <CircularProgress thickness={5} sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 4 }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => router.back()}
            sx={{ color: '#64748B', fontWeight: 700, textTransform: 'none' }}
          >
            Volver a Tareas
          </Button>
        </Stack>

        {loading ? (
           <Box sx={{ textAlign: 'center', py: 10 }}><CircularProgress sx={{ color: COLORS.primary }} /></Box>
        ) : (
          <>
            <Paper 
              elevation={0} 
              sx={{ 
                p: { xs: 3, md: 5 }, mb: 5, borderRadius: 6, 
                background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)`, 
                color: 'white', boxShadow: '0 10px 25px -5px rgba(125, 15, 21, 0.3)'
              }}
            >
              <Grid container spacing={4} alignItems="center">
                <Grid item xs={12} md={7}>
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Chip label={taskInfo?.subject} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 800 }} />
                    <Chip label={`${taskInfo?.grade} Grado`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 800 }} />
                  </Stack>
                  <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-1.5px' }}>
                    {taskInfo?.topic || "Revisión de Tarea"}
                  </Typography>
                  <Typography sx={{ opacity: 0.9 }}>Seguimiento y gestión de indicadores de logro.</Typography>
                </Grid>

                <Grid item xs={12} md={5}>
                  <Box sx={{ bgcolor: 'rgba(0,0,0,0.15)', p: 3, borderRadius: 5, backdropFilter: 'blur(10px)' }}>
                    <Stack spacing={2}>
                      <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>REVISIÓN</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 900 }}>{Math.round(stats.progreso)}%</Typography>
                        </Stack>
                        <LinearProgress variant="determinate" value={stats.progreso} sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: 'white' } }} />
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>PROMEDIO</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 900 }}>{stats.promedio}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>TOTAL PUNTOS</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 900 }}>{totalMaxScore}</Typography>
                        </Grid>
                      </Grid>
                    </Stack>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <AnalyticsIcon sx={{ color: COLORS.primary }} />
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#1E293B' }}>Listado de Entregas</Typography>
              </Box>

              {/* BOTÓN DE DESCARGA PDF */}
              <Button
                variant="contained"
                startIcon={<PdfIcon />}
                onClick={async () => await generateTaskPDF(taskInfo, submissions, user)}
                sx={{ 
                  bgcolor: COLORS.primary, 
                  borderRadius: 3,
                  px: 3,
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': { bgcolor: COLORS.primaryLight },
                  boxShadow: '0 4px 12px rgba(125, 15, 21, 0.2)'
                }}
              >
                Descargar Planilla
              </Button>
            </Box>

            <Stack spacing={2}>
              {submissions.length === 0 ? (
                <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 6, border: `2px dashed ${COLORS.border}`, bgcolor: 'transparent' }}>
                  <Typography variant="h6" color="text.secondary">No hay alumnos registrados.</Typography>
                </Paper>
              ) : (
                submissions.map((sub) => {
                  const isCorregido = sub.status === "corregido";
                  return (
                    <Accordion 
                      key={sub._id} 
                      elevation={0} 
                      sx={{ 
                        borderRadius: '20px !important', border: `1px solid ${COLORS.border}`, 
                        '&:hover': { borderColor: COLORS.primary }, '&:before': { display: 'none' }, mb: 1 
                      }}
                    >
                      <AccordionSummary component="div" expandIcon={<ExpandMoreIcon sx={{ color: COLORS.primary }} />}>
                        <Grid container alignItems="center" spacing={2}>
                          <Grid item>
                            <Avatar sx={{ bgcolor: isCorregido ? `${COLORS.success}15` : `${COLORS.pending}15`, color: isCorregido ? COLORS.success : COLORS.pending }}>
                              <PersonIcon />
                            </Avatar>
                          </Grid>
                          <Grid item xs>
                            <Typography sx={{ fontWeight: 800 }}>{sub.student.firstName} {sub.student.lastName}</Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip 
                                label={isCorregido ? "CORREGIDO" : "PENDIENTE"} 
                                size="small" 
                                color={isCorregido ? "success" : "warning"} 
                                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 900 }} 
                              />
                              <Typography variant="caption" sx={{ fontWeight: 700, color: isCorregido ? COLORS.success : '#64748B' }}>
                                {sub.score || 0} / {totalMaxScore} pts obtenidos
                              </Typography>
                            </Stack>
                          </Grid>
                          
                          {canGrade && (
                            <Grid item>
                              <Box onClick={(e) => e.stopPropagation()}>
                                <Tooltip title={isCorregido ? "Editar Nota" : "Calificar"}>
                                  <IconButton
                                    onClick={() => router.push(`/teacher/classes/students/${sub._id}`)}
                                    sx={{ bgcolor: COLORS.primary, color: 'white', '&:hover': { bgcolor: COLORS.primaryLight } }}
                                  >
                                    {isCorregido ? <CheckCircleIcon fontSize="small" /> : <EditIcon fontSize="small" />}
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </AccordionSummary>
                      
                      <AccordionDetails sx={{ bgcolor: '#F8FAFC', p: 4, borderTop: `1px solid ${COLORS.border}` }}>
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: COLORS.primary }}>
                              Puntaje por Indicadores:
                            </Typography>
                            <Stack spacing={2}>
                              {sub.indicatorScores?.length > 0 ? (
                                sub.indicatorScores.map((indScore, idx) => {
                                  const indicatorData = taskInfo?.indicators?.find(
                                    (i) => (i._id === indScore.indicatorId?._id || i._id === indScore.indicatorId)
                                  );

                                  return (
                                    <Box key={idx}>
                                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                          {indicatorData?.description || indicatorData?.name || indScore.indicatorId?.name || "Indicador"}
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                          {indScore.points} / {indicatorData?.points || 1} pts
                                        </Typography>
                                      </Stack>
                                      <LinearProgress
                                        variant="determinate"
                                        value={(indScore.points / (indicatorData?.points || 1)) * 100}
                                        sx={{ 
                                          height: 6, borderRadius: 3, bgcolor: '#E2E8F0',
                                          '& .MuiLinearProgress-bar': { bgcolor: COLORS.primary }
                                        }}
                                      />
                                    </Box>
                                  );
                                })
                              ) : (
                                <Typography variant="body2" color="text.secondary">No hay indicadores evaluados.</Typography>
                              )}
                            </Stack>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 4, border: `1px solid ${COLORS.border}`, height: '100%' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Puntaje Final:</Typography>
                              <Stack direction="row" alignItems="baseline" spacing={1}>
                                <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.primary }}>{sub.score ?? 0}</Typography>
                                <Typography variant="h6" sx={{ color: '#64748B', fontWeight: 600 }}>/ {totalMaxScore} pts</Typography>
                              </Stack>
                              <Divider sx={{ my: 2 }} />
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Comentarios:</Typography>
                              <Typography variant="body2" sx={{ fontStyle: sub.comments ? 'normal' : 'italic' }}>
                                {sub.comments || "Sin observaciones todavía."}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  );
                })
              )}
            </Stack>
          </>
        )}
      </Container>
    </Box>
  );
}