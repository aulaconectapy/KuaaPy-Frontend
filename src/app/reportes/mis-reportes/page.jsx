'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMyDisciplineReports, confirmDisciplineReport } from '@/services/api';
import ReportCard from '@/components/reports/ReportCard';
import { Container, Typography, CircularProgress, Box, Stack, Paper, Divider } from '@mui/material';
import { AssignmentLate as ReportIcon } from '@mui/icons-material';

const COLORS = {
  primary: "#7D0F15",
  primaryLight: "#a31a20",
  bgLight: "#F8FAFC"
};

export default function MyReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      fetchReports();
    }
  }, [user, authLoading]);

  const fetchReports = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getMyDisciplineReports();
      setReports(data);
    } catch (error) {
      console.error('Error cargando mis reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id, relation) => {
    if (!user) return;
    try {
      await confirmDisciplineReport(id, {
        parentName: `${user.firstName} ${user.lastName}`,
        parentRelation: relation,
      });
      fetchReports();
    } catch (error) {
      console.error('Error confirmando reporte:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: '100vh', py: 5 }}>
      <Container maxWidth="md">
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
          <Box sx={{ bgcolor: COLORS.primary, p: 1.5, borderRadius: 3, color: 'white', display: 'flex' }}>
            <ReportIcon />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#1E293B', letterSpacing: '-1px' }}>
              Mis Reportes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Registro oficial de conducta y notificaciones.
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ mb: 4 }} />

        {reports.length > 0 ? (
          <Stack spacing={1}>
            {reports.map((report, index) => (
              <ReportCard 
                key={report._id} 
                report={report} 
                onConfirm={handleConfirm} 
                // Esto hace que el primer reporte creado sea el Nº 1
                reportNumber={reports.length - index} 
              />
            ))}
          </Stack>
        ) : (
          <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 6, border: '2px dashed #E2E8F0', bgcolor: 'transparent' }}>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
              Sin reportes registrados
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tu historial de conducta está limpio.
            </Typography>
          </Paper>
        )}
      </Container>
    </Box>
  );
}