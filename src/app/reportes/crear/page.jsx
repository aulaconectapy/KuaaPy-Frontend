'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createDisciplineReport, getStudentsByGradeAndInstitution } from '@/services/api';
import { useRouter } from 'next/navigation';

import {
  Container, Typography, TextField, MenuItem, Button, 
  Box, Grid, CircularProgress, Paper, Divider, Stack, InputAdornment
} from '@mui/material';

import {
  Person as PersonIcon,
  Gavel as GavelIcon,
  Description as DescIcon,
  Save as SaveIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';

const COLORS = {
  primary: "#7D0F15",
  primaryLight: "#a31a20",
  bgLight: "#F8FAFC",
  border: "#E2E8F0"
};

export default function CreateReportPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    student: '',
    severity: 'Leve',
    faultType: '',
    description: '',
    actionTaken: '',
    observation: ''
  });

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const data = await getStudentsByGradeAndInstitution(
          user.grades[0],
          user.institution._id
        );
        setStudents(data);
      } catch (error) {
        console.error('Error cargando estudiantes:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) loadStudents();
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const selectedStudent = students.find(s => s._id === form.student);
      if (!selectedStudent) return;

      const reportData = {
        ...form,
        teacher: user._id,
        institution: user.institution._id,
        grade: selectedStudent.grade || user.grades[0],
        studentUser: selectedStudent.user
      };

      await createDisciplineReport(reportData);
      router.push('/reportes');
    } catch (error) {
      console.error('❌ ERROR CREANDO REPORTE:', error);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
        <CircularProgress sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: '100vh', py: 5 }}>
      <Container maxWidth="md">
        
        {/* BOTÓN VOLVER */}
        <Button 
          startIcon={<BackIcon />} 
          onClick={() => router.back()}
          sx={{ mb: 3, color: 'text.secondary', fontWeight: 700 }}
        >
          Volver a la lista
        </Button>

        <Paper elevation={0} sx={{ p: 4, borderRadius: 5, border: `1px solid ${COLORS.border}` }}>
          
          <Stack direction="row" spacing={2} alignItems="center" mb={3}>
            <Box sx={{ bgcolor: `${COLORS.primary}10`, p: 1.5, borderRadius: 3, color: COLORS.primary }}>
              <GavelIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#1E293B' }}>
                Nuevo Reporte Disciplinario
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete el formulario para registrar la incidencia.
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ mb: 4 }} />

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              
              {/* SECCIÓN: ESTUDIANTE */}
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: COLORS.primary, mb: 1, display: 'block', textTransform: 'uppercase' }}>
                  Información del Alumno
                </Typography>
                <TextField
                  select
                  label="Seleccionar Estudiante"
                  name="student"
                  value={form.student}
                  onChange={handleChange}
                  fullWidth
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                >
                  {students.map((student) => (
                    <MenuItem key={student._id} value={student._id}>
                      {student.firstName} {student.lastName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* SECCIÓN: DETALLES */}
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Nivel de Gravedad"
                  name="severity"
                  value={form.severity}
                  onChange={handleChange}
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                >
                  <MenuItem value="Leve">🟢 Leve</MenuItem>
                  <MenuItem value="Moderado">🟡 Moderado</MenuItem>
                  <MenuItem value="Grave">🔴 Grave</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Tipo de Falta"
                  name="faultType"
                  value={form.faultType}
                  onChange={handleChange}
                  fullWidth
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                >
                  {[
                    "Falta de respeto al compañero", "Falta de respeto al docente",
                    "Pelea", "Interrupción de clase", "Tarea no realizada",
                    "Uso indebido de materiales", "Habla mucho en clases",
                    "Grita en la clase", "Otro"
                  ].map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Descripción Detallada del Incidente"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={3}
                  required
                  placeholder="Explique lo sucedido con objetividad..."
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Acción Tomada"
                  name="actionTaken"
                  value={form.actionTaken}
                  onChange={handleChange}
                  fullWidth
                  placeholder="Ej: Llamada de atención, retiro de material..."
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Observación Adicional"
                  name="observation"
                  value={form.observation}
                  onChange={handleChange}
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Grid>

              {/* BOTONES DE ACCIÓN */}
              <Grid item xs={12}>
                <Box sx={{ mt: 2 }}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    size="large" 
                    fullWidth
                    disabled={isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    sx={{ 
                      bgcolor: COLORS.primary, 
                      borderRadius: 3, 
                      py: 1.5, 
                      fontWeight: 800,
                      '&:hover': { bgcolor: COLORS.primaryLight }
                    }}
                  >
                    {isSubmitting ? 'Guardando...' : 'Registrar Reporte Oficial'}
                  </Button>
                </Box>
              </Grid>

            </Grid>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}