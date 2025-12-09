declare module '@/api' {
  interface ApiResponse<T = unknown> {
    data: T;
    headers?: Record<string, string>;
  }

  interface ApiClient {
    auth: {
      login: (identifier: string, password: string) => Promise<ApiResponse<{ user: import('./auth').User; token: string }>>;
      logout: () => Promise<ApiResponse>;
      getCurrentUser: () => Promise<ApiResponse<{ user: import('./auth').User }>>;
    };
    departments: {
      get: (id: string) => Promise<ApiResponse<{ department: import('./auth').Department }>>;
      list: () => Promise<ApiResponse<{ departments: import('./auth').Department[] }>>;
      create: (data: Record<string, unknown>) => Promise<ApiResponse<{ department: import('./auth').Department }>>;
      update: (id: string, data: Record<string, unknown>) => Promise<ApiResponse<{ department: import('./auth').Department }>>;
      delete: (id: string) => Promise<ApiResponse>;
      getSections: (deptId: string, params?: Record<string, unknown>) => Promise<ApiResponse<{ sections: unknown[] }>>;
      getDistinctSections: (deptId: string, params?: Record<string, unknown>) => Promise<ApiResponse<{ sections: unknown[] }>>;
      getStudents: (deptId: string, params: Record<string, unknown>) => Promise<ApiResponse<{ pagination?: { total: number } }>>;
      createSection: (deptId: string, data: Record<string, unknown>) => Promise<ApiResponse>;
      deleteSection: (deptId: string, sectionId: string) => Promise<ApiResponse>;
    };
    subjects: {
      create: (data: Record<string, unknown>) => Promise<ApiResponse>;
      list: (filters?: Record<string, unknown>) => Promise<ApiResponse<{ subjects: unknown[] }>>;
      get: (subjectId: string) => Promise<ApiResponse>;
      getTeacherSubjects: (filters?: Record<string, unknown>) => Promise<ApiResponse<{ subjects: unknown[] }>>;
      update: (subjectId: string, data: Record<string, unknown>) => Promise<ApiResponse>;
      delete: (subjectId: string) => Promise<ApiResponse>;
      assignTeacher: (subjectId: string, data: Record<string, unknown>) => Promise<ApiResponse>;
    };
    sections: {
      list: (params: Record<string, unknown>) => Promise<ApiResponse<{ sections: unknown[] }>>;
    };
    users: {
      create: (data: Record<string, unknown>) => Promise<ApiResponse<{ userId: string; user: unknown }>>;
      list: (role: string, page?: number, limit?: number, departmentId?: string) => Promise<ApiResponse<{ students?: unknown[]; teachers?: unknown[]; users?: unknown[]; pagination?: { total: number } }>>;
      getStudent: (studentId: string) => Promise<ApiResponse<{ student: unknown }>>;
      getStudents: (page?: number, limit?: number) => Promise<ApiResponse<{ students: unknown[]; pagination?: { total: number } }>>;
      getStudentsByDept: (deptId: string, page?: number, limit?: number) => Promise<ApiResponse<{ students: unknown[] }>>;
      getStudentsBySection: (params: Record<string, unknown>) => Promise<ApiResponse<{ students: unknown[] }>>;
      getStudentAttendance: (studentId: string) => Promise<ApiResponse<{ subjects: unknown[]; overall: unknown }>>;
      update: (userId: string, data: Record<string, unknown>) => Promise<ApiResponse>;
      delete: (userId: string) => Promise<ApiResponse>;
      bulkDelete: (userIds: string[]) => Promise<ApiResponse>;
    };
    courses: {
      create: (data: Record<string, unknown>) => Promise<ApiResponse>;
      list: (filters?: Record<string, unknown>) => Promise<ApiResponse<{ courses: unknown[] }>>;
      getRoster: (courseId: string) => Promise<ApiResponse<{ roster: unknown[] }>>;
      assignTeacher: (courseId: string, teacherId: string) => Promise<ApiResponse>;
    };
    analytics: {
      getCourseSummary: (courseId: string, filters?: Record<string, unknown>) => Promise<ApiResponse<{ summary: unknown }>>;
      getDepartmentSummary: (deptId: string, filters?: Record<string, unknown>) => Promise<ApiResponse<{ summary: unknown }>>;
      getCollegeSummary: (filters?: Record<string, unknown>) => Promise<ApiResponse<{ summary: unknown }>>;
    };
    timetable: {
      list: (filters?: Record<string, unknown>) => Promise<ApiResponse<{ timetables: unknown[] }>>;
      get: (filters: Record<string, unknown>) => Promise<ApiResponse<{ timetable: unknown }>>;
      getById: (id: string) => Promise<ApiResponse<{ timetable: unknown }>>;
      create: (data: Record<string, unknown>) => Promise<ApiResponse<{ timetable: unknown }>>;
      update: (id: string, data: Record<string, unknown>) => Promise<ApiResponse<{ timetable: unknown }>>;
      delete: (id: string) => Promise<ApiResponse>;
    };
    attendance: {
      markSubjectAttendance: (params: Record<string, unknown>) => Promise<ApiResponse>;
      getSubjectAttendance: (params: Record<string, unknown>) => Promise<ApiResponse<{ attendanceRows: unknown[] }>>;
      getStudentOverview: (studentId: string) => Promise<ApiResponse<{ subjects: unknown[]; overall: unknown }>>;
      getConductedClassesOverview: (studentId: string) => Promise<ApiResponse<{ overview: unknown[]; overall: unknown }>>;
      getStudentHistory: (studentId: string, filters?: Record<string, unknown>) => Promise<ApiResponse<{ history: unknown[] }>>;
      getMonthlyAttendance: (userId: string, month: string) => Promise<ApiResponse<{ sessions: unknown[] }>>;
      getHistory: (params: Record<string, string>) => Promise<ApiResponse<{ history: unknown[] }>>;
      getSessionDetails: (sessionId: string) => Promise<ApiResponse<{ records: unknown[] }>>;
      updateSession: (sessionId: string, data: Record<string, unknown>) => Promise<ApiResponse>;
    };
    exports: {
      courseAttendance: (courseId: string, filters?: Record<string, unknown>) => Promise<ApiResponse<Blob>>;
      departmentAttendance: (departmentId: string, filters?: Record<string, unknown>) => Promise<ApiResponse<Blob>>;
      collegeAttendance: (filters?: Record<string, unknown>) => Promise<ApiResponse<Blob>>;
      sectionWiseAttendance: (deptId: string, year: number, format?: string) => Promise<ApiResponse<Blob>>;
    };
    semesters: {
      list: (filters?: Record<string, unknown>) => Promise<ApiResponse<{ semesters: unknown[] }>>;
      getActive: () => Promise<ApiResponse<{ semester: unknown }>>;
      get: (id: string) => Promise<ApiResponse<{ semester: unknown }>>;
      create: (data: Record<string, unknown>) => Promise<ApiResponse<{ semester: unknown }>>;
      update: (id: string, data: Record<string, unknown>) => Promise<ApiResponse<{ semester: unknown }>>;
      delete: (id: string) => Promise<ApiResponse>;
      activate: (id: string) => Promise<ApiResponse>;
    };
  }

  export const api: ApiClient;
  const apiClient: ApiClient;
  export default apiClient;
}
