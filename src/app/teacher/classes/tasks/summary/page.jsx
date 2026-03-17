'use client';

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStudentsSummary } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { generateSummaryPDF } from "@/components/teacher/SummaryTask";

import {
  Box, Container, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Stack, Card, Grid,
  LinearProgress, TextField, FormControl, InputLabel, Select, MenuItem, Button
} from "@mui/material";

import {
  Search as SearchIcon,
  AssignmentTurnedIn as CorrectedIcon,
  AssignmentLate as PendingIcon,
  AccountCircle as StudentIcon,
  PictureAsPdf as PdfIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

const COLORS = {
  primary: "#7D0F15",
  success: "#059669",
  warning: "#D97706",
  error: "#DC2626",
  bgLight: "#F8FAFC",
  border: "#E2E8F0"
};

export default function AcademicSummaryPage() {

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");

  const teacherGrade = user?.grades?.[0];

  const authorizedRoles = ['director/a', 'secretario/a', 'docente', 'admin'];
  const canSeeAll = ['director/a', 'admin', 'secretario/a'].includes(user?.role?.toLowerCase());

  // Sincronizar grado del docente
  useEffect(() => {
    if (teacherGrade && user.role === 'docente') {
      setFilterGrade(teacherGrade);
    }
  }, [teacherGrade, user]);

  // Protección de ruta
  useEffect(() => {
    if (!authLoading) {

      if (!user) {
        router.push('/login');
        return;
      }

      const userRole = user.role?.toLowerCase();

      if (!authorizedRoles.includes(userRole)) {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  // Cargar datos
  useEffect(() => {

    const loadData = async () => {

      if (!user || !authorizedRoles.includes(user.role?.toLowerCase())) return;

      setLoading(true);

      try {

        const institutionId = (user?.role !== 'docente')
          ? user?.institution?._id || user?.institution
          : null;

        const data = await getStudentsSummary(filterGrade, institutionId);

        setSummary(Array.isArray(data) ? data : []);

      } catch (error) {

        console.error("Error al cargar resumen:", error);

      } finally {

        setLoading(false);

      }
    };

    if (user && !authLoading) loadData();

  }, [user, filterGrade, authLoading]);

  // Filtrar estudiantes
  const filteredData = useMemo(() => {

    return summary.filter(s =>
      `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().includes(search.toLowerCase())
    );

  }, [summary, search]);

  // Estadísticas
  const stats = useMemo(() => {

    if (summary.length === 0) return { corrected: 0, pend: 0, totalStudents: 0 };

    const corrected = summary.reduce((acc, curr) => acc + (curr.corregidas || 0), 0);
    const pends = summary.reduce((acc, curr) => acc + (curr.pendientes || 0), 0);

    return {
      corrected,
      pend: pends,
      totalStudents: summary.length
    };

  }, [summary]);

  const handleExportPDF = () => {
    generateSummaryPDF(filteredData, user, filterGrade);
  };

  if (authLoading || loading) {
    return (
      <LinearProgress
        sx={{
          bgcolor: '#F1F5F9',
          '& .MuiLinearProgress-bar': { bgcolor: COLORS.primary }
        }}
      />
    );
  }

  if (!user || !authorizedRoles.includes(user.role?.toLowerCase())) {
    return null;
  }

  return (
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: '100vh', py: 4 }}>

      <Container maxWidth="xl">

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>

          <Box>

            <Typography variant="h4" sx={{ fontWeight: 900, color: '#1E293B' }}>
              Resumen de Puntajes
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              {canSeeAll ? "Panel Institucional" : `Grado: ${teacherGrade}`}
            </Typography>

          </Box>

          <Stack direction="row" spacing={2} alignItems="center">

            <Button
              variant="contained"
              startIcon={<PdfIcon />}
              onClick={handleExportPDF}
              disabled={filteredData.length === 0}
              sx={{
                bgcolor: COLORS.primary,
                '&:hover': { bgcolor: '#5a0a0f' },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                height: 40
              }}
            >
              Exportar Reporte
            </Button>

            {canSeeAll && (
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Grado</InputLabel>

                <Select
                  value={filterGrade}
                  label="Grado"
                  onChange={(e) => setFilterGrade(e.target.value)}
                  sx={{ bgcolor: 'white', borderRadius: 2 }}
                >
                  <MenuItem value="all">Todos los Grados</MenuItem>
                  <MenuItem value="1° Grado">1° Grado</MenuItem>
                  <MenuItem value="2° Grado">2° Grado</MenuItem>
                  <MenuItem value="3° Grado">3° Grado</MenuItem>
                </Select>
              </FormControl>
            )}

            <TextField
              size="small"
              placeholder="Buscar estudiante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'gray' }} /> }}
              sx={{ bgcolor: 'white', borderRadius: 2, minWidth: 250 }}
            />

          </Stack>
        </Stack>

        <Grid container spacing={3} sx={{ mb: 4 }}>

          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, borderRadius: 4, border: `1px solid ${COLORS.border}`, boxShadow: 'none' }}>

              <Stack direction="row" spacing={2} alignItems="center">

                <Box sx={{ p: 1.5, bgcolor: '#DCFCE7', borderRadius: 3 }}>
                  <CorrectedIcon sx={{ color: COLORS.success }} />
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B' }}>
                    TAREAS CORREGIDAS
                  </Typography>

                  <Typography variant="h5" sx={{ fontWeight: 900 }}>
                    {stats.corrected}
                  </Typography>
                </Box>

              </Stack>

            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, borderRadius: 4, border: `1px solid ${COLORS.border}`, boxShadow: 'none' }}>

              <Stack direction="row" spacing={2} alignItems="center">

                <Box sx={{ p: 1.5, bgcolor: '#FEF2F2', borderRadius: 3 }}>
                  <PendingIcon sx={{ color: COLORS.error }} />
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B' }}>
                    TAREAS PENDIENTES
                  </Typography>

                  <Typography variant="h5" sx={{ fontWeight: 900 }}>
                    {stats.pend}
                  </Typography>
                </Box>

              </Stack>

            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, borderRadius: 4, border: `1px solid ${COLORS.border}`, boxShadow: 'none' }}>

              <Stack direction="row" spacing={2} alignItems="center">

                <Box sx={{ p: 1.5, bgcolor: '#F0F9FF', borderRadius: 3 }}>
                  <StudentIcon sx={{ color: '#0369A1' }} />
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B' }}>
                    ESTUDIANTES
                  </Typography>

                  <Typography variant="h5" sx={{ fontWeight: 900 }}>
                    {stats.totalStudents}
                  </Typography>
                </Box>

              </Stack>

            </Card>
          </Grid>

        </Grid>

        <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: `1px solid ${COLORS.border}`, boxShadow: 'none' }}>

          <TableContainer>

            <Table>

              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900 }}>ESTUDIANTE</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 900 }}>ENTREGAS (C/P)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 900 }}>L. COTEJO</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 900 }}>RÚBRICA</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 900 }}>RSA</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 900 }}>TOTAL PUNTOS</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 900 }}>ACCIONES</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>

                {filteredData.map((row) => (

                  <TableRow key={row._id} hover>

                    <TableCell sx={{ fontWeight: 700 }}>
                      {row.lastName?.toUpperCase()}, {row.firstName}
                    </TableCell>

                    <TableCell align="center">

                      <Stack direction="row" spacing={1} justifyContent="center">

                        <Chip label={row.corregidas || 0} size="small" sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 800 }} />

                        <Chip label={row.pendientes || 0} size="small" sx={{ bgcolor: '#FEF2F2', color: '#991B1B', fontWeight: 800 }} />

                      </Stack>

                    </TableCell>

                    <TableCell align="center" sx={{ fontWeight: 800 }}>
                      {row.listaCotejoLogrado || 0}
                    </TableCell>

                    <TableCell align="center" sx={{ fontWeight: 800 }}>
                      {row.rubricaLogrado || 0}
                    </TableCell>

                    <TableCell align="center" sx={{ fontWeight: 800 }}>
                      {row.rsaLogrado || 0}
                    </TableCell>

                    <TableCell align="center">

                      <Chip
                        label={`${row.puntosGlobalLogrado || 0} pts`}
                        sx={{
                          bgcolor: COLORS.primary,
                          color: 'white',
                          fontWeight: 900,
                          borderRadius: 2
                        }}
                      />

                    </TableCell>

                    <TableCell align="center">

                      <Button
                        component={Link}
                        href={`/teacher/classes/students/${row._id}`}
                        variant="outlined"
                        size="small"
                        startIcon={<ViewIcon />}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          borderColor: COLORS.primary,
                          color: COLORS.primary,
                          fontWeight: 700
                        }}
                      >
                        Detalles
                      </Button>

                    </TableCell>

                  </TableRow>

                ))}

              </TableBody>

            </Table>

          </TableContainer>

        </Paper>

      </Container>

    </Box>
  );
}