'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

export default function ReportCard({ report, onConfirm }) {
  const [relation, setRelation] = useState('');

  const handleConfirmClick = () => {
    if (!relation) {
      alert('Seleccione la relación del responsable');
      return;
    }
    onConfirm(report._id, relation);
  };

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Stack spacing={1}>

          {/* Nombre del alumno */}
          <Typography variant="h6">
            {report.student?.firstName} {report.student?.lastName}
          </Typography>

          {/* Falta y gravedad */}
          <Typography>Falta: {report.faultType}</Typography>
          <Typography>Gravedad: {report.severity}</Typography>

          {/* Estado con Chip */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography>Estado:</Typography>
            <Chip
              label={report.status}
              color={
                report.status === 'Pendiente'
                  ? 'error'
                  : report.status === 'Revisado'
                  ? 'success'
                  : 'warning'
              }
            />
          </Stack>

          {/* Fecha */}
          <Typography>
            Fecha: {new Date(report.date).toLocaleDateString()}
          </Typography>

          {/* Profesor */}
          <Typography>
            Profesor: {report.teacher?.firstName} {report.teacher?.lastName}
          </Typography>

          {/* Descripción */}
          {report.description && (
            <Typography>Descripción: {report.description}</Typography>
          )}

          {/* Confirmado por padres */}
          <Typography>
            Confirmado por padres: {report.parentReviewed ? 'Sí' : 'No'}
          </Typography>

          {/* Selector de relación solo si está pendiente */}
          {report.status === 'Pendiente' && (
            <FormControl fullWidth size="small" sx={{ mt: 1 }}>
              <InputLabel>Relación</InputLabel>
              <Select
                value={relation}
                label="Relación"
                onChange={(e) => setRelation(e.target.value)}
              >
                <MenuItem value="Padre">Padre</MenuItem>
                <MenuItem value="Madre">Madre</MenuItem>
                <MenuItem value="Tutor/a">Tutor/a</MenuItem>
              </Select>
            </FormControl>
          )}

          {/* Botón confirmar */}
          {report.status === 'Pendiente' && (
            <Button
              variant="contained"
              sx={{ mt: 1 }}
              onClick={handleConfirmClick}
            >
              Confirmar Recepción
            </Button>
          )}

        </Stack>
      </CardContent>
    </Card>
  );
}