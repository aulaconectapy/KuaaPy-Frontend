'use client';

import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Chip,
  Container,
  Grid,
  IconButton,
  Tooltip,
  Avatar
} from "@mui/material";

import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Visibility as VisibilityIcon, 
  VisibilityOff as VisibilityOffIcon,
  Assignment as AssignmentIcon,
  Event as EventIcon,
  ChevronRight as ChevronRightIcon
} from "@mui/icons-material";

import { getTasks, deleteTask, updateTask } from "@/services/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function TasksPage() {

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [filterSubject, setFilterSubject] = useState("");

  /**
   * 🔐 Control de acceso por rol
   */
  useEffect(() => {

    if (!authLoading && user) {

      const allowedRoles = [
        "director",
        "directora",
        "secretario",
        "secretaria",
        "docente"
      ];

      if (!allowedRoles.includes(user.role)) {
        router.push("/dashboard");
      }

    }

  }, [user, authLoading, router]);

  /**
   * 📚 Cargar tareas
   */
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

    try {

      await deleteTask(taskId);

      setTasks(prev =>
        prev.filter(t => t._id !== taskId)
      );

    } catch (error) {

      console.error(error);
      alert("Error al eliminar la tarea");

    }
  };

  const handleTogglePublish = async (task) => {

    try {

      const newStatus =
        task.status === "publicada"
          ? "pendiente"
          : "publicada";

      await updateTask(task._id, { status: newStatus });

      setTasks(prev =>
        prev.map(t =>
          t._id === task._id
            ? { ...t, status: newStatus }
            : t
        )
      );

    } catch (error) {

      console.error(error);
      alert("Error al actualizar estado");

    }
  };

  /**
   * 🎯 FILTRO SEGÚN ROL
   */
  const filteredTasks = useMemo(() => {

    if (!user) return [];

    return tasks.filter(task => {

      const subjectFilter =
        filterSubject ? task.subject === filterSubject : true;

      /**
       * 👑 Director / Secretaria ven todo
       */
      if (
        user.role === "director" ||
        user.role === "directora" ||
        user.role === "secretario" ||
        user.role === "secretaria"
      ) {
        return subjectFilter;
      }

      /**
       * 👨‍🏫 Docente
       */
      if (user.role === "docente") {

        const sameGrade = task.grade === user.grade;
        const sameInstitution = task.institution === user.institution;

        return sameGrade && sameInstitution && subjectFilter;

      }

      return false;

    });

  }, [tasks, filterSubject, user]);

  if (loading || authLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: 'center', height: '60vh' }}>
        <CircularProgress thickness={5} sx={{ color: '#1A365D' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>

      {/* CABECERA */}
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#1A365D' }}>
            Gestión de Mis Tareas
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748B' }}>
            Panel administrativo de Aula Conecta Py
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push("/teacher/classes/create")}
          sx={{ 
            bgcolor: '#1A365D',
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 700,
            '&:hover': { bgcolor: '#2D3748' }
          }}
        >
          Nueva Tarea
        </Button>
      </Stack>

      {/* FILTRO */}
      <Paper sx={{ p: 2, mb: 4, borderRadius: 4 }}>
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel>Asignatura</InputLabel>

          <Select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            label="Asignatura"
          >

            <MenuItem value="">Todas las materias</MenuItem>

            {Array.from(new Set(tasks.map(t => t.subject))).map(subj => (
              <MenuItem key={subj} value={subj}>
                {subj}
              </MenuItem>
            ))}

          </Select>
        </FormControl>
      </Paper>

      {/* LISTA DE TAREAS */}
      <Stack spacing={3}>

        {filteredTasks.length === 0 ? (

          <Paper sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No se encontraron tareas.
            </Typography>
          </Paper>

        ) : (

          filteredTasks.map(task => (

            <Paper key={task._id} sx={{ p: 3, borderRadius: 4 }}>

              <Grid container spacing={2} alignItems="center">

                <Grid item xs={12} md={5}>

                  <Stack direction="row" spacing={2} alignItems="center">

                    <Avatar sx={{ bgcolor: '#EDF2F7', color: '#1A365D' }}>
                      <AssignmentIcon />
                    </Avatar>

                    <Box>

                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {task.topic}
                      </Typography>

                      <Stack direction="row" spacing={1}>

                        <Chip label={task.subject} size="small" />

                        <Chip label={`${task.grade}° Grado`} size="small" />

                      </Stack>

                    </Box>

                  </Stack>

                </Grid>

                <Grid item xs={12} md={3}>

                  <Stack direction="row" spacing={1}>

                    <EventIcon fontSize="small" />

                    <Typography variant="body2">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </Typography>

                  </Stack>

                </Grid>

                <Grid item xs={12} md={4}>

                  <Stack direction="row" spacing={1} justifyContent="flex-end">

                    <IconButton onClick={() => router.push(`/teacher/classes/tasks/edit/${task._id}`)}>
                      <EditIcon />
                    </IconButton>

                    <IconButton onClick={() => handleTogglePublish(task)}>
                      {task.status === "publicada"
                        ? <VisibilityOffIcon />
                        : <VisibilityIcon />
                      }
                    </IconButton>

                    <IconButton onClick={() => handleDelete(task._id)}>
                      <DeleteIcon />
                    </IconButton>

                    <Button
                      variant="contained"
                      endIcon={<ChevronRightIcon />}
                      onClick={() => router.push(`/teacher/classes/tasks/${task._id}`)}
                      sx={{ bgcolor: '#1A365D' }}
                    >
                      Corregir
                    </Button>

                  </Stack>

                </Grid>

              </Grid>

            </Paper>

          ))

        )}

      </Stack>

    </Container>
  );
}