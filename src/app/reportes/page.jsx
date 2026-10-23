'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getReportsByGrade, getAllDisciplineReports } from '@/services/api';
import ReportTable from '@/components/reports/ReportTable';
import ReportsStats from '@/components/reports/ReportsStats';
import ReportsRanking from '@/components/reports/ReportsRanking';
import { generateGeneralPDF, generateIndividualPDF } from '@/components/reports/reportStudent';

import {
  Typography, Container, CircularProgress, Box, Button, Snackbar, Alert, Paper, Stack, Grid, TextField, InputAdornment
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import PrintIcon from '@mui/icons-material/Print';
import SearchIcon from '@mui/icons-material/Search';
import { useRouter } from 'next/navigation';

// CONSTANTES DE ESTILO KUAAPY
const COLORS = {
  primary: "#0038A8",     // Azul principal KuaaPy
  primaryDark: "#00257A", // Azul oscuro
  red: "#D52B1E",         // Acento rojo
  bgLight: "#F8FAFC",
  border: "#E2E8F0",
  gradient: "linear-gradient(135deg, #0038A8 0%, #00257A 100%)"
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
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: '100vh', py: { xs: 3, md: 5 } }}>
      <Container maxWidth="lg">
        
        {/* Cabecera / Panel Principal */}
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, mb: 4, borderRadius: '24px', border: `1px solid ${COLORS.border}`, bgcolor: 'white' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={2.5}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ bgcolor: `${COLORS.primary}12`, p: 1.5, borderRadius: '14px', color: COLORS.primary, display: 'flex' }}>
                <HistoryEduIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', mb: 0.5 }}>
                  Gestión Disciplinaria
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
                  Panel de {user.role} • Reportes Institucionales en KuaaPy
                </Typography>
              </Box>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', md: 'auto' } }} alignItems="center">
              
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
                  bgcolor: '#F8FAFC', 
                  borderRadius: '12px', 
                  width: { xs: '100%', sm: '220px' },
                  '& .MuiOutlinedInput-root': { borderRadius: '12px' } 
                }}
              />
              
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrintFiltered}
                sx={{ 
                  borderColor: COLORS.primary, 
                  color: COLORS.primary, 
                  borderRadius: '12px', 
                  fontWeight: 800,
                  textTransform: 'none',
                  height: 40,
                  width: { xs: '100%', sm: 'auto' },
                  '&:hover': { borderColor: COLORS.primaryDark, bgcolor: `${COLORS.primary}08` }
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
                    bgcolor: COLORS.primary, 
                    borderRadius: '12px', 
                    px: 3, 
                    height: 40, 
                    fontWeight: 800,
                    textTransform: 'none',
                    boxShadow: '0 8px 20px rgba(0,56,168,0.2)',
                    width: { xs: '100%', sm: 'auto' },
                    '&:hover': { bgcolor: COLORS.primaryDark }
                  }}
                >
                  Nuevo
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>

        <Stack spacing={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '24px', border: `1px solid ${COLORS.border}`, bgcolor: '#fff' }}>
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
          <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: '12px', fontWeight: 700 }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}