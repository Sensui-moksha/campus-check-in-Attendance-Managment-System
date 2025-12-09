import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { Edit, Eye, Download, RotateCcw, ClipboardList } from 'lucide-react';
import { MiniCalendar } from '@/components/ui/mini-calendar';
import * as XLSX from 'xlsx';

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

interface HistoryItem {
  sessionId: string;
  date?: string;
  courseName?: string;
  courseCode?: string;
  yearOfStudy?: number;
  semester?: number;
  section?: { id: string; name: string; yearOfStudy?: number } | null;
  department?: { id: string; name: string; code: string } | null;
  markedBy?: { id: string; name: string; role: string } | null;
  markedAt?: string;
  counts: { present: number; absent: number; late: number; leave: number; total: number };
}

interface AttendanceRecord {
  _id: string;
  student: {
    _id: string;
    name: string;
    rollNo: string;
  };
  status: 'present' | 'absent' | 'late' | 'leave';
}

const defaultRange = () => {
  const today = new Date();
  const from = new Date();
  from.setDate(today.getDate() - 30);
  return {
    from: from.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
  };
};

export default function AttendanceHistory() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Radix Select cannot use an empty string as a value; map "all" to empty for filters
  const ALL_VALUE = 'all';

  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [semesters, setSemesters] = useState<number[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    departmentId: '',
    sectionId: '',
    year: '',
    semester: '',
    from: defaultRange().from,
    to: defaultRange().to,
  });
  const [editDialog, setEditDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<HistoryItem | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [editedRecords, setEditedRecords] = useState<Record<string, 'present' | 'absent' | 'late' | 'leave'>>({});

  console.log('AttendanceHistory component mounted');
  console.log('User:', user);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await api.departments.list();
        setDepartments(resp.data?.departments || []);
      } catch (error) {
        console.error('Failed to load departments', error);
        toast({
          description: 'Failed to load departments',
          variant: 'destructive',
        });
      }
    };
    load();
  }, []);

  // Load sections when department changes
  useEffect(() => {
    const loadSections = async () => {
      if (!filters.departmentId) {
        setSections([]);
        return;
      }
      try {
        const resp = await api.sections.list({ departmentId: filters.departmentId });
        setSections(resp.data?.sections || []);
      } catch (error) {
        console.error('Failed to load sections:', error);
      }
    };
    loadSections();
  }, [filters.departmentId]);

  // Load years and semesters when department changes
  useEffect(() => {
    const loadYearsAndSemesters = async () => {
      if (!filters.departmentId) {
        setYears([]);
        setSemesters([]);
        return;
      }
      try {
        const resp = await api.subjects.list({ departmentId: filters.departmentId });
        const subjectsData = resp.data?.subjects || [];
        const uniqueYears = Array.from(new Set(subjectsData.map((s: any) => s.yearOfStudy))).sort() as number[];
        const uniqueSemesters = Array.from(new Set(subjectsData.map((s: any) => s.semester))).sort() as number[];
        setYears(uniqueYears);
        setSemesters(uniqueSemesters);
      } catch (error) {
        console.error('Failed to load years/semesters:', error);
      }
    };
    loadYearsAndSemesters();
  }, [filters.departmentId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (filters.departmentId) params.departmentId = filters.departmentId;
      if (filters.sectionId) params.sectionId = filters.sectionId;
      if (filters.year) params.year = filters.year;
      if (filters.semester) params.semester = filters.semester;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;

      const resp = await api.attendance.getHistory(params);
      setHistory(resp.data?.history || []);
      
      if (resp.data?.history?.length === 0) {
        toast({ description: 'No attendance records found for selected filters', variant: 'default' });
      }
    } catch (error: any) {
      console.error('Failed to load attendance history:', error);
      toast({ description: error.response?.data?.error || 'Failed to load history', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      departmentId: '',
      sectionId: '',
      year: '',
      semester: '',
      from: defaultRange().from,
      to: defaultRange().to,
    });
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleViewEdit = async (item: HistoryItem) => {
    try {
      setLoadingRecords(true);
      setSelectedSession(item);
      setEditDialog(true);
      
      // Fetch detailed attendance records for this session
      const response = await api.attendance.getSessionDetails(item.sessionId);
      const records = response.data?.records || [];
      setAttendanceRecords(records);
      
      // Initialize edited records
      const initial: Record<string, 'present' | 'absent' | 'late' | 'leave'> = {};
      records.forEach((record: AttendanceRecord) => {
        initial[record.student._id] = record.status;
      });
      setEditedRecords(initial);
    } catch (error: any) {
      console.error('Failed to load session details:', error);
      toast({ description: 'Failed to load attendance details', variant: 'destructive' });
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late' | 'leave') => {
    setEditedRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveChanges = async () => {
    if (!selectedSession) return;
    
    try {
      setLoadingRecords(true);
      
      // Build update payload
      const updates = Object.entries(editedRecords).map(([studentId, status]) => ({
        studentId,
        status
      }));
      
      await api.attendance.updateSession(selectedSession.sessionId, { records: updates });
      
      toast({ description: 'Attendance updated successfully' });
      setEditDialog(false);
      loadHistory(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to update attendance:', error);
      toast({ description: error.response?.data?.error || 'Failed to update attendance', variant: 'destructive' });
    } finally {
      setLoadingRecords(false);
    }
  };

  const exportHistoryData = (exportFormat: 'csv' | 'xlsx') => {
    if (!history.length) {
      toast({ description: 'No data to export', variant: 'destructive' });
      return;
    }

    const exportData = history.map(item => ({
      date: item.date ? format(new Date(item.date), 'MMM dd, yyyy') : '—',
      course: item.courseName || '—',
      code: item.courseCode || '—',
      year: item.yearOfStudy ? `Year ${item.yearOfStudy}` : '—',
      semester: item.semester ? `Sem ${item.semester}` : '—',
      section: item.section?.name || '—',
      department: item.department?.name || '—',
      markedBy: item.markedBy?.name || 'System',
      role: item.markedBy?.role || '—',
      present: item.counts.present,
      absent: item.counts.absent,
      late: item.counts.late,
      leave: item.counts.leave,
      total: item.counts.total,
    }));

    if (exportFormat === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance History');
      XLSX.writeFile(workbook, `attendance-history-${new Date().toISOString().split('T')[0]}.xlsx`);
    } else {
      const headers = Object.keys(exportData[0]);
      const csv = [headers.join(','), ...exportData.map(r => headers.map(h => `"${(r[h as keyof typeof r] ?? '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-history-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold">Attendance History</h1>
            <p className="text-muted-foreground mt-2">Review and manage attendance records by year, semester, section, and date range.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={loadHistory} disabled={loading} variant="default">
              {loading ? 'Loading…' : 'Search'}
            </Button>
            <Button onClick={resetFilters} variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button 
              onClick={() => exportHistoryData('xlsx')} 
              disabled={history.length === 0} 
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export XLSX
            </Button>
            <Button 
              onClick={() => exportHistoryData('csv')} 
              disabled={history.length === 0} 
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div>
              <label className="text-sm font-medium">Department</label>
              <Select
                value={filters.departmentId || ALL_VALUE}
                onValueChange={(value) => setFilters(prev => ({ ...prev, departmentId: value === ALL_VALUE ? '' : value, sectionId: '' }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept._id} value={dept._id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Year of Study</label>
              <Select
                value={filters.year || ALL_VALUE}
                onValueChange={(value) => setFilters(prev => ({ ...prev, year: value === ALL_VALUE ? '' : value }))}
                disabled={!filters.departmentId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={filters.departmentId ? "Select Year" : "Choose Department"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Years</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>Year {year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Semester</label>
              <Select
                value={filters.semester || ALL_VALUE}
                onValueChange={(value) => setFilters(prev => ({ ...prev, semester: value === ALL_VALUE ? '' : value }))}
                disabled={!filters.departmentId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={filters.departmentId ? "Select Semester" : "Choose Department"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Semesters</SelectItem>
                  {semesters.map(sem => (
                    <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Section</label>
              <Select
                value={filters.sectionId || ALL_VALUE}
                onValueChange={(value) => setFilters(prev => ({ ...prev, sectionId: value === ALL_VALUE ? '' : value }))}
                disabled={!filters.departmentId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={filters.departmentId ? "Select Section" : "Choose Department"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Sections</SelectItem>
                  {sections.map(section => (
                    <SelectItem key={section._id} value={section._id}>{section.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">From Date</label>
              <MiniCalendar
                value={filters.from ? new Date(filters.from) : undefined}
                onChange={(date) => setFilters(prev => ({ ...prev, from: date.toISOString().split('T')[0] }))}
                placeholder="Select from date"
                maxDate={filters.to ? new Date(filters.to) : new Date()}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">To Date</label>
              <MiniCalendar
                value={filters.to ? new Date(filters.to) : new Date()}
                onChange={(date) => setFilters(prev => ({ ...prev, to: date.toISOString().split('T')[0] }))}
                placeholder="Select to date"
                minDate={filters.from ? new Date(filters.from) : undefined}
                maxDate={new Date()}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center justify-between">
                <div>
                  <span>Attendance Records</span>
                  <p className="text-sm text-muted-foreground font-normal mt-1">{history.length} record(s) found</p>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No attendance records found for selected filters.</p>
                <Button onClick={() => resetFilters()} variant="outline">Clear Filters</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Year / Sem</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Marked By</TableHead>
                      <TableHead className="text-right">Present</TableHead>
                      <TableHead className="text-right">Absent</TableHead>
                      <TableHead className="text-right">Late</TableHead>
                      <TableHead className="text-right">Leave</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map(item => {
                      let formattedDate = '—';
                      try {
                        if (item.date) {
                          formattedDate = format(new Date(item.date), 'MMM dd, yyyy');
                        }
                      } catch (e) {
                        console.error('Date formatting error:', e, item.date);
                      }
                      
                      return (
                        <TableRow key={item.sessionId}>
                          <TableCell className="font-medium">{formattedDate}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{item.courseName || 'Unknown'}</span>
                              <span className="text-xs text-muted-foreground">{item.courseCode || '—'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {item.yearOfStudy ? `Year ${item.yearOfStudy}` : '—'} / {item.semester ? `Sem ${item.semester}` : '—'}
                            </div>
                          </TableCell>
                          <TableCell>{item.section?.name || '—'}</TableCell>
                          <TableCell>{item.department?.name || '—'}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <span className="font-medium">{item.markedBy?.name || 'System'}</span>
                              <div className="text-xs text-muted-foreground">{item.markedBy?.role || '—'}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-medium">{item.counts.present}</TableCell>
                          <TableCell className="text-right text-red-600 font-medium">{item.counts.absent}</TableCell>
                          <TableCell className="text-right text-yellow-600 font-medium">{item.counts.late}</TableCell>
                          <TableCell className="text-right text-blue-600 font-medium">{item.counts.leave}</TableCell>
                          <TableCell className="text-right font-bold">{item.counts.total}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewEdit(item)}
                              className="gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Attendance Dialog */}
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader className="space-y-3 border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-xl">
                    Edit Attendance
                  </DialogTitle>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {selectedSession?.courseName} ({selectedSession?.courseCode}) • {selectedSession?.date ? (() => {
                      try {
                        return format(new Date(selectedSession.date), 'MMMM dd, yyyy');
                      } catch {
                        return selectedSession.date;
                      }
                    })() : ''}
                  </div>
                </div>
              </div>
            </DialogHeader>
            
            {loadingRecords ? (
              <p className="text-center py-8">Loading attendance records...</p>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map(record => (
                      <TableRow key={record._id}>
                        <TableCell>{record.student.rollNo}</TableCell>
                        <TableCell>{record.student.name}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {(['present', 'absent', 'late', 'leave'] as const).map(status => (
                              <Button
                                key={status}
                                size="sm"
                                variant={editedRecords[record.student._id] === status ? 'default' : 'outline'}
                                onClick={() => handleStatusChange(record.student._id, status)}
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </Button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex gap-4 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setEditDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveChanges}
                    disabled={loadingRecords}
                  >
                    {loadingRecords ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
