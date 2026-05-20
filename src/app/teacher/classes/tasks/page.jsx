'use client';

import { useEffect, useState, useMemo } from "react";
import {
  Box, Typography, Paper, Stack, Select, MenuItem, Button,
  CircularProgress, FormControl, InputLabel, Chip, Container,
  Grid, IconButton, Tooltip, Avatar, Snackbar, Alert, Fade,
  TextField, InputAdornment, useTheme, useMediaQuery
} from "@mui/material";

import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Assignment as AssignmentIcon, Event as EventIcon, 
  ChevronRight as ChevronRightIcon, Search as SearchIcon,
  School as SchoolIcon, PictureAsPdf as PdfIcon,
  BarChart as BarChartIcon, WhatsApp as WhatsAppIcon
} from "@mui/icons-material";

import { getTasks, deleteTask, updateTask, getStudentTasksByGrade } from "@/services/api";
import { generateTaskPDF } from "@/components/teacher/TaskReportPDF"; 
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function TasksPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [generatingPdfId, setGeneratingPdfId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const COLORS = {
    primary: "#7D0F15",
    primaryLight: "#a31a20",
    bgLight: "#F8FAFC",
    border: "#E2E8F0"
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!authLoading && user) {
      const allowedRoles = ["director/a", "secretario/a", "secretaria", "docente", "administrador"];
      if (!allowedRoles.includes(user.role?.toLowerCase())) router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await getTasks();
        setTasks(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const handleDownloadPDF = async (task) => {
    setGeneratingPdfId(task._id);
    try {
      const studentTasks = await getStudentTasksByGrade(task.grade);
      const filteredSubmissions = studentTasks.filter(st => st.task._id === task._id || st.task === task._id);
      
      if (filteredSubmissions.length === 0) {
        setSnackbar({ open: true, message: "No hay alumnos registrados en este grado para generar el PDF", severity: "warning" });
        return;
      }

      await generateTaskPDF(task, filteredSubmissions, user);
      setSnackbar({ open: true, message: "PDF generado correctamente", severity: "success" });
    } catch (error) {
      console.error("Error generating PDF:", error);
      setSnackbar({ open: true, message: "Error al generar el PDF", severity: "error" });
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm("¿Seguro que deseas eliminar esta tarea?")) return;
    const previousTasks = tasks;
    setTasks(prev => prev.filter(t => t._id !== taskId));
    try {
      await deleteTask(taskId);
      setSnackbar({ open: true, message: "Tarea eliminada correctamente", severity: "success" });
    } catch (error) {
      setTasks(previousTasks);
      setSnackbar({ open: true, message: "Error al eliminar la tarea", severity: "error" });
    }
  };

  const handleSendWhatsApp = (task) => {
    const formatDate = (date) => new Date(date).toLocaleDateString();
    const message = `*Copia de tarea escolar*\n\nEstimadas familias:\n\nSe comparte la actividad: *${task.topic}*\nAsignatura: ${task.subject}\nFecha de entrega: ${formatDate(task.dueDate)}\n\nConsigna: ${task.consigna || "Ver plataforma"}\n\nDocente: ${user?.firstName || ""} ${user?.lastName || ""}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const isTeacher = user?.role?.toLowerCase() === "docente";
  const isAdmin = ["director/a", "secretario/a", "secretaria", "administrador"].includes(user?.role?.toLowerCase());

  const filteredTasks = useMemo(() => {
    if (!user) return [];
    return tasks.filter(task => {
      const matchesSearch = task.topic.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject = filterSubject ? task.subject === filterSubject : true;
      const matchesGrade = filterGrade ? task.grade === filterGrade : true;

      let accessGranted = false;
      if (isAdmin) {
        accessGranted = true;
      } else if (isTeacher) {
        const sameGrade = Array.isArray(user.grades) && user.grades.includes(task.grade);
        const taskInstId = task.institution?._id || task.institution;
        const userInstId = user.institution?._id || user.institution;
        accessGranted = sameGrade && String(taskInstId) === String(userInstId);
      }
      return matchesSearch && matchesSubject && matchesGrade && accessGranted;
    });
  }, [tasks, searchTerm, filterSubject, filterGrade, user, isAdmin, isTeacher]);

  const uniqueSubjects = useMemo(() => Array.from(new Set(tasks.map(t => t.subject))), [tasks]);
  const uniqueGrades = useMemo(() => Array.from(new Set(tasks.map(t => t.grade))), [tasks]);

  if (loading || authLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: 'center', height: '80vh' }}>
        <CircularProgress thickness={5} sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: '100vh', py: { xs: 2, md: 5 } }}>
      <Container maxWidth="lg">
        {/* ENCABEZADO ADAPTABLE */}
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          justifyContent="space-between" 
          alignItems={{ xs: 'stretch', md: 'center' }} 
          spacing={3} 
          sx={{ mb: 4 }}
        >
          <Box>
            <Typography variant={isMobile ? "h4" : "h3"} sx={{ fontWeight: 900, color: COLORS.primary, letterSpacing: '-1px', mb: 1 }}>
              Académico
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <SchoolIcon sx={{ color: COLORS.primary, fontSize: 18 }} />
              <Typography variant="subtitle2" sx={{ color: '#1E293B', fontWeight: 700 }}>
                {user?.institution?.name || "C.P. María Auxiliadora"}
              </Typography>
            </Stack>
          </Box>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="outlined"
              fullWidth={isMobile}
              startIcon={<BarChartIcon />}
              onClick={() => router.push("/teacher/classes/tasks/summary")}
              sx={{ 
                color: COLORS.primary, borderColor: COLORS.primary, borderRadius: 3, px: 3, 
                textTransform: 'none', fontWeight: 800, height: 48,
                '&:hover': { borderColor: COLORS.primaryLight, bgcolor: `${COLORS.primary}05` }
              }}
            >
              Ver Resumen
            </Button>
<Button
  variant="outlined"
  fullWidth={isMobile}
  startIcon={<AssignmentIcon />}
  onClick={() => router.push("/taskReport")}
  sx={{ 
    color: COLORS.primary,
    borderColor: COLORS.primary,
    borderRadius: 3,
    px: 3,
    textTransform: 'none',
    fontWeight: 800,
    height: 48,
    '&:hover': {
      borderColor: COLORS.primaryLight,
      bgcolor: `${COLORS.primary}05`
    }
  }}
>
  Planilla de puntaje
</Button>
            {isTeacher && (
              <Button
                variant="contained"
                fullWidth={isMobile}
                startIcon={<AddIcon />}
                onClick={() => router.push("/teacher/classes/create")}
                sx={{ bgcolor: COLORS.primary, borderRadius: 3, px: 3, textTransform: 'none', fontWeight: 800, height: 48 }}
              >
                Nueva Tarea
              </Button>
            )}
          </Stack>
        </Stack>

        {/* FILTROS ADAPTABLES */}
        <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, mb: 4, borderRadius: 4, border: `1px solid ${COLORS.border}` }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder="Buscar tema..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: COLORS.primary }} /></InputAdornment>,
                  sx: { borderRadius: 3 }
                }}
              />
            </Grid>
            <Grid item xs={6} md={3.5}>
              <FormControl fullWidth>
                <InputLabel>Asignatura</InputLabel>
                <Select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} label="Asignatura" sx={{ borderRadius: 3 }}>
                  <MenuItem value="">Todas</MenuItem>
                  {uniqueSubjects.map(subj => <MenuItem key={subj} value={subj}>{subj}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3.5}>
              <FormControl fullWidth>
                <InputLabel>Grado</InputLabel>
                <Select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} label="Grado" sx={{ borderRadius: 3 }}>
                  <MenuItem value="">Todos</MenuItem>
                  {uniqueGrades.map(grade => <MenuItem key={grade} value={grade}>{grade}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* LISTADO DE TAREAS RE-DISEÑADO PARA MÓVIL */}
        <Stack spacing={2}>
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <Fade in key={task._id}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: { xs: 2, md: 3 }, 
                    borderRadius: 4, 
                    border: `1px solid ${COLORS.border}`,
                    '&:hover': { borderColor: COLORS.primary } 
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    {/* Info de la tarea */}
                    <Grid item xs={12} md={6}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ width: 48, height: 48, bgcolor: `${COLORS.primary}10`, color: COLORS.primary, borderRadius: 2 }}>
                          <AssignmentIcon />
                        </Avatar>
                        <Box sx={{ overflow: 'hidden' }}>
                          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 800, color: '#1E293B' }}>
                            {task.topic}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                            <Chip label={task.subject} size="small" sx={{ bgcolor: COLORS.primary, color: '#fff', fontSize: '0.7rem', height: 20 }} />
                            <Chip label={task.grade} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
                          </Stack>
                        </Box>
                      </Stack>
                    </Grid>

                    {/* Fecha */}
                    <Grid item xs={6} md={2}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <EventIcon sx={{ color: COLORS.primary, fontSize: 16 }} />
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </Typography>
                      </Stack>
                    </Grid>

                    {/* Acciones */}
                    <Grid item xs={12} md={4}>
                      <Stack 
                        direction="row" 
                        spacing={1} 
                        justifyContent={{ xs: 'space-between', md: 'flex-end' }}
                        alignItems="center"
                      >
                        <Box>
                          {isTeacher && (
                            <>
                              <IconButton size="small" onClick={() => handleDownloadPDF(task)} disabled={generatingPdfId === task._id} sx={{ color: '#059669' }}>
                                {generatingPdfId === task._id ? <CircularProgress size={20} /> : <PdfIcon />}
                              </IconButton>
                              <IconButton size="small" onClick={() => router.push(`/teacher/classes/tasks/edit/${task._id}`)} sx={{ color: '#64748B' }}>
                                <EditIcon />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleDelete(task._id)} sx={{ color: '#EF4444' }}>
                                <DeleteIcon />
                              </IconButton>
                            </>
                          )}
                          <IconButton size="small" onClick={() => handleSendWhatsApp(task)} sx={{ color: '#25D366' }}>
                            <WhatsAppIcon />
                          </IconButton>
                        </Box>

                        <Button
                          variant="contained"
                          size="medium"
                          fullWidth={isMobile}
                          endIcon={<ChevronRightIcon />}
                          onClick={() => router.push(`/teacher/classes/tasks/${task._id}`)}
                          sx={{ 
                            bgcolor: '#F1F5F9', color: COLORS.primary, 
                            textTransform: 'none', fontWeight: 800, borderRadius: 2,
                            px: 2
                          }}
                        >
                          Corregir
                        </Button>
                      </Stack>
                    </Grid>
                  </Grid>
                </Paper>
              </Fade>
            ))
          ) : (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography color="textSecondary">No se encontraron tareas.</Typography>
            </Box>
          )}
        </Stack>

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}