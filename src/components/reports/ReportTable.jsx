'use client';

import { useState } from 'react';
import {
  Box, Chip, TextField, MenuItem, Button, Typography, InputAdornment, Paper, Stack, useMediaQuery, useTheme,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip, Menu, ListItemIcon, ListItemText
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useAuth } from '@/context/AuthContext';
import { deleteDisciplineReport } from '@/services/api';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EventIcon from '@mui/icons-material/EventNote';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';

// Importamos las funciones de impresión
import { generateIndividualPDF, generateFullStudentHistoryPDF } from '@/components/reports/reportStudent';

const COLORS = {
  primary: "#7D0F15",
  success: "#059669",
  warning: "#D97706",
  error: "#DC2626",
  info: "#2563EB",
  whatsapp: "#128C7E",
  copy: "#475569",
  pdf: "#E11D48"
};

export default function ReportTable({ reports = [], onDelete }) {
  const { user } = useAuth(); // <--- Extraemos el usuario logueado del contexto
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDocente = user?.role === 'docente';

  const [search, setSearch] = useState('');
  const [openWsDialog, setOpenWsDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [tempPhone, setTempPhone] = useState('');

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuReport, setMenuReport] = useState(null);

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString('es-PY', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }) : 'N/A';

  const handleOpenPrintMenu = (event, report) => {
    setAnchorEl(event.currentTarget);
    setMenuReport(report);
  };

  const handleClosePrintMenu = () => {
    setAnchorEl(null);
    setMenuReport(null);
  };

  // LLAMADAS PASANDO EL OBJETO USER
  const handlePrintSingle = () => {
    if (menuReport) generateIndividualPDF(menuReport, user);
    handleClosePrintMenu();
  };

  const handlePrintAll = () => {
    if (menuReport) {
      const studentId = menuReport.student?._id;
      const allStudentReports = (reports ?? []).filter(r => r.student?._id === studentId);
      generateFullStudentHistoryPDF(allStudentReports, menuReport.student, user);
    }
    handleClosePrintMenu();
  };

  const handleCopyText = (report) => {
    const studentName = `${report.student?.firstName || 'N/A'} ${report.student?.lastName || ''}`;
    const text = `REPORTE: ${studentName}\nFalta: ${report.faultType}\nFecha: ${formatDate(report.date)}`;
    navigator.clipboard.writeText(text);
    alert("¡Reporte copiado!");
  };

  const handleOpenWsDialog = (report) => {
    setSelectedReport(report);
    const defaultPhone = report.student?.mother?.phone || report.student?.father?.phone || "";
    setTempPhone(defaultPhone);
    setOpenWsDialog(true);
  };

  const handleSendWhatsApp = () => {
    if (!tempPhone) return;
    const message = encodeURIComponent(`Reporte de: ${selectedReport?.student?.firstName}\nFalta: ${selectedReport?.faultType}`);
    const cleanPhone = tempPhone.replace(/\D/g, ''); 
    const finalPhone = cleanPhone.startsWith('595') ? cleanPhone : `595${cleanPhone.replace(/^0/, '')}`;
    window.open(`https://api.whatsapp.com/send?phone=${finalPhone}&text=${message}`, '_blank');
    setOpenWsDialog(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar reporte?')) return;
    try {
      if (onDelete) onDelete(id);
      await deleteDisciplineReport(id);
    } catch (error) { console.error(error); }
  };

  const filteredReports = (reports ?? []).filter((r) => {
    const name = `${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const getSeverityColor = (sev) => {
    const s = sev?.toLowerCase();
    if (s === 'grave' || s === 'moderada') return COLORS.warning;
    if (s === 'muy grave') return COLORS.error;
    return COLORS.success;
  };

  const MobileView = () => (
    <Stack spacing={2}>
      {filteredReports.map((r) => (
        <Paper key={r._id} variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: '#E2E8F0' }}>
          <Stack direction="row" justifyContent="space-between" mb={1}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{r.student?.firstName} {r.student?.lastName}</Typography>
              <Typography variant="caption" color="text.secondary"><EventIcon sx={{ fontSize: 14 }} /> {formatDate(r.date)}</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            <IconButton size="small" sx={{ color: COLORS.pdf }} onClick={(e) => handleOpenPrintMenu(e, r)}><PictureAsPdfIcon /></IconButton>
            <IconButton size="small" sx={{ color: COLORS.whatsapp }} onClick={() => handleOpenWsDialog(r)}><WhatsAppIcon /></IconButton>
            <IconButton size="small" sx={{ color: COLORS.copy }} onClick={() => handleCopyText(r)}><ContentCopyIcon /></IconButton>
            {isDocente && <IconButton size="small" color="error" onClick={() => handleDelete(r._id)}><DeleteOutlineIcon /></IconButton>}
          </Stack>
        </Paper>
      ))}
    </Stack>
  );

  const columns = [
    { field: 'student', headerName: 'Alumno', flex: 1.2, renderCell: (p) => <Typography variant="body2" sx={{ fontWeight: 700 }}>{p.value}</Typography> },
    { field: 'faultType', headerName: 'Falta', flex: 1 },
    { field: 'severity', headerName: 'Gravedad', flex: 0.8, renderCell: (p) => <Chip label={p.value} size="small" sx={{ fontWeight: 800, color: getSeverityColor(p.value), bgcolor: `${getSeverityColor(p.value)}10` }} /> },
    { field: 'date', headerName: 'Fecha', flex: 0.8 },
    { 
      field: 'actions', 
      headerName: 'Acciones', 
      flex: 1.5, 
      renderCell: (p) => {
        const report = (reports ?? []).find(r => r._id === p.id);
        return (
          <Stack direction="row" spacing={1}>
            <Tooltip title="Imprimir PDF"><IconButton size="small" sx={{ color: COLORS.pdf }} onClick={(e) => handleOpenPrintMenu(e, report)}><PictureAsPdfIcon fontSize="small"/></IconButton></Tooltip>
            <Tooltip title="Enviar WhatsApp"><IconButton size="small" sx={{ color: COLORS.whatsapp }} onClick={() => handleOpenWsDialog(report)}><WhatsAppIcon fontSize="small"/></IconButton></Tooltip>
            <Tooltip title="Copiar Texto"><IconButton size="small" sx={{ color: COLORS.copy }} onClick={() => handleCopyText(report)}><ContentCopyIcon fontSize="small"/></IconButton></Tooltip>
            {isDocente && <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => handleDelete(p.id)}><DeleteOutlineIcon fontSize="small"/></IconButton></Tooltip>}
          </Stack>
        );
      }
    }
  ];

  return (
    <Box>
      <TextField placeholder="Buscar alumno..." size="small" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ mb: 4, width: '100%' }} />

      {isMobile ? <MobileView /> : (
        <Box sx={{ height: 500, width: '100%' }}>
          <DataGrid 
            rows={filteredReports.map(r => ({ 
              id: r._id, 
              student: `${r.student?.firstName || ''} ${r.student?.lastName || ''}`, 
              faultType: r.faultType, 
              severity: r.severity, 
              date: formatDate(r.date) 
            }))} 
            columns={columns} 
            disableRowSelectionOnClick 
          />
        </Box>
      )}

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClosePrintMenu}>
        <MenuItem onClick={handlePrintSingle}>
          <ListItemIcon><PictureAsPdfIcon fontSize="small" sx={{ color: COLORS.pdf }} /></ListItemIcon>
          <ListItemText primary="Imprimir acta individual" />
        </MenuItem>
        <MenuItem onClick={handlePrintAll}>
          <ListItemIcon><HistoryEduIcon fontSize="small" sx={{ color: COLORS.primary }} /></ListItemIcon>
          <ListItemText primary="Imprimir historial completo" />
        </MenuItem>
      </Menu>

      <Dialog open={openWsDialog} onClose={() => setOpenWsDialog(false)}>
        <DialogTitle sx={{ fontWeight: 900 }}>Enviar WhatsApp</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Número" value={tempPhone} onChange={(e) => setTempPhone(e.target.value)} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenWsDialog(false)}>Cancelar</Button><Button variant="contained" onClick={handleSendWhatsApp} sx={{ bgcolor: COLORS.whatsapp }}>Enviar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}