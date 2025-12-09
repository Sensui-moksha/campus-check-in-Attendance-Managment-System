import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Edit, BookOpen, Building2, FileOutput } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/api';

interface TeacherSubject {
  _id: string;
  subjectId: string;
  name: string;
  students: number;
  avgPercent: number;
  department: {
    _id: string;
    name: string;
    code: string;
  };
  yearOfStudy: number;
  section: string;
}

interface DepartmentData {
  _id: string;
  name: string;
  code: string;
  subjects: TeacherSubject[];
  totalStudents: number;
  avgAttendance: number;
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeptDetails, setShowDeptDetails] = useState(false);
  const [selectedDept, setSelectedDept] = useState<DepartmentData | null>(null);
  const [yearCounts, setYearCounts] = useState<Record<number, number>>({});
  const [deptLoadingCounts, setDeptLoadingCounts] = useState(false);
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalStudents: 0,
    avgAttendance: 0,
    departmentCount: 0,
  });

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setIsLoading(true);
        console.log('🔍 TeacherDashboard - Fetching subjects for teacher:', user?._id || user?.id);
        
        // Fetch subjects assigned to this teacher (no teacher param needed - uses authenticated user)
        const subjectsResponse = await api.subjects.getTeacherSubjects();
        
        console.log('✅ TeacherDashboard - Received subjects response:', subjectsResponse.data);
        
        if (subjectsResponse.data?.subjects) {
          const subjectsData = subjectsResponse.data.subjects;
          console.log('📚 Total subjects fetched:', subjectsData.length);
          console.log('📝 First subject sample:', subjectsData[0]);
          setSubjects(subjectsData);

          // Group subjects by department
          const deptMap = new Map<string, DepartmentData>();
          
          subjectsData.forEach((subject: any) => {
            const dept = subject.department || subject.deptInfo;
            if (!dept) {
              console.warn('Subject missing department:', subject);
              return;
            }
            
            const deptId = dept._id;
            if (!deptMap.has(deptId)) {
              deptMap.set(deptId, {
                _id: deptId,
                name: dept.name,
                code: dept.code,
                subjects: [],
                totalStudents: 0,
                avgAttendance: 0,
              });
            }
            
            const deptData = deptMap.get(deptId)!;
            deptData.subjects.push(subject);
            // Handle both students array and studentCount number
            const studentCount = subject.studentCount || subject.students?.length || 0;
            deptData.totalStudents += studentCount;
          });

          // Calculate average attendance for each department
          deptMap.forEach(dept => {
            if (dept.subjects.length > 0) {
              dept.avgAttendance = Math.round(
                dept.subjects.reduce((sum, s) => sum + (s.avgPercent || 0), 0) / dept.subjects.length
              );
            }
          });

          const departmentsArray = Array.from(deptMap.values());
          setDepartments(departmentsArray);

          // Calculate overall stats
          const totalStudents = subjectsData.reduce((sum: number, s: any) => {
            const studentCount = s.studentCount || s.students?.length || 0;
            return sum + studentCount;
          }, 0);
          const avgAttendance = subjectsData.length > 0
            ? Math.round(
                subjectsData.reduce((sum: number, s: any) => sum + (s.avgPercent || 0), 0) / subjectsData.length
              )
            : 0;

          setStats({
            totalSubjects: subjectsData.length,
            totalStudents,
            avgAttendance,
            departmentCount: departmentsArray.length,
          });
        }
      } catch (error) {
        console.error('Failed to fetch teacher subjects:', error);
        setSubjects([]);
        setDepartments([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id || user?._id) {
      fetchTeacherData();
    }
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-8 px-2 sm:px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-primary drop-shadow-sm">
              Welcome, {user?.name}!
            </h1>
            <p className="text-base text-muted-foreground mt-1">Manage your departments and attendance</p>
          </div>
          <Button 
            size="lg" 
            variant="outline" 
            className="rounded-xl shadow-sm" 
            onClick={() => navigate('/teacher/reports')}
          >
            <FileOutput className="h-5 w-5 mr-2" />
            Export Reports
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Departments"
            value={stats.departmentCount}
            icon={Building2}
            accentColor="primary"
          />
          <StatCard
            title="Total Subjects"
            value={stats.totalSubjects}
            icon={BookOpen}
            accentColor="teacher"
          />
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon={Users}
            accentColor="primary"
          />
          <StatCard
            title="Average Attendance"
            value={`${stats.avgAttendance}%`}
            icon={Edit}
            accentColor="teacher"
          />
        </div>

        {/* Teacher's Department Info */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Your Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="p-3 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">Department</p>
                <p className="text-lg font-semibold text-foreground">
                  {typeof user?.department === 'string' 
                    ? user.department 
                    : user?.department?.name || 'N/A'}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">Employee ID</p>
                <p className="text-lg font-semibold text-foreground">{user?.employeeId || 'N/A'}</p>
              </div>
              <div className="p-3 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">Designation</p>
                <p className="text-lg font-semibold text-foreground">{user?.designation || 'Faculty'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg rounded-xl bg-background">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold text-primary">Your Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {departments.length > 0 ? (
                departments.map(dept => (
                  <div
                    key={dept._id}
                    className="p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors group relative cursor-pointer shadow-sm"
                    onClick={async () => {
                      setSelectedDept(dept);
                      setShowDeptDetails(true);
                      // Calculate student counts by year for this department
                      setDeptLoadingCounts(true);
                      try {
                        const yearMap: Record<number, number> = {};
                        dept.subjects.forEach(subject => {
                          const year = subject.yearOfStudy || 0;
                          const studentCount = subject.studentCount || subject.students?.length || 0;
                          yearMap[year] = (yearMap[year] || 0) + studentCount;
                        });
                        setYearCounts(yearMap);
                      } catch (err) {
                        console.error('Failed to calculate year counts:', err);
                        setYearCounts({});
                      } finally {
                        setDeptLoadingCounts(false);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg text-foreground">{dept.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Code: {dept.code}</p>
                    <div className="space-y-1 mb-3">
                      <p className="text-sm text-muted-foreground">
                        Subjects: <span className="font-semibold text-foreground">{dept.subjects.length}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Students: <span className="font-semibold text-foreground">{dept.totalStudents}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Avg Attendance: <span className="font-semibold text-foreground">{dept.avgAttendance}%</span>
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="w-full text-xs rounded-lg"
                      onClick={e => {
                        e.stopPropagation();
                        navigate('/teacher/mark-attendance');
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Mark Attendance
                    </Button>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-8 text-center text-muted-foreground border border-border rounded-lg">
                  <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No departments assigned yet</p>
                  <p className="text-sm">Contact your administrator to assign subjects</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Details Dialog - Show subjects by year */}
      <Dialog open={showDeptDetails} onOpenChange={setShowDeptDetails}>
        <DialogContent className="max-w-2xl max-h-[75vh] overflow-y-auto">
          <DialogHeader className="space-y-3 border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl">
                  {selectedDept?.name || 'Department'}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  All subjects assigned to you in this department
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {selectedDept?.subjects && selectedDept.subjects.length > 0 ? (
              selectedDept.subjects.map((subject, idx) => (
                <div key={`${subject.subjectId}-${idx}`} className="p-4 border border-border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-foreground">{subject.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {subject.code} • Year {subject.yearOfStudy} • {subject.section?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{subject.students || 0}</p>
                      <p className="text-xs text-muted-foreground">Students</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Avg Attendance: <span className="font-medium">{subject.avgPercent || 0}%</span>
                  </p>
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      setShowDeptDetails(false);
                      navigate(`/teacher/mark-attendance?subjectId=${subject.subjectId || subject._id}`);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Mark Attendance
                  </Button>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <p>No subjects found</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeptDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
