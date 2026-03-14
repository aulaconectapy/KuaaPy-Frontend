'use client';

import { useEffect, useState } from "react";
import { TextField, Button, Stack, MenuItem, Typography, Paper, IconButton, Box, CircularProgress, Container } from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { createTask, updateTask } from "@/services/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function TaskForm({ task = null }) {

  const router = useRouter();
  const { user, loading: loadingAuth } = useAuth();

  const [formData, setFormData] = useState({
    subject: "",
    topic: "",
    grade: "",
    taskType: "formativo",
    dueDate: "",
    status: "pendiente",
    indicators: [{ description: "", points: 0 }],
  });


  // =============================
  // CARGAR DATOS DEL USUARIO
  // =============================
  useEffect(() => {

    if (user) {

      if (user.grades?.length === 1 && !task) {
        setFormData((prev) => ({
          ...prev,
          grade: user.grades[0],
        }));
      }

    }

  }, [user, task]);


  // =============================
  // MODO EDICIÓN
  // =============================
  useEffect(() => {

    if (task) {

      setFormData({
        subject: task.subject || "",
        topic: task.topic || "",
        grade: task.grade || "",
        taskType: task.taskType || "formativo",
        dueDate: task.dueDate?.split("T")[0] || "",
        status: task.status || "pendiente",
        indicators: task.indicators?.length > 0 ? task.indicators : [{ description: "", points: 0 }],
      });

    }

  }, [task]);


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  const handleIndicatorChange = (index, field, value) => {

    const updated = [...formData.indicators];

    updated[index][field] = field === "points" ? Number(value) : value;

    setFormData({ ...formData, indicators: updated });

  };


  const addIndicator = () => {

    setFormData({
      ...formData,
      indicators: [...formData.indicators, { description: "", points: 0 }],
    });

  };


  const removeIndicator = (index) => {

    setFormData({
      ...formData,
      indicators: formData.indicators.filter((_, i) => i !== index),
    });

  };


  // =============================
  // SUBMIT
  // =============================
  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!user) return alert("Usuario no cargado");

    if (!formData.subject.trim() || !formData.topic.trim() || !formData.grade)
      return alert("Debe completar asignatura, tema y grado");

    const validIndicators = formData.indicators.filter(
      (ind) => ind.description.trim() && ind.points > 0
    );

    if (validIndicators.length === 0)
      return alert("Debe agregar al menos un indicador válido con puntos > 0");

    const payload = {
      ...formData,
      indicators: validIndicators,
      institution: user.institution,
      teacher: user._id,
    };

    try {

      if (task) {

        await updateTask(task._id, payload);
        alert("Tarea actualizada correctamente");

      } else {

        await createTask(payload);
        alert("Tarea creada correctamente");

      }

      router.push("/teacher/classes/tasks");

    } catch (error) {

      console.error(error);
      alert("Error al guardar la tarea");

    }

  };


  if (loadingAuth) {

    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
        <CircularProgress />
      </Box>
    );

  }


  return (

    <Container maxWidth="sm" sx={{ py: 2 }}>

      <Paper sx={{ p: 4, borderRadius: 4 }}>

        <Typography variant="h5" mb={3}>
          {task ? "Editar Tarea" : "Nueva Tarea"}
        </Typography>

        <form onSubmit={handleSubmit}>

          <Stack spacing={3}>

            <TextField
              select
              label="Asignatura"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
            >
              {[
                "Comunicación",
                "Matemáticas",
                "Medio Natural y Salud",
                "Guaraní",
                "Educación Física",
                "Educación Artística",
                "Vida Social y Trabajo",
              ].map((asig) => (
                <MenuItem key={asig} value={asig}>
                  {asig}
                </MenuItem>
              ))}
            </TextField>


            <TextField
              label="Tema"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              required
            />


            {/* TIPO DE TAREA */}

            <TextField
              select
              label="Tipo de tarea"
              name="taskType"
              value={formData.taskType}
              onChange={handleChange}
              required
            >
              <MenuItem value="diagnostico">Diagnóstico</MenuItem>
              <MenuItem value="formativo">Formativo</MenuItem>
              <MenuItem value="sumativo">Sumativo</MenuItem>
            </TextField>


            <TextField
              select
              label="Grado"
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              required
            >
              {user?.grades?.length > 0 ? (
                user.grades.map((g) => (
                  <MenuItem key={g} value={g}>
                    {g}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No hay grados asignados</MenuItem>
              )}
            </TextField>


            <TextField
              label="Entrega"
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              required
            />


            {formData.indicators.map((ind, index) => (

              <Stack key={index} direction="row" spacing={1}>

                <TextField
                  fullWidth
                  label="Descripción"
                  value={ind.description}
                  onChange={(e) =>
                    handleIndicatorChange(index, "description", e.target.value)
                  }
                />

                <TextField
                  type="number"
                  label="Pts"
                  value={ind.points}
                  onChange={(e) =>
                    handleIndicatorChange(index, "points", e.target.value)
                  }
                />

                {formData.indicators.length > 1 && (
                  <IconButton onClick={() => removeIndicator(index)}>
                    <Delete />
                  </IconButton>
                )}

              </Stack>

            ))}


            <Button startIcon={<Add />} onClick={addIndicator}>
              Agregar Indicador
            </Button>


            <Button type="submit" variant="contained">
              {task ? "Actualizar Tarea" : "Publicar Tarea"}
            </Button>

          </Stack>

        </form>

      </Paper>

    </Container>

  );

}