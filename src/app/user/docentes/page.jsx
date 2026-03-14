'use client';

import { useEffect, useState } from 'react';
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';
import {
  Container, Typography, Dialog, DialogTitle, DialogContent,
  Box, Paper, Stack, Button, Avatar, Chip, TextField,
  InputAdornment, IconButton, Tooltip, Grid, Zoom,
  Divider, CircularProgress, List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';

import { 
  EditRounded, DeleteSweepRounded, SearchRounded, PersonAddRounded,
  CloseRounded, EmailRounded, SchoolRounded, BadgeRounded,
  CakeRounded, PhoneRounded, LocationOnRounded, VisibilityRounded,
  ArrowBackIosNewRounded
} from '@mui/icons-material';

import { getUsers, deleteUser, getInstitutions } from '@/services/api';
import UserForm from '@/components/UserForm';
import CreateDocenteForm from '@/components/CreateDocenteForm';

// PALETA INSTITUCIONAL
const COLORS = {
  primary: "#7D0F15",
  primaryDark: "#4A080C",
  bgLight: "#F8FAFC",
  gradient: "linear-gradient(135deg, #7D0F15 0%, #4A080C 100%)",
  textMain: "#1E293B",
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
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        
        {/* HEADER */}
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
              <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.primaryDark, letterSpacing: '-1px' }}>
                Panel de Docentes
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                Gestión de profesionales de la educación
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<PersonAddRounded />}
              onClick={() => { setIsCreating(true); setSelectedDocente(null); setOpenModal(true); }}
              sx={{ 
                borderRadius: 3, px: 4, py: 1.2, fontWeight: 800, textTransform: 'none', 
                background: COLORS.gradient,
                boxShadow: '0 8px 20px rgba(125, 15, 21, 0.2)',
                '&:hover': { background: COLORS.primaryDark }
              }}
            >
              Nuevo Docente
            </Button>
          </Stack>
        </Box>

        {/* BUSCADOR */}
        <Paper elevation={0} sx={{ 
          p: '4px 16px', display: 'flex', alignItems: 'center', borderRadius: 4, mb: 4, 
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
            InputProps={{ disableUnderline: true, sx: { py: 1.5, px: 1, fontWeight: 500 } }}
          />
        </Paper>

        {/* GRID DE DOCENTES */}
        <Grid container spacing={3}>
          {filteredDocentes.map((docente, index) => (
            <Grid item xs={12} sm={6} md={4} key={docente._id}>
              <Zoom in style={{ transitionDelay: `${index * 30}ms` }}>
                <Paper sx={{
                  p: 3, borderRadius: 5, border: '1px solid #E2E8F0', transition: 'all 0.3s', position: 'relative',
                  '&:hover': { boxShadow: '0 20px 40px rgba(0,0,0,0.06)', transform: 'translateY(-5px)', borderColor: COLORS.primary }
                }}>
                  <Stack direction="row" sx={{ position: 'absolute', top: 12, right: 12 }} spacing={0.5}>
                    <IconButton size="small" onClick={() => setViewDocente(docente)} sx={{ color: COLORS.primary }}><VisibilityRounded fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => { setIsCreating(false); setSelectedDocente(docente); setOpenModal(true); }}><EditRounded fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(docente._id)} sx={{ color: '#EF4444' }}><DeleteSweepRounded fontSize="small" /></IconButton>
                  </Stack>

                  <Stack spacing={2} alignItems="center" textAlign="center">
                    <Avatar sx={{ 
                      width: 70, height: 70, background: COLORS.gradient, 
                      fontWeight: 800, fontSize: '1.8rem',
                      boxShadow: '0 8px 16px rgba(125, 15, 21, 0.15)' 
                    }}>
                      {docente.firstName?.charAt(0)}
                    </Avatar>
                    
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.textMain, lineHeight: 1.2 }}>
                        {docente.firstName} {docente.lastName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: COLORS.primary, fontWeight: 800 }}>
                        C.I. {docente.idNumber || 'S/N'}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ width: '100%' }} />
                    
                    {/* SOLUCIÓN AL TEXTO QUE SE SALE */}
                    <Box sx={{ 
                      display: 'flex', gap: 1, color: COLORS.textSecondary, width: '100%', justifyContent: 'center', px: 1
                    }}>
                      <SchoolRounded sx={{ fontSize: 18, color: COLORS.primary, mt: 0.2 }} />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600,
                          display: '-webkit-box',
                          WebkitLineClamp: 2, // Máximo 2 líneas
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
                        <Chip key={g} label={`${g}°`} size="small" sx={{ fontWeight: 800, bgcolor: `${COLORS.primary}10`, color: COLORS.primary, borderRadius: 1.5 }} />
                      ))}
                    </Stack>
                  </Stack>
                </Paper>
              </Zoom>
            </Grid>
          ))}
        </Grid>

        {/* MODAL DETALLES */}
        <Dialog open={Boolean(viewDocente)} onClose={() => setViewDocente(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 6, overflow: 'hidden' } }}>
          {viewDocente && (
            <Box>
              <Box sx={{ height: 120, background: COLORS.gradient, position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <IconButton onClick={() => setViewDocente(null)} sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}><CloseRounded /></IconButton>
                <Avatar sx={{ 
                  width: 100, height: 100, border: '5px solid white', background: COLORS.primaryDark, 
                  fontSize: '2.5rem', fontWeight: 800, mb: -5, boxShadow: '0 8px 20px rgba(0,0,0,0.2)' 
                }}>{viewDocente.firstName?.charAt(0)}</Avatar>
              </Box>
              
              <Box sx={{ px: 4, pb: 4, pt: 7, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>{viewDocente.firstName} {viewDocente.lastName}</Typography>
                <Chip label="PROFESIONAL DOCENTE" size="small" sx={{ mt: 1, fontWeight: 900, bgcolor: COLORS.primary, color: 'white' }} />

                <Grid container spacing={2} sx={{ mt: 3, textAlign: 'left' }}>
                  <Grid item xs={12} sm={6}>
                    <Stack direction="row" spacing={1.5}>
                      <BadgeRounded sx={{ color: COLORS.primary }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={800}>CÉDULA</Typography>
                        <Typography variant="body2" fontWeight={700}>{viewDocente.idNumber}</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Stack direction="row" spacing={1.5}>
                      <EmailRounded sx={{ color: COLORS.primary }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={800}>CORREO</Typography>
                        <Typography variant="body2" fontWeight={700} sx={{ wordBreak: 'break-all' }}>{viewDocente.email}</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={800}>INSTITUCIÓN ASIGNADA</Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 3, bgcolor: COLORS.bgLight, border: `1px solid ${COLORS.primary}20` }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.primaryDark, lineHeight: 1.4 }}>
                        {viewDocente.institution?.name}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                        {viewDocente.grades?.map(g => (
                          <Chip key={g} label={`${g}° Grado`} size="small" variant="outlined" sx={{ fontWeight: 700, borderColor: COLORS.primary, color: COLORS.primary }} />
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
        <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 6 } }}>
          <DialogTitle sx={{ 
            fontWeight: 900, px: 4, pt: 3, bgcolor: COLORS.primary, color: 'white', mb: 2 
          }}>
            {isCreating ? 'Registrar Nuevo Docente' : 'Editar Perfil Docente'}
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