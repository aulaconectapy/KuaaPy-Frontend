'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getReportsByGrade, getAllDisciplineReports } from '@/services/api';
import ReportTable from '@/components/reports/ReportTable';
import ReportsStats from '@/components/reports/ReportsStats';
import ReportsRanking from '@/components/reports/ReportsRanking';

import {
  Typography, Container, CircularProgress, Box, Button, Snackbar, Alert, Paper, Stack, Divider, Grid
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import { useRouter } from 'next/navigation';

const COLORS = {
  primary: "#7D0F15",
  primaryLight: "#a31a20",
  bgLight: "#F8FAFC"
};

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // ============================
  // SEGURIDAD Y CARGA DE DATOS
  // ============================
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      const role = user.role?.toLowerCase();
      // Definimos los roles permitidos para esta página
      const rolesPermitidos = ['director/a', 'secretario/a', 'docente'];

      if (!rolesPermitidos.includes(role)) {
        // Si el rol no es permitido (ej: alumno o padre), redirigir al dashboard
        router.push('/dashboard');
      } else {
        fetchReports();
      }
    }
  }, [user, authLoading, router]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let data = [];
      const role = user.role?.toLowerCase();

      // Lógica de obtención de datos según el rol
      if (role === 'docente') {
        const grade = user.grades?.[0];
        if (!grade) {
          setReports([]);
          setLoading(false);
          return;
        }
        data = await getReportsByGrade(grade);
      } 
      // El Secretario/a ahora tiene el mismo acceso que el Director/a
      else if (role === 'director/a' || role === 'secretario/a') {
        data = await getAllDisciplineReports();
      }

      setReports(data);
    } catch (error) {
      console.error('Error cargando reportes:', error);
      setSnackbar({ open: true, message: 'Error al cargar los reportes', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setReports((prev) => prev.filter((r) => r._id !== id));
    setSnackbar({ open: true, message: 'Reporte eliminado correctamente', severity: 'success' });
  };

  if (authLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
        <CircularProgress sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  // Renderizado nulo si el usuario no tiene rol permitido (mientras redirige)
  const role = user?.role?.toLowerCase();
  if (!['director/a', 'secretario/a', 'docente'].includes(role)) return null;

  return (
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: '100vh', py: 5 }}>
      <Container maxWidth="lg">
        
        {/* HEADER */}
        <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 5, border: '1px solid #E2E8F0', bgcolor: 'white' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ bgcolor: `${COLORS.primary}10`, p: 1.5, borderRadius: 3, color: COLORS.primary, display: 'flex' }}>
                <HistoryEduIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#1E293B', letterSpacing: '-1px' }}>
                  Gestión Disciplinaria
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Panel de {user.role} - Seguimiento de conducta institucional.
                </Typography>
              </Box>
            </Stack>

            {/* Solo los docentes pueden crear reportes desde este botón rápido */}
            {role === 'docente' && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => router.push('/reportes/crear')}
                sx={{ 
                  bgcolor: COLORS.primary, 
                  borderRadius: 3, 
                  px: 3, py: 1.2, 
                  fontWeight: 800,
                  boxShadow: `0 4px 14px 0 rgba(125, 15, 21, 0.39)`,
                  '&:hover': { bgcolor: COLORS.primaryLight }
                }}
              >
                Nuevo Reporte
              </Button>
            )}
          </Stack>
        </Paper>

        {/* CONTENIDO PRINCIPAL */}
        {reports.length > 0 ? (
          <Stack spacing={4}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 5, border: '1px solid #E2E8F0' }}>
              <ReportTable reports={reports} onDelete={handleDelete} />
            </Paper>

            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                 <ReportsRanking reports={reports} />
              </Grid>
              <Grid item xs={12} md={6}>
                 <ReportsStats reports={reports} />
              </Grid>
            </Grid>
          </Stack>
        ) : (
          <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 6, border: '2px dashed #E2E8F0', bgcolor: 'transparent' }}>
            <Typography variant="h6" color="text.secondary">No hay registros disciplinarios para mostrar.</Typography>
          </Paper>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 3 }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}