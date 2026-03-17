'use client';

import { useEffect, useState, useMemo } from "react";
import {
  Box, Typography, Paper, Stack, Select, MenuItem, Button,
  CircularProgress, FormControl, InputLabel, Chip, Container,
  Grid, IconButton, Tooltip, Avatar, Snackbar, Alert, Fade,
  TextField, InputAdornment
} from "@mui/material";

import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Assignment as AssignmentIcon, Event as EventIcon, 
  ChevronRight as ChevronRightIcon, Search as SearchIcon,
  School as SchoolIcon, PictureAsPdf as PdfIcon,
  BarChart as BarChartIcon // Icono para el resumen
} from "@mui/icons-material";

import { getTasks, deleteTask, updateTask, getStudentTasksByGrade } from "@/services/api";
import { generateTaskPDF } from "@/components/teacher/TaskReportPDF"; 
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function TasksPage() {
  const router = useRouter();
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
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: '100vh', py: 5 }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={3} sx={{ mb: 5 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 900, color: COLORS.primary, letterSpacing: '-1.5px', mb: 1 }}>
              Académico
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <SchoolIcon sx={{ color: COLORS.primary, fontSize: 18 }} />
              <Typography variant="subtitle1" sx={{ color: '#1E293B', fontWeight: 700 }}>
                {user?.institution?.name || "C.P. María Auxiliadora"}
              </Typography>
            </Stack>
          </Box>
          
          <Stack direction="row" spacing={2}>
            {/* BOTÓN DE RESUMEN - Acceso a la ruta solicitada */}
            <Button
              variant="outlined"
              size="large"
              startIcon={<BarChartIcon />}
              onClick={() => router.push("/teacher/classes/tasks/summary")}
              sx={{ 
                color: COLORS.primary, 
                borderColor: COLORS.primary, 
                borderRadius: 4, 
                px: 3, 
                textTransform: 'none', 
                fontWeight: 800,
                '&:hover': { borderColor: COLORS.primaryLight, bgcolor: `${COLORS.primary}05` }
              }}
            >
              Ver Resumen
            </Button>

            {isTeacher && (
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={() => router.push("/teacher/classes/create")}
                sx={{ bgcolor: COLORS.primary, borderRadius: 4, px: 4, py: 1.5, textTransform: 'none', fontWeight: 800 }}
              >
                Nueva Tarea
              </Button>
            )}
          </Stack>
        </Stack>

        {/* FILTROS */}
        <Paper elevation={0} sx={{ p: 3, mb: 5, borderRadius: 6, border: `1px solid ${COLORS.border}` }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder="Buscar por tema..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: COLORS.primary }} /></InputAdornment>,
                  sx: { borderRadius: 4 }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3.5}>
              <FormControl fullWidth>
                <InputLabel>Asignatura</InputLabel>
                <Select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} label="Asignatura" sx={{ borderRadius: 4 }}>
                  <MenuItem value="">Todas</MenuItem>
                  {uniqueSubjects.map(subj => <MenuItem key={subj} value={subj}>{subj}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3.5}>
              <FormControl fullWidth>
                <InputLabel>Grado</InputLabel>
                <Select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} label="Grado" sx={{ borderRadius: 4 }}>
                  <MenuItem value="">Todos</MenuItem>
                  {uniqueGrades.map(grade => <MenuItem key={grade} value={grade}>{grade}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* LISTADO */}
        <Stack spacing={2.5}>
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <Fade in key={task._id}>
                <Paper 
                  elevation={0}
                  sx={{ p: 3, borderRadius: 6, border: `1px solid ${COLORS.border}`, transition: '0.3s', '&:hover': { borderColor: COLORS.primary } }}
                >
                  <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <Stack direction="row" spacing={2.5} alignItems="center">
                        <Avatar sx={{ width: 60, height: 60, bgcolor: `${COLORS.primary}10`, color: COLORS.primary, borderRadius: 4 }}>
                          <AssignmentIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B' }}>{task.topic}</Typography>
                          <Stack direction="row" spacing={1}>
                            <Chip label={task.subject} size="small" sx={{ bgcolor: COLORS.primary, color: '#fff', fontWeight: 700 }} />
                            <Chip label={task.grade} size="small" variant="outlined" />
                          </Stack>
                        </Box>
                      </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2.5}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <EventIcon sx={{ color: COLORS.primary, fontSize: 18 }} />
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </Typography>
                      </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3.5}>
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {isTeacher && (
                          <>
                            <Tooltip title="Descargar Planilla PDF">
                              <IconButton 
                                onClick={() => handleDownloadPDF(task)} 
                                disabled={generatingPdfId === task._id}
                                sx={{ color: '#059669', '&:hover': { bgcolor: '#DCFCE7' } }}
                              >
                                {generatingPdfId === task._id ? <CircularProgress size={20} color="inherit" /> : <PdfIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Editar">
                              <IconButton onClick={() => router.push(`/teacher/classes/tasks/edit/${task._id}`)} sx={{ color: '#64748B' }}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Eliminar">
                              <IconButton onClick={() => handleDelete(task._id)} sx={{ color: '#EF4444' }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        
                        <Button
                          variant="contained"
                          endIcon={<ChevronRightIcon />}
                          onClick={() => router.push(`/teacher/classes/tasks/${task._id}`)}
                          sx={{ bgcolor: '#F1F5F9', color: COLORS.primary, textTransform: 'none', fontWeight: 800, borderRadius: 3 }}
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
            <Typography variant="body1" textAlign="center" color="textSecondary" sx={{ py: 10 }}>
              No se encontraron tareas con los filtros aplicados.
            </Typography>
          )}
        </Stack>

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 4 }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}