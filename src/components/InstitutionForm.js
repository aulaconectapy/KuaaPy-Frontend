'use client';

import React, { useState, useEffect } from 'react';
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
  Paper,
  Stack,
  Avatar,
  Container,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  School,
  Save,
  ArrowBack,
  LocationOn,
  Phone,
  Person,
  Badge,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
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
  
  // Cambiamos 'error' para que pueda manejar un string o una lista de errores
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState([]);
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const router = useRouter();

  useEffect(() => {
    if (existingInstitution) {
      setName(existingInstitution.name || '');
      setNumber(existingInstitution.number || '');
      setAddress(existingInstitution.address || '');
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
      setValidationError('Los campos Nombre, Número, Dirección y Grados son obligatorios.');
      return;
    }

    setValidationError('');
    setError(null);
    setErrorDetails([]);

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
      setTimeout(() => router.push('/Institution/seeInstitution'), 1800);
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Hubo un error al guardar la institución.');
        // Si el backend envía un array de errores específicos, los guardamos
        if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
          setErrorDetails(err.response.data.errors);
        } else if (err.response.data.details) {
          // Si envía el objeto de Mongoose { field: { message: '...' } }
          const formattedDetails = Object.values(err.response.data.details).map(d => d.message);
          setErrorDetails(formattedDetails);
        }
      } else {
        setError('Hubo un error de conexión con el servidor.');
      }
    }
  };

  const inputStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 3,
      backgroundColor: '#FFFFFF',
      '&:hover fieldset': {
        borderColor: '#0038A8',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#0038A8',
      },
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#0038A8',
    },
  };

  const gradesList = [
    '1° grado', '2° grado', '3° grado', '4° grado', '5° grado',
    '6° grado', '7° grado', '8° grado', '9° grado', '1er año', 
    '2do año', '3er año',
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 5,
        background: 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 45%, #FFF1F2 100%)',
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            borderRadius: 5,
            overflow: 'hidden',
            border: '1px solid #DBEAFE',
            boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)',
          }}
        >
          <Box
            sx={{
              height: 10,
              background: 'linear-gradient(90deg, #D90429 0%, #FFFFFF 50%, #0038A8 100%)',
            }}
          />

          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              sx={{ mb: 3 }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    width: 68,
                    height: 68,
                    bgcolor: '#0038A8',
                    boxShadow: '0 12px 25px rgba(0, 56, 168, 0.25)',
                  }}
                >
                  <School sx={{ fontSize: 38 }} />
                </Avatar>

                <Box>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 900, color: '#102A43', lineHeight: 1.1 }}
                  >
                    {existingInstitution ? 'Editar Institución' : 'Crear Institución'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
                    Registro de datos institucionales del centro educativo.
                  </Typography>
                </Box>
              </Stack>

              <Button
                startIcon={<ArrowBack />}
                onClick={() => router.push('/Institution/seeInstitution')}
                sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 800, color: '#0038A8' }}
              >
                Volver
              </Button>
            </Stack>

            <Divider sx={{ mb: 3, borderStyle: 'dashed' }} />

            {/* Alerta de Error Principal y Detalles Específicos */}
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {error}
                </Typography>
                {errorDetails.length > 0 && (
                  <List dense sx={{ mt: 1, pl: 2 }}>
                    {errorDetails.map((detail, index) => (
                      <ListItem key={index} sx={{ listStyleType: 'disc', display: 'list-item', p: 0 }}>
                        <ListItemText primary={<Typography variant="body2">{detail}</Typography>} />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Alert>
            )}

            {validationError && (
              <Alert severity="warning" sx={{ mb: 2, borderRadius: 3 }}>
                {validationError}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={2.2}>
                <TextField
                  label="Nombre de la institución"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  required
                  sx={inputStyle}
                  InputProps={{
                    startAdornment: <School sx={{ color: '#0038A8', mr: 1 }} />,
                  }}
                />

                <TextField
                  label="Número de institución"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  fullWidth
                  required
                  sx={inputStyle}
                  InputProps={{
                    startAdornment: <Badge sx={{ color: '#D90429', mr: 1 }} />,
                  }}
                />

                <TextField
                  label="Dirección"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  fullWidth
                  required
                  sx={inputStyle}
                  InputProps={{
                    startAdornment: <LocationOn sx={{ color: '#0038A8', mr: 1 }} />,
                  }}
                />

                <TextField
                  label="Teléfono"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  fullWidth
                  sx={inputStyle}
                  InputProps={{
                    startAdornment: <Phone sx={{ color: '#D90429', mr: 1 }} />,
                  }}
                />

                <TextField
                  label="Director/a"
                  value={director}
                  onChange={(e) => setDirector(e.target.value)}
                  fullWidth
                  sx={inputStyle}
                  InputProps={{
                    startAdornment: <Person sx={{ color: '#0038A8', mr: 1 }} />,
                  }}
                />

                <TextField
                  label="Secretaria/o"
                  value={secretary}
                  onChange={(e) => setSecretary(e.target.value)}
                  fullWidth
                  sx={inputStyle}
                  InputProps={{
                    startAdornment: <Person sx={{ color: '#D90429', mr: 1 }} />,
                  }}
                />

                <FormControl fullWidth>
                  <InputLabel>Grados habilitados</InputLabel>
                  <Select
                    multiple
                    value={grades}
                    onChange={(e) => setGrades(e.target.value)}
                    input={<OutlinedInput label="Grados habilitados" />}
                    sx={{
                      borderRadius: 3,
                      backgroundColor: '#FFFFFF',
                    }}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.7 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={value}
                            sx={{
                              borderRadius: 2,
                              fontWeight: 800,
                              bgcolor: '#EFF6FF',
                              color: '#0038A8',
                              border: '1px solid #BFDBFE',
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {gradesList.map((grade) => (
                      <MenuItem key={grade} value={grade}>
                        {grade}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 4,
                    border: '1px dashed #CBD5E1',
                    bgcolor: '#F8FAFC',
                  }}
                >
                  <Typography sx={{ fontWeight: 800, color: '#334155', mb: 1 }}>
                    Logo institucional
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
                    Podés subir el escudo o logo de la institución.
                  </Typography>
                  <FileUploader onUpload={handleLogoUpload} existingImageUrl={logoUrl} />
                </Paper>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  startIcon={<Save />}
                  sx={{
                    mt: 2,
                    py: 1.4,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 900,
                    fontSize: '1rem',
                    bgcolor: '#D90429',
                    boxShadow: '0 12px 25px rgba(217, 4, 41, 0.25)',
                    '&:hover': {
                      bgcolor: '#B80024',
                    },
                  }}
                >
                  {existingInstitution ? 'Actualizar Institución' : 'Crear Institución'}
                </Button>
              </Stack>
            </form>
          </Box>
        </Paper>

        <Snackbar
          open={!!successMessage}
          autoHideDuration={3000}
          onClose={() => setSuccessMessage('')}
          message={successMessage}
        />
      </Container>
    </Box>
  );
};

export_default = InstitutionForm; // Mantén tu export default habitual