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
  Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon,
  Assignment as AssignmentIcon, Event as EventIcon, 
  ChevronRight as ChevronRightIcon, Search as SearchIcon,
  FilterList as FilterIcon, School as SchoolIcon
} from "@mui/icons-material";

import { getTasks, deleteTask, updateTask } from "@/services/api";
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
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // --- IDENTIDAD INSTITUCIONAL ---
  const COLORS = {
    primary: "#7D0F15", // Granate CPMA
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

  const handleTogglePublish = async (task) => {
    try {
      const newStatus = task.status === "publicada" ? "pendiente" : "publicada";
      await updateTask(task._id, { status: newStatus });
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
    } catch (error) {
      setSnackbar({ open: true, message: "Error al actualizar estado", severity: "error" });
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
        {/* HEADER SECTION */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={3} sx={{ mb: 5 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 900, color: COLORS.primary, letterSpacing: '-1.5px', mb: 1 }}>
              Académico
            </Typography>
            
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <SchoolIcon sx={{ color: COLORS.primary, fontSize: 18 }} />
                <Typography variant="subtitle1" sx={{ color: '#1E293B', fontWeight: 700, lineHeight: 1 }}>
                  {user?.institution?.name || "C.P. María Auxiliadora"}
                </Typography>
              </Stack>
              
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800, textTransform: 'uppercase', mr: 1 }}>
                  {isAdmin ? "Acceso:" : "Mis Grados:"}
                </Typography>
                {isAdmin ? (
                  <Chip label="Administración Global" size="small" sx={{ bgcolor: '#F1F5F9', fontWeight: 700, color: COLORS.primary }} />
                ) : (
                  user?.grades?.map((grade) => (
                    <Chip 
                      key={grade} 
                      label={grade} 
                      size="small" 
                      sx={{ 
                        bgcolor: `${COLORS.primary}10`, 
                        color: COLORS.primary, 
                        fontWeight: 700,
                        border: `1px solid ${COLORS.primary}20`
                      }} 
                    />
                  ))
                )}
              </Stack>
            </Stack>
          </Box>
          
          {isTeacher && (
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => router.push("/teacher/classes/create")}
              sx={{ 
                bgcolor: COLORS.primary, borderRadius: 4, px: 4, py: 1.5, 
                textTransform: 'none', fontWeight: 800, 
                boxShadow: `0 10px 20px ${COLORS.primary}30`,
                '&:hover': { bgcolor: COLORS.primaryLight, transform: 'translateY(-2px)' },
                transition: 'all 0.2s'
              }}
            >
              Nueva Tarea
            </Button>
          )}
        </Stack>

        {/* FILTERS CARD */}
        <Paper elevation={0} sx={{ p: 3, mb: 5, borderRadius: 6, border: `1px solid ${COLORS.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder="Buscar por tema o título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: COLORS.primary }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 4, bgcolor: '#fff' }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3.5}>
              <FormControl fullWidth>
                <InputLabel>Asignatura</InputLabel>
                <Select 
                  value={filterSubject} 
                  onChange={(e) => setFilterSubject(e.target.value)} 
                  label="Asignatura"
                  sx={{ borderRadius: 4, bgcolor: '#fff' }}
                >
                  <MenuItem value="">Todas las materias</MenuItem>
                  {uniqueSubjects.map(subj => <MenuItem key={subj} value={subj}>{subj}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3.5}>
              <FormControl fullWidth>
                <InputLabel>Grado/Curso</InputLabel>
                <Select 
                  value={filterGrade} 
                  onChange={(e) => setFilterGrade(e.target.value)} 
                  label="Grado/Curso"
                  sx={{ borderRadius: 4, bgcolor: '#fff' }}
                >
                  <MenuItem value="">Todos los grados</MenuItem>
                  {uniqueGrades.map(grade => <MenuItem key={grade} value={grade}>{grade}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* TASKS LIST */}
        <Stack spacing={2.5}>
          <Typography variant="overline" sx={{ color: '#64748B', fontWeight: 800, ml: 1, letterSpacing: 1 }}>
            {filteredTasks.length} Tareas encontradas
          </Typography>

          {filteredTasks.length === 0 ? (
            <Paper sx={{ py: 10, textAlign: 'center', borderRadius: 6, border: `2px dashed ${COLORS.border}`, bgcolor: 'transparent' }}>
              <FilterIcon sx={{ fontSize: 60, color: '#CBD5E1', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
                No hay tareas con estos filtros
              </Typography>
              <Button onClick={() => { setSearchTerm(""); setFilterSubject(""); setFilterGrade(""); }} sx={{ mt: 1, color: COLORS.primary, fontWeight: 700 }}>
                Limpiar filtros
              </Button>
            </Paper>
          ) : (
            filteredTasks.map(task => (
              <Fade in key={task._id}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3, borderRadius: 6, border: `1px solid ${COLORS.border}`,
                    transition: 'all 0.3s ease',
                    '&:hover': { 
                      borderColor: COLORS.primary, 
                      transform: 'translateY(-4px)',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)' 
                    }
                  }}
                >
                  <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <Stack direction="row" spacing={2.5} alignItems="center">
                        <Avatar sx={{ 
                          width: 60, height: 60, 
                          bgcolor: task.status === 'publicada' ? `${COLORS.primary}10` : '#F1F5F9',
                          color: task.status === 'publicada' ? COLORS.primary : '#64748B',
                          borderRadius: 4,
                          border: `1px solid ${task.status === 'publicada' ? `${COLORS.primary}20` : COLORS.border}`
                        }}>
                          <AssignmentIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', mb: 0.5, lineHeight: 1.2 }}>
                            {task.topic}
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip label={task.subject} size="small" sx={{ bgcolor: COLORS.primary, color: '#fff', fontWeight: 700, fontSize: '0.7rem' }} />
                            <Chip label={task.grade} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#64748B' }} />
                            <Chip 
                              label={task.status === "publicada" ? "Publicado" : "Borrador"} 
                              size="small" 
                              sx={{ 
                                fontSize: '0.65rem', fontWeight: 900,
                                bgcolor: task.status === "publicada" ? "#DCFCE7" : "#FEF3C7",
                                color: task.status === "publicada" ? "#166534" : "#92400E"
                              }} 
                            />
                          </Stack>
                        </Box>
                      </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2.5}>
                      <Stack spacing={0.5}>
                        <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Vencimiento
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <EventIcon sx={{ color: COLORS.primary, fontSize: 18 }} />
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                            {new Date(task.dueDate).toLocaleDateString('es-PY', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3.5}>
                      <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                        {isTeacher && (
                          <>
                            <Tooltip title="Editar">
                              <IconButton onClick={() => router.push(`/teacher/classes/tasks/edit/${task._id}`)} sx={{ color: '#64748B', '&:hover': { color: COLORS.primary, bgcolor: `${COLORS.primary}10` } }}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={task.status === "publicada" ? "Ocultar" : "Publicar"}>
                              <IconButton onClick={() => handleTogglePublish(task)} sx={{ color: task.status === 'publicada' ? '#0EA5E9' : '#64748B' }}>
                                {task.status === "publicada" ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <IconButton onClick={() => handleDelete(task._id)} sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEE2E2' } }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        <Button
                          variant="contained"
                          endIcon={<ChevronRightIcon />}
                          onClick={() => router.push(`/teacher/classes/tasks/${task._id}`)}
                          sx={{ 
                            bgcolor: '#F1F5F9', color: COLORS.primary, boxShadow: 'none',
                            textTransform: 'none', fontWeight: 800, borderRadius: 3,
                            '&:hover': { bgcolor: COLORS.primary, color: '#fff', boxShadow: `0 8px 15px ${COLORS.primary}30` }
                          }}
                        >
                          {isTeacher ? "Corregir" : "Ver más"}
                        </Button>
                      </Stack>
                    </Grid>
                  </Grid>
                </Paper>
              </Fade>
            ))
          )}
        </Stack>

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 4, fontWeight: 700, bgcolor: snackbar.severity === 'success' ? COLORS.primary : '#EF4444' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}