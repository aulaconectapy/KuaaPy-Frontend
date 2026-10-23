'use client';

import { useEffect, useState } from 'react';
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';

import {
  Container, Typography, Dialog, DialogTitle, DialogContent,
  Box, Paper, Stack, Button, Avatar, Chip, TextField,
  InputAdornment, IconButton, Tooltip, Grid, Zoom,
  Divider, CircularProgress
} from '@mui/material';

import { 
  EditRounded, DeleteSweepRounded, SearchRounded, PersonAddRounded,
  CloseRounded, SchoolRounded, BadgeRounded,
  LocationOnRounded, VisibilityRounded,
  ArrowBackIosNewRounded
} from '@mui/icons-material';

import { getUsers, deleteUser } from '@/services/api';
import UserForm from '@/components/UserForm';

// CONSTANTES DE ESTILO KUAAPY
const COLORS = {
  primary: "#0038A8",     // Azul principal KuaaPy
  primaryDark: "#00257A", // Azul oscuro
  red: "#D52B1E",         // Acento rojo
  bgLight: "#F8FAFC",
  gradient: "linear-gradient(135deg, #0038A8 0%, #00257A 100%)"
};

const AllUsersPage = () => {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [search, setSearch] = useState('');

  const [selectedUser, setSelectedUser] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      let allUsers = await getUsers();
      const role = currentUser?.role?.toLowerCase();

      if (role === 'administrador') {
        // Admin ve todos
      } else if (role === 'director/a' || role === 'secretario/a') {
        allUsers = allUsers.filter(u => u.role?.toLowerCase() === 'estudiante' && u.institution?._id === currentUser.institution?._id);
      } else {
        allUsers = [];
      }
      setUsers(allUsers);
      setFilteredUsers(allUsers);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    if (!authLoading) loadUsers(); 
  }, [currentUser, authLoading]);

  useEffect(() => {
    const filtered = users.filter(u =>
      `${u.firstName} ${u.lastName} ${u.email} ${u.idNumber}`.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [search, users]);

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      await deleteUser(id);
      loadUsers();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No registrada";
    return new Date(dateString).toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  if (authLoading || loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <CircularProgress sx={{ color: COLORS.primary }} />
    </Box>
  );

  return (
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: '100vh', py: { xs: 3, md: 5 } }}>
      <Container maxWidth="lg">
        
        {/* ENCABEZADO ADAPTABLE */}
        <Box sx={{ mb: 4 }}>
          <Button 
            startIcon={<ArrowBackIosNewRounded />} 
            onClick={() => router.back()}
            sx={{ mb: 2, color: '#64748B', fontWeight: 700, textTransform: 'none' }}
          >
            Volver
          </Button>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.primary, letterSpacing: '-0.02em', mb: 0.5 }}>
                Listado de Usuarios
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
                Gestionando {filteredUsers.length} registros encontrados en KuaaPy
              </Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<PersonAddRounded />}
                onClick={() => { setIsCreating(true); setSelectedUser(null); setOpenModal(true); }}
                sx={{ 
                  bgcolor: COLORS.primary, borderRadius: '12px', px: 3, py: 1.2, fontWeight: 800, textTransform: 'none',
                  boxShadow: '0 8px 20px rgba(0,56,168,0.2)',
                  '&:hover': { bgcolor: COLORS.primaryDark } 
                }}
              >
                Nuevo Usuario
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* BARRA DE BÚSQUEDA */}
        <Paper elevation={0} sx={{ p: '6px 16px', mb: 4, display: 'flex', alignItems: 'center', borderRadius: '16px', border: '1px solid #E2E8F0', bgcolor: 'white' }}>
          <InputAdornment position="start" sx={{ ml: 1 }}><SearchRounded sx={{ color: COLORS.primary }} /></InputAdornment>
          <TextField
            fullWidth
            variant="standard"
            placeholder="Buscar por nombre, CI o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ disableUnderline: true, sx: { py: 1.2, px: 1, fontWeight: 500, fontSize: '0.95rem' } }}
          />
        </Paper>

        {/* GRID DE USUARIOS */}
        <Grid container spacing={3}>
          {filteredUsers.map((u, index) => (
            <Grid item xs={12} sm={6} md={4} key={u._id}>
              <Zoom in style={{ transitionDelay: `${index * 30}ms` }}>
                <Paper elevation={0} sx={{ 
                  p: 3, borderRadius: '20px', border: '1px solid #E2E8F0', position: 'relative', overflow: 'hidden',
                  bgcolor: '#fff',
                  transition: 'all 0.3s ease',
                  '&:hover': { boxShadow: '0 15px 35px rgba(0,56,168,0.08)', transform: 'translateY(-4px)', borderColor: COLORS.primary } 
                }}>
                  {/* Acciones flotantes */}
                  <Stack direction="row" sx={{ position: 'absolute', top: 12, right: 12 }} spacing={0.5}>
                    <Tooltip title="Ver detalles">
                      <IconButton size="small" onClick={() => setViewUser(u)} sx={{ color: COLORS.primary, bgcolor: '#EFF6FF', p: 1, borderRadius: '10px' }}><VisibilityRounded fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => { setIsCreating(false); setSelectedUser(u); setOpenModal(true); }} sx={{ color: '#475569', bgcolor: '#F1F5F9', p: 1, borderRadius: '10px' }}><EditRounded fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" onClick={() => handleDelete(u._id)} sx={{ color: COLORS.red, bgcolor: '#FEF2F2', p: 1, borderRadius: '10px' }}><DeleteSweepRounded fontSize="small" /></IconButton>
                    </Tooltip>
                  </Stack>

                  <Stack spacing={2} alignItems="center" textAlign="center" sx={{ mt: 1 }}>
                    <Avatar sx={{ 
                      width: 64, height: 64, 
                      background: COLORS.gradient, 
                      fontWeight: 800, fontSize: '1.6rem',
                      boxShadow: '0 8px 16px rgba(0,56,168,0.2)',
                      borderRadius: '18px'
                    }}>
                      {u.firstName?.charAt(0)}
                    </Avatar>
                    
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2, color: '#0F172A' }}>{u.firstName} {u.lastName}</Typography>
                      <Chip 
                        label={u.role || 'Sin Rol'} 
                        size="small" 
                        sx={{ mt: 1, height: 22, fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase', bgcolor: `${COLORS.primary}12`, color: COLORS.primary, borderRadius: '6px' }} 
                      />
                    </Box>

                    <Divider sx={{ width: '100%', borderColor: '#F1F5F9' }} />

                    <Stack spacing={1.2} sx={{ width: '100%', textAlign: 'left' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, color: '#475569' }}>
                        <BadgeRounded sx={{ fontSize: 18, color: COLORS.primary }} />
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>C.I. {u.idNumber || 'S/N'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, color: '#475569' }}>
                        <SchoolRounded sx={{ fontSize: 18, color: COLORS.primary }} />
                        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>{u.institution?.name || 'No asignada'}</Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Paper>
              </Zoom>
            </Grid>
          ))}
        </Grid>

        {/* DIALOG DE VISTA DE DETALLES */}
        <Dialog open={Boolean(viewUser)} onClose={() => setViewUser(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden' } }}>
          {viewUser && (
            <Box>
              <Box sx={{ height: 120, background: COLORS.gradient, position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <IconButton onClick={() => setViewUser(null)} sx={{ position: 'absolute', right: 12, top: 12, color: 'white' }}><CloseRounded /></IconButton>
                <Avatar sx={{ 
                  width: 96, height: 96, border: '4px solid white', 
                  background: COLORS.primaryDark, fontSize: '2.2rem', fontWeight: 900,
                  mb: -5, boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                  borderRadius: '24px'
                }}>{viewUser.firstName?.charAt(0)}</Avatar>
              </Box>
              
              <Box sx={{ px: 4, pb: 4, pt: 6, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A' }}>{viewUser.firstName} {viewUser.lastName}</Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mb: 3, fontWeight: 500 }}>{viewUser.email}</Typography>
                
                <Divider sx={{ mb: 3, borderColor: '#F1F5F9' }} />

                <Grid container spacing={2.5} textAlign="left">
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800, letterSpacing: '0.05em' }}>CÉDULA</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#0F172A', mt: 0.5 }}>{viewUser.idNumber}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800, letterSpacing: '0.05em' }}>NACIMIENTO</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#0F172A', mt: 0.5 }}>{formatDate(viewUser.birthDate)}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800, letterSpacing: '0.05em' }}>INSTITUCIÓN</Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 0.8, borderRadius: '16px', bgcolor: COLORS.bgLight, display: 'flex', alignItems: 'center', gap: 1.5, borderColor: '#E2E8F0' }}>
                      <LocationOnRounded sx={{ color: COLORS.primary }} />
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>{viewUser.institution?.name}</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </Dialog>

        {/* MODAL CREAR/EDITAR */}
        <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '24px' } }}>
          <DialogTitle sx={{ 
            fontWeight: 900, px: 4, pt: 3, pb: 2.5,
            background: COLORS.gradient, color: 'white', mb: 2
          }}>
            {isCreating ? 'Registrar Nuevo Usuario - KuaaPy' : 'Editar Perfil de Usuario'}
          </DialogTitle>
          <DialogContent sx={{ px: 4, pb: 4 }}>
            <UserForm userId={selectedUser?._id} currentUser={currentUser} onSuccess={() => { setOpenModal(false); loadUsers(); }} />
          </DialogContent>
        </Dialog>

      </Container>
    </Box>
  );
};

export default AllUsersPage;