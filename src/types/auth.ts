export type UserRole = 'student' | 'teacher' | 'hod' | 'admin' | 'principal';

export interface Department {
  _id: string;
  id?: string;
  name: string;
  code: string;
}

export interface User {
  id?: string;
  _id?: string;
  name: string;
  displayName?: string;
  email: string;
  role: UserRole;
  department?: string | Department;
  departmentId?: string;
  rollNo?: string;
  programme?: string;
  batchYear?: number;
  yearOfStudy?: number;
  semester?: number;
  employeeId?: string;
  designation?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

export interface AttendanceRecord {
  sessionDate: string;
  courseName: string;
  status: AttendanceStatus;
  markedBy: string;
}

export interface CourseAttendance {
  courseId: string;
  courseName: string;
  totalClasses: number;
  attended: number;
  attendancePct: number;
}

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  status?: AttendanceStatus;
}

export interface Course {
  courseId: string;
  name: string;
  code?: string;
  students: number;
  avgPercent: number;
  departmentName?: string;
  teacher?: string;
}
