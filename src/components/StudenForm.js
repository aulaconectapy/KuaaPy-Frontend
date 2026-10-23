'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createStudent, updateStudent, getStudentById, getInstitutions } from "@/services/api";

import {
  TextField, Button, MenuItem, Select, InputLabel, FormControl,
  CircularProgress, Snackbar, Box, Typography, Paper, Grid,
  Stack, OutlinedInput, Checkbox, ListItemText, Avatar, Container, Alert
} from "@mui/material";

import { 
  ArrowBack, Dashboard, 
  Person as PersonIcon, School as SchoolIcon, 
  FamilyRestroom as FamilyIcon, LocalHospital as HealthIcon,
  Lock as LockIcon
} from "@mui/icons-material";

// CONSTANTES DE ESTILO KUAAPY
const COLORS = {
  primary: "#0038A8",     // Azul principal KuaaPy
  primaryDark: "#00257A", // Azul oscuro
  red: "#D52B1E",         // Acento rojo
  bgLight: "#F8FAFC",
  border: "#E2E8F0",
  gradient: "linear-gradient(135deg, #0038A8 0%, #00257A 100%)"
};

const StudentForm = ({ studentId, onSuccess }) => {
  const { user: currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [student, setStudent] = useState({
    firstName: "", lastName: "", sex: "", cedula: "", birthDate: "",
    institution: "", grade: [],
    father: { firstName: "", lastName: "", phone: "" },
    mother: { firstName: "", lastName: "", phone: "" },
    guardian: "", allergies: "", healthIssues: "",
    reasonableAdjustments: "", address: "", observations: "", password: "",
  });

  const [institutions, setInstitutions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", success: true });
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      const role = currentUser.role?.toLowerCase();
      const allowedRoles = ["director/a", "secretario/a", "secretaria", "docente", "administrador"];
      if (!allowedRoles.includes(role)) {
        router.push("/dashboard");
      } else {
        setIsAuthorized(true);
      }
    }
  }, [currentUser, authLoading, router]);

  useEffect(() => {
    const loadInstitutions = async () => {
      if (!isAuthorized || !currentUser) return;
      try {
        const allInstitutions = await getInstitutions();
        const role = currentUser?.role?.toLowerCase();
        if (["director/a", "secretario/a", "secretaria", "docente"].includes(role)) {
          const myInst = allInstitutions.find(i => i._id === currentUser.institution?._id);
          setInstitutions(myInst ? [myInst] : []);
          setStudent(prev => ({ ...prev, institution: myInst?._id || "" }));
          if (role === "docente" && myInst) {
            const myGrades = myInst.grades?.filter(g => currentUser.grades?.includes(g)) || [];
            setGrades(myGrades);
            setStudent(prev => ({ ...prev, grade: myGrades.length === 1 ? [myGrades[0]] : [] }));
          }
        } else if (role === "administrador") {
          setInstitutions(allInstitutions);
        }
      } catch (err) { console.error(err); }
    };
    loadInstitutions();
  }, [currentUser, isAuthorized]);

  useEffect(() => {
    if (!studentId || !isAuthorized) return;
    setLoading(true);
    getStudentById(studentId)
      .then(data => {
        setStudent({
          ...data,
          institution: data.institution?._id || "",
          grade: data.grade ? [data.grade] : [],
          birthDate: data.birthDate?.split("T")[0] || "",
          password: "", 
        });
      })
      .finally(() => setLoading(false));
  }, [studentId, isAuthorized]);

  useEffect(() => {
    if (!student.institution || !isAuthorized) {
      setGrades([]);
      return;
    }
    const inst = institutions.find(i => i._id === student.institution);
    const role = currentUser?.role?.toLowerCase();
    if (role === "docente") {
      const myGrades = inst?.grades?.filter(g => currentUser.grades?.includes(g)) || [];
      setGrades(myGrades);
    } else {
      setGrades(inst?.grades || []);
    }
  }, [student.institution, institutions, currentUser, isAuthorized]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("father.") || name.startsWith("mother.")) {
      const [parent, field] = name.split(".");
      setStudent(prev => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }));
    } else {
      setStudent(prev => ({ ...prev, [name]: value }));
    }
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!student.firstName) newErrors.firstName = "El nombre es obligatorio.";
    if (!student.lastName) newErrors.lastName = "El apellido es obligatorio.";
    if (!student.birthDate) newErrors.birthDate = "La fecha es obligatoria.";
    if (!student.institution) newErrors.institution = "Seleccione una institución.";
    if (!student.grade || student.grade.length === 0) newErrors.grade = "Seleccione al menos un grado.";

    if (!student.cedula) {
      newErrors.cedula = "La cédula es obligatoria.";
    } else if (!/^\d+$/.test(student.cedula)) {
      newErrors.cedula = "La cédula solo debe contener números.";
    } else if (student.cedula.length < 6) {
      newErrors.cedula = "La cédula debe tener al menos 6 dígitos.";
    }

    if (!studentId || student.password) {
      const hasLetter = /[a-zA-Z]/.test(student.password);
      if (!student.password) {
        newErrors.password = "La contraseña es obligatoria.";
      } else if (student.password.length < 6) {
        newErrors.password = "Mínimo 6 caracteres.";
      } else if (!hasLetter) {
        newErrors.password = "Debe incluir al menos una letra.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const mappedGrade = Array.isArray(student.grade) ? student.grade[0] : student.grade;
      const payload = { ...student, grade: mappedGrade };
      if (studentId && !student.password) delete payload.password; 
      
      const response = studentId ? await updateStudent(studentId, payload) : await createStudent(payload);
      
      setSnackbar({ 
        open: true, 
        message: response.message || (studentId ? "Actualizado correctamente" : "Creado correctamente"), 
        success: true 
      });
      onSuccess?.();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || "Error al guardar.";
      const backendErrors = error?.response?.data?.errors || {};
      
      setErrors(prev => ({ ...prev, ...backendErrors }));
      setSnackbar({ open: true, message: errorMessage, success: false });
    } finally { setLoading(false); }
  };

  const SectionTitle = ({ icon: Icon, title }) => (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2, mt: 1 }}>
      <Avatar sx={{ bgcolor: `${COLORS.primary}12`, color: COLORS.primary, width: 36, height: 36, borderRadius: '10px' }}>
        <Icon fontSize="small" />
      </Avatar>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.85rem' }}>
        {title}
      </Typography>
    </Stack>
  );

  if (authLoading || !isAuthorized) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: 'center', height: '100vh', bgcolor: COLORS.bgLight }}>
        <CircularProgress thickness={5} sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: COLORS.bgLight, minHeight: '100vh', py: { xs: 3, md: 5 }, px: 2 }}>
      <Container maxWidth="md">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Button startIcon={<ArrowBack />} onClick={() => router.back()} sx={{ color: '#64748B', fontWeight: 700, textTransform: 'none' }}>Volver</Button>
            <Button startIcon={<Dashboard />} variant="outlined" onClick={() => router.push("/dashboard")} sx={{ borderRadius: '12px', borderColor: COLORS.border, color: '#1E293B', fontWeight: 700, textTransform: 'none' }}>Dashboard</Button>
        </Stack>

        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: '24px', border: `1px solid ${COLORS.border}`, bgcolor: '#fff' }}>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.primary, letterSpacing: '-0.02em', mb: 0.5 }}>
              {studentId ? "Editar Perfil" : "Registro Estudiantil"}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
              Información oficial para la gestión académica institucional en KuaaPy.
            </Typography>
          </Box>

          <form onSubmit={handleSubmit} autoComplete="off">
            <Grid container spacing={3}>
              <Grid item xs={12}><SectionTitle icon={PersonIcon} title="Información Personal" /></Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="Nombre" 
                  name="firstName" 
                  value={student.firstName} 
                  onChange={handleChange} 
                  fullWidth 
                  required 
                  size="small"
                  error={!!errors.firstName} 
                  helperText={errors.firstName} 
                  variant="outlined" 
                  InputProps={{ sx: { borderRadius: '12px' } }} 
                  inputProps={{ autoComplete: 'none' }} 
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField 
                  label="Apellido" 
                  name="lastName" 
                  value={student.lastName} 
                  onChange={handleChange} 
                  fullWidth 
                  required 
                  size="small"
                  error={!!errors.lastName} 
                  helperText={errors.lastName} 
                  variant="outlined" 
                  InputProps={{ sx: { borderRadius: '12px' } }} 
                  inputProps={{ autoComplete: 'none' }} 
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sexo</InputLabel>
                  <Select name="sex" value={student.sex} onChange={handleChange} label="Sexo" sx={{ borderRadius: '12px' }}>
                    <MenuItem value="Masculino">Masculino</MenuItem>
                    <MenuItem value="Femenino">Femenino</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="Cédula" 
                  name="cedula" 
                  value={student.cedula} 
                  onChange={handleChange} 
                  fullWidth 
                  required
                  size="small"
                  error={!!errors.cedula} 
                  helperText={errors.cedula || "Mínimo 6 números"} 
                  variant="outlined" 
                  InputProps={{ sx: { borderRadius: '12px' } }} 
                  inputProps={{ autoComplete: 'none' }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField 
                  label="Fecha de Nacimiento" 
                  type="date" 
                  name="birthDate" 
                  value={student.birthDate} 
                  onChange={handleChange} 
                  fullWidth 
                  size="small"
                  InputLabelProps={{ shrink: true }} 
                  error={!!errors.birthDate} 
                  helperText={errors.birthDate} 
                  required 
                  variant="outlined" 
                  InputProps={{ sx: { borderRadius: '12px' } }} 
                />
              </Grid>

              <Grid item xs={12} sx={{ mt: 1 }}><SectionTitle icon={SchoolIcon} title="Ubicación Académica" /></Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" required error={!!errors.institution}>
                  <InputLabel>Institución</InputLabel>
                  <Select 
                    name="institution" 
                    value={student.institution} 
                    onChange={handleChange} 
                    label="Institución" 
                    sx={{ borderRadius: '12px' }} 
                    disabled={["director/a","secretario/a","secretaria","docente"].includes(currentUser?.role?.toLowerCase())}
                  >
                    {institutions.map(inst => <MenuItem key={inst._id} value={inst._id}>{inst.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" required error={!!errors.grade}>
                  <InputLabel>Grado / Curso</InputLabel>
                  <Select
                    name="grade"
                    multiple={currentUser?.role?.toLowerCase() === "docente" && grades.length > 1}
                    value={student.grade}
                    onChange={handleChange}
                    input={<OutlinedInput label="Grado / Curso" sx={{ borderRadius: '12px' }} />}
                    renderValue={(selected) => Array.isArray(selected) ? selected.join(", ") : selected}
                  >
                    {grades.map(g => (
                      <MenuItem key={g} value={g}>
                        {currentUser?.role?.toLowerCase() === "docente" && grades.length > 1 ? <Checkbox checked={student.grade.includes(g)} /> : null}
                        <ListItemText primary={g} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sx={{ mt: 1 }}><SectionTitle icon={FamilyIcon} title="Información Familiar" /></Grid>
              
              <Grid item xs={12} sm={4}><TextField size="small" label="Padre (Nombres)" name="father.firstName" value={student.father.firstName} onChange={handleChange} fullWidth variant="outlined" InputProps={{ sx: { borderRadius: '12px' } }} inputProps={{ autoComplete: 'none' }} /></Grid>
              <Grid item xs={12} sm={4}><TextField size="small" label="Padre (Apellidos)" name="father.lastName" value={student.father.lastName} onChange={handleChange} fullWidth variant="outlined" InputProps={{ sx: { borderRadius: '12px' } }} inputProps={{ autoComplete: 'none' }} /></Grid>
              <Grid item xs={12} sm={4}><TextField size="small" label="Padre (Tel)" name="father.phone" value={student.father.phone} onChange={handleChange} fullWidth variant="outlined" InputProps={{ sx: { borderRadius: '12px' } }} inputProps={{ autoComplete: 'none' }} /></Grid>

              <Grid item xs={12} sm={4}><TextField size="small" label="Madre (Nombres)" name="mother.firstName" value={student.mother.firstName} onChange={handleChange} fullWidth variant="outlined" InputProps={{ sx: { borderRadius: '12px' } }} inputProps={{ autoComplete: 'none' }} /></Grid>
              <Grid item xs={12} sm={4}><TextField size="small" label="Madre (Apellidos)" name="mother.lastName" value={student.mother.lastName} onChange={handleChange} fullWidth variant="outlined" InputProps={{ sx: { borderRadius: '12px' } }} inputProps={{ autoComplete: 'none' }} /></Grid>
              <Grid item xs={12} sm={4}><TextField size="small" label="Madre (Tel)" name="mother.phone" value={student.mother.phone} onChange={handleChange} fullWidth variant="outlined" InputProps={{ sx: { borderRadius: '12px' } }} inputProps={{ autoComplete: 'none' }} /></Grid>

              <Grid item xs={12} sx={{ mt: 1 }}><SectionTitle icon={HealthIcon} title="Salud y Adaptaciones" /></Grid>
              <Grid item xs={12} md={6}><TextField size="small" label="Alergias" name="allergies" value={student.allergies} onChange={handleChange} fullWidth multiline rows={2} variant="outlined" InputProps={{ sx: { borderRadius: '12px' } }} inputProps={{ autoComplete: 'none' }} /></Grid>
              <Grid item xs={12} md={6}><TextField size="small" label="Problemas de Salud" name="healthIssues" value={student.healthIssues} onChange={handleChange} fullWidth multiline rows={2} variant="outlined" InputProps={{ sx: { borderRadius: '12px' } }} inputProps={{ autoComplete: 'none' }} /></Grid>
              <Grid item xs={12}><TextField size="small" label="Ajustes Razonables" name="reasonableAdjustments" value={student.reasonableAdjustments} onChange={handleChange} fullWidth multiline rows={2} variant="outlined" InputProps={{ sx: { borderRadius: '12px' } }} inputProps={{ autoComplete: 'none' }} /></Grid>

              <Grid item xs={12} sx={{ mt: 1 }}><SectionTitle icon={LockIcon} title="Credenciales" /></Grid>
              <Grid item xs={12}>
                <TextField
                  size="small"
                  label={studentId ? "Cambiar Contraseña" : "Contraseña de Acceso"}
                  type="password"
                  name="password"
                  value={student.password}
                  onChange={handleChange}
                  fullWidth
                  error={!!errors.password}
                  helperText={studentId ? "Dejar vacío para no cambiar. Mín 6 caracteres + letras." : errors.password || "Mínimo 6 caracteres + letras."}
                  required={!studentId}
                  variant="outlined"
                  autoComplete="new-password" 
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />
              </Grid>
            </Grid>

            <Button 
              type="submit" 
              variant="contained" 
              fullWidth 
              disabled={loading}
              sx={{ 
                mt: 4, bgcolor: COLORS.primary, py: 1.5, borderRadius: '14px', fontWeight: 800,
                textTransform: 'none',
                boxShadow: '0 8px 20px rgba(0,56,168,0.2)',
                '&:hover': { bgcolor: COLORS.primaryDark }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : (studentId ? "Actualizar Registro" : "Completar Registro")}
            </Button>
          </form>
        </Paper>
      </Container>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.success ? "success" : "error"} variant="filled" sx={{ width: '100%', borderRadius: '12px', fontWeight: 700, bgcolor: snackbar.success ? COLORS.primary : '#EF4444' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentForm;