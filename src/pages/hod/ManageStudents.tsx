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
import { Search, Edit, Trash2, Key, UserPlus, AlertTriangle } from 'lucide-react';
import { api } from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SEMESTER_OPTIONS, getYearFromSemester } from '@/utils/semesterUtils';
import { MiniCalendar } from '@/components/ui/mini-calendar';

export default function ManageStudents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const departmentId = typeof user?.department === 'string' ? user.department : user?.department?._id || user?.departmentId;
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNo: '',
    password: '',
    section: '',
    yearOfStudy: '',
    semester: '',
    batchYear: '',
    programme: 'B.Tech',
    academicStartDate: '',
    academicEndDate: '',
    isLateralEntry: false,
  });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadStudents();
  }, [departmentId]);

  const loadStudents = async () => {
    if (!departmentId) return;
    try {
      setLoading(true);
      const res = await api.users.list('student', 1, 100, departmentId);
      const students = (res.data.students || []).map((s: any) => ({ id: s._id, ...s }));
      setStudents(students);
    } catch (error) {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcademicStartDateChange = (startDate: string) => {
    setFormData({ ...formData, academicStartDate: startDate });
    if (startDate) {
      const start = new Date(startDate);
      const end = new Date(start);
      const years = formData.isLateralEntry ? 3 : 4;
      end.setFullYear(start.getFullYear() + years);
      setFormData(prev => ({ ...prev, academicStartDate: startDate, academicEndDate: end.toISOString().split('T')[0] }));
    }
  };

  const handleAcademicEndDateChange = (endDate: string) => {
    setFormData({ ...formData, academicEndDate: endDate });
    if (endDate) {
      const end = new Date(endDate);
      const start = new Date(end);
      const years = formData.isLateralEntry ? 3 : 4;
      start.setFullYear(end.getFullYear() - years);
      setFormData(prev => ({ ...prev, academicEndDate: endDate, academicStartDate: start.toISOString().split('T')[0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.rollNo.trim() || !formData.password.trim() || !formData.section.trim()) return;
    try {
      setIsSubmitting(true);
      const createData: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        rollNo: formData.rollNo.trim(),
        password: formData.password.trim(),
        role: 'student',
        departmentId,
        section: formData.section.trim(),
        semester: formData.semester,
        yearOfStudy: formData.yearOfStudy ? parseInt(formData.yearOfStudy) : undefined,
        batchYear: formData.batchYear ? parseInt(formData.batchYear) : undefined,
        programme: formData.programme,
        isLateralEntry: formData.isLateralEntry,
      };
      if (formData.academicStartDate) createData.academicStartDate = formData.academicStartDate;
      if (formData.academicEndDate) createData.academicEndDate = formData.academicEndDate;
      
      await api.users.create(createData);
      toast({ description: 'Student created successfully' });
      setShowCreateDialog(false);
      setFormData({ name: '', email: '', rollNo: '', password: '', section: '', yearOfStudy: '', semester: '', batchYear: '', programme: 'B.Tech', academicStartDate: '', academicEndDate: '', isLateralEntry: false });
      loadStudents();
    } catch (error: any) {
      console.error('Failed to create student:', error);
      toast({ description: error.response?.data?.error || 'Failed to create student', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStudent = (student: any) => {
    console.log('Editing student:', student);
    console.log('Student semester value:', student.semester, 'Type:', typeof student.semester);
    setSelectedStudent(student);
    const semesterValue = student.semester ? String(student.semester) : '';
    console.log('Setting semester in form to:', semesterValue);
    setFormData({
      name: student.name,
      email: student.email,
      rollNo: student.rollNo,
      password: '',
      section: student.section || '',
      yearOfStudy: student.yearOfStudy ? String(student.yearOfStudy) : '',
      semester: semesterValue,
      batchYear: student.batchYear ? String(student.batchYear) : '',
      programme: student.programme || 'B.Tech',
      academicStartDate: student.academicStartDate ? student.academicStartDate.split('T')[0] : '',
      academicEndDate: student.academicEndDate ? student.academicEndDate.split('T')[0] : '',
      isLateralEntry: student.isLateralEntry || false,
    });
    setShowEditDialog(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        rollNo: formData.rollNo,
        section: formData.section,
        semester: formData.semester ? parseInt(formData.semester) : undefined,
        yearOfStudy: formData.yearOfStudy ? parseInt(formData.yearOfStudy) : undefined,
        batchYear: formData.batchYear ? parseInt(formData.batchYear) : undefined,
        isLateralEntry: formData.isLateralEntry,
        academicStartDate: formData.academicStartDate || undefined,
        academicEndDate: formData.academicEndDate || undefined,
        password: formData.password || undefined,
      };
      console.log('Updating student with data:', updateData);
      await api.users.update(selectedStudent._id, updateData);
      toast({ description: 'Student updated successfully' });
      setShowEditDialog(false);
      setSelectedStudent(null);
      loadStudents();
    } catch (error: any) {
      console.error('Failed to update student:', error);
      toast({ description: error.response?.data?.error || 'Failed to update student', variant: 'destructive' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !newPassword) return;
    try {
      await api.users.update(selectedStudent._id, { password: newPassword });
      setShowPasswordDialog(false);
      setSelectedStudent(null);
      setNewPassword('');
      loadStudents();
    } catch (error) {}
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    try {
      await api.users.delete(selectedStudent._id);
      setShowDeleteDialog(false);
      setSelectedStudent(null);
      loadStudents();
    } catch (error) {}
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNo?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students by name, email, or roll no..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setShowCreateDialog(true)} size="lg">
            Add Student
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ROLL NO</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y">
                  {filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap">{student.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{student.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{student.rollNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-3">
                          <button className="text-blue-600 hover:text-blue-900" onClick={() => handleEditStudent(student)}>Edit</button>
                          <button className="text-amber-600 hover:text-amber-900" onClick={() => { setSelectedStudent(student); setShowPasswordDialog(true); }}><Key className="h-4 w-4 mr-1" />Password</button>
                          <button className="text-red-600 hover:text-red-900" onClick={() => { setSelectedStudent(student); setShowDeleteDialog(true); }}>Delete</button>
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
      {/* Create Student Dialog */}
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
              Fill in the student information to create a new account.
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
                  <Select value="student" disabled>
                    <SelectTrigger className="h-11 bg-muted">
                      <SelectValue placeholder="student" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student" className="capitalize">
                        student
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Lateral Entry Checkbox - Right after Role */}
                <div className="space-y-2 animate-fade-in-up sm:col-span-2" style={{ animationDelay: '125ms' }}>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isLateralEntry"
                      checked={formData.isLateralEntry}
                      onChange={e => {
                        const isLE = e.target.checked;
                        setFormData({ ...formData, isLateralEntry: isLE });
                        // Recalculate academic dates if they exist
                        if (formData.academicStartDate) {
                          const start = new Date(formData.academicStartDate);
                          const end = new Date(start);
                          const years = isLE ? 3 : 4;
                          end.setFullYear(start.getFullYear() + years);
                          setFormData(prev => ({ ...prev, isLateralEntry: isLE, academicEndDate: end.toISOString().split('T')[0] }));
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="isLateralEntry" className="text-sm font-medium cursor-pointer">
                      Lateral Entry Student (Joins from 2nd year, 3-year programme)
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    Check this if the student is entering B.Tech from 2nd year through lateral entry
                  </p>
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

            {/* Academic Details Section */}
            <div className="space-y-4 p-4 border-2 border-primary/30 rounded-lg bg-primary/5">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wide">
                <div className="h-[2px] w-8 bg-primary rounded"></div>
                Academic Details
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                  <Label htmlFor="rollNo" className="text-sm font-medium flex items-center gap-1">
                    Roll No <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="rollNo"
                    value={formData.rollNo}
                    onChange={e => setFormData({ ...formData, rollNo: e.target.value })}
                    placeholder="CSE2025-01"
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
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

                <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                  <Label htmlFor="section" className="text-sm font-medium flex items-center gap-1">
                    Section <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="section"
                    value={formData.section}
                    onChange={e => setFormData({ ...formData, section: e.target.value })}
                    placeholder="A, B, C"
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                  <Label htmlFor="semester" className="text-sm font-medium flex items-center gap-1">
                    Semester <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.semester} onValueChange={v => {
                    const year = getYearFromSemester(v);
                    setFormData({ ...formData, semester: v, yearOfStudy: String(year) });
                  }}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEMESTER_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
                  <Label htmlFor="yearOfStudy" className="text-sm font-medium text-muted-foreground">
                    Year of Study (auto-calculated)
                  </Label>
                  <Select value={formData.yearOfStudy} onValueChange={v => setFormData({ ...formData, yearOfStudy: v })} disabled>
                    <SelectTrigger className="bg-muted h-11">
                      <SelectValue placeholder="Select semester first" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                  <Label htmlFor="batchYear" className="text-sm font-medium">
                    Batch Year
                  </Label>
                  <Input
                    id="batchYear"
                    type="number"
                    value={formData.batchYear}
                    onChange={e => setFormData({ ...formData, batchYear: e.target.value })}
                    placeholder="e.g., 2023"
                    className="h-11"
                    min={2000}
                    max={new Date().getFullYear() + 10}
                  />
                </div>

                <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '350ms' }}>
                  <Label htmlFor="academicStartDate" className="text-sm font-medium">
                    Academic Start Date
                  </Label>
                  <MiniCalendar
                    value={formData.academicStartDate ? new Date(formData.academicStartDate) : undefined}
                    onChange={(date) => handleAcademicStartDateChange(date.toISOString().split('T')[0])}
                    placeholder="Select start date"
                    maxDate={formData.academicEndDate ? new Date(formData.academicEndDate) : undefined}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-calculates end date as start + {formData.isLateralEntry ? '3' : '4'} years
                  </p>
                </div>

                <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                  <Label htmlFor="academicEndDate" className="text-sm font-medium">
                    Academic End Date
                  </Label>
                  <MiniCalendar
                    value={formData.academicEndDate ? new Date(formData.academicEndDate) : undefined}
                    onChange={(date) => handleAcademicEndDateChange(date.toISOString().split('T')[0])}
                    placeholder="Select end date"
                    minDate={formData.academicStartDate ? new Date(formData.academicStartDate) : undefined}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-calculates start date as end - {formData.isLateralEntry ? '3' : '4'} years
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t mt-6">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} className="h-11 px-6" disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" className="h-11 px-6" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Add Student'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Edit Student Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <Edit className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Edit Student</DialogTitle>
                <DialogDescription className="text-base">
                  Update the student's information and academic details.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <form onSubmit={handleUpdateStudent} className="space-y-6 pt-4">
            {/* Basic Information */}
            <div className="space-y-4 p-4 border-2 border-primary/30 rounded-lg bg-primary/5">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wide">
                <div className="h-[2px] w-8 bg-primary rounded"></div>
                Basic Information
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-sm font-medium flex items-center gap-2">
                    Full Name <span className="text-red-500">*</span>
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
                    Email <span className="text-red-500">*</span>
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
                  <Label htmlFor="edit-rollNo" className="text-sm font-medium flex items-center gap-2">
                    Roll No <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-rollNo"
                    value={formData.rollNo}
                    onChange={e => setFormData({ ...formData, rollNo: e.target.value })}
                    placeholder="e.g., 2023001"
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-password" className="text-sm font-medium">
                    Password <span className="text-muted-foreground text-xs">(Leave blank to keep current)</span>
                  </Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter new password"
                    className="h-11"
                  />
                </div>

                {/* Lateral Entry Checkbox in Edit - Basic Information Section */}
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-isLateralEntry-basic"
                      checked={formData.isLateralEntry}
                      onChange={e => {
                        const isLE = e.target.checked;
                        setFormData({ ...formData, isLateralEntry: isLE });
                        // Recalculate academic dates if they exist
                        if (formData.academicStartDate) {
                          const start = new Date(formData.academicStartDate);
                          const end = new Date(start);
                          const years = isLE ? 3 : 4;
                          end.setFullYear(start.getFullYear() + years);
                          setFormData(prev => ({ ...prev, isLateralEntry: isLE, academicEndDate: end.toISOString().split('T')[0] }));
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="edit-isLateralEntry-basic" className="text-sm font-medium cursor-pointer">
                      Lateral Entry Student (Joins from 2nd year, 3-year programme)
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    Check this if the student is entering B.Tech from 2nd year through lateral entry
                  </p>
                </div>
              </div>
            </div>

            {/* Academic Details */}
            <div className="space-y-4 p-4 border-2 border-primary/30 rounded-lg bg-primary/5">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wide">
                <div className="h-[2px] w-8 bg-primary rounded"></div>
                Academic Details
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-section" className="text-sm font-medium">
                    Section
                  </Label>
                  <Input
                    id="edit-section"
                    value={formData.section}
                    onChange={e => setFormData({ ...formData, section: e.target.value })}
                    placeholder="e.g., A, B, C"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-semester" className="text-sm font-medium">
                    Semester
                  </Label>
                  <Select
                    value={formData.semester}
                    onValueChange={v => {
                      const year = getYearFromSemester(v);
                      setFormData({ ...formData, semester: v, yearOfStudy: String(year) });
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEMESTER_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-batchYear" className="text-sm font-medium">
                    Batch Year
                  </Label>
                  <Input
                    id="edit-batchYear"
                    type="number"
                    value={formData.batchYear}
                    onChange={e => setFormData({ ...formData, batchYear: e.target.value })}
                    placeholder="e.g., 2023"
                    min={2000}
                    max={new Date().getFullYear() + 10}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-yearOfStudy" className="text-sm font-medium">
                    Year of Study
                  </Label>
                  <Select
                    value={formData.yearOfStudy}
                    onValueChange={v => setFormData({ ...formData, yearOfStudy: v })}
                    disabled
                  >
                    <SelectTrigger className="h-11 bg-muted">
                      <SelectValue placeholder="Auto-set from semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-academicStartDate" className="text-sm font-medium">
                    Academic Start Date
                  </Label>
                  <MiniCalendar
                    value={formData.academicStartDate ? new Date(formData.academicStartDate) : undefined}
                    onChange={(date) => handleAcademicStartDateChange(date.toISOString().split('T')[0])}
                    placeholder="Select start date"
                    maxDate={formData.academicEndDate ? new Date(formData.academicEndDate) : undefined}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-calculates end date as start + {formData.isLateralEntry ? '3' : '4'} years
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-academicEndDate" className="text-sm font-medium">
                    Academic End Date
                  </Label>
                  <MiniCalendar
                    value={formData.academicEndDate ? new Date(formData.academicEndDate) : undefined}
                    onChange={(date) => handleAcademicEndDateChange(date.toISOString().split('T')[0])}
                    placeholder="Select end date"
                    minDate={formData.academicStartDate ? new Date(formData.academicStartDate) : undefined}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-calculates start date as end - {formData.isLateralEntry ? '3' : '4'} years
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Key className="h-6 w-6 text-white" />
            </div>
            <div className="text-center space-y-1">
              <DialogTitle className="text-2xl">Change Password</DialogTitle>
              <DialogDescription className="text-base">
                Set a new password for this student account.
              </DialogDescription>
            </div>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
              <Input 
                id="new-password" 
                type="password" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                placeholder="Enter new password"
                className="h-10"
                required 
              />
              <p className="text-xs text-gray-500">Password must be at least 6 characters long</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowPasswordDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                <Key className="h-4 w-4 mr-2" />
                Update Password
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
              <DialogTitle className="text-2xl">Delete Student</DialogTitle>
              <DialogDescription className="text-base">
                This action cannot be undone and will permanently remove this student from the system.
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete <strong className="text-red-600">{selectedStudent?.name}</strong>?
              </p>
              <p className="text-xs text-gray-500 mt-2">All attendance records and associated data will be permanently removed.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowDeleteDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleDeleteStudent} className="flex-1">
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
