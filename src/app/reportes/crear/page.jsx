'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createDisciplineReport, getStudentsByGradeAndInstitution } from '@/services/api';
import { useRouter } from 'next/navigation';

import {
  Container,
  Typography,
  TextField,
  MenuItem,
  Button,
  Box,
  Grid,
  CircularProgress
} from '@mui/material';

export default function CreateReportPage() {

  const { user } = useAuth();
  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    student: '',
    severity: 'Leve',
    faultType: '',
    description: '',
    actionTaken: '',
    observation: ''
  });

  // ============================
  // CARGAR ESTUDIANTES
  // ============================

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const data = await getStudentsByGradeAndInstitution(
          user.grades[0],       // primer grado del docente
          user.institution._id  // id de la institución
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

  // ============================
  // CAMBIAR INPUT
  // ============================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // ============================
  // ENVIAR FORMULARIO
  // ============================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Buscar el estudiante seleccionado
      const selectedStudent = students.find(s => s._id === form.student);

      if (!selectedStudent) {
        console.error("Estudiante no encontrado");
        return;
      }

      // Construir el objeto completo para enviar al backend
      const reportData = {
        ...form,
        teacher: user._id,                  // docente logueado
        institution: user.institution._id,  // institución del docente
        grade: selectedStudent.grade || user.grades[0], // grado del estudiante
        studentUser: selectedStudent.user   // opcional: id del usuario del estudiante
      };

      console.log("Datos que se enviarán:", reportData);

      await createDisciplineReport(reportData);

      router.push('/reportes');

    } catch (error) {
      console.error('❌ ERROR CREANDO REPORTE:', error);
    }
  };

  // ============================
  // LOADING
  // ============================

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <CircularProgress />
      </Box>
    );
  }

  // ============================
  // RENDER
  // ============================

  return (
    <Container maxWidth="md">
      <Typography variant="h4" mb={3}>
        Crear Reporte Disciplinario
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>

          {/* ESTUDIANTE */}
          <Grid item xs={12}>
            <TextField
              select
              label="Seleccionar estudiante"
              name="student"
              value={form.student}
              onChange={handleChange}
              fullWidth
              required
            >
              {students.map((student) => (
                <MenuItem key={student._id} value={student._id}>
                  {student.firstName} {student.lastName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* GRAVEDAD */}
          <Grid item xs={12} md={6}>
            <TextField
              select
              label="Gravedad"
              name="severity"
              value={form.severity}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="Leve">Leve</MenuItem>
              <MenuItem value="Moderado">Moderado</MenuItem>
              <MenuItem value="Grave">Grave</MenuItem>
            </TextField>
          </Grid>

          {/* TIPO DE FALTA */}
          <Grid item xs={12} md={6}>
            <TextField
              select
              label="Tipo de falta"
              name="faultType"
              value={form.faultType}
              onChange={handleChange}
              fullWidth
              required
            >
              <MenuItem value="Falta de respeto al compañero">Falta de respeto al compañero</MenuItem>
              <MenuItem value="Falta de respeto al docente">Falta de respeto al docente</MenuItem>
              <MenuItem value="Pelea">Pelea</MenuItem>
              <MenuItem value="Interrupción de clase">Interrupción de clase</MenuItem>
              <MenuItem value="Tarea no realizada">Tarea no realizada</MenuItem>
              <MenuItem value="Uso indebido de materiales">Uso indebido de materiales</MenuItem>
              <MenuItem value="Habla mucho en clases">Habla mucho en clases</MenuItem>
              <MenuItem value="Grita en la clase">Grita en la clase</MenuItem>
              <MenuItem value="Otro">Otro</MenuItem>
            </TextField>
          </Grid>

          {/* DESCRIPCIÓN */}
          <Grid item xs={12}>
            <TextField
              label="Descripción del incidente"
              name="description"
              value={form.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={4}
              required
            />
          </Grid>

          {/* ACCIÓN TOMADA */}
          <Grid item xs={12}>
            <TextField
              label="Acción tomada"
              name="actionTaken"
              value={form.actionTaken}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          {/* OBSERVACIÓN */}
          <Grid item xs={12}>
            <TextField
              label="Observación"
              name="observation"
              value={form.observation}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          {/* BOTÓN */}
          <Grid item xs={12}>
            <Button type="submit" variant="contained" size="large" fullWidth>
              Guardar Reporte
            </Button>
          </Grid>

        </Grid>
      </Box>
    </Container>
  );
}