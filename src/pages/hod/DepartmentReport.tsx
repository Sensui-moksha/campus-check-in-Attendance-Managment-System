import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/api';
import { useToast } from '@/hooks/use-toast';

interface YearStats {
  year: number;
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

interface DepartmentSummary {
  avgPercent: number;
  studentCount: number;
  totalSessions: number;
  summary: Record<string, YearStats>;
}

export default function DepartmentReport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [summary, setSummary] = useState<DepartmentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setIsLoading(true);
        const deptId = typeof user?.department === 'string' 
          ? user.department 
          : user?.department?._id || user?.departmentId;
        
        console.log('📊 Fetching department report for deptId:', deptId);
        console.log('👤 User object:', user);
        
        if (!deptId) {
          console.warn('⚠️ No department ID found for user');
          toast({
            description: 'Department not found for your account',
            variant: 'destructive',
          });
          return;
        }
        
        const response = await api.analytics.getDepartmentSummary(deptId);
        console.log('📈 Department summary response:', response.data);
        
        if (response.data) {
          setSummary(response.data as DepartmentSummary);
          console.log('✅ Loaded summary data');
        } else {
          console.log('⚠️ No data in response');
          setSummary(null);
        }
      } catch (error: any) {
        console.error('❌ Failed to fetch department report:', error);
        console.error('Error details:', error.response?.data);
        toast({
          description: error.response?.data?.error || 'Failed to load department report',
          variant: 'destructive',
        });
        setSummary(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchReport();
    }
  }, [user]);

  const handleExport = () => {
    // TODO: Implement CSV export functionality
    toast({
      description: 'Export functionality coming soon!',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Department Report</h1>
            <p className="text-muted-foreground">Subject-wise attendance statistics</p>
          </div>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {summary && (
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Average Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${summary.avgPercent >= 75 ? 'text-status-present' : 'text-status-absent'}`}>
                  {summary.avgPercent}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.studentCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalSessions}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Year-wise Attendance Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-center">Total Records</TableHead>
                  <TableHead className="text-center">Present</TableHead>
                  <TableHead className="text-center">Absent</TableHead>
                  <TableHead className="text-center">Attendance %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading report data...
                    </TableCell>
                  </TableRow>
                ) : !summary || Object.keys(summary.summary).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No attendance data available yet. Start marking attendance to see statistics here.
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.values(summary.summary)
                    .filter((yearData: YearStats) => yearData.total > 0)
                    .map((yearData: YearStats) => (
                      <TableRow key={yearData.year}>
                        <TableCell className="font-medium">Year {yearData.year}</TableCell>
                        <TableCell className="text-center">{yearData.total}</TableCell>
                        <TableCell className="text-center text-status-present">{yearData.present}</TableCell>
                        <TableCell className="text-center text-status-absent">{yearData.absent}</TableCell>
                        <TableCell className="text-center">
                          <span className={`font-semibold ${
                            yearData.percentage >= 75 ? 'text-status-present' : 'text-status-absent'
                          }`}>
                            {yearData.percentage}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
