'use client'

import React, { useState, useEffect } from 'react';
import { getInstitutions, deleteInstitution } from '@/services/api';
import {
  Typography,
  Box,
  Paper,
  CircularProgress,
  Button,
  IconButton,
  Divider,
  Grid,
  Avatar,
  Collapse,
  Stack,
  Container,
  Chip
} from '@mui/material';
import { 
  Edit, Delete, School, ExpandMore, ExpandLess, 
  LocationOn, Phone, Person, Badge, ArrowBack 
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
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <CircularProgress thickness={5} sx={{ color: '#1A365D' }} />
    </Box>
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* HEADER */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#1A365D', letterSpacing: '-0.02em' }}>
            Instituciones
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Gestiona los centros educativos vinculados a la red.
          </Typography>
        </Box>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => router.push('/dashboard')}
          sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
        >
          Volver
        </Button>
      </Stack>

      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#FFF5F5', color: '#C53030', border: '1px solid #FEB2B2' }}>
          {error}
        </Paper>
      )}

      {/* LISTA DE TARJETAS */}
      {institutions.map((inst, index) => (
        <Paper
          key={inst._id}
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: 4,
            border: '1px solid #E2E8F0',
            transition: '0.3s',
            overflow: 'hidden',
            '&:hover': { borderColor: '#3182CE', boxShadow: '0 10px 20px rgba(0,0,0,0.02)' }
          }}
        >
          <Box sx={{ p: 3 }}>
            <Stack direction="row" spacing={3} alignItems="center">
              <Avatar
                src={inst.logoUrl}
                sx={{ 
                  width: 70, 
                  height: 70, 
                  borderRadius: 3, 
                  bgcolor: '#F1F5F9',
                  border: '1px solid #E2E8F0'
                }}
              >
                <School sx={{ fontSize: 35, color: '#94A3B8' }} />
              </Avatar>

              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B' }}>
                  {inst.name}
                </Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: '#64748B' }}>
                    <LocationOn sx={{ fontSize: 16 }} />
                    <Typography variant="caption">{inst.address}</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: '#64748B' }}>
                    <Phone sx={{ fontSize: 16 }} />
                    <Typography variant="caption">{inst.phoneNumber || 'S/N'}</Typography>
                  </Stack>
                </Stack>
              </Box>

              <IconButton 
                onClick={() => toggleDetails(index)}
                sx={{ bgcolor: expandedIndex === index ? '#1A365D' : '#F8FAFC', color: expandedIndex === index ? 'white' : 'inherit' }}
              >
                {expandedIndex === index ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Stack>

            <Collapse in={expandedIndex === index} timeout="auto" unmountOnExit>
              <Divider sx={{ my: 3, borderStyle: 'dashed' }} />
              
              <Grid container spacing={3} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Director/a</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Person sx={{ fontSize: 18, color: '#3182CE' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{inst.director || 'No asignado'}</Typography>
                    </Stack>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Registro N°</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Badge sx={{ fontSize: 18, color: '#3182CE' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{inst.number || '---'}</Typography>
                    </Stack>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Secretaría</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{inst.secretary || 'No asignado'}</Typography>
                  </Stack>
                </Grid>
              </Grid>

              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', display: 'block', mb: 1 }}>Grados Habilitados</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {inst.grades.map((grade) => (
                    <Chip key={grade} label={grade} size="small" sx={{ borderRadius: 2, fontWeight: 600, bgcolor: '#EBF8FF', color: '#2B6CB0' }} />
                  ))}
                </Box>
              </Box>

              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<Edit />} 
                  onClick={() => handleEdit(inst._id)}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                >
                  Editar
                </Button>
                <Button 
                  variant="outlined" 
                  size="small" 
                  color="error" 
                  startIcon={<Delete />} 
                  onClick={() => handleDelete(inst._id)}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                >
                  Eliminar
                </Button>
              </Stack>
            </Collapse>
          </Box>
        </Paper>
      ))}

      {institutions.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <School sx={{ fontSize: 60, color: '#E2E8F0', mb: 2 }} />
          <Typography color="text.secondary">No hay instituciones registradas actualmente.</Typography>
        </Box>
      )}
    </Container>
  );
};

export default SeeInstitution;