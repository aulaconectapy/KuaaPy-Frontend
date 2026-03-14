'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getReportsByGrade, getAllDisciplineReports } from '@/services/api';
import ReportTable from '@/components/reports/ReportTable';
import ReportsStats from '@/components/reports/ReportsStats';
import ReportsRanking from '@/components/reports/ReportsRanking';

import {
  Typography,
  Container,
  CircularProgress,
  Box,
  Button,
  Snackbar,
  Alert
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import { useRouter } from 'next/navigation';

export default function ReportsPage() {

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    if (!authLoading && user) {
      fetchReports();
    }
  }, [user, authLoading]);

  const fetchReports = async () => {
    if (!user) return;

    setLoading(true);

    try {
      let data = [];
      const role = user.role?.toLowerCase();

      if (role === 'docente') {

        const grade = user.grades?.[0];

        if (!grade) {
          console.warn("Docente sin grado asignado");
          setReports([]);
          setLoading(false);
          return;
        }

        data = await getReportsByGrade(grade);
      }

      else if (role === 'director/a') {
        data = await getAllDisciplineReports();
      }

      setReports(data);

    } catch (error) {
      console.error('Error cargando reportes:', error);

      setSnackbar({
        open: true,
        message: 'Error al cargar los reportes',
        severity: 'error'
      });

    } finally {
      setLoading(false);
    }
  };

  // ============================
  // ELIMINAR (OPTIMISTIC UPDATE)
  // ============================

  const handleDelete = (id) => {

    setReports((prev) => prev.filter((r) => r._id !== id));

    setSnackbar({
      open: true,
      message: 'Reporte eliminado correctamente',
      severity: 'success'
    });
  };

  if (authLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>

      {/* HEADER */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography variant="h4" fontWeight="bold">
          Reportes Disciplinarios
        </Typography>

        {user?.role === 'docente' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push('/reportes/crear')}
          >
            Crear Reporte
          </Button>
        )}
      </Box>

      {/* TABLA */}

      {reports.length > 0 ? (
        <ReportTable
          reports={reports}
          onDelete={handleDelete}
        />
      ) : (
        <Typography color="text.secondary">
          No hay reportes disponibles para mostrar.
        </Typography>
      )}

      {/* RANKING */}

      {reports.length > 0 && (
        <Box mt={6}>
          <ReportsRanking reports={reports} />
        </Box>
      )}

      {/* ESTADÍSTICAS */}

      {reports.length > 0 && (
        <Box mt={6}>
          <ReportsStats reports={reports} />
        </Box>
      )}

      {/* SNACKBAR */}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar({ ...snackbar, open: false })
        }
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Container>
  );
}