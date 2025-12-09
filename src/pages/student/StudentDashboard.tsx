import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/stat-card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-spinner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/ui/status-badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, History, TrendingUp, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/api';
import { getSemesterLabel } from '@/utils/semesterUtils';

interface SubjectAttendance {
  subjectId: string;
  subjectName: string;
  attended: number;
  totalClasses: number;
  attendancePct: number;
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subjectsData, setSubjectsData] = useState<SubjectAttendance[]>([]);
  const [overallStats, setOverallStats] = useState({
    attendancePct: 0,
    attended: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<SubjectAttendance | null>(null);
  const [subjectDetails, setSubjectDetails] = useState<{
    present: number;
    absent: number;
    late: number;
    leave: number;
  } | null>(null);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setIsLoading(true);
        // Fetch student's attendance overview
        const response = await api.attendance.getStudentOverview(user?._id || user?.id);
        
        console.log('📊 Attendance Overview Response:', response.data);
        
        if (response.data) {
          const { overall, overview } = response.data;
          
          console.log('📈 Overall:', overall);
          console.log('📚 Overview:', overview);
          
          // Set overall attendance stats
          setOverallStats({
            attendancePct: overall?.percentage ? Math.round(parseFloat(overall.percentage)) : 0,
            attended: overall?.attended || 0,
            total: overall?.total || 0,
          });

          // Format subjects data from overview array
          if (Array.isArray(overview)) {
            const formattedSubjects = overview.map((subjectData: any) => ({
              subjectId: subjectData.subjectId || subjectData._id,
              subjectName: subjectData.subject || subjectData.subjectName,
              attended: subjectData.attended || 0,
              totalClasses: subjectData.total || 0,
              attendancePct: subjectData.total > 0 
                ? Math.round(parseFloat(subjectData.percentage) || 0)
                : 0,
            }));
            setSubjectsData(formattedSubjects);
            
            // Recalculate total by summing all subject classes
            const totalClassesSum = formattedSubjects.reduce((sum, subject) => sum + subject.totalClasses, 0);
            const totalAttendedSum = formattedSubjects.reduce((sum, subject) => sum + subject.attended, 0);
            const recalculatedPercentage = totalClassesSum > 0 
              ? Math.round((totalAttendedSum / totalClassesSum) * 100)
              : 0;
            
            console.log('🔢 Recalculated - Total:', totalClassesSum, 'Attended:', totalAttendedSum, 'Percentage:', recalculatedPercentage);
            
            setOverallStats({
              attendancePct: recalculatedPercentage,
              attended: totalAttendedSum,
              total: totalClassesSum,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch attendance data:', error);
        setSubjectsData([]);
        setOverallStats({
          attendancePct: 0,
          attended: 0,
          total: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id || user?._id) {
      fetchAttendanceData();
    }
  }, [user]);

  const handleSubjectClick = async (subject: SubjectAttendance) => {
    setSelectedSubject(subject);
    setSubjectDetails(null);
    
    try {
      // Fetch detailed attendance for this subject
      const response = await api.attendance.getStudentHistory(user?._id || user?.id);
      
      console.log('📋 History Response:', response.data);
      console.log('🎯 Looking for courseId:', subject.subjectId);
      
      if (response.data?.history) {
        // Filter records for this subject and count by status
        const subjectRecords = response.data.history.filter(
          (record: any) => {
            const matches = record.courseId?.toString() === subject.subjectId?.toString();
            if (matches) {
              console.log('✅ Matched record:', record);
            }
            return matches;
          }
        );
        
        console.log('📊 Filtered records:', subjectRecords);
        
        const present = subjectRecords.filter((r: any) => r.status === 'present').length;
        const absent = subjectRecords.filter((r: any) => r.status === 'absent').length;
        const late = subjectRecords.filter((r: any) => r.status === 'late').length;
        const leave = subjectRecords.filter((r: any) => r.status === 'leave' || r.status === 'l').length;
        
        console.log('📈 Counts - Present:', present, 'Absent:', absent, 'Late:', late, 'Leave:', leave);
        
        setSubjectDetails({ present, absent, late, leave });
      }
    } catch (error) {
      console.error('Failed to fetch subject details:', error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading attendance data..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.displayName || user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">Here's your attendance overview</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Overall Attendance</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-4">
              <ProgressRing value={overallStats.attendancePct} size={160} strokeWidth={12} />
              <p className="mt-4 text-sm text-muted-foreground">
                {overallStats.attended} of {overallStats.total} classes attended
              </p>
            </CardContent>
          </Card>

          <div className="md:col-span-2 grid gap-4 sm:grid-cols-2">
            <StatCard
              title="Classes Attended"
              value={overallStats.attended}
              footer="This semester"
              icon={TrendingUp}
              accentColor="student"
            />
            <StatCard
              title="Total Classes"
              value={overallStats.total}
              footer="Across all subjects"
              icon={BookOpen}
              accentColor="primary"
            />
          </div>
        </div>

        {/* Student's Department Info */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Your Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div key="department" className="p-3 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">Department</p>
                <p className="text-lg font-semibold text-foreground">
                  {typeof user?.department === 'string' 
                    ? user.department 
                    : user?.department?.name || 'N/A'}
                </p>
              </div>
              <div key="year" className="p-3 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">Year of Study</p>
                <p className="text-lg font-semibold text-foreground">{user?.yearOfStudy ? `Year ${user.yearOfStudy}` : 'N/A'}</p>
              </div>
              <div key="semester" className="p-3 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">Semester</p>
                <p className="text-lg font-semibold text-foreground">{user?.semester ? getSemesterLabel(user.semester) : 'N/A'}</p>
              </div>
              <div key="batch" className="p-3 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">Batch Year</p>
                <p className="text-lg font-semibold text-foreground">{user?.batchYear || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Subject-wise Attendance</h2>
            <Button variant="outline" size="sm" onClick={() => navigate('/student/history')}>
              <History className="h-4 w-4 mr-2" />
              View History
            </Button>
          </div>

          {subjectsData.length === 0 ? (
            <Card className="border-border">
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">No subjects found</p>
                <p className="text-sm text-muted-foreground">
                  Your subjects and attendance will appear here once classes are scheduled.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {subjectsData.map(subject => (
                <Card 
                  key={subject.subjectId} 
                  className="border-border hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleSubjectClick(subject)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">{subject.subjectName}</h3>
                        <p className="text-xs text-muted-foreground">{subject.subjectId}</p>
                      </div>
                      <ProgressRing 
                        value={subject.attendancePct} 
                        size={50} 
                        strokeWidth={5}
                        showLabel={false}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {subject.attended}/{subject.totalClasses} classes
                      </span>
                    <span className={`font-semibold ${
                      subject.attendancePct >= 75 ? 'text-status-present' : 'text-status-absent'
                    }`}>
                      {isNaN(subject.attendancePct) ? '0' : subject.attendancePct.toFixed(1)}%
                    </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subject Details Dialog */}
      <Dialog open={!!selectedSubject} onOpenChange={() => setSelectedSubject(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-3 border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl">{selectedSubject?.subjectName}</DialogTitle>
                <DialogDescription className="text-sm">
                  Detailed attendance breakdown for this subject
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {subjectDetails ? (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-status-present/10 border border-status-present/30 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-status-present">{subjectDetails.present}</p>
                  <p className="text-sm text-muted-foreground mt-1">Present</p>
                </div>
                <div className="bg-status-absent/10 border border-status-absent/30 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-status-absent">{subjectDetails.absent}</p>
                  <p className="text-sm text-muted-foreground mt-1">Absent</p>
                </div>
                <div className="bg-status-late/10 border border-status-late/30 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-status-late">{subjectDetails.late}</p>
                  <p className="text-sm text-muted-foreground mt-1">Late</p>
                </div>
                <div className="bg-status-leave/10 border border-status-leave/30 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-status-leave">{subjectDetails.leave}</p>
                  <p className="text-sm text-muted-foreground mt-1">Leave</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Total Classes:</span>
                  <span className="text-lg font-bold">{selectedSubject?.totalClasses}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Classes Attended:</span>
                  <span className="text-lg font-bold">{selectedSubject?.attended}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Attendance:</span>
                  <span className={`text-lg font-bold ${
                    (selectedSubject?.attendancePct || 0) >= 75 ? 'text-status-present' : 'text-status-absent'
                  }`}>
                    {selectedSubject?.attendancePct.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <Button 
                onClick={() => navigate('/student/history')} 
                className="w-full"
                variant="outline"
              >
                View Full History
              </Button>
            </div>
          ) : (
            <div className="py-8">
              <LoadingState message="Loading subject details..." />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
