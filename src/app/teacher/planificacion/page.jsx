'use client';
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
// Importamos las funciones desde tu api.js
import { 
  getPlanificaciones, 
  createPlanificacion, 
  updatePlanificacion,
  updatePlanificacionStatus,
  deletePlanificacion 
} from "@/services/api"; 
import { 
  Container, Typography, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton,
  Alert, Dialog, DialogContent, TextField, Box, Stack, Tooltip, DialogActions
} from "@mui/material";
import { Visibility, Edit, CheckCircle, Send, Delete, Cancel } from "@mui/icons-material";
import PlanificacionForm from "@/components/PlanificacionForm";

export default function PlanificacionPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [obs, setObs] = useState(""); // Para comentarios del director
  const [openObs, setOpenObs] = useState(false); // Modal de aprobación
  
  const isDirectivo = ['director/a', 'secretario/a', 'secretaria'].includes(user?.role?.toLowerCase());

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    try {
      const data = await getPlanificaciones();
      setPlans(data);
    } catch (error) {
      console.error("Error al cargar planificaciones", error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updatePlanificacionStatus(id, { 
        estado: newStatus,
        observacionesGenerales: obs 
      });
      setOpenObs(false);
      setObs("");
      fetchPlans();
    } catch (error) {
      alert("Error al actualizar estado");
    }
  };

  const handleSave = async (formData) => {
    try {
      if (selectedPlan?._id) {
        await updatePlanificacion(selectedPlan._id, formData);
      } else {
        await createPlanificacion(formData);
      }
      setOpenForm(false);
      fetchPlans();
    } catch (error) {
      console.error("Error al guardar", error);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Seguro que deseas eliminar este borrador?")) {
      await deletePlanificacion(id);
      fetchPlans();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="900" color="#7D0F15">
          Gestión de Planificaciones
        </Typography>
        {!isDirectivo && (
          <Button 
            variant="contained" 
            startIcon={<Edit />} 
            onClick={() => { setSelectedPlan(null); setOpenForm(true); }}
            sx={{ bgcolor: '#7D0F15', '&:hover': { bgcolor: '#5d0b10' } }}
          >
            Nueva Planificación
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#7D0F15' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Semana</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Grado</TableCell>
              {isDirectivo && <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Docente</TableCell>}
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan._id} hover>
                <TableCell>
                  {new Date(plan.fechaInicio).toLocaleDateString()} - {new Date(plan.fechaFin).toLocaleDateString()}
                </TableCell>
                <TableCell>{plan.grado}</TableCell>
                {isDirectivo && (
                  <TableCell>{plan.profesor?.lastName}, {plan.profesor?.firstName}</TableCell>
                )}
                <TableCell>
                  <Chip 
                    label={plan.estado} 
                    size="small"
                    color={plan.estado === 'Aprobado' ? 'success' : plan.estado === 'Enviado' ? 'warning' : 'default'}
                    sx={{ fontWeight: 'bold' }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Tooltip title="Ver detalles">
                      <IconButton onClick={() => { setSelectedPlan(plan); setOpenForm(true); }}>
                        <Visibility color="action" />
                      </IconButton>
                    </Tooltip>

                    {/* Acciones para Docente */}
                    {!isDirectivo && plan.estado === 'Borrador' && (
                      <>
                        <Tooltip title="Editar">
                          <IconButton color="primary" onClick={() => { setSelectedPlan(plan); setOpenForm(true); }}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Enviar a Dirección">
                          <IconButton color="warning" onClick={() => handleStatusChange(plan._id, 'Enviado')}>
                            <Send />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton color="error" onClick={() => handleDelete(plan._id)}>
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}

                    {/* Acciones para Directivo */}
                    {isDirectivo && plan.estado === 'Enviado' && (
                      <Button 
                        variant="outlined" 
                        color="success" 
                        size="small" 
                        startIcon={<CheckCircle />}
                        onClick={() => { setSelectedPlan(plan); setOpenObs(true); }}
                      >
                        Revisar / Aprobar
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* MODAL DEL FORMULARIO (CREAR/EDITAR/VER) */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="lg">
        <DialogContent sx={{ bgcolor: '#f8f9fa' }}>
          {selectedPlan?.estado === 'Aprobado' && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Planificación Aprobada. Observaciones: {selectedPlan.observacionesGenerales || 'Ninguna'}
            </Alert>
          )}
          <PlanificacionForm 
            initialData={selectedPlan} 
            onSubmit={handleSave} 
            loading={false} 
            // Pasamos una prop para deshabilitar edición si no es borrador
            isReadOnly={selectedPlan && selectedPlan.estado !== 'Borrador'} 
          />
        </DialogContent>
      </Dialog>

      {/* MODAL DE APROBACIÓN (PARA DIRECTOR) */}
      <Dialog open={openObs} onClose={() => setOpenObs(false)}>
        <Box sx={{ p: 3, minWidth: 400 }}>
          <Typography variant="h6" gutterBottom>Revisión de Planificación</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Grado: {selectedPlan?.grado} | Docente: {selectedPlan?.profesor?.lastName}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Observaciones o sugerencias"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            sx={{ mb: 3 }}
          />
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button 
                startIcon={<Cancel />} 
                onClick={() => handleStatusChange(selectedPlan._id, 'Rechazado')}
                color="error"
            >
                Rechazar
            </Button>
            <Button 
                variant="contained" 
                startIcon={<CheckCircle />} 
                onClick={() => handleStatusChange(selectedPlan._id, 'Aprobado')}
                color="success"
            >
                Aprobar Planificación
            </Button>
          </Stack>
        </Box>
      </Dialog>
    </Container>
  );
}