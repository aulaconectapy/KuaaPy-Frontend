'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  MenuItem,
  Typography,
  Stack,
  CircularProgress,
  Snackbar
} from '@mui/material';

import { useAuth } from '@/context/AuthContext';
import { getMyProfile, updateMyProfile } from '@/services/api';

const StudentProfileForm = () => {

  const { user, loading: authLoading, refreshUser } = useAuth();
  const [student, setStudent] = useState({ father: {}, mother: {} });
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', success: true });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!authLoading && user?._id) {
        setLoading(true);
        try {
          console.log('Fetching profile for user:', user._id);
          const data = await getMyProfile();
          console.log('Profile data received:', data);

          setStudent({
            ...data,
            father: data.father || {},
            mother: data.mother || {}
          });
        } catch (err) {
          console.error('Error fetching profile:', err);
          setSnackbar({ open: true, message: 'Error al cargar perfil', success: false });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, [authLoading, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('father.') || name.startsWith('mother.')) {
      const [parent, field] = name.split('.');
      setStudent(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [field]: value }
      }));
    } else {
      setStudent(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { ...student };
      if (password) payload.password = password;

      console.log('Updating profile with payload:', payload);
      await updateMyProfile(payload);

      await refreshUser(); 

      setSnackbar({ open: true, message: 'Perfil actualizado correctamente', success: true });
      setPassword('');
    } catch (err) {
      console.error('Error updating profile:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Error al actualizar',
        success: false
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading || !student)
    return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 10 }} />;

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', py: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>Mi Perfil</Typography>

        {/* autoComplete="off" evita que el navegador sugiera datos generales */}
        <form onSubmit={handleSubmit} autoComplete="off">
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre"
                name="firstName"
                value={student.firstName || ''}
                onChange={handleChange}
                fullWidth
                inputProps={{ autoComplete: 'none' }} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Apellido"
                name="lastName"
                value={student.lastName || ''}
                onChange={handleChange}
                fullWidth
                inputProps={{ autoComplete: 'none' }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Sexo"
                name="sex"
                value={student.sex || ''}
                onChange={handleChange}
                select
                fullWidth
              >
                <MenuItem value="Masculino">Masculino</MenuItem>
                <MenuItem value="Femenino">Femenino</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Fecha de nacimiento"
                type="date"
                name="birthDate"
                value={student.birthDate?.split('T')[0] || ''}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* PADRE */}
            <Grid item xs={12}><Typography variant="subtitle1">Padre</Typography></Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre Padre"
                name="father.firstName"
                value={student.father?.firstName || ''}
                onChange={handleChange}
                fullWidth
                inputProps={{ autoComplete: 'none' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Teléfono Padre"
                name="father.phone"
                value={student.father?.phone || ''}
                onChange={handleChange}
                fullWidth
                inputProps={{ autoComplete: 'none' }}
              />
            </Grid>

            {/* MADRE */}
            <Grid item xs={12}><Typography variant="subtitle1">Madre</Typography></Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre Madre"
                name="mother.firstName"
                value={student.mother?.firstName || ''}
                onChange={handleChange}
                fullWidth
                inputProps={{ autoComplete: 'none' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Teléfono Madre"
                name="mother.phone"
                value={student.mother?.phone || ''}
                onChange={handleChange}
                fullWidth
                inputProps={{ autoComplete: 'none' }}
              />
            </Grid>

            {/* SALUD */}
            <Grid item xs={12}>
              <TextField
                label="Alergias"
                name="allergies"
                value={student.allergies || ''}
                onChange={handleChange}
                fullWidth
                multiline
                inputProps={{ autoComplete: 'none' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Problemas de salud"
                name="healthIssues"
                value={student.healthIssues || ''}
                onChange={handleChange}
                fullWidth
                multiline
                inputProps={{ autoComplete: 'none' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Ajustes razonables"
                name="reasonableAdjustments"
                value={student.reasonableAdjustments || ''}
                onChange={handleChange}
                fullWidth
                multiline
                inputProps={{ autoComplete: 'none' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Dirección"
                name="address"
                value={student.address || ''}
                onChange={handleChange}
                fullWidth
                inputProps={{ autoComplete: 'none' }}
              />
            </Grid>

            {/* CAMPOS BLOQUEADOS */}
            <Grid item xs={12} sm={6}>
              <TextField label="Rol" value={student.role || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Grado" value={student.grade || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Institución"
                value={student.institution?.name || ''}
                fullWidth
                disabled
              />
            </Grid>

            {/* PASSWORD */}
            <Grid item xs={12}>
              <TextField
                label="Nueva contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                helperText="Dejar vacío si no desea cambiarla"
                inputProps={{ autoComplete: 'new-password' }} // Evita que sugiera contraseñas viejas
              />
            </Grid>

          </Grid>

          <Stack sx={{ mt: 3 }}>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Actualizar Perfil'}
            </Button>
          </Stack>

        </form>

      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />

    </Box>
  );
};

export default StudentProfileForm;