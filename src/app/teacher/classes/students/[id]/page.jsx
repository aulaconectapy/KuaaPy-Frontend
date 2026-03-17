'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Box, Container, Typography, Paper, Stack, Divider, Chip, 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Button, LinearProgress 
} from "@mui/material";
import { 
  ArrowBack as BackIcon, 
  EventNote as TaskIcon 
} from '@mui/icons-material';
import { getStudentTasksByStudentId } from "@/services/api";
import { useAuth } from "@/context/AuthContext"; // Importamos el contexto de Auth

const COLORS = {
  primary: "#7D0F15",
  bgLight: "#F8FAFC",
  border: "#E2E8F0"
};

export default function StudentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(); // Obtenemos user y estado de carga
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState(null);

  // 1. Definir roles autorizados
  const authorizedRoles = ['director/a', 'secretario/a', 'docente', 'admin'];

  useEffect(() => {
    // 2. Lógica de Protección de Ruta
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      const userRole = user.role?.toLowerCase();
      if (!authorizedRoles.includes(userRole)) {
        router.push('/dashboard');
        return;
      }
    }

    const loadStudentData = async () => {
      setLoading(true);
      try {
        const data = await getStudentTasksByStudentId(id);
        setTasks(data);
        if (data && data.length > 0) {
          setStudentInfo(data[0].student);
        }
      } catch (error) {
        console.error("Error al cargar detalles:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id && user && !authLoading) loadStudentData();
  }, [id, user, authLoading, router]);

  const getMaxPoints = (task) => {
    if (!task) return 0;
    if (task.instrumentType === 'rubrica') {
      return task.rubricCriteria?.length || 0;
    }
    return task.indicators?.length || 0;
  };

  // 3. Renderizado de carga global (Auth + Datos)
  if (authLoading || loading) {
    return <LinearProgress sx={{ bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: COLORS.primary } }} />;
  }

  // 4. Bloqueo de renderizado si no está autorizado
  if (!user || !authorizedRoles.includes(user.role?.toLowerCase())) {
    return null;
  }

  return (
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        
        <Button 
          startIcon={<BackIcon />} 
          onClick={() => router.back()}
          sx={{ mb: 3, color: COLORS.primary, fontWeight: 700, textTransform: 'none' }}
        >
          Volver al Resumen
        </Button>

        <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, border: `1px solid ${COLORS.border}`, boxShadow: 'none' }}>
          
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#1E293B' }}>
                {studentInfo?.lastName?.toUpperCase()}, {studentInfo?.firstName}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                <Chip label={studentInfo?.grade} size="small" sx={{ fontWeight: 700, bgcolor: '#E2E8F0' }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Historial Académico Detallado
                </Typography>
              </Stack>
            </Box>
            
            <Box sx={{ textAlign: { md: 'right' } }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B' }}>
                TAREAS REGISTRADAS
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.primary }}>
                {tasks.length}
              </Typography>
            </Box>
          </Stack>
          
          <Divider sx={{ my: 4 }} />

          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900 }}>MATERIA / TEMA</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 900 }}>INSTRUMENTO</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 900 }}>ESTADO</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 900 }}>LOGRO</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 900 }}>PUNTAJE</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((st) => {
                  const maxPts = getMaxPoints(st.task);
                  return (
                    <TableRow key={st._id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Box sx={{ p: 1, bgcolor: '#F1F5F9', borderRadius: 2 }}>
                            <TaskIcon sx={{ color: '#64748B', fontSize: 20 }} />
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                              {st.task?.subject || 'Sin Materia'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {st.task?.topic || 'Sin Tema'}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      <TableCell align="center">
                        <Chip 
                          label={st.task?.instrumentType?.toUpperCase().replace('_', ' ')} 
                          size="small" 
                          variant="outlined" 
                          sx={{ fontWeight: 700, fontSize: '0.65rem', color: '#64748B' }}
                        />
                      </TableCell>

                      <TableCell align="center">
                        <Chip 
                          label={st.status} 
                          size="small"
                          sx={{ 
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            fontSize: '0.7rem',
                            bgcolor: st.status === 'corregido' ? '#DCFCE7' : '#FEF2F2',
                            color: st.status === 'corregido' ? '#166534' : '#991B1B',
                          }} 
                        />
                      </TableCell>

                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {st.score || 0} / {maxPts}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Indicadores
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Box sx={{ 
                          display: 'inline-block', 
                          px: 2, py: 0.5, 
                          bgcolor: COLORS.primary, 
                          color: 'white', 
                          borderRadius: 2,
                          fontWeight: 900
                        }}>
                          {st.score || 0} pts
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                {tasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <Typography color="text.secondary" sx={{ fontWeight: 600 }}>
                        Este estudiante aún no tiene tareas registradas.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </Box>
  );
}