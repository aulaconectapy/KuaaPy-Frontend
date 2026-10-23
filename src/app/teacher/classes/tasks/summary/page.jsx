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

// CONSTANTES DE ESTILO KUAAPY
const COLORS = {
  primary: "#0038A8",     // Azul principal KuaaPy
  primaryDark: "#00257A", // Azul oscuro
  red: "#D52B1E",         // Acento rojo
  success: "#059669",
  warning: "#D97706",
  error: "#DC2626",
  bgLight: "#F8FAFC",
  border: "#E2E8F0",
  gradient: "linear-gradient(135deg, #0038A8 0%, #00257A 100%)"
};

export default function AcademicSummaryPage() {

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");

  const teacherGrades = user?.grades || [];
  const authorizedRoles = ['director/a', 'secretario/a', 'docente', 'administrador'];
  const canSeeAll = ['director/a', 'administrador', 'secretario/a'].includes(user?.role?.toLowerCase());

  // Sincronizar grado del docente
  useEffect(() => {
    if (user?.grades?.length && user.role === 'docente') {
      setFilterGrade(user.grades[0]);
    }
  }, [teacherGrades, user]);

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
        const institutionId = user?.institution?._id || user?.institution;
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
    return summary.filter((s) => {
      const matchesSearch =
        `${s.firstName || ''} ${s.lastName || ''}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesGrade =
        user?.role?.toLowerCase() === "docente"
          ? user?.grades?.includes(s.grade)
          : filterGrade === "all"
            ? true
            : s.grade === filterGrade;

      return matchesSearch && matchesGrade;
    });
  }, [summary, search, user, filterGrade]);

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
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: '100vh', py: { xs: 3, md: 5 } }}>
      <Container maxWidth="xl">

        {/* ENCABEZADO ADAPTABLE */}
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          justifyContent="space-between" 
          alignItems={{ xs: 'stretch', md: 'center' }} 
          spacing={2.5} 
          sx={{ mb: 4 }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.primary, letterSpacing: '-0.02em', mb: 0.5 }}>
              Resumen de Puntajes
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
              {canSeeAll ? "Panel Institucional - KuaaPy" : `Grados asignados: ${teacherGrades.join(", ")}`}
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
            
            <Button
              variant="contained"
              startIcon={<PdfIcon />}
              onClick={handleExportPDF}
              disabled={filteredData.length === 0}
              sx={{
                bgcolor: COLORS.primary,
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 800,
                px: 3,
                height: 44,
                boxShadow: '0 8px 20px rgba(0,56,168,0.2)',
                '&:hover': { bgcolor: COLORS.primaryDark },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Exportar Reporte
            </Button>

            {canSeeAll && (
              <FormControl size="small" sx={{ minWidth: 180, width: { xs: '100%', sm: 'auto' } }}>
                <InputLabel>Grado</InputLabel>
                <Select
                  value={filterGrade}
                  label="Grado"
                  onChange={(e) => setFilterGrade(e.target.value)}
                  sx={{ bgcolor: 'white', borderRadius: '12px' }}
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
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: COLORS.primary }} /> }}
              sx={{ bgcolor: 'white', borderRadius: '12px', minWidth: { xs: '100%', sm: 240 }, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

          </Stack>
        </Stack>

        {/* TARJETAS DE ESTADÍSTICAS */}
        <Grid container spacing={3} sx={{ mb: 4 }}>

          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ p: 3, borderRadius: '20px', border: `1px solid ${COLORS.border}`, bgcolor: '#fff' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ p: 1.5, bgcolor: '#DCFCE7', borderRadius: '14px', display: 'flex' }}>
                  <CorrectedIcon sx={{ color: COLORS.success }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', letterSpacing: '0.05em' }}>
                    TAREAS CORREGIDAS
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A', mt: 0.2 }}>
                    {stats.corrected}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ p: 3, borderRadius: '20px', border: `1px solid ${COLORS.border}`, bgcolor: '#fff' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ p: 1.5, bgcolor: '#FEF2F2', borderRadius: '14px', display: 'flex' }}>
                  <PendingIcon sx={{ color: COLORS.error }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', letterSpacing: '0.05em' }}>
                    TAREAS PENDIENTES
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A', mt: 0.2 }}>
                    {stats.pend}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ p: 3, borderRadius: '20px', border: `1px solid ${COLORS.border}`, bgcolor: '#fff' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ p: 1.5, bgcolor: '#EFF6FF', borderRadius: '14px', display: 'flex' }}>
                  <StudentIcon sx={{ color: COLORS.primary }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', letterSpacing: '0.05em' }}>
                    ESTUDIANTES
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A', mt: 0.2 }}>
                    {stats.totalStudents}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>

        </Grid>

        {/* TABLA DE RESUMEN */}
        <Paper elevation={0} sx={{ borderRadius: '24px', overflow: 'hidden', border: `1px solid ${COLORS.border}`, bgcolor: '#fff' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900, color: '#0F172A' }}>ESTUDIANTE</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 900, color: '#0F172A' }}>ENTREGAS (C/P)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 900, color: '#0F172A' }}>L. COTEJO</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 900, color: '#0F172A' }}>RÚBRICA</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 900, color: '#0F172A' }}>RSA</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 900, color: '#0F172A' }}>TOTAL PUNTOS</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 900, color: '#0F172A' }}>ACCIONES</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredData.map((row) => (
                  <TableRow key={row._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 700, color: '#0F172A' }}>
                      {row.lastName?.toUpperCase()}, {row.firstName}
                    </TableCell>

                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Chip label={row.corregidas || 0} size="small" sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 800, borderRadius: '6px' }} />
                        <Chip label={row.pendientes || 0} size="small" sx={{ bgcolor: '#FEF2F2', color: '#991B1B', fontWeight: 800, borderRadius: '6px' }} />
                      </Stack>
                    </TableCell>

                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569' }}>
                      {row.listaCotejoLogrado || 0}
                    </TableCell>

                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569' }}>
                      {row.rubricaLogrado || 0}
                    </TableCell>

                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569' }}>
                      {row.rsaLogrado || 0}
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        label={`${row.puntosGlobalLogrado || 0} pts`}
                        sx={{
                          bgcolor: COLORS.primary,
                          color: 'white',
                          fontWeight: 900,
                          borderRadius: '8px',
                          fontSize: '0.85rem'
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
                          borderRadius: '10px',
                          textTransform: 'none',
                          borderColor: COLORS.primary,
                          color: COLORS.primary,
                          fontWeight: 800,
                          '&:hover': { bgcolor: `${COLORS.primary}08`, borderColor: COLORS.primaryDark }
                        }}
                      >
                        Detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <Typography sx={{ color: '#64748B', fontWeight: 600 }}>
                        No se encontraron registros de estudiantes.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

      </Container>
    </Box>
  );
}