'use client';

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTaskById, getStudentTasksByGrade } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Stack,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Container,
  Avatar,
  Grid,
  LinearProgress,
  Tooltip,
  Button
} from "@mui/material";

import {
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

export default function TaskSubmissionsPage() {

  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [submissions, setSubmissions] = useState([]);
  const [taskInfo, setTaskInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🎓 Roles
  const isTeacher = user?.role === "docente";
  const canGrade = isTeacher;

  // 📚 Cargar datos
  useEffect(() => {
    const fetchData = async () => {
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
    if (id) fetchData();
  }, [id]);

  // 📊 Estadísticas
  const stats = useMemo(() => {
    const total = submissions.length;
    const corregidos = submissions.filter(s => s.status === "corregido").length;
    const promedio = total > 0 ? (submissions.reduce((acc, curr) => acc + (curr.score || 0), 0) / total).toFixed(1) : 0;
    const progreso = total > 0 ? (corregidos / total) * 100 : 0;
    return { total, corregidos, promedio, progreso };
  }, [submissions]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: 'center', height: '80vh' }}>
        <CircularProgress thickness={5} sx={{ color: '#1A365D' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>

      {/* VOLVER */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.back()}
        sx={{ mb: 3, color: '#64748B', fontWeight: 700, textTransform: 'none' }}
      >
        Volver a Tareas
      </Button>

      {/* DASHBOARD */}
      <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, mb: 4, borderRadius: 8, bgcolor: '#1A365D', color: 'white' }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={7}>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip label={taskInfo?.subject} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 800 }} />
              <Chip label={`${taskInfo?.grade} Grado`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 800 }} />
            </Stack>

            <Typography variant="h3" sx={{ fontWeight: 950, mb: 1 }}>
              {taskInfo?.topic || "Panel de Entregas"}
            </Typography>
            <Typography sx={{ opacity: 0.8 }}>
              Revisión y seguimiento de actividades.
            </Typography>
          </Grid>

          <Grid item xs={12} md={5}>
            <Stack spacing={2} sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 3, borderRadius: 6 }}>
              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2">Progreso</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 900 }}>{Math.round(stats.progreso)}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={stats.progreso} sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.1)' }} />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption">PROMEDIO</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900 }}>{stats.promedio}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption">REVISADOS</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900 }}>{stats.corregidos}/{stats.total}</Typography>
                </Grid>
              </Grid>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* LISTA DE ENTREGAS */}
      <Stack spacing={2}>
        <Typography variant="h5" sx={{ fontWeight: 900, color: '#1E293B' }}>
          Lista de Entregas
        </Typography>

        {submissions.length === 0 ? (
          <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No hay alumnos registrados en esta tarea.
            </Typography>
          </Paper>
        ) : (
          submissions.map((sub) => {
            const isCorregido = sub.status === "corregido";

            return (
              <Accordion key={sub._id} elevation={0} sx={{ borderRadius: '24px !important', border: '1px solid #E2E8F0', '&:before': { display: 'none' }, mb: 2 }}>
                
                <AccordionSummary expandIcon={<ExpandMoreIcon />} component="div">
                  <Stack direction="row" spacing={3} alignItems="center" sx={{ width: '100%' }}>
                    <Avatar sx={{ bgcolor: isCorregido ? '#38A169' : '#ED8936' }}>
                      <PersonIcon />
                    </Avatar>

                    <Box sx={{ flexGrow: 1 }}>
                      <Typography sx={{ fontWeight: 800 }}>
                        {sub.student.firstName} {sub.student.lastName}
                      </Typography>
                      <Chip label={isCorregido ? "CORREGIDO" : "PENDIENTE"} size="small" />
                    </Box>

                    {canGrade && (
                      <Box onClick={(e) => e.stopPropagation()}>
                        <Tooltip title={isCorregido ? "Editar Nota" : "Calificar"}>
                          <IconButton
                            onClick={() => router.push(`/teacher/classes/students/${sub._id}`)}
                            sx={{ bgcolor: '#1A365D', color: 'white' }}
                          >
                            {isCorregido ? <CheckCircleIcon fontSize="small" /> : <EditIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </Stack>
                </AccordionSummary>

                {/* ⚡ Detalles de la tarea */}
                <AccordionDetails sx={{ bgcolor: '#F8FAFC', p: 4 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Puntaje Total:</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>{sub.score ?? "Sin puntaje asignado"}</Typography>

                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Puntaje por Indicadores:</Typography>
                  {sub.indicatorScores?.length > 0 ? (
                    sub.indicatorScores.map((ind, idx) => {
                      console.log("Indicador recibido:", ind); // 👈 Para revisar cómo llega cada indicador
                      return (
                        <Box key={idx} sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            {ind.indicatorId?.name || "Indicador desconocido"} : {ind.points} pts
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={(ind.points / 1) * 100} // Ajustar según máximo
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                      );
                    })
                  ) : (
                    <Typography variant="body2">No hay indicadores asignados</Typography>
                  )}

                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 2 }}>Comentarios:</Typography>
                  <Typography variant="body2">{sub.comments || "Sin observaciones todavía."}</Typography>
                </AccordionDetails>
              </Accordion>
            );
          })
        )}
      </Stack>
    </Container>
  );
}