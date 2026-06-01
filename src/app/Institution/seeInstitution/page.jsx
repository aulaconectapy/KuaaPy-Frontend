'use client'

import React, { useState, useEffect } from 'react';
import { getInstitutions, deleteInstitution } from '@/services/api';
import {
  Typography, Box, Paper, CircularProgress, Button, IconButton,
  Divider, Grid, Avatar, Collapse, Stack, Container, Chip
} from '@mui/material';
import {
  Edit, Delete, School, ExpandMore, ExpandLess,
  LocationOn, Phone, Person, Badge, ArrowBack, Add
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

const SeeInstitution = () => {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(null);

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getInstitutions();
        setInstitutions(data);
      } catch (err) {
        setError('No se pudo cargar la información de las instituciones.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleDetails = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleEdit = (id) => router.push(`/Institution/${id}`);

  const handleCreate = () => {
    router.push('/Institution/create');
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta institución?')) return;
    try {
      await deleteInstitution(id);
      setInstitutions(institutions.filter((inst) => inst._id !== id));
    } catch (err) {
      setError('Error al intentar eliminar.');
    }
  };

  if (loading) return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '80vh',
      background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)'
    }}>
      <CircularProgress thickness={5} sx={{ color: '#D90429' }} />
    </Box>
  );

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8FAFC 0%, #E0F2FE 45%, #FFF7ED 100%)',
      py: 4
    }}>
      <Container maxWidth="md">

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            mb: 4,
            borderRadius: 5,
            border: '1px solid #DBEAFE',
            background: 'linear-gradient(135deg, #ffffff 0%, #F8FAFC 100%)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: 8,
            width: '100%',
            background: 'linear-gradient(90deg, #D90429 0%, #FFFFFF 50%, #0038A8 100%)'
          }} />

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{
                width: 64,
                height: 64,
                bgcolor: '#0038A8',
                boxShadow: '0 10px 25px rgba(0,56,168,0.25)'
              }}>
                <School sx={{ fontSize: 36 }} />
              </Avatar>

              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#102A43' }}>
                  Instituciones
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B' }}>
                  Gestión de centros educativos del sistema escolar.
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1}>
              <Button
                startIcon={<ArrowBack />}
                onClick={() => router.push('/dashboard')}
                sx={{
                  borderRadius: 3,
                  fontWeight: 800,
                  textTransform: 'none',
                  color: '#0038A8'
                }}
              >
                Volver
              </Button>

              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreate}
                sx={{
                  borderRadius: 3,
                  fontWeight: 900,
                  textTransform: 'none',
                  px: 2.5,
                  bgcolor: '#D90429',
                  boxShadow: '0 10px 20px rgba(217,4,41,0.25)',
                  '&:hover': {
                    bgcolor: '#B80024'
                  }
                }}
              >
                Crear
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {error && (
          <Paper sx={{
            p: 2,
            mb: 3,
            bgcolor: '#FFF5F5',
            color: '#C53030',
            border: '1px solid #FEB2B2',
            borderRadius: 3,
            fontWeight: 700
          }}>
            {error}
          </Paper>
        )}

        {institutions.map((inst, index) => (
          <Paper
            key={inst._id}
            elevation={0}
            sx={{
              mb: 2.5,
              borderRadius: 5,
              border: '1px solid #CBD5E1',
              transition: '0.3s',
              overflow: 'hidden',
              bgcolor: '#FFFFFF',
              '&:hover': {
                borderColor: '#0038A8',
                boxShadow: '0 14px 35px rgba(15, 23, 42, 0.08)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            <Box sx={{ p: 3 }}>
              <Stack direction="row" spacing={3} alignItems="center">
                <Avatar
                  src={inst.logoUrl}
                  sx={{
                    width: 74,
                    height: 74,
                    borderRadius: 4,
                    bgcolor: '#EFF6FF',
                    border: '2px solid #DBEAFE'
                  }}
                >
                  <School sx={{ fontSize: 38, color: '#0038A8' }} />
                </Avatar>

                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: '#1E293B' }}>
                    {inst.name}
                  </Typography>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: '#64748B' }}>
                      <LocationOn sx={{ fontSize: 16, color: '#D90429' }} />
                      <Typography variant="caption">{inst.address || 'Sin dirección'}</Typography>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: '#64748B' }}>
                      <Phone sx={{ fontSize: 16, color: '#0038A8' }} />
                      <Typography variant="caption">{inst.phoneNumber || 'S/N'}</Typography>
                    </Stack>
                  </Stack>
                </Box>

                <IconButton
                  onClick={() => toggleDetails(index)}
                  sx={{
                    bgcolor: expandedIndex === index ? '#0038A8' : '#F1F5F9',
                    color: expandedIndex === index ? 'white' : '#334155',
                    '&:hover': {
                      bgcolor: expandedIndex === index ? '#002B7A' : '#E2E8F0'
                    }
                  }}
                >
                  {expandedIndex === index ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Stack>

              <Collapse in={expandedIndex === index} timeout="auto" unmountOnExit>
                <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

                <Grid container spacing={3} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                      Director/a
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Person sx={{ fontSize: 18, color: '#D90429' }} />
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {inst.director || 'No asignado'}
                      </Typography>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                      Registro N°
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Badge sx={{ fontSize: 18, color: '#0038A8' }} />
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {inst.number || '---'}
                      </Typography>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                      Secretaría
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {inst.secretary || 'No asignado'}
                    </Typography>
                  </Grid>
                </Grid>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" sx={{
                    fontWeight: 800,
                    color: '#94A3B8',
                    textTransform: 'uppercase',
                    display: 'block',
                    mb: 1
                  }}>
                    Grados habilitados
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {(inst.grades || []).map((grade) => (
                      <Chip
                        key={grade}
                        label={grade}
                        size="small"
                        sx={{
                          borderRadius: 2,
                          fontWeight: 800,
                          bgcolor: '#EFF6FF',
                          color: '#0038A8',
                          border: '1px solid #BFDBFE'
                        }}
                      />
                    ))}
                  </Box>
                </Box>

                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => handleEdit(inst._id)}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 800,
                      borderColor: '#0038A8',
                      color: '#0038A8'
                    }}
                  >
                    Editar
                  </Button>

                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => handleDelete(inst._id)}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 800
                    }}
                  >
                    Eliminar
                  </Button>
                </Stack>
              </Collapse>
            </Box>
          </Paper>
        ))}

        {institutions.length === 0 && !loading && (
          <Paper sx={{
            textAlign: 'center',
            py: 10,
            borderRadius: 5,
            border: '1px dashed #CBD5E1',
            bgcolor: '#FFFFFF'
          }}>
            <School sx={{ fontSize: 70, color: '#CBD5E1', mb: 2 }} />
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              No hay instituciones registradas actualmente.
            </Typography>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreate}
              sx={{
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 900,
                bgcolor: '#D90429',
                '&:hover': { bgcolor: '#B80024' }
              }}
            >
              Crear institución
            </Button>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default SeeInstitution;