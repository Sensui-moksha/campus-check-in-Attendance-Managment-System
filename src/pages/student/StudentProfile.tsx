import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import AttendanceCalendar from '@/components/AttendanceCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-spinner';
import { api } from '@/api';
import { Building2, Mail, UserRound, ArrowLeft, Hash, CalendarClock } from 'lucide-react';
import { getSemesterLabel } from '@/utils/semesterUtils';

interface StudentProfileData {
  _id: string;
  name: string;
  email?: string;
  rollNo?: string;
  department?: { name?: string } | string;
  section?: string;
  yearOfStudy?: number;
  semester?: number;
}

export default function StudentProfile() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      if (!studentId) return;
      try {
        setIsLoading(true);
        const response = await api.users.getStudent(studentId);
        setStudent(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to load student profile', err);
        setError('Unable to load student details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudent();
  }, [studentId]);

  const departmentName = typeof student?.department === 'string'
    ? student.department
    : student?.department?.name;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <span>/</span>
              <span>Student Profile</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-foreground">
              {student?.name || 'Student Profile'}
            </h1>
            {student?.rollNo && (
              <p className="text-muted-foreground">{student.rollNo}</p>
            )}
          </div>
          {student?.section && (
            <Badge variant="outline">Section {student.section}</Badge>
          )}
        </div>

        {error && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-4 text-destructive text-sm">
              {error}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1 border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserRound className="h-5 w-5" />
                Student Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-foreground">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Hash className="h-4 w-4" />
                <span>{student?.rollNo || 'Roll number not set'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{student?.email || 'Email not set'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{departmentName || 'Department not set'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="h-4 w-4" />
                <span>
                  {student?.yearOfStudy ? `Year ${student.yearOfStudy}` : 'Year not set'}
                  {student?.semester ? ` · ${getSemesterLabel(student.semester)}` : ''}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            {isLoading || !studentId ? (
              <Card className="border-border">
                <CardContent className="p-6">
                  <LoadingState message="Loading attendance..." />
                </CardContent>
              </Card>
            ) : (
              <AttendanceCalendar userId={student?._id || studentId} />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
