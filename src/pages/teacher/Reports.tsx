import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Download, FileSpreadsheet, Building2, BookOpen } from 'lucide-react';
import { MiniCalendar } from '@/components/ui/mini-calendar';
import { api } from '@/api';
import { useAuth } from '@/contexts/AuthContext';

interface Department {
  _id: string;
  name: string;
  code: string;
}

interface Subject {
  _id: string;
  subjectId: string;
  name: string;
  department: Department;
}

export default function TeacherReports() {
  const { user } = useAuth();
  const [exportType, setExportType] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        // Fetch subjects assigned to this teacher
        const subjectsResponse = await api.subjects.getTeacherSubjects();
        
        if (subjectsResponse.data?.subjects) {
          const subjectsData = subjectsResponse.data.subjects as Subject[];
          setSubjects(subjectsData);
          setFilteredSubjects(subjectsData);

          // Extract unique departments
          const deptMap = new Map<string, Department>();
          subjectsData.forEach((subject: any) => {
            const dept = subject.department || subject.deptInfo;
            if (dept && !deptMap.has(dept._id)) {
              deptMap.set(dept._id, {
                _id: dept._id,
                name: dept.name,
                code: dept.code,
              });
            }
          });
          setDepartments(Array.from(deptMap.values()));
        }
      } catch (error) {
        console.error('Failed to fetch teacher data:', error);
        toast.error('Failed to load your departments and subjects');
      }
    };

    fetchTeacherData();
  }, []);

  useEffect(() => {
    // Filter subjects by selected department
    if (selectedDept) {
      const filtered = subjects.filter(
        s => (s.department?._id || (s as any).deptInfo?._id) === selectedDept
      );
      setFilteredSubjects(filtered);
      setSelectedSubject(''); // Reset subject selection when department changes
    } else {
      setFilteredSubjects(subjects);
    }
  }, [selectedDept, subjects]);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!exportType) {
      toast.error('Please select an export type');
      return;
    }

    if (exportType === 'department' && !selectedDept) {
      toast.error('Please select a department');
      return;
    }

    if (exportType === 'subject' && !selectedSubject) {
      toast.error('Please select a subject');
      return;
    }

    try {
      setIsExporting(true);
      
      const filters: any = {};
      if (dateFrom) filters.startDate = dateFrom;
      if (dateTo) filters.endDate = dateTo;

      let response;
      let filename = 'attendance_export.csv';

      if (exportType === 'department') {
        response = await api.exports.departmentAttendance(selectedDept, filters);
        const dept = departments.find(d => d._id === selectedDept);
        filename = `${dept?.code || 'dept'}_attendance_${new Date().toISOString().split('T')[0]}.csv`;
      } else if (exportType === 'subject') {
        // Use course export with subject ID
        response = await api.exports.courseAttendance(selectedSubject, filters);
        const subject = subjects.find(s => s._id === selectedSubject);
        filename = `${subject?.subjectId || 'subject'}_attendance_${new Date().toISOString().split('T')[0]}.csv`;
      } else if (exportType === 'all') {
        // Export all subjects assigned to teacher
        toast.info('Exporting all your subjects. This may take a moment...');
        // For now, just export the first department or all as college-wide
        // TODO: Backend could implement a teacher-specific export endpoint
        if (departments.length > 0) {
          response = await api.exports.departmentAttendance(departments[0]._id, filters);
          filename = `teacher_all_subjects_${new Date().toISOString().split('T')[0]}.csv`;
        } else {
          toast.error('No departments found');
          return;
        }
      }

      // Download the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Report exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Export Attendance Reports</h1>
          <p className="text-muted-foreground">Export attendance data for your departments and subjects</p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Export Configuration
            </CardTitle>
            <CardDescription>Select what data to export and date range</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleExport} className="space-y-4">
              <div className="space-y-2">
                <Label>Export Type *</Label>
                <Select value={exportType} onValueChange={setExportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select export type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All My Subjects</SelectItem>
                    <SelectItem value="department">Specific Department</SelectItem>
                    <SelectItem value="subject">Specific Subject</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {exportType === 'department' && (
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <Select value={selectedDept} onValueChange={setSelectedDept}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept._id} value={dept._id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {dept.name} ({dept.code})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {exportType === 'subject' && (
                <>
                  <div className="space-y-2">
                    <Label>Filter by Department (Optional)</Label>
                    <Select value={selectedDept} onValueChange={setSelectedDept}>
                      <SelectTrigger>
                        <SelectValue placeholder="All departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Departments</SelectItem>
                        {departments.map(dept => (
                          <SelectItem key={dept._id} value={dept._id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              {dept.name} ({dept.code})
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Subject *</Label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredSubjects.map(subject => (
                          <SelectItem key={subject._id} value={subject._id}>
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              {subject.name} ({subject.subjectId})
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>From Date (Optional)</Label>
                  <MiniCalendar
                    value={dateFrom ? new Date(dateFrom) : undefined}
                    onChange={(date) => setDateFrom(date.toISOString().split('T')[0])}
                    placeholder="Select from date"
                    maxDate={dateTo ? new Date(dateTo) : new Date()}
                  />
                </div>
                <div className="space-y-2">
                  <Label>To Date (Optional)</Label>
                  <MiniCalendar
                    value={dateTo ? new Date(dateTo) : new Date()}
                    onChange={(date) => setDateTo(date.toISOString().split('T')[0])}
                    placeholder="Select to date"
                    minDate={dateFrom ? new Date(dateFrom) : undefined}
                    maxDate={new Date()}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isExporting}>
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Your Departments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{departments.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Active departments</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Your Subjects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{subjects.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Assigned subjects</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
