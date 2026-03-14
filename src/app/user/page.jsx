'use client';

import { 
  Container, Typography, Grid, Paper, Button, Box, Avatar, Menu, MenuItem, Dialog, DialogTitle, DialogContent, Stack, Fade, useTheme, useMediaQuery
} from '@mui/material';
import { 
  School, Person, GroupAdd, AdminPanelSettings, ChevronRight 
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import UserForm from '@/components/UserForm';

// PALETA DE COLORES INSTITUCIONAL
const COLORS = {
  primary: "#7D0F15", // Granate María Auxiliadora
  primaryDark: "#4A080C",
  secondary: "#D4AF37", // Dorado (opcional para detalles)
  textMain: "#1E293B",
  textSecondary: "#64748B",
  bgLight: "#F8FAFC"
};

const UserManagementPage = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
          p: isMobile ? 3 : 4, 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 5, 
          border: '1px solid #E2E8F0',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': { 
            boxShadow: `0px 20px 40px rgba(125, 15, 21, 0.08)`, 
            transform: 'translateY(-6px)',
            borderColor: COLORS.primary,
            '& .arrow-icon': { transform: 'translateX(5px)', color: COLORS.primary }
          }
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Avatar sx={{ 
            bgcolor: `${color}10`, 
            color: color, 
            width: 52, 
            height: 52, 
            borderRadius: 3,
            border: `1px solid ${color}20`
          }}>
            <Icon fontSize="medium" />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textMain, fontSize: '1.05rem', lineHeight: 1.2 }}>
            {title}
          </Typography>
        </Stack>
        
        <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 3, flexGrow: 1, lineHeight: 1.6 }}>
          {description}
        </Typography>

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 'auto' }}>
          <Typography variant="button" sx={{ color: COLORS.primary, fontWeight: 800, fontSize: '0.7rem', letterSpacing: 0.5 }}>
            GESTIONAR MÓDULO
          </Typography>
          <ChevronRight className="arrow-icon" sx={{ fontSize: 18, color: '#CBD5E1', transition: '0.3s' }} />
        </Stack>
      </Paper>
    </Grid>
  );

  return (
    <Box sx={{ py: { xs: 3, md: 6 }, bgcolor: COLORS.bgLight, minHeight: '90vh' }}>
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
           <Typography variant={isMobile ? "h4" : "h3"} sx={{ fontWeight: 900, color: COLORS.primaryDark, letterSpacing: '-0.02em' }}>
              Gestión de Usuarios
            </Typography>
            <Typography variant="body1" sx={{ color: COLORS.textSecondary, mt: 0.5, maxWidth: 500 }}>
              Administra los accesos y perfiles de la comunidad educativa del <strong>Colegio María Auxiliadora</strong>.
            </Typography>
          </Box>

          {(isAdmin || isDirector || isSecretary) && (
            <Box sx={{ width: { xs: '100%', md: 'auto' } }}>
              <Button
                variant="contained"
                fullWidth={isMobile}
                disableElevation
                startIcon={<GroupAdd />}
                onClick={handleClick}
                sx={{ 
                  borderRadius: 3, 
                  px: 4, 
                  py: 1.5, 
                  bgcolor: COLORS.primary, 
                  textTransform: 'none', 
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  boxShadow: `0 8px 20px rgba(125, 15, 21, 0.2)`,
                  '&:hover': { bgcolor: COLORS.primaryDark, transform: 'scale(1.02)' },
                  transition: '0.2s'
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
                    mt: 1.5, borderRadius: 3, boxShadow: '0 15px 35px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', minWidth: 200 
                  } 
                }}
              >
                <MenuItem onClick={() => handleMenuSelect('usuario')} sx={{ py: 1.8, fontWeight: 700, color: COLORS.textMain }}>
                  <Person sx={{ mr: 2, color: COLORS.primary }} fontSize="small" /> Registrar Usuario
                </MenuItem>
                <MenuItem onClick={() => handleMenuSelect('estudiante')} sx={{ py: 1.8, fontWeight: 700, color: COLORS.textMain }}>
                  <School sx={{ mr: 2, color: COLORS.primary }} fontSize="small" /> Registrar Estudiante
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Stack>

        {/* GRID DE ACCIONES */}
        <Grid container spacing={3}>
          <ActionCard 
            title="Todos los Usuarios"
            description="Control total de cuentas, estados de actividad y roles del sistema."
            icon={Person}
            color={COLORS.primary}
            path="/user/AllUsers"
          />
          <ActionCard 
            title="Cuerpo Docente"
            description="Administración de profesores, asignación de materias y perfiles profesionales."
            icon={School}
            color="#0288d1" // Azul informativo
            path="/user/docentes"
          />
          <ActionCard 
            title="Alumnos"
            description="Gestión de expedientes académicos, matrículas y seguimiento individual."
            icon={GroupAdd}
            color="#059669" // Verde éxito
            path="/user/students"
          />
          {isAdmin && (
            <ActionCard 
              title="Directores"
              description="Control de usuarios con privilegios de gestión institucional total."
              icon={AdminPanelSettings}
              color={COLORS.primaryDark}
              path="/user/directores"
            />
          )}
        </Grid>

        {/* MODAL DE REGISTRO */}
        <Dialog 
          open={openUserModal} 
          onClose={() => setOpenUserModal(false)} 
          fullWidth 
          maxWidth="sm" 
          fullScreen={isMobile}
          PaperProps={{ sx: { borderRadius: isMobile ? 0 : 5, bgcolor: '#fff' } }}
        >
          <Box sx={{ 
            p: 3, 
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
            color: 'white'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>Nuevo Usuario</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Complete los datos para el nuevo acceso.</Typography>
          </Box>
          
          <DialogContent sx={{ p: { xs: 2, md: 4 } }}>
            <UserForm currentUser={user} onSuccess={() => setOpenUserModal(false)} />
            
            <Button 
              fullWidth 
              variant="text" 
              onClick={() => setOpenUserModal(false)}
              sx={{ mt: 2, color: COLORS.textSecondary, fontWeight: 700 }}
            >
              Cancelar
            </Button>
          </DialogContent>
        </Dialog>
      </Container>
    </Box>
  );
};

export default UserManagementPage;