import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Download, Filter, CheckSquare, Square, UserX, Plus } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { api } from '../../api';
import apiClient from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { MiniCalendar } from '../../components/ui/mini-calendar';

interface DetainedStudent {
  _id: string;
  name: string;
  rollNo: string;
  email: string;
  department: {
    _id: string;
    name: string;
    code: string;
  };
  yearOfStudy: number;
  detainReason: string;
  detainReasonType: string;
  detainDate: string;
  detainBy: {
    _id: string;
    name: string;
    email: string;
  };
  detainNotes?: string;
  attendancePercent?: number;
  creditScore?: number;
}

const DetainList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<DetainedStudent[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [reasonTypeFilter, setReasonTypeFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  useEffect(() => {
    fetchDepartments();
    fetchDetainedStudents();
  }, [departmentFilter, yearFilter, reasonTypeFilter, fromDate, toDate]);

  const fetchDepartments = async () => {
    try {
      const response = await api.departments.list();
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchDetainedStudents = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (departmentFilter) params.department = departmentFilter;
      if (yearFilter) params.year = yearFilter;
      if (reasonTypeFilter) params.reasonType = reasonTypeFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const response = await apiClient.get('/detain', { params });
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Failed to fetch detained students:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map(s => s._id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleRelease = async () => {
    if (selectedIds.size === 0) {
      toast({
        description: 'Please select at least one student to release',
        variant: 'destructive',
      });
      return;
    }

    const confirmRelease = window.confirm(
      `Are you sure you want to release ${selectedIds.size} student(s) from detention?`
    );

    if (!confirmRelease) return;

    setLoading(true);
    try {
      const response = await apiClient.post('/detain/release', {
        userIds: Array.from(selectedIds),
        releaseDate: new Date().toISOString().split('T')[0],
        releaseNotes: 'Released by administrator',
        performedBy: user?._id || user?.id
      });

      console.log('Release response:', response.data);
      toast({
        description: `Successfully released ${response.data.released.length} student(s)`,
      });

      // Refresh list and clear selection
      setSelectedIds(new Set());
      fetchDetainedStudents();
    } catch (error: any) {
      console.error('Failed to release students:', error);
      toast({
        description: error.response?.data?.error || 'Failed to release students',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const headers = [
      'Roll No',
      'Name',
      'Department',
      'Year',
      'Reason Type',
      'Reason',
      'Detained Date',
      'Detained By',
      'Attendance %',
      'Credit Score'
    ];

    const rows = students.map(student => [
      student.rollNo,
      student.name,
      student.department.name,
      student.yearOfStudy,
      student.detainReasonType,
      student.detainReason,
      new Date(student.detainDate).toLocaleDateString(),
      student.detainBy.name,
      student.attendancePercent?.toFixed(2) || 'N/A',
      student.creditScore || 'N/A'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detained-students-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getReasonTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      low_attendance: 'Low Attendance',
      low_credit: 'Low Credit Score',
      disciplinary: 'Disciplinary',
      custom: 'Custom'
    };
    return labels[type] || type;
  };

  const getReasonTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      low_attendance: 'bg-red-100 text-red-800',
      low_credit: 'bg-orange-100 text-orange-800',
      disciplinary: 'bg-purple-100 text-purple-800',
      custom: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <UserX className="h-8 w-8 text-destructive" />
              Detained Students
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage and track students currently under detention
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="default" 
              onClick={() => navigate('/admin/bulk-detain')}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Detain Student
            </Button>
            {selectedIds.size > 0 && (
              <Button variant="default" onClick={handleRelease} disabled={loading}>
                Release Selected ({selectedIds.size})
              </Button>
            )}
            <Button variant="outline" onClick={exportToExcel} disabled={students.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Detained</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{students.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Selected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{selectedIds.size}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Low Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {students.filter(s => s.detainReasonType === 'low_attendance').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Other Reasons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {students.filter(s => s.detainReasonType !== 'low_attendance').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={departmentFilter || "none"} onValueChange={(val) => setDepartmentFilter(val === "none" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={yearFilter || "none"} onValueChange={(val) => setYearFilter(val === "none" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All Years</SelectItem>
                  <SelectItem value="1">Year 1</SelectItem>
                  <SelectItem value="2">Year 2</SelectItem>
                  <SelectItem value="3">Year 3</SelectItem>
                  <SelectItem value="4">Year 4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reason Type</Label>
              <Select value={reasonTypeFilter || "none"} onValueChange={(val) => setReasonTypeFilter(val === "none" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Reasons" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All Reasons</SelectItem>
                  <SelectItem value="low_attendance">Low Attendance</SelectItem>
                  <SelectItem value="low_credit">Low Credit Score</SelectItem>
                  <SelectItem value="disciplinary">Disciplinary</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>From Date</Label>
              <MiniCalendar
                value={fromDate ? new Date(fromDate) : undefined}
                onChange={(date) => setFromDate(date.toISOString().split('T')[0])}
                placeholder="Select from date"
                maxDate={toDate ? new Date(toDate) : new Date()}
              />
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <MiniCalendar
                value={toDate ? new Date(toDate) : new Date()}
                onChange={(date) => setToDate(date.toISOString().split('T')[0])}
                placeholder="Select to date"
                minDate={fromDate ? new Date(fromDate) : undefined}
                maxDate={new Date()}
              />
            </div>
          </div>
        </CardContent>
      </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Detained Students List</span>
              {students.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  Showing {students.length} student{students.length !== 1 ? 's' : ''}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">Loading detained students...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="p-12 text-center">
                <UserX className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No detained students found</h3>
                <p className="text-sm text-muted-foreground">
                  {departmentFilter || yearFilter || reasonTypeFilter || fromDate || toDate
                    ? 'Try adjusting your filters to see more results'
                    : 'There are currently no students under detention'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <button 
                          onClick={toggleSelectAll} 
                          className="flex items-center hover:text-primary transition-colors"
                          title={selectedIds.size === students.length ? "Deselect all" : "Select all"}
                        >
                          {selectedIds.size === students.length ? (
                            <CheckSquare className="h-5 w-5 text-primary" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Roll No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Attendance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Credits</th>
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border">
                    {students.map(student => (
                      <tr key={student._id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => toggleSelect(student._id)}
                            className="hover:scale-110 transition-transform"
                          >
                            {selectedIds.has(student._id) ? (
                              <CheckSquare className="h-5 w-5 text-primary" />
                            ) : (
                              <Square className="h-5 w-5 text-muted-foreground" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 font-medium whitespace-nowrap">{student.rollNo}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{student.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-muted-foreground">{student.department.code}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Year {student.yearOfStudy}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getReasonTypeBadgeColor(student.detainReasonType)}`}>
                            {getReasonTypeLabel(student.detainReasonType)}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <div className="truncate" title={student.detainReason}>
                            {student.detainReason}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {new Date(student.detainDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.attendancePercent !== null && student.attendancePercent !== undefined ? (
                            <span className={`font-semibold ${student.attendancePercent < 75 ? 'text-destructive' : 'text-green-600'}`}>
                              {student.attendancePercent.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.creditScore !== undefined ? (
                            <span className={`font-semibold ${student.creditScore < 40 ? 'text-orange-600' : 'text-green-600'}`}>
                              {student.creditScore}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DetainList;
