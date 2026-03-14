'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Typography, Container, Paper } from '@mui/material';
import Image from 'next/image';

export default function HomePage() {
  const router = useRouter();
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      // Si hay token, redirige directo al dashboard
      router.replace('/dashboard');
    } else {
      // Si no hay token, se queda en la landing page
      setCheckingToken(false);
    }
  }, [router]);

  if (checkingToken) {
    return null; // o un loader mientras verifica el token
  }

  return (
    <Container maxWidth="md" sx={{ mt: 12, textAlign: 'center' }}>
      {/* Logo */}
      <Box sx={{ mb: 4 }}>
        <Image src="/logo.png" alt="Logo" width={120} height={120} priority />
      </Box>

      {/* Bienvenida */}
      <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
        ¡Bienvenido a AulaConecta Py!
      </Typography>
      <Typography variant="h6" sx={{ color: '#555', mb: 4 }}>
        La plataforma que conecta estudiantes, docentes y padres para un aprendizaje más efectivo.
        Administra clases, materiales, seguimiento académico y mucho más desde un solo lugar.
      </Typography>

      {/* Botón iniciar sesión */}
      <Button
        variant="contained"
        color="primary"
        size="large"
        onClick={() => router.push('/auth/login')}
        sx={{ fontWeight: 'bold', textTransform: 'none', px: 5, py: 1.5 }}
      >
        Iniciar Sesión
      </Button>

      {/* Sección de info extra */}
      <Paper
        sx={{
          mt: 6,
          p: 4,
          borderRadius: 3,
          backgroundColor: '#f5f5f5',
          textAlign: 'left'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>¿Qué puedes hacer en AulaConecta Py?</Typography>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#555' }}>
          <li>Acceder a clases y materiales educativos</li>
          <li>Seguir el progreso académico de los estudiantes</li>
          <li>Gestionar inscripciones y usuarios</li>
          <li>Visualizar reportes y estadísticas de desempeño</li>
          <li>Todo desde una interfaz simple y moderna</li>
        </ul>
      </Paper>
    </Container>
  );
}
