'use client';

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Container, Typography, Box, Grid, Paper,
  Avatar, CircularProgress, Stack, Chip, Divider, Dialog,
  useMediaQuery, useTheme, IconButton
} from '@mui/material';

import {
  School, People,
  AdminPanelSettings, MenuBook,
  Settings, Class, Badge,
  AccountCircle, Edit, Email
} from '@mui/icons-material';

import StudentProfileForm from "@/components/StudentProfileForm";
import UserForm from "@/components/UserForm";

import {
  getMyDisciplineReports,
  getReportsByGrade,
  getAllDisciplineReports
} from "@/services/api";

const Dashboard = ({ docentesList }) => {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [profileOpen, setProfileOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // --- PALETA INSTITUCIONAL ---
  const COLORS = {
    primary: "#7D0F15", // Granate María Auxiliadora
    primaryDark: "#4A080C",
    secondary: "#D4AF37", // Dorado
    textMain: "#1E293B",
    textSecondary: "#64748B"
  };

  // Lógica de redirección original
  useEffect(() => {
    if (!loading && initialized && !user) {
      router.replace('/auth/login');
    }
  }, [loading, initialized, user, router]);

  // Lógica de carga de reportes original (Mantenida intacta)
  useEffect(() => {
    if (!initialized || !user) return;

    const loadReports = async () => {
      setLoadingReports(true);
      try {
        let data = [];
        const role = user.role?.toLowerCase();

        if (role === 'estudiante') {
          data = await getMyDisciplineReports();
        } else if (role === 'docente') {
          const grade = user.grades?.[0];
          if (!grade) {
            console.warn("Docente sin grado asignado");
            return;
          }
          data = await getReportsByGrade(grade);
        } else if (['administrador', 'director/a'].includes(role)) {
          data = await getAllDisciplineReports();
        }
        setReports(data);
      } catch (error) {
        console.error("Error cargando reportes:", error);
      } finally {
        setLoadingReports(false);
      }
    };

    loadReports();
  }, [initialized, user]);

  if (loading || !initialized) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress thickness={5} size={60} sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  if (!user) return null;

  // Componente DashCard con la lógica de click original + Estética nueva
  const DashCard = ({ title, desc, icon: Icon, color, href, onClick }) => {
    const handleClick = () => {
      if (href) router.push(href);
      if (onClick) onClick();
    };

    return (
      <Grid item xs={12} sm={6}>
        <Paper
          elevation={0}
          onClick={handleClick}
          sx={{
            p: isMobile ? 2 : 3,
            height: '100%',
            borderRadius: 4,
            border: '1px solid #eef2f6',
            bgcolor: '#fff',
            transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            '&:hover': {
              boxShadow: '0 10px 20px rgba(125, 15, 21, 0.1)',
              transform: isMobile ? 'none' : 'translateY(-4px)',
              borderColor: COLORS.primary
            },
            '&:active': { transform: 'scale(0.98)' }
          }}
        >
          <Avatar sx={{ 
            bgcolor: `${color}15`, 
            color, 
            width: isMobile ? 48 : 52, 
            height: isMobile ? 48 : 52,
            borderRadius: 3,
            mr: 2
          }}>
            <Icon fontSize={isMobile ? "small" : "medium"} />
          </Avatar>
          <Box>
            <Typography fontWeight={700} variant={isMobile ? "body1" : "h6"} sx={{ color: COLORS.textMain, lineHeight: 1.2 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {desc}
            </Typography>
          </Box>
        </Paper>
      </Grid>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: isMobile ? 3 : 6 }}>
      <Grid container spacing={4}>
        
        {/* SECCIÓN PERFIL (Izquierda) */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 5,
                background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                color: 'white',
                position: 'relative',
                boxShadow: '0 12px 24px rgba(125, 15, 21, 0.2)'
              }}
            >
              {/* BOTÓN EDITAR */}
              <Box
                onClick={() => setProfileOpen(true)}
                sx={{
                  position: 'absolute', top: 16, right: 16,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  borderRadius: '50%', p: 1, cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' }
                }}
              >
                <Edit fontSize="small" />
              </Box>

              <Avatar
                sx={{
                  width: 80, height: 80, mx: 'auto', mb: 2,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  fontSize: 32, fontWeight: 800,
                  border: '3px solid rgba(255,255,255,0.3)'
                }}
              >
                {user.firstName?.charAt(0)}
              </Avatar>

              <Typography variant="h5" fontWeight={800} textAlign="center">
                {user.firstName} {user.lastName}
              </Typography>

              <Stack spacing={1} mt={2} alignItems="center">
                <Chip
                  label={user.role?.toUpperCase()}
                  size="small"
                  sx={{ bgcolor: COLORS.secondary, color: '#000', fontWeight: 700 }}
                />

                {user.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Email fontSize="small" />
                    <Typography variant="body2">{user.email}</Typography>
                  </Box>
                )}

                {user.role === "estudiante" && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Class fontSize="small" />
                    <Typography variant="body2">{user.grades?.[0]}</Typography>
                  </Box>
                )}

                {user.institution?.name && (
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {user.institution?.name}
                  </Typography>
                )}
              </Stack>
            </Paper>

            {/* INFORMACIÓN ACADÉMICA (Original) */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 5, border: '1px solid #e0e6ed' }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                INFORMACIÓN ACADÉMICA
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Settings sx={{ color: COLORS.primary }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Institución</Typography>
                    <Typography fontWeight={700}>{user.institution?.name}</Typography>
                  </Box>
                </Box>
                {user.role === 'estudiante' && (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Class sx={{ color: COLORS.primary }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Grado</Typography>
                      <Typography fontWeight={700}>{user.grades?.[0]}</Typography>
                    </Box>
                  </Box>
                )}
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        {/* SECCIÓN ACCIONES (Derecha) */}
        <Grid item xs={12} md={8}>
          <Box sx={{ mb: 4, textAlign: isMobile ? 'center' : 'left' }}>
            <Typography variant={isMobile ? "h5" : "h4"} fontWeight={900}>
              ¡Qué bueno verte! 👋
            </Typography>
            <Typography color="text.secondary">
              Accesos rápidos del Colegio María Auxiliadora
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* MI PERFIL - Disponible para todos */}
            <DashCard
              title="Mi Perfil"
              desc="Editar mis datos"
              icon={AccountCircle}
              color="#0288d1"
              onClick={() => setProfileOpen(true)}
            />

            {/* LÓGICA DE TARJETAS POR ROL (Recuperada de tu código original) */}
            {user.role === 'estudiante' && (
              <>
                <DashCard
                  title="Mis Tareas"
                  desc="Ver tareas asignadas"
                  icon={MenuBook}
                  color="#4CAF50"
                  href="/teacher/classes/tasks/studentTask"
                />
                <DashCard
                  title="Mis reportes"
                  desc="Ver mis reportes"
                  icon={Badge}
                  color="#F57C00"
                  href="/reportes/mis-reportes"
                />
              </>
            )}

            {user.role === 'docente' && (
              <>
                <DashCard
                  title="Gestión de Clases"
                  desc="Crear tareas y calificar"
                  icon={School}
                  color="#2196F3"
                  href="/teacher/classes/tasks"
                />
                <DashCard
                  title="Ver Estudiantes"
                  desc="Listado de estudiantes"
                  icon={People}
                  color="#0288d1"
                  href="/user/students"
                />
                <DashCard
                  title="Reportes Disciplinarios"
                  desc="Ver reportes de estudiantes"
                  icon={Badge}
                  color="#F57C00"
                  href="/reportes"
                />
              </>
            )}

            {['administrador', 'director/a'].includes(user.role?.toLowerCase()) && (
              <>
                {user.role?.toLowerCase() === 'director/a' && (
                  <DashCard
                    title="Progreso de Estudiantes"
                    desc="Ver avance académico y tareas"
                    icon={School}
                    color="#2196F3"
                    href="/teacher/classes/tasks"
                  />
                )}
                <DashCard
                  title="Listado de Alumnos"
                  desc="Base de estudiantes"
                  icon={People}
                  color="#0288d1"
                  href="/user/students"
                />
                <DashCard
                  title="Nuevo Estudiante"
                  desc="Registrar estudiante"
                  icon={AccountCircle}
                  color="#ed6c02"
                  href="/pages/students/nuevo"
                />
                <DashCard
                  title="Usuarios"
                  desc="Administrar roles"
                  icon={AdminPanelSettings}
                  color="#673ab7"
                  href="/user"
                />
                <DashCard
                  title="Reportes"
                  desc="Ver todos los reportes"
                  icon={Badge}
                  color="#F57C00"
                  href="/reportes"
                />
              </>
            )}
          </Grid>
        </Grid>
      </Grid>

      {/* DIÁLOGO DE FORMULARIOS (Recuperado de tu código original) */}
      <Dialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile} // Mejora estética en celular
      >
        <Box sx={{ p: isMobile ? 1 : 0 }}>
          {user.role === 'estudiante'
            ? <StudentProfileForm />
            : <UserForm userId={user._id} onSuccess={() => setProfileOpen(false)} />
          }
        </Box>
      </Dialog>
    </Container>
  );
};

export default Dashboard;