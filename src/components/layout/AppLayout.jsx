'use client';

import React, { useEffect, useState } from "react";
import { 
  Box, Typography, Button, Avatar, Skeleton, Container, 
  IconButton, AppBar, Toolbar, useMediaQuery, Badge,
  Snackbar, Alert, Menu, MenuItem, ListItemText, ListItemSecondaryAction
} from "@mui/material";
import { Logout, Notifications as NotificationsIcon } from "@mui/icons-material";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useAuth } from "@/context/AuthContext";
import { getMyDisciplineReports, getMyNotifications, markAsRead } from "@/services/api";
import socket from "@/services/socket";

// NUEVA PALETA BASADA EN EL LOGO C.P.M.A.
const theme = createTheme({
  palette: {
    primary: { 
      main: "#7D0F15", // Granate Institucional
      light: "#A61D24", 
      dark: "#4A080C",
      contrastText: "#FFFFFF" 
    },
    secondary: { 
      main: "#D4AF37", // Dorado/Ocre para detalles (combinación clásica)
    },
    background: { 
      default: "#F9F7F2", // Blanco roto/Crema suave para un look más "papel/académico"
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
    borderRadius: 8 // Bordes un poco más suaves
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
  }, [user?._id]);

  useEffect(() => {
    if (!loading && !user && !pathname.includes("/auth")) {
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
      <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "background.default" }}>

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

                  {/* CAMPANAS CON COLORES AJUSTADOS */}
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
        <Box component="main" sx={{ flexGrow: 1, overflowY: "auto", p: { xs: 2, sm: 3, md: 4 } }}>
          <Container maxWidth="lg" disableGutters={isMobile}>
            {children}
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