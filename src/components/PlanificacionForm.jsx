'use client';
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  TextField, Button, Paper, Typography, Grid, Box, 
  IconButton, MenuItem, Select, Card, CardContent, Stack, 
  FormControl, Divider, InputLabel
} from "@mui/material";
import { AddCircle, Delete, EventNote, School } from "@mui/icons-material";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

// 🔹 Unidades Temáticas extraídas de tu documento de 3º Grado
const UNIDADES_TEMATICAS_3GRADO = {
  "Comunicación L1 Castellano": ["Comprensión de textos orales", "Expresión oral", "Comprensión de textos escritos", "Expresión escrita"],
  "Comunicación L2 (Guaraní)": ["Comprensión de textos orales", "Expresión oral", "Comprensión de textos escritos", "Expresión escrita"],
  "Matemática": ["El número y las operaciones", "La geometría y la medida", "Los datos y la estadística"],
  "Medio Natural y Salud": ["Materia y Energía", "Estructura, función y salud de los seres vivos", "Ambiente Saludable", "Universo"],
  "Vida Social y Trabajo": ["Ubicación en el tiempo y en el espacio", "Conviviendo en sociedad", "Disfrutando de las tareas laborales"],
  "Educación Artística": ["Música", "Artes Plásticas", "Danza Paraguaya", "Expresión Corporal"]
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

  const materiasDisponibles = useMemo(() => {
    const numGrado = parseInt(gradoDocente);
    if (isNaN(numGrado)) return [];
    if (numGrado >= 1 && numGrado <= 3) return ASIGNATURAS_POR_CICLO.ciclo1;
    if (numGrado >= 4 && numGrado <= 6) return ASIGNATURAS_POR_CICLO.ciclo2;
    return [];
  }, [gradoDocente]);

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    } else if (gradoDocente) {
      setForm(prev => ({ ...prev, grado: gradoDocente }));
    }
  }, [initialData, gradoDocente]);

  const addMateria = (diaIndex) => {
    if (isReadOnly || isDirectivo) return;
    const newDias = [...form.dias];
    newDias[diaIndex].materias.push({
      asignatura: "", 
      unidadTematica: "", 
      unidadTematicaPersonalizada: "", 
      tema: "", 
      guiaDocente: "", 
      cuadernilloEstudiante: "", 
      instrumentoEvaluacion: "Lista de cotejo"
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
      newDias[diaIndex].materias[matIndex].unidadTematica = "";
      newDias[diaIndex].materias[matIndex].unidadTematicaPersonalizada = "";
    }

    newDias[diaIndex].materias[matIndex][field] = value;
    setForm({ ...form, dias: newDias });
  };

  // 🔹 Procesar antes de enviar a la DB
  const handleSubmit = () => {
    const formToSubmit = JSON.parse(JSON.stringify(form));

    formToSubmit.dias.forEach(dia => {
      dia.materias.forEach(mat => {
        // Si eligió "Otro", reemplazamos el valor por lo escrito
        if (mat.unidadTematica === "Otro") {
          mat.unidadTematica = mat.unidadTematicaPersonalizada || "Personalizada";
        }
        // Limpiamos campos auxiliares
        delete mat.unidadTematicaPersonalizada;
      });
    });

    onSubmit(formToSubmit);
  };

  const showActions = !isReadOnly && !isDirectivo;

  return (
    <Box sx={{ pb: showActions ? 10 : 2 }}>
      
      {/* HEADER DATOS SEMANA */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 4, border: '1px solid #e0e0e0', bgcolor: '#fff' }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <EventNote color="action" />
          <Typography variant="h6" fontWeight="bold">Datos de la Semana</Typography>
        </Stack>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Grado" value={form.grado} disabled variant="filled" size="small" />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField 
              fullWidth type="date" label="Desde" 
              InputLabelProps={{ shrink: true }}
              value={form.fechaInicio?.split('T')[0] || ""} 
              onChange={(e) => setForm({...form, fechaInicio: e.target.value})}
              disabled={isReadOnly || isDirectivo} size="small"
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField 
              fullWidth type="date" label="Hasta" 
              InputLabelProps={{ shrink: true }}
              value={form.fechaFin?.split('T')[0] || ""} 
              onChange={(e) => setForm({...form, fechaFin: e.target.value})}
              disabled={isReadOnly || isDirectivo} size="small"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* LISTADO DE DÍAS */}
      {form.dias.map((dia, dIdx) => (
        <Box key={dia.nombreDia} sx={{ mb: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5, px: 1 }}>
            <Typography variant="h5" fontWeight="900" sx={{ color: '#7D0F15', display: 'flex', alignItems: 'center', gap: 1 }}>
              <School /> {dia.nombreDia}
            </Typography>
            {showActions && (
              <Button size="small" startIcon={<AddCircle />} onClick={() => addMateria(dIdx)} sx={{ color: '#7D0F15', fontWeight: 'bold' }}>
                Materia
              </Button>
            )}
          </Stack>

          <Stack spacing={2}>
            {dia.materias.map((mat, mIdx) => (
              <Card key={mIdx} sx={{ borderRadius: 3, border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    
                    {/* ASIGNATURA */}
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Asignatura</InputLabel>
                        <Select
                          label="Asignatura"
                          value={mat.asignatura}
                          onChange={(e) => handleMateriaChange(dIdx, mIdx, 'asignatura', e.target.value)}
                          disabled={isReadOnly || isDirectivo}
                        >
                          {materiasDisponibles.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* UNIDAD TEMÁTICA */}
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Unidad Temática</InputLabel>
                        <Select
                          label="Unidad Temática"
                          value={mat.unidadTematica}
                          onChange={(e) => handleMateriaChange(dIdx, mIdx, 'unidadTematica', e.target.value)}
                          disabled={!mat.asignatura || isReadOnly || isDirectivo}
                        >
                          {(UNIDADES_TEMATICAS_3GRADO[mat.asignatura] || []).map(u => (
                            <MenuItem key={u} value={u}>{u}</MenuItem>
                          ))}
                          <MenuItem value="Otro">-- Otro (Escribir) --</MenuItem>
                        </Select>
                      </FormControl>
                      
                      {mat.unidadTematica === "Otro" && (
                        <TextField 
                          sx={{ mt: 1 }}
                          fullWidth size="small"
                          label="Escriba la Unidad"
                          autoFocus
                          placeholder="Nombre de la unidad..."
                          value={mat.unidadTematicaPersonalizada || ""} 
                          onChange={(e) => handleMateriaChange(dIdx, mIdx, 'unidadTematicaPersonalizada', e.target.value)}
                        />
                      )}
                    </Grid>

                    {/* TEMA */}
                    <Grid item xs={12} md={5}>
                      <TextField 
                        label="Tema / Capacidad"
                        fullWidth multiline size="small"
                        value={mat.tema} 
                        onChange={(e) => handleMateriaChange(dIdx, mIdx, 'tema', e.target.value)} 
                        disabled={isReadOnly || isDirectivo} 
                      />
                    </Grid>

                    {/* FILA INFERIOR: PÁGINAS Y EVALUACIÓN */}
                    <Grid item xs={4} md={1.5}>
                      <TextField label="Guía Pág." fullWidth size="small" value={mat.guiaDocente} onChange={(e) => handleMateriaChange(dIdx, mIdx, 'guiaDocente', e.target.value)} disabled={isReadOnly || isDirectivo} />
                    </Grid>
                    <Grid item xs={4} md={1.5}>
                      <TextField label="Cuad. Pág." fullWidth size="small" value={mat.cuadernilloEstudiante} onChange={(e) => handleMateriaChange(dIdx, mIdx, 'cuadernilloEstudiante', e.target.value)} disabled={isReadOnly || isDirectivo} />
                    </Grid>
                    <Grid item xs={4} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Evaluación</InputLabel>
                        <Select value={mat.instrumentoEvaluacion} label="Evaluación" onChange={(e) => handleMateriaChange(dIdx, mIdx, 'instrumentoEvaluacion', e.target.value)} disabled={isReadOnly || isDirectivo}>
                          <MenuItem value="Lista de cotejo">Lista de cotejo</MenuItem>
                          <MenuItem value="Rúbrica">Rúbrica</MenuItem>
                          <MenuItem value="RSA">RSA</MenuItem>
                          <MenuItem value="Prueba Escrita">Prueba Escrita</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {showActions && (
                      <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <IconButton color="error" onClick={() => removeMateria(dIdx, mIdx)} size="small">
                          <Delete />
                        </IconButton>
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
          p: 2, bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', 
          borderTop: '1px solid #ddd', zIndex: 1000, textAlign: 'center' 
        }}>
          <Button 
            variant="contained" fullWidth size="large" 
            onClick={handleSubmit} 
            disabled={loading}
            sx={{ 
              bgcolor: '#7D0F15', borderRadius: 3, maxWidth: '500px', 
              py: 1.5, fontWeight: 'bold', '&:hover': { bgcolor: '#5d0b10' }
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