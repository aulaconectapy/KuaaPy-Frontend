'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Container, Typography, Grid, Card, CardContent, 
  Chip, Box, LinearProgress, Accordion, AccordionSummary, AccordionDetails,
  Avatar, Stack, Paper, CircularProgress, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, MenuItem, InputAdornment, IconButton, Tooltip
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  School as SchoolIcon,
  Description as DescriptionIcon,
  EmojiEvents as TrophyIcon,
  ListAlt as ListIcon,
  Timeline as RsaIcon,
  TableChart as RubricIcon,
  InfoOutlined as InfoIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Lightbulb as LightbulbIcon,
  Psychology as PsychologyIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';

import { useAuth } from '@/context/AuthContext';
import { getMyTasks } from '@/services/api';

// CONSTANTES DE ESTILO KUAAPY
const COLORS = {
  primary: "#0038A8",     // Azul principal KuaaPy
  primaryDark: "#00257A", // Azul oscuro
  red: "#D52B1E",         // Acento rojo
  bgLight: "#F8FAFC",
  border: "#E2E8F0",
  success: "#059669",
  pending: "#D97706",
  accent: "#FBC02D",
  info: "#3B82F6",
  gradient: "linear-gradient(135deg, #0038A8 0%, #00257A 100%)"
};

const StudentTasksPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS PARA FILTROS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Todas');

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

  // --- LÓGICA DE FILTRADO ---
  const filteredTasks = useMemo(() => {
    return tasks.filter(st => {
      const matchesSearch = 
        st.task?.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        st.task?.subject?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSubject = 
        selectedSubject === 'Todas' || st.task?.subject === selectedSubject;

      return matchesSearch && matchesSubject;
    });
  }, [tasks, searchTerm, selectedSubject]);

  // Lista de asignaturas únicas
  const subjects = useMemo(() => {
    const uniqueSubjects = [...new Set(tasks.map(st => st.task?.subject))].filter(Boolean);
    return ['Todas', ...uniqueSubjects];
  }, [tasks]);

  const stats = useMemo(() => {
    let puntosGanados = 0;
    let puntosTotalesPosibles = 0;
    let corregidas = 0;
    let pendientes = 0;

    tasks.forEach(st => {
      const isSumative = st.task?.taskType === 'sumativo';

      if (st.status === 'corregido') {
        if (isSumative) puntosGanados += (st.score || 0);
        corregidas++;
      } else {
        pendientes++;
      }

      if (isSumative) {
        const type = st.task?.instrumentType;
        if (type === 'rubrica') {
          st.task.rubricCriteria?.forEach(crit => {
            const maxLvl = Math.max(...crit.levels.map(l => l.points || 0));
            puntosTotalesPosibles += maxLvl;
          });
        } else {
          const maxInd = st.task?.indicators?.reduce((sum, ind) => sum + (ind.points || 0), 0) || 0;
          puntosTotalesPosibles += maxInd;
        }
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

  const getTaskTypeConfig = (type) => {
    switch (type) {
      case 'diagnostico': 
        return { label: 'Diagnóstico', color: '#64748B', icon: <PsychologyIcon sx={{ fontSize: 16 }} />, desc: 'No suma puntos. Identifica saberes previos.' };
      case 'formativo': 
        return { label: 'Formativo', color: COLORS.info, icon: <LightbulbIcon sx={{ fontSize: 16 }} />, desc: 'No suma puntos. Evalúa el proceso de aprendizaje.' };
      case 'sumativo': 
        return { label: 'Sumativo', color: COLORS.primary, icon: <BarChartIcon sx={{ fontSize: 16 }} />, desc: 'Suma para la calificación final.' };
      default: 
        return { label: 'N/A', color: '#ccc', icon: null, desc: '' };
    }
  };

  if (authLoading || loading) {
    return (
      <Box sx={{ width: '100%', mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: '100vh', py: { xs: 3, md: 5 } }}>
      <Container maxWidth="lg">
        
        {/* Banner de Usuario */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 3, md: 4.5 }, mb: 4, borderRadius: '24px', 
            background: COLORS.gradient, 
            color: 'white', boxShadow: '0 15px 35px rgba(0, 56, 168, 0.15)'
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack direction="row" spacing={2.5} alignItems="center">
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 68, height: 68, borderRadius: '18px' }}>
                  <SchoolIcon sx={{ fontSize: 36 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.02em', mb: 0.5 }}>
                    ¡Hola, {user?.firstName}!
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                    {user?.grade} • {user?.institution?.name || 'KuaaPy Institución'}
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
                    size={80} 
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
                  <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.85, textTransform: 'uppercase', display: 'block', letterSpacing: '0.05em' }}>
                    RENDIMIENTO SUMATIVO
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900 }}>
                    {stats.puntosGanados} <Box component="span" sx={{ fontSize: '1rem', opacity: 0.8 }}>/ {stats.puntosTotalesPosibles} pts</Box>
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* --- EXPLICACIÓN DE FUNCIONES DE EVALUACIÓN --- */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {[
            { type: 'diagnostico', title: 'Evaluación Diagnóstica', text: 'Sirve para conocer tus conocimientos previos. No afecta tu calificación final.', color: '#64748B', icon: <PsychologyIcon /> },
            { type: 'formativo', title: 'Evaluación Formativa', text: 'Ayuda a monitorear tu progreso durante el aprendizaje. No afecta tu calificación final.', color: COLORS.info, icon: <LightbulbIcon /> },
            { type: 'sumativo', title: 'Evaluación Sumativa', text: 'Valora lo aprendido al final de un proceso. Estos puntos sí cuentan para tu calificación.', color: COLORS.primary, icon: <BarChartIcon /> }
          ].map((item) => (
            <Grid item xs={12} md={4} key={item.type}>
              <Card elevation={0} sx={{ height: '100%', borderRadius: '20px', border: `1px solid ${item.color}30`, bgcolor: `${item.color}06` }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                    <Box sx={{ color: item.color, display: 'flex' }}>{item.icon}</Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: item.color }}>{item.title}</Typography>
                  </Stack>
                  <Typography variant="caption" sx={{ color: '#475569', lineHeight: 1.4, display: 'block', fontWeight: 500 }}>
                    {item.text}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* --- BARRA DE BÚSQUEDA Y FILTRO --- */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 4, borderRadius: '20px', border: `1px solid ${COLORS.border}`, bgcolor: 'white' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por tema o asignatura..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: COLORS.primary }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <IconButton onClick={() => setSearchTerm('')} size="small">
                      <ClearIcon />
                    </IconButton>
                  ),
                  sx: { borderRadius: '12px', bgcolor: COLORS.bgLight }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Filtrar por Asignatura"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterIcon sx={{ color: COLORS.primary, mr: 0.5 }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '12px', bgcolor: COLORS.bgLight }
                }}
              >
                {subjects.map((subj) => (
                  <MenuItem key={subj} value={subj}>
                    {subj}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A', mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <DescriptionIcon sx={{ color: COLORS.primary }} /> 
          {searchTerm || selectedSubject !== 'Todas' ? 'Resultados de búsqueda' : 'Mi avance académico'}
        </Typography>

        <Stack spacing={2.5}>
          {filteredTasks.length > 0 ? (
            filteredTasks.map((st) => {
              const statusCfg = getStatusConfig(st.status);
              const typeCfg = getTaskTypeConfig(st.task?.taskType);
              const isRSA = st.task?.instrumentType === 'rsa';
              const isRubric = st.task?.instrumentType === 'rubrica';
              const isListaCotejo = st.task?.instrumentType === 'lista_cotejo';

              return (
                <Accordion 
                  key={st._id} 
                  elevation={0} 
                  sx={{ 
                    borderRadius: '20px !important', 
                    border: `1px solid ${COLORS.border}`,
                    overflow: 'hidden',
                    bgcolor: '#fff',
                    '&:before': { display: 'none' },
                    boxShadow: '0 4px 12px rgba(0,56,168,0.03)'
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: COLORS.primary }} />}>
                    <Grid container alignItems="center" spacing={2}>
                      <Grid item xs>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Box sx={{ bgcolor: `${statusCfg.color}15`, p: 1.5, borderRadius: '14px', color: statusCfg.color, display: 'flex' }}>
                            {isRSA ? <RsaIcon /> : isRubric ? <RubricIcon /> : <ListIcon />}
                          </Box>
                          <Box>
                            <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>{st.task?.topic}</Typography>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase' }}>
                                {st.task?.subject} • {st.task?.instrumentType?.replace('_', ' ')}
                              </Typography>
                              <Tooltip title={typeCfg.desc}>
                                <Chip 
                                  label={typeCfg.label} 
                                  icon={typeCfg.icon} 
                                  size="small" 
                                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: `${typeCfg.color}15`, color: typeCfg.color, borderRadius: '6px' }} 
                                />
                              </Tooltip>
                            </Stack>
                          </Box>
                        </Stack>
                      </Grid>
                      <Grid item>
                        <Chip 
                          label={statusCfg.label} 
                          size="small" 
                          sx={{ bgcolor: `${statusCfg.color}12`, color: statusCfg.color, fontWeight: 900, mr: 2, borderRadius: '6px' }} 
                        />
                      </Grid>
                    </Grid>
                  </AccordionSummary>

                  <AccordionDetails sx={{ bgcolor: '#F8FAFC', p: { xs: 2, md: 4 }, borderTop: `1px solid ${COLORS.border}` }}>
                    <Grid container spacing={4}>
                      <Grid item xs={12} md={3}>
                        <Stack spacing={2}>
                          <Paper elevation={0} sx={{ p: 2, borderRadius: '16px', border: `1px solid ${COLORS.border}`, bgcolor: 'white' }}>
                             <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', letterSpacing: '0.05em' }}>FECHA LÍMITE</Typography>
                             <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', mt: 0.5 }}>
                                {st.task?.dueDate ? new Date(st.task.dueDate).toLocaleDateString() : '---'}
                             </Typography>
                          </Paper>
                          
                          {st.status === 'corregido' && (
                            <Paper elevation={0} sx={{ p: 3, bgcolor: `${st.task?.taskType === 'sumativo' ? COLORS.success : '#64748B'}08`, borderRadius: '16px', border: `2px solid ${st.task?.taskType === 'sumativo' ? COLORS.success : '#64748B'}20`, textAlign: 'center' }}>
                              <TrophyIcon sx={{ color: st.task?.taskType === 'sumativo' ? COLORS.accent : '#94A3B8', fontSize: 40, mb: 1 }} />
                              <Typography variant="h3" sx={{ fontWeight: 900, color: st.task?.taskType === 'sumativo' ? COLORS.success : '#475569' }}>
                                {st.score}
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: st.task?.taskType === 'sumativo' ? COLORS.success : '#475569', letterSpacing: '0.05em' }}>
                                {st.task?.taskType === 'sumativo' ? 'PUNTOS OBTENIDOS' : 'PUNTOS (SIN VALOR SUMATIVO)'}
                              </Typography>
                            </Paper>
                          )}
                        </Stack>
                      </Grid>

                      <Grid item xs={12} md={9}>
                        {/* RSA TABLE */}
                        {isRSA && (
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2, color: '#0F172A' }}>SEGUIMIENTO RSA (3 MOMENTOS)</Typography>
                            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${COLORS.border}` }}>
                              <Table size="small">
                                <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>Indicador de Logro</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 800, color: '#0F172A' }}>M1</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 800, color: '#0F172A' }}>M2</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 800, color: '#0F172A' }}>M3</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {st.task?.indicators?.map((ind) => (
                                    <TableRow key={ind._id} hover>
                                      <TableCell sx={{ fontSize: '0.85rem', py: 1.5, color: '#334155', fontWeight: 500 }}>{ind.description}</TableCell>
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
                                                color: 'white',
                                                borderRadius: '8px'
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

                        {/* LISTA DE COTEJO TABLE */}
                        {isListaCotejo && (
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2, color: '#0F172A' }}>INDICADORES DE LOGRO</Typography>
                            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${COLORS.border}` }}>
                              <Table size="small">
                                <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>Descripción del Indicador</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 800, color: '#0F172A' }}>Pts</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 800, color: '#0F172A' }}>Estado</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {st.task?.indicators?.map((ind) => {
                                    const score = st.indicatorScores?.find(s => 
                                      (s.indicatorId?._id || s.indicatorId) === ind._id
                                    );
                                    return (
                                      <TableRow key={ind._id} hover>
                                        <TableCell sx={{ fontSize: '0.85rem', py: 1.5, color: '#334155', fontWeight: 500 }}>{ind.description}</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, color: '#0F172A' }}>{ind.points}</TableCell>
                                        <TableCell align="center">
                                          {st.status === 'corregido' ? (
                                            <Avatar sx={{ 
                                              width: 28, height: 28, 
                                              bgcolor: score?.points > 0 ? `${COLORS.success}20` : '#FDA4AF20',
                                              color: score?.points > 0 ? COLORS.success : '#EF4444',
                                              border: `1px solid ${score?.points > 0 ? COLORS.success : '#EF4444'}`,
                                              borderRadius: '8px'
                                            }}>
                                              {score?.points > 0 ? <CheckIcon sx={{ fontSize: 16 }} /> : <CloseIcon sx={{ fontSize: 16 }} />}
                                            </Avatar>
                                          ) : (
                                            <Typography variant="caption" color="text.disabled">Pendiente</Typography>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        )}

                        {/* RUBRICA TABLE */}
                        {isRubric && (
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2, color: '#0F172A' }}>MATRIZ DE CALIFICACIÓN POR RÚBRICA</Typography>
                            <Stack spacing={3}>
                              {st.task?.rubricCriteria?.map((crit) => {
                                const scoreEntry = st.rubricScores?.find(rs => 
                                  (rs.indicatorId?._id || rs.indicatorId) === crit._id || 
                                  rs.criterion === crit.criterion
                                );

                                return (
                                  <Box key={crit._id}>
                                    <Typography variant="body2" sx={{ fontWeight: 800, mb: 1, color: COLORS.primary }}>
                                      {crit.criterion}
                                    </Typography>
                                    <Grid container spacing={1}>
                                      {crit.levels.map((lvl) => {
                                        const isSelected = scoreEntry && Number(scoreEntry.points) === Number(lvl.points);
                                        
                                        return (
                                          <Grid item xs={12} sm={3} key={lvl._id}>
                                            <Box sx={{ 
                                              p: 2, height: '100%', borderRadius: '14px', 
                                              border: `2px solid ${isSelected ? COLORS.success : COLORS.border}`,
                                              bgcolor: isSelected ? `${COLORS.success}10` : 'white',
                                              position: 'relative', transition: '0.3s',
                                              boxShadow: isSelected ? '0 4px 12px rgba(5, 150, 105, 0.15)' : 'none'
                                            }}>
                                              {isSelected && (
                                                <CheckCircleIcon sx={{ position: 'absolute', top: -8, right: -8, color: COLORS.success, fontSize: 20, bgcolor: 'white', borderRadius: '50%' }} />
                                              )}
                                              <Typography variant="caption" sx={{ fontWeight: 900, display: 'block', color: isSelected ? COLORS.success : '#64748B' }}>
                                                {lvl.level} ({lvl.points} pts)
                                              </Typography>
                                              <Typography sx={{ fontSize: '0.75rem', mt: 0.5, color: isSelected ? '#064E3B' : '#64748B', lineHeight: 1.3, fontWeight: isSelected ? 600 : 400 }}>
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

                        {st.comments && (
                          <Box sx={{ mt: 4, p: 2.5, bgcolor: '#FFFBEB', borderRadius: '16px', borderLeft: `5px solid ${COLORS.accent}`, border: `1px solid #FEF3C7` }}>
                            <Typography variant="caption" sx={{ fontWeight: 900, color: '#92400E', display: 'flex', alignItems: 'center', gap: 0.5, letterSpacing: '0.05em' }}>
                              <InfoIcon sx={{ fontSize: 14 }} /> RETROALIMENTACIÓN DEL DOCENTE
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.8, color: '#92400E', fontStyle: 'italic', fontWeight: 500 }}>
                              "{st.comments}"
                            </Typography>
                          </Box>
                        )}
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              );
            })
          ) : (
            <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: '24px', border: `2px dashed ${COLORS.border}` }}>
              <ErrorIcon sx={{ fontSize: 50, color: '#94A3B8', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#64748B', mb: 0.5 }}>
                No encontramos tareas con esos criterios
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 500 }}>
                Intenta buscar otra palabra o cambia la asignatura.
              </Typography>
            </Paper>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default StudentTasksPage;