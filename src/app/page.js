'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, Button, Typography, Container, Paper, Stack, 
  AppBar, Toolbar, Grid, Divider, Chip, List, ListItem, ListItemIcon, ListItemText,
  Avatar, Card, CardContent
} from '@mui/material';
import { 
  CheckCircle as CheckIcon, 
  Email as EmailIcon, 
  LocationOn as LocationIcon, 
  Phone as PhoneIcon,
  Groups as GroupsIcon,
  HistoryEdu as HistoryIcon,
  Gavel as GavelIcon,
  School as SchoolIcon,
  Star as StarIcon
} from '@mui/icons-material';
import Image from 'next/image';

const COLORS = {
  primary: "#7D0F15", // Granate Institucional
  secondary: "#D4AF37", // Dorado
  text: "#1E293B",
  textLight: "#64748B",
  bgLight: "#F8FAFC",
  white: "#FFFFFF"
};

export default function HomePage() {
  const router = useRouter();
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setHasToken(!!(token && token !== 'null' && token !== 'undefined'));
  }, []);

  return (
    <Box sx={{ bgcolor: COLORS.white, minHeight: '100vh' }}>
      
      {/* NAVBAR */}
      <AppBar position="sticky" sx={{ bgcolor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderBottom: `2px solid ${COLORS.primary}` }}>
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ cursor: 'pointer' }} onClick={() => router.push('/')}>
              <Image src="/logo.png" alt="Logo CPMA" width={45} height={45} priority />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, color: COLORS.primary, lineHeight: 1, fontSize: '1.2rem' }}>
                  CPMA
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.text, fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
                  María Auxiliadora
                </Typography>
              </Box>
            </Stack>
            
            <Stack direction="row" spacing={1}>
              <Button 
                variant="contained" 
                onClick={() => router.push(hasToken ? '/dashboard' : '/auth/login')}
                sx={{ 
                  bgcolor: COLORS.primary, 
                  borderRadius: '20px', 
                  fontWeight: 700, 
                  textTransform: 'none',
                  px: 3,
                  '&:hover': { bgcolor: '#5a0a0f' }
                }}
              >
                {hasToken ? "Panel de Control" : "Acceso Usuarios"}
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* HERO SECTION */}
      <Box sx={{ 
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, #4A080C 100%)`, 
        color: 'white', 
        py: { xs: 10, md: 15 },
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip label="Desde 1985" sx={{ mb: 2, color: 'white', borderColor: 'white', fontWeight: 700 }} variant="outlined" />
              <Typography variant="h1" sx={{ fontWeight: 900, mb: 2, fontSize: { xs: '2.8rem', md: '4rem' }, lineHeight: 1.1 }}>
                Colegio Privado <br/>
                <span style={{ color: COLORS.secondary }}>María Auxiliadora</span>
              </Typography>
              <Typography variant="h5" sx={{ mb: 4, fontWeight: 300, opacity: 0.9 }}>
                Formando ciudadanos competentes, éticos y emprendedores en el corazón de Itapúa.
              </Typography>
  
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ filter: 'drop-shadow(0px 20px 30px rgba(0,0,0,0.3))' }}>
                <Image src="/logo.png" alt="Escudo Institucional" width={300} height={300} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* SECCIÓN IDENTIDAD (MISIÓN/VISIÓN) */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', borderTop: `5px solid ${COLORS.primary}`, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <StarIcon sx={{ fontSize: 50, color: COLORS.primary, mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>Misión</Typography>
                <Typography variant="body1" color="text.secondary">
                  Ofrecer a todos los estudiantes una educación de calidad que permita lograr el pleno desarrollo de sus capacidades personales, laborales y sociales.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', borderTop: `5px solid ${COLORS.secondary}`, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <SchoolIcon sx={{ fontSize: 50, color: COLORS.secondary, mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>Visión</Typography>
                <Typography variant="body1" color="text.secondary">
                  Ser una Institución referente que brinda servicios educativos de calidad, formando ciudadanos éticos y comprometidos con el progreso del país.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', borderTop: `5px solid ${COLORS.primary}`, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, textAlign: 'center' }}>Nuestros Valores</Typography>
                <Grid container spacing={1}>
                  {['Respeto', 'Gratitud', 'Resiliencia', 'Honestidad', 'Patriotismo', 'Cooperación'].map((v) => (
                    <Grid item xs={6} key={v}>
                      <Chip label={v} sx={{ width: '100%', fontWeight: 600 }} />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* HISTORIA */}
      <Box sx={{ bgcolor: COLORS.bgLight, py: 10 }}>
        <Container maxWidth="md">
          <Stack alignItems="center" spacing={2} sx={{ mb: 6 }}>
            <HistoryIcon sx={{ fontSize: 40, color: COLORS.primary }} />
            <Typography variant="h3" sx={{ fontWeight: 900, textAlign: 'center' }}>Nuestra Historia</Typography>
            <Divider sx={{ width: 80, height: 4, bgcolor: COLORS.primary, borderRadius: 2 }} />
          </Stack>
          
          <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
            <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 3, textAlign: 'justify' }}>
              La <strong>Escuela Básica Nº 2614</strong> nació el 9 de marzo de 1985 con solo 22 alumnos, bajo la dirección de la Prof. Celia Cristina Galeano. Este fue el cimiento para que en 1991 se fundara el <strong>Colegio Privado María Auxiliadora</strong>.
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 3, textAlign: 'justify' }}>
              En sus inicios, las clases se desarrollaban a la luz de <strong>faroles a gas</strong>, demostrando el espíritu resiliente de nuestra comunidad. Hoy, somos pioneros en el distrito implementando el <strong>Bachillerato Técnico en Contabilidad</strong>.
            </Typography>
            <Box sx={{ bgcolor: COLORS.primary, color: 'white', p: 2, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Primera Promoción de Bachilleres: 1996</Typography>
              <Typography variant="caption">Denominada "Fundadores"</Typography>
            </Box>
          </Paper>
        </Container>
      </Box>

      {/* ORGANIZACIÓN Y EQUIPO */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 5, textAlign: 'center', color: COLORS.primary }}>Liderazgo y Organización</Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 3, borderLeft: `6px solid ${COLORS.primary}` }}>
                <Avatar sx={{ bgcolor: COLORS.primary, width: 56, height: 56 }}>CG</Avatar>
                <Box>
                  <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 800 }}>DIRECTORA GENERAL</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Prof. Celia Cristina Galeano</Typography>
                </Box>
              </Paper>
              <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 3, borderLeft: `6px solid ${COLORS.secondary}` }}>
                <Avatar sx={{ bgcolor: COLORS.secondary, width: 56, height: 56 }}>CV</Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#9a7d1a' }}>COORDINACIÓN PEDAGÓGICA</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Prof. Celia Maria Villalba</Typography>
                </Box>
              </Paper>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Estamentos Institucionales</Typography>
            <List>
              <ListItem>
                <ListItemIcon><GroupsIcon color="primary"/></ListItemIcon>
                <ListItemText primary="ACE (Asociación de Padres)" secondary="Presidenta 2024: Sra. Sirley Ludwig" />
              </ListItem>
              <ListItem>
                <ListItemIcon><SchoolIcon color="primary"/></ListItemIcon>
                <ListItemText primary="Centro de Estudiantes" secondary="Presidenta: Celena Espínola" />
              </ListItem>
              <ListItem>
                <ListItemIcon><GroupsIcon color="primary"/></ListItemIcon>
                <ListItemText primary="Mutual de Docentes" secondary="Presidenta: Prof. María Mendoza" />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Container>

      {/* NORMAS Y COMPROMISO */}
      <Box sx={{ bgcolor: COLORS.primary, color: 'white', py: 10 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <GavelIcon sx={{ fontSize: 60, mb: 2, color: COLORS.secondary }} />
              <Typography variant="h3" sx={{ fontWeight: 900, mb: 3 }}>Normas de Convivencia</Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 4, fontSize: '1.1rem' }}>
                La matriculación implica el compromiso de conocer y respetar nuestra identidad institucional. 
                Buscamos garantizar la asistencia puntual, el uso correcto del uniforme y la formación integral.
              </Typography>
              <Button variant="outlined" sx={{ color: 'white', borderColor: 'white', fontWeight: 700, px: 4 }}>
                Descargar Reglamento
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 4, bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: 'white' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Compromiso del Tutor</Typography>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2}>
                    <CheckIcon sx={{ color: COLORS.secondary }} />
                    <Typography variant="body2">Garantizar la asistencia puntual y buena conducta.</Typography>
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    <CheckIcon sx={{ color: COLORS.secondary }} />
                    <Typography variant="body2">Participar activamente en reuniones y jornadas.</Typography>
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    <CheckIcon sx={{ color: COLORS.secondary }} />
                    <Typography variant="body2">Mantener al día las obligaciones administrativas.</Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* FOOTER / CONTACTO */}
      <Box sx={{ bgcolor: COLORS.white, pt: 10, pb: 5 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} sx={{ mb: 5 }}>
            <Grid item xs={12} md={4}>
              <Image src="/logo.png" alt="Logo" width={60} height={60} />
              <Typography variant="h6" sx={{ mt: 2, fontWeight: 900, color: COLORS.primary }}>CPMA</Typography>
              <Typography variant="body2" color="text.secondary">
                Gral. Bernardino Caballero y Mcal. F. S. López<br/>
                Barrio San Juan, María Auxiliadora<br/>
                Itapúa - Paraguay
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Contacto</Typography>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PhoneIcon fontSize="small" color="primary" />
                  <Typography variant="body2">+595 XXX XXX XXX</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <EmailIcon fontSize="small" color="primary" />
                  <Typography variant="body2"></Typography>
                </Stack>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Síguenos</Typography>
              <Stack direction="row" spacing={2}>
                <Button variant="outlined" component="a" href="https://www.facebook.com/cpma.mariaauxiliadora/" target="_blank">Facebook</Button>
                <Button variant="outlined" component="a" href="https://www.instagram.com/cpma.itapua/" target="_blank">Instagram</Button>
              </Stack>
            </Grid>
          </Grid>
          <Divider sx={{ mb: 4 }} />

        </Container>
      </Box>
    </Box>
  );
}