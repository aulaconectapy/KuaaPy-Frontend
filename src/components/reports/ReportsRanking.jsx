'use client';

import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Avatar
} from '@mui/material';

export default function ReportsRanking({ reports }) {

  // =========================
  // CONTAR REPORTES POR ESTUDIANTE
  // =========================

  const students = {};

  reports.forEach((r) => {

    const id = r.student?._id;

    if (!id) return;

    const name = `${r.student.firstName} ${r.student.lastName}`;

    if (!students[id]) {
      students[id] = {
        name,
        total: 0
      };
    }

    students[id].total += 1;

  });

  // =========================
  // ORDENAR
  // =========================

  const ranking = Object.values(students)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return (

    <Paper sx={{ p:3, mt:4 }}>

      <Typography variant="h6" mb={2} fontWeight="bold">
        🏆 Estudiantes con más reportes
      </Typography>

      <List>

        {ranking.map((s, index) => (

          <ListItem key={index} divider>

            <Avatar
              sx={{
                bgcolor: index < 3 ? 'warning.main' : 'primary.main',
                mr:2
              }}
            >
              {index + 1}
            </Avatar>

            <ListItemText
              primary={s.name}
              secondary={`${s.total} reportes disciplinarios`}
            />

          </ListItem>

        ))}

      </List>

    </Paper>

  );

}