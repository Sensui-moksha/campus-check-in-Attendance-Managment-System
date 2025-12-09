import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Forbidden from "./pages/Forbidden";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";

// Student
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentHistory from "./pages/student/StudentHistory";
import StudentProfile from "./pages/student/StudentProfile";
import StudentAttendanceCalendar from "./pages/student/AttendanceCalendar";
import ConductedClasses from "./pages/student/ConductedClasses";

// Shared
import ViewTimetable from "./pages/ViewTimetable";

// Teacher
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherMarkAttendance from "./pages/teacher/MarkAttendance";
import TeacherReports from "./pages/teacher/Reports";

// HOD
import HodDashboard from "./pages/hod/HodDashboard";
import DepartmentReport from "./pages/hod/DepartmentReport";
import HodMarkAttendance from "./pages/hod/MarkAttendance";
import ManageTeachers from "./pages/hod/ManageTeachers";
import ManageStudents from "./pages/hod/ManageStudents";
import ManageSections from "./pages/hod/ManageSections";
import AttendanceHistory from "./pages/AttendanceHistory";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMarkAttendance from "./pages/admin/MarkAttendance";
import PrincipalDashboard from "./pages/admin/PrincipalDashboard";
import PrincipalMarkAttendance from "./pages/admin/PrincipalMarkAttendance";
import CreateUser from "./pages/admin/CreateUser";
import ManageSubjects from './pages/admin/ManageSubjects';
import ManageTimetable from './pages/admin/ManageTimetable';
import ManageSemesters from './pages/admin/ManageSemesters';
import DetainList from './pages/admin/DetainList';
import BulkDetain from './pages/admin/BulkDetain';
import Reports from "./pages/admin/Reports";
import ImportStudents from "./pages/admin/ImportStudents";
import ExportTemplates from "./pages/admin/ExportTemplates";
import DepartmentYear from "./pages/admin/DepartmentYear";
import DepartmentSection from "./pages/admin/DepartmentSection";
import AdminSettings from "./pages/admin/AdminSettings";
import ManageHODs from "./pages/admin/ManageHODs";

const queryClient = new QueryClient();

const App = () => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forbidden" element={<Forbidden />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'hod', 'admin', 'principal']}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Student Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/conducted-classes"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <ConductedClasses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/history"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/calendar"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentAttendanceCalendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile/:studentId"
              element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'hod', 'admin', 'principal']}>
                  <StudentProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/timetable"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <ViewTimetable />
                </ProtectedRoute>
              }
            />

            {/* Teacher Routes */}
            <Route
              path="/teacher/dashboard"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/mark-attendance"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherMarkAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/reports"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/timetable"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <ViewTimetable />
                </ProtectedRoute>
              }
            />

            {/* HOD Routes */}
            <Route
              path="/hod/dashboard"
              element={
                <ProtectedRoute allowedRoles={['hod']}>
                  <HodDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hod/mark-attendance"
              element={
                <ProtectedRoute allowedRoles={['hod']}>
                  <HodMarkAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hod/manage-teachers"
              element={
                <ProtectedRoute allowedRoles={['hod']}>
                  <ManageTeachers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hod/manage-students"
              element={
                <ProtectedRoute allowedRoles={['hod']}>
                  <ManageStudents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hod/manage-sections"
              element={
                <ProtectedRoute allowedRoles={['hod']}>
                  <ManageSections />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hod/manage-subjects"
              element={
                <ProtectedRoute allowedRoles={['hod']}>
                  <ManageSubjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hod/department-report"
              element={
                <ProtectedRoute allowedRoles={['hod']}>
                  <DepartmentReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hod/timetable"
              element={
                <ProtectedRoute allowedRoles={['hod']}>
                  <ViewTimetable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance/history"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'hod', 'admin', 'principal']}>
                  <AttendanceHistory />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/principal/dashboard"
              element={
                <ProtectedRoute allowedRoles={['principal']}>
                  <PrincipalDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/principal/mark-attendance"
              element={
                <ProtectedRoute allowedRoles={['principal']}>
                  <PrincipalMarkAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/mark-attendance"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminMarkAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/create-user"
              element={
                <ProtectedRoute allowedRoles={['admin', 'principal']}>
                  <CreateUser />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/manage-subjects"
              element={
                <ProtectedRoute allowedRoles={['admin', 'principal', 'hod']}>
                  <ManageSubjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/timetable"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ViewTimetable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/principal/timetable"
              element={
                <ProtectedRoute allowedRoles={['principal']}>
                  <ViewTimetable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/manage-timetable"
              element={
                <ProtectedRoute allowedRoles={['admin', 'principal', 'hod']}>
                  <ManageTimetable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/manage-semesters"
              element={
                <ProtectedRoute allowedRoles={['admin', 'principal', 'hod']}>
                  <ManageSemesters />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/detain"
              element={
                <ProtectedRoute allowedRoles={['admin', 'principal', 'hod']}>
                  <DetainList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/bulk-detain"
              element={
                <ProtectedRoute allowedRoles={['admin', 'principal', 'hod']}>
                  <BulkDetain />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={['admin', 'principal']}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/department/:deptId/year/:year"
              element={
                <ProtectedRoute allowedRoles={['admin','hod','principal']}>
                  <DepartmentYear />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/department/:deptId/year/:year/section/:section"
              element={
                <ProtectedRoute allowedRoles={['admin','hod','principal']}>
                  <DepartmentSection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/import-students"
              element={
                <ProtectedRoute allowedRoles={['admin', 'principal', 'hod']}>
                  <ImportStudents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/export-templates"
              element={
                <ProtectedRoute allowedRoles={['admin', 'principal', 'hod']}>
                  <ExportTemplates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/manage-hods"
              element={
                <ProtectedRoute allowedRoles={['admin', 'principal']}>
                  <ManageHODs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
