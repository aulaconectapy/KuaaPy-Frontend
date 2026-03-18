'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Container, Typography, Grid, Card, CardContent, 
  Chip, Box, LinearProgress, Accordion, AccordionSummary, AccordionDetails,
  Avatar, Stack, Paper, CircularProgress, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  School as SchoolIcon,
  CalendarMonth as CalendarIcon,
  Description as DescriptionIcon,
  EmojiEvents as TrophyIcon,
  ListAlt as ListIcon,
  Timeline as RsaIcon,
  TableChart as RubricIcon,
  Star as StarIcon,
  InfoOutlined as InfoIcon
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
        setTasks(data);
      } catch (error) {
        console.error("Error al cargar tareas:", error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchTasks();
  }, [user]);

  // Lógica de estadísticas corregida
  const stats = useMemo(() => {
    let puntosGanados = 0;
    let puntosTotalesPosibles = 0;
    let corregidas = 0;
    let pendientes = 0;

    tasks.forEach(st => {
      if (st.status === 'corregido') {
        puntosGanados += (st.score || 0);
        corregidas++;
      } else {
        pendientes++;
      }

      // Calcular el máximo posible de ESTA tarea
      const type = st.task?.instrumentType;
      if (type === 'rubrica') {
        st.task.rubricCriteria?.forEach(crit => {
          const maxLvl = Math.max(...crit.levels.map(l => l.points || 0));
          puntosTotalesPosibles += maxLvl;
        });
      } else {
        // RSA o Lista de Cotejo (Suma de puntos de indicadores)
        const maxInd = st.task?.indicators?.reduce((sum, ind) => sum + (ind.points || 0), 0) || 0;
        puntosTotalesPosibles += maxInd;
      }
    });

    const porcentaje = puntosTotalesPosibles > 0 
      ? Math.round((puntosGanados / puntosTotalesPosibles) * 100) 
      : 0;

    return {
      total: tasks.length,
      puntosGanados,
      puntosTotalesPosibles,
      porcentaje,
      corregidas,
      pendientes
    };
  }, [tasks]);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'corregido': return { color: COLORS.success, label: 'CORREGIDO' };
      case 'entregada': return { color: COLORS.pending, label: 'ENTREGADA' };
      default: return { color: COLORS.primary, label: 'PENDIENTE' };
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
        
        {/* ENCABEZADO CON PORCENTAJE REAL */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 3, md: 5 }, mb: 4, borderRadius: 6, 
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)`, 
            color: 'white', boxShadow: '0 10px 25px -5px rgba(125, 15, 21, 0.3)'
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 70, height: 70 }}>
                  <SchoolIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-1px' }}>
                    ¡Hola, {user?.firstName}!
                  </Typography>
                  <Typography sx={{ opacity: 0.8, fontWeight: 500 }}>
                    {user?.grade} • {user?.institution?.name || 'Aula Conecta Py'}
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Stack direction="row" spacing={3} alignItems="center" justifyContent={{ md: 'flex-end' }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress 
                    variant="determinate" 
                    value={stats.porcentaje} 
                    size={90} 
                    thickness={5} 
                    sx={{ color: COLORS.accent }} 
                  />
                  <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: 'white' }}>
                      {stats.porcentaje}%
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.8, textTransform: 'uppercase', display: 'block' }}>
                    RENDIMIENTO GENERAL
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900 }}>
                    {stats.puntosGanados} <Box component="span" sx={{ fontSize: '1rem', opacity: 0.7 }}>/ {stats.puntosTotalesPosibles} pts</Box>
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        <Typography variant="h5" sx={{ fontWeight: 900, color: '#1E293B', mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <DescriptionIcon sx={{ color: COLORS.primary }} /> Mis Calificaciones Detalladas
        </Typography>

        <Stack spacing={3}>
          {tasks.map((st) => {
            const statusCfg = getStatusConfig(st.status);
            const isRSA = st.task?.instrumentType === 'rsa';
            const isRubric = st.task?.instrumentType === 'rubrica';

            return (
              <Accordion 
                key={st._id} 
                elevation={0} 
                sx={{ 
                  borderRadius: '24px !important', 
                  border: `1px solid ${COLORS.border}`,
                  overflow: 'hidden',
                  '&:before': { display: 'none' }
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: COLORS.primary }} />}>
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item xs>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{ bgcolor: `${statusCfg.color}15`, p: 1.5, borderRadius: 4, color: statusCfg.color, display: 'flex' }}>
                          {isRSA ? <RsaIcon /> : isRubric ? <RubricIcon /> : <ListIcon />}
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 800, color: '#1E293B' }}>{st.task?.topic}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase' }}>
                            {st.task?.subject} • {st.task?.instrumentType?.replace('_', ' ')}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                    <Grid item>
                      <Chip 
                        label={statusCfg.label} 
                        size="small" 
                        sx={{ bgcolor: `${statusCfg.color}10`, color: statusCfg.color, fontWeight: 900, mr: 2 }} 
                      />
                    </Grid>
                  </Grid>
                </AccordionSummary>

                <AccordionDetails sx={{ bgcolor: '#F8FAFC', p: { xs: 2, md: 4 }, borderTop: `1px solid ${COLORS.border}` }}>
                  <Grid container spacing={4}>
                    
                    {/* PANEL DE PUNTOS LATERAL */}
                    <Grid item xs={12} md={3}>
                      <Stack spacing={2}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: `1px solid ${COLORS.border}`, bgcolor: 'white' }}>
                           <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B' }}>FECHA LÍMITE</Typography>
                           <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {st.task?.dueDate ? new Date(st.task.dueDate).toLocaleDateString() : '---'}
                           </Typography>
                        </Paper>
                        
                        {st.status === 'corregido' && (
                          <Paper elevation={0} sx={{ p: 3, bgcolor: `${COLORS.success}08`, borderRadius: 4, border: `2px solid ${COLORS.success}20`, textAlign: 'center' }}>
                            <TrophyIcon sx={{ color: COLORS.accent, fontSize: 40, mb: 1 }} />
                            <Typography variant="h3" sx={{ fontWeight: 900, color: COLORS.success }}>
                              {st.score}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: COLORS.success }}>PUNTOS OBTENIDOS</Typography>
                          </Paper>
                        )}
                      </Stack>
                    </Grid>

                    {/* DETALLES DEL LOGRO (RSA / RÚBRICA) */}
                    <Grid item xs={12} md={9}>
                      
                      {/* VISTA RSA */}
                      {isRSA && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2, color: '#1E293B' }}>SEGUIMIENTO RSA (3 MOMENTOS)</Typography>
                          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: `1px solid ${COLORS.border}` }}>
                            <Table size="small">
                              <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 800 }}>Indicador de Logro</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 800 }}>M1</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 800 }}>M2</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 800 }}>M3</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {st.task?.indicators?.map((ind) => (
                                  <TableRow key={ind._id} hover>
                                    <TableCell sx={{ fontSize: '0.8rem', py: 1.5 }}>{ind.description}</TableCell>
                                    {[1, 2, 3].map(m => {
                                      const score = st.indicatorScores?.find(s => 
                                        (s.indicatorId?._id || s.indicatorId) === ind._id && s.moment === m
                                      );
                                      return (
                                        <TableCell key={m} align="center">
                                          {score ? (
                                            <Avatar sx={{ 
                                              width: 24, height: 24, fontSize: '0.7rem', fontWeight: 900,
                                              bgcolor: score.points > 0 ? COLORS.success : '#FDA4AF',
                                              color: 'white'
                                            }}>
                                              {score.points > 0 ? 'L' : 'P'}
                                            </Avatar>
                                          ) : <Typography variant="caption" color="text.disabled">-</Typography>}
                                        </TableCell>
                                      );
                                    })}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      )}

                      {/* VISTA RÚBRICA */}
                      {isRubric && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2, color: '#1E293B' }}>MATRIZ DE CALIFICACIÓN POR RÚBRICA</Typography>
                          <Stack spacing={3}>
                            {st.task?.rubricCriteria?.map((crit) => {
                              // Buscar el nivel que el profe marcó
                              const score = st.rubricScores?.find(rs => 
                                (rs.indicatorId?._id || rs.indicatorId) === crit._id || rs.criterion === crit.criterion
                              );

                              return (
                                <Box key={crit._id}>
                                  <Typography variant="body2" sx={{ fontWeight: 800, mb: 1, color: COLORS.primary }}>
                                    {crit.criterion}
                                  </Typography>
                                  <Grid container spacing={1}>
                                    {crit.levels.map((lvl) => {
                                      const isSelected = score && Number(score.points) === Number(lvl.points);
                                      return (
                                        <Grid item xs={12} sm={3} key={lvl._id}>
                                          <Box sx={{ 
                                            p: 2, height: '100%', borderRadius: 3, 
                                            border: `2px solid ${isSelected ? COLORS.success : COLORS.border}`,
                                            bgcolor: isSelected ? `${COLORS.success}05` : 'white',
                                            position: 'relative', transition: '0.3s'
                                          }}>
                                            {isSelected && <StarIcon sx={{ position: 'absolute', top: -8, right: -8, color: COLORS.accent, fontSize: 20 }} />}
                                            <Typography variant="caption" sx={{ fontWeight: 900, display: 'block', color: isSelected ? COLORS.success : '#64748B' }}>
                                              {lvl.level} ({lvl.points} pts)
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.65rem', mt: 0.5, color: isSelected ? '#166534' : '#94A3B8', lineHeight: 1.2 }}>
                                              {lvl.descriptor}
                                            </Typography>
                                          </Box>
                                        </Grid>
                                      );
                                    })}
                                  </Grid>
                                </Box>
                              );
                            })}
                          </Stack>
                        </Box>
                      )}

                      {/* COMENTARIOS */}
                      {st.comments && (
                        <Box sx={{ mt: 4, p: 2, bgcolor: '#FFFBEB', borderRadius: 4, borderLeft: `5px solid ${COLORS.accent}` }}>
                          <Typography variant="caption" sx={{ fontWeight: 900, color: '#92400E', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <InfoIcon sx={{ fontSize: 14 }} /> RETROALIMENTACIÓN DEL DOCENTE
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5, color: '#92400E', fontStyle: 'italic' }}>
                            "{st.comments}"
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Stack>
      </Container>
    </Box>
  );
};

export default StudentTasksPage;