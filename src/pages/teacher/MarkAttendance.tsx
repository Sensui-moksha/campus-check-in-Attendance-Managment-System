import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import StudentAttendanceView from '@/components/StudentAttendanceView';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, BookOpen, Users, Calendar, CalendarDays, Download } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import * as XLSX from 'xlsx';

interface Department {
  _id?: string;
  name: string;
  code?: string;
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
  sectionAssignments?: Array<{ 
    section: { _id: string; name: string; department: string; yearOfStudy: number };
    teacher?: { _id: string };
  }>;
  students?: number;
}

interface Student {
  _id: string;
  name: string;
  rollNo: string;
  email: string;
  isDetained?: boolean;
  detainReason?: string;
  detainReasonType?: string;
}

const statusIcons: Record<string, string> = {
  present: '✓',
  absent: '✗',
  late: '⏰',
  leave: '📋',
};

interface StudentAttendance {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'leave' | null;
}

type ViewMode = 'departments' | 'years' | 'sections' | 'subjects' | 'attendance' | 'viewStudents';

export default function TeacherMarkAttendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [viewMode, setViewMode] = useState<ViewMode>('departments');
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [attendance, setAttendance] = useState<Record<string, StudentAttendance>>({});
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editCount, setEditCount] = useState(0);
  const [hasExistingAttendance, setHasExistingAttendance] = useState(false);

  // Build exportable rows based on current view
  const buildExportRows = () => {
    if (viewMode === 'sections') {
      return sections.map(sectionName => ({
        department: selectedDept?.name || '',
        year: selectedYear || '',
        section: sectionName,
      }));
    }
    if (viewMode === 'subjects') {
      return subjects.map(sub => ({
        department: selectedDept?.name || '',
        year: selectedYear || '',
        section: selectedSection || '',
        subject: `${sub.code} - ${sub.name}`,
      }));
    }
    if (viewMode === 'attendance') {
      return students.map(stu => ({
        department: selectedDept?.name || '',
        year: selectedYear || '',
        section: selectedSection || '',
        subject: selectedSubject ? `${selectedSubject.code} - ${selectedSubject.name}` : '',
        student: stu.name,
        rollNo: stu.rollNo,
        status: attendance[stu._id]?.status || 'on hold',
      }));
    }
    return [];
  };

  const exportCsv = (rows: any[], filename: string) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${(r[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportXlsx = (rows: any[], filename: string) => {
    if (!rows.length) return;
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    XLSX.writeFile(workbook, filename);
  };

  const exportPdf = (rows: any[]) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const table = `
      <html><head><title>Export</title></head><body>
      <table border="1" cellspacing="0" cellpadding="4">
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map(r => `<tr>${headers.map(h => `<td>${r[h] ?? ''}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
      </body></html>
    `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(table);
      win.document.close();
      win.focus();
      win.print();
    }
  };

  const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    const rows = buildExportRows();
    if (!rows.length) {
      toast({ description: 'Nothing to export for this view', variant: 'destructive' });
      return;
    }
    const baseName = viewMode === 'attendance' && selectedSection 
      ? `attendance-${selectedSection}` 
      : 'attendance-export';
    if (format === 'pdf') return exportPdf(rows);
    if (format === 'xlsx') return exportXlsx(rows, `${baseName}.xlsx`);
    exportCsv(rows, `${baseName}.csv`);
  };

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setIsLoading(true);
        
        // Get teacher's assigned subjects to extract unique departments
        const subjectsResponse = await api.subjects.getTeacherSubjects();
        const teacherSubjects = subjectsResponse.data?.subjects || [];
        
        console.log('📚 Teacher assigned subjects:', teacherSubjects);
        
        // Extract unique department IDs from teacher's subjects
        const deptIds = new Set<string>();
        teacherSubjects.forEach((subject: any) => {
          if (subject.department?._id) {
            deptIds.add(subject.department._id);
          } else if (subject.department && typeof subject.department === 'string') {
            deptIds.add(subject.department);
          }
        });
        
        console.log('🏢 Unique department IDs from subjects:', Array.from(deptIds));
        
        // Get all departments
        const response = await api.departments.list();
        const allDepts = response.data?.departments || [];
        
        // Filter to only show departments where teacher has subjects
        const teacherDepts = allDepts.filter((dept: Department) => 
          deptIds.has(dept._id || '')
        );
        
        console.log('✅ Filtered departments for teacher:', teacherDepts);
        setDepartments(teacherDepts);
      } catch (error) {
        console.error('Failed to load departments:', error);
        toast({
          description: 'Failed to load departments',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadDepartments();
  }, []);

  // Refetch attendance when session date changes
  useEffect(() => {
    if (viewMode === 'attendance' && selectedSubject && selectedSectionId && selectedDept && students.length > 0) {
      console.log('📅 Session date changed to:', sessionDate, '- Refetching attendance...');
      prefillExistingAttendance(selectedSubject._id, selectedSectionId, selectedDept._id || '', students);
    }
  }, [sessionDate]);

  const loadYears = async (dept: Department) => {
    try {
      setIsLoading(true);
      const yearsSet = new Set<number>();
      
      // Get only teacher's assigned subjects for this department
      const subjectsResponse = await api.subjects.getTeacherSubjects({ departmentId: dept._id });
      const teacherSubjects = subjectsResponse.data?.subjects || [];
      
      console.log('📚 Teacher subjects for department:', dept.name, teacherSubjects);
      
      // Extract unique years from teacher's subjects
      teacherSubjects.forEach((subject: Subject) => {
        if (subject.yearOfStudy) yearsSet.add(subject.yearOfStudy);
      });
      
      const uniqueYears = Array.from(yearsSet).sort();
      console.log('📅 Available years for teacher:', uniqueYears);
      
      setYears(uniqueYears);
      setViewMode('years');
    } catch (error) {
      console.error('Failed to load years:', error);
      toast({
        description: 'Failed to load years',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSections = async (year: number) => {
    if (!selectedDept || !selectedDept._id) return;
    try {
      setIsLoading(true);
      // Use the sections API to get all sections for this department and year
      // This will include sections even if they don't have subjects assigned
      const response = await api.departments.getDistinctSections(selectedDept._id, { year });
      const uniqueSections = (response.data?.sections || []).sort();
      setSections(uniqueSections);
      setViewMode('sections');
    } catch (error) {
      console.error('Failed to load sections:', error);
      toast({
        description: 'Failed to load sections',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubjects = async (section: string) => {
    if (!selectedDept || !selectedDept._id || !selectedYear) return;
    try {
      setIsLoading(true);
      
      // Get day of week from selected date
      const date = new Date(sessionDate);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = days[date.getDay()];
      
      console.log('📅 Selected date:', sessionDate, 'Day:', dayOfWeek);
      
      // First, try to get subjects from timetable for the selected day
      try {
        const timetableResponse = await fetch(`/api/timetable/teacher-subjects-day?day=${dayOfWeek}&date=${sessionDate}`, {
          credentials: 'include',
        });
        
        if (timetableResponse.ok) {
          const timetableData = await timetableResponse.json();
          console.log('📋 Timetable subjects for', dayOfWeek, ':', timetableData.subjects);
          
          if (timetableData.success && timetableData.subjects && timetableData.subjects.length > 0) {
            // Filter subjects for the selected department, year, and section
            const timetableSubjects = timetableData.subjects.filter((item: any) => 
              item.departmentId === selectedDept._id &&
              item.year === selectedYear &&
              item.section === section
            );
            
            console.log('✅ Timetable subjects for current selection:', timetableSubjects.length);
            
            if (timetableSubjects.length > 0) {
              // Convert timetable subjects to the Subject format
              const formattedSubjects = timetableSubjects.map((item: any) => ({
                _id: item.subjectId,
                code: item.subjectCode,
                name: item.subjectName,
                yearOfStudy: item.year,
                sectionAssignments: [{
                  section: {
                    _id: item.section,
                    name: item.section,
                    department: item.departmentId,
                    yearOfStudy: item.year
                  }
                }]
              }));
              
              setSubjects(formattedSubjects);
              setViewMode('subjects');
              setIsLoading(false);
              return;
            }
          }
        }
      } catch (timetableError) {
        console.warn('⚠️ Could not fetch timetable, showing all subjects:', timetableError);
      }
      
      // Fallback: Show all subjects if timetable not available
      const response = await api.subjects.list({ 
        departmentId: selectedDept._id,
        yearOfStudy: selectedYear 
      });
      
      console.log('📚 All subjects fetched:', response.data?.subjects?.length);
      console.log('👤 Current user ID:', user?._id);
      
      // Show all subjects in this department/section so another teacher can mark if the primary teacher is absent
      const filteredSubjects = (response.data?.subjects || []).filter(
        (subject: Subject) => {
          if (!subject.sectionAssignments || !Array.isArray(subject.sectionAssignments)) {
            return false;
          }

          return subject.sectionAssignments.some((assignment: any) => {
            const sectionMatch = assignment.section && assignment.section.name === section;
            if (sectionMatch) {
              console.log(`📖 Subject: ${subject.name}, Section: ${assignment.section.name}`);
            }
            return sectionMatch;
          });
        }
      );
      
      console.log('✅ Filtered subjects for section', section, ':', filteredSubjects.length);
      
      setSubjects(filteredSubjects as Subject[]);
      setViewMode('subjects');
    } catch (error) {
      console.error('Failed to load subjects:', error);
      toast({
        description: 'Failed to load subjects',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudents = async (subject: Subject) => {
    try {
      setIsLoading(true);
      // Get the section ID from the subject's section assignments for the selected section
      const sectionAssignment = subject.sectionAssignments?.find(
        assignment => assignment.section && assignment.section.name === selectedSection
      );
      const sectionIdForFilter = sectionAssignment?.section?._id || sectionAssignment?.section;

      if (!sectionIdForFilter) {
        throw new Error('Section not found in subject assignments');
      }

      // Store the section ID for later use when submitting attendance
      const normalizedSectionId = typeof sectionIdForFilter === 'string' 
        ? sectionIdForFilter 
        : sectionIdForFilter._id || sectionIdForFilter;
      setSelectedSectionId(typeof normalizedSectionId === 'string' ? normalizedSectionId : normalizedSectionId._id);
      
      console.log('📍 Section ID stored:', normalizedSectionId);
      console.log('📍 Selected section name:', selectedSection);

      // Fetch students specifically for this section
      // API expects section NAME (like "A", "B"), not the MongoDB ID
      const deptForSection = selectedDept?._id || (selectedDept as any).id;
      const response = await api.users.getStudentsBySection({
        departmentId: deptForSection,
        sectionId: selectedSection, // Pass the section name, not the ID
        yearOfStudy: selectedYear
      });
      
      console.log('📊 Students response:', response.data);

      const sectionStudents = response.data?.students || [];
      setStudents(sectionStudents as Student[]);
      
      const initialAttendance: Record<string, StudentAttendance> = {};
      sectionStudents.forEach((student: Student) => {
        initialAttendance[student._id] = {
          studentId: student._id,
          status: null,
        };
      });
      setAttendance(initialAttendance);

      // Prefill if attendance already exists for this date/subject/section
      await prefillExistingAttendance(subject._id, typeof normalizedSectionId === 'string' ? normalizedSectionId : normalizedSectionId._id, deptForSection, sectionStudents as Student[]);
      setViewMode('attendance');
    } catch (error) {
      console.error('Failed to fetch students:', error);
      toast({
        description: 'Failed to load students',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load any previously saved attendance to keep state after refresh
  const prefillExistingAttendance = async (
    subjectId: string,
    sectionId: string,
    departmentId: string,
    studentsList: Student[]
  ) => {
    try {
      console.log('🔄 Prefilling attendance for date:', sessionDate);
      const res = await api.attendance.getSubjectAttendance({
        subjectId,
        sectionId,
        departmentId,
        period: 'day',
        date: sessionDate,
      });

      console.log('📥 Attendance API response:', res.data);

      const rows = res.data?.attendanceRows || [];
      console.log('📊 Attendance rows count:', rows.length);
      
      if (!rows.length) {
        console.log('⚠️ No attendance records found for this date');
        setHasExistingAttendance(false);
        return;
      }

      setHasExistingAttendance(true);
      setAttendance(prev => {
        const next = { ...prev };
        rows.forEach((row: any) => {
          const status = row.records?.[0]?.status || null;
          console.log(`👤 Student ${row.studentId}: ${status}`);
          if (row.studentId && next[row.studentId]) {
            next[row.studentId] = { studentId: row.studentId, status };
          }
        });

        studentsList.forEach(student => {
          if (!next[student._id]) {
            next[student._id] = { studentId: student._id, status: null };
          }
        });

        console.log('✅ Attendance state updated with prefilled data');
        return next;
      });
    } catch (err) {
      console.error('❌ Unable to prefill existing attendance:', err);
    }
  };

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late' | 'leave') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleEditAttendance = () => {
    // Check if user can edit
    const userRole = user?.role;
    const canEditUnlimited = userRole === 'admin' || userRole === 'hod' || userRole === 'principal';
    const maxEdits = canEditUnlimited ? Infinity : 5;

    if (!canEditUnlimited && editCount >= maxEdits) {
      toast({ 
        description: `Teachers can only edit attendance ${maxEdits} times. Contact admin for more edits.`, 
        variant: 'destructive' 
      });
      return;
    }

    setIsEditing(true);
    toast({ 
      description: canEditUnlimited 
        ? 'Edit mode enabled' 
        : `Edit mode enabled (${editCount + 1}/${maxEdits} edits)` 
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reload the original attendance data
    if (selectedSubject && selectedSectionId && selectedDept) {
      prefillExistingAttendance(selectedSubject._id, selectedSectionId, selectedDept._id || '', students);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSubject || !selectedDept || !selectedSectionId) {
      console.error('❌ Missing required data:', { selectedSubject, selectedDept, selectedSectionId });
      toast({
        description: 'Missing required data. Please try selecting the subject again.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const attendanceData = Object.values(attendance);

      // Allow saving even if some students don't have a status (they will be marked as on hold)
      if (attendanceData.length === 0) {
        toast({ description: 'No students to mark attendance for', variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }
      
      const deptId = selectedDept?._id || (selectedDept as any).id;
      
      // Validate all required fields before sending
      if (!selectedSubject._id) {
        throw new Error('Subject ID is missing');
      }
      if (!deptId) {
        throw new Error('Department ID is missing');
      }
      if (attendanceData.length === 0) {
        throw new Error('No attendance records to submit');
      }
      
      // Ensure proper data types
      const payload = {
        subjectId: selectedSubject._id,
        sectionId: selectedSectionId, // Use the stored section ID
        departmentId: deptId,
        date: sessionDate, // Send as YYYY-MM-DD string
        records: attendanceData,
      };
      
      console.log('📤 Submitting attendance with payload:', {
        ...payload,
        subjectName: selectedSubject.name,
        sectionName: selectedSection,
        departmentName: selectedDept.name,
        recordsCount: attendanceData.length,
        sampleRecord: attendanceData[0], // Log first record to verify structure
      });
      
      await api.attendance.markSubjectAttendance(payload);

      console.log('✅ Attendance marked successfully');

      // Increment edit count if this was an edit operation
      if (isEditing) {
        setEditCount(prev => prev + 1);
        setIsEditing(false);
      }
      
      toast({
        description: isEditing ? 'Attendance updated successfully' : 'Attendance marked successfully',
      });

      setViewMode('subjects');
      setSelectedSubject(null);
      setSelectedSectionId(null);
      setStudents([]);
      setAttendance({});
      setHasExistingAttendance(false);
      setIsEditing(false);
    } catch (error: any) {
      console.error('❌ Failed to mark attendance:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast({
        description: error.response?.data?.error || 'Failed to mark attendance',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadStudentsForView = async (section: string) => {
    if (!selectedDept || !selectedDept._id || !selectedYear) return;
    try {
      setIsLoading(true);
      const response = await api.users.getStudentsBySection({ 
        departmentId: selectedDept._id,
        sectionId: section,
        yearOfStudy: selectedYear
      });
      setStudents((response.data?.students || []) as Student[]);
      setSelectedSection(section);
      setViewMode('viewStudents');
    } catch (error) {
      console.error('Failed to load students:', error);
      toast({ description: 'Failed to load students', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (viewMode === 'years') {
      setViewMode('departments');
      setSelectedDept(null);
      setYears([]);
    } else if (viewMode === 'sections') {
      setViewMode('years');
      setSelectedYear(null);
      setSections([]);
    } else if (viewMode === 'viewStudents') {
      setViewMode('sections');
      setSelectedSection(null);
      setStudents([]);
    } else if (viewMode === 'subjects') {
      setViewMode('sections');
      setSelectedSection(null);
      setSubjects([]);
    } else if (viewMode === 'attendance') {
      setViewMode('subjects');
      setSelectedSubject(null);
      setSelectedSectionId(null);
      setStudents([]);
      setAttendance({});
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mark Attendance</h1>
            <p className="text-muted-foreground mt-2">
              {viewMode === 'departments' && 'Select a department to begin'}
              {viewMode === 'years' && `${selectedDept?.name} — Select year`}
              {viewMode === 'sections' && `${selectedDept?.name} — Year ${selectedYear} — Select section`}
              {viewMode === 'viewStudents' && `${selectedDept?.name} — Year ${selectedYear} — Section ${selectedSection} — Students`}
              {viewMode === 'subjects' && `${selectedDept?.name} — Year ${selectedYear} — Section ${selectedSection} — Select subject`}
              {viewMode === 'attendance' && `Mark attendance for ${selectedSubject?.code}`}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('csv')}>Export CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('xlsx')}>Export XLSX</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>Export PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {viewMode !== 'departments' && (
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
        </div>

        {viewMode === 'departments' && (
          <Card>
            <CardHeader>
              <CardTitle>Departments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Search departments..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {isLoading ? (
                <p>Loading departments...</p>
              ) : filteredDepartments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No departments found.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDepartments.map(dept => (
                    <Card 
                      key={dept._id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setSelectedDept(dept);
                        loadYears(dept);
                      }}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">{dept.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">Code: {dept.code}</p>
                        <Button size="sm" className="w-full mt-4">
                          View Years
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {viewMode === 'years' && (
          <Card>
            <CardHeader>
              <CardTitle>Years of Study</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading years...</p>
              ) : years.length === 0 ? (
                <p className="text-sm text-muted-foreground">No years found for this department.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {years.map(year => (
                    <Card 
                      key={year}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setSelectedYear(year);
                        loadSections(year);
                      }}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">Year {year}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button size="sm" className="w-full">
                          View Sections
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {viewMode === 'sections' && (
          <Card>
            <CardHeader>
              <CardTitle>Sections</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading sections...</p>
              ) : sections.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sections found for this year.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {sections.map(section => (
                    <Card 
                      key={section}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">Section {section}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="w-full"
                          onClick={() => loadStudentsForView(section)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          View Students
                        </Button>
                        <Button 
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setSelectedSection(section);
                            loadSubjects(section);
                          }}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Mark Attendance
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {viewMode === 'viewStudents' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Students in Section {selectedSection} ({students.filter(student =>
                  student.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  student.name.toLowerCase().includes(searchQuery.toLowerCase())
                ).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students
                    .filter(student =>
                      student.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      student.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(student => (
                      <TableRow key={student._id} className={student.isDetained ? 'bg-red-50' : ''}>
                        <TableCell className={student.isDetained ? 'text-red-600 font-semibold' : ''}>
                          {student.rollNo}
                          {student.isDetained && <span className="ml-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded">DETAINED</span>}
                        </TableCell>
                        <TableCell className={student.isDetained ? 'text-red-600 font-semibold' : ''}>{student.name}</TableCell>
                        <TableCell className={student.isDetained ? 'text-red-600' : ''}>{student.email}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowCalendar(true);
                            }}
                          >
                            <CalendarDays className="h-4 w-4 mr-2" />
                            View Attendance
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {viewMode === 'subjects' && (
          <Card>
            <CardHeader>
              <CardTitle>Subjects</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                📅 Showing subjects scheduled for {new Date(sessionDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading subjects...</p>
              ) : subjects.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">No subjects scheduled for this day in the timetable.</p>
                  <p className="text-xs text-muted-foreground">Try selecting a different date or check if the timetable has been created by your administrator.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjects.map(subject => (
                    <Card 
                      key={subject._id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setSelectedSubject(subject);
                        loadStudents(subject);
                      }}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">{subject.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm text-muted-foreground">Code: {subject.code}</p>
                        {subject.semester && (
                          <p className="text-sm text-muted-foreground">Semester: {subject.semester}</p>
                        )}
                        <Button size="sm" className="w-full mt-4">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Mark Attendance
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {viewMode === 'attendance' && selectedSubject && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {selectedSubject.name} ({selectedSubject.code}) - Mark Attendance
                </CardTitle>
                {hasExistingAttendance && !isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditAttendance}
                    className="flex items-center gap-2"
                  >
                    ✏️ Edit Attendance
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {hasExistingAttendance && !isEditing && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>⚠️ Attendance Already Marked:</strong> This attendance has been submitted. Click "Edit Attendance" to make changes.
                      {user?.role === 'teacher' && ` (${5 - editCount} edits remaining)`}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium">Year</label>
                    <Input
                      type="text"
                      value={selectedYear ? `Year ${selectedYear}` : 'N/A'}
                      disabled
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Section</label>
                    <Input
                      type="text"
                      value={selectedSection || 'N/A'}
                      disabled
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4" />
                      Session Date
                    </label>
                    <DatePicker
                      value={sessionDate}
                      onChange={(date) => setSessionDate(date)}
                      placeholder="Select session date"
                      maxDate={new Date()}
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{students.length} students</span>
                    </div>
                  </div>
                </div>

                {isLoading ? (
                  <p className="text-muted-foreground">Loading students...</p>
                ) : students.length === 0 ? (
                  <p className="text-muted-foreground">No students in this subject</p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Roll No</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map(student => (
                          <TableRow key={student._id} className={student.isDetained ? 'bg-red-50' : ''}>
                            <TableCell className={student.isDetained ? 'text-red-600 font-semibold' : ''}>
                              {student.rollNo}
                              {student.isDetained && <span className="ml-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded" title={student.detainReason || 'Detained'}>DETAINED</span>}
                            </TableCell>
                            <TableCell className={student.isDetained ? 'text-red-600 font-semibold' : ''}>{student.name}</TableCell>
                            <TableCell className={student.isDetained ? 'text-red-600' : ''}>{student.email}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {(['present', 'absent', 'late', 'leave'] as const).map(status => (
                                  <Button
                                    key={status}
                                    size="sm"
                                    variant={
                                      attendance[student._id]?.status === status
                                        ? 'default'
                                        : 'outline'
                                    }
                                    onClick={() => handleStatusChange(student._id, status)}
                                    disabled={hasExistingAttendance && !isEditing}
                                  >
                                    {statusIcons[status]}
                                  </Button>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                          <strong>ℹ️ Note:</strong> Students without a marked status will be recorded as "on hold" (pending). You can update their status anytime.
                        </p>
                      </div>
                      <div className="flex gap-4">
                        {isEditing && (
                          <Button
                            onClick={handleCancelEdit}
                            variant="outline"
                            disabled={isSubmitting}
                            className="flex-1"
                          >
                            Cancel Edit
                          </Button>
                        )}
                        <Button
                          onClick={handleSubmit}
                          disabled={(hasExistingAttendance && !isEditing) || isSubmitting}
                          className="flex-1"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          {isSubmitting ? 'Saving...' : isEditing ? 'Update Attendance' : 'Save Attendance'}
                        </Button>
                        {!isEditing && (
                          <Button
                            onClick={handleBack}
                            variant="outline"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Student Attendance Full Page View */}
      {showCalendar && selectedStudent && (
        <StudentAttendanceView
          studentId={selectedStudent._id}
          studentName={selectedStudent.name}
          studentRollNo={selectedStudent.rollNo}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </DashboardLayout>
  );
}
