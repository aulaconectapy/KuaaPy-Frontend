'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

export default function ConfirmReportDialog({ open, onClose, onConfirm, report }) {
  if (!report) return null;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirmar Recepción</DialogTitle>
      <DialogContent>
        <Typography>¿Desea confirmar recepción del reporte de {report.student?.firstName}?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={() => onConfirm(report._id)}>Confirmar</Button>
      </DialogActions>
    </Dialog>
  );
}