'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TextField,
  Button,
  Grid,
  Typography,
  Box,
  Container,
  InputAdornment,
  IconButton,
  Paper,
  Snackbar,
  Alert,
  Fade,
  CircularProgress,
  MenuItem
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PersonRounded,
  EmailRounded,
  BadgeRounded,
  CalendarMonthRounded,
  AccountBalanceRounded,
  GroupRounded,
  LockRounded
} from '@mui/icons-material';
import { registerUser, getInstitutions } from '../services/api';
import Image from 'next/image';

const FormRegister = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    idNumber: '',
    birthDate: '',
    institution: '',
    role: '',
  });

  const [institutions, setInstitutions] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    getInstitutions()
      .then(setInstitutions)
      .catch(() => setErrorMsg('Error al cargar instituciones'));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      await registerUser(formData);
      setSuccessMsg('¡Cuenta creada con éxito! Redirigiendo...');
      setTimeout(() => router.push('/auth/login'), 1500);
    } catch (error) {
      const backendMessage = error?.response?.data?.message || 'Error inesperado del servidor';
      setErrorMsg(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
      <Fade in={true} timeout={800}>
        <Box>
          {/* LOGO E IDENTIDAD */}
          <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <Box sx={{ 
              p: 1.5, borderRadius: 3, 
              background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
              mb: 2, boxShadow: '0 8px 16px rgba(6, 95, 70, 0.2)'
            }}>
              <Image src="/logo.png" alt="Logo" width={35} height={35} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#065f46', letterSpacing: '-1.5px' }}>
              AulaConecta<span style={{ color: '#10b981' }}>Py</span>
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Crea tu cuenta institucional hoy mismo
            </Typography>
          </Box>

          <Paper 
            elevation={0} 
            sx={{ 
              p: { xs: 3, sm: 5 }, 
              borderRadius: 6, 
              border: '1px solid rgba(226, 232, 240, 0.8)',
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.05)'
            }}
          >
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2.5}>
                
                {/* SECCIÓN: DATOS PERSONALES */}
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Nombre" name="firstName" fullWidth required 
                    onChange={handleChange} 
                    InputProps={{ startAdornment: (<InputAdornment position="start"><PersonRounded sx={{ color: '#10b981', fontSize: 20 }} /></InputAdornment>) }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Apellido" name="lastName" fullWidth required 
                    onChange={handleChange} 
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField 
                    label="Correo Electrónico" name="email" type="email" fullWidth required 
                    onChange={handleChange} 
                    InputProps={{ startAdornment: (<InputAdornment position="start"><EmailRounded sx={{ color: '#10b981', fontSize: 20 }} /></InputAdornment>) }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                  />
                </Grid>

                {/* SECCIÓN: SEGURIDAD */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Contraseña" name="password" type={showPassword ? 'text' : 'password'}
                    fullWidth required onChange={handleChange}
                    InputProps={{
                      startAdornment: (<InputAdornment position="start"><LockRounded sx={{ color: '#10b981', fontSize: 20 }} /></InputAdornment>),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} size="small">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Repetir Contraseña" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'}
                    fullWidth required onChange={handleChange}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} size="small">
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                  />
                </Grid>

                {/* SECCIÓN: IDENTIFICACIÓN */}
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Cédula de Identidad" name="idNumber" fullWidth required 
                    onChange={handleChange} 
                    InputProps={{ startAdornment: (<InputAdornment position="start"><BadgeRounded sx={{ color: '#10b981', fontSize: 20 }} /></InputAdornment>) }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Fecha de Nacimiento" name="birthDate" type="date"
                    fullWidth required InputLabelProps={{ shrink: true }}
                    onChange={handleChange}
                    InputProps={{ startAdornment: (<InputAdornment position="start"><CalendarMonthRounded sx={{ color: '#10b981', fontSize: 20 }} /></InputAdornment>) }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                  />
                </Grid>

                {/* SECCIÓN: INSTITUCIÓN Y ROL */}
                <Grid item xs={12}>
                  <TextField
                    select label="Institución Educativa" name="institution"
                    fullWidth required onChange={handleChange}
                    value={formData.institution}
                    InputProps={{ startAdornment: (<InputAdornment position="start"><AccountBalanceRounded sx={{ color: '#10b981', fontSize: 20 }} /></InputAdornment>) }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                  >
                    <MenuItem value="" disabled>Seleccionar institución</MenuItem>
                    {institutions.map((i) => (
                      <MenuItem key={i._id} value={i._id}>{i.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    select label="¿Cuál es tu rol?" name="role"
                    fullWidth required onChange={handleChange}
                    value={formData.role}
                    InputProps={{ startAdornment: (<InputAdornment position="start"><GroupRounded sx={{ color: '#10b981', fontSize: 20 }} /></InputAdornment>) }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                  >
                    <MenuItem value="" disabled>Seleccionar rol</MenuItem>
                    <MenuItem value="padre/madre/tutor">Padre / Madre / Tutor</MenuItem>
                    <MenuItem value="docente">Docente</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Button
                    type="submit" variant="contained" fullWidth size="large"
                    disabled={loading}
                    sx={{
                      py: 1.8, borderRadius: 4, fontWeight: 800, textTransform: 'none', fontSize: '1.1rem',
                      background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
                      boxShadow: '0 10px 20px rgba(6, 95, 70, 0.2)',
                      '&:hover': { background: 'linear-gradient(135deg, #044e39 0%, #059669 100%)', transform: 'translateY(-1px)' },
                      transition: 'all 0.2s'
                    }}
                  >
                    {loading ? <CircularProgress size={26} sx={{ color: 'white' }} /> : 'Completar Registro'}
                  </Button>
                </Grid>
              </Grid>
            </form>

            <Box mt={4} textAlign="center">
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                ¿Ya tienes una cuenta?{' '}
                <Button 
                  onClick={() => router.push('/auth/login')}
                  sx={{ fontWeight: 800, color: '#065f46', textTransform: 'none', p: 0, minWidth: 'auto', ml: 0.5, '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' } }}
                >
                  Inicia sesión aquí
                </Button>
              </Typography>
            </Box>
          </Paper>

          <Box sx={{ mt: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, opacity: 0.5 }}>
             <Typography variant="caption" sx={{ fontWeight: 600 }}>
               AulaConectaPy v2.0 • Desarrollado por Ezequiel Vargas
             </Typography>
          </Box>
        </Box>
      </Fade>

      <Snackbar open={!!errorMsg} autoHideDuration={5000} onClose={() => setErrorMsg('')}>
        <Alert severity="error" variant="filled" sx={{ borderRadius: 3, fontWeight: 600 }}>{errorMsg}</Alert>
      </Snackbar>

      <Snackbar open={!!successMsg} autoHideDuration={3000}>
        <Alert severity="success" variant="filled" sx={{ borderRadius: 3, fontWeight: 600 }}>{successMsg}</Alert>
      </Snackbar>
    </Container>
  );
};

export default FormRegister;