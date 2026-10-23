'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import {
  AssignmentTurnedIn,
  CalendarMonth,
  Checklist,
  ArrowForward,
  Groups,
  Insights,
  School,
  EventAvailable,
  PhoneAndroid,
  ShieldOutlined,
  AutoAwesome,
  VerifiedUser,
  Speed,
} from '@mui/icons-material';

const C = {
  blue: '#0038A8',
  red: '#D52B1E',
  white: '#FFFFFF',
  ink: '#0F172A',
  muted: '#475569',
  bg: '#F8FAFC',
  line: '#E2E8F0',
};

const features = [
  {
    icon: <CalendarMonth />,
    title: 'Planificación docente',
    description:
      'Organizá tus clases, unidades, capacidades e indicadores con agilidad y orden profesional.',
    color: C.blue,
    tint: '#EEF2FF',
  },
  {
    icon: <Checklist />,
    title: 'Lista de asistencia',
    description:
      'Controlá presentes, ausentes y llegadas tardías al instante desde cualquier dispositivo.',
    color: C.red,
    tint: '#FEF2F2',
  },
  {
    icon: <AssignmentTurnedIn />,
    title: 'Planillas y evaluación',
    description:
      'Mantené al día los registros de calificaciones y el seguimiento detallado del curso.',
    color: '#059669',
    tint: '#ECFDF5',
  },
  {
    icon: <Insights />,
    title: 'Seguimiento académico',
    description:
      'Detectá áreas de mejora y acompañá de cerca el proceso de aprendizaje de cada estudiante.',
    color: '#7C3AED',
    tint: '#F5F3FF',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem('token');
    setHasToken(Boolean(token && token !== 'null' && token !== 'undefined'));
  }, []);

  const goToApp = () => {
    router.push(hasToken ? '/dashboard' : '/auth/login');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: C.white,
        color: C.ink,
        overflowX: 'hidden',
        fontFamily: 'inherit',
      }}
    >
      {/* ENCABEZADO VANGUARDISTA */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.85)',
          color: C.ink,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar
            disableGutters
            sx={{
              minHeight: { xs: 70, sm: 80 },
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
              <Box
                component="img"
                src="/logo.png"
                alt="Logo de KuaaPy"
                sx={{
                  width: 44,
                  height: 44,
                  objectFit: 'contain',
                  flexShrink: 0,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))',
                }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: { xs: '1.25rem', sm: '1.45rem' },
                    fontWeight: 900,
                    lineHeight: 1.1,
                    letterSpacing: '-.03em',
                  }}
                >
                  Kuaa<span style={{ color: C.red }}>Py</span>
                </Typography>
                <Typography
                  sx={{
                    color: C.muted,
                    fontSize: '.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '.08em',
                    display: { xs: 'none', sm: 'block' },
                  }}
                >
                  Gestión escolar inteligente
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                onClick={goToApp}
                variant="contained"
                endIcon={<ArrowForward />}
                sx={{
                  bgcolor: C.blue,
                  borderRadius: '12px',
                  px: { xs: 2.2, sm: 3 },
                  py: 1.2,
                  textTransform: 'none',
                  fontWeight: 800,
                  fontSize: '.92rem',
                  boxShadow: '0 8px 20px rgba(0,56,168,0.22)',
                  '&:hover': {
                    bgcolor: '#002B85',
                    boxShadow: '0 10px 25px rgba(0,56,168,0.3)',
                  },
                }}
              >
                {hasToken ? 'Mi panel' : 'Acceder al sistema'}
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* PORTADA PRINCIPAL (HERO) */}
      <Box
        sx={{
          position: 'relative',
          background:
            'radial-gradient(circle at 90% 10%, rgba(0,56,168,0.06), transparent 35%), radial-gradient(circle at 10% 80%, rgba(213,43,30,0.05), transparent 35%), linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
          pt: { xs: 6, md: 10 },
          pb: { xs: 8, md: 14 },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 6, md: 8 }} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip
                icon={<AutoAwesome sx={{ color: `${C.blue} !important` }} />}
                label="Innovación para la labor docente y administrativa"
                sx={{
                  mb: 3,
                  px: 1.5,
                  py: 2.2,
                  borderRadius: '999px',
                  bgcolor: '#EFF6FF',
                  color: C.blue,
                  fontWeight: 800,
                  fontSize: '.85rem',
                  border: '1px solid #DBEAFE',
                }}
              />

              <Typography
                component="h1"
                sx={{
                  fontSize: { xs: '2.5rem', sm: '3.4rem', md: '4.1rem' },
                  lineHeight: { xs: 1.1, md: 1.05 },
                  fontWeight: 950,
                  letterSpacing: '-.045em',
                  color: C.ink,
                }}
              >
                Simplificá tu gestión escolar.{' '}
                <Box component="span" sx={{ color: C.blue }}>
                  Potenciá
                </Box>{' '}
                el aprendizaje.
              </Typography>

              <Typography
                sx={{
                  mt: 2.5,
                  color: C.muted,
                  fontSize: { xs: '1.05rem', md: '1.18rem' },
                  lineHeight: 1.75,
                  maxWidth: 630,
                }}
              >
                KuaaPy centraliza la planificación, la asistencia y los registros
                pedagógicos en una interfaz moderna, ágil y diseñada para
                fortalecer el vínculo entre docentes, directivos y familias.
              </Typography>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ mt: 4, maxWidth: { xs: '100%', sm: 'none' } }}
              >
                <Button
                  onClick={goToApp}
                  variant="contained"
                  endIcon={<ArrowForward />}
                  sx={{
                    py: 1.6,
                    px: 3.5,
                    borderRadius: '14px',
                    bgcolor: C.blue,
                    textTransform: 'none',
                    fontSize: '1.02rem',
                    fontWeight: 800,
                    boxShadow: '0 12px 30px rgba(0,56,168,0.25)',
                    '&:hover': { bgcolor: '#002B85' },
                  }}
                >
                  {hasToken ? 'Ir a mi panel' : 'Comenzar ahora'}
                </Button>

                <Button
                  component="a"
                  href="#modulos"
                  variant="outlined"
                  sx={{
                    py: 1.6,
                    px: 3.5,
                    borderRadius: '14px',
                    borderColor: C.line,
                    color: C.ink,
                    textTransform: 'none',
                    fontSize: '1.02rem',
                    fontWeight: 800,
                    bgcolor: C.white,
                    '&:hover': {
                      borderColor: C.blue,
                      bgcolor: '#F8FAFC',
                    },
                  }}
                >
                  Explorar módulos
                </Button>
              </Stack>

              {/* Badges de confianza */}
              <Stack
                direction="row"
                spacing={3}
                sx={{ mt: 5, pt: 3, borderTop: `1px solid ${C.line}` }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <VerifiedUser sx={{ color: '#059669', fontSize: 20 }} />
                  <Typography sx={{ fontSize: '.85rem', fontWeight: 700, color: C.muted }}>
                    Datos seguros y privados
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Speed sx={{ color: C.blue, fontSize: 20 }} />
                  <Typography sx={{ fontSize: '.85rem', fontWeight: 700, color: C.muted }}>
                    Acceso rápido y fluido
                  </Typography>
                </Stack>
              </Stack>
            </Grid>

            {/* TARJETA INTERACTIVA ILUSTRATIVA */}
            <Grid item xs={12} md={5}>
              <Box sx={{ maxWidth: 420, mx: 'auto', position: 'relative' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    inset: '-6% -6% 6% 6%',
                    background: 'linear-gradient(135deg, rgba(0,56,168,0.1), rgba(213,43,30,0.08))',
                    borderRadius: '32px',
                    filter: 'blur(10px)',
                    zIndex: 0,
                  }}
                />

                <Card
                  elevation={0}
                  sx={{
                    position: 'relative',
                    borderRadius: '24px',
                    border: `1px solid ${C.line}`,
                    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.12)',
                    bgcolor: C.white,
                    zIndex: 1,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      p: 3,
                      background: `linear-gradient(135deg, ${C.blue}, #00257A)`,
                      color: C.white,
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography sx={{ fontSize: '.75rem', opacity: 0.8, fontWeight: 800, letterSpacing: '.1em' }}>
                          PANEL INSTITUCIONAL
                        </Typography>
                        <Typography sx={{ fontSize: '1.25rem', fontWeight: 900, mt: 0.5 }}>
                          KuaaPy Workspace
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: C.white, width: 42, height: 42 }}>
                        <School />
                      </Avatar>
                    </Stack>
                  </Box>

                  <CardContent sx={{ p: 3 }}>
                    <Typography sx={{ color: C.muted, fontSize: '.78rem', fontWeight: 800, mb: 2, letterSpacing: '.05em' }}>
                      MÓDULOS ACTIVOS
                    </Typography>

                    <Stack spacing={1.5}>
                      {[
                        { title: 'Planificación Semanal', desc: 'Validada por dirección', icon: <CalendarMonth />, color: C.blue, bg: '#EEF2FF' },
                        { title: 'Control de Asistencia', desc: 'Registro diario al día', icon: <EventAvailable />, color: C.red, bg: '#FEF2F2' },
                        { title: 'Evaluaciones y Notas', desc: 'Planillas automáticas', icon: <AssignmentTurnedIn />, color: '#059669', bg: '#ECFDF5' },
                      ].map((m) => (
                        <Stack
                          key={m.title}
                          direction="row"
                          spacing={2}
                          alignItems="center"
                          sx={{
                            p: 1.5,
                            borderRadius: '14px',
                            border: `1px solid ${C.line}`,
                            bgcolor: '#FAFAFA',
                          }}
                        >
                          <Avatar variant="rounded" sx={{ bgcolor: m.bg, color: m.color, width: 40, height: 40, borderRadius: '10px' }}>
                            {m.icon}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: '.9rem' }}>{m.title}</Typography>
                            <Typography sx={{ color: C.muted, fontSize: '.75rem' }}>{m.desc}</Typography>
                          </Box>
                        </Stack>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* SECCIÓN DE MÓDULOS / HERRAMIENTAS */}
      <Container id="modulos" maxWidth="lg" sx={{ py: { xs: 8, md: 12 }, scrollMarginTop: '80px' }}>
        <Stack alignItems="center" textAlign="center" sx={{ mb: { xs: 6, md: 8 } }}>
          <Typography
            sx={{
              color: C.red,
              fontWeight: 900,
              fontSize: '.82rem',
              letterSpacing: '.15em',
              textTransform: 'uppercase',
            }}
          >
            Tecnología al servicio de la educación
          </Typography>
          <Typography
            component="h2"
            sx={{
              mt: 1.5,
              fontSize: { xs: '2.1rem', md: '2.8rem' },
              fontWeight: 950,
              letterSpacing: '-.03em',
            }}
          >
            Todo lo administrativo, resuelto con elegancia.
          </Typography>
          <Typography
            sx={{
              mt: 2,
              color: C.muted,
              maxWidth: 620,
              fontSize: '1.05rem',
              lineHeight: 1.7,
            }}
          >
            Herramientas intuitivas diseñadas específicamente para optimizar el tiempo del docente y facilitar el seguimiento institucional.
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          {features.map((feature) => (
            <Grid item xs={12} sm={6} md={3} key={feature.title}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  border: `1px solid ${C.line}`,
                  borderRadius: '20px',
                  bgcolor: C.white,
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08)',
                    borderColor: '#93C5FD',
                  },
                }}
              >
                <CardContent sx={{ p: 3.5 }}>
                  <Avatar
                    variant="rounded"
                    sx={{
                      width: 52,
                      height: 52,
                      bgcolor: feature.tint,
                      color: feature.color,
                      borderRadius: '14px',
                      mb: 2.5,
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Typography component="h3" sx={{ fontSize: '1.15rem', fontWeight: 900, mb: 1 }}>
                    {feature.title}
                  </Typography>
                  <Typography sx={{ color: C.muted, lineHeight: 1.7, fontSize: '.92rem' }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* SECCIÓN ROLES: DOCENTES Y FAMILIAS */}
      <Box sx={{ bgcolor: '#F8FAFC', py: { xs: 8, md: 12 }, borderTop: `1px solid ${C.line}` }}>
        <Container maxWidth="lg">
          <Stack alignItems="center" textAlign="center" sx={{ mb: { xs: 6, md: 8 } }}>
            <Typography sx={{ color: C.blue, fontWeight: 900, fontSize: '.82rem', letterSpacing: '.15em', textTransform: 'uppercase' }}>
              Colaboración activa
            </Typography>
            <Typography component="h2" sx={{ mt: 1.5, fontSize: { xs: '2.1rem', md: '2.8rem' }, fontWeight: 950, letterSpacing: '-.03em' }}>
              Conectando a toda la comunidad escolar.
            </Typography>
          </Stack>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ height: '100%', border: `1px solid ${C.line}`, borderRadius: '24px', p: 2, bgcolor: C.white }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Avatar variant="rounded" sx={{ width: 56, height: 56, bgcolor: '#EEF2FF', color: C.blue, borderRadius: '16px', mb: 3 }}>
                    <School sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Typography component="h3" sx={{ fontSize: '1.4rem', fontWeight: 900, mb: 1.5 }}>
                    Para Docentes y Directivos
                  </Typography>
                  <Typography sx={{ color: C.muted, lineHeight: 1.75, mb: 3, fontSize: '1rem' }}>
                    Automatizá la burocracia administrativa. Reducí el tiempo en planillas de papel, lleva el control riguroso de asistencia y genera reportes listos para la supervisión.
                  </Typography>
                  <Stack spacing={1.5}>
                    {['Planificación semanal y gestión de contenidos', 'Registro de asistencia y retardos', 'Reportes de evaluación transparentes'].map((item) => (
                      <Stack key={item} direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: C.blue }} />
                        <Typography sx={{ fontSize: '.92rem', fontWeight: 700 }}>{item}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ height: '100%', border: `1px solid ${C.line}`, borderRadius: '24px', p: 2, bgcolor: C.white }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Avatar variant="rounded" sx={{ width: 56, height: 56, bgcolor: '#FEF2F2', color: C.red, borderRadius: '16px', mb: 3 }}>
                    <Groups sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Typography component="h3" sx={{ fontSize: '1.4rem', fontWeight: 900, mb: 1.5 }}>
                    Para Familias y Tutores
                  </Typography>
                  <Typography sx={{ color: C.muted, lineHeight: 1.75, mb: 3, fontSize: '1rem' }}>
                    Acompañá de cerca la trayectoria escolar de tus hijos. Consultá calificaciones, revisa la asistencia y mantén comunicación directa con los avances habilitados por la escuela.
                  </Typography>
                  <Stack spacing={1.5}>
                    {['Seguimiento del progreso académico', 'Control de asistencia en tiempo real', 'Acceso seguro desde el celular o PC'].map((item) => (
                      <Stack key={item} direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: C.red }} />
                        <Typography sx={{ fontSize: '.92rem', fontWeight: 700 }}>{item}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* LLAMADO A LA ACCIÓN FINAL */}
      <Box sx={{ px: 2, py: { xs: 8, md: 12 }, bgcolor: C.white }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              p: { xs: 4, md: 7 },
              borderRadius: '32px',
              background: `linear-gradient(135deg, ${C.blue}, #001F66)`,
              color: C.white,
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 56, 168, 0.35)',
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: '1.8rem', md: '2.6rem' },
                fontWeight: 950,
                letterSpacing: '-.03em',
                mb: 2,
                maxWidth: 700,
                mx: 'auto',
              }}
            >
              Llevá tu institución educativa al siguiente nivel tecnológico.
            </Typography>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: '1.1rem',
                mb: 4,
                maxWidth: 550,
                mx: 'auto',
                lineHeight: 1.7,
              }}
            >
              Accedé a tu cuenta para gestionar clases, alumnos y planificaciones de forma moderna y eficiente con KuaaPy.
            </Typography>
            <Button
              onClick={goToApp}
              variant="contained"
              endIcon={<ArrowForward />}
              sx={{
                py: 1.8,
                px: 4.5,
                bgcolor: C.white,
                color: C.blue,
                borderRadius: '14px',
                textTransform: 'none',
                fontWeight: 900,
                fontSize: '1.05rem',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                '&:hover': { bgcolor: '#F1F5F9' },
              }}
            >
              {hasToken ? 'Abrir mi panel' : 'Ingresar a KuaaPy'}
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}