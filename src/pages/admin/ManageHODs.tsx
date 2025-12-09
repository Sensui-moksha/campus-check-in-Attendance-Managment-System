import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, Edit, Trash2, UserPlus, AlertTriangle } from 'lucide-react';
import { api } from '@/api';
import { useToast } from '@/hooks/use-toast';

export default function ManageHODs() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hods, setHODs] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    departmentId: '',
    role: 'hod',
    employeeId: '',
    designation: '',
  });

  useEffect(() => {
    loadHODs();
    loadAdmins();
    loadDepartments();
  }, []);

  const loadHODs = async () => {
    try {
      const res = await api.users.list('hod', 1, 100);
      setHODs((res.data.users || []).map((h: any) => ({ id: h._id, ...h })));
    } catch (error) {
      setHODs([]);
    }
  };
  const loadAdmins = async () => {
    try {
      const res = await api.users.list('admin', 1, 100);
      setAdmins((res.data.users || []).map((a: any) => ({ id: a._id, ...a })));
    } catch (error) {
      setAdmins([]);
    }
  };

  const loadDepartments = async () => {
    try {
      const res = await api.departments.list();
      setDepartments(res.data.departments || []);
    } catch (error) {
      setDepartments([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) return;
    if (formData.role === 'hod' && !formData.departmentId) return;
    try {
      setIsSubmitting(true);
      await api.users.create({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password.trim(),
        role: formData.role,
        departmentId: formData.role === 'hod' ? formData.departmentId : undefined,
      });
      toast({ description: `${formData.role.toUpperCase()} created successfully` });
      setShowCreateDialog(false);
      setFormData({ name: '', email: '', password: '', departmentId: '', role: 'hod', employeeId: '', designation: '' });
      loadHODs();
      loadAdmins();
    } catch (error: any) {
      console.error('Failed to create user:', error);
      toast({ description: error.response?.data?.error || 'Failed to create user', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      departmentId: user.role === 'hod' ? user.department?._id || '' : '',
      role: user.role,
      employeeId: user.employeeId || '',
      designation: user.designation || '',
    });
    setShowEditDialog(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await api.users.update(selectedUser._id, {
        name: formData.name,
        email: formData.email,
        password: formData.password || undefined,
        departmentId: formData.role === 'hod' ? formData.departmentId : undefined,
        employeeId: formData.employeeId || undefined,
        designation: formData.designation || undefined,
      });
      toast({ description: 'User updated successfully' });
      setShowEditDialog(false);
      setSelectedUser(null);
      loadHODs();
      loadAdmins();
    } catch (error: any) {
      console.error('Failed to update user:', error);
      toast({ description: error.response?.data?.error || 'Failed to update user', variant: 'destructive' });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await api.users.delete(selectedUser._id);
      setShowDeleteDialog(false);
      setSelectedUser(null);
      loadHODs();
      loadAdmins();
    } catch (error) {}
  };

  const filteredHODs = hods.filter(h =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.department?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredAdmins = admins.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-in-up">
          <div className="flex-1 w-full">
            <h1 className="text-3xl font-bold text-foreground mb-2">Manage HODs & Admins</h1>
            <p className="text-muted-foreground">Create and manage department heads and administrators</p>
          </div>
          <Button 
            onClick={() => setShowCreateDialog(true)} 
            size="lg" 
            className="h-11 px-6 shadow-lg hover:shadow-xl transition-shadow animate-fade-in-up"
            style={{ animationDelay: '100ms' }}
          >
            + Add HOD/Admin
          </Button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search HODs/Admins by name, email, or department..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>
        {/* HODs Table */}
        <Card className="overflow-hidden shadow-lg animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="px-6 py-4 bg-primary/5 border-b border-primary/20">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary rounded-full"></div>
                  HODs
                </h2>
              </div>
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">NAME</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">EMAIL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">DEPARTMENT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y">
                  {filteredHODs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="h-8 w-8 opacity-50" />
                          <p className="text-sm">No HODs found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredHODs.map(hod => (
                      <tr key={hod.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{hod.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">{hod.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                            {hod.department?.name || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditUser(hod)}
                              className="h-8 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { setSelectedUser(hod); setShowDeleteDialog(true); }}
                              className="h-8 hover:bg-red-50 hover:text-red-700 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              
              {/* Admins Section */}
              <div className="px-6 py-4 bg-primary/5 border-b border-t border-primary/20 mt-6">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary rounded-full"></div>
                  Admins
                </h2>
              </div>
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">NAME</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">EMAIL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y">
                  {filteredAdmins.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="h-8 w-8 opacity-50" />
                          <p className="text-sm">No Admins found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAdmins.map(admin => (
                      <tr key={admin.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{admin.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">{admin.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditUser(admin)}
                              className="h-8 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { setSelectedUser(admin); setShowDeleteDialog(true); }}
                              className="h-8 hover:bg-red-50 hover:text-red-700 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col animate-scale-in">
          <DialogHeader className="border-b pb-4 flex-shrink-0">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">+</span>
              </div>
              <span className="font-semibold">Add HOD/Admin</span>
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              {formData.role === 'hod' 
                ? 'Fill in the details to add a new Head of Department.' 
                : 'Fill in the details to add a new Admin user.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="space-y-6 pt-4 overflow-y-auto flex-1 pr-2">
            {/* Basic Information Section */}
            <div className="p-4 border-2 border-primary/30 rounded-lg bg-primary/5 space-y-4 animate-fade-in-up">
              <h3 className="text-base font-semibold text-primary flex items-center gap-2">
                <div className="w-1 h-4 bg-primary rounded-full"></div>
                Basic Information
              </h3>
              <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  required 
                  className="h-11"
                />
              </div>
              <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <Label htmlFor="email" className="text-sm font-medium">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({ ...formData, email: e.target.value })} 
                  required 
                  className="h-11"
                />
              </div>
              <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                <Label htmlFor="password" className="text-sm font-medium">
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={formData.password} 
                  onChange={e => setFormData({ ...formData, password: e.target.value })} 
                  required 
                  className="h-11"
                />
              </div>
            </div>

            {/* Role & Assignment Section */}
            <div className="p-4 border-2 border-primary/30 rounded-lg bg-primary/5 space-y-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <h3 className="text-base font-semibold text-primary flex items-center gap-2">
                <div className="w-1 h-4 bg-primary rounded-full"></div>
                Role & Assignment
              </h3>
              <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
                <Label htmlFor="role" className="text-sm font-medium">
                  Role <span className="text-red-500">*</span>
                </Label>
                <select 
                  id="role" 
                  value={formData.role} 
                  onChange={e => setFormData({ ...formData, role: e.target.value })} 
                  required 
                  className="w-full h-11 border-2 border-input rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value="hod">HOD</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {formData.role === 'hod' && (
                <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                  <Label htmlFor="department" className="text-sm font-medium">
                    Department <span className="text-red-500">*</span>
                  </Label>
                  <select 
                    id="department" 
                    value={formData.departmentId} 
                    onChange={e => setFormData({ ...formData, departmentId: e.target.value })} 
                    required 
                    className="w-full h-11 border-2 border-input rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="">Select department</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            </div>
            <div className="flex justify-end gap-3 pt-6 border-t mt-6 flex-shrink-0 bg-background">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} className="h-11 px-6">Cancel</Button>
              <Button type="submit" className="h-11 px-8 bg-primary hover:bg-primary/90 shadow-lg" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="border-b pb-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <Edit className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Edit User</DialogTitle>
                <DialogDescription className="text-base">
                  Update the user's information and department (if HOD).
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-6 pt-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2">
                <div className="p-2 rounded-md bg-emerald-500/10">
                  <UserPlus className="h-4 w-4 text-emerald-600" />
                </div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Basic Information
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
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
              </div>
            </div>

            {/* Employment Details */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2 pb-2">
                <div className="p-2 rounded-md bg-blue-500/10">
                  <UserPlus className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Employment Details
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-employeeId" className="text-sm font-medium flex items-center gap-2">
                    Employee ID
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
                    Designation
                  </Label>
                  <Input 
                    id="edit-designation" 
                    value={formData.designation} 
                    onChange={e => setFormData({ ...formData, designation: e.target.value })} 
                    placeholder="e.g., Professor, HOD"
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            {/* Role & Assignment */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2 pb-2">
                <div className="p-2 rounded-md bg-orange-500/10">
                  <UserPlus className="h-4 w-4 text-orange-600" />
                </div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Role & Assignment
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-role" className="text-sm font-medium flex items-center gap-2">
                    Role <span className="text-red-500">*</span>
                  </Label>
                  <select 
                    id="edit-role" 
                    value={formData.role} 
                    onChange={e => setFormData({ ...formData, role: e.target.value })} 
                    required 
                    className="w-full h-11 border-2 border-input rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="hod">HOD</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {formData.role === 'hod' && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-department" className="text-sm font-medium flex items-center gap-2">
                      Department <span className="text-red-500">*</span>
                    </Label>
                    <select 
                      id="edit-department" 
                      value={formData.departmentId} 
                      onChange={e => setFormData({ ...formData, departmentId: e.target.value })} 
                      required 
                      className="w-full h-11 border-2 border-input rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    >
                      <option value="">Select department</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} className="h-11 px-6">Cancel</Button>
              <Button type="submit" className="h-11 px-8 bg-primary hover:bg-primary/90 shadow-lg">Save Changes</Button>
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
    </DashboardLayout>
  );
}
