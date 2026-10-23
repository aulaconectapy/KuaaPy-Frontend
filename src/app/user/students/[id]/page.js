'use client';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StudentForm from "@/components/StudenForm";
import { Box, Container, Typography, Paper, Button, CircularProgress } from "@mui/material";
import { ArrowBackIosNewRounded } from "@mui/icons-material";

// CONSTANTES DE ESTILO KUAAPY
const COLORS = {
  primary: "#0038A8",     // Azul principal KuaaPy
  primaryDark: "#00257A", // Azul oscuro
  bgLight: "#F8FAFC",
  border: "#E2E8F0"
};

const EditStudentPage = ({ params }) => {
  const router = useRouter();
  const [studentId, setStudentId] = useState(null);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params; // Resolver params como Promise
      setStudentId(resolvedParams.id); // Acceder a la propiedad id
    };

    resolveParams();
  }, [params]);

  const handleSuccess = () => {
    router.push("/user/students");
  };

  return (
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: '100vh', py: { xs: 3, md: 5 } }}>
      <Container maxWidth="md">
        
        {/* Botón Volver */}
        <Button 
          startIcon={<ArrowBackIosNewRounded />} 
          onClick={() => router.back()}
          sx={{ mb: 3, color: '#64748B', fontWeight: 700, textTransform: 'none' }}
        >
          Volver al listado
        </Button>

        {/* Tarjeta contenedora del formulario */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 3, md: 5 }, 
            borderRadius: '24px', 
            border: `1px solid ${COLORS.border}`,
            bgcolor: '#fff',
            boxShadow: '0 10px 30px rgba(0,56,168,0.04)'
          }}
        >
          <Box sx={{ mb: 4, pb: 3, borderBottom: `1px solid ${COLORS.border}` }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.primary, letterSpacing: '-0.02em', mb: 0.5 }}>
              Editar Estudiante
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
              Actualiza la información del expediente académico en KuaaPy.
            </Typography>
          </Box>

          {studentId ? (
            <StudentForm studentId={studentId} onSuccess={handleSuccess} />
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress sx={{ color: COLORS.primary }} />
            </Box>
          )}
        </Paper>

      </Container>
    </Box>
  );
};

export default EditStudentPage;