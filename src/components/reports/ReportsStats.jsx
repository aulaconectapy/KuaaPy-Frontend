'use client';

import {
  Box,
  Paper,
  Typography,
  Grid
} from '@mui/material';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

const COLORS = ['#1976d2', '#ef5350', '#ff9800', '#4caf50'];

export default function ReportsStats({ reports }) {

  // =========================
  // GRAVEDAD
  // =========================
  const severityCount = {};

  reports.forEach((r) => {
    severityCount[r.severity] = (severityCount[r.severity] || 0) + 1;
  });

  const severityData = Object.keys(severityCount).map((key) => ({
    name: key,
    value: severityCount[key]
  }));


  // =========================
  // ESTADO
  // =========================
  const statusCount = {};

  reports.forEach((r) => {
    statusCount[r.status] = (statusCount[r.status] || 0) + 1;
  });

  const statusData = Object.keys(statusCount).map((key) => ({
    name: key,
    value: statusCount[key]
  }));


  // =========================
  // POR GRADO
  // =========================
  const gradeCount = {};

  reports.forEach((r) => {

    const grade = r.student?.grade || 'Sin grado';

    gradeCount[grade] = (gradeCount[grade] || 0) + 1;

  });

  const gradeData = Object.keys(gradeCount).map((g) => ({
    name: g,
    total: gradeCount[g]
  }));


  // =========================
  // POR MES
  // =========================
  const monthCount = {};

  reports.forEach((r) => {

    const date = new Date(r.date);

    const month = date.toLocaleString('es-ES', { month: 'short' });

    monthCount[month] = (monthCount[month] || 0) + 1;

  });

  const monthData = Object.keys(monthCount).map((m) => ({
    name: m,
    total: monthCount[m]
  }));


  return (

    <Box mb={4}>

      <Typography variant="h5" mb={3} fontWeight="bold">
        Estadísticas disciplinarias
      </Typography>

      <Grid container spacing={3}>

        {/* GRAVEDAD */}

        <Grid item xs={12} md={6}>

          <Paper sx={{ p:3 }}>

            <Typography mb={2}>
              Reportes por gravedad
            </Typography>

            <ResponsiveContainer width="100%" height={250}>

              <PieChart>

                <Pie
                  data={severityData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                >

                  {severityData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}

                </Pie>

                <Tooltip />

              </PieChart>

            </ResponsiveContainer>

          </Paper>

        </Grid>


        {/* ESTADO */}

        <Grid item xs={12} md={6}>

          <Paper sx={{ p:3 }}>

            <Typography mb={2}>
              Estado de reportes
            </Typography>

            <ResponsiveContainer width="100%" height={250}>

              <PieChart>

                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                >

                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}

                </Pie>

                <Tooltip />

              </PieChart>

            </ResponsiveContainer>

          </Paper>

        </Grid>


        {/* GRADO */}

        <Grid item xs={12} md={6}>

          <Paper sx={{ p:3 }}>

            <Typography mb={2}>
              Reportes por grado
            </Typography>

            <ResponsiveContainer width="100%" height={250}>

              <BarChart data={gradeData}>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="name" />

                <YAxis />

                <Tooltip />

                <Bar dataKey="total" fill="#1976d2" />

              </BarChart>

            </ResponsiveContainer>

          </Paper>

        </Grid>


        {/* MES */}

        <Grid item xs={12} md={6}>

          <Paper sx={{ p:3 }}>

            <Typography mb={2}>
              Reportes por mes
            </Typography>

            <ResponsiveContainer width="100%" height={250}>

              <BarChart data={monthData}>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="name" />

                <YAxis />

                <Tooltip />

                <Bar dataKey="total" fill="#ef5350" />

              </BarChart>

            </ResponsiveContainer>

          </Paper>

        </Grid>

      </Grid>

    </Box>

  );
}