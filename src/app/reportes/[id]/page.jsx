'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getReportsByStudent } from '@/services/api';
import { Container, Typography, CircularProgress } from '@mui/material';
import ReportCard from '@/components/reports/ReportCard';
import { useAuth } from '@/context/AuthContext';

export default function ReportDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await getReportsByStudent(id);
      setReport(data[0]); // asume que devuelve array
    } catch (error) {
      console.error('Error cargando reporte:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <CircularProgress />;
  if (!report) return <Typography>No se encontró el reporte</Typography>;

  return (
    <Container>
      <ReportCard report={report} />
    </Container>
  );
}