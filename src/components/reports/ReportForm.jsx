'use client';

import { useState } from 'react';
import { TextField, Button, MenuItem, Stack } from '@mui/material';

export default function ReportForm({ onSubmit, initialData = {} }) {
  const [student, setStudent] = useState(initialData.student || '');
  const [faultType, setFaultType] = useState(initialData.faultType || '');
  const [severity, setSeverity] = useState(initialData.severity || 'Leve');
  const [description, setDescription] = useState(initialData.description || '');
  const [actionTaken, setActionTaken] = useState(initialData.actionTaken || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ student, faultType, severity, description, actionTaken });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <TextField label="ID del alumno" value={student} onChange={(e) => setStudent(e.target.value)} required />
        <TextField select label="Falta" value={faultType} onChange={(e) => setFaultType(e.target.value)} required>
          {[
            "Falta de respeto al compañero",
            "Falta de respeto al docente",
            "Pelea",
            "Interrupción de clase",
            "Tarea no realizada",
            "Uso indebido de materiales",
            "Habla mucho en clases",
            "Grita en la clase",
            "Otro"
          ].map(option => <MenuItem key={option} value={option}>{option}</MenuItem>)}
        </TextField>
        <TextField select label="Gravedad" value={severity} onChange={(e) => setSeverity(e.target.value)} required>
          {["Leve", "Moderado", "Grave"].map(option => <MenuItem key={option} value={option}>{option}</MenuItem>)}
        </TextField>
        <TextField label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} multiline required />
        <TextField label="Acción tomada" value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} multiline />
        <Button variant="contained" type="submit">Guardar</Button>
      </Stack>
    </form>
  );
}