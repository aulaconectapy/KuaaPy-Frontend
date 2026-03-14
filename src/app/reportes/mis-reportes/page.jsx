'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMyDisciplineReports, confirmDisciplineReport } from '@/services/api';
import ReportCard from '@/components/reports/ReportCard';
import { Container, Typography, CircularProgress, Box } from '@mui/material';

export default function MyReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===============================
  // CARGAR REPORTES DEL ESTUDIANTE
  // ===============================
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

  // ===============================
  // CONFIRMAR REPORTE
  // ===============================
  const handleConfirm = async (id, relation) => {
    if (!user) return;

    if (!relation) {
      alert('Seleccione la relación del responsable');
      return;
    }

    try {
      await confirmDisciplineReport(id, {
        parentName: user.firstName || '',
        parentRelation: relation, // <-- valor válido para el enum
      });
      fetchReports();
    } catch (error) {
      console.error('Error confirmando reporte:', error);
    }
  };

  // ===============================
  // LOADER
  // ===============================
  if (authLoading || loading || !user) {
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <CircularProgress />
      </Box>
    );
  }

  // ===============================
  // RENDER
  // ===============================
  return (
    <Container>
      <Typography variant="h4" mb={3}>Mis Reportes</Typography>

      {reports.length > 0 ? (
        reports.map((report) => (
          <ReportCard key={report._id} report={report} onConfirm={handleConfirm} />
        ))
      ) : (
        <Typography variant="body1">
          No hay reportes disponibles.
        </Typography>
      )}
    </Container>
  );
}