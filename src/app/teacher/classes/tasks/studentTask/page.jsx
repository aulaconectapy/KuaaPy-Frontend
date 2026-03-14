'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Container, Typography, Grid, Card, CardContent, 
  Chip, Box, LinearProgress, Divider, Alert, Accordion, AccordionSummary, AccordionDetails,
  Avatar, Stack, Paper, CircularProgress
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Star as StarIcon,
  ExpandMore as ExpandMoreIcon,
  School as SchoolIcon,
  CalendarMonth as CalendarIcon,
  Description as DescriptionIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';

import { useAuth } from '@/context/AuthContext';
import { getMyTasks } from '@/services/api';

const COLORS = {
  primary: "#7D0F15",
  primaryLight: "#a31a20",
  bgLight: "#F8FAFC",
  border: "#E2E8F0",
  success: "#059669",
  pending: "#D97706",
  accent: "#FBC02D"
};

const StudentTasksPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await getMyTasks();
        const filteredData = data.map(st => ({
          ...st,
          task: {
            ...st.task,
            subject: st.task?.subject || 'Sin materia',
            topic: st.task?.topic || 'Sin tema',
            dueDate: st.task?.dueDate || null,
            indicators: st.task?.indicators || []
          },
          indicatorScores: st.indicatorScores || []
        }));
        setTasks(filteredData);
      } catch (error) {
        console.error("Error al cargar tareas:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchTasks();
  }, [user]);

  // 📊 CÁLCULO DE ESTADÍSTICAS Y LOGRO
  const stats = useMemo(() => {
    const total = tasks.length;
    const pendientes = tasks.filter(t => t.status === 'pendiente').length;
    const corregidas = tasks.filter(t => t.status === 'corregido').length;
    
    // Calcular puntos obtenidos vs puntos totales posibles
    const puntosObtenidos = tasks.reduce((acc, t) => acc + (t.score || 0), 0);
    const puntosPosibles = tasks.reduce((acc, t) => {
        const sumaIndicadores = t.task.indicators?.reduce((sum, ind) => sum + (ind.points || 0), 0) || 0;
        return acc + sumaIndicadores;
    }, 0);

    const porcentajeLogro = puntosPosibles > 0 ? Math.round((puntosObtenidos / puntosPosibles) * 100) : 0;

    return { total, pendientes, corregidas, puntosObtenidos, puntosPosibles, porcentajeLogro };
  }, [tasks]);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'corregido': return { color: COLORS.success, label: 'CORREGIDO', icon: <CheckCircleIcon fontSize="small" /> };
      case 'entregada': return { color: COLORS.pending, label: 'ENTREGADA', icon: <CalendarIcon fontSize="small" /> };
      default: return { color: COLORS.primary, label: 'PENDIENTE', icon: <ErrorIcon fontSize="small" /> };
    }
  };

  if (authLoading || loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress sx={{ bgcolor: '#E2E8F0', '& .MuiLinearProgress-bar': { bgcolor: COLORS.primary } }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: '100vh', py: 6 }}>
      <Container maxWidth="lg">
        
        {/* ENCABEZADO CON PORCENTAJE DE LOGRO */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 3, md: 5 }, mb: 4, borderRadius: 6, 
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)`, 
            color: 'white', boxShadow: '0 10px 25px -5px rgba(125, 15, 21, 0.3)',
            position: 'relative', overflow: 'hidden'
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 64, height: 64 }}>
                  <SchoolIcon sx={{ fontSize: 35 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-1px' }}>
                    ¡Hola, {user?.firstName}!
                  </Typography>
                  <Typography sx={{ opacity: 0.8, fontWeight: 500 }}>
                    {user?.institution?.name || 'Aula Conecta Py'} • {user?.grades}
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Stack direction="row" spacing={3} alignItems="center" justifyContent={{ md: 'flex-end' }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress 
                    variant="determinate" 
                    value={stats.porcentajeLogro} 
                    size={80} 
                    thickness={5} 
                    sx={{ color: COLORS.accent }} 
                  />
                  <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="caption" component="div" sx={{ fontWeight: 900, color: 'white', fontSize: '1.1rem' }}>
                      {stats.porcentajeLogro}%
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, opacity: 0.9, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                    Porcentaje de Logro Total
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900 }}>
                    {stats.puntosObtenidos} <Box component="span" sx={{ fontSize: '0.9rem', opacity: 0.7 }}>/ {stats.puntosPosibles} pts</Box>
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* TARJETAS DE ESTADÍSTICAS RÁPIDAS */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {[
            { label: 'Tareas Totales', value: stats.total, icon: <AssignmentIcon />, color: '#64748B' },
            { label: 'Pendientes', value: stats.pendientes, icon: <ErrorIcon />, color: COLORS.primary },
            { label: 'Corregidas', value: stats.corregidas, icon: <CheckCircleIcon />, color: COLORS.success },
            { label: 'Efectividad', value: `${stats.porcentajeLogro}%`, icon: <TrophyIcon />, color: COLORS.accent }
          ].map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Card sx={{ borderRadius: 5, border: `1px solid ${COLORS.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Avatar sx={{ bgcolor: `${stat.color}15`, color: stat.color, mx: 'auto', mb: 1 }}>
                    {stat.icon}
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#1E293B' }}>{stat.value}</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <DescriptionIcon sx={{ color: COLORS.primary }} />
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#1E293B' }}>
            Mis Actividades
          </Typography>
        </Box>

        {tasks.length === 0 ? (
          <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 6, border: `2px dashed ${COLORS.border}`, bgcolor: 'transparent' }}>
            <Typography color="text.secondary" variant="h6">No hay tareas asignadas para tu grado.</Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {tasks.map((st) => {
              const status = getStatusConfig(st.status);
              return (
                <Accordion 
                  key={st._id} 
                  elevation={0}
                  sx={{ 
                    borderRadius: '20px !important', 
                    border: `1px solid ${COLORS.border}`,
                    '&:hover': { borderColor: COLORS.primary },
                    '&:before': { display: 'none' }
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: COLORS.primary }} />}>
                    <Grid container alignItems="center" spacing={2}>
                      <Grid item xs>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Box sx={{ bgcolor: `${status.color}15`, p: 1, borderRadius: 3, color: status.color, display: 'flex' }}>
                            {status.icon}
                          </Box>
                          <Box>
                            <Typography sx={{ fontWeight: 800, color: '#1E293B' }}>{st.task.topic}</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.primary }}>
                              {st.task.subject}
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                      <Grid item sx={{ textAlign: 'right', mr: 2 }}>
                        <Chip 
                          label={status.label} 
                          size="small" 
                          sx={{ bgcolor: `${status.color}10`, color: status.color, fontWeight: 900, fontSize: '0.65rem' }} 
                        />
                      </Grid>
                    </Grid>
                  </AccordionSummary>

                  <AccordionDetails sx={{ bgcolor: '#F8FAFC', p: 4, borderTop: `1px solid ${COLORS.border}` }}>
                    <Grid container spacing={4}>
                      <Grid item xs={12} md={5}>
                        <Stack spacing={2}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarIcon sx={{ fontSize: 18, color: '#64748B' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Entrega: {st.task.dueDate ? new Date(st.task.dueDate).toLocaleDateString('es-PY', { day: 'numeric', month: 'long' }) : 'Pendiente'}
                            </Typography>
                          </Box>
                          
                          {st.status === 'corregido' && (
                            <Paper elevation={0} sx={{ p: 2, bgcolor: `${COLORS.success}10`, borderRadius: 4, border: `1px solid ${COLORS.success}30` }}>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: COLORS.success, textTransform: 'uppercase' }}>
                                Resultado
                              </Typography>
                              <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.success }}>
                                {st.score} <Box component="span" sx={{ fontSize: '1rem' }}>pts</Box>
                              </Typography>
                            </Paper>
                          )}
                        </Stack>
                      </Grid>

                      <Grid item xs={12} md={7}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: '#1E293B' }}>
                          Indicadores Evaluados
                        </Typography>
                        <Stack spacing={2}>
                          {st.task.indicators.map((ind) => {
                            const current = st.indicatorScores.find(i => i.indicatorId === ind._id);
                            const points = current?.points || 0;
                            const percentage = (points / (ind.points || 1)) * 100;
                            
                            return (
                              <Box key={ind._id}>
                                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>
                                    {ind.name || ind.description || 'Indicador'}
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontWeight: 900, color: COLORS.primary }}>
                                    {points} / {ind.points}
                                  </Typography>
                                </Stack>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={percentage} 
                                  sx={{ 
                                    height: 6, borderRadius: 3, bgcolor: '#E2E8F0',
                                    '& .MuiLinearProgress-bar': { bgcolor: percentage === 100 ? COLORS.success : COLORS.primary }
                                  }}
                                />
                              </Box>
                            );
                          })}
                        </Stack>
                        {st.comments && (
                            <Box sx={{ mt: 3, p: 2, bgcolor: 'white', borderRadius: 3, borderLeft: `4px solid ${COLORS.primary}` }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: COLORS.primary }}>Comentario del Docente:</Typography>
                                <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 0.5 }}>"{st.comments}"</Typography>
                            </Box>
                        )}
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Stack>
        )}
      </Container>
    </Box>
  );
};

export default StudentTasksPage;