'use client';

import { useEffect, useState } from 'react';
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';
import {
  Container, Typography, Dialog, DialogTitle, DialogContent,
  Box, Paper, Stack, Button, Avatar, Chip, TextField,
  InputAdornment, IconButton, Grid, Zoom,
  Divider, CircularProgress
} from '@mui/material';

import { 
  EditRounded, DeleteSweepRounded, SearchRounded, PersonAddRounded,
  CloseRounded, EmailRounded, SchoolRounded, BadgeRounded,
  VisibilityRounded, ArrowBackIosNewRounded
} from '@mui/icons-material';

import { getUsers, deleteUser, getInstitutions } from '@/services/api';
import UserForm from '@/components/UserForm';
import CreateDocenteForm from '@/components/CreateDocenteForm';

// CONSTANTES DE ESTILO KUAAPY
const COLORS = {
  primary: "#0038A8",     // Azul principal KuaaPy
  primaryDark: "#00257A", // Azul oscuro
  red: "#D52B1E",         // Acento rojo
  bgLight: "#F8FAFC",
  gradient: "linear-gradient(135deg, #0038A8 0%, #00257A 100%)",
  textMain: "#0F172A",
  textSecondary: "#64748B"
};

const DocentesPage = () => {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [docentes, setDocentes] = useState([]);
  const [filteredDocentes, setFilteredDocentes] = useState([]);
  const [search, setSearch] = useState('');
  
  const [selectedDocente, setSelectedDocente] = useState(null);
  const [viewDocente, setViewDocente] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDocentes = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const users = await getUsers();
      let onlyTeachers = users.filter(u => u.role?.toLowerCase() === 'docente');
      if (currentUser.role?.toLowerCase() !== 'administrador') {
        onlyTeachers = onlyTeachers.filter(t => t.institution?._id === currentUser.institution?._id);
      }
      setDocentes(onlyTeachers);
      setFilteredDocentes(onlyTeachers);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    getInstitutions().then(setInstitutions);
    if (!authLoading) loadDocentes();
  }, [currentUser, authLoading]);

  useEffect(() => {
    const filtered = docentes.filter(d =>
      `${d.firstName} ${d.lastName} ${d.email} ${d.idNumber}`.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredDocentes(filtered);
  }, [search, docentes]);

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar este docente?')) {
      await deleteUser(id);
      loadDocentes();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No registrada";
    return new Date(dateString).toLocaleDateString('es-PY', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  if (authLoading || loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <CircularProgress sx={{ color: COLORS.primary }} />
    </Box>
  );

  return (
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: '100vh', py: { xs: 3, md: 5 } }}>
      <Container maxWidth="lg">
        
        {/* HEADER ADAPTABLE */}
        <Box sx={{ mb: 4 }}>
          <Button 
            startIcon={<ArrowBackIosNewRounded />} 
            onClick={() => router.back()}
            sx={{ mb: 2, color: COLORS.textSecondary, fontWeight: 700, textTransform: 'none' }}
          >
            Volver al Menú
          </Button>

          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.primary, letterSpacing: '-0.02em', mb: 0.5 }}>
                Panel de Docentes
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontWeight: 500 }}>
                Gestión de profesionales de la educación en KuaaPy
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<PersonAddRounded />}
              onClick={() => { setIsCreating(true); setSelectedDocente(null); setOpenModal(true); }}
              sx={{ 
                borderRadius: '12px', px: 3, py: 1.2, fontWeight: 800, textTransform: 'none', 
                background: COLORS.gradient,
                boxShadow: '0 8px 20px rgba(0,56,168,0.2)',
                '&:hover': { background: COLORS.primaryDark }
              }}
            >
              Nuevo Docente
            </Button>
          </Stack>
        </Box>

        {/* BUSCADOR */}
        <Paper elevation={0} sx={{ 
          p: '6px 16px', display: 'flex', alignItems: 'center', borderRadius: '16px', mb: 4, 
          border: '1px solid #E2E8F0', bgcolor: 'white' 
        }}>
          <InputAdornment position="start" sx={{ ml: 1 }}>
            <SearchRounded sx={{ color: COLORS.primary }} />
          </InputAdornment>
          <TextField
            fullWidth
            variant="standard"
            placeholder="Buscar por nombre, CI o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ disableUnderline: true, sx: { py: 1.2, px: 1, fontWeight: 500, fontSize: '0.95rem' } }}
          />
        </Paper>

        {/* GRID DE DOCENTES */}
        <Grid container spacing={3}>
          {filteredDocentes.map((docente, index) => (
            <Grid item xs={12} sm={6} md={4} key={docente._id}>
              <Zoom in style={{ transitionDelay: `${index * 30}ms` }}>
                <Paper elevation={0} sx={{
                  p: 3, borderRadius: '20px', border: '1px solid #E2E8F0', transition: 'all 0.3s ease', position: 'relative',
                  bgcolor: '#fff',
                  '&:hover': { boxShadow: '0 15px 35px rgba(0,56,168,0.08)', transform: 'translateY(-4px)', borderColor: COLORS.primary }
                }}>
                  <Stack direction="row" sx={{ position: 'absolute', top: 12, right: 12 }} spacing={0.5}>
                    <IconButton size="small" onClick={() => setViewDocente(docente)} sx={{ color: COLORS.primary, bgcolor: '#EFF6FF', p: 1, borderRadius: '10px' }}><VisibilityRounded fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => { setIsCreating(false); setSelectedDocente(docente); setOpenModal(true); }} sx={{ color: '#475569', bgcolor: '#F1F5F9', p: 1, borderRadius: '10px' }}><EditRounded fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(docente._id)} sx={{ color: COLORS.red, bgcolor: '#FEF2F2', p: 1, borderRadius: '10px' }}><DeleteSweepRounded fontSize="small" /></IconButton>
                  </Stack>

                  <Stack spacing={2} alignItems="center" textAlign="center" sx={{ mt: 1 }}>
                    <Avatar sx={{ 
                      width: 64, height: 64, background: COLORS.gradient, 
                      fontWeight: 800, fontSize: '1.6rem',
                      boxShadow: '0 8px 16px rgba(0,56,168,0.2)',
                      borderRadius: '18px'
                    }}>
                      {docente.firstName?.charAt(0)}
                    </Avatar>
                    
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.textMain, lineHeight: 1.2 }}>
                        {docente.firstName} {docente.lastName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: COLORS.primary, fontWeight: 800, display: 'block', mt: 0.5 }}>
                        C.I. {docente.idNumber || 'S/N'}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ width: '100%', borderColor: '#F1F5F9' }} />
                    
                    {/* INSTITUCIÓN */}
                    <Box sx={{ 
                      display: 'flex', gap: 1, color: COLORS.textSecondary, width: '100%', justifyContent: 'center', px: 1
                    }}>
                      <SchoolRounded sx={{ fontSize: 18, color: COLORS.primary, mt: 0.2 }} />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.3,
                          textAlign: 'left'
                        }}
                      >
                        {docente.institution?.name || 'Sin Institución Asignada'}
                      </Typography>
                    </Box>
                    
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" justifyContent="center">
                      {docente.grades?.map(g => (
                        <Chip key={g} label={`${g}°`} size="small" sx={{ fontWeight: 800, bgcolor: `${COLORS.primary}12`, color: COLORS.primary, borderRadius: '6px', height: 22 }} />
                      ))}
                    </Stack>
                  </Stack>
                </Paper>
              </Zoom>
            </Grid>
          ))}
        </Grid>

        {/* MODAL DETALLES */}
        <Dialog open={Boolean(viewDocente)} onClose={() => setViewDocente(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden' } }}>
          {viewDocente && (
            <Box>
              <Box sx={{ height: 120, background: COLORS.gradient, position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <IconButton onClick={() => setViewDocente(null)} sx={{ position: 'absolute', right: 12, top: 12, color: 'white' }}><CloseRounded /></IconButton>
                <Avatar sx={{ 
                  width: 96, height: 96, border: '4px solid white', background: COLORS.primaryDark, 
                  fontSize: '2.2rem', fontWeight: 900, mb: -5, boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                  borderRadius: '24px'
                }}>{viewDocente.firstName?.charAt(0)}</Avatar>
              </Box>
              
              <Box sx={{ px: 4, pb: 4, pt: 6, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.textMain }}>{viewDocente.firstName} {viewDocente.lastName}</Typography>
                <Chip label="PROFESIONAL DOCENTE" size="small" sx={{ mt: 1, fontWeight: 900, bgcolor: `${COLORS.primary}12`, color: COLORS.primary, borderRadius: '6px', height: 24 }} />

                <Grid container spacing={2.5} sx={{ mt: 2, textAlign: 'left' }}>
                  <Grid item xs={12} sm={6}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <BadgeRounded sx={{ color: COLORS.primary }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 800, letterSpacing: '0.05em' }}>CÉDULA</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.textMain }}>{viewDocente.idNumber}</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <EmailRounded sx={{ color: COLORS.primary }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 800, letterSpacing: '0.05em' }}>CORREO</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.textMain, wordBreak: 'break-all' }}>{viewDocente.email}</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1, borderColor: '#F1F5F9' }} />
                    <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 800, letterSpacing: '0.05em' }}>INSTITUCIÓN ASIGNADA</Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: '16px', bgcolor: COLORS.bgLight, borderColor: '#E2E8F0' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.textMain, lineHeight: 1.4 }}>
                        {viewDocente.institution?.name}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} useFlexGap flexWrap="wrap">
                        {viewDocente.grades?.map(g => (
                          <Chip key={g} label={`${g}° Grado`} size="small" variant="outlined" sx={{ fontWeight: 700, borderColor: COLORS.primary, color: COLORS.primary, borderRadius: '6px' }} />
                        ))}
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </Dialog>

        {/* MODAL FORMULARIO */}
        <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '24px' } }}>
          <DialogTitle sx={{ 
            fontWeight: 900, px: 4, pt: 3, pb: 2.5, background: COLORS.gradient, color: 'white', mb: 2 
          }}>
            {isCreating ? 'Registrar Nuevo Docente - KuaaPy' : 'Editar Perfil Docente'}
          </DialogTitle>
          <DialogContent sx={{ px: 4, pb: 4 }}>
            {isCreating ? 
              <CreateDocenteForm onSuccess={() => { setOpenModal(false); loadDocentes(); }} /> : 
              <UserForm userId={selectedDocente?._id} currentUser={currentUser} institutions={institutions} onSuccess={() => { setOpenModal(false); loadDocentes(); }} />
            }
          </DialogContent>
        </Dialog>

      </Container>
    </Box>
  );
};

export default DocentesPage;