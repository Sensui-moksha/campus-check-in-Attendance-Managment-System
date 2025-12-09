import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/api';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import { Edit, Mail, Phone, Building, GraduationCap, Calendar, Hash, User, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getSemesterLabel } from '@/utils/semesterUtils';

const roleBadgeStyles = {
  student: 'bg-blue-100 text-blue-800',
  teacher: 'bg-cyan-100 text-cyan-800',
  hod: 'bg-indigo-100 text-indigo-800',
  admin: 'bg-slate-100 text-slate-800',
  principal: 'bg-sky-100 text-sky-800',
};

export default function Profile() {
  const { user } = useAuth();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    displayName: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      console.log('🔐 Profile: Updating profile for user:', user._id || user.id);
      
      // Build update data
      const updateData: Record<string, string> = {
        name: formData.name,
        email: formData.email,
      };
      
      if (formData.displayName) {
        updateData.displayName = formData.displayName;
      }
      
      if (formData.phone) {
        updateData.phone = formData.phone;
      }
      
      if (formData.password) {
        console.log('📝 Profile: Password change requested, length:', formData.password.length);
        updateData.password = formData.password;
      }
      
      console.log('📤 Profile: Sending update request...');
      await api.users.update(user._id || user.id, updateData);
      console.log('✅ Profile: Update successful');
      
      toast.success('Profile updated successfully!');
      setShowEditDialog(false);
      
      // Reset password fields
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
      
      // Note: Not refreshing page to preserve console logs
      console.log('ℹ️ Profile: Page refresh disabled to preserve logs');
    } catch (error) {
      console.error('❌ Profile: Failed to update profile:', error);
      toast.error('Failed to update profile');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
        {/* Profile Header - Responsive */}
        <div className="relative animate-fade-in">
          {/* Cover gradient - responsive height */}
          <div className="h-32 sm:h-40 md:h-48 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg sm:rounded-xl shadow-medium"></div>
          
          {/* Mobile Layout - Stack everything below the gradient */}
          <div className="sm:hidden flex flex-col items-center px-4 -mt-12">
            {/* Avatar */}
            <Avatar className="h-24 w-24 border-4 border-background bg-white shadow-strong">
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            {/* Name and Info */}
            <div className="text-center mt-3 w-full">
              <h1 className="text-xl font-bold text-foreground mb-1 break-words leading-tight">
                {user.name}
              </h1>
              <p className="text-foreground/70 text-sm mb-3 break-all leading-tight">
                {user.email}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4">
                <Badge className={cn('text-xs capitalize px-2 py-0.5', roleBadgeStyles[user.role])}>
                  {user.role}
                </Badge>
                {typeof user.department === 'string' ? (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 max-w-[140px] truncate">
                    {user.department}
                  </Badge>
                ) : (
                  user.department?.name && (
                    <Badge variant="secondary" className="text-xs px-2 py-0.5 max-w-[140px] truncate">
                      {user.department.name}
                    </Badge>
                  )
                )}
                {user.yearOfStudy && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    Year {user.yearOfStudy}
                  </Badge>
                )}
              </div>
              
              {/* Edit Button */}
              <Button 
                className="w-full" 
                size="default" 
                onClick={() => setShowEditDialog(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
          
          {/* Desktop Layout - Absolute positioning */}
          <div className="hidden sm:block absolute -bottom-12 left-8 right-8">
            <div className="flex flex-row items-end gap-6">
              {/* Avatar */}
              <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-background bg-white shadow-strong card-hover flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-4xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              {/* Name and badges */}
              <div className="flex-1 text-left pb-2 min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 animate-fade-up delay-100 break-words">
                  {user.name}
                </h1>
                <p className="text-foreground/70 text-sm md:text-base mb-3 animate-fade-up delay-200 break-all">
                  {user.email}
                </p>
                <div className="flex flex-wrap items-center gap-2 animate-fade-up delay-300">
                  <Badge className={cn('text-sm capitalize px-3 py-1', roleBadgeStyles[user.role])}>
                    {user.role}
                  </Badge>
                  {typeof user.department === 'string' ? (
                    <Badge variant="secondary" className="text-sm px-3 py-1 max-w-[200px] truncate">
                      {user.department}
                    </Badge>
                  ) : (
                    user.department?.name && (
                      <Badge variant="secondary" className="text-sm px-3 py-1 max-w-[200px] truncate">
                        {user.department.name}
                      </Badge>
                    )
                  )}
                  {user.yearOfStudy && (
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      Year {user.yearOfStudy}
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Edit button */}
              <Button 
                className="mb-2 card-hover animate-fade-up delay-400 flex-shrink-0" 
                size="lg" 
                onClick={() => setShowEditDialog(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Profile Details - Responsive with proper spacing */}
        <div className="pt-4 sm:pt-16 md:pt-16">
          <Card className="shadow-soft card-hover animate-fade-up delay-500">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                      Personal Information
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 sm:gap-4 transition-all-smooth hover:translate-x-1">
                        <div className="p-2 sm:p-3 rounded-lg bg-emerald-500/10 text-emerald-600 flex-shrink-0">
                          <span className="text-lg sm:text-xl font-bold">{initials}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Full Name</p>
                          <p className="text-sm sm:text-base font-medium text-foreground break-words">{user.name}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 sm:gap-4 transition-all-smooth hover:translate-x-1">
                        <div className="p-2 sm:p-3 rounded-lg bg-blue-500/10 flex-shrink-0">
                          <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Email Address</p>
                          <p className="text-sm sm:text-base font-medium text-foreground break-all">{user.email}</p>
                        </div>
                      </div>

                      {user.rollNo && (
                        <div className="flex items-start gap-3 sm:gap-4 transition-all-smooth hover:translate-x-1">
                          <div className="p-2 sm:p-3 rounded-lg bg-purple-500/10 flex-shrink-0">
                            <Hash className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Registration ID</p>
                            <p className="text-sm sm:text-base font-medium text-foreground break-words">{user.rollNo}</p>
                          </div>
                        </div>
                      )}

                      {user.employeeId && (
                        <div className="flex items-start gap-3 sm:gap-4 transition-all-smooth hover:translate-x-1">
                          <div className="p-2 sm:p-3 rounded-lg bg-amber-500/10 flex-shrink-0">
                            <Hash className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Employee ID</p>
                            <p className="text-sm sm:text-base font-medium text-foreground break-words">{user.employeeId}</p>
                          </div>
                        </div>
                      )}

                      {user.designation && (
                        <div className="flex items-start gap-3 sm:gap-4 transition-all-smooth hover:translate-x-1">
                          <div className="p-2 sm:p-3 rounded-lg bg-rose-500/10 flex-shrink-0">
                            <User className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Designation</p>
                            <p className="text-sm sm:text-base font-medium text-foreground break-words">{user.designation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                      Academic Details
                    </h3>
                    <div className="space-y-4">
                      {user.department && (
                        <div className="flex items-start gap-3 sm:gap-4 transition-all-smooth hover:translate-x-1">
                          <div className="p-2 sm:p-3 rounded-lg bg-orange-500/10 flex-shrink-0">
                            <Building className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Department</p>
                            <p className="text-sm sm:text-base font-medium text-foreground break-words">
                              {typeof user.department === 'string' 
                                ? user.department 
                                : user.department.name}
                            </p>
                          </div>
                        </div>
                      )}

                      {user.yearOfStudy && (
                        <div className="flex items-start gap-3 sm:gap-4 transition-all-smooth hover:translate-x-1">
                          <div className="p-2 sm:p-3 rounded-lg bg-indigo-500/10 flex-shrink-0">
                            <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Year of Study</p>
                            <p className="text-sm sm:text-base font-medium text-foreground break-words">
                              {user.yearOfStudy === 1 ? '1st' : user.yearOfStudy === 2 ? '2nd' : user.yearOfStudy === 3 ? '3rd' : `${user.yearOfStudy}th`} Year
                            </p>
                          </div>
                        </div>
                      )}

                      {user.semester && (
                        <div className="flex items-start gap-3 sm:gap-4 transition-all-smooth hover:translate-x-1">
                          <div className="p-2 sm:p-3 rounded-lg bg-pink-500/10 flex-shrink-0">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Current Semester</p>
                            <p className="text-sm sm:text-base font-medium text-foreground break-words">{getSemesterLabel(user.semester)}</p>
                          </div>
                        </div>
                      )}

                      {user.batchYear && (
                        <div className="flex items-start gap-3 sm:gap-4 transition-all-smooth hover:translate-x-1">
                          <div className="p-2 sm:p-3 rounded-lg bg-teal-500/10 flex-shrink-0">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Batch Year</p>
                            <p className="text-sm sm:text-base font-medium text-foreground break-words">{user.batchYear}</p>
                          </div>
                        </div>
                      )}

                      {user.programme && (
                        <div className="flex items-start gap-3 sm:gap-4 transition-all-smooth hover:translate-x-1">
                          <div className="p-2 sm:p-3 rounded-lg bg-cyan-500/10 flex-shrink-0">
                            <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Programme</p>
                            <p className="text-sm sm:text-base font-medium text-foreground break-words">{user.programme}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Profile Dialog - Responsive */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto modal-content w-[95vw] sm:w-full">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <Edit className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Edit Profile</DialogTitle>
                <DialogDescription className="text-base">
                  Update your personal information and customize your experience.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2">
                <div className="p-2 rounded-md bg-emerald-500/10">
                  <User className="h-4 w-4 text-emerald-600" />
                </div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Personal Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-sm font-medium flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Full Name
                  </Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-display-name" className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                    Display Name
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">Optional</Badge>
                  </Label>
                  <Input
                    id="edit-display-name"
                    value={formData.displayName}
                    onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="How you want to be called"
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground flex items-start gap-1.5 pt-1">
                    <Sparkles className="h-3 w-3 mt-0.5 text-purple-500" />
                    <span>Leave blank to use your first name on dashboard</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email" className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    Email Address
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your.email@college.edu"
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-phone" className="text-sm font-medium flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    Phone Number
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">Optional</Badge>
                  </Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="1234567890"
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2 pb-2">
                <div className="p-2 rounded-md bg-orange-500/10">
                  <Lock className="h-4 w-4 text-orange-600" />
                </div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Security Settings
                </h3>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <Lock className="h-4 w-4 mt-0.5" />
                  <span>Leave password fields blank to keep your current password</span>
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-password" className="text-sm font-medium">
                      New Password
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

                  <div className="space-y-2">
                    <Label htmlFor="edit-confirm-password" className="text-sm font-medium">
                      Confirm New Password
                    </Label>
                    <Input
                      id="edit-confirm-password"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="h-11"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
                className="h-11 px-6"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="h-11 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
