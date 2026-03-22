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
import { useNotifications } from "@/context/NotificationContext"; // Importamos el contexto
import { markAsRead } from "@/services/api";

// PALETA INSTITUCIONAL C.P.M.A.
const theme = createTheme({
  palette: {
    primary: { 
      main: "#7D0F15", 
      light: "#A61D24", 
      dark: "#4A080C",
      contrastText: "#FFFFFF" 
    },
    secondary: { main: "#D4AF37" },
    background: { default: "#F9F7F2", paper: "#FFFFFF" },
    text: { primary: "#2D2D2D", secondary: "#6B7280" },
    error: { main: "#B91C1C" },
    warning: { main: "#F59E0B" },
    success: { main: "#15803D" }
  },
  typography: { 
    fontFamily: '"Inter", "Roboto", "Helvetica", sans-serif',
    h6: { fontWeight: 700 }
  },
  shape: { borderRadius: 8 }
});

export default function Layout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const isMobile = useMediaQuery("(max-width:600px)");

  // --- DATOS DEL CONTEXTO GLOBAL ---
  const { 
    pendingReports, 
    setPendingReports,
    notifications, 
    setNotifications, 
    snackbar, 
    setSnackbar 
  } = useNotifications();

  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const [pulse, setPulse] = useState(false);

  // Efecto visual de pulso cuando llega una notificación (opcional)
  useEffect(() => {
    if (pendingReports > 0 && user?.role === "director/a") {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [pendingReports, user?.role]);

  // CONTROL DE ACCESO
  useEffect(() => {
    if (!loading && !user && !pathname.includes("/auth") && pathname !== "/") {
      router.replace("/auth/login");
    }
  }, [loading, user, router, pathname]);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleMarkAsRead = async (id, link) => {
    try {
      await markAsRead(id);
      // Actualizamos el estado global desde aquí
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setPendingReports(prev => Math.max(0, prev - 1));
      if (link) router.push(link);
    } catch (error) {
      console.error("Error marcando como leído:", error);
    }
    handleMenuClose();
  };

  const isAuthPage = pathname.includes("/auth");
const unreadCount = Array.isArray(notifications) 
  ? notifications.filter(n => !n.read).length 
  : 0;
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "background.default" }}>

        <AppBar position="sticky" elevation={1} sx={{ bgcolor: "white", borderBottom: `3px solid ${theme.palette.primary.main}`, zIndex: 1100 }}>
          <Toolbar sx={{ justifyContent: "space-between", px: { xs: 1.5, sm: 2 }, minHeight: { xs: 64, sm: 70 } }}>

            {/* LOGO */}
            <Box onClick={() => router.push("/")} sx={{ display: "flex", alignItems: "center", cursor: "pointer", gap: 1.5 }}>
              <Box sx={{ p: 0.5, borderRadius: "50%", display: "flex", border: `1px solid ${theme.palette.primary.main}`, backgroundColor: "#fff" }}>
                <Image src="/logo.png" alt="Logo C.P.M.A" width={isMobile ? 32 : 40} height={isMobile ? 32 : 40} priority style={{ borderRadius: '50%' }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.85rem', sm: '1.1rem' }, color: "primary.main", letterSpacing: '-0.5px' }}>
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

                  <IconButton 
                    onClick={user.role === 'director/a' ? handleMenuOpen : () => router.push("/reportes/mis-reportes")} 
                    size="small"
                    sx={{ animation: pulse ? 'pulse 1.5s infinite' : 'none' }}
                  >
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

                  <Avatar sx={{ width: { xs: 35, sm: 40 }, height: { xs: 35, sm: 40 }, bgcolor: "primary.main", border: '2px solid #fff' }}>
                    {user?.firstName?.charAt(0) || "?"}
                  </Avatar>

                  <IconButton onClick={logout} size="small" sx={{ color: "text.secondary", ml: 0.5 }}>
                    <Logout fontSize="small" />
                  </IconButton>
                </>
              ) : (
                !isAuthPage && (
                  <Button onClick={() => router.push("/auth/login")} variant="contained" sx={{ textTransform: 'none', fontWeight: 600 }}>
                    Ingresar
                  </Button>
                )
              )}
            </Box>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3, md: 4 } }}>
          <Container maxWidth="lg" disableGutters={isMobile}>
            {children}
          </Container>
        </Box>

        {/* FOOTER */}
        <Box component="footer" sx={{ py: 4, px: 2, backgroundColor: "white", borderTop: `3px solid ${theme.palette.primary.main}`, mt: 'auto' }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>COLEGIO PRIVADO MARÍA AUXILIADORA</Typography>
              <Typography variant="caption" color="text.secondary">
                © {new Date().getFullYear()} - Desarrollado por Ezequiel Vargas
              </Typography>
            </Box>
          </Container>
        </Box>

        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={4000} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
            {snackbar.message}
          </Alert>
        </Snackbar>

      </Box>

      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
    </ThemeProvider>
  );
}