import { DashboardLayout } from '@/components/layout/DashboardLayout';
import AttendanceCalendar from '@/components/AttendanceCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarDays } from 'lucide-react';

export default function StudentAttendanceCalendar() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="h-7 w-7" />
            Attendance Calendar
          </h1>
          <p className="text-muted-foreground">View your attendance in calendar format</p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Your Attendance Record</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceCalendar userId={user?._id || user?.id} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
