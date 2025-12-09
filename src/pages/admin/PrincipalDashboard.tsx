import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Users, GraduationCap, BookOpen, Building2, UserPlus, FileOutput, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Department } from '@/types/auth';

interface DashboardStats {
  students: number;
  teachers: number;
  courses: number;
  departments: number;
}

export default function PrincipalDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showCreateDept, setShowCreateDept] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptForm, setDeptForm] = useState({ name: '', code: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    students: 0,
    teachers: 0,
    courses: 0,
    departments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch departments and stats on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch departments
        const deptsResponse = await api.departments.list();
        const deptsData = deptsResponse.data.departments || [];
        setDepartments(deptsData);

        // Fetch user counts
        const studentsResponse = await api.users.list('student', 1, 1);
        const teachersResponse = await api.users.list('teacher', 1, 1);
        // Get all subjects count
        const subjectsResponse = await api.subjects.list();

        const studentCount = studentsResponse.data.pagination?.total || 0;
        const teacherCount = teachersResponse.data.pagination?.total || 0;
        const courseCount = (subjectsResponse.data.subjects || []).length;

        setStats({
          students: studentCount,
          teachers: teacherCount,
          courses: courseCount,
          departments: deptsData.length,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deptForm.name.trim() || !deptForm.code.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await api.departments.create({
        name: deptForm.name,
        code: deptForm.code.toUpperCase(),
      });
      
      const newDept = response.data.department;
      setDepartments([...departments, newDept]);
      setDeptForm({ name: '', code: '' });
      setShowCreateDept(false);
      
      // Update stats
      setStats(prev => ({ ...prev, departments: prev.departments + 1 }));
      
      toast.success(`Department "${deptForm.name}" created successfully!`);
    } catch (error) {
      console.error('Failed to create department:', error);
      toast.error('Failed to create department');
    }
  };

  const handleDeleteDepartment = async () => {
    if (deptToDelete) {
      try {
        const deptName = departments.find(d => d._id === deptToDelete)?.name;
        await api.departments.delete(deptToDelete);
        
        setDepartments(departments.filter(d => d._id !== deptToDelete));
        setShowDeleteConfirm(false);
        setDeptToDelete(null);
        
        // Update stats
        setStats(prev => ({ ...prev, departments: Math.max(0, prev.departments - 1) }));
        
        toast.success(`Department "${deptName}" deleted successfully!`);
      } catch (error) {
        console.error('Failed to delete department:', error);
        toast.error('Failed to delete department');
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Principal Dashboard</h1>
              <p className="text-muted-foreground">College-wide oversight and institutional management</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/admin/create-user')}>
                <UserPlus className="h-4 w-4 mr-2" />
                Create User
              </Button>
              <Button onClick={() => setShowCreateDept(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Department
              </Button>
              <Button variant="outline" onClick={() => navigate('/admin/reports')}>
                <FileOutput className="h-4 w-4 mr-2" />
                Reports
              </Button>
            </div>
          </div>

          {/* Principal Info Card */}
          {(user?.employeeId || user?.designation) && (
            <Card className="mt-4 border-border">
              <CardContent className="pt-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="p-3 rounded-lg border border-border bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Principal Name</p>
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
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Students"
            value={stats.students.toLocaleString()}
            icon={Users}
            accentColor="student"
          />
          <StatCard
            title="Total Teachers"
            value={stats.teachers}
            icon={GraduationCap}
            accentColor="teacher"
          />
          <StatCard
            title="Total Courses"
            value={stats.courses}
            icon={BookOpen}
            accentColor="admin"
          />
          <StatCard
            title="Departments"
            value={stats.departments}
            icon={Building2}
            accentColor="primary"
          />
        </div>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">All Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {departments.map(dept => (
                <div
                  key={dept._id}
                  className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group relative"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">{dept.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Code: {dept.code}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setDeptToDelete(dept._id);
                      setShowDeleteConfirm(true);
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Department Dialog */}
      <Dialog open={showCreateDept} onOpenChange={setShowCreateDept}>
        <DialogContent className="max-w-md">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div className="text-center space-y-1">
              <DialogTitle className="text-2xl">Create New Department</DialogTitle>
              <DialogDescription className="text-base">
                Add a new academic department to the system.
              </DialogDescription>
            </div>
          </DialogHeader>
          <form onSubmit={handleCreateDepartment} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="dept-name" className="text-sm font-medium">Department Name</Label>
              <Input
                id="dept-name"
                placeholder="e.g., Computer Science Engineering"
                value={deptForm.name}
                onChange={e => setDeptForm({ ...deptForm, name: e.target.value })}
                className="h-10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-code" className="text-sm font-medium">Department Code</Label>
              <Input
                id="dept-code"
                placeholder="e.g., CSE"
                value={deptForm.code}
                onChange={e => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                className="h-10"
                maxLength={10}
                required
              />
              <p className="text-xs text-gray-500">Short code for the department (max 10 characters)</p>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateDept(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800">
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader className="space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center animate-in zoom-in-50 duration-200">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="text-center space-y-2">
              <DialogTitle className="text-2xl">Delete Department</DialogTitle>
              <DialogDescription className="text-base">
                This action cannot be undone and will permanently remove the department.
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete <strong className="text-red-600">{departments.find(d => d._id === deptToDelete)?.name}</strong>?
              </p>
              <p className="text-xs text-gray-500 mt-2">All students, teachers, and data associated with this department will be affected.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleDeleteDepartment} className="flex-1">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
