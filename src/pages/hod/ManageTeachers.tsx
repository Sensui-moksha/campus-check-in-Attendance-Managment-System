import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { Search, Edit, Trash2, UserPlus, AlertTriangle } from 'lucide-react';
import { api } from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function ManageTeachers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const departmentId = typeof user?.department === 'string' ? user.department : user?.department?._id || user?.departmentId;
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    employeeId: '',
    designation: '',
    batchYear: '',
    academicStartDate: '',
  });

  useEffect(() => {
    loadTeachers();
  }, [departmentId]);

  const loadTeachers = async () => {
    if (!departmentId) return;
    try {
      setLoading(true);
      const res = await api.users.list('teacher', 1, 100);
      // Filter by department on frontend since backend returns all teachers
      const allTeachers = (res.data.teachers || []).map((t: any) => ({ id: t._id, ...t }));
      const filteredTeachers = allTeachers.filter((t: any) => {
        const teacherDeptId = typeof t.department === 'string' ? t.department : t.department?._id;
        return String(teacherDeptId) === String(departmentId);
      });
      setTeachers(filteredTeachers);
    } catch (error) {
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) return;
    try {
      setIsSubmitting(true);
      const createData: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password.trim(),
        role: 'teacher',
        departmentId,
        employeeId: formData.employeeId,
        designation: formData.designation,
        batchYear: formData.batchYear ? parseInt(formData.batchYear) : undefined,
      };
      if (formData.academicStartDate) createData.academicStartDate = formData.academicStartDate;
      
      await api.users.create(createData);
      toast({ description: 'Teacher created successfully' });
      setShowCreateDialog(false);
      setFormData({ name: '', email: '', password: '', employeeId: '', designation: '', batchYear: '', academicStartDate: '' });
      loadTeachers();
    } catch (error: any) {
      console.error('Failed to create teacher:', error);
      toast({ description: error.response?.data?.error || 'Failed to create teacher', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTeacher = (teacher: any) => {
    setSelectedTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      password: '',
      employeeId: teacher.employeeId || '',
      designation: teacher.designation || '',
      batchYear: teacher.batchYear ? String(teacher.batchYear) : '',
      academicStartDate: teacher.academicStartDate ? teacher.academicStartDate.split('T')[0] : '',
    });
    setShowEditDialog(true);
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    try {
      setIsSubmitting(true);
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        employeeId: formData.employeeId,
        designation: formData.designation,
        batchYear: formData.batchYear ? parseInt(formData.batchYear) : undefined,
        departmentId,
      };
      if (formData.password) {
        updateData.password = formData.password;
      }
      if (formData.academicStartDate) {
        updateData.academicStartDate = formData.academicStartDate;
      }
      
      await api.users.update(selectedTeacher._id, updateData);
      toast({ description: 'Teacher updated successfully' });
      setShowEditDialog(false);
      setSelectedTeacher(null);
      loadTeachers();
    } catch (error: any) {
      console.error('Failed to update teacher:', error);
      toast({ description: error.response?.data?.error || 'Failed to update teacher', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!selectedTeacher) return;
    try {
      await api.users.delete(selectedTeacher._id);
      setShowDeleteDialog(false);
      setSelectedTeacher(null);
      loadTeachers();
    } catch (error) {}
  };

  const filteredTeachers = teachers.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teachers by name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setShowCreateDialog(true)} size="lg">
            Add Teacher
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">NAME</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">EMAIL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y">
                  {filteredTeachers.map(teacher => (
                    <tr key={teacher.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap">{teacher.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{teacher.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-3">
                          <button className="text-blue-600 hover:text-blue-900" onClick={() => handleEditTeacher(teacher)}>Edit</button>
                          <button className="text-red-600 hover:text-red-900" onClick={() => { setSelectedTeacher(teacher); setShowDeleteDialog(true); }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Create Teacher Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto animate-scale-in">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold">Create New User</span>
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Fill in the teacher information to create a new account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            {/* Basic Information Section */}
            <div className="space-y-4 p-4 border-2 border-primary/30 rounded-lg bg-primary/5">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wide">
                <div className="h-[2px] w-8 bg-primary rounded"></div>
                Basic Information
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                  <Label htmlFor="name" className="text-sm font-medium flex items-center gap-1">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    className="h-11"
                    required
                  />
                </div>
                
                <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                  <Label htmlFor="role" className="text-sm font-medium flex items-center gap-1">
                    Role <span className="text-red-500">*</span>
                  </Label>
                  <Select value="teacher" disabled>
                    <SelectTrigger className="h-11 bg-muted">
                      <SelectValue placeholder="teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher" className="capitalize">
                        teacher
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                  <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@clg.edu"
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                  <Label htmlFor="password" className="text-sm font-medium flex items-center gap-1">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password"
                    className="h-11"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Employment Details Section */}
            <div className="space-y-4 p-4 border-2 border-primary/30 rounded-lg bg-primary/5">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wide">
                <div className="h-[2px] w-8 bg-primary rounded"></div>
                Employment Details
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                  <Label htmlFor="employeeId" className="text-sm font-medium flex items-center gap-1">
                    Employee ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="EMP2024-001"
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                  <Label htmlFor="dob" className="text-sm font-medium flex items-center gap-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </Label>
                  <DatePicker
                    id="dob"
                    value={formData.academicStartDate}
                    onChange={(date) => setFormData({ ...formData, academicStartDate: date })}
                    placeholder="Select date of birth"
                    required
                  />
                </div>

                <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                  <Label htmlFor="yearOfJoining" className="text-sm font-medium flex items-center gap-1">
                    Year of Joining <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="yearOfJoining"
                    type="number"
                    value={formData.batchYear}
                    onChange={e => setFormData({ ...formData, batchYear: e.target.value })}
                    placeholder="e.g., 2020"
                    className="h-11"
                    min={1990}
                    max={new Date().getFullYear()}
                    required
                  />
                </div>

                <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                  <Label htmlFor="designation" className="text-sm font-medium flex items-center gap-1">
                    Designation <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="designation"
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g., Assistant Professor"
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2 sm:col-span-2 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
                  <Label htmlFor="department" className="text-sm font-medium flex items-center gap-1">
                    Department <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="department"
                    value={typeof user?.department === 'string' ? user?.department : user?.department?.name || ''}
                    disabled
                    className="h-11 bg-muted"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t mt-6">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} className="h-11 px-6" disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" className="h-11 px-6" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Add Teacher'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Edit Teacher Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3 border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <Edit className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Edit Teacher</DialogTitle>
                <DialogDescription className="text-base">
                  Update the teacher's information and employment details.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <form onSubmit={handleUpdateTeacher} className="space-y-6 pt-4">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2">
                <div className="p-2 rounded-md bg-emerald-500/10">
                  <UserPlus className="h-4 w-4 text-emerald-600" />
                </div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Basic Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-sm font-medium flex items-center gap-2">
                    Full Name
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email" className="text-sm font-medium flex items-center gap-2">
                    Email Address
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@clg.edu"
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-employeeId" className="text-sm font-medium flex items-center gap-2">
                    Employee ID
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-employeeId"
                    value={formData.employeeId}
                    onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="EMP2024-001"
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-designation" className="text-sm font-medium flex items-center gap-2">
                    Designation
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-designation"
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g., Assistant Professor"
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-dob" className="text-sm font-medium flex items-center gap-2">
                    Date of Birth
                    <span className="text-red-500">*</span>
                  </Label>
                  <DatePicker
                    id="edit-dob"
                    value={formData.academicStartDate}
                    onChange={(date) => setFormData({ ...formData, academicStartDate: date })}
                    placeholder="Select date of birth"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-yearOfJoining" className="text-sm font-medium flex items-center gap-2">
                    Year of Joining
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-yearOfJoining"
                    type="number"
                    value={formData.batchYear}
                    onChange={e => setFormData({ ...formData, batchYear: e.target.value })}
                    placeholder="e.g., 2020"
                    min={1990}
                    max={new Date().getFullYear()}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-department" className="text-sm font-medium flex items-center gap-2">
                    Department
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-department"
                    value={typeof user?.department === 'string' ? user?.department : user?.department?.name || ''}
                    disabled
                    className="h-11 bg-muted"
                  />
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2 pb-2">
                <div className="p-2 rounded-md bg-orange-500/10">
                  <Edit className="h-4 w-4 text-orange-600" />
                </div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Security Settings
                </h3>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Leave password field blank to keep the current password
                </p>

                <div className="space-y-2">
                  <Label htmlFor="edit-password" className="text-sm font-medium">
                    New Password (Optional)
                  </Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
                className="h-11 px-6"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="h-11 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader className="space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center animate-in zoom-in-50 duration-200">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="text-center space-y-2">
              <DialogTitle className="text-2xl">Delete Teacher</DialogTitle>
              <DialogDescription className="text-base">
                This action cannot be undone and will permanently remove this teacher from the system.
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete <strong className="text-red-600">{selectedTeacher?.name}</strong>?
              </p>
              <p className="text-xs text-gray-500 mt-2">All subject assignments and teaching records will be permanently removed.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowDeleteDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleDeleteTeacher} className="flex-1">
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
