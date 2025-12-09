import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { Calendar, BookOpen, TrendingUp, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SubjectAttendance {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  classesAttended: number;
  totalClasses: number;
  percentage: number;
}

interface AttendanceOverview {
  totalClassesAttended: number;
  totalClassesConducted: number;
  overallPercentage: number;
  subjects: SubjectAttendance[];
}

export default function ConductedClasses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [overview, setOverview] = useState<AttendanceOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConductedClassesData = async () => {
      if (!user?.id && !user?._id) return;

      try {
        setIsLoading(true);
        const studentId = user.id || user._id;
        
        // Fetch student attendance overview based only on conducted classes
        const response = await api.attendance.getConductedClassesOverview(studentId);
        
        console.log('📊 Conducted classes response:', response.data);

        // Transform the data - API returns { overview: [...], overall: {...} }
        if (response.data) {
          const apiData = (response.data as any).overview || (response.data as any).courseAttendance || [];
          const subjects: SubjectAttendance[] = apiData.map((item: any) => ({
            subjectId: item.courseId || item.subjectId || item._id,
            subjectName: item.course || item.subject || item.courseName || item.subjectName || item.name,
            subjectCode: item.courseCode || item.subjectCode || item.code || 'N/A',
            classesAttended: parseInt(item.attended) || 0,
            totalClasses: parseInt(item.total) || 0,
            percentage: parseFloat(item.percentage) || 0,
          }));

          // Use overall data from API if available, otherwise calculate
          const overallData = (response.data as any).overall as { attended?: number; total?: number; percentage?: string } | undefined;
          const totalAttended = overallData?.attended || subjects.reduce((sum, s) => sum + s.classesAttended, 0);
          const totalConducted = overallData?.total || subjects.reduce((sum, s) => sum + s.totalClasses, 0);
          const overallPct = overallData?.percentage ? parseFloat(overallData.percentage) : 
                             (totalConducted > 0 ? (totalAttended / totalConducted) * 100 : 0);

          setOverview({
            totalClassesAttended: totalAttended,
            totalClassesConducted: totalConducted,
            overallPercentage: overallPct,
            subjects: subjects,
          });
        }
      } catch (error) {
        console.error('Failed to load conducted classes data:', error);
        toast({
          description: 'Failed to load attendance data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadConductedClassesData();
  }, [user, toast]);

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 75) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-green-600';
    if (percentage >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading conducted classes data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Conducted Classes Attendance
          </h1>
          <p className="text-gray-600">
            Track your attendance based on classes actually conducted by teachers
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Overall Attendance Card */}
          <Card className={`border-2 ${overview ? getAttendanceColor(overview.overallPercentage) : ''}`}>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Overall Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-gray-200"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - (overview?.overallPercentage || 0) / 100)}`}
                      className={
                        (overview?.overallPercentage || 0) >= 75
                          ? 'text-green-600'
                          : (overview?.overallPercentage || 0) >= 60
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">
                      {overview?.overallPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {overview?.totalClassesAttended} of {overview?.totalClassesConducted} classes attended
              </p>
            </CardContent>
          </Card>

          {/* Classes Attended Card */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Classes Attended
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {overview?.totalClassesAttended || 0}
              </div>
              <p className="text-sm text-muted-foreground">This semester</p>
            </CardContent>
          </Card>

          {/* Total Classes Card */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Total Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {overview?.totalClassesConducted || 0}
              </div>
              <p className="text-sm text-muted-foreground">Across all subjects</p>
            </CardContent>
          </Card>
        </div>

        {/* Department Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Your Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Department</p>
                <p className="text-base font-semibold">
                  {typeof user?.department === 'string' ? user.department : user?.department?.name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Year of Study</p>
                <p className="text-base font-semibold">Year {user?.yearOfStudy || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Semester</p>
                <p className="text-base font-semibold">
                  {user?.semester ? `${user.yearOfStudy}${user.semester === 1 ? 'st' : 'nd'} Year ${user.semester === 1 ? '1st' : '2nd'} Semester` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Batch Year</p>
                <p className="text-base font-semibold">{user?.batchYear || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subject-wise Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Subject-wise Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {!overview?.subjects || overview.subjects.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No attendance records found for conducted classes
              </p>
            ) : (
              <div className="space-y-4">
                {overview.subjects.map((subject) => (
                  <Card key={subject.subjectId} className="border">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{subject.subjectName}</h3>
                          <p className="text-sm text-muted-foreground">{subject.subjectCode}</p>
                        </div>
                        <div className={`px-4 py-2 rounded-full font-bold ${getAttendanceColor(subject.percentage)}`}>
                          {subject.percentage.toFixed(1)}%
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{subject.classesAttended}/{subject.totalClasses} classes</span>
                          <span>{subject.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${getProgressColor(subject.percentage)}`}
                            style={{ width: `${Math.min(subject.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
