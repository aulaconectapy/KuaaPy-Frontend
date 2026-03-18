'use client';
import { useState, useEffect } from "react";
import { 
  TextField, Button, Paper, Typography, Grid, Box, 
  IconButton, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, MenuItem, Select, Card, CardContent, Stack
} from "@mui/material";
import { AddCircle, Delete, Save } from "@mui/icons-material";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

const PlanificacionForm = ({ initialData, onSubmit, loading, isReadOnly = false }) => {
  const [form, setForm] = useState({
    grado: "",
    fechaInicio: "",
    fechaFin: "",
    dias: DIAS.map(nombre => ({ nombreDia: nombre, materias: [] }))
  });

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    } else {
      // Resetear si es nuevo
      setForm({
        grado: "",
        fechaInicio: "",
        fechaFin: "",
        dias: DIAS.map(nombre => ({ nombreDia: nombre, materias: [] }))
      });
    }
  }, [initialData]);

  const addMateria = (diaIndex) => {
    if (isReadOnly) return;
    const newDias = [...form.dias];
    newDias[diaIndex].materias.push({
      asignatura: "", tema: "", unidadTematica: "",
      guiaDocente: "", cuadernilloEstudiante: "", instrumentoEvaluacion: "Lista de cotejo"
    });
    setForm({ ...form, dias: newDias });
  };

  const removeMateria = (diaIndex, matIndex) => {
    if (isReadOnly) return;
    const newDias = [...form.dias];
    newDias[diaIndex].materias.splice(matIndex, 1);
    setForm({ ...form, dias: newDias });
  };

  const handleMateriaChange = (diaIndex, matIndex, field, value) => {
    if (isReadOnly) return;
    const newDias = [...form.dias];
    newDias[diaIndex].materias[matIndex][field] = value;
    setForm({ ...form, dias: newDias });
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* SECCIÓN DE CABECERA */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 4, bgcolor: isReadOnly ? '#f5f5f5' : 'white' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField 
              fullWidth label="Grado" 
              disabled={isReadOnly}
              value={form.grado} 
              onChange={(e) => setForm({...form, grado: e.target.value})} 
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField 
              fullWidth type="date" label="Desde (Lunes)" 
              disabled={isReadOnly}
              InputLabelProps={{ shrink: true }}
              value={form.fechaInicio?.split('T')[0] || ""} 
              onChange={(e) => setForm({...form, fechaInicio: e.target.value})} 
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField 
              fullWidth type="date" label="Hasta (Viernes)" 
              disabled={isReadOnly}
              InputLabelProps={{ shrink: true }}
              value={form.fechaFin?.split('T')[0] || ""} 
              onChange={(e) => setForm({...form, fechaFin: e.target.value})} 
            />
          </Grid>
        </Grid>
      </Paper>

      {/* SECCIÓN DE DÍAS */}
      {form.dias.map((dia, dIdx) => (
        <Card key={dia.nombreDia} sx={{ mb: 4, borderRadius: 3, borderLeft: `6px solid #7D0F15` }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">{dia.nombreDia}</Typography>
              {!isReadOnly && (
                <Button 
                  startIcon={<AddCircle />} 
                  variant="outlined" 
                  size="small"
                  onClick={() => addMateria(dIdx)}
                >
                  Añadir Materia
                </Button>
              )}
            </Stack>

            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Asignatura</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Tema</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Guía/Pág</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Instrumento</TableCell>
                    {!isReadOnly && <TableCell />}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dia.materias.map((mat, mIdx) => (
                    <TableRow key={mIdx}>
                      <TableCell>
                        <TextField 
                          variant="standard" fullWidth disabled={isReadOnly}
                          value={mat.asignatura} 
                          onChange={(e) => handleMateriaChange(dIdx, mIdx, 'asignatura', e.target.value)} 
                        />
                      </TableCell>
                      <TableCell>
                        <TextField 
                          variant="standard" fullWidth disabled={isReadOnly}
                          value={mat.tema} 
                          onChange={(e) => handleMateriaChange(dIdx, mIdx, 'tema', e.target.value)} 
                        />
                      </TableCell>
                      <TableCell>
                        <TextField 
                          variant="standard" fullWidth disabled={isReadOnly}
                          value={mat.guiaDocente} placeholder="Pág." 
                          onChange={(e) => handleMateriaChange(dIdx, mIdx, 'guiaDocente', e.target.value)} 
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          variant="standard" fullWidth disabled={isReadOnly}
                          value={mat.instrumentoEvaluacion} 
                          onChange={(e) => handleMateriaChange(dIdx, mIdx, 'instrumentoEvaluacion', e.target.value)}
                        >
                          <MenuItem value="Lista de cotejo">Lista de cotejo</MenuItem>
                          <MenuItem value="Rúbrica">Rúbrica</MenuItem>
                          <MenuItem value="RSA">RSA</MenuItem>
                        </Select>
                      </TableCell>
                      {!isReadOnly && (
                        <TableCell>
                          <IconButton color="error" onClick={() => removeMateria(dIdx, mIdx)}>
                            <Delete />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {dia.materias.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={isReadOnly ? 4 : 5} align="center" sx={{ py: 2, color: 'text.secondary' }}>
                        No hay materias programadas para este día.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ))}

      {/* BOTÓN DE GUARDAR (OCULTO EN MODO LECTURA) */}
      {!isReadOnly && (
        <Button 
          variant="contained" 
          fullWidth 
          size="large" 
          startIcon={<Save />}
          onClick={() => onSubmit(form)}
          disabled={loading}
          sx={{ bgcolor: '#7D0F15', py: 2, borderRadius: 3, '&:hover': { bgcolor: '#5d0b10' } }}
        >
          {initialData?._id ? "Actualizar Planificación" : "Guardar Planificación Semanal"}
        </Button>
      )}
    </Box>
  );
};

export default PlanificacionForm;