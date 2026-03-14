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

import { getUsers, deleteUser } from '@/services/api';
import UserForm from '@/components/UserForm';

// CONSTANTES DE ESTILO
const COLORS = {
  primary: "#7D0F15",
  primaryDark: "#4A080C",
  bgLight: "#F8FAFC",
  gradient: "linear-gradient(135deg, #7D0F15 0%, #4A080C 100%)"
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
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        
        {/* ENCABEZADO MEJORADO */}
        <Box sx={{ mb: 4 }}>
          <Button 
            startIcon={<ArrowBackIosNewRounded />} 
            onClick={() => router.back()}
            sx={{ mb: 2, color: COLORS.textSecondary, fontWeight: 700 }}
          >
            Volver
          </Button>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.primaryDark }}>
                Listado de Usuarios
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gestionando {filteredUsers.length} registros encontrados
              </Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<PersonAddRounded />}
                onClick={() => { setIsCreating(true); setSelectedUser(null); setOpenModal(true); }}
                sx={{ bgcolor: COLORS.primary, borderRadius: 3, px: 3, fontWeight: 700, '&:hover': { bgcolor: COLORS.primaryDark } }}
              >
                Nuevo Usuario
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* BARRA DE BÚSQUEDA PREMIUM */}
        <Paper elevation={0} sx={{ p: '4px 16px', mb: 4, display: 'flex', alignItems: 'center', borderRadius: 4, border: '1px solid #E2E8F0', bgcolor: 'white' }}>
          <InputAdornment position="start" sx={{ ml: 1 }}><SearchRounded sx={{ color: COLORS.primary }} /></InputAdornment>
          <TextField
            fullWidth
            variant="standard"
            placeholder="Buscar por nombre, CI o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ disableUnderline: true, sx: { py: 1.5, px: 1, fontWeight: 500 } }}
          />
        </Paper>

        {/* GRID DE USUARIOS */}
        <Grid container spacing={3}>
          {filteredUsers.map((u, index) => (
            <Grid item xs={12} sm={6} md={4} key={u._id}>
              <Zoom in style={{ transitionDelay: `${index * 30}ms` }}>
                <Paper sx={{ 
                  p: 3, borderRadius: 5, border: '1px solid #eef2f6', position: 'relative', overflow: 'hidden',
                  transition: 'all 0.3s',
                  '&:hover': { boxShadow: '0 20px 40px rgba(0,0,0,0.08)', transform: 'translateY(-5px)', borderColor: COLORS.primary } 
                }}>
                  {/* Acciones flotantes */}
                  <Stack direction="row" sx={{ position: 'absolute', top: 12, right: 12 }} spacing={0.5}>
                    <IconButton size="small" onClick={() => setViewUser(u)} sx={{ color: COLORS.primary }}><VisibilityRounded fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => { setIsCreating(false); setSelectedUser(u); setOpenModal(true); }}><EditRounded fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(u._id)} sx={{ color: '#d32f2f' }}><DeleteSweepRounded fontSize="small" /></IconButton>
                  </Stack>

                  <Stack spacing={2} alignItems="center" textAlign="center">
                    <Avatar sx={{ 
                      width: 70, height: 70, 
                      background: COLORS.gradient, 
                      fontWeight: 800, fontSize: '1.8rem',
                      boxShadow: '0 8px 16px rgba(125, 15, 21, 0.2)'
                    }}>
                      {u.firstName?.charAt(0)}
                    </Avatar>
                    
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{u.firstName} {u.lastName}</Typography>
                      <Chip 
                        label={u.role || 'Sin Rol'} 
                        size="small" 
                        sx={{ mt: 1, height: 20, fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', bgcolor: `${COLORS.primary}10`, color: COLORS.primary }} 
                      />
                    </Box>

                    <Divider sx={{ width: '100%' }} />

                    <Stack spacing={1} sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                        <BadgeRounded sx={{ fontSize: 18, color: COLORS.primary }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>C.I. {u.idNumber || 'S/N'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                        <SchoolRounded sx={{ fontSize: 18, color: COLORS.primary }} />
                        <Typography variant="body2" noWrap sx={{ textAlign: 'left' }}>{u.institution?.name || 'No asignada'}</Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Paper>
              </Zoom>
            </Grid>
          ))}
        </Grid>

        {/* DIALOG DE VISTA DE DETALLES (REDISEÑADO) */}
        <Dialog open={Boolean(viewUser)} onClose={() => setViewUser(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 6, overflow: 'hidden' } }}>
          {viewUser && (
            <Box>
              <Box sx={{ height: 120, background: COLORS.gradient, position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <IconButton onClick={() => setViewUser(null)} sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}><CloseRounded /></IconButton>
                <Avatar sx={{ 
                  width: 100, height: 100, border: '5px solid white', 
                  background: COLORS.primaryDark, fontSize: '2.5rem', fontWeight: 800,
                  mb: -5, boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                }}>{viewUser.firstName?.charAt(0)}</Avatar>
              </Box>
              
              <Box sx={{ px: 4, pb: 4, pt: 6, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>{viewUser.firstName} {viewUser.lastName}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{viewUser.email}</Typography>
                
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={2} textAlign="left">
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight={800}>CÉDULA</Typography>
                    <Typography variant="body1" fontWeight={600}>{viewUser.idNumber}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight={800}>NACIMIENTO</Typography>
                    <Typography variant="body1" fontWeight={600}>{formatDate(viewUser.birthDate)}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" fontWeight={800}>INSTITUCIÓN</Typography>
                    <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5, borderRadius: 3, bgcolor: COLORS.bgLight, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <LocationOnRounded sx={{ color: COLORS.primary }} />
                      <Typography variant="body2" fontWeight={700}>{viewUser.institution?.name}</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </Dialog>

        {/* MODAL CREAR/EDITAR */}
        <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 6 } }}>
          <DialogTitle sx={{ 
            fontWeight: 900, px: 4, pt: 3, 
            background: COLORS.gradient, color: 'white', mb: 2
          }}>
            {isCreating ? 'Registrar Nuevo Usuario' : 'Editar Perfil de Usuario'}
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