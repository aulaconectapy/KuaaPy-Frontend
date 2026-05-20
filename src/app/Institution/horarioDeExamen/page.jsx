'use client';

import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  IconButton,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Close } from '@mui/icons-material';

const COLORS = {
  primary: "#7D0F15",
  primaryDark: "#4A080C",
  bgLight: "#F8FAFC",
};

const examSchedule = [
  ["Martes", "26/05/2026", "Educación Física"],
  ["Miércoles", "27/05/2026", "Comunicación L1"],
  ["Jueves", "28/05/2026", "Inglés"],
  ["Viernes", "29/05/2026", "Expresión Artística"],
  ["Lunes", "01/06/2026", "Matemática"],
  ["Martes", "02/06/2026", "Vida Social y Trabajo"],
  ["Miércoles", "03/06/2026", "Lectura oral y dictado Comunicación L1 y Comunicación L2 (Guaraní)"],
  ["Jueves", "04/06/2026", "Comunicación L2 (Guaraní)"],
  ["Viernes", "05/06/2026", "Medio Natural y Salud"],
];

export default function HorarioExamenDialog({ open, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: { 
          borderRadius: isMobile ? 0 : 4,
          borderTop: isMobile ? 'none' : `10px solid ${COLORS.primary}`,
        }
      }}
    >
      {/* CABECERA DEL DIÁLOGO */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: COLORS.bgLight }}>
        <Box sx={{ ml: 1 }}>
          <Typography variant="h5" fontWeight={900} color={COLORS.primary}>
            Horario de Examen
          </Typography>
          <Typography variant="caption" fontWeight={700} color="text.secondary">
            Primera Etapa
          </Typography>
          <Chip
            label="1er Ciclo"
            size="small"
            sx={{
              ml: 1.5,
              bgcolor: COLORS.primary,
              color: 'white',
              fontWeight: 700,
            }}
          />
        </Box>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </Box>

      <Divider />

      {/* CONTENIDO CON LA TABLA */}
      <Box sx={{ p: isMobile ? 2 : 4, bgcolor: '#fff', overflowY: 'auto' }}>
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid #E2E8F0',
          }}
        >
          <Table size={isMobile ? "small" : "medium"}>
            <TableHead>
              <TableRow sx={{ bgcolor: COLORS.primary }}>
                <TableCell sx={{ color: 'white', fontWeight: 800, fontSize: '0.95rem' }}>Día</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 800, fontSize: '0.95rem' }}>Fecha</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 800, fontSize: '0.95rem' }}>Materia</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {examSchedule.map((item, index) => (
                <TableRow
                  key={index}
                  sx={{
                    '&:nth-of-type(even)': { bgcolor: '#F8FAFC' },
                    '&:hover': { bgcolor: '#FFF5F5' },
                  }}
                >
                  <TableCell sx={{ fontWeight: 700 }}>{item[0]}</TableCell>
                  <TableCell>{item[1]}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{item[2]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Dialog>
  );
}