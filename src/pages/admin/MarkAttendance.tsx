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
import StudentAttendanceView from '@/components/StudentAttendanceView';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Users, ArrowLeft, BookOpen, CalendarDays, Download } from 'lucide-react';
import { MiniCalendar } from '@/components/ui/mini-calendar';
import * as XLSX from 'xlsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

export default function AdminMarkAttendance() {
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
        const response = await api.departments.list();
        const depts = response.data?.departments || [];
        setDepartments(depts);
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
      
      // First try to get years from sections
      const sectionsResponse = await api.departments.getSections(dept._id!);
      const sections = sectionsResponse.data?.sections || [];
      
      // Get unique years from sections
      let uniqueYears = Array.from(
        new Set(sections.map((s: Section) => s.yearOfStudy).filter((y): y is number => y !== undefined))
      ).sort() as number[];
      
      // If no sections found, fall back to subjects
      if (uniqueYears.length === 0) {
        const response = await api.subjects.list({ departmentId: dept._id });
        uniqueYears = Array.from(
          new Set((response.data?.subjects || []).map((s: Subject) => s.yearOfStudy))
        ).sort() as number[];
      }
      
      // If still no years found, show default years 1-4
      if (uniqueYears.length === 0) {
        uniqueYears = [1, 2, 3, 4];
      }
      
      setYears(uniqueYears);
      setViewMode('years');
    } catch (error) {
      console.error('Failed to load years:', error);
      // Even on error, show default years
      setYears([1, 2, 3, 4]);
      setViewMode('years');
      toast({
        description: 'Loaded default years',
        variant: 'default',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSections = async (year: number) => {
    if (!selectedDept || !selectedDept._id) return;
    try {
      setIsLoading(true);
      
      // Get sections directly from department
      const sectionsResponse = await api.departments.getSections(selectedDept._id);
      const allSections = sectionsResponse.data?.sections || [];
      
      console.log('📍 All sections from API:', allSections);
      console.log('📍 Filtering for year:', year);
      
      // Filter sections by year
      const yearSections = allSections.filter((s: Section) => s.yearOfStudy === year);
      
      console.log('📍 Sections for year', year, ':', yearSections);
      
      // Get unique section names
      const sectionNames = Array.from(
        new Set(yearSections.map((s: Section) => s.name))
      ).sort();
      
      console.log('📍 Final section names:', sectionNames);
      
      setSections(sectionNames);
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
      
      // Get all sections to find the section ID
      const sectionsResponse = await api.departments.getSections(selectedDept._id);
      const allSections = sectionsResponse.data?.sections || [];
      const sectionObj = allSections.find((s: Section) => 
        s.name === section && s.yearOfStudy === selectedYear
      );
      
      if (!sectionObj) {
        console.warn('Section not found:', section, 'Year:', selectedYear);
        setSubjects([]);
        setViewMode('subjects');
        return;
      }
      
      // Get subjects for this department and year
      const response = await api.subjects.list({ 
        departmentId: selectedDept._id,
        yearOfStudy: selectedYear 
      });
      
      const allSubjects = response.data?.subjects || [];
      
      // Filter subjects that are assigned to this section
      const filteredSubjects = allSubjects.filter((subject: Subject) => {
        if (!subject.sectionAssignments || !Array.isArray(subject.sectionAssignments)) {
          return false;
        }
        return subject.sectionAssignments.some((assignment: any) => {
          const assignmentSectionId = typeof assignment.section === 'string' 
            ? assignment.section 
            : assignment.section?._id;
          return String(assignmentSectionId) === String((sectionObj as any)._id) || 
                 assignment.section?.name === section;
        });
      });
      
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
      
      if (!selectedDept || !selectedDept._id || !selectedYear || !selectedSection) {
        throw new Error('Missing required selection data');
      }
      
      // Get the section object from the department
      const sectionsResponse = await api.departments.getSections(selectedDept._id);
      const allSections = sectionsResponse.data?.sections || [];
      const sectionObj = allSections.find((s: Section) => 
        s.name === selectedSection && s.yearOfStudy === selectedYear
      );

      if (!sectionObj || !(sectionObj as any)._id) {
        throw new Error('Section not found for this year and name');
      }

      setSelectedSectionId((sectionObj as any)._id);
      
      console.log('📍 Section ID stored:', (sectionObj as any)._id);
      console.log('📍 Selected section name:', selectedSection);

      // Fetch students for this section using the section object ID
      const response = await api.users.getStudentsBySection({
        departmentId: selectedDept._id,
        sectionId: (sectionObj as any)._id,
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

      // Prefill from existing attendance if already marked for this date/subject/section
      await prefillExistingAttendance(subject._id, (sectionObj as any)._id, selectedDept._id, sectionStudents as Student[]);
      setViewMode('attendance');
    } catch (error) {
      console.error('Failed to fetch students:', error);
      toast({
        description: 'Failed to load students. Please ensure students exist in this section.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load previously saved attendance for the given subject/section/date
  const prefillExistingAttendance = async (
    subjectId: string,
    sectionId: string,
    departmentId: string,
    studentsList: Student[]
  ) => {
    try {
      const res = await api.attendance.getSubjectAttendance({
        subjectId,
        sectionId,
        departmentId,
        period: 'day',
        date: sessionDate,
      });

      const rows = res.data?.attendanceRows || [];
      if (!rows.length) return;

      setAttendance(prev => {
        const next = { ...prev };
        rows.forEach((row: any) => {
          const status = row.records?.[0]?.status || null;
          if (row.studentId && next[row.studentId]) {
            next[row.studentId] = { studentId: row.studentId, status };
          }
        });

        // Ensure every listed student still has an entry
        studentsList.forEach(student => {
          if (!next[student._id]) {
            next[student._id] = { studentId: student._id, status: null };
          }
        });

        return next;
      });
    } catch (err) {
      console.warn('Unable to prefill existing attendance:', err);
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
      
      if (!selectedSubject._id) {
        throw new Error('Subject ID is missing');
      }
      if (!deptId) {
        throw new Error('Department ID is missing');
      }
      if (attendanceData.length === 0) {
        throw new Error('No attendance records to submit');
      }
      
      const payload = {
        subjectId: selectedSubject._id,
        sectionId: selectedSectionId,
        departmentId: deptId,
        date: sessionDate,
        records: attendanceData,
      };
      
      console.log('📤 Submitting attendance:', payload);
      
      await api.attendance.markSubjectAttendance(payload);

      console.log('✅ Attendance marked successfully');
      
      toast({
        description: 'Attendance marked successfully',
      });

      setViewMode('subjects');
      setSelectedSubject(null);
      setSelectedSectionId(null);
      setStudents([]);
      setAttendance({});
    } catch (error: any) {
      console.error('❌ Failed to mark attendance:', error);
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
      
      // Get the section object ID
      const sectionsResponse = await api.departments.getSections(selectedDept._id);
      const allSections = sectionsResponse.data?.sections || [];
      const sectionObj = allSections.find((s: Section) => 
        s.name === section && s.yearOfStudy === selectedYear
      );
      
      if (!sectionObj || !(sectionObj as any)._id) {
        console.warn('Section not found for view:', section);
        setStudents([]);
        setSelectedSection(section);
        setViewMode('viewStudents');
        return;
      }
      
      const response = await api.users.getStudentsBySection({ 
        departmentId: selectedDept._id,
        sectionId: (sectionObj as any)._id,
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
              {viewMode === 'years' && `Select year in ${selectedDept?.name}`}
              {viewMode === 'sections' && `Select section in Year ${selectedYear}`}
              {viewMode === 'viewStudents' && `Students in Section ${selectedSection}, Year ${selectedYear}`}
              {viewMode === 'subjects' && `Select subject in Section ${selectedSection}`}
              {viewMode === 'attendance' && `Mark attendance for ${selectedSubject?.name}`}
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
              <Button onClick={handleBack} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
        </div>

        {/* Departments View */}
        {viewMode === 'departments' && (
          <Card>
            <CardHeader>
              <CardTitle>Select Department</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="Search departments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
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

        {/* Years View */}
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

        {/* Sections View */}
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

        {/* View Students */}
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

        {/* Subjects View */}
        {viewMode === 'subjects' && (
          <Card>
            <CardHeader>
              <CardTitle>Select Subject</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading subjects...</p>
              ) : subjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No subjects found for this section.</p>
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
                        <div className="flex items-start gap-2">
                          <BookOpen className="h-5 w-5 mt-1 text-primary" />
                          <div>
                            <CardTitle className="text-lg">{subject.name}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">{subject.code}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>Year {subject.yearOfStudy}, Semester {subject.semester}</p>
                        </div>
                        <Button size="sm" className="w-full mt-4">
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

        {/* Attendance Marking View */}
        {viewMode === 'attendance' && selectedSubject && (
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedSubject.name} - Mark Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Date and Subject Info */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium">Subject Code</label>
                    <Input
                      type="text"
                      value={selectedSubject.code}
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
                    <label className="text-sm font-medium flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4" />
                      Session Date
                    </label>
                    <MiniCalendar
                      value={sessionDate ? new Date(sessionDate) : new Date()}
                      onChange={(date) => setSessionDate(date.toISOString().split('T')[0])}
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
                        <Button
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className="flex-1"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          {isSubmitting ? 'Saving...' : 'Save Attendance'}
                        </Button>
                        <Button
                          onClick={handleBack}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
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
