'use client';

import { useState } from 'react';
import {
  Card, CardContent, Typography, Button, Chip, Stack,
  FormControl, InputLabel, Select, MenuItem, Box, Avatar, Grid, Divider
} from '@mui/material';
import {
  Gavel as GavelIcon,
  EventNote as EventIcon,
  Person as PersonIcon,
  AssignmentLate as AlertIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Security as ActionIcon,
  WarningAmber as WarningIcon
} from '@mui/icons-material';

const COLORS = {
  primary: "#7D0F15",
  primaryLight: "#a31a20",
  bgLight: "#F8FAFC",
  border: "#E2E8F0",
  success: "#059669",  // Leve
  warning: "#D97706",  // Moderado
  error: "#DC2626",    // Grave
  info: "#3B82F6"      // Medidas/Acciones
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

  // Lógica de colores y estados basada en el modelo
  const getSeverityData = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'leve': 
        return { color: COLORS.success, bg: '#F0FDF4', icon: <CheckIcon sx={{ fontSize: 18 }} /> };
      case 'moderado': 
        return { color: COLORS.warning, bg: '#FFFBEB', icon: <WarningIcon sx={{ fontSize: 18 }} /> };
      case 'grave': 
        return { color: COLORS.error, bg: '#FEF2F2', icon: <AlertIcon sx={{ fontSize: 18 }} /> };
      default: 
        return { color: COLORS.primary, bg: '#F8FAFC', icon: <InfoIcon sx={{ fontSize: 18 }} /> };
    }
  };

  const severityStyle = getSeverityData(report.severity);
  const isPendiente = report.status === 'Pendiente';

  return (
    <Card 
      elevation={0} 
      sx={{ 
        mb: 3, 
        borderRadius: 4, 
        border: `1px solid ${COLORS.border}`,
        borderLeft: `6px solid ${severityStyle.color}`, // Indicador visual lateral
        transition: '0.3s',
        overflow: 'hidden',
        '&:hover': { boxShadow: '0 8px 20px -10px rgba(0,0,0,0.1)' }
      }}
    >
      {/* HEADER: Estado y Título */}
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
            fontSize: '0.65rem' 
          }} 
        />
      </Box>

      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* COLUMNA IZQUIERDA: Info Detallada */}
          <Grid item xs={12} md={7}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 1, color: '#1E293B' }}>
              {report.student?.firstName} {report.student?.lastName}
            </Typography>
            
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ color: severityStyle.color, display: 'flex' }}>{severityStyle.icon}</Box>
                <Typography variant="body2">
                  <strong>Falta:</strong> {report.faultType} 
                  <Box component="span" sx={{ 
                    ml: 1, px: 1.5, py: 0.2, borderRadius: 5, 
                    bgcolor: severityStyle.bg, color: severityStyle.color, 
                    fontWeight: 800, fontSize: '0.7rem', border: `1px solid ${severityStyle.color}40`
                  }}>
                    {report.severity?.toUpperCase()}
                  </Box>
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventIcon sx={{ fontSize: 18, color: '#64748B' }} />
                <Typography variant="body2" color="text.secondary">
                  <strong>Fecha del Incidente:</strong> {new Date(report.date).toLocaleDateString('es-PY', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon sx={{ fontSize: 18, color: '#64748B' }} />
                <Typography variant="body2" color="text.secondary">
                  <strong>Reportado por:</strong> Prof. {report.teacher?.firstName} {report.teacher?.lastName}
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 2.5, borderStyle: 'dashed' }} />

            {/* SECCIÓN DE TEXTOS: Descripción y Medidas */}
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 900, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <InfoIcon sx={{ fontSize: 14 }} /> DESCRIPCIÓN DE LOS HECHOS
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155', bgcolor: '#F8FAFC', p: 2, borderRadius: 2, border: '1px solid #F1F5F9', fontStyle: 'italic' }}>
                  "{report.description || "No se proporcionaron detalles adicionales."}"
                </Typography>
              </Box>

              {report.actionTaken && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: COLORS.info, display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <ActionIcon sx={{ fontSize: 14 }} /> MEDIDA DISCIPLINARIA / ACCIÓN TOMADA
                  </Typography>
                  <Box sx={{ bgcolor: '#EFF6FF', p: 2, borderRadius: 2, borderLeft: `4px solid ${COLORS.info}` }}>
                    <Typography variant="body2" sx={{ color: '#1E40AF', fontWeight: 600 }}>
                      {report.actionTaken}
                    </Typography>
                  </Box>
                </Box>
              )}

              {report.observation && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B' }}>OBSERVACIONES ADICIONALES:</Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.85rem' }}>
                    {report.observation}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Grid>

          {/* COLUMNA DERECHA: Acuse de Recibo / Firma */}
          <Grid item xs={12} md={5}>
            <Box sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              p: 3, 
              bgcolor: isPendiente ? '#FFF7ED' : '#F0FDF4', 
              borderRadius: 4,
              border: `1px solid ${isPendiente ? '#FFEDD5' : '#DCFCE7'}`,
              justifyContent: 'center'
            }}>
              {!report.parentReviewed ? (
                <>
                  <Stack alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <Avatar sx={{ bgcolor: COLORS.primary, width: 48, height: 48 }}>
                      <AlertIcon />
                    </Avatar>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: COLORS.primary }}>
                      FIRMA DEL RESPONSABLE
                    </Typography>
                    <Typography variant="caption" sx={{ textAlign: 'center', color: '#9A3412', px: 2 }}>
                      Su firma confirma que ha leído y comprendido los términos de este reporte.
                    </Typography>
                  </Stack>
                  
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>¿Quién firma?</InputLabel>
                    <Select
                      value={relation}
                      label="¿Quién firma?"
                      onChange={(e) => setRelation(e.target.value)}
                      sx={{ borderRadius: 3, bgcolor: 'white' }}
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
                      borderRadius: 3, 
                      py: 1.5,
                      fontWeight: 900,
                      boxShadow: '0 4px 12px rgba(125, 15, 21, 0.2)',
                      '&:hover': { bgcolor: COLORS.primaryLight }
                    }}
                  >
                    CONFIRMAR NOTIFICACIÓN
                  </Button>
                </>
              ) : (
                <Stack alignItems="center" spacing={1.5}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar sx={{ bgcolor: COLORS.success, width: 64, height: 64 }}>
                      <CheckIcon sx={{ fontSize: 40 }} />
                    </Avatar>
                    <Box sx={{ position: 'absolute', bottom: -5, right: -5, bgcolor: 'white', borderRadius: '50%', p: 0.2 }}>
                      <CheckIcon sx={{ color: COLORS.success, fontSize: 20 }} />
                    </Box>
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: COLORS.success }}>
                    REPORTE FIRMADO
                  </Typography>
                  <Box sx={{ textAlign: 'center', width: '100%' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#065F46' }}>
                      {report.parentName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#065F46', display: 'block', mb: 1 }}>
                      Parentesco: {report.parentRelation}
                    </Typography>
                    <Divider sx={{ mb: 1, borderColor: '#A7F3D0' }} />
                    <Typography variant="caption" sx={{ color: '#065F46', fontStyle: 'italic' }}>
                      Fecha: {new Date(report.parentReviewedAt).toLocaleString('es-PY')}
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}