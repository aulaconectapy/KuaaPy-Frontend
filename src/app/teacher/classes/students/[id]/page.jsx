'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getStudentTaskById, updateStudentTask } from "@/services/api";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Stack,
  Button,
  TextField,
  Divider,
  Container,    // Añadido
  IconButton,   // Añadido
  Avatar,       // Añadido (Faltaba)
  Slider,       // Añadido (Faltaba)
  Grid,         // Añadido (Faltaba)
  Tooltip,      // Añadido
  Chip          // 👈 EL CULPABLE (Faltaba)
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  SaveRounded as SaveIcon,
  AssignmentTurnedIn as TaskIcon,
  InfoOutlined as InfoIcon,
  GradeRounded as GradeIcon
} from '@mui/icons-material';

export default function CorrectStudentTaskPage() {
  const { id } = useParams();
  const router = useRouter();

  const [studentTask, setStudentTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [indicatorsArray, setIndicatorsArray] = useState([]);

  useEffect(() => {
    const fetchStudentTask = async () => {
      try {
        const data = await getStudentTaskById(id);
        setStudentTask(data);
        setCommentText(data.comments || "");

        setIndicatorsArray(
          data.task.indicators.map((indicator) => {
            const existing = data.indicatorScores.find(
              (i) => i.indicatorId === indicator._id
            );
            return {
              indicatorId: indicator._id,
              description: indicator.description,
              points: existing ? existing.points : 0,
              maxPoints: indicator.points || 0,
            };
          })
        );
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchStudentTask();
  }, [id]);

  const handlePointChange = (indicatorId, points) => {
    setIndicatorsArray((prev) =>
      prev.map((i) =>
        i.indicatorId === indicatorId
          ? { ...i, points: Math.min(Math.max(Number(points), 0), i.maxPoints) }
          : i
      )
    );
  };

  const totalPoints = indicatorsArray.reduce((sum, i) => sum + i.points, 0);
  const maxPoints = indicatorsArray.reduce((sum, i) => sum + i.maxPoints, 0);
  const percentage = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;

  const handleSave = async () => {
    try {
      await updateStudentTask(id, {
        status: "corregido",
        comments: commentText,
        indicatorScores: indicatorsArray.map((i) => ({
          indicatorId: i.indicatorId,
          points: i.points,
        })),
      });
      router.back();
    } catch (error) {
      alert("Error al guardar la corrección.");
    }
  };

  // Determinar color de la calificación
  const getScoreColor = () => {
    if (percentage < 60) return '#E53E3E'; // Rojo
    if (percentage < 90) return '#DD6B20'; // Naranja/Amarillo
    return '#38A169'; // Verde
  };

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: 'center', height: '80vh' }}>
      <CircularProgress thickness={5} sx={{ color: '#1A365D' }} />
    </Box>
  );

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      
      {/* HEADER ACCIONES */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => router.back()}
          sx={{ color: '#64748B', fontWeight: 800, textTransform: 'none' }}
        >
          Volver al listado
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          sx={{ 
            borderRadius: 3, 
            px: 4, 
            bgcolor: '#1A365D', 
            fontWeight: 800, 
            textTransform: 'none',
            boxShadow: '0 8px 16px rgba(26, 54, 93, 0.2)'
          }}
        >
          Finalizar Corrección
        </Button>
      </Stack>

      <Grid container spacing={4}>
        
        {/* PANEL IZQUIERDO: INDICADORES */}
        <Grid item xs={12} md={8}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#1A365D', mb: 1 }}>
              Evaluación de Entrega
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: '#F1F5F9', color: '#1A365D', width: 32, height: 32 }}>
                <TaskIcon fontSize="small" />
              </Avatar>
              <Typography variant="body1" sx={{ color: '#64748B', fontWeight: 600 }}>
                {studentTask.student.firstName} {studentTask.student.lastName}
              </Typography>
            </Stack>
          </Box>

          <Stack spacing={2}>
            {indicatorsArray.map((indicator, index) => (
              <Paper
                key={indicator.indicatorId}
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  border: '1px solid #E2E8F0',
                  transition: '0.2s',
                  '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' }
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 800 }}>
                      INDICADOR {index + 1}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#1E293B', mb: 2 }}>
                      {indicator.description}
                    </Typography>
                  </Box>
                  <Chip 
                    label={`${indicator.maxPoints} pts máx.`} 
                    size="small" 
                    sx={{ fontWeight: 800, bgcolor: '#F1F5F9' }} 
                  />
                </Stack>

                <Stack direction="row" spacing={3} alignItems="center">
                  <Slider
                    value={indicator.points}
                    max={indicator.maxPoints}
                    step={1}
                    onChange={(_, val) => handlePointChange(indicator.indicatorId, val)}
                    sx={{ color: '#1A365D', flexGrow: 1 }}
                  />
                  <TextField
                    type="number"
                    size="small"
                    value={indicator.points}
                    onChange={(e) => handlePointChange(indicator.indicatorId, e.target.value)}
                    InputProps={{ 
                      sx: { 
                        width: 80, 
                        fontWeight: 900, 
                        textAlign: 'center', 
                        borderRadius: 2,
                        bgcolor: indicator.points === indicator.maxPoints ? '#F0FFF4' : 'white'
                      } 
                    }}
                  />
                </Stack>
              </Paper>
            ))}
          </Stack>

          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1A365D', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon fontSize="small" /> Observaciones y Retroalimentación
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Escribe aquí los comentarios para el estudiante..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              sx={{ 
                '& .MuiOutlinedInput-root': { borderRadius: 4, bgcolor: 'white' }
              }}
            />
          </Box>
        </Grid>

        {/* PANEL DERECHO: RESUMEN FLOTANTE */}
        <Grid item xs={12} md={4}>
<Paper 
    // Borramos la palabra 'sticky' de aquí
    sx={{ 
      p: 4, 
      borderRadius: 6, 
      bgcolor: '#F8FAFC', 
      border: '2px solid #E2E8F0',
      // Agregamos el comportamiento sticky correctamente aquí:
      position: { md: 'sticky' },
      top: 24,
      zIndex: 10
    }}
  >
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#1A365D', mb: 3, textAlign: 'center' }}>
              Resumen de Nota
            </Typography>

            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box 
                sx={{ 
                  width: 120, 
                  height: 120, 
                  borderRadius: '50%', 
                  border: `8px solid ${getScoreColor()}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  transition: '0.3s'
                }}
              >
                <Typography variant="h3" sx={{ fontWeight: 950, color: '#1E293B' }}>
                  {totalPoints}
                </Typography>
                <Divider sx={{ width: '40%', my: 0.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#64748B' }}>
                  {maxPoints}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 800, color: getScoreColor() }}>
                {percentage.toFixed(0)}% del total
              </Typography>
            </Box>

            <Stack spacing={2}>
              <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 3, border: '1px solid #E2E8F0' }}>
                <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 800 }}>ESTADO</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                  {percentage >= 60 ? 'Aprobado' : 'Requiere Refuerzo'}
                </Typography>
              </Box>
              
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#1A365D', color: 'white', borderRadius: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <GradeIcon fontSize="small" />
                  <Typography variant="caption" sx={{ fontWeight: 800 }}>SISTEMA AULA CONECTA</Typography>
                </Stack>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.9, fontSize: '0.75rem' }}>
                  La calificación se guardará en el registro oficial del alumno Ezequiel Vargas.
                </Typography>
              </Paper>
            </Stack>
          </Paper>
        </Grid>

      </Grid>
    </Container>
  );
}