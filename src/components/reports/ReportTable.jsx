'use client';

import { useState } from 'react';
import {
  Box, Chip, TextField, MenuItem, Button, Typography, InputAdornment, Paper, Stack, useMediaQuery, useTheme
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useAuth } from '@/context/AuthContext';
import { deleteDisciplineReport } from '@/services/api';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EventIcon from '@mui/icons-material/EventNote';

const COLORS = {
  primary: "#7D0F15",
  success: "#059669",
  warning: "#D97706",
  error: "#DC2626",
  info: "#2563EB"
};

export default function ReportTable({ reports, onDelete }) {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Detecta si es celular
  const isDocente = user?.role === 'docente';

  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('es-PY', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('¿Seguro que deseas eliminar este reporte?');
    if (!confirmDelete) return;
    try {
      if (onDelete) onDelete(id);
      await deleteDisciplineReport(id);
    } catch (error) {
      console.error(error);
    }
  };

  const filteredReports = reports.filter((r) => {
    const studentName = `${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`.toLowerCase();
    return (
      studentName.includes(search.toLowerCase()) &&
      (severityFilter ? r.severity === severityFilter : true) &&
      (statusFilter ? r.status === statusFilter : true)
    );
  });

  const getSeverityColor = (sev) => {
    const s = sev?.toLowerCase();
    if (s === 'grave' || s === 'moderada') return COLORS.warning;
    if (s === 'muy grave') return COLORS.error;
    if (s === 'leve') return COLORS.success;
    return COLORS.info;
  };

  // --- VISTA PARA CELULARES (Cards) ---
  const MobileView = () => (
    <Stack spacing={2}>
      {filteredReports.map((r) => (
        <Paper key={r._id} variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: '#E2E8F0' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1E293B' }}>
                {r.student?.firstName} {r.student?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <EventIcon sx={{ fontSize: 14 }} /> {formatDate(r.date)}
              </Typography>
            </Box>
            <Chip 
              label={r.status.toUpperCase()} 
              size="small" 
              sx={{ fontWeight: 900, fontSize: '0.6rem', bgcolor: r.status === 'Pendiente' ? `${COLORS.primary}10` : `${COLORS.success}10`, color: r.status === 'Pendiente' ? COLORS.primary : COLORS.success }}
            />
          </Stack>
          
          <Typography variant="body2" sx={{ mb: 1.5, color: '#475569' }}>
            <strong>Falta:</strong> {r.faultType}
          </Typography>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Chip 
              label={r.severity} 
              size="small" 
              sx={{ fontWeight: 800, color: getSeverityColor(r.severity), bgcolor: `${getSeverityColor(r.severity)}10` }} 
            />
            {isDocente && (
              <Button size="small" color="error" startIcon={<DeleteOutlineIcon />} onClick={() => handleDelete(r._id)}>
                Borrar
              </Button>
            )}
          </Stack>
        </Paper>
      ))}
    </Stack>
  );

  // --- COLUMNAS PARA PC ---
  const columns = [
    { field: 'student', headerName: 'Alumno', flex: 1.2, renderCell: (p) => <Typography variant="body2" sx={{ fontWeight: 700 }}>{p.value}</Typography> },
    { field: 'faultType', headerName: 'Falta', flex: 1 },
    { field: 'severity', headerName: 'Gravedad', flex: 0.8, renderCell: (p) => <Chip label={p.value} size="small" sx={{ fontWeight: 800, color: getSeverityColor(p.value), bgcolor: `${getSeverityColor(p.value)}10` }} /> },
    { field: 'status', headerName: 'Estado', flex: 0.8, renderCell: (p) => <Chip label={p.value} size="small" sx={{ fontWeight: 900, bgcolor: p.value === 'Pendiente' ? `${COLORS.primary}10` : `${COLORS.success}10`, color: p.value === 'Pendiente' ? COLORS.primary : COLORS.success }} /> },
    { field: 'date', headerName: 'Fecha', flex: 0.8 }
  ];

  if (isDocente) {
    columns.push({
      field: 'actions', headerName: 'Acciones', flex: 0.7, sortable: false,
      renderCell: (p) => <Button color="error" size="small" startIcon={<DeleteOutlineIcon />} onClick={() => handleDelete(p.id)}>Borrar</Button>
    });
  }

  const rows = filteredReports.map((r) => ({
    id: r._id,
    student: `${r.student?.firstName ?? 'N/A'} ${r.student?.lastName ?? ''}`,
    faultType: r.faultType ?? 'N/A',
    severity: r.severity ?? 'N/A',
    status: r.status ?? 'Pendiente',
    date: r.date ? formatDate(r.date) : 'N/A'
  }));

  return (
    <Box>
      {/* FILTROS */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 4 }}>
        <TextField
          placeholder="Buscar alumno..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1 }}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
        />
        <Stack direction="row" spacing={2}>
          <TextField select label="Gravedad" size="small" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} sx={{ minWidth: 120, flexGrow: 1 }}>
            <MenuItem value="">Todas</MenuItem>
            <MenuItem value="Leve">Leve</MenuItem>
            <MenuItem value="Moderada">Moderada</MenuItem>
            <MenuItem value="Grave">Grave</MenuItem>
          </TextField>
          <TextField select label="Estado" size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 120, flexGrow: 1 }}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="Pendiente">Pendiente</MenuItem>
            <MenuItem value="Resuelto">Resuelto</MenuItem>
          </TextField>
        </Stack>
      </Stack>

      {/* RENDERIZADO CONDICIONAL: Si es móvil muestra Cards, si no muestra Tabla */}
      {isMobile ? (
        <MobileView />
      ) : (
        <Box sx={{ height: 550, width: '100%', '& .MuiDataGrid-root': { border: 'none' } }}>
          <DataGrid rows={rows} columns={columns} pageSize={8} disableRowSelectionOnClick />
        </Box>
      )}
    </Box>
  );
}