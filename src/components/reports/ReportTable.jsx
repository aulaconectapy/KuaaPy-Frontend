'use client';

import { useState } from 'react';
import {
  Box,
  Chip,
  TextField,
  MenuItem,
  Button
} from '@mui/material';

import { DataGrid } from '@mui/x-data-grid';
import { useAuth } from '@/context/AuthContext';
import { deleteDisciplineReport } from '@/services/api';

export default function ReportTable({ reports, onDelete }) {

  const { user } = useAuth();
  const isDocente = user?.role === 'docente';

  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

  // ============================
  // ELIMINAR REPORTE
  // ============================

  const handleDelete = async (id) => {

    const confirmDelete = window.confirm(
      '¿Seguro que deseas eliminar este reporte?'
    );

    if (!confirmDelete) return;

    try {

      // Optimistic UI
      if (onDelete) onDelete(id);

      await deleteDisciplineReport(id);

    } catch (error) {

      console.error(error);
      alert('Error al eliminar el reporte');

    }
  };

  const filteredReports = reports.filter((r) => {

    const studentName =
      `${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`.toLowerCase();

    return (
      studentName.includes(search.toLowerCase()) &&
      (severityFilter ? r.severity === severityFilter : true) &&
      (statusFilter ? r.status === statusFilter : true)
    );
  });

  const rows = filteredReports.map((r) => ({
    id: r._id,
    student: `${r.student?.firstName ?? 'Desconocido'} ${r.student?.lastName ?? ''}`,
    faultType: r.faultType ?? 'N/A',
    severity: r.severity ?? 'N/A',
    status: r.status ?? 'N/A',
    date: r.date ? formatDate(r.date) : 'N/A'
  }));

  const columns = [
    { field: 'student', headerName: 'Alumno', flex: 1 },
    { field: 'faultType', headerName: 'Falta', flex: 1 },
    { field: 'severity', headerName: 'Gravedad', flex: 1 },

    {
      field: 'status',
      headerName: 'Estado',
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'Pendiente' ? 'error' : 'success'}
          size="small"
        />
      )
    },

    { field: 'date', headerName: 'Fecha', flex: 1 }
  ];

  if (isDocente) {
    columns.push({
      field: 'actions',
      headerName: 'Acciones',
      flex: 1,
      sortable: false,
      filterable: false,

      renderCell: (params) => (
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={() => handleDelete(params.id)}
        >
          Eliminar
        </Button>
      )
    });
  }

  return (
    <Box>

      {/* FILTROS */}

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 3,
          flexWrap: 'wrap'
        }}
      >
        <TextField
          label="Buscar alumno"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <TextField
          select
          label="Gravedad"
          size="small"
          value={severityFilter}
          onChange={(e) =>
            setSeverityFilter(e.target.value)
          }
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">Todas</MenuItem>
          <MenuItem value="Leve">Leve</MenuItem>
          <MenuItem value="Moderada">Moderada</MenuItem>
          <MenuItem value="Grave">Grave</MenuItem>
        </TextField>

        <TextField
          select
          label="Estado"
          size="small"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="Pendiente">Pendiente</MenuItem>
          <MenuItem value="Resuelto">Resuelto</MenuItem>
        </TextField>
      </Box>

      {/* TABLA */}

      <Box sx={{ height: 500 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={8}
          rowsPerPageOptions={[5, 8, 10]}
          disableRowSelectionOnClick
        />
      </Box>

    </Box>
  );
}