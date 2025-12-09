import { useEffect, useState } from 'react';
import { api } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AttendanceCalendar from './AttendanceCalendar';

interface SubjectAttendance {
  subjectCode: string;
  subjectName: string;
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
}

interface StudentAttendanceViewProps {
  studentId: string;
  studentName: string;
  studentRollNo: string;
  onClose: () => void;
}

export default function StudentAttendanceView({ 
  studentId, 
  studentName, 
  studentRollNo, 
  onClose 
}: StudentAttendanceViewProps) {
  const [subjectAttendance, setSubjectAttendance] = useState<SubjectAttendance[]>([]);
  const [overallPercentage, setOverallPercentage] = useState(0);
  const [totalClasses, setTotalClasses] = useState(0);
  const [totalAttended, setTotalAttended] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAttendanceData();
  }, [studentId]);

  const loadAttendanceData = async () => {
    try {
      setIsLoading(true);
      // Fetch student's attendance records
      const response = await api.attendance.getStudentHistory(studentId, {
        page: 1,
        limit: 1000
      });

      const sessions = response.data?.history || [];
      
      // Group by subject (use subject ID as key to avoid duplicates)
      const subjectMap: { [key: string]: { 
        name: string; 
        code: string; 
        total: number; 
        attended: number; 
      } } = {};

      sessions.forEach((session: any) => {
        // Use subject data if available, otherwise fall back to course data
        const subjectId = session.subject?._id || session.subjectId || session.courseId || session.courseCode || 'unknown';
        const subjectCode = session.subject?.code || session.subjectCode || session.courseCode || 'N/A';
        const subjectName = session.subject?.name || session.subjectName || session.courseName || 'Unknown Course';
        
        if (!subjectMap[subjectId]) {
          subjectMap[subjectId] = {
            name: subjectName,
            code: subjectCode,
            total: 0,
            attended: 0
          };
        }
        
        subjectMap[subjectId].total += 1;
        if (session.status === 'present' || session.status === 'late') {
          subjectMap[subjectId].attended += 1;
        }
      });

      // Convert to array with percentages
      const subjectsArray: SubjectAttendance[] = Object.values(subjectMap).map(subject => ({
        subjectCode: subject.code,
        subjectName: subject.name,
        totalClasses: subject.total,
        attendedClasses: subject.attended,
        percentage: subject.total > 0 ? (subject.attended / subject.total) * 100 : 0
      }));

      // Calculate overall stats
      const total = subjectsArray.reduce((sum, s) => sum + s.totalClasses, 0);
      const attended = subjectsArray.reduce((sum, s) => sum + s.attendedClasses, 0);
      const overall = total > 0 ? (attended / total) * 100 : 0;

      setSubjectAttendance(subjectsArray);
      setTotalClasses(total);
      setTotalAttended(attended);
      setOverallPercentage(overall);
    } catch (error) {
      console.error('Failed to load attendance data:', error);
      toast({ 
        description: 'Failed to load attendance data', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const CircularProgress = ({ percentage, size = 120 }: { percentage: number; size?: number }) => {
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    const getColor = (pct: number) => {
      if (pct >= 75) return '#22c55e'; // green
      if (pct >= 60) return '#eab308'; // yellow
      return '#ef4444'; // red
    };

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r="45"
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r="45"
            stroke={getColor(percentage)}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1s ease-in-out'
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{percentage.toFixed(1)}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Attendance Report</h1>
            <p className="text-muted-foreground mt-1">
              {studentName} ({studentRollNo})
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-muted-foreground">Loading attendance data...</div>
          </div>
        ) : (
          <>
            {/* Overall Attendance Card */}
            <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Overall Attendance
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <CircularProgress percentage={overallPercentage} size={160} />
                  <div className="mt-6 space-y-1">
                    <p className="text-lg font-semibold">
                      {totalAttended} of {totalClasses} classes attended
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Across all subjects
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subject-wise Attendance in Single Row */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-4">Subject-wise Attendance</h2>
            </div>

            {subjectAttendance.length === 0 ? (
              <Card className="mb-6">
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <p className="text-lg text-muted-foreground">No attendance records found</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex overflow-x-auto gap-4 pb-4 mb-6">
                {subjectAttendance.map((subject) => (
                  <Card 
                    key={subject.subjectCode}
                    className="flex-shrink-0 hover:shadow-lg transition-shadow"
                    style={{ minWidth: '280px' }}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <CircularProgress percentage={subject.percentage} size={100} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-1">
                          {subject.subjectName}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {subject.subjectCode}
                        </p>
                        <p className="text-sm font-medium">
                          {subject.attendedClasses} / {subject.totalClasses} Classes
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Calendar View */}
            <div className="mb-4">
              <h2 className="text-2xl font-semibold mb-4">Attendance Calendar</h2>
            </div>
            <Card>
              <CardContent className="p-6">
                <AttendanceCalendar userId={studentId} />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
