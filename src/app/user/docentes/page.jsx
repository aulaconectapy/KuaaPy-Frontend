'use client';

import { useEffect, useState } from 'react';
import { useAuth } from "@/context/AuthContext";
import {
  Container, Typography, Dialog, DialogTitle, DialogContent,
  Box, Paper, Stack, Button, Avatar, Chip, TextField,
  InputAdornment, IconButton, Tooltip, Grid, Fade, Zoom,
  Divider, CircularProgress, List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';

import { 
  EditRounded, DeleteSweepRounded, SearchRounded, PersonAddRounded,
  CloseRounded, EmailRounded, SchoolRounded, BadgeRounded,
  CakeRounded, PhoneRounded, LocationOnRounded, VisibilityRounded
} from '@mui/icons-material';

import { getUsers, deleteUser, getInstitutions } from '@/services/api';
import UserForm from '@/components/UserForm';
import CreateDocenteForm from '@/components/CreateDocenteForm';

const DocentesPage = () => {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [docentes, setDocentes] = useState([]);
  const [filteredDocentes, setFilteredDocentes] = useState([]);
  const [search, setSearch] = useState('');
  
  // Estados para Modales
  const [selectedDocente, setSelectedDocente] = useState(null);
  const [viewDocente, setViewDocente] = useState(null); // Para ver detalles
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
    if (confirm('¿Eliminar este docente?')) {
      await deleteUser(id);
      loadDocentes();
    }
  };

  // Formateador de fecha
  const formatDate = (dateString) => {
    if (!dateString) return "No registrada";
    return new Date(dateString).toLocaleDateString('es-PY', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* HEADER */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main', letterSpacing: '-1px' }}>
            Panel de Docentes
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {filteredDocentes.length} profesionales registrados
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddRounded />}
          onClick={() => { setIsCreating(true); setSelectedDocente(null); setOpenModal(true); }}
          sx={{ borderRadius: 3, px: 3, fontWeight: 700, textTransform: 'none', background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)' }}
        >
          Nuevo Docente
        </Button>
      </Box>

      {/* BUSCADOR */}
      <Paper elevation={0} sx={{ p: '4px 12px', display: 'flex', alignItems: 'center', borderRadius: 4, mb: 4, border: '1px solid #e2e8f0', bgcolor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)' }}>
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

      {/* GRID DE CARDS */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>
          {filteredDocentes.map((docente, index) => (
            <Grid item xs={12} sm={6} md={4} key={docente._id}>
              <Zoom in style={{ transitionDelay: `${index * 50}ms` }}>
                <Paper sx={{
                  p: 3, borderRadius: 5, border: '1px solid #eef2f6', transition: '0.3s', position: 'relative',
                  '&:hover': { boxShadow: '0 12px 24px rgba(0,0,0,0.05)', transform: 'translateY(-5px)' }
                }}>
                  {/* BOTONES DE ACCIÓN RÁPIDA */}
                  <Stack direction="row" sx={{ position: 'absolute', top: 12, right: 12 }}>
                    <Tooltip title="Ver detalles">
                      <IconButton size="small" onClick={() => setViewDocente(docente)}><VisibilityRounded fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => { setIsCreating(false); setSelectedDocente(docente); setOpenModal(true); }}><EditRounded fontSize="small" /></IconButton>
                    </Tooltip>
                  </Stack>

                  <Stack spacing={2} alignItems="center" textAlign="center">
                    <Avatar sx={{ width: 64, height: 64, background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)', fontWeight: 800, fontSize: '1.5rem' }}>
                      {docente.firstName?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{docente.firstName} {docente.lastName}</Typography>
                      <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>C.I. {docente.idNumber || 'S/N'}</Typography>
                    </Box>
                    <Divider sx={{ width: '80%' }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                      <SchoolRounded sx={{ fontSize: 16 }} />
                      <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>{docente.institution?.name}</Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" justifyContent="center">
                      {docente.grades?.map(g => <Chip key={g} label={`${g}°`} size="small" sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }} />)}
                    </Stack>
                  </Stack>
                </Paper>
              </Zoom>
            </Grid>
          ))}
        </Grid>
      )}

      {/* --- MODAL DE DETALLES (NUEVO) --- */}
      <Dialog open={Boolean(viewDocente)} onClose={() => setViewDocente(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 6, overflow: 'hidden' } }}>
        {viewDocente && (
          <Box>
            <Box sx={{ height: 100, background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)', position: 'relative' }}>
               <IconButton onClick={() => setViewDocente(null)} sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}><CloseRounded /></IconButton>
            </Box>
            <Box sx={{ px: 4, pb: 4, mt: -5 }}>
              <Stack alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <Avatar sx={{ width: 100, height: 100, border: '4px solid white', background: '#065f46', fontSize: '2.5rem', fontWeight: 800 }}>{viewDocente.firstName?.charAt(0)}</Avatar>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>{viewDocente.firstName} {viewDocente.lastName}</Typography>
                <Chip label={viewDocente.role} color="primary" size="small" sx={{ textTransform: 'uppercase', fontWeight: 800, px: 1 }} />
              </Stack>

              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>Información Personal</Typography>
              <List sx={{ mb: 2 }}>
                <ListItem disableGutters>
                  <ListItemIcon><BadgeRounded color="primary" /></ListItemIcon>
                  <ListItemText primary="Cédula de Identidad" secondary={viewDocente.idNumber} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon><EmailRounded color="primary" /></ListItemIcon>
                  <ListItemText primary="Correo Electrónico" secondary={viewDocente.email} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon><CakeRounded color="primary" /></ListItemIcon>
                  <ListItemText primary="Fecha de Nacimiento" secondary={formatDate(viewDocente.birthDate)} />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>Institución Asignada</Typography>
              <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 3, bgcolor: '#f8fafc' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.dark' }}>{viewDocente.institution?.name}</Typography>
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><LocationOnRounded sx={{ fontSize: 14, color: 'text.secondary' }} /><Typography variant="caption">{viewDocente.institution?.address}</Typography></Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><PhoneRounded sx={{ fontSize: 14, color: 'text.secondary' }} /><Typography variant="caption">{viewDocente.institution?.phoneNumber}</Typography></Box>
                </Stack>
              </Paper>
            </Box>
          </Box>
        )}
      </Dialog>

      {/* MODAL CREAR/EDITAR (EXISTENTE) */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 6 } }}>
        <DialogTitle sx={{ fontWeight: 800, px: 4, pt: 3 }}>{isCreating ? 'Registrar Docente' : 'Editar Perfil'}</DialogTitle>
        <DialogContent sx={{ px: 4, pb: 4 }}>
          {isCreating ? <CreateDocenteForm onSuccess={() => { setOpenModal(false); loadDocentes(); }} /> : <UserForm userId={selectedDocente?._id} currentUser={currentUser} institutions={institutions} onSuccess={() => { setOpenModal(false); loadDocentes(); }} />}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default DocentesPage;