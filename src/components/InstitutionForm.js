'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Typography,
  Snackbar,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  OutlinedInput,
} from '@mui/material';
import { useRouter } from 'next/navigation'; // Usa la API correcta
import { createInstitution, updateInstitution } from '@/services/api';
import FileUploader from '@/components/FileUploader';

const InstitutionForm = ({ existingInstitution }) => {
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [director, setDirector] = useState('');
  const [secretary, setSecretary] = useState('');
  const [grades, setGrades] = useState([]);
  const [logoUrl, setLogoUrl] = useState('');
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const router = useRouter(); // Ahora usamos el hook directamente

  useEffect(() => {
    if (existingInstitution) {
      setName(existingInstitution.name);
      setNumber(existingInstitution.number);
      setAddress(existingInstitution.address);
      setPhoneNumber(existingInstitution.phoneNumber || '');
      setDirector(existingInstitution.director || '');
      setSecretary(existingInstitution.secretary || '');
      setGrades(existingInstitution.grades || []);
      setLogoUrl(existingInstitution.logoUrl || '');
    }
  }, [existingInstitution]);

  const handleLogoUpload = (url) => {
    setLogoUrl(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !address || !number || grades.length === 0) {
      setValidationError('Los campos "Nombre", "Número", "Dirección" y "Grados" son obligatorios.');
      return;
    }
    setValidationError('');

    const institutionData = {
      name,
      number,
      address,
      phoneNumber,
      director,
      secretary,
      grades,
      logoUrl,
    };

    try {
      if (existingInstitution) {
        await updateInstitution(existingInstitution._id, institutionData);
      } else {
        await createInstitution(institutionData);
      }
      setSuccessMessage('Institución guardada con éxito.');

      // Redirigir después de guardar
      setTimeout(() => router.push('/Institution/seeInstitution'), 2000);
    } catch (err) {
      setError(err.response ? err.response.data.message : 'Hubo un error.');
    }
  };

  return (
    <Box sx={{ maxWidth: 600, margin: 'auto', mt: 5, p: 3, boxShadow: 3, borderRadius: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {existingInstitution ? 'Editar Institución' : 'Crear Institución'}
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      {validationError && <Typography color="error">{validationError}</Typography>}

      <form onSubmit={handleSubmit}>
        <TextField
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          margin="normal"
          required
          error={!name && validationError}
        />
        <TextField
          label="Número"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          fullWidth
          margin="normal"
          required
          error={!number && validationError}
        />
        <TextField
          label="Dirección"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          fullWidth
          margin="normal"
          required
          error={!address && validationError}
        />
        <TextField
          label="Teléfono"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Director/a"
          value={director}
          onChange={(e) => setDirector(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Secretaria/o"
          value={secretary}
          onChange={(e) => setSecretary(e.target.value)}
          fullWidth
          margin="normal"
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>Grados</InputLabel>
          <Select
            multiple
            value={grades}
            onChange={(e) => setGrades(e.target.value)}
            input={<OutlinedInput label="Grados" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} />
                ))}
              </Box>
            )}
            required
            error={grades.length === 0 && validationError}
          >
            {[
              '1° grado',
              '2° grado',
              '3° grado',
              '4° grado',
              '5° grado',
              '6° grado',
              '7° grado',
              '8° grado',
              '9° grado',
              '1er año',
              '2do año',
              '3er año',
            ].map((grade) => (
              <MenuItem key={grade} value={grade}>
                {grade}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FileUploader onUpload={handleLogoUpload} existingImageUrl={logoUrl} />

        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 3 }}>
          {existingInstitution ? 'Actualizar Institución' : 'Crear Institución'}
        </Button>
      </form>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
        message={successMessage}
      />
    </Box>
  );
};

export default InstitutionForm;
