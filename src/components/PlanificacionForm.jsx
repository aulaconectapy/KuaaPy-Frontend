'use client';
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  TextField, Button, Paper, Typography, Grid, Box, 
  IconButton, MenuItem, Select, Card, CardContent, Stack, 
  FormControl, Divider, InputLabel, Avatar, Checkbox, ListItemText, OutlinedInput
} from "@mui/material";
import { 
  AddCircle, Delete, EventNote, School, 
  ListAlt, Build, CheckCircle, Assignment 
} from "@mui/icons-material";

const COLORS = {
  primary: "#0038A8",     // Azul principal KuaaPy
  primaryDark: "#00257A", // Azul oscuro
  bgLight: "#F8FAFC",
  border: "#E2E8F0"
};

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

// 🔹 Unidades Temáticas de 1.º a 3.º Grado (Ciclo 1)
const UNIDADES_TEMATICAS_CICLO1 = {
  "Comunicación L1 Castellano": ["Comprensión de textos orales", "Expresión oral", "Comprensión de textos escritos", "Expresión escrita"],
  "Comunicación L2 (Guaraní)": ["Comprensión de textos orales", "Expresión oral", "Comprensión de textos escritos", "Expresión escrita"],
  "Matemática": ["El número y las operaciones", "La geometría y la medida", "Los datos y la estadística"],
  "Medio Natural y Salud": ["Materia y Energía", "Estructura, función y salud de los seres vivos", "Ambiente Saludable", "Universo"],
  "Vida Social y Trabajo": ["Ubicación en el tiempo y en el espacio", "Conviviendo en sociedad", "Disfrutando de las tareas laborales"],
  "Educación Artística": ["Música", "Artes Plásticas", "Danza Paraguaya", "Expresión Corporal"]
};

// 🔹 Unidades Temáticas de 4.º a 6.º Grado (Ciclo 2 - Actualizado con las que proporcionaste)
const UNIDADES_TEMATICAS_CICLO2 = {
  "Trabajo y Tecnología": [
    "Técnicas y Tecnologías del Hogar",
    "Técnicas y Tecnologías Agropecuarias",
    "Técnicas y Tecnologías de la Informática"
  ],
  "Matemática": [
    "El número y las operaciones",
    "La Geometría y la medida",
    "Los datos y la Estadística"
  ],
  "Lengua Materna (Castellano L1) y Segunda Lengua (Castellano L2)": [
    "Comprensión de textos orales",
    "Expresión oral",
    "Comprensión de textos escritos",
    "Expresión escrita"
  ],
  "Lengua Materna (Guaraní L1) y Segunda Lengua (Guaraní L2)": [
    "Oikūmbýta mba'e ohendúva oje'e ichupe guaraníme",
    "Oñe'ēkuaáta guaraníme",
    "Oikūmbýta jehaipyre omoñe'ẽva guaraníme",
    "Ohaíta guaraníme"
  ],
  "Ciencias Naturales": [
    "Materia y energía",
    "Seres vivos",
    "Ambiente",
    "Universo"
  ],
  "Ciencias Sociales": [
    "Ubicándome en el tiempo y en el espacio",
    "Conviviendo en sociedad"
  ],
  "Educación Artística": [
    "Los lenguajes artísticos",
    "Obras y autores - Contexto histórico"
  ],
  "Educación Física": [
    "Condición física y salud",
    "Deportes y recreación"
  ]
};

const ASIGNATURAS_POR_CICLO = {
  ciclo1: [
    "Comunicación L1 Castellano", "Comunicación L2 (Guaraní)", "Matemática",
    "Medio Natural y Salud", "Vida Social y Trabajo", "Educación Artística",
    "Educación Física", "Inglés"
  ],
  ciclo2: [
    "Lengua Castellana", "Lengua Guaraní", "Matemática", "Ciencias Naturales",
    "Salud", "Ciencias Sociales", "Educación Artística", "Educación Física",
    "Trabajo y Tecnología", "Inglés"
  ]
};

const PlanificacionForm = ({ initialData, onSubmit, loading, isReadOnly = false }) => {
  const { user } = useAuth();
  const isDirectivo = ['director/a', 'secretario/a', 'secretaria'].includes(user?.role?.toLowerCase());

  const [form, setForm] = useState({
    grado: "",
    fechaInicio: "",
    fechaFin: "",
    dias: DIAS.map(nombre => ({ nombreDia: nombre, materias: [] }))
  });

  const gradoDocente = useMemo(() => {
    if (initialData?.grado) return initialData.grado;
    if (user?.grades && user.grades.length > 0) return user.grades[0];
    return "";
  }, [user, initialData]);

  const numGrado = useMemo(() => {
    const parsed = parseInt(gradoDocente);
    return isNaN(parsed) ? 1 : parsed;
  }, [gradoDocente]);

  const materiasDisponibles = useMemo(() => {
    if (numGrado >= 1 && numGrado <= 3) return ASIGNATURAS_POR_CICLO.ciclo1;
    if (numGrado >= 4 && numGrado <= 6) return ASIGNATURAS_POR_CICLO.ciclo2;
    return ASIGNATURAS_POR_CICLO.ciclo1;
  }, [numGrado]);

  // Selección de diccionario de unidades según el ciclo del grado
  const unidadesTematicasDiccionario = useMemo(() => {
    if (numGrado >= 1 && numGrado <= 3) return UNIDADES_TEMATICAS_CICLO1;
    return UNIDADES_TEMATICAS_CICLO2;
  }, [numGrado]);

  useEffect(() => {
    if (initialData) {
      setForm({
        grado: initialData.grado || "",
        fechaInicio: initialData.fechaInicio ? initialData.fechaInicio.split("T")[0] : "",
        fechaFin: initialData.fechaFin ? initialData.fechaFin.split("T")[0] : "",
        dias: initialData.dias?.length > 0 ? initialData.dias.map(d => ({
          ...d,
          materias: d.materias.map(m => ({
            ...m,
            // Aseguramos que unidadTematica sea siempre un arreglo para la selección múltiple
            unidadTematica: Array.isArray(m.unidadTematica) ? m.unidadTematica : (m.unidadTematica ? [m.unidadTematica] : [])
          }))
        })) : DIAS.map(nombre => ({ nombreDia: nombre, materias: [] }))
      });
    } else if (gradoDocente) {
      setForm(prev => ({ ...prev, grado: gradoDocente }));
    }
  }, [initialData, gradoDocente]);

  const addMateria = (diaIndex) => {
    if (isReadOnly || isDirectivo) return;
    const newDias = [...form.dias];
    newDias[diaIndex].materias.push({
      asignatura: "", 
      unidadTematica: [], // 🔹 Inicializado como arreglo para múltiple selección
      tema: "", 
      capacidad: "",
      momentosDidacticos: "",
      guiaDocente: "", 
      cuadernilloEstudiante: "", 
      instrumentoEvaluacion: "Lista de cotejo",
      indicadores: [{ descripcion: "", puntos: 1 }]
    });
    setForm({ ...form, dias: newDias });
  };

  const removeMateria = (diaIndex, matIndex) => {
    if (isReadOnly || isDirectivo) return;
    const newDias = [...form.dias];
    newDias[diaIndex].materias.splice(matIndex, 1);
    setForm({ ...form, dias: newDias });
  };

  const handleMateriaChange = (diaIndex, matIndex, field, value) => {
    if (isReadOnly || isDirectivo) return;
    const newDias = [...form.dias];
    
    if (field === 'asignatura') {
      newDias[diaIndex].materias[matIndex].unidadTematica = []; // Limpiamos al cambiar de asignatura
    }

    newDias[diaIndex].materias[matIndex][field] = value;
    setForm({ ...form, dias: newDias });
  };

  // --- GESTIÓN DE INDICADORES DENTRO DE CADA MATERIA ---
  const handleIndicatorChange = (diaIndex, matIndex, indIndex, field, value) => {
    if (isReadOnly || isDirectivo) return;
    const newDias = [...form.dias];
    newDias[diaIndex].materias[matIndex].indicadores[indIndex][field] = field === "puntos" ? (value === "" ? 0 : Number(value)) : value;
    setForm({ ...form, dias: newDias });
  };

  const addIndicator = (diaIndex, matIndex) => {
    if (isReadOnly || isDirectivo) return;
    const newDias = [...form.dias];
    newDias[diaIndex].materias[matIndex].indicadores.push({ descripcion: "", puntos: 1 });
    setForm({ ...form, dias: newDias });
  };

  const removeIndicator = (diaIndex, matIndex, indIndex) => {
    if (isReadOnly || isDirectivo) return;
    const newDias = [...form.dias];
    newDias[diaIndex].materias[matIndex].indicadores.splice(indIndex, 1);
    setForm({ ...form, dias: newDias });
  };

  const handleSubmit = () => {
    if (!form.fechaInicio || !form.fechaFin) {
      alert("Por favor, seleccione la fecha de inicio y de fin de la semana.");
      return;
    }

    if (!form.grado) {
      alert("El grado es obligatorio.");
      return;
    }

    const formToSubmit = JSON.parse(JSON.stringify(form));
    onSubmit(formToSubmit);
  };

  const showActions = !isReadOnly && !isDirectivo;

  return (
    <Box sx={{ pb: showActions ? 12 : 2, bgcolor: COLORS.bgLight, minHeight: '100vh', p: { xs: 1, md: 3 } }}>
      
      {/* HEADER DATOS SEMANA */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: '24px', border: `1px solid ${COLORS.border}`, bgcolor: '#fff' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
          <Avatar sx={{ bgcolor: `${COLORS.primary}12`, color: COLORS.primary, width: 36, height: 36, borderRadius: '10px' }}><EventNote fontSize="small" /></Avatar>
          <Typography variant="h6" fontWeight="900" sx={{ color: '#0F172A' }}>Datos de la Semana</Typography>
        </Stack>
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={4}>
            <TextField 
              fullWidth 
              label="Grado" 
              value={form.grado} 
              disabled 
              size="small" 
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F8FAFC' } }} 
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField 
              fullWidth type="date" label="Desde *" 
              InputLabelProps={{ shrink: true }}
              value={form.fechaInicio || ""} 
              onChange={(e) => setForm({...form, fechaInicio: e.target.value})}
              disabled={isReadOnly || isDirectivo} 
              size="small"
              required
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField 
              fullWidth type="date" label="Hasta *" 
              InputLabelProps={{ shrink: true }}
              value={form.fechaFin || ""} 
              onChange={(e) => setForm({...form, fechaFin: e.target.value})}
              disabled={isReadOnly || isDirectivo} 
              size="small"
              required
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* LISTADO DE DÍAS (LUNES A VIERNES) */}
      {form.dias.map((dia, dIdx) => (
        <Box key={dia.nombreDia} sx={{ mb: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5, px: 1 }}>
            <Typography variant="h5" fontWeight="900" sx={{ color: COLORS.primary, display: 'flex', alignItems: 'center', gap: 1 }}>
              <School /> {dia.nombreDia}
            </Typography>
            {showActions && (
              <Button 
                size="small" 
                startIcon={<AddCircle />} 
                onClick={() => addMateria(dIdx)} 
                sx={{ color: COLORS.primary, fontWeight: 800, textTransform: 'none', bgcolor: '#EFF6FF', px: 2, borderRadius: '10px' }}
              >
                Agregar Materia
              </Button>
            )}
          </Stack>

          <Stack spacing={2.5}>
            {dia.materias.map((mat, mIdx) => (
              <Card key={mIdx} elevation={0} sx={{ borderRadius: '20px', border: `1px solid ${COLORS.border}`, bgcolor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Grid container spacing={2.5}>
                    
                    {/* ASIGNATURA */}
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Asignatura</InputLabel>
                        <Select
                          label="Asignatura"
                          value={mat.asignatura}
                          onChange={(e) => handleMateriaChange(dIdx, mIdx, 'asignatura', e.target.value)}
                          disabled={isReadOnly || isDirectivo}
                          sx={{ borderRadius: '12px' }}
                        >
                          {materiasDisponibles.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* UNIDADES TEMÁTICAS (MÚLTIPLE SELECCIÓN) */}
                    <Grid item xs={12} md={8}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Unidades Temáticas</InputLabel>
                        <Select
                          multiple
                          label="Unidades Temáticas"
                          value={Array.isArray(mat.unidadTematica) ? mat.unidadTematica : []}
                          onChange={(e) => handleMateriaChange(dIdx, mIdx, 'unidadTematica', e.target.value)}
                          input={<OutlinedInput label="Unidades Temáticas" sx={{ borderRadius: '12px' }} />}
                          renderValue={(selected) => selected.join(', ')}
                          disabled={!mat.asignatura || isReadOnly || isDirectivo}
                        >
                          {(unidadesTematicasDiccionario[mat.asignatura] || []).map((u) => (
                            <MenuItem key={u} value={u}>
                              <Checkbox checked={(mat.unidadTematica || []).indexOf(u) > -1} />
                              <ListItemText primary={u} />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* TEMA */}
                    <Grid item xs={12} md={6}>
                      <TextField 
                        label="Tema"
                        fullWidth multiline size="small"
                        value={mat.tema} 
                        onChange={(e) => handleMateriaChange(dIdx, mIdx, 'tema', e.target.value)} 
                        disabled={isReadOnly || isDirectivo} 
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                      />
                    </Grid>

                    {/* CAPACIDAD */}
                    <Grid item xs={12} md={6}>
                      <TextField 
                        label="Capacidad"
                        fullWidth multiline size="small"
                        value={mat.capacidad} 
                        onChange={(e) => handleMateriaChange(dIdx, mIdx, 'capacidad', e.target.value)} 
                        disabled={isReadOnly || isDirectivo} 
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                      />
                    </Grid>

                    {/* MOMENTOS DIDÁCTICOS */}
                    <Grid item xs={12}>
                      <TextField 
                        label="Momentos Didácticos (Opcional)"
                        fullWidth multiline rows={3} size="small"
                        value={mat.momentosDidacticos} 
                        onChange={(e) => handleMateriaChange(dIdx, mIdx, 'momentosDidacticos', e.target.value)} 
                        disabled={isReadOnly || isDirectivo} 
                        placeholder="Describa el inicio, desarrollo y cierre si lo requiere..."
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                      />
                    </Grid>

                    {/* INDICADORES DE EVALUACIÓN */}
                    <Grid item xs={12}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', mb: 1, display: 'block' }}>INDICADORES DE EVALUACIÓN:</Typography>
                      <Stack spacing={1.5}>
                        {(mat.indicadores || []).map((ind, iIdx) => (
                          <Stack key={iIdx} direction="row" spacing={1.5} alignItems="center">
                            <TextField 
                              fullWidth 
                              size="small"
                              placeholder={`Indicador ${iIdx + 1}`}
                              value={ind.descripcion} 
                              onChange={(e) => handleIndicatorChange(dIdx, mIdx, iIdx, 'descripcion', e.target.value)} 
                              disabled={isReadOnly || isDirectivo}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#fff' } }}
                            />
                            <TextField 
                              type="number" 
                              size="small"
                              label="Pts" 
                              value={ind.puntos} 
                              onChange={(e) => handleIndicatorChange(dIdx, mIdx, iIdx, 'puntos', e.target.value)} 
                              disabled={isReadOnly || isDirectivo}
                              sx={{ width: 90, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#fff' } }} 
                            />
                            {showActions && (
                              <IconButton color="error" size="small" onClick={() => removeIndicator(dIdx, mIdx, iIdx)}>
                                <Delete fontSize="small" />
                              </IconButton>
                            )}
                          </Stack>
                        ))}
                        {showActions && (
                          <Button size="small" startIcon={<AddCircle />} onClick={() => addIndicator(dIdx, mIdx)} sx={{ fontWeight: 700, width: 'fit-content' }}>
                            Agregar Indicador
                          </Button>
                        )}
                      </Stack>
                    </Grid>

                    {/* PÁGINAS Y EVALUACIÓN */}
                    <Grid item xs={4} md={2}>
                      <TextField label="Guía Pág." fullWidth size="small" value={mat.guiaDocente} onChange={(e) => handleMateriaChange(dIdx, mIdx, 'guiaDocente', e.target.value)} disabled={isReadOnly || isDirectivo} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                    </Grid>
                    <Grid item xs={4} md={2}>
                      <TextField label="Cuad. Pág." fullWidth size="small" value={mat.cuadernilloEstudiante} onChange={(e) => handleMateriaChange(dIdx, mIdx, 'cuadernilloEstudiante', e.target.value)} disabled={isReadOnly || isDirectivo} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                    </Grid>
                    <Grid item xs={4} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Evaluación</InputLabel>
                        <Select value={mat.instrumentoEvaluacion} label="Evaluación" onChange={(e) => handleMateriaChange(dIdx, mIdx, 'instrumentoEvaluacion', e.target.value)} disabled={isReadOnly || isDirectivo} sx={{ borderRadius: '12px' }}>
                          <MenuItem value="Lista de cotejo">Lista de cotejo</MenuItem>
                          <MenuItem value="Rúbrica">Rúbrica</MenuItem>
                          <MenuItem value="RSA">RSA</MenuItem>
                          <MenuItem value="Prueba Escrita">Prueba Escrita</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {showActions && (
                      <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Button color="error" variant="outlined" startIcon={<Delete />} onClick={() => removeMateria(dIdx, mIdx)} size="small" sx={{ borderRadius: '10px', textTransform: 'none' }}>
                          Eliminar Materia
                        </Button>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Stack>
          <Divider sx={{ mt: 3, opacity: 0.5 }} />
        </Box>
      ))}

      {/* FOOTER ACCIÓN GUARDAR */}
      {showActions && (
        <Box sx={{ 
          position: 'fixed', bottom: 0, left: 0, right: 0, 
          p: 2.5, bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', 
          borderTop: `1px solid ${COLORS.border}`, zIndex: 1000, textAlign: 'center' 
        }}>
          <Button 
            variant="contained" fullWidth size="large" 
            onClick={handleSubmit} 
            disabled={loading}
            sx={{ 
              bgcolor: COLORS.primary, borderRadius: '14px', maxWidth: '500px', 
              py: 1.5, fontWeight: 800, textTransform: 'none',
              boxShadow: '0 8px 20px rgba(0,56,168,0.2)',
              '&:hover': { bgcolor: COLORS.primaryDark }
            }}
          >
            {loading ? "Guardando..." : "Finalizar Planificación"}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default PlanificacionForm;