'use client';

import { useEffect, useState } from 'react';
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';
import { getStudents, deleteStudent } from '@/services/api';

import {
  Container, Typography, Box, Paper, Stack, Avatar, Chip,
  TextField, InputAdornment, IconButton, Tooltip, Grid,
  Zoom, Divider, CircularProgress, Button, Fade, Backdrop
} from '@mui/material';

import {
  SearchRounded, VisibilityRounded, EditRounded,
  CloseRounded, PersonAdd, DeleteRounded, SchoolRounded,
  BadgeRounded, BusinessRounded
} from '@mui/icons-material';

// CONSTANTES DE ESTILO KUAAPY
const COLORS = {
  primary: "#0038A8",     // Azul principal KuaaPy
  primaryDark: "#00257A", // Azul oscuro
  red: "#D52B1E",         // Acento rojo
  bgLight: "#F8FAFC",
  gradient: "linear-gradient(135deg, #0038A8 0%, #00257A 100%)"
};

const StudentsPage = () => {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();

  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewStudent, setViewStudent] = useState(null);

  const loadStudents = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      let data = await getStudents();
      const role = currentUser?.role?.toLowerCase();

      if (role === 'director/a' || role === 'secretario/a') {
        data = data.filter(s => s.institution?._id === currentUser.institution?._id);
      } else if (role === 'docente') {
        data = data.filter(s => 
          s.institution?._id === currentUser.institution?._id && 
          s.grade && currentUser.grades?.includes(s.grade)
        );
      } else if (role !== 'administrador') {
        data = [];
      }

      data.sort((a, b) => (a.lastName || '').localeCompare(b.lastName || '', 'es', { sensitivity: 'base' }));
      setStudents(data);
      setFilteredStudents(data);
    } catch (error) {
      console.error('Error cargando estudiantes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) loadStudents();
  }, [currentUser, authLoading]);

  useEffect(() => {
    const filtered = students.filter(u =>
      `${u.firstName} ${u.lastName} ${u.cedula} ${u.grade}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [search, students]);

  const formatDate = (dateString) => {
    if (!dateString) return "No registrada";
    return new Date(dateString).toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este estudiante?")) return;
    try {
      await deleteStudent(id);
      loadStudents();
    } catch (error) {
      console.error(error);
      alert("Error al eliminar estudiante");
    }
  };

  if (authLoading || loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress sx={{ color: COLORS.primary }} thickness={5} size={60} />
      </Box>
    );

  return (
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: '100vh', py: { xs: 3, md: 5 } }}>
      <Container maxWidth="lg">
        
        {/* ENCABEZADO ADAPTABLE */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 900, color: COLORS.primary, letterSpacing: '-0.02em', mb: 0.5 }}>
              Estudiantes
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748B', fontWeight: 500 }}>
              Listado oficial de estudiantes en KuaaPy
            </Typography>
          </Box>

          {(['administrador', 'director/a', 'secretario/a', 'docente'].includes(currentUser.role?.toLowerCase())) && (
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => router.push('/pages/students/nuevo')}
              sx={{ 
                bgcolor: COLORS.primary, 
                px: 3, py: 1.2, 
                borderRadius: '12px',
                fontWeight: 800,
                textTransform: 'none',
                boxShadow: '0 8px 20px rgba(0,56,168,0.2)',
                '&:hover': { bgcolor: COLORS.primaryDark, transform: 'translateY(-2px)' },
                transition: '0.3s'
              }}
            >
              Nuevo Estudiante
            </Button>
          )}
        </Box>

        {/* BARRA DE BÚSQUEDA */}
        <Paper
          elevation={0}
          sx={{
            p: '8px 20px',
            mb: 4,
            display: 'flex',
            alignItems: 'center',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            bgcolor: '#fff',
            transition: '0.3s',
            '&:focus-within': { borderColor: COLORS.primary, boxShadow: '0 0 0 4px rgba(0, 56, 168, 0.08)' }
          }}
        >
          <SearchRounded sx={{ color: COLORS.primary, mr: 2 }} />
          <TextField
            fullWidth
            variant="standard"
            placeholder="Buscar por nombre, cédula o grado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ disableUnderline: true, sx: { fontSize: '1rem', fontWeight: 500 } }}
          />
          <Chip label={`${filteredStudents.length} resultados`} size="small" sx={{ fontWeight: 700, bgcolor: '#F1F5F9', borderRadius: '8px' }} />
        </Paper>

        {/* GRILLA DE TARJETAS */}
        <Grid container spacing={3}>
          {filteredStudents.map((student, index) => (
            <Grid item xs={12} sm={6} md={4} key={student._id}>
              <Zoom in style={{ transitionDelay: `${index * 30}ms` }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 0,
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: '1px solid #E2E8F0',
                    bgcolor: '#fff',
                    transition: '0.3s ease',
                    '&:hover': {
                      boxShadow: '0 15px 35px rgba(0,56,168,0.08)',
                      transform: 'translateY(-4px)',
                      borderColor: COLORS.primary
                    }
                  }}
                >
                  {/* Banner superior de color */}
                  <Box sx={{ height: 10, background: COLORS.gradient }} />
                  
                  <Box sx={{ p: 3, position: 'relative' }}>
                    {/* Botones de acción rápidos */}
                    <Stack direction="row" sx={{ position: 'absolute', top: 15, right: 15 }} spacing={0.5}>
                      <Tooltip title="Ver detalles">
                        <IconButton size="small" onClick={() => setViewStudent(student)} sx={{ color: COLORS.primary, bgcolor: '#EFF6FF', p: 1, borderRadius: '10px' }}>
                          <VisibilityRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {(['administrador', 'director/a', 'secretario/a'].includes(currentUser.role?.toLowerCase())) && (
                        <>
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => router.push(`/user/students/${student._id}`)} sx={{ color: '#475569', bgcolor: '#F1F5F9', p: 1, borderRadius: '10px' }}>
                              <EditRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton size="small" onClick={() => handleDelete(student._id)} sx={{ color: COLORS.red, bgcolor: '#FEF2F2', p: 1, borderRadius: '10px' }}>
                              <DeleteRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Stack>

                    <Stack alignItems="center" spacing={1.5}>
                      <Avatar
                        sx={{
                          width: 72, height: 72,
                          background: COLORS.gradient,
                          fontSize: '1.8rem', fontWeight: 900,
                          boxShadow: '0 8px 16px rgba(0,56,168,0.2)',
                          borderRadius: '18px'
                        }}
                      >
                        {student.firstName?.charAt(0)}
                      </Avatar>

                      <Box textAlign="center" sx={{ width: '100%', mt: 0.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                          {student.firstName} {student.lastName}
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.primary, fontWeight: 700, mt: 0.5 }}>
                          C.I. {student.cedula || 'Sin Registro'}
                        </Typography>
                      </Box>

                      <Divider sx={{ width: '100%', my: 1, borderColor: '#F1F5F9' }} />

                      <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
                        <Chip 
                          icon={<SchoolRounded sx={{ fontSize: '1rem !important', color: `${COLORS.primary} !important` }} />} 
                          label={student.grade} 
                          size="small" 
                          sx={{ fontWeight: 700, px: 1, bgcolor: `${COLORS.primary}12`, color: COLORS.primary, borderRadius: '6px' }} 
                        />
                        <Chip 
                          label={student.academicStatus || "Activo"} 
                          color={student.academicStatus === "Inactivo" ? "error" : "success"}
                          size="small" 
                          sx={{ fontWeight: 800, fontSize: '0.7rem', borderRadius: '6px' }} 
                        />
                      </Stack>
                    </Stack>
                  </Box>
                </Paper>
              </Zoom>
            </Grid>
          ))}
        </Grid>

        {/* MODAL DE DETALLES (BACKDROP CUSTOM) */}
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1, backdropFilter: 'blur(4px)', bgcolor: 'rgba(0,0,0,0.6)' }}
          open={!!viewStudent}
          onClick={() => setViewStudent(null)}
        >
          {viewStudent && (
            <Fade in={!!viewStudent}>
              <Paper
                onClick={(e) => e.stopPropagation()}
                sx={{
                  width: '90%', maxWidth: 500,
                  borderRadius: '24px',
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                  bgcolor: '#fff'
                }}
              >
                {/* Cabecera del Modal */}
                <Box sx={{ background: COLORS.gradient, p: 3, color: '#fff', textAlign: 'center' }}>
                  <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: '#fff', color: COLORS.primary, fontWeight: 900, fontSize: '2rem', borderRadius: '20px' }}>
                    {viewStudent.firstName?.charAt(0)}
                  </Avatar>
                  <Typography variant="h5" fontWeight={900}>{viewStudent.firstName} {viewStudent.lastName}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.85, fontWeight: 500 }}>Ficha de Estudiante - KuaaPy</Typography>
                </Box>

                {/* Cuerpo del Modal */}
                <Box sx={{ p: 4 }}>
                  <Stack spacing={2.5}>
                    <DetailItem icon={<BadgeRounded sx={{ color: COLORS.primary }} />} label="Cédula de Identidad" value={viewStudent.cedula || 'No disponible'} />
                    <DetailItem icon={<SchoolRounded sx={{ color: COLORS.primary }} />} label="Grado / Año" value={viewStudent.grade} />
                    <DetailItem icon={<BusinessRounded sx={{ color: COLORS.primary }} />} label="Institución" value={viewStudent.institution?.name} />
                    <DetailItem icon={<VisibilityRounded sx={{ color: COLORS.primary }} />} label="Sexo" value={viewStudent.sex} />
                    <DetailItem icon={<EditRounded sx={{ color: COLORS.primary }} />} label="Fecha de Nacimiento" value={formatDate(viewStudent.birthDate)} />
                  </Stack>

                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setViewStudent(null)}
                    sx={{ mt: 4, borderRadius: '12px', py: 1.2, fontWeight: 800, textTransform: 'none', borderColor: COLORS.primary, color: COLORS.primary, '&:hover': { bgcolor: `${COLORS.primary}08` } }}
                  >
                    Cerrar Detalle
                  </Button>
                </Box>
              </Paper>
            </Fade>
          )}
        </Backdrop>
      </Container>
    </Box>
  );
};

// Componente auxiliar para los items del detalle
const DetailItem = ({ icon, label, value }) => (
  <Stack direction="row" spacing={2} alignItems="center">
    <Box sx={{ bgcolor: '#F1F5F9', p: 1.2, borderRadius: '12px', display: 'flex' }}>{icon}</Box>
    <Box>
      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</Typography>
      <Typography variant="body1" sx={{ fontWeight: 700, color: '#0F172A' }}>{value}</Typography>
    </Box>
  </Stack>
);

export default StudentsPage;