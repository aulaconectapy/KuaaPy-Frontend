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
  Divider
} from "@mui/material";

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
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!studentTask) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No se encontró la entrega del estudiante.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h5" mb={3}>
        Corrección de {studentTask.student.firstName} {studentTask.student.lastName}
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" mb={2}>
          Comentarios
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          value={formData.comments}
          onChange={handleCommentsChange}
          placeholder="Escribe tus comentarios..."
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" mb={2}>
          Indicadores
        </Typography>
        <Stack spacing={2}>
          {formData.indicatorScores.map((ind, index) => (
            <Box key={ind.indicatorId} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography sx={{ flex: 1 }}>{ind.description}</Typography>
              <TextField
                label="Pts"
                type="number"
                value={ind.points}
                onChange={(e) => handleScoreChange(index, e.target.value)}
                sx={{ width: 100 }}
              />
            </Box>
          ))}
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" mb={2}>
          Estado de la entrega
        </Typography>
        <TextField
          select
          fullWidth
          label="Estado"
          value={formData.status}
          onChange={handleStatusChange}
          SelectProps={{ native: true }}
        >
          <option value="pendiente">Pendiente</option>
          <option value="entregada">Entregada</option>
          <option value="corregido">Corregido</option>
        </TextField>
      </Paper>

      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={handleSubmit}
        disabled={updating}
      >
        {updating ? "Guardando..." : "Actualizar Entrega"}
      </Button>
    </Box>
  );
}