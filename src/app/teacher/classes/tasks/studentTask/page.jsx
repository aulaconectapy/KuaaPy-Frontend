'use client';

import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Grid, Card, CardContent, 
  Chip, Box, LinearProgress, Divider, Alert, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { useAuth } from '@/context/AuthContext';
import { getMyTasks } from '@/services/api';

const StudentTasksPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // 📊 Estadísticas automáticas
  const stats = {
    total: tasks.length,
    pendientes: tasks.filter(t => t.status === 'pendiente').length,
    corregidas: tasks.filter(t => t.status === 'corregido').length,
    puntosTotales: tasks.reduce((acc, t) => acc + (t.score || 0), 0)
  };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await getMyTasks();
        // Aseguramos que cada tarea tenga task y indicators
        const filteredData = data.map(st => ({
          ...st,
          task: {
            ...st.task,
            subject: st.task?.subject || 'Sin materia',
            topic: st.task?.topic || 'Sin tema',
            dueDate: st.task?.dueDate || null,
            indicators: st.task?.indicators || [] // 🔹 incluimos indicadores
          },
          indicatorScores: st.indicatorScores || []
        }));
        setTasks(filteredData);
      } catch (error) {
        console.error("Error al cargar tareas:", error.response?.data || error.message || error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchTasks();
  }, [user]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'corregido': return 'success';
      case 'entregada': return 'warning';
      default: return 'error';
    }
  };

  if (authLoading || loading) return <LinearProgress />;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>

      {/* ENCABEZADO */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          ¡Hola, {user?.firstName}!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user?.institution?.name || 'Aula Conecta Py'} | {user?.grades} 
        </Typography>
      </Box>

      {/* ESTADÍSTICAS */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Card variant="outlined" sx={{ textAlign: 'center', borderRadius: 3 }}>
            <CardContent>
              <AssignmentIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">{stats.total}</Typography>
              <Typography variant="caption" color="text.secondary">Total Tareas</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card variant="outlined" sx={{ textAlign: 'center', borderRadius: 3, borderTop: '4px solid #f44336' }}>
            <CardContent>
              <ErrorOutlineIcon color="error" />
              <Typography variant="h6" fontWeight="bold">{stats.pendientes}</Typography>
              <Typography variant="caption" color="text.secondary">Pendientes</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card variant="outlined" sx={{ textAlign: 'center', borderRadius: 3, borderTop: '4px solid #4caf50' }}>
            <CardContent>
              <CheckCircleOutlineIcon color="success" />
              <Typography variant="h6" fontWeight="bold">{stats.corregidas}</Typography>
              <Typography variant="caption" color="text.secondary">Corregidas</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card variant="outlined" sx={{ textAlign: 'center', borderRadius: 3, bgcolor: '#fff9c4' }}>
            <CardContent>
              <StarOutlineIcon sx={{ color: '#fbc02d' }} />
              <Typography variant="h6" fontWeight="bold">{stats.puntosTotales}</Typography>
              <Typography variant="caption" color="text.secondary">Puntos Totales</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* LISTADO DE TAREAS */}
      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
        Detalle de mis Tareas
      </Typography>

      {tasks.length === 0 ? (
        <Alert severity="info">Aún no hay tareas publicadas para tu grado.</Alert>
      ) : (
        <Grid container spacing={3}>
          {tasks.map((st) => (
            <Grid item xs={12} key={st._id}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" justifyContent="space-between" width="100%" alignItems="center">
                    <Typography variant="h6" fontWeight="bold">{st.task.topic}</Typography>
                    <Chip 
                      label={st.status.toUpperCase()} 
                      color={getStatusColor(st.status)} 
                      size="small"
                    />
                  </Box>
                </AccordionSummary>

                <AccordionDetails>
                  <Box mb={2}>
                    <Typography variant="body2" color="primary">
                      Materia: <strong>{st.task.subject}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fecha de entrega: {st.task.dueDate ? new Date(st.task.dueDate).toLocaleDateString('es-PY') : 'Sin fecha'}
                    </Typography>
                    {st.status === 'corregido' && (
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        Puntos obtenidos: {st.score} pts
                      </Typography>
                    )}
                  </Box>

                  {/* Indicadores */}
                  {st.task.indicators.length > 0 && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 1 }}>
                        Indicadores
                      </Typography>
                      <Box mt={1}>
                        {st.task.indicators.map((ind) => {
                          const current = st.indicatorScores.find(i => i.indicatorId === ind._id);
                          return (
                            <Box key={ind._id} display="flex" justifyContent="space-between" mb={0.5}>
                              <Typography variant="body2">{ind.description || 'Indicador'}:</Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {current?.points || 0} / {ind.points}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    </>
                  )}
                </AccordionDetails>
              </Accordion>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default StudentTasksPage;