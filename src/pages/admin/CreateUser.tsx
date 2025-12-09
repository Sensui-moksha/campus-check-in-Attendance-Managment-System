import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { UserPlus, Search, Edit, Trash2, AlertTriangle, Lock } from 'lucide-react';
import { api } from '@/api';
import { SEMESTER_OPTIONS, getYearFromSemester } from '@/utils/semesterUtils';
import { MiniCalendar } from '@/components/ui/mini-calendar';

const roles = ['student', 'teacher', 'hod', 'admin', 'principal'];

export default function CreateUser() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptOptions, setDeptOptions] = useState<any[]>([]);
  const [sectionOptions, setSectionOptions] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [newPassword, setNewPassword] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNo: '',
    role: '',
    departmentId: '',
    password: '',
    section: '',
    semester: '',
    batchYear: '',
    yearOfStudy: '',
    programme: 'B.Tech',
    academicStartDate: '',
    academicEndDate: '',
    employeeId: '',
    designation: '',
    isLateralEntry: false,
  });

  useEffect(() => {
    loadUsers();
    // load department options
    const loadDepts = async () => {
      try {
        const res = await api.departments.list();
        const depts = res.data.departments || [];
        setDeptOptions(depts);
      } catch (err) {
        console.error('Failed to load departments', err);
      }
    };
    loadDepts();
  }, []);

  useEffect(() => {
    const deptId = formData.departmentId;
    if (!deptId) {
      setSectionOptions([]);
      return;
    }

    const loadSections = async () => {
      try {
        const res = await api.departments.getDistinctSections(deptId);
        const secs = (res.data.sections || []) as string[];
        setSectionOptions(secs);
      } catch (err) {
        console.error('Failed to load sections for department', err);
        setSectionOptions([]);
      }
    };

    loadSections();
  }, [formData.departmentId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Fetch all user roles from API with higher limit
      const [studentsRes, teachersRes, hodRes, adminRes, principalRes] = await Promise.all([
        api.users.list('student', 1, 5000),
        api.users.list('teacher', 1, 5000),
        api.users.list('hod', 1, 5000),
        api.users.list('admin', 1, 5000),
        api.users.list('principal', 1, 5000),
      ]);

      // Extract users from different response formats
      const students = (studentsRes.data.students || []).map((s: any) => ({
        id: s._id,
        ...s,
      }));
      const teachers = (teachersRes.data.teachers || []).map((t: any) => ({
        id: t._id,
        ...t,
      }));
      const hods = (hodRes.data.users || []).map((h: any) => ({
        id: h._id,
        ...h,
      }));
      const admins = (adminRes.data.users || []).map((a: any) => ({
        id: a._id,
        ...a,
      }));
      const principals = (principalRes.data.users || []).map((p: any) => ({
        id: p._id,
        ...p,
      }));

      setUsers([...students, ...teachers, ...hods, ...admins, ...principals]);
    } catch (error) {
      console.error('Failed to load users', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to add years to a date
  const addYears = (date: Date, years: number): Date => {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
  };

  // Helper function to calculate days difference
  const daysDifference = (date1: Date, date2: Date): number => {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs(date2.getTime() - date1.getTime()) / msPerDay);
  };

  // Helper function to format date to YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Handle academic start date change
  const handleAcademicStartDateChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      academicStartDate: value
    }));

    // Auto-calculate end date (start + 3 or 4 years based on lateral entry)
    if (value) {
      const startDate = new Date(value + 'T00:00:00');
      const years = formData.isLateralEntry ? 3 : 4;
      const endDate = addYears(startDate, years);
      setFormData(prev => ({
        ...prev,
        academicEndDate: formatDate(endDate)
      }));
    }
  };

  // Handle academic end date change
  const handleAcademicEndDateChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      academicEndDate: value
    }));

    // Auto-calculate start date (end - 3 or 4 years based on lateral entry)
    if (value) {
      const endDate = new Date(value + 'T00:00:00');
      const startDate = new Date(endDate);
      const years = formData.isLateralEntry ? 3 : 4;
      startDate.setFullYear(startDate.getFullYear() - years);
      setFormData(prev => ({
        ...prev,
        academicStartDate: formatDate(startDate)
      }));
    }
  };

  // Validate academic date range (should be ~3 or 4 years based on lateral entry, within ±30 days)
  const validateAcademicDates = (): boolean => {
    if (!formData.academicStartDate || !formData.academicEndDate) {
      return true; // Optional fields
    }

    const startDate = new Date(formData.academicStartDate + 'T00:00:00');
    const endDate = new Date(formData.academicEndDate + 'T00:00:00');

    if (startDate >= endDate) {
      toast.error('Academic end date must be after start date');
      return false;
    }

    // Check if difference is approximately 3 or 4 years (±30 days)
    const years = formData.isLateralEntry ? 3 : 4;
    const expectedEndDate = addYears(startDate, years);
    const daysDiff = daysDifference(expectedEndDate, endDate);

    if (daysDiff > 30) {
      toast.error(`Academic period must be approximately ${years} years (within ±30 days)`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields first
    if (!formData.name.trim()) {
      toast.error('Full name is required');
      return;
    }
    if (!formData.role) {
      toast.error('Role is required');
      return;
    }
    if (!formData.password) {
      toast.error('Password is required');
      return;
    }
    
    if (!validateAcademicDates()) {
      return;
    }

    try {
      // Clean up the data - remove empty strings and convert types
      const cleanedData: any = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        role: formData.role,
        password: formData.password,
        departmentId: formData.departmentId || undefined,
      };

      // Add student-specific fields
      if (formData.role === 'student') {
        cleanedData.rollNo = formData.rollNo.trim() || undefined;
        cleanedData.section = formData.section.trim() || undefined;
      }

      // Add staff-specific fields
      if (formData.role !== 'student') {
        cleanedData.employeeId = formData.employeeId.trim() || undefined;
        cleanedData.designation = formData.designation.trim() || undefined;
      }

      // Add optional fields only if they have values
      if (formData.semester) cleanedData.semester = parseInt(formData.semester);
      if (formData.yearOfStudy) cleanedData.yearOfStudy = parseInt(formData.yearOfStudy);
      if (formData.batchYear) cleanedData.batchYear = parseInt(formData.batchYear);
      if (formData.programme) cleanedData.programme = formData.programme;
      if (formData.academicStartDate) cleanedData.academicStartDate = formData.academicStartDate;
      if (formData.academicEndDate) cleanedData.academicEndDate = formData.academicEndDate;
      if (formData.role === 'student') cleanedData.isLateralEntry = formData.isLateralEntry;

      console.log('Creating user with data:', cleanedData);
      await api.users.create(cleanedData);
      toast.success('User created successfully!');
      setShowCreateDialog(false);
      setFormData({
        name: '',
        email: '',
        rollNo: '',
        role: '',
        departmentId: '',
        password: '',
        section: '',
        semester: '',
        batchYear: '',
        yearOfStudy: '',
        programme: 'B.Tech',
        academicStartDate: '',
        academicEndDate: '',
        employeeId: '',
        designation: '',
        isLateralEntry: false,
      });
      loadUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to create user';
      toast.error(errorMsg);
    }
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email || '',
      rollNo: user.rollNo || '',
      role: user.role,
      departmentId: user.department?._id || '',
      password: '',
      section: user.section || '',
      semester: user.semester ? String(user.semester) : '',
      batchYear: user.batchYear ? String(user.batchYear) : '',
      yearOfStudy: user.yearOfStudy ? String(user.yearOfStudy) : '',
      programme: user.programme || 'B.Tech',
      academicStartDate: user.academicStartDate ? user.academicStartDate.split('T')[0] : '',
      academicEndDate: user.academicEndDate ? user.academicEndDate.split('T')[0] : '',
      employeeId: user.employeeId || '',
      designation: user.designation || '',
      isLateralEntry: user.isLateralEntry || false,
    });
    setShowEditDialog(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        departmentId: formData.departmentId,
        programme: formData.programme,
      };

      // Student-specific fields
      if (formData.role === 'student') {
        updateData.rollNo = formData.rollNo;
        updateData.section = formData.section;
        updateData.semester = formData.semester ? parseInt(formData.semester) : undefined;
        updateData.batchYear = formData.batchYear ? parseInt(formData.batchYear) : undefined;
        updateData.yearOfStudy = formData.yearOfStudy ? parseInt(formData.yearOfStudy) : undefined;
        updateData.isLateralEntry = formData.isLateralEntry;
        if (formData.academicStartDate) updateData.academicStartDate = formData.academicStartDate;
        if (formData.academicEndDate) updateData.academicEndDate = formData.academicEndDate;
      } else {
        // Staff fields (teacher, hod, admin, principal)
        updateData.employeeId = formData.employeeId;
        updateData.designation = formData.designation;
        updateData.batchYear = formData.batchYear ? parseInt(formData.batchYear) : undefined; // Year of joining
        if (formData.academicStartDate) updateData.academicStartDate = formData.academicStartDate; // DOB
      }
      
      // Use _id property, not id
      const userId = selectedUser._id || selectedUser.id;
      await api.users.update(userId, updateData);
      toast.success('User updated successfully!');
      setShowEditDialog(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to update user';
      toast.error(errorMsg);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) {
      toast.error('Please enter a new password');
      return;
    }
    try {
      const userId = selectedUser._id || selectedUser.id;
      console.log('🔐 Frontend: Changing password for user:', userId);
      console.log('📝 Frontend: New password length:', newPassword.length);
      console.log('📤 Frontend: Sending update request...');
      await api.users.update(userId, { password: newPassword });
      console.log('✅ Frontend: Password update request successful');
      toast.success('Password changed successfully!');
      setShowPasswordDialog(false);
      setSelectedUser(null);
      setNewPassword('');
      // Don't reload users to avoid page refresh and see logs
      // loadUsers();
    } catch (error) {
      console.error('❌ Frontend: Error changing password:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to change password';
      toast.error(errorMsg);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      const userId = selectedUser._id || selectedUser.id;
      await api.users.delete(userId);
      toast.success('User deleted successfully!');
      setShowDeleteDialog(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to delete user';
      toast.error(errorMsg);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;
    try {
      await api.users.bulkDelete(Array.from(selectedUsers));
      toast.success(`Successfully deleted ${selectedUsers.size} user(s)!`);
      setShowBulkDeleteDialog(false);
      setSelectedUsers(new Set());
      loadUsers();
    } catch (error) {
      toast.error('Failed to delete users');
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.rollNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesDept = filterDept === 'all' || user.department?._id === filterDept;
    const matchesYear = filterYear === 'all' || user.yearOfStudy?.toString() === filterYear;
    const matchesSection = filterSection === 'all' || user.section?.toLowerCase() === filterSection.toLowerCase();
    
    return matchesSearch && matchesRole && matchesDept && matchesYear && matchesSection;
  });

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-slate-100 text-slate-800',
      teacher: 'bg-cyan-100 text-cyan-800',
      student: 'bg-blue-100 text-blue-800',
      hod: 'bg-indigo-100 text-indigo-800',
      principal: 'bg-sky-100 text-sky-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Total Users Count */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold">{filteredUsers.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">All Users</p>
                <p className="text-xl font-semibold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map(role => (
                      <SelectItem key={role} value={role} className="capitalize">
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={filterDept} onValueChange={setFilterDept}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {deptOptions.map(dept => (
                      <SelectItem key={dept._id} value={dept._id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    <SelectItem value="1">Year 1</SelectItem>
                    <SelectItem value="2">Year 2</SelectItem>
                    <SelectItem value="3">Year 3</SelectItem>
                    <SelectItem value="4">Year 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Section</Label>
                <Select value={filterSection} onValueChange={setFilterSection}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Sections" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    <SelectItem value="A">Section A</SelectItem>
                    <SelectItem value="B">Section B</SelectItem>
                    <SelectItem value="C">Section C</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setFilterRole('all');
                    setFilterDept('all');
                    setFilterYear('all');
                    setFilterSection('all');
                    setSearchQuery('');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Header with Search and Create Button */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name, email, reg ID, or department..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {selectedUsers.size > 0 && (
            <Button 
              variant="destructive" 
              onClick={() => setShowBulkDeleteDialog(true)}
              size="lg"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedUsers.size})
            </Button>
          )}
          <Button onClick={() => setShowCreateDialog(true)} size="lg">
            Create New User
          </Button>
        </div>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      USER
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      CONTACT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      ACADEMIC DETAILS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      ROLE
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-muted/50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-lg font-semibold text-primary">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-foreground">{user.name}</div>
                            {user.rollNo && (
                              <div className="text-sm text-muted-foreground">ID: {user.rollNo}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">{user.department?.name || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-3">
                          <button className="text-blue-600 hover:text-blue-900" onClick={() => handleEditUser(user)}>Edit</button>
                          <button className="text-amber-600 hover:text-amber-900" onClick={() => {
                            setSelectedUser(user);
                            setShowPasswordDialog(true);
                          }}>Password</button>
                          <button className="text-red-600 hover:text-red-900" onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteDialog(true);
                          }}>Delete</button>
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

      {/* Create User Dialog */}
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
              {formData.role === 'student' 
                ? 'Fill in the student information to create a new account.' 
                : formData.role 
                  ? `Fill in the ${formData.role} information to create a new account.`
                  : 'Select a role to begin filling out the form.'}
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
                  <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role} value={role} className="capitalize">
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Lateral Entry Checkbox - Only show when role is student */}
                {formData.role === 'student' && (
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
                            const startDate = new Date(formData.academicStartDate + 'T00:00:00');
                            const years = isLE ? 3 : 4;
                            const endDate = addYears(startDate, years);
                            setFormData(prev => ({ ...prev, isLateralEntry: isLE, academicEndDate: formatDate(endDate) }));
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
                )}

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

            {/* Staff-specific fields (teacher, hod, admin, principal) */}
            {formData.role !== 'student' && formData.role && (
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
                      <MiniCalendar
                        value={formData.academicStartDate ? new Date(formData.academicStartDate) : undefined}
                        onChange={(date) => setFormData({ ...formData, academicStartDate: date.toISOString().split('T')[0] })}
                        placeholder="Select date of birth"
                        maxDate={new Date()}
                        className="h-11"
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
                      <Select value={formData.departmentId} onValueChange={v => setFormData({ ...formData, departmentId: v })} required>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {deptOptions.map(dept => (
                            <SelectItem key={dept._id} value={dept._id}>{dept.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
            )}

            {/* Student-specific fields */}
            {formData.role === 'student' && (
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
                      <Select value={formData.departmentId} onValueChange={v => setFormData({ ...formData, departmentId: v })} required>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {deptOptions.map(dept => (
                            <SelectItem key={dept._id} value={dept._id}>{dept.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
            )}

            <div className="flex justify-end gap-3 pt-6 border-t mt-6">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} className="h-11 px-6">
                Cancel
              </Button>
              <Button type="submit" className="h-11 px-8 bg-primary hover:bg-primary/90 shadow-lg">
                <UserPlus className="h-4 w-4 mr-2" />
                Create User
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3 border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <Edit className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Edit User</DialogTitle>
                <DialogDescription className="text-base">
                  Modify the user's information and settings.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-6 pt-4">
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
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-role" className="text-sm font-medium flex items-center gap-2">
                    Role <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="hod">HOD</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="principal">Principal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Lateral Entry Checkbox in Edit - Right after Role */}
                {formData.role === 'student' && (
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
                            const startDate = new Date(formData.academicStartDate + 'T00:00:00');
                            const years = isLE ? 3 : 4;
                            const endDate = addYears(startDate, years);
                            setFormData(prev => ({ ...prev, isLateralEntry: isLE, academicEndDate: formatDate(endDate) }));
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
                )}

                <div className="space-y-2">
                  <Label htmlFor="edit-department" className="text-sm font-medium flex items-center gap-2">
                    Department <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.departmentId} onValueChange={v => setFormData({ ...formData, departmentId: v })}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {deptOptions.map(d => (
                        <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.role === 'student' && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-rollNo" className="text-sm font-medium">
                      Roll No
                    </Label>
                    <Input
                      id="edit-rollNo"
                      value={formData.rollNo}
                      onChange={e => setFormData({ ...formData, rollNo: e.target.value })}
                      placeholder="e.g., 2023001"
                      className="h-11"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Employment Details for Staff */}
            {formData.role !== 'student' && formData.role && (
              <div className="space-y-4 p-4 border-2 border-primary/30 rounded-lg bg-primary/5">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wide">
                  <div className="h-[2px] w-8 bg-primary rounded"></div>
                  Employment Details
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-employeeId" className="text-sm font-medium flex items-center gap-2">
                      Employee ID <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-employeeId"
                      value={formData.employeeId}
                      onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                      placeholder="EMP2024-001"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-designation" className="text-sm font-medium flex items-center gap-2">
                      Designation <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-designation"
                      value={formData.designation}
                      onChange={e => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="e.g., Assistant Professor"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-dob" className="text-sm font-medium flex items-center gap-2">
                      Date of Birth
                    </Label>
                    <MiniCalendar
                      value={formData.academicStartDate ? new Date(formData.academicStartDate) : undefined}
                      onChange={(date) => setFormData({ ...formData, academicStartDate: date.toISOString().split('T')[0] })}
                      placeholder="Select date of birth"
                      maxDate={new Date()}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-yearOfJoining" className="text-sm font-medium flex items-center gap-2">
                      Year of Joining
                    </Label>
                    <Input
                      id="edit-yearOfJoining"
                      type="number"
                      value={formData.batchYear}
                      onChange={e => setFormData({ ...formData, batchYear: e.target.value })}
                      placeholder="e.g., 2020"
                      min={1990}
                      max={new Date().getFullYear()}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Student-specific fields */}
            {formData.role === 'student' && (
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
                      placeholder="Enter section (optional)"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-semester" className="text-sm font-medium">
                      Semester
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
                    <Label htmlFor="edit-academicStartDate" className="text-sm font-medium">
                      Academic Start Date
                    </Label>
                    <MiniCalendar
                      value={formData.academicStartDate ? new Date(formData.academicStartDate) : undefined}
                      onChange={(date) => handleAcademicStartDateChange(date.toISOString().split('T')[0])}
                      placeholder="Select academic start date"
                      maxDate={formData.academicEndDate ? new Date(formData.academicEndDate) : undefined}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>
            )}

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
              <Lock className="h-6 w-6 text-white" />
            </div>
            <div className="text-center space-y-1">
              <DialogTitle className="text-2xl">Change Password</DialogTitle>
              <DialogDescription className="text-base">
                Set a new password for this user account.
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
                <Lock className="h-4 w-4 mr-2" />
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
              <DialogTitle className="text-2xl">Delete User</DialogTitle>
              <DialogDescription className="text-base">
                This action cannot be undone and will permanently remove this user from the system.
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete <strong className="text-red-600">{selectedUser?.name}</strong>?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowDeleteDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleDeleteUser} className="flex-1">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader className="space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center animate-in zoom-in-50 duration-200">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="text-center space-y-2">
              <DialogTitle className="text-2xl">Bulk Delete Users</DialogTitle>
              <DialogDescription className="text-base">
                This action cannot be undone and will permanently remove all selected users.
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                You are about to delete <strong className="text-red-600">{selectedUsers.size}</strong> user{selectedUsers.size > 1 ? 's' : ''}.
              </p>
              <p className="text-xs text-gray-500 mt-2">All their data and associations will be permanently removed from the system.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowBulkDeleteDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleBulkDelete} className="flex-1">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete {selectedUsers.size}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
