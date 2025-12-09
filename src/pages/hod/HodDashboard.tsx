import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { Users, TrendingUp, AlertTriangle, Building2, Plus, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '@/api';

interface StudentData {
  _id: string;
  name: string;
  rollNo: string;
  yearOfStudy?: number;
  section?: string;
  attendancePct: number;
}

interface SubjectAttendance {
  subject: string;
  attendancePct: number;
  presentCount: number;
  totalCount: number;
}

interface MonthlyAttendance {
  month: string;
  monthName: string;
  attendancePct: number;
  presentCount?: number;
  totalCount?: number;
}

interface StudentProfile {
  name: string;
  rollNo: string;
  yearOfStudy?: number;
  section?: string;
  overallAttendance: number;
  subjectWise: SubjectAttendance[];
  monthlyAttendance: MonthlyAttendance[];
}

interface DepartmentStats {
  avgPercent: number;
  studentCount: number;
  students: StudentData[];
}

export default function HodDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DepartmentStats>({
    avgPercent: 0,
    studentCount: 0,
    students: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showManageDept, setShowManageDept] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', code: '' });
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const deptId = typeof user?.department === 'string' 
    ? user.department 
    : user?.department?._id || user?.departmentId;

  useEffect(() => {
    const fetchDepartmentData = async () => {
      try {
        setIsLoading(true);
        if (deptId) {
          const response = await api.analytics.getDepartmentStudents(deptId);
          
          if (response.data?.students) {
            const students = response.data.students.map((s: any) => ({
              _id: s._id,
              name: s.name,
              rollNo: s.rollNo,
              yearOfStudy: s.yearOfStudy,
              section: s.section,
              attendancePct: s.attendancePercentage,
            }));

            const totalAttendance = students.reduce((sum: number, s: any) => sum + s.attendancePct, 0);
            const avgPercent = students.length > 0 ? Math.round(totalAttendance / students.length) : 0;

            setData({
              avgPercent,
              studentCount: students.length,
              students,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch department data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (deptId) {
      fetchDepartmentData();
    }
  }, [user, deptId]);

  const loadStudentProfile = async (student: StudentData) => {
    try {
      setProfileLoading(true);
      setSelectedStudent(student);
      
      // Fetch student's subject-wise and monthly attendance
      const response = await api.users.getStudentAttendance(student._id);
      
      const profile: StudentProfile = {
        name: student.name,
        rollNo: student.rollNo,
        yearOfStudy: student.yearOfStudy,
        section: student.section,
        overallAttendance: response.data.overall?.attendancePct || 0,
        subjectWise: response.data.subjectWise || [],
        monthlyAttendance: response.data.monthlyAttendance || [],
      };
      
      setStudentProfile(profile);
    } catch (error) {
      console.error('Failed to load student profile:', error);
      toast.error('Failed to load student profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const belowThreshold = data.students.filter(s => s.attendancePct < 75).length;

  const handleManageDepartment = () => {
    if (deptForm.name.trim() && deptForm.code.trim()) {
      toast.success('Department updated successfully!');
      setShowManageDept(false);
      setDeptForm({ name: '', code: '' });
    } else {
      toast.error('Please fill in all fields');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {typeof user?.department === 'string' 
              ? user.department 
              : user?.department?.name || 'Department'} Overview
          </h1>
          <p className="text-muted-foreground">Monitor and manage your department</p>
          
          {/* HOD Info Card */}
          <Card className="mt-4 border-border">
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="p-3 rounded-lg border border-border bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-1">HOD Name</p>
                  <p className="text-base font-semibold text-foreground">{user?.name || 'N/A'}</p>
                </div>
                {user?.employeeId && (
                  <div className="p-3 rounded-lg border border-border bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Employee ID</p>
                    <p className="text-base font-semibold text-foreground">{user.employeeId}</p>
                  </div>
                )}
                {user?.designation && (
                  <div className="p-3 rounded-lg border border-border bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Designation</p>
                    <p className="text-base font-semibold text-foreground">{user.designation}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mt-4">
            <Dialog open={showManageDept} onOpenChange={setShowManageDept}>
              <DialogTrigger asChild>
                <Button>
                  <Building2 className="h-4 w-4 mr-2" />
                  Manage Department
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader className="space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-center space-y-1">
                    <DialogTitle className="text-2xl">Manage Your Department</DialogTitle>
                    <DialogDescription className="text-base">
                      Update your department's name and code information.
                    </DialogDescription>
                  </div>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="dept-name" className="text-sm font-medium">Department Name</Label>
                    <Input
                      id="dept-name"
                      placeholder="e.g., Computer Science"
                      value={deptForm.name}
                      onChange={(e) => setDeptForm({...deptForm, name: e.target.value})}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dept-code" className="text-sm font-medium">Department Code</Label>
                    <Input
                      id="dept-code"
                      placeholder="e.g., CSE"
                      value={deptForm.code}
                      onChange={(e) => setDeptForm({...deptForm, code: e.target.value})}
                      className="h-10"
                    />
                    <p className="text-xs text-gray-500">Short code for the department</p>
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button variant="outline" onClick={() => setShowManageDept(false)} className="flex-1">Cancel</Button>
                  <Button onClick={handleManageDepartment} className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                    <Building2 className="h-4 w-4 mr-2" />
                    Update
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border border-l-4 border-l-hod-accent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Dept. Average</p>
                  <p className="text-3xl font-bold">{data.avgPercent}%</p>
                </div>
                <ProgressRing value={data.avgPercent} size={60} strokeWidth={6} showLabel={false} />
              </div>
            </CardContent>
          </Card>
          <StatCard
            title="Total Students"
            value={data.studentCount}
            icon={Users}
            accentColor="hod"
          />
          <StatCard
            title="Above 75%"
            value={data.students.filter(s => s.attendancePct >= 75).length}
            icon={TrendingUp}
            accentColor="primary"
          />
          <StatCard
            title="Below 75%"
            value={data.students.filter(s => s.attendancePct < 75).length}
            icon={AlertTriangle}
            accentColor="hod"
          />
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Student Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead className="text-right">Attendance %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.students.map((student, idx) => (
                  <TableRow 
                    key={idx}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => loadStudentProfile(student)}
                  >
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell className="text-muted-foreground">{student.rollNo}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {student.yearOfStudy ? `Year ${student.yearOfStudy}` : 'N/A'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {student.section || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-semibold ${
                        student.attendancePct >= 75 ? 'text-status-present' : 'text-status-absent'
                      }`}>
                        {student.attendancePct}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Student Profile Modal */}
        <Dialog open={!!selectedStudent} onOpenChange={(open) => {
          if (!open) {
            setSelectedStudent(null);
            setStudentProfile(null);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{studentProfile?.name}</DialogTitle>
              <DialogDescription>
                <div className="text-sm space-y-1 mt-2">
                  <p>Roll No: <span className="font-medium text-foreground">{studentProfile?.rollNo}</span></p>
                  <p>Year: <span className="font-medium text-foreground">{studentProfile?.yearOfStudy ? `Year ${studentProfile.yearOfStudy}` : 'N/A'}</span></p>
                  <p>Section: <span className="font-medium text-foreground">{studentProfile?.section || 'N/A'}</span></p>
                </div>
              </DialogDescription>
            </DialogHeader>
              
            <div className="space-y-6 pt-2">
                {profileLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-muted-foreground">Loading student profile...</p>
                  </div>
                ) : (
                  <>
                    {/* Overall Attendance */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border">
                      <h3 className="text-lg font-semibold mb-4">Overall Attendance</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-5xl font-bold text-green-600">{studentProfile?.overallAttendance}%</p>
                          <p className="text-muted-foreground mt-2">
                            {studentProfile && studentProfile.overallAttendance >= 75 
                              ? '✓ Attendance requirement met' 
                              : '⚠️ Below 75% attendance'}
                          </p>
                        </div>
                        <ProgressRing 
                          value={studentProfile?.overallAttendance || 0} 
                          size={100} 
                          strokeWidth={8}
                          showLabel={true}
                        />
                      </div>
                    </div>

                    {/* Subject-wise Attendance */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Subject-wise Attendance</h3>
                      {studentProfile?.subjectWise && studentProfile.subjectWise.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Subject</TableHead>
                              <TableHead className="text-right">Attendance %</TableHead>
                              <TableHead className="text-right">Present/Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentProfile.subjectWise.map((subject, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{subject.subject}</TableCell>
                                <TableCell className="text-right">
                                  <span className={`font-semibold ${
                                    subject.attendancePct >= 75 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {subject.attendancePct}%
                                  </span>
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {subject.presentCount}/{subject.totalCount}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-muted-foreground text-sm">No subject-wise attendance data available</p>
                      )}
                    </div>

                    {/* Monthly Attendance */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Monthly Attendance</h3>
                      {studentProfile?.monthlyAttendance && studentProfile.monthlyAttendance.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Month</TableHead>
                              <TableHead className="text-right">Attendance %</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentProfile.monthlyAttendance.map((month, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{month.monthName}</TableCell>
                                <TableCell className="text-right">
                                  <span className={`font-semibold ${
                                    month.attendancePct >= 75 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {month.attendancePct}%
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-muted-foreground text-sm">No monthly attendance data available</p>
                      )}
                    </div>
                  </>
                )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
