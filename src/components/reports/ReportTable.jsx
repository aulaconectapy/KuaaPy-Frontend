'use client';

import { useState } from 'react';
import {
  Box, Chip, TextField, Button, Typography, Paper, Stack, useMediaQuery, useTheme,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,MenuItem, Tooltip, Menu, ListItemIcon, ListItemText
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
  const { user } = useAuth();
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
    return COLORS.success;
  };

  const getStatusColor = (status) => {
    if (status === 'Pendiente') return COLORS.warning;
    if (status === 'Atendido') return COLORS.success;
    if (status === 'Cerrado') return "#64748B";
    return COLORS.info;
  };

  const MobileView = () => (
    <Stack spacing={2}>
      {filteredReports.map((r) => (
        <Paper key={r._id} sx={{ p: 2, borderRadius: 3 }}>
          <Typography fontWeight={800}>
            {r.student?.firstName} {r.student?.lastName}
          </Typography>

          <Typography variant="caption">
            <EventIcon sx={{ fontSize: 14 }} /> {formatDate(r.date)}
          </Typography>

          {/* 👇 ESTADO */}
          <Box mt={1}>
            <Chip
              label={r.status || 'Pendiente'}
              size="small"
              sx={{
                fontWeight: 800,
                color: getStatusColor(r.status),
                bgcolor: `${getStatusColor(r.status)}20`
              }}
            />
          </Box>
        </Paper>
      ))}
    </Stack>
  );

  const columns = [
    { field: 'student', headerName: 'Alumno', flex: 1.2 },
    { field: 'faultType', headerName: 'Falta', flex: 1 },
    {
      field: 'severity',
      headerName: 'Gravedad',
      flex: 0.8,
      renderCell: (p) => (
        <Chip
          label={p.value}
          size="small"
          sx={{
            fontWeight: 800,
            color: getSeverityColor(p.value),
            bgcolor: `${getSeverityColor(p.value)}20`
          }}
        />
      )
    },
    {
      field: 'status',
      headerName: 'Estado',
      flex: 1,
      renderCell: (p) => (
        <Chip
          label={p.value || 'Pendiente'}
          size="small"
          sx={{
            fontWeight: 800,
            color: getStatusColor(p.value),
            bgcolor: `${getStatusColor(p.value)}20`
          }}
        />
      )
    },
    { field: 'date', headerName: 'Fecha', flex: 0.8 },
    {
      field: 'actions',
      headerName: 'Acciones',
      flex: 1.5,
      renderCell: (p) => {
        const report = reports.find(r => r._id === p.id);
        return (
          <Stack direction="row">
            <IconButton onClick={(e) => handleOpenPrintMenu(e, report)}>
              <PictureAsPdfIcon />
            </IconButton>
            {isDocente && (
              <IconButton color="error" onClick={() => handleDelete(p.id)}>
                <DeleteOutlineIcon />
              </IconButton>
            )}
          </Stack>
        );
      }
    }
  ];

  return (
    <Box>
      <TextField
        placeholder="Buscar alumno..."
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 4, width: '100%' }}
      />

      {isMobile ? <MobileView /> : (
        <Box sx={{ height: 500 }}>
          <DataGrid
            rows={filteredReports.map(r => ({
              id: r._id,
              student: `${r.student?.firstName || ''} ${r.student?.lastName || ''}`,
              faultType: r.faultType,
              severity: r.severity,
              status: r.status, // 👈 IMPORTANTE
              date: formatDate(r.date)
            }))}
            columns={columns}
          />
        </Box>
      )}

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClosePrintMenu}>
        <MenuItem onClick={handlePrintSingle}>
          <ListItemIcon><PictureAsPdfIcon /></ListItemIcon>
          <ListItemText primary="Imprimir acta individual" />
        </MenuItem>
        <MenuItem onClick={handlePrintAll}>
          <ListItemIcon><HistoryEduIcon /></ListItemIcon>
          <ListItemText primary="Historial completo" />
        </MenuItem>
      </Menu>
    </Box>
  );
}