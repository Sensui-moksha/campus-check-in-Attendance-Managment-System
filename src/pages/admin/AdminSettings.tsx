import { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-spinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Settings, Save, RotateCcw, Shield, Upload, Bell, GraduationCap, Clock, AlertTriangle } from 'lucide-react';
// Local helper to resolve API base URL
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE as string;
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:5000/api`;
};

interface SystemSettings {
  teacherDirectDetainAllowed: boolean;
  allowTeacherMultiDepartment: boolean;
  maxBulkUploadSizeMB: number;
  bulkUploadRateLimitPerHour: number;
  defaultSemesterId: string | null;
  detainNotificationEmail: string;
  lowAttendanceThreshold: number;
  detentionAttendanceThreshold: number;
  sessionTimeoutMinutes: number;
  enableAuditLogging: boolean;
  maxExportRecords: number;
}

interface Semester {
  _id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<SystemSettings | null>(null);

  // Local axios client to avoid module typing issues
  const http = axios.create({
    baseURL: `${getApiBaseUrl()}/admin`,
    withCredentials: true,
  });

  useEffect(() => {
    loadSettings();
    loadSemesters();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await http.get('/settings');
      const loadedSettings = response.data.settings;
      setSettings(loadedSettings);
      setOriginalSettings(JSON.parse(JSON.stringify(loadedSettings)));
    } catch (error: unknown) {
      console.error('Failed to load settings:', error);
      const responseError = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(responseError || 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSemesters = async () => {
    try {
      const response = await http.get('/semesters');
      setSemesters(response.data.semesters || []);
    } catch (error) {
      console.error('Failed to load semesters:', error);
    }
  };

  const handleChange = (key: keyof SystemSettings, value: SystemSettings[keyof SystemSettings]) => {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    setHasChanges(JSON.stringify(updated) !== JSON.stringify(originalSettings));
  };

  const handleSave = async () => {
    if (!settings || !hasChanges) return;

    try {
      setIsSaving(true);
      await http.put('/settings', settings);
      toast.success('Settings saved successfully');
      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      setHasChanges(false);
    } catch (error: unknown) {
      console.error('Failed to save settings:', error);
      const responseData = (error as { response?: { data?: { error?: string; errors?: string[] } } }).response?.data;
      toast.error(responseData?.error || 'Failed to save settings');
      responseData?.errors?.forEach((err: string) => toast.error(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsSaving(true);
      await http.post('/settings/reset');
      toast.success('Settings reset to defaults');
      await loadSettings();
      setHasChanges(false);
      setShowResetDialog(false);
    } catch (error: unknown) {
      console.error('Failed to reset settings:', error);
      const responseError = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(responseError || 'Failed to reset settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalSettings) {
      setSettings(JSON.parse(JSON.stringify(originalSettings)));
      setHasChanges(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 px-2 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-primary drop-shadow-sm flex items-center gap-2">
              <Settings className="h-8 w-8" />
              System Settings
            </h1>
            <p className="text-base text-muted-foreground mt-1">
              Configure system-wide behavior and policies
            </p>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
            )}
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || isSaving}
              className="min-w-[120px]"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => setShowResetDialog(true)}
              disabled={isSaving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </div>

        {/* Teacher & Staff Settings */}
        <Card className="border-none shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Teacher & Staff Settings
            </CardTitle>
            <CardDescription>Configure teacher permissions and assignments</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="teacherDirectDetain" className="text-base font-medium">
                    Allow Direct Detentions
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Teachers can detain students without HOD/Admin approval
                  </p>
                </div>
                <Switch
                  id="teacherDirectDetain"
                  checked={settings.teacherDirectDetainAllowed}
                  onCheckedChange={(checked) => handleChange('teacherDirectDetainAllowed', checked)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="multiDept" className="text-base font-medium">
                    Multi-Department Teachers
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Allow teachers to be assigned to multiple departments
                  </p>
                </div>
                <Switch
                  id="multiDept"
                  checked={settings.allowTeacherMultiDepartment}
                  onCheckedChange={(checked) => handleChange('allowTeacherMultiDepartment', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Upload Settings */}
        <Card className="border-none shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Bulk Upload Settings
            </CardTitle>
            <CardDescription>Configure CSV upload limits and restrictions</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="uploadSize" className="text-base font-medium">
                Max Upload Size (MB)
              </Label>
              <Input
                id="uploadSize"
                type="number"
                min="1"
                max="100"
                value={settings.maxBulkUploadSizeMB}
                onChange={(e) => handleChange('maxBulkUploadSizeMB', parseInt(e.target.value))}
                className="max-w-xs"
              />
              <p className="text-sm text-muted-foreground">
                Maximum file size for CSV uploads (1-100 MB)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="uploadRate" className="text-base font-medium">
                Rate Limit (per hour)
              </Label>
              <Input
                id="uploadRate"
                type="number"
                min="1"
                max="100"
                value={settings.bulkUploadRateLimitPerHour}
                onChange={(e) => handleChange('bulkUploadRateLimitPerHour', parseInt(e.target.value))}
                className="max-w-xs"
              />
              <p className="text-sm text-muted-foreground">
                Maximum uploads per user per hour (1-100)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Academic Settings */}
        <Card className="border-none shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Academic Settings
            </CardTitle>
            <CardDescription>Configure attendance thresholds and semester defaults</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defaultSemester" className="text-base font-medium">
                Default Semester
              </Label>
              <Select
                value={settings.defaultSemesterId || 'none'}
                onValueChange={(value) => handleChange('defaultSemesterId', value === 'none' ? null : value)}
              >
                <SelectTrigger id="defaultSemester">
                  <SelectValue placeholder="Select default semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No default</SelectItem>
                  {semesters.map((sem) => (
                    <SelectItem key={sem._id} value={sem._id}>
                      {sem.name} ({sem.code}) {sem.isActive && '• Active'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Default semester for attendance and reports
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lowAttendance" className="text-base font-medium">
                Low Attendance Threshold (%)
              </Label>
              <Input
                id="lowAttendance"
                type="number"
                min="0"
                max="100"
                value={settings.lowAttendanceThreshold}
                onChange={(e) => handleChange('lowAttendanceThreshold', parseInt(e.target.value))}
                className="max-w-xs"
              />
              <p className="text-sm text-muted-foreground">
                Trigger warnings when attendance falls below (0-100%)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="detentionThreshold" className="text-base font-medium">
                Detention Threshold (%)
              </Label>
              <Input
                id="detentionThreshold"
                type="number"
                min="0"
                max="100"
                value={settings.detentionAttendanceThreshold}
                onChange={(e) => handleChange('detentionAttendanceThreshold', parseInt(e.target.value))}
                className="max-w-xs"
              />
              <p className="text-sm text-muted-foreground">
                Consider detention when attendance falls below (0-100%)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxExport" className="text-base font-medium">
                Max Export Records
              </Label>
              <Input
                id="maxExport"
                type="number"
                min="100"
                max="100000"
                value={settings.maxExportRecords}
                onChange={(e) => handleChange('maxExportRecords', parseInt(e.target.value))}
                className="max-w-xs"
              />
              <p className="text-sm text-muted-foreground">
                Maximum records per export (100-100,000)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications & Security */}
        <Card className="border-none shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications & Security
            </CardTitle>
            <CardDescription>Configure system notifications and security settings</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="notificationEmail" className="text-base font-medium">
                Detention Notification Email
              </Label>
              <Input
                id="notificationEmail"
                type="email"
                value={settings.detainNotificationEmail}
                onChange={(e) => handleChange('detainNotificationEmail', e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Email address for detention notifications
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionTimeout" className="text-base font-medium">
                Session Timeout (minutes)
              </Label>
              <Input
                id="sessionTimeout"
                type="number"
                min="5"
                max="1440"
                value={settings.sessionTimeoutMinutes}
                onChange={(e) => handleChange('sessionTimeoutMinutes', parseInt(e.target.value))}
                className="max-w-xs"
              />
              <p className="text-sm text-muted-foreground">
                User session timeout (5-1440 minutes)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="auditLogging" className="text-base font-medium">
                    Enable Audit Logging
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Log all admin actions for compliance and debugging
                  </p>
                </div>
                <Switch
                  id="auditLogging"
                  checked={settings.enableAuditLogging}
                  onCheckedChange={(checked) => handleChange('enableAuditLogging', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reset Confirmation Dialog */}
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader className="space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center animate-in zoom-in-50 duration-200">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div className="text-center space-y-2">
                <DialogTitle className="text-2xl">Reset to Defaults?</DialogTitle>
                <DialogDescription className="text-base">
                  This will reset all settings to their default values. This action cannot be undone.
                </DialogDescription>
              </div>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  All custom configurations will be <strong className="text-orange-600">permanently lost</strong>.
                </p>
                <p className="text-xs text-gray-500 mt-2">This includes attendance policies, grading systems, and notification settings.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowResetDialog(false)} className="flex-1" disabled={isSaving}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleReset} disabled={isSaving} className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {isSaving ? 'Resetting...' : 'Reset'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
