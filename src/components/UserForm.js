'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControlLabel,
  Switch,
  CircularProgress,
  Typography
} from '@mui/material';

import {
  getUserById,
  updateUser,
  updateMyUser, // 🔹 NUEVO: función para autoeditarse
  createUser,
  getInstitutions
} from '@/services/api';

const GRADES = [
  '1° grado','2° grado','3° grado','4° grado','5° grado',
  '6° grado','7° grado','8° grado','9° grado',
  '1er año','2do año','3er año'
];

const ALL_ROLES = [
  'padre/madre/tutor',
  'docente',
  'director/a',
  'administrador',
  'estudiante',
  'secretario/a'
];

const UserForm = ({ userId, onSuccess }) => {
  const { user: currentUser, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    idNumber: '',
    birthDate: '',
    phoneNumber: '',
    grades: [],
    institution: '',
    isActive: true,
    role: 'docente'
  });

  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (authLoading) return <CircularProgress />;

  // 🔹 Cargar instituciones
  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        const data = await getInstitutions();

        // Si es director/a o secretario/a, filtra solo su institución
        if (['director/a', 'secretario/a'].includes(currentUser.role.toLowerCase())) {
          const myInst = data.find(inst => inst._id === currentUser.institution?._id);
          setInstitutions(myInst ? [myInst] : []);
          setFormData(prev => ({ ...prev, institution: myInst?._id || '' }));
        } else {
          setInstitutions(data);
        }
      } catch (err) {
        console.error(err);
        setError('Error al cargar instituciones');
      }
    };
    loadInstitutions();
  }, [currentUser]);

  // 🔹 Cargar usuario si es edición
  useEffect(() => {
    if (!userId) return;
    const loadUser = async () => {
      setLoading(true);
      try {
        const res = await getUserById(userId);
        setFormData({
          firstName: res.firstName || '',
          lastName: res.lastName || '',
          email: res.email || '',
          password: '',
          idNumber: res.idNumber || '',
          birthDate: res.birthDate?.slice(0,10) || '',
          phoneNumber: res.phoneNumber || '',
          grades: res.grades || [],
          institution: res.institution?._id || currentUser.institution?._id || '',
          isActive: res.isActive,
          role: res.role
        });
      } catch (err) {
        console.error(err);
        setError('Error al cargar usuario');
      }
      setLoading(false);
    };
    loadUser();
  }, [userId, currentUser]);

  // 🔹 Cambios en inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'institution') {
      setFormData(prev => ({
        ...prev,
        grades: []
      }));
    }
  };

  const handleGradesChange = (e) => {
    setFormData(prev => ({
      ...prev,
      grades: e.target.value
    }));
  };

  const institutionGrades =
    institutions.find(inst => inst._id === formData.institution)?.grades || GRADES;

  // 🔹 Roles que puede asignar el usuario actual (sin estudiante)
  const getAssignableRoles = () => {
    if (!currentUser) return [];
    const role = currentUser.role.toLowerCase();

    if (role === 'administrador') return ALL_ROLES.filter(r => r !== 'estudiante');
    if (role === 'director/a')
      return ALL_ROLES.filter(r => r !== 'administrador' && r !== 'director/a' && r !== 'estudiante');
    if (role === 'secretario/a')
      return ALL_ROLES.filter(r => r !== 'administrador' && r !== 'director/a' && r !== 'secretario/a' && r !== 'estudiante');
    return [];
  };

  const isInstitutionLocked = ['director/a', 'secretario/a'].includes(currentUser.role.toLowerCase());

  // 🔹 Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (
      (formData.role === 'docente' ||
        formData.role === 'director/a' ||
        formData.role === 'secretario/a') &&
      !formData.institution
    ) {
      setError('Debes seleccionar una institución');
      setLoading(false);
      return;
    }

    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password;

      // 🔹 Si es autoeditarse, usar updateMyUser
      if (userId === currentUser._id) {
        await updateMyUser(payload);
      } else if (userId) {
        await updateUser(userId, payload);
      } else {
        await createUser(payload);
      }

      onSuccess();

    } catch (err) {
      console.error(err);
      setError('Error al guardar usuario');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

      <Grid container spacing={2}>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Nombre"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            fullWidth
            required
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Apellido"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            fullWidth
            required
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            required
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Contraseña"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            fullWidth
            helperText={userId ? "Dejar en blanco si no quieres cambiarla" : ""}
            required={!userId}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Cédula"
            name="idNumber"
            value={formData.idNumber}
            onChange={handleChange}
            fullWidth
            required
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Fecha de nacimiento"
            name="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Teléfono"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            fullWidth
          />
        </Grid>

        {getAssignableRoles().length > 0 && (
          <Grid item xs={12}>
            <TextField
              select
              label="Rol"
              name="role"
              value={formData.role}
              onChange={handleChange}
              fullWidth
            >
              {getAssignableRoles().map(role => (
                <MenuItem key={role} value={role}>{role}</MenuItem>
              ))}
            </TextField>
          </Grid>
        )}

        {(formData.role === 'docente' ||
          formData.role === 'director/a' ||
          formData.role === 'secretario/a') && (
          <Grid item xs={12}>
            <TextField
              select
              label="Institución"
              name="institution"
              value={formData.institution}
              onChange={handleChange}
              fullWidth
              disabled={isInstitutionLocked} // 🔹 Bloqueada para director/a y secretario/a
            >
              {institutions.map(inst => (
                <MenuItem key={inst._id} value={inst._id}>{inst.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
        )}

        {formData.role === 'docente' && (
          <Grid item xs={12}>
            <TextField
              select
              label="Grados"
              value={formData.grades}
              onChange={handleGradesChange}
              SelectProps={{ multiple: true }}
              fullWidth
            >
              {institutionGrades.map(grade => (
                <MenuItem key={grade} value={grade}>{grade}</MenuItem>
              ))}
            </TextField>
          </Grid>
        )}

        <Grid item xs={12}>
          <FormControlLabel
            control={<Switch checked={formData.isActive} onChange={handleChange} name="isActive" />}
            label="Activo"
            disabled={userId === currentUser._id} // 🔹 No puede cambiar su propio estado
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : (userId ? 'Actualizar Usuario' : 'Crear Usuario')}
          </Button>
        </Grid>

      </Grid>
    </form>
  );
};

export default UserForm;