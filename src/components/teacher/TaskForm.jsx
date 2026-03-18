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
  Quiz as QuizIcon
} from "@mui/icons-material";
import { createTask, updateTask } from "@/services/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const COLORS = {
  primary: "#7D0F15",
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
    instrumentType: "lista_cotejo",
    dueDate: "",
    status: "pendiente",
    indicators: [{ description: "", points: 1 }], // Iniciamos con 1 punto
    rubricCriteria: [{ criterion: "", levels: [{ level: "", descriptor: "", points: 1 }] }], // Iniciamos con 1 punto
  });

  useEffect(() => {
    if (user && user.grades?.length === 1 && !task) {
      setFormData(prev => ({ ...prev, grade: user.grades[0] }));
    }
  }, [user, task]);

  useEffect(() => {
    if (task) {
      setFormData({
        subject: task.subject || "",
        topic: task.topic || "",
        grade: task.grade || "",
        taskType: task.taskType || "formativo",
        instrumentType: task.instrumentType || "lista_cotejo",
        dueDate: task.dueDate?.split("T")[0] || "",
        status: task.status || "pendiente",
        indicators: task.indicators?.length > 0 ? task.indicators : [{ description: "", points: 1 }],
        rubricCriteria: task.rubricCriteria?.length > 0 ? task.rubricCriteria : [{ criterion: "", levels: [{ level: "", descriptor: "", points: 1 }] }],
      });
    }
  }, [task]);

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleIndicatorChange = (index, field, value) => {
    const updated = [...formData.indicators];
    updated[index][field] = field === "points" ? (value === "" ? 0 : Number(value)) : value;
    setFormData({ ...formData, indicators: updated });
  };

  const addIndicator = () => setFormData({ ...formData, indicators: [...formData.indicators, { description: "", points: 1 }] });
  const removeIndicator = index => setFormData({ ...formData, indicators: formData.indicators.filter((_, i) => i !== index) });

  // --- Rúbrica ---
  const handleRubricCriterionChange = (index, field, value) => {
    const updated = [...formData.rubricCriteria];
    updated[index][field] = value;
    setFormData({ ...formData, rubricCriteria: updated });
  };
  const handleRubricLevelChange = (cIndex, lIndex, field, value) => {
    const updated = [...formData.rubricCriteria];
    updated[cIndex].levels[lIndex][field] = field === "points" ? (value === "" ? 0 : Number(value)) : value;
    setFormData({ ...formData, rubricCriteria: updated });
  };
  const addRubricCriterion = () => setFormData({ 
    ...formData, 
    rubricCriteria: [...formData.rubricCriteria, { criterion: "", levels: [{ level: "", descriptor: "", points: 1 }] }] 
  });
  const addRubricLevel = cIndex => {
    const updated = [...formData.rubricCriteria];
    updated[cIndex].levels.push({ level: "", descriptor: "", points: 1 });
    setFormData({ ...formData, rubricCriteria: updated });
  };
  const removeRubricCriterion = cIndex => setFormData({ ...formData, rubricCriteria: formData.rubricCriteria.filter((_, i) => i !== cIndex) });
  const removeRubricLevel = (cIndex, lIndex) => {
    const updated = [...formData.rubricCriteria];
    updated[cIndex].levels = updated[cIndex].levels.filter((_, i) => i !== lIndex);
    setFormData({ ...formData, rubricCriteria: updated });
  };

  // --- Submit ---
  const handleSubmit = async e => {
    e.preventDefault();
    if (!user) return alert("Usuario no cargado");
    if (!formData.subject.trim() || !formData.topic.trim() || !formData.grade) return alert("Debe completar asignatura, tema y grado");
    if (!formData.dueDate) return alert("Debe seleccionar fecha de entrega");

    const payload = { ...formData, institution: user.institution?._id || user.institution, teacher: user._id };

    // CAMBIO: Ahora solo filtramos si la descripción está totalmente vacía.
    // Permitimos puntos >= 0 para evitar que se borren por error.
    if (formData.instrumentType === "lista_cotejo") {
      const validIndicators = formData.indicators.filter(i => i.description.trim() !== "");
      if (validIndicators.length === 0) return alert("Debe agregar al menos un indicador con descripción");
      payload.indicators = validIndicators;
    }

    if (formData.instrumentType === "rubrica") {
      const validCriteria = formData.rubricCriteria.filter(c => c.criterion.trim() !== "");
      if (validCriteria.length === 0) return alert("Debe agregar al menos un criterio de rúbrica");
      payload.rubricCriteria = validCriteria;
    }

    if (formData.instrumentType === "rsa") {
      const validIndicators = formData.indicators.filter(i => i.description.trim() !== "");
      if (validIndicators.length === 0) return alert("Debe agregar al menos un indicador válido");
      payload.rsaMomentsData = [
        { indicators: validIndicators },
        { indicators: validIndicators },
        { indicators: validIndicators }
      ];
    }

    try {
      if (task) await updateTask(task._id, payload);
      else await createTask(payload);
      router.push("/teacher/classes/tasks");
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al guardar la tarea");
    }
  };

  if (loadingAuth) return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
      <CircularProgress thickness={5} sx={{ color: COLORS.primary }} />
    </Box>
  );

  const SectionTitle = ({ icon: Icon, title }) => (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
      <Avatar sx={{ bgcolor: `${COLORS.primary}10`, color: COLORS.primary, width: 40, height: 40 }}><Icon /></Avatar>
      <Typography variant="h6" sx={{ fontWeight: 800, color: "#1E293B" }}>{title}</Typography>
    </Stack>
  );

  return (
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: "100vh", py:5 }}>
      <Container maxWidth="md">
        <Paper elevation={0} sx={{ p:{xs:3,md:5}, borderRadius:6, border:`1px solid ${COLORS.border}` }}>
          <Typography variant="h4" sx={{ fontWeight:900, color:COLORS.primary, mb:1 }}>{task ? "Editar Tarea" : "Crear Nueva Tarea"}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb:4 }}>Configure los detalles de la actividad y defina los criterios de evaluación.</Typography>
          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              
              {/* GENERAL */}
              <Box>
                <SectionTitle icon={AssignmentIcon} title="Configuración General" />
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField select fullWidth label="Asignatura" name="subject" value={formData.subject} onChange={handleChange}>
                      {["Comunicación","Matemáticas","Medio Natural y Salud","Guaraní","Educación Física","Educación Artística","Vida Social y Trabajo"].map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField select fullWidth label="Grado" name="grade" value={formData.grade} onChange={handleChange}>
                      {user?.grades?.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Tema de la clase" name="topic" value={formData.topic} onChange={handleChange} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField select fullWidth label="Tipo de Evaluación" name="taskType" value={formData.taskType} onChange={handleChange}>
                      <MenuItem value="diagnostico">Diagnóstico</MenuItem>
                      <MenuItem value="formativo">Formativo</MenuItem>
                      <MenuItem value="sumativo">Sumativo</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      type="date" 
                      fullWidth 
                      label="Fecha de Entrega" 
                      name="dueDate" 
                      value={formData.dueDate} 
                      onChange={handleChange} 
                      InputLabelProps={{ shrink:true }} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField select fullWidth label="Instrumento de Evaluación" name="instrumentType" value={formData.instrumentType} onChange={handleChange}>
                      <MenuItem value="lista_cotejo">Lista de Cotejo</MenuItem>
                      <MenuItem value="rubrica">Rúbrica</MenuItem>
                      <MenuItem value="rsa">RSA</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Lista de Cotejo o RSA indicadores */}
              {(formData.instrumentType === "lista_cotejo" || formData.instrumentType === "rsa") && (
                <Box>
                  <SectionTitle icon={ChecklistIcon} title="Indicadores de Evaluación" />
                  <Stack spacing={2}>
                    {formData.indicators.map((ind,index) => (
                      <Stack key={index} direction="row" spacing={2} alignItems="flex-start" sx={{ p:2, bgcolor:'#fff', borderRadius:4, border:`1px solid ${COLORS.border}` }}>
                        <Avatar sx={{ width:28, height:28, fontSize:'0.75rem', bgcolor:COLORS.primary, fontWeight:700 }}>{index+1}</Avatar>
                        <TextField 
                          fullWidth 
                          label="Descripción" 
                          value={ind.description} 
                          onChange={(e)=>handleIndicatorChange(index,"description",e.target.value)} 
                        />
                        <TextField 
                          type="number" 
                          label="Pts" 
                          value={ind.points} 
                          onChange={(e)=>handleIndicatorChange(index,"points",e.target.value)} 
                          sx={{ width:80 }} 
                        />
                        {formData.indicators.length>1 && (
                          <Tooltip title="Eliminar">
                            <IconButton onClick={()=>removeIndicator(index)} sx={{ color:'#EF4444' }}>
                              <DeleteIcon fontSize="small"/>
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    ))}
                    <Button startIcon={<AddIcon />} onClick={addIndicator}>Agregar Indicador</Button>
                    {formData.instrumentType === "rsa" && <Typography variant="body2" color="text.secondary">Estos indicadores se aplicarán automáticamente a los 3 momentos de la evaluación RSA.</Typography>}
                  </Stack>
                </Box>
              )}

              {/* Rúbrica */}
              {formData.instrumentType === "rubrica" && (
                <Box>
                  <SectionTitle icon={QuizIcon} title="Criterios de Rúbrica" />
                  <Stack spacing={2}>
                    {formData.rubricCriteria.map((c,index)=>(
                      <Box key={index} sx={{ p:2, bgcolor:'#fff', borderRadius:4, border:`1px solid ${COLORS.border}` }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <TextField fullWidth label="Criterio" value={c.criterion} onChange={(e)=>handleRubricCriterionChange(index,"criterion",e.target.value)} />
                          <Button color="error" onClick={()=>removeRubricCriterion(index)}>Eliminar Criterio</Button>
                        </Stack>
                        {c.levels.map((lvl,lIndex)=>(
                          <Stack key={lIndex} direction="row" spacing={2} alignItems="center" sx={{ mt:1 }}>
                            <TextField label="Nivel" value={lvl.level} onChange={(e)=>handleRubricLevelChange(index,lIndex,"level",e.target.value)} />
                            <TextField label="Descripción" value={lvl.descriptor} onChange={(e)=>handleRubricLevelChange(index,lIndex,"descriptor",e.target.value)} />
                            <TextField type="number" label="Pts" value={lvl.points} onChange={(e)=>handleRubricLevelChange(index,lIndex,"points",e.target.value)} sx={{ width:80 }} />
                            {c.levels.length>1 && <Button color="error" onClick={()=>removeRubricLevel(index,lIndex)}>Eliminar Nivel</Button>}
                          </Stack>
                        ))}
                        <Button onClick={()=>addRubricLevel(index)}>Agregar Nivel</Button>
                      </Box>
                    ))}
                    <Button startIcon={<AddIcon />} onClick={addRubricCriterion}>Agregar Criterio</Button>
                  </Stack>
                </Box>
              )}

              <Box sx={{ pt:2 }}>
                <Button type="submit" variant="contained" fullWidth sx={{ bgcolor:COLORS.primary, py:2 }}>{task ? "Actualizar Tarea" : "Publicar Tarea"}</Button>
                <Button fullWidth sx={{ mt:2 }} onClick={()=>router.back()}>Cancelar</Button>
              </Box>

            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}