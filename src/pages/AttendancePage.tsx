import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MiniCalendar } from '@/components/ui/mini-calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/api';
import tokens from '@/styles/tokens';
import { toast } from 'sonner';

interface Department {
  _id: string;
  name: string;
  code: string;
}

interface Section {
  _id: string;
  name: string;
  yearOfStudy?: number;
}

interface Subject {
  _id: string;
  code: string;
  name: string;
  yearOfStudy: number;
  semester: number;
  section?: Section;
  department?: Department;
}

interface Student {
  _id: string;
  name: string;
  rollNo: string;
  email: string;
}

const statusIcons: Record<string, string> = {
  present: '✓',
  absent: '✗',
  late: '⏰',
  leave: '📋',
};

const statusColors: Record<string, string> = {
  present: tokens.colors.status.present,
  absent: tokens.colors.status.absent,
  late: tokens.colors.status.late,
  leave: tokens.colors.status.leave,
};

export default function AttendancePage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const isHod = user?.role === 'hod';
  const isAdmin = user?.role === 'admin' || user?.role === 'principal';

  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);

  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load departments
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await api.departments.list();
        setDepartments(response.data.departments || []);

        // For HOD, preselect their department
        if (isHod && user?.department) {
          const deptId = typeof user.department === 'string' ? user.department : user.department._id;
          setSelectedDept(deptId);
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
        setError('Failed to load departments');
      }
    };

    loadDepartments();
  }, [isHod, user]);

  // Load sections and years for selected department
  useEffect(() => {
    if (!selectedDept) {
      setSections([]);
      setSelectedYear('');
      setSelectedSection('');
      return;
    }

    const loadSections = async () => {
      try {
        const response = await api.departments.getSections(selectedDept);
        setSections(response.data.sections || []);
      } catch (err) {
        console.error('Failed to load sections:', err);
        setSections([]);
      }
    };

    loadSections();
  }, [selectedDept]);

  // Load subjects based on role and selections
  useEffect(() => {
    if (!selectedDept || !selectedYear || !selectedSection) {
      setSubjects([]);
      setSelectedSubject('');
      return;
    }

    const loadSubjects = async () => {
      try {
        let response;

        if (isTeacher) {
          // Teachers see only their assigned subjects
          response = await api.subjects.getTeacherSubjects({
            departmentId: selectedDept,
            yearOfStudy: selectedYear,
            sectionId: selectedSection,
          });
        } else {
          // Admin/HOD see all subjects for this year/semester
          response = await api.subjects.list({
            yearOfStudy: selectedYear,
          });
        }

        setSubjects(response.data.subjects || []);
      } catch (err) {
        console.error('Failed to load subjects:', err);
        setSubjects([]);
      }
    };

    loadSubjects();
  }, [selectedDept, selectedYear, selectedSection, isTeacher]);

  // Load students for selected subject-section
  useEffect(() => {
    if (!selectedSubject || !selectedDept || !selectedSection) {
      setStudents([]);
      setAttendance({});
      return;
    }

    const loadStudents = async () => {
      try {
        setLoading(true);
        const response = await api.users.getStudentsBySection({
          departmentId: selectedDept,
          sectionId: selectedSection,
          yearOfStudy: selectedYear || undefined,
        });

        setStudents(response.data.students || []);
        
        // Initialize attendance map
        const initialAttendance: Record<string, string> = {};
        response.data.students.forEach((student: Student) => {
          initialAttendance[student._id] = 'absent';
        });
        setAttendance(initialAttendance);
        setSubmitted(false);
      } catch (err) {
        console.error('Failed to load students:', err);
        setError('Failed to load students');
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [selectedSubject, selectedDept, selectedSection, selectedYear]);

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    if (!selectedSubject) {
      setError('Please select a subject');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const records = students.map(student => ({
        studentId: student._id,
        status: attendance[student._id] || 'absent',
      }));

      await api.attendance.markSubjectAttendance({
        subjectId: selectedSubject,
        sectionId: selectedSection,
        departmentId: selectedDept,
        date: sessionDate,
        records,
      });

      toast.success('Attendance marked successfully!');
      setSubmitted(true);
    } catch (err) {
      console.error('Error marking attendance:', err);
      setError('Failed to mark attendance');
      toast.error('Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const years = [1, 2, 3, 4];
  const selectedSubjectData = subjects.find(s => s._id === selectedSubject);

  const handleExportAttendance = async () => {
    if (!selectedDept || !selectedYear) {
      toast.error('Please select department and year to export');
      return;
    }

    try {
      toast.info('Generating attendance report...');
      const format = 'xlsx'; // Can be 'csv', 'xlsx', or 'pdf'
      const response = await api.exports.exportSectionWise(selectedDept, selectedYear, format);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const dept = departments.find(d => d._id === selectedDept);
      const filename = `${dept?.name || 'Department'}_Year${selectedYear}_Attendance.${format === 'xlsx' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'csv'}`;
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Attendance exported successfully!');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.error || 'Failed to export attendance');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mark Attendance</h1>
            <p className="text-muted-foreground mt-2">
              {isTeacher ? 'Mark attendance for your assigned subjects' : 'Mark attendance for any subject'}
            </p>
          </div>
          {selectedDept && selectedYear && (
            <Button
              variant="outline"
              onClick={handleExportAttendance}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </Button>
          )}
        </div>

        {/* Selectors */}
        <Card>
          <CardHeader>
            <CardTitle>Select Subject</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Department Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  disabled={isHod}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Year of Study</label>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Year</option>
                  {years.map(year => (
                    <option key={year} value={year}>
                      Year {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Section</label>
                <select
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Section</option>
                  {sections.map(section => (
                    <option key={section._id} value={section._id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Subject</option>
                  {subjects.map(subject => (
                    <option key={subject._id} value={subject._id}>
                      {subject.code} - {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Session Date</label>
              <MiniCalendar
                value={sessionDate ? new Date(sessionDate) : new Date()}
                onChange={(date) => setSessionDate(date.toISOString().split('T')[0])}
                placeholder="Select session date"
                maxDate={new Date()}
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Students Table */}
        {students.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedSubjectData ? `${selectedSubjectData.code} - ${selectedSubjectData.name}` : 'Students'}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {students.length} student(s) in this section
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: tokens.colors.surface }}>
                      <th style={{ padding: tokens.spacing.md, textAlign: 'left', fontWeight: tokens.typography.fontWeight.semibold }}>Roll No</th>
                      <th style={{ padding: tokens.spacing.md, textAlign: 'left', fontWeight: tokens.typography.fontWeight.semibold }}>Student Name</th>
                      <th style={{ padding: tokens.spacing.md, textAlign: 'center', fontWeight: tokens.typography.fontWeight.semibold }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, idx) => (
                      <tr
                        key={student._id}
                        style={{
                          backgroundColor: idx % 2 === 0 ? tokens.colors.white : tokens.colors.surface,
                          borderBottom: `1px solid ${tokens.colors.border}`,
                        }}
                      >
                        <td style={{ padding: tokens.spacing.md }}>{student.rollNo}</td>
                        <td style={{ padding: tokens.spacing.md }}>{student.name}</td>
                        <td style={{ padding: tokens.spacing.md, textAlign: 'center' }}>
                          <select
                            value={attendance[student._id] || 'absent'}
                            onChange={e => handleStatusChange(student._id, e.target.value)}
                            disabled={submitted && !['hod', 'admin', 'principal'].includes(user?.role || '')}
                            style={{
                              padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                              borderRadius: tokens.borderRadius.md,
                              border: `1px solid ${tokens.colors.border}`,
                              backgroundColor: statusColors[attendance[student._id] || 'absent'] || tokens.colors.white,
                              color: tokens.colors.white,
                              cursor: 'pointer',
                              fontWeight: tokens.typography.fontWeight.medium,
                            }}
                          >
                            <option value="present" style={{ color: tokens.colors.text }}>
                              {statusIcons.present} Present
                            </option>
                            <option value="absent" style={{ color: tokens.colors.text }}>
                              {statusIcons.absent} Absent
                            </option>
                            <option value="late" style={{ color: tokens.colors.text }}>
                              {statusIcons.late} Late
                            </option>
                            <option value="leave" style={{ color: tokens.colors.text }}>
                              {statusIcons.leave} Leave
                            </option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading || students.length === 0}
                className="w-full"
              >
                {loading ? 'Marking...' : submitted ? 'Update Attendance' : 'Mark Attendance'}
              </Button>
            </CardContent>
          </Card>
        )}

        {students.length === 0 && selectedSubject && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No students found for the selected subject-section combination</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
