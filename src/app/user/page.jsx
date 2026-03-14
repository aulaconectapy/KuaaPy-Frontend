'use client';

import { 
  Container, Typography, Grid, Paper, Button, Box, Avatar, Menu, MenuItem, Dialog, DialogTitle, DialogContent, Stack, Fade
} from '@mui/material';
import { 
  School, FamilyRestroom, Person, GroupAdd, AdminPanelSettings, ChevronRight 
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import UserForm from '@/components/UserForm';

const UserManagementPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const [openUserModal, setOpenUserModal] = useState(false);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleMenuSelect = (option) => {
    handleClose();
    if (option === 'usuario') {
      setOpenUserModal(true);
    } else if (option === 'estudiante') {
      router.push('/pages/students/nuevo');
    }
  };

  if (loading) return null;

  const role = user?.role?.toLowerCase();
  const isAdmin = role === 'administrador';
  const isDirector = role === 'director/a';
  const isSecretary = role === 'secretario/a';

  const ActionCard = ({ title, description, icon: Icon, color, path }) => (
    <Grid item xs={12} sm={6} lg={4}>
      <Paper 
        elevation={0}
        onClick={() => router.push(path)}
        sx={{ 
          p: 4, 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 5, 
          border: '1px solid #E2E8F0',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': { 
            boxShadow: '0px 20px 40px rgba(0,0,0,0.04)', 
            transform: 'translateY(-6px)',
            borderColor: '#CBD5E1',
            '& .arrow-icon': { transform: 'translateX(5px)', color: '#1A365D' }
          }
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Avatar sx={{ bgcolor: `${color}10`, color: color, width: 50, height: 50, borderRadius: 3 }}>
            <Icon fontSize="medium" />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', fontSize: '1.1rem' }}>
            {title}
          </Typography>
        </Stack>
        
        <Typography variant="body2" sx={{ color: '#64748B', mb: 3, flexGrow: 1, lineHeight: 1.6 }}>
          {description}
        </Typography>

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 'auto' }}>
          <Typography variant="button" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '0.75rem' }}>
            GESTIONAR MÓDULO
          </Typography>
          <ChevronRight className="arrow-icon" sx={{ fontSize: 18, color: '#CBD5E1', transition: '0.3s' }} />
        </Stack>
      </Paper>
    </Grid>
  );

  return (
    <Box sx={{ py: { xs: 2, md: 5 } }}>
      <Container maxWidth="lg">
        {/* ENCABEZADO */}
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          justifyContent="space-between" 
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={3}
          sx={{ mb: 6 }}
        >
          <Box>
           <Typography variant="h4" sx={{ fontWeight: 900, color: '#1A365D', letterSpacing: '-0.02em' }}>
              Gestión de Usuarios
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748B', mt: 0.5 }}>
              Administra los accesos y perfiles de la comunidad <strong>AulaConectaPy</strong>.
            </Typography>
          </Box>

          {(isAdmin || isDirector || isSecretary) && (
            <Box>
              <Button
                variant="contained"
                disableElevation
                startIcon={<GroupAdd />}
                onClick={handleClick}
                sx={{ 
                  borderRadius: 3, 
                  px: 3, 
                  py: 1.2, 
                  bgcolor: '#1A365D', 
                  textTransform: 'none', 
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#2D3748' }
                }}
              >
                Nuevo Registro
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleClose}
                TransitionComponent={Fade}
                PaperProps={{ 
                  sx: { 
                    mt: 1, borderRadius: 3, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0', minWidth: 180 
                  } 
                }}
              >
                <MenuItem onClick={() => handleMenuSelect('usuario')} sx={{ py: 1.5, fontWeight: 600 }}>Registrar Usuario</MenuItem>
                <MenuItem onClick={() => handleMenuSelect('estudiante')} sx={{ py: 1.5, fontWeight: 600 }}>Registrar Estudiante</MenuItem>
              </Menu>
            </Box>
          )}
        </Stack>

        {/* GRID DE ACCIONES */}
        <Grid container spacing={3}>
          <ActionCard 
            title="Todos los Usuarios"
            description="Revisión completa de cuentas, estados de conexión y roles globales."
            icon={Person}
            color="#3182CE"
            path="/user/AllUsers"
          />
          <ActionCard 
            title="Cuerpo Docente"
            description="Administración de profesores, asignación de materias y currículums."
            icon={School}
            color="#38A169"
            path="/user/docentes"
          />
          <ActionCard 
            title="Alumnos"
            description="Gestión de expedientes, matrículas y seguimiento académico individual."
            icon={GroupAdd}
            color="#E53E3E"
            path="/user/students"
          />
{/*      {(isAdmin || isDirector) && (
            <ActionCard 
              title="Padres y Tutores"
              description="Vinculación de responsables legales y contactos de emergencia."
              icon={FamilyRestroom}
              color="#805AD5"
              path="/user/padres"
            />
          )}
            */}   
          {isAdmin && (
            <ActionCard 
              title="Directores"
              description="Control de usuarios con privilegios de gestión institucional total."
              icon={AdminPanelSettings}
              color="#2D3748"
              path="/user/directores"
            />
          )}
        </Grid>

        {/* MODAL DE REGISTRO (CORREGIDO) */}
        <Dialog 
          open={openUserModal} 
          onClose={() => setOpenUserModal(false)} 
          fullWidth 
          maxWidth="sm" 
          PaperProps={{ sx: { borderRadius: 5, p: 1 } }}
        >
          {/* Aquí estaba el error de cierre de etiqueta */}
          <DialogTitle sx={{ fontWeight: 900, color: '#1A365D', pt: 3, px: 4 }}>
            Nuevo Usuario del Sistema
          </DialogTitle>
          
          <DialogContent sx={{ px: 4, pb: 4 }}>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
              Complete los datos para habilitar un nuevo acceso a la plataforma.
            </Typography>
            <UserForm currentUser={user} onSuccess={() => setOpenUserModal(false)} />
          </DialogContent>
        </Dialog>
      </Container>
    </Box>
  );
};

export default UserManagementPage;