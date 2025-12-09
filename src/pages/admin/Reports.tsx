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
import { Download, FileSpreadsheet } from 'lucide-react';
import { MiniCalendar } from '@/components/ui/mini-calendar';
import { api } from '@/api';

export default function Reports() {
  const [reportType, setReportType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const response = await api.departments.list();
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportType) {
      toast.error('Please select a report type');
      return;
    }

    if (reportType === 'department' && !selectedDepartmentId) {
      toast.error('Please select a department');
      return;
    }

    try {
      setExporting(true);
      
      let reportData;
      const filters: any = {};
      if (dateFrom) filters.startDate = dateFrom;
      if (dateTo) filters.endDate = dateTo;

      // Fetch report data based on type
      if (reportType === 'college') {
        const response = await api.reports.getCollege(filters);
        reportData = response.data;
      } else if (reportType === 'department') {
        const response = await api.reports.getDepartment(selectedDepartmentId, filters);
        reportData = response.data;
      } else if (reportType === 'course') {
        toast.error('Course reports require course selection. Please use Export Templates.');
        return;
      }

      // Convert to CSV
      if (reportData) {
        exportToCSV(reportData, reportType);
        toast.success('Report exported successfully!');
      }
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.error || 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = (data: any, type: string) => {
    let csvContent = '';
    
    if (type === 'college') {
      // College report - department breakdown
      csvContent = 'Department,Total Students,Course Count,Total Records,Present Count,Attendance %\n';
      data.departmentBreakdown?.forEach((dept: any) => {
        csvContent += `"${dept.department || 'N/A'}",${dept.studentCount || 0},${dept.courseCount || 0},${dept.totalRecords || 0},${dept.presentCount || 0},"${dept.attendancePercentage || 0}%"\n`;
      });
    } else if (type === 'department') {
      // Department report - course breakdown
      csvContent = 'Course Code,Course Name,Teacher,Sessions Held,Total Records,Present Count,Attendance %\n';
      data.courseBreakdown?.forEach((course: any) => {
        csvContent += `"${course.courseCode || 'N/A'}","${course.courseName || 'N/A'}","${course.teacher || 'N/A'}",${course.sessionsHeld || 0},${course.totalRecords || 0},${course.presentCount || 0},"${course.attendancePercentage || 0}%"\n`;
      });
    }

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${type}-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Generate Reports</h1>
          <p className="text-muted-foreground">Export attendance data in various formats</p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Report Configuration
            </CardTitle>
            <CardDescription>Select report type and date range to export</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleExport} className="space-y-4">
              <div className="space-y-2">
                <Label>Report Type *</Label>
                <Select value={reportType} onValueChange={(val) => {
                  setReportType(val);
                  setSelectedDepartmentId('');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="college">College-wide Report</SelectItem>
                    <SelectItem value="department">Department Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {reportType === 'department' && (
                <div className="space-y-2">
                  <Label>Select Department *</Label>
                  <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept._id} value={dept._id}>
                          {dept.name} ({dept.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>From Date</Label>
                  <MiniCalendar
                    value={dateFrom ? new Date(dateFrom) : undefined}
                    onChange={(date) => setDateFrom(date.toISOString().split('T')[0])}
                    placeholder="Select from date"
                    maxDate={dateTo ? new Date(dateTo) : new Date()}
                  />
                </div>
                <div className="space-y-2">
                  <Label>To Date</Label>
                  <MiniCalendar
                    value={dateTo ? new Date(dateTo) : new Date()}
                    onChange={(date) => setDateTo(date.toISOString().split('T')[0])}
                    placeholder="Select to date"
                    minDate={dateFrom ? new Date(dateFrom) : undefined}
                    maxDate={new Date()}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={exporting}>
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export CSV'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
