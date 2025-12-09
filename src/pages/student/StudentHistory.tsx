import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/api';

interface AttendanceRecord {
  _id: string;
  sessionDate: string;
  courseName: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  markedBy: string;
  courseCode?: string;
}

export default function StudentHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const response = await api.attendance.getStudentHistory(user?.id || user?._id);
        
        if (response.data?.history) {
          // Log the data to debug what we're receiving
          console.log('📊 Attendance History received:', response.data.history);
          
          // Validate and filter records to ensure they have proper status values
          const validHistory = (response.data.history as AttendanceRecord[]).filter(record => {
            if (!record.status) {
              console.warn('⚠️ Record missing status:', record);
              return false;
            }
            return true;
          });
          
          setHistory(validHistory);
        } else {
          setHistory([]);
        }
      } catch (error) {
        console.error('Failed to fetch attendance history:', error);
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id || user?._id) {
      fetchHistory();
    }
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance History</h1>
          <p className="text-muted-foreground">View your complete attendance records</p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Recent Records</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingState message="Loading attendance history..." />
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No attendance records found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Marked By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((record, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {format(new Date(record.sessionDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{record.courseName || 'Unknown Subject'}</TableCell>
                    <TableCell className="text-muted-foreground">{record.courseCode || '—'}</TableCell>
                    <TableCell>
                      <StatusBadge status={record.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{record.markedBy}</TableCell>
                  </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
