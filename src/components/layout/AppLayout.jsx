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
import { useNotifications } from "@/context/NotificationContext";
import { markAsRead } from "@/services/api";

// PALETA INSTITUCIONAL KUAAPY
const theme = createTheme({
  palette: {
    primary: { 
      main: "#0038A8", 
      light: "#2563EB", 
      dark: "#002270",
      contrastText: "#FFFFFF" 
    },
    secondary: { main: "#D52B1E" },
    background: { default: "#F8FAFC", paper: "#FFFFFF" },
    text: { primary: "#0F172A", secondary: "#475569" },
    error: { main: "#D52B1E" },
    warning: { main: "#F59E0B" },
    success: { main: "#059669" }
  },
  typography: { 
    fontFamily: '"Inter", "Roboto", "Helvetica", sans-serif',
    h6: { fontWeight: 700 }
  },
  shape: { borderRadius: 12 }
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

  // Efecto visual de pulso cuando llega una notificación
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

        {/* ENCABEZADO */}
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: "rgba(255,255,255,0.92)", color: "text.primary", backdropFilter: "blur(16px)", borderBottom: `1px solid #E2E8F0`, zIndex: 1100 }}>
          <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, sm: 3 }, minHeight: { xs: 70, sm: 80 } }}>

            {/* LOGO Y MARCA */}
            <Box onClick={() => router.push(user ? "/dashboard" : "/")} sx={{ display: "flex", alignItems: "center", cursor: "pointer", gap: 1.5 }}>
              <Box sx={{ p: 0.5, borderRadius: "12px", display: "flex", bgcolor: "#EFF6FF", border: `1px solid #DBEAFE` }}>
                <Image src="/logo.png" alt="Logo KuaaPy" width={isMobile ? 32 : 38} height={isMobile ? 32 : 38} priority style={{ borderRadius: '8px', objectFit: 'contain' }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.1rem', sm: '1.3rem' }, color: "text.primary", letterSpacing: '-0.03em' }}>
                  Kuaa<span style={{ color: "#D52B1E" }}>Py</span>
                </Typography>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: "text.secondary", letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Gestión Escolar
                </Typography>
              </Box>
            </Box>

            {/* ACCIONES DE USUARIO */}
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 } }}>
              {loading ? (
                <Skeleton variant="circular" width={40} height={40} />
              ) : user ? (
                <>
                  <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "right", mr: 1 }}>
                    <Typography sx={{ color: "primary.main", fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: '0.05em' }}>
                      {user?.role === 'administrador' ? '✨ Panel de Gestión' : '📍 Campus Docente'}
                    </Typography>
                    <Typography sx={{ color: "text.primary", fontWeight: 700, fontSize: "0.9rem" }}>
                      {user?.firstName || ""}
                    </Typography>
                  </Box>

                  <IconButton 
                    onClick={user.role === 'director/a' ? handleMenuOpen : () => router.push("/reportes/mis-reportes")} 
                    size="small"
                    sx={{ bgcolor: '#F1F5F9', p: 1, animation: pulse ? 'pulse 1.5s infinite' : 'none' }}
                  >
                    <Badge badgeContent={user.role === 'director/a' ? unreadCount : pendingReports} color="error">
                      <NotificationsIcon sx={{ color: "primary.main", fontSize: 20 }} />
                    </Badge>
                  </IconButton>

                  {user.role === 'director/a' && (
                    <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose} PaperProps={{ style: { maxHeight: 400, width: 320, marginTop: '10px', borderRadius: '16px' } }}>
                      {notifications.length === 0 && <MenuItem disabled>No hay notificaciones nuevas</MenuItem>}
                      {notifications.map(n => (
                        <MenuItem key={n._id} onClick={() => handleMarkAsRead(n._id, "/reportes")} sx={{ bgcolor: n.read ? 'white' : '#F8FAFC', mb: 0.5, borderBottom: '1px solid #F1F5F9' }}>
                          <ListItemText primary={n.message} secondary={n.student ? `Alumno: ${n.student.firstName} ${n.student.lastName}` : null} />
                        </MenuItem>
                      ))}
                    </Menu>
                  )}

                  <Avatar sx={{ width: { xs: 38, sm: 42 }, height: { xs: 38, sm: 42 }, bgcolor: "primary.main", fontWeight: 800, fontSize: '1rem', boxShadow: '0 4px 12px rgba(0,56,168,0.2)' }}>
                    {user?.firstName?.charAt(0) || "?"}
                  </Avatar>

                  <IconButton onClick={logout} size="small" sx={{ color: "text.secondary", bgcolor: '#F1F5F9', p: 1, ml: 0.5, '&:hover': { bgcolor: '#FEE2E2', color: '#B91C1C' } }}>
                    <Logout fontSize="small" />
                  </IconButton>
                </>
              ) : (
                !isAuthPage && (
                  <Button onClick={() => router.push("/auth/login")} variant="contained" sx={{ textTransform: 'none', fontWeight: 800, borderRadius: '10px', px: 2.5, py: 1 }}>
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
        <Box component="footer" sx={{ py: 4, px: 2, backgroundColor: "white", borderTop: `1px solid #E2E8F0`, mt: 'auto' }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.8, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 800, color: "text.primary" }}>
                KUAAPY · Sistema de Gestión Escolar
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                © {new Date().getFullYear()} KuaaPy · Desarrollado por Ezequiel Vargas
              </Typography>
            </Box>
          </Container>
        </Box>

        {/* SNACKBAR DE ALERTAS */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={4000} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: '12px', fontWeight: 700 }}>
            {snackbar.message}
          </Alert>
        </Snackbar>

      </Box>

      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
      `}</style>
    </ThemeProvider>
  );
}