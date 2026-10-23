'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createDisciplineReport, getStudentsByGradeAndInstitution } from '@/services/api';
import { useRouter } from 'next/navigation';

import {
  Container, Typography, TextField, MenuItem, Button, 
  Box, Grid, CircularProgress, Paper, Divider, Stack
} from '@mui/material';

import {
  Gavel as GavelIcon,
  Save as SaveIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';

// CONSTANTES DE ESTILO KUAAPY
const COLORS = {
  primary: "#0038A8",     // Azul principal KuaaPy
  primaryDark: "#00257A", // Azul oscuro
  red: "#D52B1E",         // Acento rojo
  bgLight: "#F8FAFC",
  border: "#E2E8F0",
  gradient: "linear-gradient(135deg, #0038A8 0%, #00257A 100%)"
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
          user.grades,
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
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: '100vh', py: { xs: 3, md: 5 } }}>
      <Container maxWidth="md">
        
        {/* BOTÓN VOLVER */}
        <Button 
          startIcon={<BackIcon />} 
          onClick={() => router.back()}
          sx={{ mb: 3, color: '#64748B', fontWeight: 700, textTransform: 'none' }}
        >
          Volver a la lista
        </Button>

        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: '24px', border: `1px solid ${COLORS.border}`, bgcolor: '#fff' }}>
          
          <Stack direction="row" spacing={2} alignItems="center" mb={3}>
            <Box sx={{ bgcolor: `${COLORS.primary}12`, p: 1.5, borderRadius: '14px', color: COLORS.primary, display: 'flex' }}>
              <GavelIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', mb: 0.5 }}>
                Nuevo Reporte Disciplinario
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
                Complete el formulario para registrar la incidencia en KuaaPy.
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ mb: 4, borderColor: '#F1F5F9' }} />

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              
              {/* SECCIÓN: ESTUDIANTE */}
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: COLORS.primary, mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
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
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
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
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
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
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Acción Tomada"
                  name="actionTaken"
                  value={form.actionTaken}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  placeholder="Ej: Llamada de atención, retiro de material..."
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Observación Adicional"
                  name="observation"
                  value={form.observation}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
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
                      borderRadius: '14px', 
                      py: 1.5, 
                      fontWeight: 800,
                      textTransform: 'none',
                      boxShadow: '0 8px 20px rgba(0,56,168,0.2)',
                      '&:hover': { bgcolor: COLORS.primaryDark }
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