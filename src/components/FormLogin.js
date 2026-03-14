'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TextField, Button, Typography, Box, Container, Grid, Link,
  InputAdornment, IconButton, Alert, Fade, CircularProgress, Paper
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  BadgeRounded, 
  LockOpenRounded 
} from '@mui/icons-material';
import { loginUser } from '@/services/api';
import Image from 'next/image';

const FormLogin = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    idNumber: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // IDENTIDAD INSTITUCIONAL
  const COLORS = {
    primary: "#7D0F15", // Granate C.P.M.A
    primaryDark: "#5a0b0f",
    bgLight: "#F8FAFC"
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await loginUser(formData);
      localStorage.setItem('token', response.token);
      window.dispatchEvent(new Event('auth-change'));
      router.replace('/dashboard');
    } catch (err) {
      setError('Cédula o contraseña incorrectos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      bgcolor: COLORS.bgLight,
      backgroundImage: 'radial-gradient(#7D0F15 0.5px, transparent 0.5px)', // Patrón sutil
      backgroundSize: '30px 30px',
      backgroundOpacity: 0.05
    }}>
      <Container component="main" maxWidth="xs">
        <Fade in={true} timeout={800}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            <Paper
              elevation={0}
              sx={{
                width: '100%',
                p: { xs: 4, sm: 5 },
                borderRadius: 8,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
                border: '1px solid #E2E8F0',
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                textAlign: 'center'
              }}
            >
              {/* LOGO INSTITUCIONAL */}
              <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ 
                  mb: 2,
                  position: 'relative',
                  width: 100,
                  height: 100,
                  transition: 'transform 0.3s ease',
                  '&:hover': { transform: 'scale(1.05)' }
                }}>
                  {/* Asegúrate de que logo.png sea el granate que subiste */}
                  <Image src="/logo.png" alt="C.P.M.A Logo" fill style={{ objectFit: 'contain' }} priority />
                </Box>
                
                <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.primary, letterSpacing: '-0.5px', textTransform: 'uppercase' }}>
                  Gestión Académica
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  C.P. María Auxiliadora
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 3, fontWeight: 500, fontSize: '0.85rem' }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <Grid container spacing={2.5}>
                  <Grid item xs={12}>
                    <TextField
                      label="Número de Cédula"
                      fullWidth
                      name="idNumber"
                      autoFocus
                      value={formData.idNumber}
                      onChange={handleChange}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BadgeRounded sx={{ color: COLORS.primary }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': { 
                          borderRadius: 4,
                          bgcolor: '#fff'
                        } 
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Contraseña"
                      fullWidth
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOpenRounded sx={{ color: COLORS.primary }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': { 
                          borderRadius: 4,
                          bgcolor: '#fff'
                        } 
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      fullWidth
                      size="large"
                      variant="contained"
                      disabled={loading}
                      sx={{
                        py: 2,
                        borderRadius: 4,
                        fontWeight: 800,
                        fontSize: '1rem',
                        textTransform: 'none',
                        bgcolor: COLORS.primary,
                        boxShadow: `0 10px 20px ${COLORS.primary}30`,
                        '&:hover': {
                          bgcolor: COLORS.primaryDark,
                          transform: 'translateY(-1px)',
                          boxShadow: `0 12px 25px ${COLORS.primary}40`,
                        },
                        transition: 'all 0.2s'
                      }}
                    >
                      {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Acceder al Sistema'}
                    </Button>
                  </Grid>
                </Grid>
              </form>

              <Box mt={4}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  ¿Problemas con su acceso?
                </Typography>
<Link
  component="button"
  variant="body2"
  onClick={() => {
    const phone = "595986346921"; 
    const message = encodeURIComponent(
      "Hola, estoy escribiendo porque tengo un problema de inicio de sesión en el sistema del CPMA María Auxiliadora."
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  }}
  sx={{ 
    fontWeight: 700, 
    color: COLORS.primary, 
    textDecoration: 'none',
    mt: 1,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.5,
    '&:hover': { textDecoration: 'underline' }
  }}
>
  Contactar con soporte del sistema
</Link>
              </Box>
            </Paper>

            <Typography variant="caption" sx={{ mt: 4, color: 'text.disabled', fontWeight: 600 }}>
              © {new Date().getFullYear()} Colegio Privado María Auxiliadora
            </Typography>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default FormLogin;