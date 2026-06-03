'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getReportsByGrade, getAllDisciplineReports } from '@/services/api';
import ReportTable from '@/components/reports/ReportTable';
import ReportsStats from '@/components/reports/ReportsStats';
import ReportsRanking from '@/components/reports/ReportsRanking';
// Importamos AMBAS funciones del archivo de PDF
import { generateGeneralPDF, generateIndividualPDF } from '@/components/reports/reportStudent';

import {
  Typography, Container, CircularProgress, Box, Button, Snackbar, Alert, Paper, Stack, Grid, TextField, InputAdornment
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import PrintIcon from '@mui/icons-material/Print';
import SearchIcon from '@mui/icons-material/Search';
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
  const [printFilter, setPrintFilter] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      const role = user.role?.toLowerCase();
      const rolesPermitidos = ['director/a', 'secretario/a', 'docente'];

      if (!rolesPermitidos.includes(role)) {
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

if (role === 'docente') {
  data = await getReportsByGrade();
}
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

  // ============================================================
  // ESTE BOTÓN GENERA EL PDF FILTRADO (TABLA DE HISTORIAL)
  // ============================================================
  const handlePrintFiltered = () => {
    const filtered = reports.filter(r => {
      const studentFullName = `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.toLowerCase();
      return studentFullName.includes(printFilter.toLowerCase());
    });
    
    if (filtered.length === 0) {
      setSnackbar({ 
        open: true, 
        message: printFilter ? `No hay reportes para "${printFilter}"` : 'No hay datos para imprimir', 
        severity: 'warning' 
      });
      return;
    }

    // Llama a la función de tabla landscape (general o por alumno)
    generateGeneralPDF(filtered, user, printFilter);
  };

  if (authLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
        <CircularProgress sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  const role = user?.role?.toLowerCase();
  if (!['director/a', 'secretario/a', 'docente'].includes(role)) return null;

  return (
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: '100vh', py: 5 }}>
      <Container maxWidth="lg">
        
        <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 5, border: '1px solid #E2E8F0', bgcolor: 'white' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ bgcolor: `${COLORS.primary}10`, p: 1.5, borderRadius: 3, color: COLORS.primary, display: 'flex' }}>
                <HistoryEduIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#1E293B', letterSpacing: '-1px' }}>
                  Gestión Disciplinaria
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Panel de {user.role} - Reportes Institucionales.
                </Typography>
              </Box>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
              
              {/* BUSCADOR: Aquí es donde escribes el nombre del alumno */}
              <TextField 
                size="small"
                placeholder="Filtrar por alumno..."
                value={printFilter}
                onChange={(e) => setPrintFilter(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: COLORS.primary }}/>
                    </InputAdornment>
                  )
                }}
                sx={{ 
                  bgcolor: '#F1F5F9', 
                  borderRadius: 2, 
                  width: { xs: '100%', sm: '200px' },
                  '& fieldset': { border: 'none' } 
                }}
              />
              
              {/* BOTÓN: Genera el PDF con los resultados de la búsqueda de arriba */}
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrintFiltered}
                sx={{ 
                  borderColor: COLORS.primary, 
                  color: COLORS.primary, 
                  borderRadius: 3, 
                  fontWeight: 800,
                  '&:hover': { borderColor: COLORS.primaryLight, bgcolor: `${COLORS.primary}05` }
                }}
              >
                Imprimir Historial
              </Button>

              {role === 'docente' && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => router.push('/reportes/crear')}
                  sx={{ 
                    bgcolor: COLORS.primary, borderRadius: 3, px: 3, py: 1.2, fontWeight: 800,
                    boxShadow: `0 4px 14px 0 rgba(125, 15, 21, 0.39)`,
                    '&:hover': { bgcolor: COLORS.primaryLight }
                  }}
                >
                  Nuevo
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>

        <Stack spacing={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 5, border: '1px solid #E2E8F0' }}>
            {/* IMPORTANTE: Tu componente ReportTable debe tener un botón para 
               llamar a generateIndividualPDF(reporte) para imprimir cada acta.
            */}
            <ReportTable 
              reports={reports} 
              onDelete={handleDelete} 
              onPrintIndividual={(report) => generateIndividualPDF(report)} 
            />
          </Paper>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}><ReportsRanking reports={reports} /></Grid>
            <Grid item xs={12} md={6}><ReportsStats reports={reports} /></Grid>
          </Grid>
        </Stack>

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