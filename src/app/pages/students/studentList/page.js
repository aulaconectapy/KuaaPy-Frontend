'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStudents, deleteStudent } from '@/services/api';
import {
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Grid,
  Box,
  Divider,
  Fab,
} from '@mui/material';
import { ExpandMore, ExpandLess, Edit, Delete, School, Add } from '@mui/icons-material';

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await getStudents();
      setStudents(data);
    } catch (error) {
      console.error('Error al obtener estudiantes:', error);
    }
  };

  const toggleDetails = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleEdit = (id) => {
    router.push(`/pages/students/${id}`);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de que deseas eliminar este estudiante?')) {
      try {
        await deleteStudent(id);
        fetchStudents();
      } catch (error) {
        console.error('Error al eliminar estudiante:', error);
      }
    }
  };

  return (
    <Box sx={{ backgroundColor: '#f0f4f8', minHeight: '100vh', padding: 4 }}>
      {/* Banner */}
      <Box
        sx={{
          backgroundColor: '#1976d2',
          padding: 4,
          borderRadius: 2,
          textAlign: 'center',
          marginBottom: 4,
          color: 'white',
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 'bold', marginBottom: 1 }}>
          Panel de Gestión de Estudiantes
        </Typography>
        <Typography variant="body1">
          Gestiona la información de los estudiantes de manera eficiente y organizada.
        </Typography>
      </Box>

      {/* Lista de estudiantes */}
      <Grid container spacing={3}>
        {students.map((student, index) => (
          <Grid item xs={12} md={6} lg={4} key={student._id}>
            <Card
              sx={{
                boxShadow: 3,
                borderRadius: 2,
                transition: 'transform 0.3s',
                '&:hover': { transform: 'scale(1.02)' },
              }}
            >
              <CardContent>
                {/* Encabezado de la tarjeta */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <School color="primary" /> {student.firstName} {student.lastName}
                  </Typography>
                  <IconButton
                    onClick={() => toggleDetails(index)}
                    color="secondary"
                    aria-label="Expandir detalles"
                  >
                    {expandedIndex === index ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Box>

                <Divider sx={{ marginBottom: 2 }} />

                {/* Detalles básicos */}
                <Typography variant="body2" color="textSecondary" sx={{ marginBottom: 2 }}>
                  <strong>Grado:</strong> {student.grade}
                </Typography>

                {/* Detalles expandibles */}
                {expandedIndex === index && (
                  <Box
                    sx={{
                      backgroundColor: '#f9f9f9',
                      padding: 2,
                      borderRadius: 1,
                      animation: 'fadeIn 0.3s ease',
                    }}
                  >
                    <Typography variant="body2" sx={{ marginBottom: 1 }}>
                      <strong>Fecha de Nacimiento:</strong>{' '}
                      {new Date(student.birthDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" sx={{ marginBottom: 1 }}>
                      <strong>Institución:</strong> {student.institution.name}
                    </Typography>
                    {student.guardian && (
                      <Typography variant="body2">
                        <strong>Tutor:</strong> {student.guardian}
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Acciones */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 2,
                  }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => handleEdit(student._id)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => handleDelete(student._id)}
                  >
                    Eliminar
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Botón flotante para agregar estudiantes */}
      <Fab
        color="primary"
        aria-label="Agregar estudiante"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => router.push('/pages/students/add')}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default StudentsPage;
