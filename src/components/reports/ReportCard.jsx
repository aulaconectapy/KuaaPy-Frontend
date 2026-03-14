'use client';

import { useState } from 'react';
import {
  Card, CardContent, Typography, Button, Chip, Stack,
  FormControl, InputLabel, Select, MenuItem, Box, Avatar, Grid
} from '@mui/material';
import {
  Gavel as GavelIcon,
  EventNote as EventIcon,
  Person as PersonIcon,
  AssignmentLate as AlertIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

const COLORS = {
  primary: "#7D0F15",
  primaryLight: "#a31a20",
  bgLight: "#F8FAFC",
  border: "#E2E8F0",
  success: "#059669",
  warning: "#D97706",
  error: "#DC2626"
};

export default function ReportCard({ report, onConfirm, reportNumber }) {
  const [relation, setRelation] = useState('');

  const handleConfirmClick = () => {
    if (!relation) {
      alert('Por favor, seleccione el parentesco del responsable.');
      return;
    }
    onConfirm(report._id, relation);
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'leve': return COLORS.success;
      case 'grave': return COLORS.warning;
      case 'muy grave': return COLORS.error;
      default: return COLORS.primary;
    }
  };

  const isPendiente = report.status === 'Pendiente';

  return (
    <Card 
      elevation={0} 
      sx={{ 
        mb: 3, 
        borderRadius: 4, 
        border: `1px solid ${COLORS.border}`,
        transition: '0.3s',
        '&:hover': { boxShadow: '0 8px 20px -10px rgba(0,0,0,0.1)', borderColor: COLORS.primary }
      }}
    >
      <Box sx={{ 
        p: 2, 
        bgcolor: isPendiente ? `${COLORS.primary}05` : `${COLORS.success}05`, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: `1px solid ${COLORS.border}` 
      }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <GavelIcon sx={{ color: isPendiente ? COLORS.primary : COLORS.success, fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isPendiente ? COLORS.primary : COLORS.success, textTransform: 'uppercase' }}>
            Reporte Disciplinario Nº {reportNumber}
          </Typography>
        </Stack>
        <Chip 
          label={report.status.toUpperCase()} 
          size="small"
          sx={{ 
            bgcolor: isPendiente ? COLORS.primary : COLORS.success, 
            color: 'white', 
            fontWeight: 900, 
            fontSize: '0.6rem' 
          }} 
        />
      </Box>

      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 1, color: '#1E293B' }}>
              {report.student?.firstName} {report.student?.lastName}
            </Typography>
            
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AlertIcon sx={{ fontSize: 18, color: getSeverityColor(report.severity) }} />
                <Typography variant="body2">
                  <strong>Falta:</strong> {report.faultType} 
                  <Box component="span" sx={{ ml: 1, px: 1, borderRadius: 1, bgcolor: `${getSeverityColor(report.severity)}15`, color: getSeverityColor(report.severity), fontWeight: 700, fontSize: '0.7rem' }}>
                    {report.severity}
                  </Box>
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventIcon sx={{ fontSize: 18, color: '#64748B' }} />
                <Typography variant="body2" color="text.secondary">
                  <strong>Fecha:</strong> {new Date(report.date).toLocaleDateString('es-PY', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon sx={{ fontSize: 18, color: '#64748B' }} />
                <Typography variant="body2" color="text.secondary">
                  <strong>Profesor:</strong> {report.teacher?.firstName} {report.teacher?.lastName}
                </Typography>
              </Box>
            </Stack>

            {report.description && (
              <Box sx={{ mt: 2, p: 2, bgcolor: COLORS.bgLight, borderRadius: 2, borderLeft: `4px solid ${COLORS.border}` }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', display: 'block', mb: 0.5 }}>DESCRIPCIÓN:</Typography>
                <Typography variant="body2" sx={{ color: '#334155', fontStyle: 'italic' }}>"{report.description}"</Typography>
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={5}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 2, borderLeft: { md: `1px solid ${COLORS.border}` } }}>
              {!report.parentReviewed ? (
                <>
                  <Typography variant="caption" sx={{ fontWeight: 800, mb: 1.5, display: 'block', color: COLORS.primary, textAlign: 'center' }}>
                    CONFIRMACIÓN DEL PADRE/TUTOR
                  </Typography>
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel sx={{ '&.Mui-focused': { color: COLORS.primary } }}>Parentesco</InputLabel>
                    <Select
                      value={relation}
                      label="Parentesco"
                      onChange={(e) => setRelation(e.target.value)}
                      sx={{ borderRadius: 2, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.primary } }}
                    >
                      <MenuItem value="Padre">Padre</MenuItem>
                      <MenuItem value="Madre">Madre</MenuItem>
                      <MenuItem value="Tutor/a">Tutor/a</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleConfirmClick}
                    sx={{ 
                      bgcolor: COLORS.primary, 
                      borderRadius: 2, 
                      py: 1,
                      fontWeight: 800,
                      '&:hover': { bgcolor: COLORS.primaryLight }
                    }}
                  >
                    Confirmar Recepción
                  </Button>
                </>
              ) : (
                <Stack alignItems="center" spacing={1}>
                  <Avatar sx={{ bgcolor: `${COLORS.success}20`, color: COLORS.success }}>
                    <CheckIcon />
                  </Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: COLORS.success }}>
                    Revisado por la Familia
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Confirmado como: {report.parentRelation || 'Responsable'}
                  </Typography>
                </Stack>
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}