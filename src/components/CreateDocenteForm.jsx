'use client';

import { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Grid,
  MenuItem,
  CircularProgress,
  Typography
} from '@mui/material';

import { createDocente, getInstitutions } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const GRADES = [
  '1° grado','2° grado','3° grado','4° grado','5° grado',
  '6° grado','7° grado','8° grado','9° grado',
  '1er año','2do año','3er año'
];

const CreateDocenteForm = ({ onSuccess }) => {
  const { user: currentUser } = useAuth();

  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    idNumber: '',
    birthDate: '',
    phoneNumber: '',
    institution: '',
    grades: [],
  });

  // 🔹 Cargar instituciones
  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        const data = await getInstitutions();
        setInstitutions(data);

        // Si es director o secretario, fijar su institución
        if (
          currentUser?.role === 'director/a' ||
          currentUser?.role === 'secretario/a'
        ) {
          setFormData(prev => ({
            ...prev,
            institution: currentUser.institution?._id
          }));
        }

      } catch {
        setError('Error al cargar instituciones');
      }
    };

    loadInstitutions();
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGradesChange = (e) => {
    setFormData(prev => ({
      ...prev,
      grades: e.target.value
    }));
  };

  const institutionGrades =
    institutions.find(inst => inst._id === formData.institution)?.grades || GRADES;

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    await createDocente({
      ...formData,
      role: 'docente', // 👈 AGREGAR ESTO
    });

    onSuccess();
  } catch (err) {
    console.error(err.response?.data); // 👈 AGREGA ESTO
    setError(err.response?.data?.message || 'Error al crear docente');
  } finally {
    setLoading(false);
  }
};

  return (
    <form onSubmit={handleSubmit}>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

      <Grid container spacing={2}>

        <Grid item xs={12} sm={6}>
          <TextField label="Nombre" name="firstName" fullWidth required onChange={handleChange} />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField label="Apellido" name="lastName" fullWidth required onChange={handleChange} />
        </Grid>

        <Grid item xs={12}>
          <TextField label="Cédula" name="idNumber" fullWidth required onChange={handleChange} />
        </Grid>

        <Grid item xs={12}>
          <TextField label="Email" name="email" type="email" fullWidth required onChange={handleChange} />
        </Grid>

        <Grid item xs={12}>
          <TextField label="Contraseña" name="password" type="password" fullWidth required onChange={handleChange} />
        </Grid>

        <Grid item xs={12}>
          <TextField
            type="date"
            name="birthDate"
            label="Fecha de nacimiento"
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField label="Teléfono" name="phoneNumber" fullWidth onChange={handleChange} />
        </Grid>

        {/* Institución */}
        <Grid item xs={12}>
          <TextField
            select
            label="Institución"
            name="institution"
            value={formData.institution}
            fullWidth
            required
            disabled={
              currentUser?.role === 'director/a' ||
              currentUser?.role === 'secretario/a'
            }
            onChange={handleChange}
          >
            {institutions.map(inst => (
              <MenuItem key={inst._id} value={inst._id}>
                {inst.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Grados */}
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
              <MenuItem key={grade} value={grade}>
                {grade}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <Button type="submit" variant="contained" fullWidth disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Crear Docente'}
          </Button>
        </Grid>

      </Grid>
    </form>
  );
};

export default CreateDocenteForm;