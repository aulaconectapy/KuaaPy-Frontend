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
  Quiz as QuizIcon,
  ContentCopy as CopyIcon,
  AutoFixHigh as AutoFixHighIcon,
  CheckCircleOutline as CheckCircleIcon
} from "@mui/icons-material";
import { createTask, updateTask } from "@/services/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// CONSTANTES DE ESTILO KUAAPY
const COLORS = {
  primary: "#0038A8",     // Azul principal KuaaPy
  primaryDark: "#00257A", // Azul oscuro
  red: "#D52B1E",         // Acento rojo
  bgLight: "#F8FAFC",
  border: "#E2E8F0",
  gradient: "linear-gradient(135deg, #0038A8 0%, #00257A 100%)"
};

const SUBJECTS_BY_GRADE = {
  lower: [
    "Comunicación",
    "Matemáticas",
    "Medio Natural y Salud",
    "Guaraní",
    "Educación Física",
    "Educación Artística",
    "Vida Social y Trabajo",
  ],
  upper: [
    "Castellano",
    "Guaraní",
    "Educación para la Salud",
    "Ciencias Sociales",
    "Ciencias Naturales",
    "Matemática",
    "Trabajo y Tecnología",
    "Educación Artística",
    "Educación Física",
  ],
};

const getSubjectsByGrade = (grade) => {
  if (["1° grado", "2° grado", "3° grado"].includes(grade)) return SUBJECTS_BY_GRADE.lower;
  if (["4° grado", "5° grado", "6° grado"].includes(grade)) return SUBJECTS_BY_GRADE.upper;
  return [];
};

const normalizeText = (str = "") =>
  str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

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
    consigna: "",
    observacion: "",
    indicators: [{ description: "", points: 1 }],
    rubricCriteria: [{ criterion: "", levels: [{ level: "", descriptor: "", points: 1 }] }],
  });

  // Estados para la Carga Rápida de Indicadores y Éxito
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

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
        consigna: task.consigna || "",
        observacion: task.observacion || "",
        indicators: task.indicators?.length > 0 ? task.indicators : [{ description: "", points: 1 }],
        rubricCriteria: task.rubricCriteria?.length > 0 ? task.rubricCriteria : [{ criterion: "", levels: [{ level: "", descriptor: "", points: 1 }] }],
      });
    }
  }, [task]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "grade") {
      setFormData({
        ...formData,
        grade: value,
        subject: "",
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleIndicatorChange = (index, field, value) => {
    const updated = [...formData.indicators];
    updated[index][field] = field === "points" ? (value === "" ? 0 : Number(value)) : value;
    setFormData({ ...formData, indicators: updated });
  };

  const addIndicator = () => setFormData({ ...formData, indicators: [...formData.indicators, { description: "", points: 1 }] });
  
  const duplicateIndicator = (index) => {
    const target = formData.indicators[index];
    const duplicated = { description: target.description, points: target.points };
    const updated = [...formData.indicators];
    updated.splice(index + 1, 0, duplicated);
    setFormData({ ...formData, indicators: updated });
  };

  const removeIndicator = index => setFormData({ ...formData, indicators: formData.indicators.filter((_, i) => i !== index) });

  // --- Carga Rápida de Texto (IA) ---
  const handleBulkTextParse = () => {
    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n');
    const parsedIndicators = [];

    let detectedGrade = formData.grade;
    let detectedTopic = formData.topic;
    let detectedDate = formData.dueDate;
    let detectedSubject = formData.subject;
    let detectedTaskType = formData.taskType;

    lines.forEach((line) => {
      const trimmed = line.trim();
      const normLine = normalizeText(trimmed);

      // 1. Grado (si viene en el texto)
      if (normLine.includes('grado:')) {
        const gradeMatch = trimmed.match(/grado:\s*(.*?)(?:\s*[—-]{1,2}\s*|$)/i);
        if (gradeMatch && gradeMatch[1]) {
          const rawGrade = gradeMatch[1].trim();
          const matchedGrade = user?.grades?.find(
            (g) => normalizeText(g) === normalizeText(rawGrade)
          );
          detectedGrade = matchedGrade || rawGrade;
        }
      }

      // 2. Tema
      if (normLine.includes('tema:')) {
        const match = trimmed.match(/tema:\s*(.*?)(?:\s*[—-]{1,2}\s*|$)/i);
        if (match && match[1]) detectedTopic = match[1].trim();
      }

      // 3. Fecha (acepta con o sin día de la semana, con / o -)
      const dateMatch = trimmed.match(/fecha[^:]*:\s*(?:[a-zA-ZáéíóúÁÉÍÓÚñÑ]+\s+)?(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i);
      if (dateMatch) {
        const day = dateMatch[1].padStart(2, '0');
        const month = dateMatch[2].padStart(2, '0');
        let year = dateMatch[3];
        if (year.length === 2) year = "20" + year;
        detectedDate = `${year}-${month}-${day}`;
      }

      // 4. Asignatura
      if (normLine.includes('asignatura:')) {
        const subjMatch = trimmed.match(/asignatura:\s*(.*?)(?:\s*[—-]{1,2}\s*|$)/i);
        if (subjMatch && subjMatch[1]) {
          const rawSubject = subjMatch[1].trim();
          const gradePool = getSubjectsByGrade(detectedGrade);
          const allSubjects = [...new Set([...gradePool, ...SUBJECTS_BY_GRADE.upper, ...SUBJECTS_BY_GRADE.lower])];
          const foundSubject = allSubjects.find(
            (s) => normalizeText(s) === normalizeText(rawSubject)
          );
          detectedSubject = foundSubject || rawSubject;
        }
      } else if (normLine.includes('guarani') || normLine.includes("ne'e")) {
        detectedSubject = "Guaraní";
      }

      // 5. Tipo de evaluación
      if (normLine.includes('sumativ')) detectedTaskType = "sumativo";
      else if (normLine.includes('formativ')) detectedTaskType = "formativo";
      else if (normLine.includes('diagnostic')) detectedTaskType = "diagnostico";

      // 6. Indicadores
      const indicatorMatch = trimmed.match(/^[-*•]\s*(.*)$/);
      if (indicatorMatch && indicatorMatch[1]) {
        parsedIndicators.push({ description: indicatorMatch[1].trim(), points: 1 });
      }
    });

    if (
      parsedIndicators.length > 0 ||
      detectedGrade !== formData.grade ||
      detectedTopic !== formData.topic ||
      detectedDate !== formData.dueDate ||
      detectedSubject !== formData.subject ||
      detectedTaskType !== formData.taskType
    ) {
      setFormData((prev) => ({
        ...prev,
        grade: detectedGrade,
        topic: detectedTopic,
        dueDate: detectedDate,
        subject: detectedSubject,
        taskType: detectedTaskType,
        indicators:
          prev.indicators.length === 1 && prev.indicators[0].description === ""
            ? parsedIndicators
            : [...prev.indicators, ...parsedIndicators],
      }));
      setBulkText("");
      setShowBulkInput(false);
    } else {
      alert("No se detectaron indicadores. Asegúrese de que cada indicador empiece con un guión (-).");
    }
  };

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

  // --- Función para resetear y crear nueva ---
  const handleCreateNew = () => {
    setFormData({
      subject: "",
      topic: "",
      grade: user?.grades?.length === 1 ? user.grades[0] : "",
      taskType: "formativo",
      instrumentType: "lista_cotejo",
      dueDate: "",
      status: "pendiente",
      consigna: "",
      observacion: "",
      indicators: [{ description: "", points: 1 }],
      rubricCriteria: [{ criterion: "", levels: [{ level: "", descriptor: "", points: 1 }] }],
    });
    setIsSuccess(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Submit ---
  const handleSubmit = async e => {
    e.preventDefault();
    if (!user) return alert("Usuario no cargado");
    if (!formData.subject.trim() || !formData.topic.trim() || !formData.grade) return alert("Debe completar asignatura, tema y grado");
    if (!formData.dueDate) return alert("Debe seleccionar fecha de entrega");

    const payload = { ...formData, institution: user.institution?._id || user.institution, teacher: user._id };

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
      
      setIsSuccess(true);
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

  // --- PANTALLA DE ÉXITO ---
  if (isSuccess) {
    return (
      <Box sx={{ bgcolor: COLORS.bgLight, minHeight: "100vh", py: { xs: 3, md: 5 } }}>
        <Container maxWidth="sm">
          <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, borderRadius: '24px', border: `1px solid ${COLORS.border}`, bgcolor: '#fff', textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 80, color: '#10B981', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.primary, mb: 2, letterSpacing: '-0.02em' }}>
              ¡Tarea {task ? "actualizada" : "creada"} con éxito!
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748B', mb: 5, fontSize: '1.1rem' }}>
              La tarea ha sido guardada correctamente en tu panel.
            </Typography>
            <Stack spacing={2}>
              <Button 
                variant="contained" 
                onClick={handleCreateNew}
                sx={{ 
                  bgcolor: COLORS.primary, 
                  borderRadius: '14px', 
                  py: 1.5, 
                  fontWeight: 800,
                  fontSize: '1rem',
                  textTransform: 'none',
                  boxShadow: '0 8px 20px rgba(0,56,168,0.2)',
                  '&:hover': { bgcolor: COLORS.primaryDark }
                }}
              >
                Crear Nueva Tarea
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => router.push("/teacher/classes/tasks")}
                sx={{ 
                  borderColor: COLORS.border, 
                  color: '#0F172A', 
                  borderRadius: '14px', 
                  py: 1.5, 
                  fontWeight: 800,
                  fontSize: '1rem',
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#F8FAFC' }
                }}
              >
                Ir a Mis Tareas
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  const SectionTitle = ({ icon: Icon, title }) => (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
      <Avatar sx={{ bgcolor: `${COLORS.primary}12`, color: COLORS.primary, width: 40, height: 40, borderRadius: '12px' }}><Icon /></Avatar>
      <Typography variant="h6" sx={{ fontWeight: 900, color: "#0F172A", letterSpacing: '-0.01em' }}>{title}</Typography>
    </Stack>
  );

  const gradeSubjects = getSubjectsByGrade(formData.grade);
  const availableSubjects =
    formData.subject && !gradeSubjects.includes(formData.subject)
      ? [formData.subject, ...gradeSubjects]
      : gradeSubjects;

  return (
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: "100vh", py: { xs: 3, md: 5 } }}>
      <Container maxWidth="md">
        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: '24px', border: `1px solid ${COLORS.border}`, bgcolor: '#fff' }}>
          
          <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.primary, mb: 0.5, letterSpacing: '-0.02em' }}>
            {task ? "Editar Tarea" : "Crear Nueva Tarea"}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, mb: 4 }}>
            Configure los detalles de la actividad y defina los criterios de evaluación en KuaaPy.
          </Typography>

          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              
              {/* GENERAL */}
              <Box>
                <SectionTitle icon={AssignmentIcon} title="Configuración General" />
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Grado"
                      name="grade"
                      value={formData.grade}
                      onChange={handleChange}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    >
                      {user?.grades?.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Asignatura"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      disabled={!formData.grade && !formData.subject}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    >
                      {availableSubjects.map((subject) => (
                        <MenuItem key={subject} value={subject}>
                          {subject}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField 
                      fullWidth 
                      size="small" 
                      label="Tema de la clase" 
                      name="topic" 
                      value={formData.topic} 
                      onChange={handleChange} 
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField 
                      fullWidth 
                      label="Consigna (Instrucciones para el estudiante)" 
                      name="consigna" 
                      value={formData.consigna} 
                      onChange={handleChange}
                      multiline
                      rows={3}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField 
                      select 
                      fullWidth 
                      size="small" 
                      label="Tipo de Evaluación" 
                      name="taskType" 
                      value={formData.taskType} 
                      onChange={handleChange}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    >
                      <MenuItem value="diagnostico">Diagnóstico</MenuItem>
                      <MenuItem value="formativo">Formativo</MenuItem>
                      <MenuItem value="sumativo">Sumativo</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField 
                      type="date" 
                      fullWidth 
                      size="small" 
                      label="Fecha de Entrega" 
                      name="dueDate" 
                      value={formData.dueDate} 
                      onChange={handleChange} 
                      InputLabelProps={{ shrink: true }} 
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField 
                      select 
                      fullWidth 
                      size="small" 
                      label="Instrumento de Evaluación" 
                      name="instrumentType" 
                      value={formData.instrumentType} 
                      onChange={handleChange}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    >
                      <MenuItem value="lista_cotejo">Lista de Cotejo</MenuItem>
                      <MenuItem value="rubrica">Rúbrica</MenuItem>
                      <MenuItem value="rsa">RSA</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ borderColor: '#F1F5F9' }} />

              {/* Lista de Cotejo o RSA indicadores */}
              {(formData.instrumentType === "lista_cotejo" || formData.instrumentType === "rsa") && (
                <Box>
                  <SectionTitle icon={ChecklistIcon} title="Indicadores de Evaluación" />
                  
                  {/* --- BLOQUE DE CARGA RÁPIDA --- */}
                  <Box sx={{ mb: 3 }}>
                    <Button 
                      startIcon={<AutoFixHighIcon />} 
                      onClick={() => setShowBulkInput(!showBulkInput)}
                      sx={{ color: COLORS.primary, fontWeight: 700, textTransform: 'none', mb: 1, bgcolor: '#EFF6FF', borderRadius: '10px' }}
                    >
                      Carga Rápida (Pegar texto de IA)
                    </Button>

                    {showBulkInput && (
                      <Box sx={{ p: 2, mt: 1, bgcolor: '#F8FAFC', borderRadius: '12px', border: `1px dashed ${COLORS.primary}` }}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
                          Pegue aquí el texto. Detectará Asignatura, Tema, Fecha y Tipo de Evaluación automáticamente, y creará un indicador por cada línea con <b>guión (-)</b>.
                        </Typography>
                        <TextField
                          fullWidth
                          multiline
                          rows={5}
                          size="small"
                          placeholder={"Ejemplo:\nAsignatura: Ciencias Naturales — Evaluación: Sumativo\nTema: Clases de rocas — Fecha de clase: Lunes 10/08/26\n- Cita las clases de rocas estudiadas..."}
                          value={bulkText}
                          onChange={(e) => setBulkText(e.target.value)}
                          sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: '10px' }, mb: 2 }}
                        />
                        <Stack direction="row" spacing={2}>
                          <Button 
                            variant="contained" 
                            size="small" 
                            onClick={handleBulkTextParse}
                            sx={{ bgcolor: COLORS.primary, borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
                          >
                            Procesar e Insertar
                          </Button>
                          <Button 
                            size="small" 
                            onClick={() => { setBulkText(""); setShowBulkInput(false); }}
                            sx={{ color: '#64748B', textTransform: 'none', fontWeight: 700 }}
                          >
                            Cancelar
                          </Button>
                        </Stack>
                      </Box>
                    )}
                  </Box>
                  {/* --- FIN BLOQUE CARGA RÁPIDA --- */}

                  <Stack spacing={2}>
                    {formData.indicators.map((ind, index) => (
                      <Stack 
                        key={index} 
                        direction="row" 
                        spacing={2} 
                        alignItems="flex-start" 
                        sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '16px', border: `1px solid ${COLORS.border}` }}
                      >
                        <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: COLORS.primary, fontWeight: 800, borderRadius: '8px' }}>
                          {index + 1}
                        </Avatar>
                        <TextField 
                          fullWidth 
                          size="small"
                          label="Descripción" 
                          value={ind.description} 
                          onChange={(e) => handleIndicatorChange(index, "description", e.target.value)} 
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#fff' } }}
                        />
                        <TextField 
                          type="number" 
                          size="small"
                          label="Pts" 
                          value={ind.points} 
                          onChange={(e) => handleIndicatorChange(index, "points", e.target.value)} 
                          sx={{ width: 90, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#fff' } }} 
                        />
                        
                        <Tooltip title="Duplicar indicador">
                          <IconButton onClick={() => duplicateIndicator(index)} sx={{ color: COLORS.primary, bgcolor: '#EFF6FF', p: 1, borderRadius: '10px' }}>
                            <CopyIcon fontSize="small"/>
                          </IconButton>
                        </Tooltip>

                        {formData.indicators.length > 1 && (
                          <Tooltip title="Eliminar">
                            <IconButton onClick={() => removeIndicator(index)} sx={{ color: '#EF4444', bgcolor: '#FEF2F2', p: 1, borderRadius: '10px' }}>
                              <DeleteIcon fontSize="small"/>
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    ))}
                    <Button 
                      variant="outlined"
                      startIcon={<AddIcon />} 
                      onClick={addIndicator}
                      sx={{ borderColor: COLORS.primary, color: COLORS.primary, borderRadius: '12px', fontWeight: 800, textTransform: 'none', width: 'fit-content' }}
                    >
                      Agregar Indicador
                    </Button>
                    {formData.instrumentType === "rsa" && (
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                        Estos indicadores se aplicarán automáticamente a los 3 momentos de la evaluación RSA.
                      </Typography>
                    )}
                  </Stack>
                </Box>
              )}

              {/* Rúbrica */}
              {formData.instrumentType === "rubrica" && (
                <Box>
                  <SectionTitle icon={QuizIcon} title="Criterios de Rúbrica" />
                  <Stack spacing={2.5}>
                    {formData.rubricCriteria.map((c, index) => (
                      <Box key={index} sx={{ p: 2.5, bgcolor: '#F8FAFC', borderRadius: '16px', border: `1px solid ${COLORS.border}` }}>
                        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                          <TextField 
                            fullWidth 
                            size="small"
                            label="Criterio" 
                            value={c.criterion} 
                            onChange={(e) => handleRubricCriterionChange(index, "criterion", e.target.value)} 
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#fff' } }}
                          />
                          <Button 
                            color="error" 
                            size="small"
                            onClick={() => removeRubricCriterion(index)}
                            sx={{ fontWeight: 700, textTransform: 'none' }}
                          >
                            Eliminar Criterio
                          </Button>
                        </Stack>

                        <Stack spacing={1.5}>
                          {c.levels.map((lvl, lIndex) => (
                            <Stack key={lIndex} direction="row" spacing={1.5} alignItems="center">
                              <TextField 
                                size="small"
                                label="Nivel" 
                                value={lvl.level} 
                                onChange={(e) => handleRubricLevelChange(index, lIndex, "level", e.target.value)} 
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#fff' }, width: '130px' }}
                              />
                              <TextField 
                                fullWidth
                                size="small"
                                label="Descripción" 
                                value={lvl.descriptor} 
                                onChange={(e) => handleRubricLevelChange(index, lIndex, "descriptor", e.target.value)} 
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#fff' } }}
                              />
                              <TextField 
                                type="number" 
                                size="small"
                                label="Pts" 
                                value={lvl.points} 
                                onChange={(e) => handleRubricLevelChange(index, lIndex, "points", e.target.value)} 
                                sx={{ width: 80, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#fff' } }} 
                              />
                              {c.levels.length > 1 && (
                                <IconButton color="error" size="small" onClick={() => removeRubricLevel(index, lIndex)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Stack>
                          ))}
                        </Stack>

                        <Button 
                          size="small"
                          onClick={() => addRubricLevel(index)}
                          sx={{ mt: 1.5, color: COLORS.primary, fontWeight: 700, textTransform: 'none' }}
                        >
                          + Agregar Nivel
                        </Button>
                      </Box>
                    ))}
                    <Button 
                      variant="outlined"
                      startIcon={<AddIcon />} 
                      onClick={addRubricCriterion}
                      sx={{ borderColor: COLORS.primary, color: COLORS.primary, borderRadius: '12px', fontWeight: 800, textTransform: 'none', width: 'fit-content' }}
                    >
                      Agregar Criterio
                    </Button>
                  </Stack>
                </Box>
              )}

              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="Observación (Opcional)" 
                  name="observacion" 
                  value={formData.observacion} 
                  onChange={handleChange}
                  multiline
                  rows={2}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>

              <Box sx={{ pt: 2 }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  fullWidth 
                  sx={{ 
                    bgcolor: COLORS.primary, 
                    borderRadius: '14px', 
                    py: 1.5, 
                    fontWeight: 800,
                    textTransform: 'none',
                    boxShadow: '0 8px 20px rgba(0,56,168,0.2)',
                    '&:hover': { bgcolor: COLORS.primaryDark }
                  }}
                >
                  {task ? "Actualizar Tarea" : "Publicar Tarea"}
                </Button>
                
                <Button 
                  fullWidth 
                  sx={{ mt: 1.5, color: '#64748B', fontWeight: 700, textTransform: 'none' }} 
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
              </Box>

            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}