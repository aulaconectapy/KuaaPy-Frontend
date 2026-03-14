'use client';

import { useEffect, useState } from 'react';
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation'; // 🔹 IMPORTAR useRouter

import {
  Container, Typography, Dialog, DialogTitle, DialogContent,
  Box, Paper, Stack, Button, Avatar, Chip, TextField,
  InputAdornment, IconButton, Tooltip, Grid, Zoom,
  Divider, CircularProgress, List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';

import { 
  EditRounded, DeleteSweepRounded, SearchRounded, PersonAddRounded,
  CloseRounded, EmailRounded, SchoolRounded, BadgeRounded,
  CakeRounded, PhoneRounded, LocationOnRounded, VisibilityRounded
} from '@mui/icons-material';

import { getUsers, deleteUser } from '@/services/api';
import UserForm from '@/components/UserForm';

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
    if (!currentUser) return; // 🔒 Protección
    setLoading(true);
    try {
      let allUsers = await getUsers();
      const role = currentUser?.role?.toLowerCase();

      if (role === 'administrador') {
        // admin ve todos
      } else if (role === 'director/a' || role === 'secretario/a') {
        // solo estudiantes de su institución
        allUsers = allUsers.filter(u => u.role?.toLowerCase() === 'estudiante' && u.institution?._id === currentUser.institution?._id);
      } else {
        allUsers = []; // otros roles no ven usuarios
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
    if (confirm('¿Eliminar este usuario?')) {
      await deleteUser(id);
      loadUsers();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No registrada";
    return new Date(dateString).toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  if (authLoading || loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 10 }} />;

  // 🔒 Si no hay usuario logueado
  if (!currentUser) {
    return (
      <Container sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          No tienes acceso. Por favor inicia sesión.
        </Typography>
      </Container>
    );
  }

  const role = currentUser?.role?.toLowerCase();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main' }}>
          Gestión de Usuarios
        </Typography>

        {(role === 'administrador' || role === 'director/a' || role === 'secretario/a') && (
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<PersonAddRounded />}
              onClick={() => { setIsCreating(true); setSelectedUser(null); setOpenModal(true); }}
              sx={{ borderRadius: 3, px: 3, fontWeight: 700, textTransform: 'none' }}
            >
              Nuevo Usuario
            </Button>
<Button
              variant="contained"
              color="secondary"
              onClick={() => router.push('/pages/students/nuevo')}
              sx={{ borderRadius: 3, px: 3, fontWeight: 700, textTransform: 'none' }}
            >
              Crear Estudiante
            </Button>
            {/* Botón para ver todos los usuarios, solo Admin */}
            {role === 'administrador' && (
              <Button
                variant="outlined"
                onClick={() => { /* Aquí podrías navegar a otra página si quieres */ }}
                sx={{ borderRadius: 3, px: 3, fontWeight: 700, textTransform: 'none' }}
              >
                Ver Todos los Usuarios
              </Button>
            )}
          </Stack>
        )}
      </Box>

      <Paper sx={{ p: '4px 12px', mb: 4, display: 'flex', alignItems: 'center', borderRadius: 4, border: '1px solid #e2e8f0' }}>
        <InputAdornment position="start" sx={{ ml: 1 }}><SearchRounded color="disabled" /></InputAdornment>
        <TextField
          fullWidth
          variant="standard"
          placeholder="Buscar por nombre, CI o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ disableUnderline: true, sx: { py: 1.5, px: 1, fontWeight: 500 } }}
        />
      </Paper>

      <Grid container spacing={3}>
        {filteredUsers.map((u, index) => (
          <Grid item xs={12} sm={6} md={4} key={u._id}>
            <Zoom in style={{ transitionDelay: `${index * 50}ms` }}>
              <Paper sx={{ p: 3, borderRadius: 5, border: '1px solid #eef2f6', position: 'relative', '&:hover': { boxShadow: '0 12px 24px rgba(0,0,0,0.05)', transform: 'translateY(-5px)' } }}>
                <Stack direction="row" sx={{ position: 'absolute', top: 12, right: 12 }} spacing={0.5}>
                  <Tooltip title="Ver detalles"><IconButton size="small" onClick={() => setViewUser(u)}><VisibilityRounded fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Editar"><IconButton size="small" onClick={() => { setIsCreating(false); setSelectedUser(u); setOpenModal(true); }}><EditRounded fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Eliminar"><IconButton size="small" onClick={() => handleDelete(u._id)}><DeleteSweepRounded fontSize="small" /></IconButton></Tooltip>
                </Stack>
                <Stack spacing={2} alignItems="center" textAlign="center">
                  <Avatar sx={{ width: 64, height: 64, background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)', fontWeight: 800, fontSize: '1.5rem' }}>{u.firstName?.charAt(0)}</Avatar>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{u.firstName} {u.lastName}</Typography>
                  <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>C.I. {u.idNumber || 'S/N'}</Typography>
                  <Divider sx={{ width: '80%' }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                    <SchoolRounded sx={{ fontSize: 16 }} />
                    <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>{u.institution?.name}</Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" justifyContent="center">
                    {u.grades?.map(g => <Chip key={g} label={`${g}°`} size="small" sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }} />)}
                  </Stack>
                </Stack>
              </Paper>
            </Zoom>
          </Grid>
        ))}
      </Grid>

      {/* MODAL DE DETALLES */}
      <Dialog open={Boolean(viewUser)} onClose={() => setViewUser(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 6, overflow: 'hidden' } }}>
        {viewUser && (
          <Box>
            <Box sx={{ height: 100, background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)', position: 'relative' }}>
               <IconButton onClick={() => setViewUser(null)} sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}><CloseRounded /></IconButton>
            </Box>
            <Box sx={{ px: 4, pb: 4, mt: -5 }}>
              <Stack alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <Avatar sx={{ width: 100, height: 100, border: '4px solid white', background: '#065f46', fontSize: '2.5rem', fontWeight: 800 }}>{viewUser.firstName?.charAt(0)}</Avatar>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>{viewUser.firstName} {viewUser.lastName}</Typography>
                <Chip label={viewUser.role} color="primary" size="small" sx={{ textTransform: 'uppercase', fontWeight: 800, px: 1 }} />
              </Stack>

              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>Información Personal</Typography>
              <List sx={{ mb: 2 }}>
                <ListItem disableGutters>
                  <ListItemIcon><BadgeRounded color="primary" /></ListItemIcon>
                  <ListItemText primary="Cédula de Identidad" secondary={viewUser.idNumber} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon><EmailRounded color="primary" /></ListItemIcon>
                  <ListItemText primary="Correo Electrónico" secondary={viewUser.email} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon><CakeRounded color="primary" /></ListItemIcon>
                  <ListItemText primary="Fecha de Nacimiento" secondary={formatDate(viewUser.birthDate)} />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>Institución Asignada</Typography>
              <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 3, bgcolor: '#f8fafc' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.dark' }}>{viewUser.institution?.name}</Typography>
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><LocationOnRounded sx={{ fontSize: 14, color: 'text.secondary' }} /><Typography variant="caption">{viewUser.institution?.address}</Typography></Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><PhoneRounded sx={{ fontSize: 14, color: 'text.secondary' }} /><Typography variant="caption">{viewUser.institution?.phoneNumber}</Typography></Box>
                </Stack>
              </Paper>
            </Box>
          </Box>
        )}
      </Dialog>

      {/* MODAL CREAR/EDITAR */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 6 } }}>
        <DialogTitle sx={{ fontWeight: 800, px: 4, pt: 3 }}>{isCreating ? 'Registrar Usuario' : 'Editar Perfil'}</DialogTitle>
        <DialogContent sx={{ px: 4, pb: 4 }}>
          <UserForm userId={selectedUser?._id} currentUser={currentUser} onSuccess={() => { setOpenModal(false); loadUsers(); }} />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default AllUsersPage;