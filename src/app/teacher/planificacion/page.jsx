'use client';
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  getPlanificaciones, 
  updatePlanificacion,
  updatePlanificacionStatus,
  deletePlanificacion,
  createPlanificacion 
} from "@/services/api"; 
import { 
  Container, Typography, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton,
  Alert, Dialog, DialogContent, Box, Stack, Tooltip, DialogTitle, 
  Divider, TextField, DialogActions, Badge
} from "@mui/material";
import { 
  Visibility, Edit, CheckCircle, Send, Delete, Close, 
  PictureAsPdf, AssignmentLate, Inbox
} from "@mui/icons-material";
import PlanificacionForm from "@/components/PlanificacionForm";
import { generatePlanificacionPDF } from "@/components/teacher/PdfPlanificacion";

export default function PlanificacionPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para Modales
  const [openForm, setOpenForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [openObs, setOpenObs] = useState(false);
  const [obs, setObs] = useState(""); 
  const [pendingStatus, setPendingStatus] = useState(""); 

  const isDirectivo = ['director/a', 'secretario/a', 'secretaria'].includes(user?.role?.toLowerCase());

  useEffect(() => { fetchPlans(); }, [user]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await getPlanificaciones();
      // FILTRO: El directivo NO ve borradores
      if (isDirectivo) {
        setPlans(data.filter(p => p.estado !== 'Borrador'));
      } else {
        setPlans(data);
      }
    } catch (error) {
      console.error("Error al cargar planificaciones", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedPlan(null);
  };

  // Función para aprobar o rechazar con comentario
  const confirmStatusChange = async () => {
    try {
      await updatePlanificacionStatus(selectedPlan._id, { 
        estado: pendingStatus,
        observacionesGenerales: obs 
      });
      setOpenObs(false);
      setObs("");
      handleCloseForm();
      fetchPlans();
    } catch (error) {
      alert("Error al actualizar el estado");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updatePlanificacionStatus(id, { estado: newStatus });
      fetchPlans();
    } catch (error) {
      alert("Error al procesar la solicitud");
    }
  };

  const handleSave = async (formData) => {
    try {
      if (selectedPlan?._id) {
        await updatePlanificacion(selectedPlan._id, formData);
      } else {
        await createPlanificacion(formData);
      }
      handleCloseForm();
      fetchPlans();
    } catch (error) {
      console.error("Error al guardar", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este borrador?")) {
      try {
        await deletePlanificacion(id);
        fetchPlans();
      } catch (error) {
        alert("Error al eliminar");
      }
    }
  };

  const handleDownloadPDF = (plan) => {
    generatePlanificacionPDF(plan, user);
  };

  // Contador de pendientes para el directivo
  const pendientes = plans.filter(p => p.estado === 'Enviado').length;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      
      {/* ENCABEZADO DINÁMICO */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 4, gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="900" color="#7D0F15" sx={{ fontSize: { xs: '1.8rem', md: '2.4rem' } }}>
            Gestión de Planificaciones
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {isDirectivo ? "Panel Institucional" : "Mis planes semanales"}
            </Typography>
            {isDirectivo && pendientes > 0 && (
              <Chip 
                icon={<AssignmentLate style={{ fontSize: 16 }} />} 
                label={`${pendientes} pendientes`} 
                color="error" size="small" variant="outlined" 
              />
            )}
          </Stack>
        </Box>

        {!isDirectivo && (
          <Button 
            variant="contained" 
            fullWidth={false}
            startIcon={<Edit />} 
            onClick={() => { setSelectedPlan(null); setOpenForm(true); }}
            sx={{ bgcolor: '#7D0F15', borderRadius: 2, px: 3, '&:hover': { bgcolor: '#5d0b10' } }}
          >
            Nueva Planificación
          </Button>
        )}
      </Box>

      {/* TABLA PRINCIPAL RESPONSIVA */}
      <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: "0 10px 30px rgba(0,0,0,0.05)", overflowX: 'auto' }}>
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
            {plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isDirectivo ? 5 : 4} align="center" sx={{ py: 8 }}>
                  <Inbox sx={{ fontSize: 40, color: '#ccc', mb: 1 }} />
                  <Typography color="text.secondary">
                    {loading ? "Cargando..." : "No hay planificaciones para mostrar."}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan._id} hover>
                  <TableCell sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {new Date(plan.fechaInicio).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{plan.grado}</TableCell>
                  {isDirectivo && (
                    <TableCell>{plan.profesor?.lastName}, {plan.profesor?.firstName?.charAt(0)}.</TableCell>
                  )}
                  <TableCell>
                    <Chip 
                      label={plan.estado} 
                      size="small"
                      color={plan.estado === 'Aprobado' ? 'success' : plan.estado === 'Enviado' ? 'warning' : plan.estado === 'Rechazado' ? 'error' : 'default'}
                      sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="Descargar PDF">
                        <IconButton size="small" onClick={() => handleDownloadPDF(plan)} sx={{ color: '#2e7d32' }}>
                          <PictureAsPdf fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Ver">
                        <IconButton size="small" onClick={() => { setSelectedPlan(plan); setOpenForm(true); }}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {!isDirectivo && plan.estado === 'Borrador' && (
                        <>
                          <IconButton size="small" color="primary" onClick={() => { setSelectedPlan(plan); setOpenForm(true); }}>
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="warning" onClick={() => handleStatusChange(plan._id, 'Enviado')}>
                            <Send fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(plan._id)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </>
                      )}

                      {isDirectivo && plan.estado === 'Enviado' && (
                        <Button 
                          variant="contained" color="success" size="small" 
                          onClick={() => { setSelectedPlan(plan); setOpenForm(true); }}
                          sx={{ fontSize: '0.6rem', py: 0 }}
                        >
                          Revisar
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* MODAL DEL FORMULARIO (Muestra el diseño responsivo que hicimos antes) */}
      <Dialog 
        open={openForm} 
        onClose={handleCloseForm} 
        fullScreen // Se adapta a pantalla completa en móviles automáticamente
        maxWidth="lg"
        PaperProps={{ sx: { bgcolor: '#f4f6f8' } }}
      >
        <DialogTitle component="div" sx={{ bgcolor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {selectedPlan ? `Planificación - ${selectedPlan.grado}` : "Nueva Planificación"}
            </Typography>
            {selectedPlan && <Typography variant="caption" color="text.secondary">Estado: {selectedPlan.estado}</Typography>}
          </Box>
          <IconButton onClick={handleCloseForm}><Close /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 1, md: 3 } }}>
          {selectedPlan?.observacionesGenerales && (
            <Alert severity={selectedPlan.estado === 'Aprobado' ? "success" : "info"} sx={{ mb: 3, borderRadius: 3 }}>
              <b>Observaciones de Dirección:</b> {selectedPlan.observacionesGenerales}
            </Alert>
          )}

          <PlanificacionForm 
            initialData={selectedPlan} 
            onSubmit={handleSave} 
            loading={false} 
            isReadOnly={selectedPlan && (selectedPlan.estado !== 'Borrador' && !isDirectivo)} 
          />

          {/* ACCIONES DE DIRECCIÓN DENTRO DEL MODAL */}
          {isDirectivo && selectedPlan?.estado === 'Enviado' && (
            <Box sx={{ mt: 4, p: 3, bgcolor: '#fff', borderRadius: 4, border: '1px solid #e0e0e0', textAlign: 'center' }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>¿Desea aprobar o rechazar esta planificación?</Typography>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button 
                  variant="outlined" color="error" startIcon={<Close />}
                  onClick={() => { setPendingStatus("Rechazado"); setOpenObs(true); }}
                >
                  Realizar Observación / Rechazar
                </Button>
                <Button 
                  variant="contained" color="success" startIcon={<CheckCircle />}
                  onClick={() => { setPendingStatus("Aprobado"); setOpenObs(true); }}
                >
                  Aprobar Planificación Semanal
                </Button>
              </Stack>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL DE COMENTARIOS (Aprobar/Rechazar) */}
      <Dialog open={openObs} onClose={() => setOpenObs(false)} fullWidth maxWidth="xs">
        <DialogTitle component="div">
          <Typography variant="h6" fontWeight="bold">
            {pendingStatus === "Aprobado" ? "Confirmar Aprobación" : "Añadir Observaciones"}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
            {pendingStatus === "Aprobado" 
              ? "Puedes añadir un comentario opcional de felicitaciones o sugerencias." 
              : "Es obligatorio indicar por qué se rechaza o qué debe corregir el docente."}
          </Typography>
          <TextField
            fullWidth multiline rows={4} variant="outlined"
            placeholder="Escriba aquí..."
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa' }}>
          <Button onClick={() => setOpenObs(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            color={pendingStatus === " Aprobado" ? "success" : "error"}
            onClick={confirmStatusChange}
            disabled={pendingStatus === " Rechazado" && !obs.trim()}
          >
            Confirmar    {pendingStatus}
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
}