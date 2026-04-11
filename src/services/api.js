import axios from 'axios';

// =====================
// CONFIGURACIÓN AXIOS
// =====================

console.log('Node Environment:', process.env.NODE_ENV);
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
console.log('API Base URL:', apiBaseUrl);

const api = axios.create({ baseURL: apiBaseUrl });

// =====================
// INTERCEPTOR REQUEST
// (agrega token automáticamente)
// =====================
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && token !== 'undefined' && token !== 'null') {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =====================
// INTERCEPTOR RESPONSE
// (auto logout si 401)
// =====================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 1. Limpiamos el token porque ya no es válido
      localStorage.removeItem('token');

      // 2. VERIFICACIÓN CRÍTICA: 
      // Si el usuario ya está en el Home (/) o en el Login, no lo redirigimos
      // Esto evita el bucle de redirección infinita.
      const currentPath = window.location.pathname;
      
      if (currentPath !== '/' && currentPath !== '/auth/login') {
        console.warn('Token inválido. Redirigiendo a login...');
        window.location.href = '/auth/login';
      } else {
        console.log('Sesión no iniciada o token expirado, pero estamos en zona pública.');
      }
    }
    return Promise.reject(error);
  }
);

// =====================
// AUTH
// =====================

export const registerUser = (userData) =>
  api.post('/api/auth/register', userData).then(res => res.data);
export const createUser = (data) =>
  api.post('/api/auth/register', data).then(res => res.data);
export const loginUser = (credentials) =>
  api.post('/api/auth/login', credentials).then(res => res.data);

export const getUsers = () =>
  api.get('/api/auth').then(res => res.data);

export const getUserById = (id) =>
  api.get(`/api/auth/${id}`).then(res => res.data);

export const updateUser = (id, userData) =>
  api.put(`/api/auth/${id}`, userData).then(res => res.data);

export const deleteUser = (id) =>
  api.delete(`/api/auth/${id}`).then(res => res.data);
export const updateMyUser = (data) =>
  api.put('/api/auth/me', data).then(res => res.data);
// =====================
// DOCENTES
// =====================

export const createDocente = (data) =>
  api.post('/api/auth/register', { ...data, role: "docente" })
     .then(res => res.data);

export const getDocentes = () =>
  api.get('/api/auth/docentes').then(res => res.data);
// =====================
// INSTITUCIONES
// =====================
export const getInstitutions = () => api.get('/api/institutions').then(res => res.data);
export const getInstitutionById = (id) => api.get(`/api/institutions/${id}`).then(res => res.data);
export const createInstitution = (data) => api.post('/api/institutions', data).then(res => res.data);
export const updateInstitution = (id, data) => api.put(`/api/institutions/${id}`, data).then(res => res.data);
export const deleteInstitution = (id) => api.delete(`/api/institutions/${id}`).then(res => res.data);

// =====================
// ESTUDIANTES
// =====================
export const getStudents = () => api.get('/api/students').then(res => res.data);
export const getStudentById = (id) => api.get(`/api/students/${id}`).then(res => res.data);
export const createStudent = (data) => api.post('/api/students', data).then(res => res.data);
export const updateStudent = (id, data) => api.put(`/api/students/${id}`, data).then(res => res.data);
export const deleteStudent = (id) => api.delete(`/api/students/${id}`).then(res => res.data);
export const toggleStudentStatus = (id) =>
  api.put(`/api/students/${id}/toggle-status`).then(res => res.data);
// Obtener estudiantes por grado e institución
export const getStudentsByGradeAndInstitution = (grade, institutionId) =>
  api
    .get(`/api/students/by-grades?grade=${encodeURIComponent(grade)}&institution=${institutionId}`)
    .then(res => res.data)
    .catch(error => { throw error });
// =====================
// PERFIL DEL ESTUDIANTE / PADRES
// =====================
export const updateMyProfile = (data) =>
  api.put('/api/students/my-profile', data).then(res => res.data);
export const getMyProfile = () =>
  api.get('/api/students/my-profile').then(res => res.data);

// =====================
// TAREAS
// =====================
export const getTasksByGrade = (grade) => api.get(`/api/tasks/grade/${grade}`).then(res => res.data);
export const getTaskById = (id) => api.get(`/api/tasksTeacher/${id}`).then(res => res.data);
export const createTask = (data) => api.post('/api/tasksTeacher', data).then(res => res.data);
export const updateTask = (id, data) => api.put(`/api/tasksTeacher/${id}`, data).then(res => res.data);
export const deleteTask = (id) => api.delete(`/api/tasksTeacher/${id}`).then(res => res.data);
export const getTasks = () =>
  api.get('/api/tasksTeacher').then(res => res.data);
// =====================
// TAREAS Y ENTREGAS (STUDENT TASKS)
// =====================

// Estudiante logueado: ver sus propias tareas

// Cambia /api/student-tasks/ por /api/tasks/
export const getMyTasks = () =>
  api.get('/api/tasks/my-tasks').then(res => res.data);

// Obtener una entrega específica por ID
export const getStudentTaskById = (id) =>
  api.get(`/api/tasks/${id}`).then(res => res.data);

// Actualizar/Calificar tarea de estudiante
export const updateStudentTask = (studentTaskId, data) =>
  api.put(`/api/tasks/${studentTaskId}`, data).then(res => res.data);

// Obtener entregas de un grado para el docente
export const getStudentTasksByGrade = (grade) =>
  api.get(`/api/tasks/grade/${grade}`).then(res => res.data);

// =====================
// REPORTES Y ESTADÍSTICAS
// =====================

/**
 * Obtiene el resumen académico de alumnos.
 * @param {string} grade - El grado (ej: "1° Grado") o "all" para todos.
 * @param {string} institutionId - ID de la institución (opcional, para directores).
 */
export const getStudentsSummary = (grade, institutionId = null) => {
  let url = `/api/tasks/summary/${encodeURIComponent(grade)}`;
  if (institutionId) {
    url += `?institutionId=${institutionId}`;
  }
  return api.get(url).then(res => res.data);
};
// NUEVA FUNCIÓN: Obtener historial académico (tareas) de un estudiante específico
export const getStudentTasksByStudentId = (studentId) => 
  api.get(`/api/tasks/${studentId}/tasks`).then(res => res.data);
// =====================
// REPORTES DISCIPLINARIOS
// =====================

// Crear reporte disciplinario (docente)
export const createDisciplineReport = (data) =>
  api.post('/api/report', data)
     .then(res => res.data)
     .catch(error => { throw error });

// Editar reporte (docente)
export const updateDisciplineReport = (id, data) =>
  api.put(`/api/report/${id}`, data)
     .then(res => res.data)
     .catch(error => { throw error });

// Eliminar reporte (docente)
export const deleteDisciplineReport = (id) =>
  api.delete(`/api/report/${id}`)
     .then(res => res.data)
     .catch(error => { throw error });

// Obtener reportes de un grado (docente)
export const getReportsByGrade = (grade) =>
  api.get(`/api/report/grade/${grade}`)
     .then(res => res.data)
     .catch(error => { throw error });

// Obtener reportes de un alumno
export const getReportsByStudent = (studentId) =>
  api.get(`/api/report/student/${studentId}`)
     .then(res => res.data)
     .catch(error => { throw error });

// Ver mis reportes (alumno)
export const getMyDisciplineReports = () =>
  api.get('/api/report/my-reports')
     .then(res => res.data)
     .catch(error => { throw error });

// Confirmar reporte (padres)
export const confirmDisciplineReport = (id, parentData) =>
  api.put(`/api/report/confirm/${id}`, parentData)
     .then(res => res.data)
     .catch(error => { throw error });

// Ver todos los reportes (director)
export const getAllDisciplineReports = () =>
  api.get('/api/report')
     .then(res => res.data)
     .catch(error => { throw error });

  // =====================
// NOTIFICACIONES
// =====================

// Obtener mis notificaciones (director)
export const getMyNotifications = () =>
  api.get('/api/notifications/my')
     .then(res => res.data)
     .catch(error => { throw error });

// Marcar notificación como leída
export const markAsRead = (id) =>
  api.put(`/api/notifications/read/${id}`)
     .then(res => res.data)
     .catch(error => { throw error });

// =====================
// PLANIFICACIONES SEMANALES
// =====================

/**
 * Obtiene todas las planificaciones. 
 * Si es docente, el backend filtrará sus propias planificaciones.
 * Si es director, el backend mostrará las de su institución.
 */
export const getPlanificaciones = () => 
  api.get('/api/planificaciones').then(res => res.data);

/**
 * Obtiene una planificación específica por ID para ver el detalle.
 */
export const getPlanificacionById = (id) => 
  api.get(`/api/planificaciones/${id}`).then(res => res.data);

/**
 * Crea una nueva planificación (Inicia en estado 'Borrador').
 */
export const createPlanificacion = (data) => 
  api.post('/api/planificaciones', data).then(res => res.data);

/**
 * Actualiza una planificación existente (Solo permitido si está en 'Borrador').
 */
export const updatePlanificacion = (id, data) => 
  api.put(`/api/planificaciones/${id}`, data).then(res => res.data);

/**
 * Elimina una planificación.
 */
export const deletePlanificacion = (id) => 
  api.delete(`/api/planificaciones/${id}`).then(res => res.data);

/**
 * CAMBIO DE ESTADO: 
 * - Docente envía para revisión: { estado: 'Enviado' }
 * - Director aprueba: { estado: 'Aprobado', observacionesGenerales: '...' }
 * - Director rechaza: { estado: 'Rechazado', observacionesGenerales: '...' }
 */
export const updatePlanificacionStatus = (id, statusData) => 
  api.patch(`/api/planificaciones/${id}/status`, statusData).then(res => res.data);
export default api;