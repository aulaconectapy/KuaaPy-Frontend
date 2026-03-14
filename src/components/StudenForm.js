'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createStudent, updateStudent, getStudentById, getInstitutions } from "@/services/api";

import {
  TextField, Button, MenuItem, Select, InputLabel, FormControl,
  CircularProgress, Snackbar, Box, Typography, Paper, Grid,
  Divider, Stack, OutlinedInput, Checkbox, ListItemText
} from "@mui/material";

import { CheckCircle, Error, ArrowBack, Dashboard } from "@mui/icons-material";

// 🔹 Mapeo de valores del front al enum exacto
const gradeMapping = {
  "1": "1° grado",
  "2": "2° grado",
  "3": "3° grado",
  "4": "4° grado",
  "5": "5° grado",
  "6": "6° grado",
  "7": "7° grado",
  "8": "8° grado",
  "9": "9° grado",
  "1a": "1er año",
  "2a": "2do año",
  "3a": "3er año"
};

const StudentForm = ({ studentId, onSuccess }) => {
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const [student, setStudent] = useState({
    firstName: "",
    lastName: "",
    sex: "",
    cedula: "",
    birthDate: "",
    institution: "",
    grade: [],
    father: { firstName: "", lastName: "", phone: "" },
    mother: { firstName: "", lastName: "", phone: "" },
    guardian: "",
    allergies: "",
    healthIssues: "",
    reasonableAdjustments: "",
    address: "",
    observations: "",
    password: "",
  });

  const [institutions, setInstitutions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", success: true });

  // 🔹 Cargar instituciones según rol
  useEffect(() => {
    const loadInstitutions = async () => {
      if (!currentUser) return;
      try {
        const allInstitutions = await getInstitutions();
        const role = currentUser?.role?.toLowerCase();

        if (["director/a", "secretario/a", "docente"].includes(role)) {
          const myInst = allInstitutions.find(i => i._id === currentUser.institution?._id);
          setInstitutions(myInst ? [myInst] : []);
          setStudent(prev => ({ ...prev, institution: myInst?._id || "" }));

          if (role === "docente" && myInst) {
            const myGrades = myInst.grades?.filter(g => currentUser.grades?.includes(g)) || [];
            setGrades(myGrades);
            setStudent(prev => ({
              ...prev,
              grade: myGrades.length === 1 ? [myGrades[0]] : []
            }));
          }
        } else if (role === "administrador") {
          setInstitutions(allInstitutions);
        } else {
          setInstitutions([]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadInstitutions();
  }, [currentUser]);

  // 🔹 Cargar estudiante si es edición
  useEffect(() => {
    if (!studentId) return;

    setLoading(true);
    getStudentById(studentId)
      .then(data => {
        setStudent({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          sex: data.sex || "",
          cedula: data.cedula || "",
          birthDate: data.birthDate?.split("T")[0] || "",
          institution: data.institution?._id || "",
          grade: data.grade ? [data.grade] : [],
          father: data.father || { firstName: "", lastName: "", phone: "" },
          mother: data.mother || { firstName: "", lastName: "", phone: "" },
          guardian: data.guardian || "",
          allergies: data.allergies || "",
          healthIssues: data.healthIssues || "",
          reasonableAdjustments: data.reasonableAdjustments || "",
          address: data.address || "",
          observations: data.observations || "",
          password: "",
        });
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  // 🔹 Actualizar grades según institución
  useEffect(() => {
    if (!student.institution) {
      setGrades([]);
      setStudent(prev => ({ ...prev, grade: [] }));
      return;
    }

    const inst = institutions.find(i => i._id === student.institution);
    const role = currentUser?.role?.toLowerCase();

    if (role === "docente") {
      const myGrades = inst?.grades?.filter(g => currentUser.grades?.includes(g)) || [];
      setGrades(myGrades);
      setStudent(prev => ({
        ...prev,
        grade: prev.grade.filter(g => myGrades.includes(g))
      }));
    } else {
      setGrades(inst?.grades || []);
      if (!inst?.grades.includes(student.grade[0])) {
        setStudent(prev => ({ ...prev, grade: [] }));
      }
    }
  }, [student.institution, institutions, currentUser?.role, currentUser?.grades]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("father.") || name.startsWith("mother.")) {
      const [parent, field] = name.split(".");
      setStudent(prev => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }));
      setErrors(prev => ({ ...prev, [name]: "" }));
    } else {
      setStudent(prev => ({ ...prev, [name]: value }));
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!student.firstName) newErrors.firstName = "El nombre es obligatorio.";
    if (!student.lastName) newErrors.lastName = "El apellido es obligatorio.";
    if (!student.birthDate) newErrors.birthDate = "La fecha es obligatoria.";
    if (!student.institution) newErrors.institution = "Seleccione una institución.";
    if (!student.grade || student.grade.length === 0) newErrors.grade = "Seleccione al menos un grado.";
    if (student.cedula && !/^\d+$/.test(student.cedula)) newErrors.cedula = "La cédula solo debe contener números.";

    if (!studentId || student.password) {
      if (!student.password) newErrors.password = "La contraseña es obligatoria.";
      else if (student.password.length < 6) newErrors.password = "La contraseña debe tener al menos 6 caracteres.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const mappedGrade = gradeMapping[student.grade[0]] || student.grade[0];

      const payload = { ...student, grade: mappedGrade };

      studentId
        ? await updateStudent(studentId, payload)
        : await createStudent(payload);

      setSnackbar({ open: true, message: studentId ? "Estudiante actualizado" : "Estudiante creado", success: true });
      onSuccess?.();
    } catch (error) {
      const backendErrors = error?.response?.data?.errors || {};
      const backendMessage = error?.response?.data?.message || "Error al guardar el estudiante.";
      setErrors(prev => ({ ...prev, ...backendErrors }));
      setSnackbar({ open: true, message: backendMessage, success: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ px: 1, py: 2, maxWidth: 700, mx: "auto" }}>
      <Button startIcon={<Dashboard />} variant="outlined" fullWidth sx={{ mb: 2 }} onClick={() => router.push("/dashboard")}>
        Ir al Dashboard
      </Button>

      <Paper elevation={4} sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {studentId ? "Editar Estudiante" : "Nuevo Estudiante"}
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* Información básica */}
            <Grid item xs={12} sm={6}>
              <TextField label="Nombre" name="firstName" value={student.firstName} onChange={handleChange} fullWidth required error={!!errors.firstName} helperText={errors.firstName} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Apellido" name="lastName" value={student.lastName} onChange={handleChange} fullWidth required error={!!errors.lastName} helperText={errors.lastName} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Sexo</InputLabel>
                <Select name="sex" value={student.sex} onChange={handleChange}>
                  <MenuItem value="Masculino">Masculino</MenuItem>
                  <MenuItem value="Femenino">Femenino</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Cédula" name="cedula" value={student.cedula} onChange={handleChange} fullWidth error={!!errors.cedula} helperText={errors.cedula || "Opcional – solo números"} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Fecha de nacimiento" type="date" name="birthDate" value={student.birthDate} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} error={!!errors.birthDate} helperText={errors.birthDate} required />
            </Grid>

            {/* Institución y grado */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.institution}>
                <InputLabel>Institución</InputLabel>
                <Select name="institution" value={student.institution} onChange={handleChange} disabled={["director/a","secretario/a","docente"].includes(currentUser?.role?.toLowerCase())}>
                  {institutions.map(inst => <MenuItem key={inst._id} value={inst._id}>{inst.name}</MenuItem>)}
                </Select>
                <Typography color="error" variant="caption">{errors.institution}</Typography>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.grade}>
                <InputLabel>Grado</InputLabel>
                <Select
                  name="grade"
                  multiple={currentUser?.role?.toLowerCase() === "docente" && grades.length > 1}
                  value={student.grade}
                  onChange={handleChange}
                  input={<OutlinedInput label="Grado" />}
                  renderValue={(selected) => Array.isArray(selected) ? selected.join(", ") : selected}
                >
                  {grades.map(g => (
                    <MenuItem key={g} value={g}>
                      {currentUser?.role?.toLowerCase() === "docente" && grades.length > 1 ? <Checkbox checked={student.grade.includes(g)} /> : null}
                      <ListItemText primary={g} />
                    </MenuItem>
                  ))}
                </Select>
                <Typography color="error" variant="caption">{errors.grade}</Typography>
              </FormControl>
            </Grid>

            {/* Padres */}
            <Grid item xs={12} sm={6}><TextField label="Nombre del padre" name="father.firstName" value={student.father.firstName} onChange={handleChange} fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Apellido del padre" name="father.lastName" value={student.father.lastName} onChange={handleChange} fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Teléfono del padre" name="father.phone" value={student.father.phone} onChange={handleChange} fullWidth /></Grid>

            <Grid item xs={12} sm={6}><TextField label="Nombre de la madre" name="mother.firstName" value={student.mother.firstName} onChange={handleChange} fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Apellido de la madre" name="mother.lastName" value={student.mother.lastName} onChange={handleChange} fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Teléfono de la madre" name="mother.phone" value={student.mother.phone} onChange={handleChange} fullWidth /></Grid>

            <Grid item xs={12}><TextField label="Tutor" name="guardian" value={student.guardian} onChange={handleChange} fullWidth /></Grid>

            {/* Salud y adaptaciones */}
            <Grid item xs={12}><TextField label="Alergias" name="allergies" value={student.allergies} onChange={handleChange} fullWidth multiline rows={1} /></Grid>
            <Grid item xs={12}><TextField label="Problemas de salud" name="healthIssues" value={student.healthIssues} onChange={handleChange} fullWidth multiline rows={1} /></Grid>
            <Grid item xs={12}><TextField label="Adaptaciones" name="reasonableAdjustments" value={student.reasonableAdjustments} onChange={handleChange} fullWidth multiline rows={1} /></Grid>

            {/* Dirección y observaciones */}
            <Grid item xs={12}><TextField label="Dirección" name="address" value={student.address} onChange={handleChange} fullWidth multiline rows={1} /></Grid>
            <Grid item xs={12}><TextField label="Observaciones" name="observations" value={student.observations} onChange={handleChange} fullWidth multiline rows={1} /></Grid>

            {/* Contraseña */}
            <Grid item xs={12}>
              <TextField
                label={studentId ? "Nueva Contraseña (opcional)" : "Contraseña"}
                type="password"
                name="password"
                value={student.password}
                onChange={handleChange}
                fullWidth
                error={!!errors.password}
                helperText={studentId ? errors.password || "Dejar vacío si no quiere cambiarla" : errors.password}
                required={!studentId}
              />
            </Grid>

          </Grid>

          <Stack spacing={2} sx={{ mt: 3 }}>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : "Guardar"}
            </Button>
            <Button startIcon={<ArrowBack />} onClick={() => router.back()}>Volver</Button>
          </Stack>
        </form>
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1, bgcolor: snackbar.success ? "success.main" : "error.main", color: "#fff", borderRadius: 1 }}>
          {snackbar.success ? <CheckCircle /> : <Error />}
          <Typography>{snackbar.message}</Typography>
        </Box>
      </Snackbar>
    </Box>
  );
};

export default StudentForm;