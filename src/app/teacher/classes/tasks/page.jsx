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

  // 🔐 Control de acceso
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!authLoading && user) {
      const allowedRoles = ["director/a", "secretario/a", "secretaria", "docente"];
      if (!allowedRoles.includes(user.role)) router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  // 📚 Cargar tareas
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

  // 🗑 Acciones
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

  // 🎓 Permisos calculados
  const isTeacher = user?.role === "docente";
  const isAdmin = ["director/a", "secretario/a", "secretaria"].includes(user?.role);

  // 🎯 Lógica de Filtrado Multicapa
  const filteredTasks = useMemo(() => {
    if (!user) return [];

    return tasks.filter(task => {
      // 1. Filtro de Búsqueda (por tema)
      const matchesSearch = task.topic.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Filtros de Selectores
      const matchesSubject = filterSubject ? task.subject === filterSubject : true;
      const matchesGrade = filterGrade ? task.grade === filterGrade : true;

      // 3. Filtro de Seguridad/Rol
      let accessGranted = false;
      if (isAdmin) {
        accessGranted = true; // El admin ve según los filtros de arriba
      } else if (isTeacher) {
        const sameGrade = Array.isArray(user.grades) && user.grades.includes(task.grade);
        const taskInstId = task.institution?._id || task.institution;
        const userInstId = user.institution?._id || user.institution;
        const sameInstitution = String(taskInstId) === String(userInstId);
        accessGranted = sameGrade && sameInstitution;
      }

      return matchesSearch && matchesSubject && matchesGrade && accessGranted;
    });
  }, [tasks, searchTerm, filterSubject, filterGrade, user, isAdmin, isTeacher]);

  // Listas únicas para los selectores basada en la data original
  const uniqueSubjects = useMemo(() => Array.from(new Set(tasks.map(t => t.subject))), [tasks]);
  const uniqueGrades = useMemo(() => Array.from(new Set(tasks.map(t => t.grade))), [tasks]);

  if (loading || authLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: 'center', height: '80vh' }}>
        <CircularProgress thickness={5} sx={{ color: '#1A365D' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {/* HEADER SECTION */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={3} sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 900, color: '#1A365D', letterSpacing: '-1px', mb: 1 }}>
            Gestión Académica
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <SchoolIcon sx={{ color: '#64748B', fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ color: '#64748B', fontWeight: 500 }}>
              {user?.institution?.name || "Panel Administrativo"}
            </Typography>
          </Stack>
        </Box>
        
        {isTeacher && (
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => router.push("/teacher/classes/create")}
            sx={{ 
              bgcolor: '#1A365D', borderRadius: 4, px: 4, py: 1.5, 
              textTransform: 'none', fontWeight: 800, boxShadow: '0 10px 15px -3px rgba(26, 54, 93, 0.3)',
              '&:hover': { bgcolor: '#2D3748', transform: 'translateY(-2px)' },
              transition: 'all 0.2s'
            }}
          >
            Nueva Tarea
          </Button>
        )}
      </Stack>

      {/* FILTERS CARD */}
      <Paper elevation={0} sx={{ p: 3, mb: 5, borderRadius: 5, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
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
                    <SearchIcon sx={{ color: '#94A3B8' }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 3, bgcolor: 'white' }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3.5}>
            <FormControl fullWidth size="medium">
              <InputLabel>Asignatura</InputLabel>
              <Select 
                value={filterSubject} 
                onChange={(e) => setFilterSubject(e.target.value)} 
                label="Asignatura"
                sx={{ borderRadius: 3, bgcolor: 'white' }}
              >
                <MenuItem value="">Todas las materias</MenuItem>
                {uniqueSubjects.map(subj => <MenuItem key={subj} value={subj}>{subj}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3.5}>
            <FormControl fullWidth size="medium">
              <InputLabel>Grado/Curso</InputLabel>
              <Select 
                value={filterGrade} 
                onChange={(e) => setFilterGrade(e.target.value)} 
                label="Grado/Curso"
                sx={{ borderRadius: 3, bgcolor: 'white' }}
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
        <Typography variant="overline" sx={{ color: '#64748B', fontWeight: 800, ml: 1 }}>
          Resultados: {filteredTasks.length} tareas encontradas
        </Typography>

        {filteredTasks.length === 0 ? (
          <Paper sx={{ py: 10, textAlign: 'center', borderRadius: 5, border: '2px dashed #E2E8F0', bgcolor: 'transparent' }}>
            <FilterIcon sx={{ fontSize: 60, color: '#CBD5E1', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
              No hay tareas que coincidan con los filtros
            </Typography>
            <Button variant="text" onClick={() => { setSearchTerm(""); setFilterSubject(""); setFilterGrade(""); }} sx={{ mt: 1 }}>
              Limpiar todos los filtros
            </Button>
          </Paper>
        ) : (
          filteredTasks.map(task => (
            <Fade in key={task._id}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, borderRadius: 5, border: '1px solid #E2E8F0',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': { borderColor: '#1A365D', transform: 'scale(1.01)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)' }
                }}
              >
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={2.5} alignItems="center">
                      <Avatar sx={{ 
                        width: 56, height: 56, bgcolor: task.status === 'publicada' ? '#F0F9FF' : '#FFF7ED',
                        color: task.status === 'publicada' ? '#0369A1' : '#C2410C',
                        borderRadius: 4
                      }}>
                        <AssignmentIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', mb: 0.5 }}>
                          {task.topic}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          <Chip label={task.subject} size="small" sx={{ bgcolor: '#F1F5F9', fontWeight: 700 }} />
                          <Chip label={task.grade} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                          <Chip 
                            label={task.status.toUpperCase()} 
                            size="small" 
                            sx={{ 
                              fontSize: '0.65rem', fontWeight: 900,
                              bgcolor: task.status === "publicada" ? "#DCFCE7" : "#FEE2E2",
                              color: task.status === "publicada" ? "#166534" : "#991B1B"
                            }} 
                          />
                        </Stack>
                      </Box>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} sm={6} md={2.5}>
                    <Stack spacing={0.5}>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                        Fecha de Entrega
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <EventIcon sx={{ color: '#64748B', fontSize: 18 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                          {new Date(task.dueDate).toLocaleDateString('es-PY', { day: 'numeric', month: 'long' })}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3.5}>
                    <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                      {isTeacher && (
                        <>
                          <Tooltip title="Editar">
                            <IconButton onClick={() => router.push(`/teacher/classes/tasks/edit/${task._id}`)} sx={{ color: '#64748B' }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={task.status === "publicada" ? "Ocultar" : "Publicar"}>
                            <IconButton onClick={() => handleTogglePublish(task)} sx={{ color: task.status === 'publicada' ? '#0EA5E9' : '#64748B' }}>
                              {task.status === "publicada" ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
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
                        sx={{ 
                          bgcolor: '#F1F5F9', color: '#1A365D', boxShadow: 'none',
                          textTransform: 'none', fontWeight: 800, borderRadius: 3,
                          '&:hover': { bgcolor: '#E2E8F0', boxShadow: 'none' }
                        }}
                      >
                        {isTeacher ? "Corregir" : "Detalles"}
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
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 3, fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}