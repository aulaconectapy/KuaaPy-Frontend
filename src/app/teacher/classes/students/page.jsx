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
  TextField,
  Button,
  MenuItem,
  IconButton
} from "@mui/material";
import { ArrowBackIosNewRounded, CheckCircleRounded, RateReviewRounded } from "@mui/icons-material";

// CONSTANTES DE ESTILO KUAAPY
const COLORS = {
  primary: "#0038A8",     // Azul principal KuaaPy
  primaryDark: "#00257A", // Azul oscuro
  red: "#D52B1E",         // Acento rojo
  bgLight: "#F8FAFC",
  gradient: "linear-gradient(135deg, #0038A8 0%, #00257A 100%)",
  border: "#E2E8F0"
};

export default function StudentTaskCorrectionPage() {
  const { id } = useParams(); // studentTaskId
  const router = useRouter();
  const [studentTask, setStudentTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [formData, setFormData] = useState({
    status: "",
    comments: "",
    indicatorScores: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getStudentTaskById(id);
        setStudentTask(res);
        setFormData({
          status: res.status,
          comments: res.comments || "",
          indicatorScores: res.indicatorScores.map((i) => ({
            indicatorId: i.indicatorId,
            description: i.description,
            points: i.points || 0
          }))
        });
      } catch (error) {
        console.error("Error al cargar la entrega:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const handleScoreChange = (index, value) => {
    const updated = [...formData.indicatorScores];
    updated[index].points = Number(value);
    setFormData({ ...formData, indicatorScores: updated });
  };

  const handleCommentsChange = (e) => {
    setFormData({ ...formData, comments: e.target.value });
  };

  const handleStatusChange = (e) => {
    setFormData({ ...formData, status: e.target.value });
  };

  const handleSubmit = async () => {
    setUpdating(true);
    try {
      await updateStudentTask(id, {
        status: formData.status,
        comments: formData.comments,
        indicatorScores: formData.indicatorScores.map((i) => ({
          indicatorId: i.indicatorId,
          points: i.points
        }))
      });
      alert("Entrega actualizada correctamente");
      router.back();
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert("Error al actualizar la entrega");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: 'center', height: '80vh' }}>
        <CircularProgress sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  if (!studentTask) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: '#64748B', fontWeight: 600 }}>
          No se encontró la entrega del estudiante.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: '100vh', py: { xs: 3, md: 5 } }}>
      <Container maxWidth="md">
        
        {/* Botón Volver */}
        <Button 
          startIcon={<ArrowBackIosNewRounded />} 
          onClick={() => router.back()}
          sx={{ mb: 3, color: '#64748B', fontWeight: 700, textTransform: 'none' }}
        >
          Volver
        </Button>

        {/* Encabezado */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.primary, letterSpacing: '-0.02em', mb: 0.5 }}>
            Corrección de Tarea
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748B', fontWeight: 500 }}>
            Estudiante: <strong>{studentTask.student.firstName} {studentTask.student.lastName}</strong> - KuaaPy
          </Typography>
        </Box>

        {/* Sección de Comentarios */}
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, mb: 3, borderRadius: '20px', border: `1px solid ${COLORS.border}`, bgcolor: '#fff' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
            <RateReviewRounded sx={{ color: COLORS.primary }} /> Comentarios y Observaciones
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={formData.comments}
            onChange={handleCommentsChange}
            placeholder="Escribe tus observaciones para el estudiante..."
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
        </Paper>

        {/* Sección de Indicadores */}
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, mb: 3, borderRadius: '20px', border: `1px solid ${COLORS.border}`, bgcolor: '#fff' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: '#0F172A' }}>
            Indicadores de Evaluación
          </Typography>
          <Stack spacing={2.5}>
            {formData.indicatorScores.map((ind, index) => (
              <Box key={ind.indicatorId} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, p: 2, bgcolor: '#F8FAFC', borderRadius: '14px', border: '1px solid #F1F5F9' }}>
                <Typography sx={{ flex: 1, fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>{ind.description}</Typography>
                <TextField
                  label="Pts"
                  type="number"
                  size="small"
                  value={ind.points}
                  onChange={(e) => handleScoreChange(index, e.target.value)}
                  sx={{ width: 110, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#fff' } }}
                />
              </Box>
            ))}
          </Stack>
        </Paper>

        {/* Sección de Estado */}
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, mb: 4, borderRadius: '20px', border: `1px solid ${COLORS.border}`, bgcolor: '#fff' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: '#0F172A' }}>
            Estado de la Entrega
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            label="Estado"
            value={formData.status}
            onChange={handleStatusChange}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          >
            <MenuItem value="pendiente">Pendiente</MenuItem>
            <MenuItem value="entregada">Entregada</MenuItem>
            <MenuItem value="corregido">Corregido</MenuItem>
          </TextField>
        </Paper>

        {/* Botón Guardar */}
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleSubmit}
          disabled={updating}
          sx={{
            bgcolor: COLORS.primary,
            borderRadius: '14px',
            py: 1.5,
            fontWeight: 800,
            textTransform: 'none',
            fontSize: '1rem',
            boxShadow: '0 8px 20px rgba(0,56,168,0.2)',
            '&:hover': { bgcolor: COLORS.primaryDark }
          }}
        >
          {updating ? "Guardando cambios..." : "Actualizar Entrega"}
        </Button>
      </Container>
    </Box>
  );
}