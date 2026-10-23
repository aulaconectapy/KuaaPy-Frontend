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
  Dialog, DialogContent, Box, Stack, Tooltip, DialogTitle, 
  TextField, Avatar
} from "@mui/material";
import { 
  Visibility, Edit, Send, Delete, Close, 
  PictureAsPdf, AssignmentLate, Inbox, DateRange, AddRounded, EventNote
} from "@mui/icons-material";
import PlanificacionForm from "@/components/PlanificacionForm";
import { generatePlanificacionPDF, generateMassivePlanificacionPDF } from "@/components/teacher/PdfPlanificacion";

// CONSTANTES DE ESTILO KUAAPY
const COLORS = {
  primary: "#0038A8",     // Azul principal KuaaPy
  primaryDark: "#00257A", // Azul oscuro
  red: "#D52B1E",         // Acento rojo
  bgLight: "#F8FAFC",
  border: "#E2E8F0",
  gradient: "linear-gradient(135deg, #0038A8 0%, #00257A 100%)"
};

export default function PlanificacionPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

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

  const handleDownloadRangoPDF = async () => {
    if (!fechaDesde || !fechaHasta) {
      alert("Por favor, selecciona un rango de fechas.");
      return;
    }

    const inicio = new Date(fechaDesde);
    const fin = new Date(fechaHasta);

    const planesFiltrados = plans.filter(p => {
      const fechaPlan = new Date(p.fechaInicio);
      return fechaPlan >= inicio && fechaPlan <= fin;
    });

    if (planesFiltrados.length === 0) {
      alert("No hay planificaciones en este rango de fechas.");
      return;
    }

    planesFiltrados.sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio));

    const rangoTexto = `del ${inicio.toLocaleDateString()} al ${fin.toLocaleDateString()}`;
    await generateMassivePlanificacionPDF(planesFiltrados, user, rangoTexto);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedPlan(null);
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
  
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      
      {/* ENCABEZADO */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 4, gap: 2 }}>
        <Box>
          <Typography variant="h3" fontWeight="900" sx={{ color: COLORS.primary, letterSpacing: '-0.02em', mb: 0.5 }}>
            Gestión de Planificaciones
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
              {isDirectivo ? "Panel Institucional de Supervisión - KuaaPy" : "Mis planes semanales de clase"}
            </Typography>
            {isDirectivo && pendientes > 0 && (
              <Chip icon={<AssignmentLate style={{ fontSize: 16 }} />} label={`${pendientes} pendientes`} color="error" size="small" variant="outlined" sx={{ fontWeight: 700 }} />
            )}
          </Stack>
        </Box>

        {!isDirectivo && (
          <Button 
            variant="contained" 
            startIcon={<AddRounded />} 
            onClick={() => { setSelectedPlan(null); setOpenForm(true); }}
            sx={{ 
              bgcolor: COLORS.primary, 
              borderRadius: '12px', 
              px: 3, py: 1.2, 
              fontWeight: 800, 
              textTransform: 'none',
              boxShadow: '0 8px 20px rgba(0,56,168,0.2)',
              '&:hover': { bgcolor: COLORS.primaryDark } 
            }}
          >
            Nueva Planificación
          </Button>
        )}
      </Box>

      {/* FILTRO DE REPORTE ACUMULADO */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 4, borderRadius: '20px', bgcolor: '#fff', border: `1px solid ${COLORS.border}` }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: `${COLORS.primary}12`, color: COLORS.primary, width: 36, height: 36, borderRadius: '10px' }}>
              <DateRange fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight="800" sx={{ color: '#0F172A' }}>Reporte Acumulado (PDF Único)</Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>Exporta un consolidado filtrando por fecha en KuaaPy</Typography>
            </Box>
          </Box>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center" sx={{ width: { xs: '100%', md: 'auto' } }}>
            <TextField
              type="date"
              size="small"
              label="Desde"
              InputLabelProps={{ shrink: true }}
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' }, width: { xs: '100%', sm: 'auto' } }}
            />
            <TextField
              type="date"
              size="small"
              label="Hasta"
              InputLabelProps={{ shrink: true }}
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' }, width: { xs: '100%', sm: 'auto' } }}
            />
            <Button 
              variant="outlined" 
              startIcon={<PictureAsPdf />}
              onClick={handleDownloadRangoPDF}
              sx={{ 
                color: COLORS.primary, 
                borderColor: COLORS.primary, 
                borderRadius: '12px', 
                fontWeight: 800, 
                textTransform: 'none',
                height: 40,
                width: { xs: '100%', sm: 'auto' },
                '&:hover': { borderColor: COLORS.primaryDark, bgcolor: '#EFF6FF' } 
              }}
            >
              Generar PDF
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* TABLA */}
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '24px', border: `1px solid ${COLORS.border}`, overflow: 'hidden', bgcolor: '#fff' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
              <TableCell sx={{ fontWeight: 900, color: '#0F172A' }}>Semana</TableCell>
              <TableCell sx={{ fontWeight: 900, color: '#0F172A' }}>Grado</TableCell>
              {isDirectivo && <TableCell sx={{ fontWeight: 900, color: '#0F172A' }}>Docente</TableCell>}
              <TableCell sx={{ fontWeight: 900, color: '#0F172A' }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 900, color: '#0F172A' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isDirectivo ? 5 : 4} align="center" sx={{ py: 8 }}>
                  <Inbox sx={{ fontSize: 48, color: '#CBD5E1', mb: 1 }} />
                  <Typography sx={{ color: '#64748B', fontWeight: 600 }}>No hay planificaciones registradas.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.85rem' }}>
                    {`${formatDate(plan.fechaInicio)} al ${formatDate(plan.fechaFin)}`}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>{plan.grado}</TableCell>
                  {isDirectivo && (
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>{plan.profesor?.lastName}, {plan.profesor?.firstName?.charAt(0)}.</TableCell>
                  )}
                  <TableCell>
                    <Chip 
                      label={plan.estado} 
                      size="small" 
                      color={plan.estado === 'Aprobado' ? 'success' : plan.estado === 'Enviado' ? 'warning' : 'default'} 
                      sx={{ fontWeight: 800, borderRadius: '8px' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Descargar PDF">
                        <IconButton size="small" onClick={() => handleDownloadPDF(plan)} sx={{ color: '#059669', bgcolor: '#ECFDF5', p: 1, borderRadius: '10px' }}>
                          <PictureAsPdf fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Ver / Revisar">
                        <IconButton size="small" onClick={() => { setSelectedPlan(plan); setOpenForm(true); }} sx={{ color: COLORS.primary, bgcolor: '#EFF6FF', p: 1, borderRadius: '10px' }}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {!isDirectivo && plan.estado === 'Borrador' && (
                        <>
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => { setSelectedPlan(plan); setOpenForm(true); }} sx={{ color: '#475569', bgcolor: '#F1F5F9', p: 1, borderRadius: '10px' }}><Edit fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Enviar a Dirección">
                            <IconButton size="small" onClick={() => handleStatusChange(plan._id, 'Enviado')} sx={{ color: '#D97706', bgcolor: '#FEF3C7', p: 1, borderRadius: '10px' }}><Send fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton size="small" onClick={() => handleDelete(plan._id)} sx={{ color: '#EF4444', bgcolor: '#FEF2F2', p: 1, borderRadius: '10px' }}><Delete fontSize="small" /></IconButton>
                          </Tooltip>
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
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 900,
            background: COLORS.gradient,
            color: 'white',
            px: 4,
            py: 2.5
          }}
        >
          <Box component="span">
            {selectedPlan ? `Planificación - Grado: ${selectedPlan.grado}` : "Nueva Planificación - KuaaPy"}
          </Box>
          <IconButton onClick={handleCloseForm} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, md: 4 }, bgcolor: COLORS.bgLight }}>
          <PlanificacionForm initialData={selectedPlan} onSubmit={handleSave} isReadOnly={selectedPlan && (selectedPlan.estado !== 'Borrador' && !isDirectivo)} />
        </DialogContent>
      </Dialog>

    </Container>
  );
}