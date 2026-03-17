'use client';

import React, { useEffect, useState } from "react";
import { 
  Box, Typography, Button, Avatar, Skeleton, Container, 
  IconButton, AppBar, Toolbar, useMediaQuery, Badge,
  Snackbar, Alert, Menu, MenuItem, ListItemText
} from "@mui/material";
import { Logout, Notifications as NotificationsIcon } from "@mui/icons-material";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useAuth } from "@/context/AuthContext";
import { getMyDisciplineReports, getMyNotifications, markAsRead } from "@/services/api";
import socket from "@/services/socket";

// PALETA INSTITUCIONAL C.P.M.A.
const theme = createTheme({
  palette: {
    primary: { 
      main: "#7D0F15", // Granate
      light: "#A61D24", 
      dark: "#4A080C",
      contrastText: "#FFFFFF" 
    },
    secondary: { 
      main: "#D4AF37", // Dorado
    },
    background: { 
      default: "#F9F7F2", 
      paper: "#FFFFFF" 
    },
    text: { 
      primary: "#2D2D2D", 
      secondary: "#6B7280" 
    },
    error: { main: "#B91C1C" },
    warning: { main: "#F59E0B" },
    success: { main: "#15803D" }
  },
  typography: { 
    fontFamily: '"Inter", "Roboto", "Helvetica", sans-serif',
    h6: { fontWeight: 700 }
  },
  shape: {
    borderRadius: 8
  }
});

export default function Layout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const isMobile = useMediaQuery("(max-width:600px)");

  const [pendingReports, setPendingReports] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const [pulse, setPulse] = useState(false);

  // 1. CARGA DE DATOS INICIALES (Solo si hay usuario)
  useEffect(() => {
    if (!user) return;
    const fetchInitialData = async () => {
      try {
        if (user.role === "estudiante") {
          const reports = await getMyDisciplineReports();
          setPendingReports(reports.filter(r => r.status === "Pendiente").length);
        } else if (user.role === "director/a") {
          const data = await getMyNotifications();
          setNotifications(data);
          setPendingReports(data.filter(n => !n.read).length);
        }
      } catch (error) {
        console.error("Error inicial:", error);
      }
    };
    fetchInitialData();
  }, [user]);

  // 2. SOCKETS (Solo si hay usuario)
  useEffect(() => {
    if (!user?._id) return;
    socket.emit("join", user._id);

    const handleNewReport = (data) => {
      if (user.role === "estudiante") {
        setPendingReports(prev => prev + 1);
        setSnackbar({ open: true, message: "📢 Tienes un nuevo reporte disciplinario", severity: "warning" });
      }
    };

    const handleAlertReport = (data) => {
      if (user.role === "director/a") {
        setNotifications(prev => [data, ...prev]);
        setPendingReports(prev => prev + 1);
        setSnackbar({ open: true, message: data.message, severity: "error" });
        setPulse(true);
        setTimeout(() => setPulse(false), 1500);
      }
    };

    socket.on("new-report", handleNewReport);
    socket.on("alert-report", handleAlertReport);

    return () => {
      socket.off("new-report", handleNewReport);
      socket.off("alert-report", handleAlertReport);
    };
  }, [user?._id, user?.role]);

  // 3. CONTROL DE ACCESO (CORREGIDO PARA PERMITIR "/")
  useEffect(() => {
    // Si terminó de cargar, NO hay usuario, NO es una página de auth Y NO es la raíz...
    if (!loading && !user && !pathname.includes("/auth") && pathname !== "/") {
      console.log("Acceso denegado a ruta protegida. Redirigiendo...");
      router.replace("/auth/login");
    }
  }, [loading, user, router, pathname]);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleMarkAsRead = async (id, link) => {
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setPendingReports(prev => prev - 1);
      if (link) router.push(link);
    } catch (error) {
      console.error("Error marcando como leído:", error);
    }
    handleMenuClose();
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const isAuthPage = pathname.includes("/auth");

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "background.default" }}>

        {/* HEADER INSTITUCIONAL */}
        <AppBar position="sticky" elevation={1} sx={{ bgcolor: "white", borderBottom: `3px solid ${theme.palette.primary.main}`, zIndex: 1100 }}>
          <Toolbar sx={{ justifyContent: "space-between", px: { xs: 1.5, sm: 2 }, minHeight: { xs: 64, sm: 70 } }}>

            {/* LOGO Y NOMBRE */}
            <Box onClick={() => router.push("/")} sx={{ display: "flex", alignItems: "center", cursor: "pointer", gap: 1.5 }}>
              <Box sx={{ 
                p: 0.5, 
                borderRadius: "50%", 
                display: "flex", 
                border: `1px solid ${theme.palette.primary.main}`,
                backgroundColor: "#fff"
              }}>
                <Image src="/logo.png" alt="Logo C.P.M.A" width={isMobile ? 32 : 40} height={isMobile ? 32 : 40} priority style={{ borderRadius: '50%' }} />
              </Box>
              <Box>
                <Typography sx={{ 
                  fontWeight: 800, 
                  fontSize: { xs: '0.85rem', sm: '1.1rem' }, 
                  lineHeight: 1.1,
                  color: "primary.main",
                  letterSpacing: '-0.5px'
                }}>
                  María Auxiliadora
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: "text.secondary", letterSpacing: '1px' }}>
                  COLEGIO PRIVADO
                </Typography>
              </Box>
            </Box>

            {/* ACCIONES */}
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1.5 } }}>
              {loading ? (
                <Skeleton variant="circular" width={35} height={35} />
              ) : user ? (
                <>
                  <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "right", mr: 1 }}>
                    <Typography sx={{ color: "primary.main", fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase" }}>
                      {user?.role === 'administrador' ? '✨ Gestión' : '📍 Campus Virtual'}
                    </Typography>
                    <Typography sx={{ color: "#1E293B", fontWeight: 600, fontSize: "0.85rem" }}>
                      {user?.firstName || ""}
                    </Typography>
                  </Box>

                  <IconButton onClick={user.role === 'director/a' ? handleMenuOpen : () => router.push("/reportes/mis-reportes")} size="small">
                    <Badge badgeContent={user.role === 'director/a' ? unreadCount : pendingReports} color="primary">
                      <NotificationsIcon sx={{ color: "primary.main" }} />
                    </Badge>
                  </IconButton>

                  {user.role === 'director/a' && (
                    <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose} PaperProps={{ style: { maxHeight: 400, width: 300, marginTop: '10px' } }}>
                      {notifications.length === 0 && <MenuItem disabled>No hay notificaciones</MenuItem>}
                      {notifications.map(n => (
                        <MenuItem key={n._id} onClick={() => handleMarkAsRead(n._id, "/reportes")} sx={{ bgcolor: n.read ? 'white' : '#FFF5F5', mb: 0.5 }}>
                          <ListItemText primary={n.message} secondary={n.student ? `Alumno: ${n.student.firstName} ${n.student.lastName}` : null} />
                        </MenuItem>
                      ))}
                    </Menu>
                  )}

                  <Avatar sx={{ 
                    width: { xs: 35, sm: 40 }, 
                    height: { xs: 35, sm: 40 }, 
                    fontSize: "0.9rem", 
                    fontWeight: "bold", 
                    bgcolor: "primary.main",
                    border: '2px solid #fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    {user?.firstName?.charAt(0) || "?"}
                  </Avatar>

                  <IconButton onClick={logout} size="small" sx={{ color: "text.secondary", ml: 0.5, "&:hover": { color: "error.main" } }}>
                    <Logout fontSize="small" />
                  </IconButton>
                </>
              ) : (
                // Botón de ingresar solo si no estamos en la página de Login
                !isAuthPage && (
                  <Button 
                    onClick={() => router.push("/auth/login")} 
                    variant="contained" 
                    sx={{ 
                      borderRadius: 2, 
                      textTransform: 'none', 
                      fontWeight: 600,
                      boxShadow: 'none',
                      '&:hover': { boxShadow: '0 4px 12px rgba(125, 15, 21, 0.2)' }
                    }}
                  >
                    Ingresar
                  </Button>
                )
              )}
            </Box>
          </Toolbar>
        </AppBar>

        {/* CONTENIDO PRINCIPAL */}
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3, md: 4 } }}>
          <Container maxWidth="lg" disableGutters={isMobile}>
            {children}
          </Container>
        </Box>

        {/* FOOTER */}
        <Box 
          component="footer" 
          sx={{ 
            py: 4, 
            px: 2, 
            backgroundColor: "white", 
            borderTop: `3px solid ${theme.palette.primary.main}`, 
            mt: 'auto'
          }}
        >
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <IconButton 
                  component="a" 
                  href="https://www.facebook.com/cpma.mariaauxiliadora" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  sx={{ color: "primary.main", "&:hover": { color: "secondary.main" } }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1V12h3l-.5 3H13v6.8c4.56-.93 8-4.96 8-9.8z"/>
                  </svg>
                </IconButton>
                <IconButton 
                  component="a" 
                  href="https://www.instagram.com/cpma.itapua/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  sx={{ color: "primary.main", "&:hover": { color: "secondary.main" } }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
                  </svg>
                </IconButton>
              </Box>

              <Typography variant="body2" color="text.primary" sx={{ fontWeight: 700, textAlign: 'center' }}>
                COLEGIO PRIVADO MARÍA AUXILIADORA
              </Typography>

              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                © {new Date().getFullYear()} - Todos los derechos reservados
              </Typography>

              <Typography 
                variant="caption" 
                sx={{ 
                  mt: 1, 
                  color: 'text.secondary', 
                  fontStyle: 'italic',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                Desarrollado por <span style={{ fontWeight: 800, color: theme.palette.primary.main }}>Ezequiel Vargas</span>
              </Typography>
            </Box>
          </Container>
        </Box>

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
          <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>
        </Snackbar>

      </Box>

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); color: #B91C1C; }
          100% { transform: scale(1); }
        }
      `}</style>
    </ThemeProvider>
  );
}