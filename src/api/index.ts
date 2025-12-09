import axios from 'axios';

// Auto-detect API URL based on current host - works on any network
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }
  // Use same host as frontend, just different port
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:5000/api`;
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Axios instance with interceptors for session management
 * Uses cookies automatically (withCredentials: true)
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with requests
});

/**
 * Request interceptor - add JWT token from localStorage as Authorization header
 * This is a fallback for when cookies don't work in cross-origin scenarios
 */
apiClient.interceptors.request.use(
  config => {
    // Get token from localStorage (set by login)
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Only log for subjects/teacher endpoint for debugging
      if (config.url?.includes('subjects/teacher')) {
        console.log('🔐 API Request - Adding token to Authorization header for:', config.url);
      }
    } else {
      // Log if no token found
      if (config.url?.includes('subjects/teacher')) {
        console.log('⚠️ API Request - No token in localStorage for:', config.url);
      }
    }
    return config;
  },
  error => Promise.reject(error)
);

/**
 * Response interceptor - handle authentication and errors
 */
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Only redirect to login on 401 if we're not already on the login page
    // and we're not in the initialization phase
    if (error.response?.status === 401) {
      // Clear invalid token from localStorage
      localStorage.removeItem('auth_token');
      console.log('🗑️ Cleared invalid token from localStorage');
      
      const isLoginPage = window.location.pathname === '/login';
      const isInitializing = sessionStorage.getItem('auth-initializing');
      
      // Don't redirect if:
      // 1. Already on login page
      // 2. Auth is initializing
      // 3. This is a request to get current user (don't redirect during auth check)
      const requestUrl = error.config?.url || '';
      const isCurrentUserRequest = requestUrl.includes('/auth/me') || requestUrl.includes('/auth/current-user');
      
      if (!isLoginPage && !isInitializing && !isCurrentUserRequest && window.location.pathname !== '/') {
        console.log('🔓 Authentication failed (401) - session expired, redirecting to login');
        window.location.href = '/login';
      }
    }

    // Suppress console errors for 409 conflicts (expected when session already exists)
    if (error.response?.status === 409 && error.config?.url?.includes('/sessions')) {
      // This is an expected conflict, handle silently
      error.suppressLog = true;
    }

    return Promise.reject(error);
  }
);

/**
 * API methods organized by resource
 */
export const api = {
  // Auth
  auth: {
    login: (identifier, password) =>
      apiClient.post('/auth/login', { identifier, password }),
    logout: () => apiClient.post('/auth/logout'),
    getCurrentUser: () => apiClient.get('/auth/me'),
  },

  // Users
  users: {
    create: data => apiClient.post('/users', data),
    list: (role, page = 1, limit = 500) => {
      // Route to the correct endpoint based on role
      if (role === 'student') {
        return apiClient.get('/students', { params: { page, limit } });
      }
      if (role === 'teacher') {
        return apiClient.get('/teachers', { params: { page, limit } });
      }
      // For hod, admin, principal - use generic endpoint with role query param
      return apiClient.get('/users', { params: { role, page, limit } });
    },
    getStudent: studentId => apiClient.get(`/students/${studentId}`),
    getStudents: (page = 1, limit = 500) =>
      apiClient.get('/students', { params: { page, limit } }),
    getStudentsByDept: (deptId, page = 1, limit = 500) =>
      apiClient.get(`/departments/${deptId}/students`, { params: { page, limit } }),
    getStudentsBySection: (filters = {}) =>
      apiClient.get('/students/section', { params: filters }),
    getStudentAttendance: (studentId) =>
      apiClient.get(`/students/${studentId}/attendance`),
    update: (studentId, data) => apiClient.put(`/students/${studentId}`, data),
    delete: studentId => apiClient.delete(`/students/${studentId}`),
    bulkDelete: userIds => apiClient.post('/users/bulk-delete', { userIds }),
  },

  // Courses
  courses: {
    create: data => apiClient.post('/courses', data),
    list: (filters = {}) => apiClient.get('/courses', { params: filters }),
    getRoster: courseId => apiClient.get(`/courses/${courseId}/roster`),
    assignTeacher: (courseId, teacherId) =>
      apiClient.put(`/courses/${courseId}/assign-teacher`, { teacherId }),
  },

  // Subjects
  subjects: {
    create: data => apiClient.post('/subjects', data),
    list: (filters = {}) => apiClient.get('/subjects', { params: filters }),
    get: subjectId => apiClient.get(`/subjects/${subjectId}`),
    getTeacherSubjects: (filters = {}) => apiClient.get('/subjects/teacher/assigned', { params: filters }),
    update: (subjectId, data) => apiClient.put(`/subjects/${subjectId}`, data),
    delete: subjectId => apiClient.delete(`/subjects/${subjectId}`),
    assignTeacher: (subjectId, data) => apiClient.post(`/subjects/${subjectId}/assign-teacher`, data),
  },

  // Sessions
  sessions: {
    create: data => apiClient.post('/sessions', data),
    get: sessionId => apiClient.get(`/sessions/${sessionId}`),
    getCourseSessions: (courseId, filters = {}) =>
      apiClient.get(`/sessions/course/${courseId}/sessions`, { params: filters }),
    cancel: sessionId => apiClient.put(`/sessions/${sessionId}/cancel`),
    undoLast: sessionId => apiClient.post(`/sessions/${sessionId}/undo-last`),
  },

  // Attendance
  attendance: {
    mark: (sessionId, records) =>
      apiClient.post(`/sessions/${sessionId}/attendance`, { records }),
    getCourseAttendance: (courseId, filters = {}) =>
      apiClient.get(`/courses/${courseId}/attendance`, { params: filters }),
    markSubjectAttendance: (data) =>
      apiClient.post('/attendance/subject/mark', data),
    getSubjectAttendance: (filters = {}) =>
      apiClient.get('/attendance/subject', { params: filters }),
    getStudentOverview: studentId =>
      apiClient.get(`/attendance/students/${studentId}/overview`),
    getConductedClassesOverview: studentId =>
      apiClient.get(`/attendance/students/${studentId}/conducted-overview`),
    getStudentHistory: (studentId, filters = {}) =>
      apiClient.get(`/attendance/students/${studentId}/history`, { params: filters }),
    getMonthlyAttendance: (userId, month) =>
      apiClient.get(`/users/${userId}/attendance`, { params: { month } }),
    getHistory: (filters = {}) =>
      apiClient.get('/attendance/history', { params: filters }),
    getSessionDetails: (sessionId) =>
      apiClient.get(`/attendance/session/${sessionId}`),
    updateSession: (sessionId, data) =>
      apiClient.put(`/attendance/session/${sessionId}`, data),
  },

  // Reports
  reports: {
    getDepartment: (deptId, filters = {}) =>
      apiClient.get(`/reports/department/${deptId}`, { params: filters }),
    getCourse: (courseId, filters = {}) =>
      apiClient.get(`/reports/course/${courseId}`, { params: filters }),
    getCollege: (filters = {}) => apiClient.get('/reports/college', { params: filters }),
  },

  // Analytics
  analytics: {
    getCourseSummary: (courseId, filters = {}) =>
      apiClient.get(`/analytics/courses/${courseId}/summary`, { params: filters }),
    getDepartmentSummary: (deptId, filters = {}) =>
      apiClient.get(`/analytics/departments/${deptId}/summary`, { params: filters }),
    getDepartmentStudents: (deptId) =>
      apiClient.get(`/analytics/departments/${deptId}/students`),
    getCollegeSummary: (filters = {}) =>
      apiClient.get('/analytics/college/summary', { params: filters }),
  },

  // Departments
  departments: {
    list: () => apiClient.get('/departments'),
    get: (id) => apiClient.get(`/departments/${id}`),
    create: (data) => apiClient.post('/departments', data),
    update: (id, data) => apiClient.put(`/departments/${id}`, data),
    delete: (id) => apiClient.delete(`/departments/${id}`),
    getStudents: (id, params = {}) =>
      apiClient.get(`/departments/${id}/students`, { params }),
    getSections: (id, params = {}) =>
      apiClient.get(`/departments/${id}/sections`, { params }),
    getDistinctSections: (id, params = {}) =>
      apiClient.get(`/departments/${id}/sections/distinct`, { params }),
    createSection: (deptId, data) =>
      apiClient.post(`/departments/${deptId}/sections`, data),
    updateSection: (deptId, sectionId, data) =>
      apiClient.put(`/departments/${deptId}/sections/${sectionId}`, data),
    deleteSection: (deptId, sectionId) =>
      apiClient.delete(`/departments/${deptId}/sections/${sectionId}`),
  },

  // Exports
  exports: {
    courseAttendance: (courseId, filters = {}) =>
      apiClient.get(`/exports/course/${courseId}`, { 
        params: filters,
        responseType: 'blob'
      }),
    departmentAttendance: (departmentId, filters = {}) =>
      apiClient.get(`/exports/department/${departmentId}`, {
        params: filters,
        responseType: 'blob'
      }),
    collegeAttendance: (filters = {}) =>
      apiClient.get('/exports/college', {
        params: filters,
        responseType: 'blob'
      }),
    sectionWiseAttendance: (departmentId, year, format = 'csv') =>
      apiClient.get(`/exports/section-wise/${departmentId}/${year}`, {
        params: { format },
        responseType: 'blob'
      }),
    exportSectionWise: (departmentId, year, format = 'csv') =>
      apiClient.get(`/exports/section-wise/${departmentId}/${year}`, {
        params: { format },
        responseType: 'blob'
      }),
  },

  /**
   * Semesters API - Manage academic semesters
   */
  semesters: {
    list: (filters = {}) => apiClient.get('/semesters', { params: filters }),
    getActive: () => apiClient.get('/semesters/active'),
    get: (id) => apiClient.get(`/semesters/${id}`),
    create: (data) => apiClient.post('/semesters', data),
    update: (id, data) => apiClient.put(`/semesters/${id}`, data),
    delete: (id) => apiClient.delete(`/semesters/${id}`),
    activate: (id) => apiClient.post(`/semesters/${id}/activate`),
  },

  // Admin Settings
  adminSettings: {
    get: () => apiClient.get('/admin/settings'),
    update: (settings) => apiClient.put('/admin/settings', settings),
    reset: () => apiClient.post('/admin/settings/reset'),
    getAuditLogs: (params = {}) => apiClient.get('/admin/settings/audit-logs', { params }),
  },

  // Timetable
  timetable: {
    list: (filters = {}) => apiClient.get('/timetable', { params: filters }),
    get: (filters) => apiClient.get('/timetable/query', { params: filters }),
    getById: (id) => apiClient.get(`/timetable/${id}`),
    create: (data) => apiClient.post('/timetable', data),
    update: (id, data) => apiClient.put(`/timetable/${id}`, data),
    delete: (id) => apiClient.delete(`/timetable/${id}`),
  },
};

// Named export for typed axios instance
export { apiClient };

export default apiClient;
