import { useEffect, useMemo, useState } from 'react';
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
import { ArrowLeft, BookOpen, Users, Download, CalendarDays } from 'lucide-react';
import { MiniCalendar } from '@/components/ui/mini-calendar';
import * as XLSX from 'xlsx';

interface Department {
  _id?: string;
  name: string;
  code?: string;
}

interface Subject {
  _id: string;
  code: string;
  name: string;
  yearOfStudy: number;
  semester?: number;
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

type ExportRow = Record<string, string | number | null>;

type SectionAssignment = {
  section: { _id: string; name: string; department: string; yearOfStudy: number } | string;
  teacher?: { _id: string };
};

type TimetableSubject = {
  departmentId: string;
  year: number;
  section: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
};

type AttendanceRow = {
  studentId?: string;
  records?: Array<{ status?: StudentAttendance['status'] }>;
};

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

type ViewMode = 'years' | 'sections' | 'subjects' | 'attendance' | 'viewStudents';

export default function HodMarkAttendance() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('years');
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [sections, setSections] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
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

  const exportCsv = (rows: ExportRow[], filename: string) => {
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

  const exportXlsx = (rows: ExportRow[], filename: string) => {
    if (!rows.length) return;
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    XLSX.writeFile(workbook, filename);
  };

  const exportPdf = (rows: ExportRow[]) => {
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

  const handleViewExport = (format: 'csv' | 'xlsx' | 'pdf') => {
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
  // Load HOD's department and years
  useEffect(() => {
    const loadDepartmentAndYears = async () => {
      try {
        setIsLoading(true);
        // Get HOD's department
        const departmentId = typeof user?.department === 'string' ? user.department : user?.department?._id || user?.departmentId;
        if (!departmentId) {
          toast({ description: 'Department not found', variant: 'destructive' });
          return;
        }

        // Set department (use the full object if available, otherwise create basic object)
        if (typeof user?.department === 'object' && user.department) {
          setSelectedDept({ 
            _id: user.department._id || user.department.id || departmentId,
            name: user.department.name || 'Department',
            code: user.department.code || ''
          } as Department);
        } else if (typeof user?.department === 'string') {
          // For string department ID, try to fetch details
          try {
            const deptResponse = await api.departments.get(departmentId);
            if (deptResponse.data?.department) {
              setSelectedDept(deptResponse.data.department);
            }
          } catch (deptError) {
            // If fetch fails, create minimal department object
            setSelectedDept({ _id: departmentId, name: 'Department', code: '' });
          }
        }

        // Fetch years from both subjects and sections
        const yearsSet = new Set<number>();
        
        // Get years from subjects
        try {
          const subjectsResponse = await api.subjects.list({ departmentId });
          (subjectsResponse.data?.subjects || []).forEach((s: Subject) => {
            if (s.yearOfStudy) yearsSet.add(s.yearOfStudy);
          });
        } catch (subjectError) {
          console.warn('Could not fetch subjects:', subjectError);
        }
        
        // Get years from sections (includes years even without subjects)
        try {
          const sectionsResponse = await api.departments.getSections(departmentId);
          (sectionsResponse.data?.sections || []).forEach((section: { yearOfStudy?: number }) => {
            if (section.yearOfStudy) yearsSet.add(section.yearOfStudy);
          });
        } catch (sectionError) {
          console.warn('Could not fetch sections:', sectionError);
        }
        
        const uniqueYears = Array.from(yearsSet).sort();
        setYears(uniqueYears);
      } catch (error) {
        console.error('Failed to load department data:', error);
        toast({ description: 'Failed to load department data', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    loadDepartmentAndYears();
  }, [user, toast]);

  // Refetch attendance when session date changes
  useEffect(() => {
    if (viewMode === 'attendance' && selectedSubject && selectedSection && selectedDept && students.length > 0) {
      console.log('📅 Session date changed to:', sessionDate, '- Refetching attendance...');
      prefillExistingAttendance(selectedSubject._id, selectedSection, selectedDept._id || '', students);
    }
  }, [sessionDate]);

  // Load sections when year is selected
  const loadSections = async (year: number) => {
    if (!selectedDept || !selectedDept._id) return;
    try {
      setIsLoading(true);
      // Use the sections API to get all sections for this department and year
      // This will include sections even if they don't have subjects assigned
      const response = await api.departments.getDistinctSections(selectedDept._id, { year });
      const uniqueSections = ((response.data?.sections || []) as string[]).sort();
      setSections(uniqueSections);
      setSelectedSection(null);
      setSubjects([]);
      setSelectedSubject(null);
      setViewMode('sections');
    } catch (error) {
      console.error('Failed to load sections:', error);
      toast({ description: 'Failed to load sections', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Load subjects when section is selected
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
          
          if (timetableData.success && Array.isArray(timetableData.subjects) && timetableData.subjects.length > 0) {
            // Filter subjects for the selected department, year, and section
            const timetableSubjects: TimetableSubject[] = timetableData.subjects.filter((item: TimetableSubject) => 
              item.departmentId === selectedDept._id &&
              item.year === selectedYear &&
              item.section === section
            );
            
            console.log('✅ Timetable subjects for current selection:', timetableSubjects.length);
            
            if (timetableSubjects.length > 0) {
              // Convert timetable subjects to the Subject format
              const formattedSubjects: Subject[] = timetableSubjects.map((item) => ({
                _id: item.subjectId,
                code: item.subjectCode,
                name: item.subjectName,
                yearOfStudy: item.year,
                semester: undefined,
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
              setSelectedSubject(null);
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
      const filteredSubjects = ((response.data?.subjects || []) as Subject[]).filter(
        (subject: Subject) => {
          if (!subject.sectionAssignments) return false;
          return subject.sectionAssignments.some(
            assignment => assignment.section && assignment.section.name === section
          );
        }
      );
      setSubjects(filteredSubjects);
      setSelectedSubject(null);
      setViewMode('subjects');
    } catch (error) {
      console.error('Failed to load subjects:', error);
      toast({ description: 'Failed to load subjects', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch students when subject is selected
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

      // Store section ID for attendance submission
      const normalizedSectionId = typeof sectionIdForFilter === 'string' 
        ? sectionIdForFilter 
        : (sectionIdForFilter as { _id?: string; name: string })._id || '';
      
      console.log('📍 Section ID stored:', normalizedSectionId);
      console.log('📍 Selected section name:', selectedSection);

      // Fetch students specifically for this section
      // API expects section NAME (like "A", "B"), not the MongoDB ID
      const deptForSection = selectedDept?._id || '';
      const response = await api.users.getStudentsBySection({
        departmentId: deptForSection,
        sectionId: selectedSection, // Pass the section name, not the ID
        yearOfStudy: selectedYear
      });
      
      console.log('📊 Students response:', response.data);

      const sectionStudents = (response.data?.students || []) as Student[];
      setStudents(sectionStudents);
      
      const initialAttendance: Record<string, StudentAttendance> = {};
      sectionStudents.forEach((student: Student) => {
        initialAttendance[student._id] = {
          studentId: student._id,
          status: null,
        };
      });
      setAttendance(initialAttendance);

      // Prefill existing attendance (if already marked) for this date/subject/section
      const deptId = selectedDept?._id || '';
      await prefillExistingAttendance(subject._id, normalizedSectionId, deptForSection, sectionStudents);
      setViewMode('attendance');
    } catch (error) {
      console.error('Failed to fetch students:', error);
      toast({ description: 'Failed to load students', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Load any saved attendance to persist state after refresh
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

      const rows: AttendanceRow[] = res.data?.attendanceRows || [];
      console.log('📊 Attendance rows count:', rows.length);
      
      if (!rows.length) {
        console.log('⚠️ No attendance records found for this date');
        setHasExistingAttendance(false);
        return;
      }

      setHasExistingAttendance(true);
      setAttendance(prev => {
        const next = { ...prev };
        rows.forEach((row) => {
          // The first record in records array contains the status for the day
          const status = row.records?.[0]?.status || null;
          console.log(`👤 Student ${row.studentId}: ${status}`);
          if (row.studentId && next[row.studentId]) {
            next[row.studentId] = { studentId: row.studentId, status };
          }
        });

        // Ensure all students have an entry
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
    if (selectedSubject && selectedSection && selectedDept) {
      const sectionAssignment = selectedSubject.sectionAssignments?.find(
        (assignment: SectionAssignment) => assignment.section && typeof assignment.section !== 'string' && assignment.section.name === selectedSection
      );
      const sectionIdForFilter = sectionAssignment?.section?._id || sectionAssignment?.section;
      const normalizedSectionId = typeof sectionIdForFilter === 'string' 
        ? sectionIdForFilter 
        : (sectionIdForFilter as { _id?: string; name: string })._id || '';
      
      prefillExistingAttendance(selectedSubject._id, normalizedSectionId, selectedDept._id, students);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSubject || !selectedDept || !selectedSection) return;

    try {
      setIsSubmitting(true);
      const attendanceData = Object.values(attendance);

      // Allow saving even if some students don't have a status (they will be marked as on hold)
      if (attendanceData.length === 0) {
        toast({ description: 'No students to mark attendance for', variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }

      const sectionAssignment = selectedSubject.sectionAssignments?.find(
        (assignment: SectionAssignment) => assignment.section && typeof assignment.section !== 'string' && assignment.section.name === selectedSection
      );

      const sectionId = sectionAssignment?.section?._id || sectionAssignment?.section;

      if (!sectionId) {
        throw new Error('Section ID not found in subject assignments');
      }

      const normalizedSectionId = typeof sectionId === 'string' ? sectionId : (sectionId as { _id?: string; name: string })._id || '';

      await api.attendance.markSubjectAttendance({
        subjectId: selectedSubject._id,
        sectionId: normalizedSectionId,
        departmentId: selectedDept._id,
        date: new Date(sessionDate),
        records: attendanceData,
      });

      // Increment edit count if this was an edit operation
      if (isEditing) {
        setEditCount(prev => prev + 1);
        setIsEditing(false);
      }

      toast({ description: isEditing ? 'Attendance updated successfully' : 'Attendance marked successfully' });

      setViewMode('subjects');
      setSelectedSubject(null);
      setStudents([]);
      setAttendance({});
      setHasExistingAttendance(false);
      setIsEditing(false);
    } catch (error: unknown) {
      console.error('Failed to mark attendance:', error);
      const responseError = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast({ description: responseError || 'Failed to mark attendance', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load students for a section to view their attendance
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
    if (viewMode === 'sections') {
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
      setStudents([]);
      setAttendance({});
    }
  };

  const handleServerExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    if (!selectedDept?._id || !selectedYear) {
      toast({ description: 'Department and year must be selected', variant: 'destructive' });
      return;
    }

    try {
      setIsLoading(true);
      toast({ description: `Generating ${format.toUpperCase()} export...` });

      const response = await api.exports.sectionWiseAttendance(selectedDept._id, selectedYear, format);
      
      // Create blob and download
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : 
              format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
              format === 'pdf' ? 'application/pdf' : 'application/zip'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from Content-Disposition header if available
      const contentDisposition = response.headers['content-disposition'];
      let filename = `attendance_export_${selectedYear}.${format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?(;|$)/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({ description: 'Export downloaded successfully' });
    } catch (error: unknown) {
      console.error('Export failed:', error);
      const responseError = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast({ 
        description: responseError || 'Failed to export attendance', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredYears = useMemo(
    () => years.sort((a, b) => a - b),
    [years]
  );

  const filteredSubjects = useMemo(
    () => subjects.filter(subject => 
      subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [subjects, searchQuery]
  );

  const filteredStudents = useMemo(
    () => students.filter(student =>
      student.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [students, searchQuery]
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mark Attendance</h1>
            <p className="text-muted-foreground mt-2">
              {selectedDept && (
                <>
                  {viewMode === 'years' && `${selectedDept.name} — Select year`}
                  {viewMode === 'sections' && `${selectedDept.name} — Year ${selectedYear} — Select section`}
                  {viewMode === 'viewStudents' && `${selectedDept.name} — Year ${selectedYear} — Section ${selectedSection} — Students`}
                  {viewMode === 'subjects' && `${selectedDept.name} — Year ${selectedYear} — Section ${selectedSection} — Select subject`}
                  {viewMode === 'attendance' && `Mark attendance for ${selectedSubject?.code}`}
                </>
              )}
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
                <DropdownMenuItem onClick={() => handleViewExport('csv')}>Export CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewExport('xlsx')}>Export XLSX</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewExport('pdf')}>Export PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {viewMode !== 'years' && (
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
        </div>

        {/* Search Box */}
        <div className="flex-1">
          <Input
            placeholder={
              viewMode === 'subjects' ? 'Search subjects...' :
              viewMode === 'attendance' || viewMode === 'viewStudents' ? 'Search students...' :
              'Search...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Years View */}
        {viewMode === 'years' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {years.map(year => (
              <Card key={year} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setSelectedYear(year); loadSections(year); }}>
                <CardHeader>
                  <CardTitle className="text-lg">Year {year}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Sections View */}
        {viewMode === 'sections' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={isLoading}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Attendance
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleServerExport('csv')}>
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleServerExport('xlsx')}>
                    Export as Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleServerExport('pdf')}>
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sections.map(section => (
                <Card key={section} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{section}</CardTitle>
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => loadStudentsForView(section)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        View Students
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => { setSelectedSection(section); loadSubjects(section); }}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Mark Attendance
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* View Students */}
        {viewMode === 'viewStudents' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Students in Section {selectedSection} ({filteredStudents.length})
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
                  {filteredStudents.map(student => (
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

        {/* Subjects View */}
        {viewMode === 'subjects' && (
          <Card>
            <CardHeader>
              <CardTitle>Subjects</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                📅 Showing subjects scheduled for {new Date(sessionDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </CardHeader>
            <CardContent>
              {filteredSubjects.length === 0 ? (
                <div className="space-y-2 text-center py-8">
                  <p className="text-sm text-muted-foreground">No subjects scheduled for this day in the timetable.</p>
                  <p className="text-xs text-muted-foreground">Try selecting a different date or check if the timetable has been created.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubjects.map(subject => (
                      <TableRow key={subject._id}>
                        <TableCell>{subject.code}</TableCell>
                        <TableCell>{subject.name}</TableCell>
                        <TableCell>{subject.semester || '-'}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => { setSelectedSubject(subject); loadStudents(subject); }}
                          >
                            Mark Attendance
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Attendance View */}
        {viewMode === 'attendance' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Year</label>
                    <Input
                      type="text"
                      value={selectedYear ? `Year ${selectedYear}` : 'N/A'}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Section</label>
                    <Input
                      type="text"
                      value={selectedSection || 'N/A'}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Date</label>
                    <MiniCalendar
                      value={sessionDate ? new Date(sessionDate) : new Date()}
                      onChange={(date) => setSessionDate(date.toISOString().split('T')[0])}
                      placeholder="Select session date"
                      maxDate={new Date()}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Students ({filteredStudents.length})
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
                {hasExistingAttendance && !isEditing && (
                  <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>⚠️ Attendance Already Marked:</strong> This attendance has been submitted. Click "Edit Attendance" to make changes.
                      {user?.role === 'teacher' && ` (${5 - editCount} edits remaining)`}
                    </p>
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map(student => (
                      <TableRow key={student._id} className={student.isDetained ? 'bg-red-50' : ''}>
                        <TableCell className={student.isDetained ? 'text-red-600 font-semibold' : ''}>
                          {student.rollNo}
                          {student.isDetained && <span className="ml-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded" title={student.detainReason || 'Detained'}>DETAINED</span>}
                        </TableCell>
                        <TableCell className={student.isDetained ? 'text-red-600 font-semibold' : ''}>{student.name}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {(['present', 'absent', 'late', 'leave'] as const).map(status => (
                              <Button
                                key={status}
                                size="sm"
                                variant={attendance[student._id]?.status === status ? 'default' : 'outline'}
                                onClick={() => handleStatusChange(student._id, status)}
                                disabled={hasExistingAttendance && !isEditing}
                              >
                                {statusIcons[status]} {status}
                              </Button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>ℹ️ Note:</strong> Students without a marked status will be recorded as "on hold" (pending). You can update their status anytime.
              </p>
            </div>

            <div className="flex gap-4">
              {isEditing && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  Cancel Edit
                </Button>
              )}
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={(hasExistingAttendance && !isEditing) || isSubmitting || Object.keys(attendance).length === 0}
              >
                {isSubmitting ? 'Submitting...' : isEditing ? 'Update Attendance' : 'Submit Attendance'}
              </Button>
            </div>
          </div>
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