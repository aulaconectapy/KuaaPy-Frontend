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
  TextField, DialogActions
} from "@mui/material";
import { 
  Visibility, Edit, CheckCircle, Send, Delete, Close, 
  PictureAsPdf, AssignmentLate, Inbox, DateRange
} from "@mui/icons-material";
import PlanificacionForm from "@/components/PlanificacionForm";
// Importamos AMBAS funciones del archivo de servicios
import { generatePlanificacionPDF, generateMassivePlanificacionPDF } from "@/components/teacher/PdfPlanificacion";

export default function PlanificacionPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- NUEVOS ESTADOS PARA FILTRO DE PDF ---
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

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

  // --- NUEVA FUNCIÓN: GENERAR REPORTE ACUMULADO ---
  const handleDownloadRangoPDF = async () => {
    if (!fechaDesde || !fechaHasta) {
      alert("Por favor, selecciona un rango de fechas.");
      return;
    }

    const inicio = new Date(fechaDesde);
    const fin = new Date(fechaHasta);

    // Filtrar planes dentro del rango
    const planesFiltrados = plans.filter(p => {
      const fechaPlan = new Date(p.fechaInicio);
      return fechaPlan >= inicio && fechaPlan <= fin;
    });

    if (planesFiltrados.length === 0) {
      alert("No hay planificaciones en este rango de fechas.");
      return;
    }

    // Ordenar cronológicamente
    planesFiltrados.sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio));

    const rangoTexto = `del ${inicio.toLocaleDateString()} al ${fin.toLocaleDateString()}`;
    
    // Llamada a la función que crea UN SOLO PDF con todo
    await generateMassivePlanificacionPDF(planesFiltrados, user, rangoTexto);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedPlan(null);
  };

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

  const pendientes = plans.filter(p => p.estado === 'Enviado').length;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      
      {/* ENCABEZADO */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 4, gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="900" color="#7D0F15">
            Gestión de Planificaciones
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {isDirectivo ? "Panel Institucional" : "Mis planes semanales"}
            </Typography>
            {isDirectivo && pendientes > 0 && (
              <Chip icon={<AssignmentLate style={{ fontSize: 16 }} />} label={`${pendientes} pendientes`} color="error" size="small" variant="outlined" />
            )}
          </Stack>
        </Box>

        {!isDirectivo && (
          <Button 
            variant="contained" 
            startIcon={<Edit />} 
            onClick={() => { setSelectedPlan(null); setOpenForm(true); }}
            sx={{ bgcolor: '#7D0F15', borderRadius: 2, px: 3, '&:hover': { bgcolor: '#5d0b10' } }}
          >
            Nueva Planificación
          </Button>
        )}
      </Box>

      {/* --- SECCIÓN NUEVA: FILTRO DE REPORTE ACUMULADO --- */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: '#fdfdfd', border: '1px solid #eee' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DateRange color="action" />
            <Typography variant="subtitle2" fontWeight="bold">Reporte Acumulado (PDF Único):</Typography>
          </Box>
          
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              type="date"
              size="small"
              label="Desde"
              InputLabelProps={{ shrink: true }}
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
            <TextField
              type="date"
              size="small"
              label="Hasta"
              InputLabelProps={{ shrink: true }}
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
            <Button 
              variant="outlined" 
              startIcon={<PictureAsPdf />}
              onClick={handleDownloadRangoPDF}
              sx={{ color: '#7D0F15', borderColor: '#7D0F15', '&:hover': { borderColor: '#5d0b10', bgcolor: '#fff5f5' } }}
            >
              Generar
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* TABLA */}
      <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
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
                  <Typography color="text.secondary">No hay planificaciones.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan._id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {new Date(plan.fechaInicio).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{plan.grado}</TableCell>
                  {isDirectivo && (
                    <TableCell>{plan.profesor?.lastName}, {plan.profesor?.firstName?.charAt(0)}.</TableCell>
                  )}
                  <TableCell>
                    <Chip label={plan.estado} size="small" color={plan.estado === 'Aprobado' ? 'success' : plan.estado === 'Enviado' ? 'warning' : 'default'} />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="Descargar Semana">
                        <IconButton size="small" onClick={() => handleDownloadPDF(plan)} sx={{ color: '#2e7d32' }}>
                          <PictureAsPdf fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton size="small" onClick={() => { setSelectedPlan(plan); setOpenForm(true); }}>
                        <Visibility fontSize="small" />
                      </IconButton>
                      {!isDirectivo && plan.estado === 'Borrador' && (
                        <>
                          <IconButton size="small" color="primary" onClick={() => { setSelectedPlan(plan); setOpenForm(true); }}><Edit fontSize="small" /></IconButton>
                          <IconButton size="small" color="warning" onClick={() => handleStatusChange(plan._id, 'Enviado')}><Send fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(plan._id)}><Delete fontSize="small" /></IconButton>
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* MODAL FORMULARIO */}
      <Dialog open={openForm} onClose={handleCloseForm} fullScreen maxWidth="lg">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">
            {selectedPlan ? `Planificación - ${selectedPlan.grado}` : "Nueva Planificación"}
          </Typography>
          <IconButton onClick={handleCloseForm}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1, md: 3 }, bgcolor: '#f4f6f8' }}>
          <PlanificacionForm initialData={selectedPlan} onSubmit={handleSave} isReadOnly={selectedPlan && (selectedPlan.estado !== 'Borrador' && !isDirectivo)} />
        </DialogContent>
      </Dialog>

    </Container>
  );
}