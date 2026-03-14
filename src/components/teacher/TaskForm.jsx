'use client';

import { useEffect, useState } from "react";
import { 
  TextField, Button, Stack, MenuItem, Typography, Paper, 
  IconButton, Box, CircularProgress, Container, Grid, 
  Divider, Avatar, Tooltip 
} from "@mui/material";
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Assignment as AssignmentIcon, 
  Checklist as ChecklistIcon,
  Event as EventIcon
} from "@mui/icons-material";
import { createTask, updateTask } from "@/services/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const COLORS = {
  primary: "#7D0F15",
  primaryLight: "#a31a20",
  bgLight: "#F8FAFC",
  border: "#E2E8F0"
};

export default function TaskForm({ task = null }) {
  const router = useRouter();
  const { user, loading: loadingAuth } = useAuth();

  const [formData, setFormData] = useState({
    subject: "",
    topic: "",
    grade: "",
    taskType: "formativo",
    dueDate: "",
    status: "pendiente",
    indicators: [{ description: "", points: 0 }],
  });

  useEffect(() => {
    if (user && user.grades?.length === 1 && !task) {
      setFormData((prev) => ({ ...prev, grade: user.grades[0] }));
    }
  }, [user, task]);

  useEffect(() => {
    if (task) {
      setFormData({
        subject: task.subject || "",
        topic: task.topic || "",
        grade: task.grade || "",
        taskType: task.taskType || "formativo",
        dueDate: task.dueDate?.split("T")[0] || "",
        status: task.status || "pendiente",
        indicators: task.indicators?.length > 0 ? task.indicators : [{ description: "", points: 0 }],
      });
    }
  }, [task]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleIndicatorChange = (index, field, value) => {
    const updated = [...formData.indicators];
    updated[index][field] = field === "points" ? Number(value) : value;
    setFormData({ ...formData, indicators: updated });
  };

  const addIndicator = () => {
    setFormData({
      ...formData,
      indicators: [...formData.indicators, { description: "", points: 0 }],
    });
  };

  const removeIndicator = (index) => {
    setFormData({
      ...formData,
      indicators: formData.indicators.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Usuario no cargado");

    if (!formData.subject.trim() || !formData.topic.trim() || !formData.grade)
      return alert("Debe completar asignatura, tema y grado");

    const validIndicators = formData.indicators.filter(
      (ind) => ind.description.trim() && ind.points > 0
    );

    if (validIndicators.length === 0)
      return alert("Debe agregar al menos un indicador válido con puntos > 0");

    const payload = {
      ...formData,
      indicators: validIndicators,
      institution: user.institution?._id || user.institution,
      teacher: user._id,
    };

    try {
      if (task) {
        await updateTask(task._id, payload);
      } else {
        await createTask(payload);
      }
      router.push("/teacher/classes/tasks");
    } catch (error) {
      console.error(error);
      alert("Error al guardar la tarea");
    }
  };

  if (loadingAuth) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <CircularProgress thickness={5} sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  const SectionTitle = ({ icon: Icon, title }) => (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
      <Avatar sx={{ bgcolor: `${COLORS.primary}10`, color: COLORS.primary, width: 40, height: 40 }}>
        <Icon />
      </Avatar>
      <Typography variant="h6" sx={{ fontWeight: 800, color: "#1E293B", letterSpacing: '-0.5px' }}>
        {title}
      </Typography>
    </Stack>
  );

  return (
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: '100vh', py: 5 }}>
      <Container maxWidth="md">
        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 6, border: `1px solid ${COLORS.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.primary, letterSpacing: '-1.5px', mb: 1 }}>
              {task ? "Editar Tarea" : "Crear Nueva Tarea"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Configure los detalles de la actividad y defina los criterios de evaluación.
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              
              {/* SECCIÓN 1: DETALLES GENERALES */}
              <Box>
                <SectionTitle icon={AssignmentIcon} title="Configuración General" />
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select fullWidth label="Asignatura" name="subject"
                      value={formData.subject} onChange={handleChange} required
                      InputProps={{ sx: { borderRadius: 3 } }}
                    >
                      {["Comunicación", "Matemáticas", "Medio Natural y Salud", "Guaraní", "Educación Física", "Educación Artística", "Vida Social y Trabajo"].map((asig) => (
                        <MenuItem key={asig} value={asig}>{asig}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select fullWidth label="Grado" name="grade"
                      value={formData.grade} onChange={handleChange} required
                      InputProps={{ sx: { borderRadius: 3 } }}
                    >
                      {user?.grades?.map((g) => (
                        <MenuItem key={g} value={g}>{g}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth label="Tema de la clase" name="topic"
                      value={formData.topic} onChange={handleChange} required
                      placeholder="Ej: Suma de fracciones, La célula, etc."
                      InputProps={{ sx: { borderRadius: 3 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select fullWidth label="Tipo de Evaluación" name="taskType"
                      value={formData.taskType} onChange={handleChange} required
                      InputProps={{ sx: { borderRadius: 3 } }}
                    >
                      <MenuItem value="diagnostico">Diagnóstico</MenuItem>
                      <MenuItem value="formativo">Formativo</MenuItem>
                      <MenuItem value="sumativo">Sumativo</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth label="Fecha de Entrega" name="dueDate" type="date"
                      value={formData.dueDate} onChange={handleChange} required
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ 
                        sx: { borderRadius: 3 },
                        startAdornment: <EventIcon sx={{ color: COLORS.primary, mr: 1, fontSize: 20 }} />
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* SECCIÓN 2: INDICADORES */}
              <Box>
                <SectionTitle icon={ChecklistIcon} title="Indicadores de Evaluación" />
                <Stack spacing={2}>
                  {formData.indicators.map((ind, index) => (
                    <Stack 
                      key={index} 
                      direction="row" 
                      spacing={2} 
                      alignItems="flex-start"
                      sx={{ 
                        p: 2, bgcolor: '#fff', borderRadius: 4, 
                        border: `1px solid ${COLORS.border}`,
                        transition: '0.2s',
                        '&:hover': { borderColor: COLORS.primary }
                      }}
                    >
                      <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: COLORS.primary, fontWeight: 700 }}>
                        {index + 1}
                      </Avatar>
                      <TextField
                        fullWidth multiline label="Descripción del indicador"
                        value={ind.description}
                        onChange={(e) => handleIndicatorChange(index, "description", e.target.value)}
                        placeholder="Ej: Identifica las partes de la planta..."
                        variant="standard"
                      />
                      <TextField
                        type="number" label="Pts"
                        value={ind.points}
                        onChange={(e) => handleIndicatorChange(index, "points", e.target.value)}
                        sx={{ width: 80 }}
                        variant="standard"
                      />
                      {formData.indicators.length > 1 && (
                        <Tooltip title="Eliminar">
                          <IconButton onClick={() => removeIndicator(index)} sx={{ color: '#EF4444' }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  ))}

                  <Button 
                    startIcon={<AddIcon />} 
                    onClick={addIndicator}
                    sx={{ 
                      alignSelf: 'flex-start', color: COLORS.primary, fontWeight: 700,
                      borderRadius: 3, py: 1, px: 2, '&:hover': { bgcolor: `${COLORS.primary}10` }
                    }}
                  >
                    Agregar Indicador
                  </Button>
                </Stack>
              </Box>

              <Box sx={{ pt: 2 }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  fullWidth
                  size="large"
                  sx={{ 
                    bgcolor: COLORS.primary, py: 2, borderRadius: 4, fontWeight: 800,
                    fontSize: '1rem', boxShadow: `0 10px 20px ${COLORS.primary}30`,
                    '&:hover': { bgcolor: COLORS.primaryLight, transform: 'translateY(-2px)' },
                    transition: 'all 0.2s'
                  }}
                >
                  {task ? "Actualizar Tarea" : "Publicar Tarea Ahora"}
                </Button>
                <Button 
                  fullWidth 
                  onClick={() => router.back()}
                  sx={{ mt: 2, color: '#64748B', fontWeight: 700 }}
                >
                  Cancelar y Volver
                </Button>
              </Box>

            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}