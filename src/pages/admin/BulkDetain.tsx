import React, { useState, useEffect } from 'react';
import { UserX, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { MiniCalendar } from '../../components/ui/mini-calendar';
import { api } from '../../api';
import apiClient from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Student {
  _id: string;
  name: string;
  rollNo: string;
  email: string;
  department: {
    _id: string;
    name: string;
    code: string;
  };
  yearOfStudy: number;
  section?: string;
}

const BulkDetain: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'select' | 'detained'>('select');
  const [detainedStudents, setDetainedStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Filters
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  
  // Detain form
  const [detainForm, setDetainForm] = useState({
    reasonType: 'custom',
    reason: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (viewMode === 'select' && selectedDepartment && selectedYear) {
      fetchStudents();
    } else if (viewMode === 'select') {
      setStudents([]);
      setSelectedStudentIds(new Set());
    }
  }, [selectedDepartment, selectedYear, viewMode]);

  useEffect(() => {
    if (viewMode === 'detained') {
      fetchDetainedStudents();
    }
  }, [viewMode]);

  const fetchDepartments = async () => {
    try {
      const response = await api.departments.list();
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      toast({
        description: 'Failed to load departments',
        variant: 'destructive',
      });
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await api.users.list('student', 1, 1000);
      const allStudents = response.data.students || [];
      
      // Filter by department and year, exclude already detained students
      const filteredStudents = allStudents.filter((s: Student) => {
        const deptId = typeof s.department === 'string' ? s.department : s.department?._id;
        return (
          String(deptId) === String(selectedDepartment) &&
          s.yearOfStudy === parseInt(selectedYear) &&
          !(s as any).isDetained
        );
      });
      
      setStudents(filteredStudents);
      setSelectedStudentIds(new Set());
    } catch (error) {
      console.error('Failed to fetch students:', error);
      toast({
        description: 'Failed to load students',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDetainedStudents = async () => {
    setLoading(true);
    try {
      const response = await api.users.list('student', 1, 1000);
      const allStudents = response.data.students || [];
      
      // Filter only detained students
      const detained = allStudents.filter((s: any) => s.isDetained);
      
      setDetainedStudents(detained);
    } catch (error) {
      console.error('Failed to fetch detained students:', error);
      toast({
        description: 'Failed to load detained students',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.size === students.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(students.map(s => s._id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedStudentIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedStudentIds(newSelected);
  };

  const handleProceedToDetain = () => {
    if (selectedStudentIds.size === 0) {
      toast({
        description: 'Please select at least one student',
        variant: 'destructive',
      });
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleBulkDetain = async () => {
    if (!detainForm.reason.trim()) {
      toast({
        description: 'Please provide a reason for detention',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/detain', {
        userIds: Array.from(selectedStudentIds),
        reasonType: detainForm.reasonType,
        reason: detainForm.reason.trim(),
        detainDate: detainForm.date,
        detainNotes: detainForm.notes.trim() || undefined,
        performedBy: user?._id || user?.id,
      });

      toast({
        description: `Successfully detained ${selectedStudentIds.size} student(s)`,
      });

      setShowConfirmDialog(false);
      setDetainForm({
        reasonType: 'custom',
        reason: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
      });
      
      // Refresh the student list
      fetchStudents();
    } catch (error: any) {
      console.error('Failed to detain students:', error);
      toast({
        description: error.response?.data?.error || 'Failed to detain students',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedStudents = students.filter(s => selectedStudentIds.has(s._id));

  const filteredDetainedStudents = detainedStudents.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <UserX className="h-8 w-8 text-destructive" />
              {viewMode === 'select' ? 'Bulk Detain Students' : 'View Detained Students'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {viewMode === 'select' 
                ? 'Select multiple students from a department and year to detain them together'
                : 'View all currently detained students'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'select' ? 'default' : 'outline'}
              onClick={() => setViewMode('select')}
            >
              Detain Students
            </Button>
            <Button
              variant={viewMode === 'detained' ? 'default' : 'outline'}
              onClick={() => setViewMode('detained')}
            >
              View Detained
            </Button>
          </div>
        </div>

        {viewMode === 'select' && (
          <>
            {/* Filters */}
            <Card>
          <CardHeader>
            <CardTitle>Select Department and Year</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department *</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept._id} value={dept._id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Year of Study *</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Year 1</SelectItem>
                    <SelectItem value="2">Year 2</SelectItem>
                    <SelectItem value="3">Year 3</SelectItem>
                    <SelectItem value="4">Year 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selection Summary */}
        {students.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div>
                <p className="text-sm text-muted-foreground">Selected</p>
                <p className="text-2xl font-bold text-primary">{selectedStudentIds.size}</p>
              </div>
            </div>
            <Button 
              onClick={handleProceedToDetain}
              disabled={selectedStudentIds.size === 0 || loading}
              size="lg"
            >
              Proceed to Detain ({selectedStudentIds.size})
            </Button>
          </div>
        )}

        {/* Students List */}
        {selectedDepartment && selectedYear && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Students List</span>
                {students.length > 0 && (
                  <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                    {selectedStudentIds.size === students.length ? 'Deselect All' : 'Select All'}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-4 text-muted-foreground">Loading students...</p>
                </div>
              ) : students.length === 0 ? (
                <div className="p-12 text-center">
                  <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No students found</h3>
                  <p className="text-sm text-muted-foreground">
                    {!selectedDepartment || !selectedYear
                      ? 'Please select both department and year to see students'
                      : 'No non-detained students found for the selected filters'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <button 
                            onClick={toggleSelectAll}
                            className="flex items-center hover:text-primary transition-colors"
                          >
                            {selectedStudentIds.size === students.length ? (
                              <CheckSquare className="h-5 w-5 text-primary" />
                            ) : (
                              <Square className="h-5 w-5" />
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Roll No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Section</th>
                      </tr>
                    </thead>
                    <tbody className="bg-background divide-y divide-border">
                      {students.map(student => (
                        <tr 
                          key={student._id} 
                          className={`hover:bg-muted/50 transition-colors cursor-pointer ${
                            selectedStudentIds.has(student._id) ? 'bg-primary/5' : ''
                          }`}
                          onClick={() => toggleSelect(student._id)}
                        >
                          <td className="px-6 py-4">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelect(student._id);
                              }}
                              className="hover:scale-110 transition-transform"
                            >
                              {selectedStudentIds.has(student._id) ? (
                                <CheckSquare className="h-5 w-5 text-primary" />
                              ) : (
                                <Square className="h-5 w-5 text-muted-foreground" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 font-medium whitespace-nowrap">{student.rollNo}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{student.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{student.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {student.section ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Section {student.section}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
          </>
        )}

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-3 border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0">
                  <UserX className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-xl">
                    Confirm Bulk Detention
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    You are about to detain {selectedStudentIds.size} student(s). Please provide detention details.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Selected Students List */}
              <div className="space-y-2">
                <Label>Selected Students ({selectedStudents.length})</Label>
                <div className="max-h-[200px] overflow-y-auto border rounded-lg p-4 bg-muted/20">
                  <div className="space-y-2">
                    {selectedStudents.map((student, index) => (
                      <div key={student._id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div>
                          <span className="font-medium">{index + 1}. {student.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">({student.rollNo})</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {student.section ? `Section ${student.section}` : 'No section'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reason Type */}
              <div className="space-y-2">
                <Label htmlFor="reasonType">Reason Type *</Label>
                <Select 
                  value={detainForm.reasonType} 
                  onValueChange={(val) => setDetainForm({ ...detainForm, reasonType: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low_attendance">Low Attendance</SelectItem>
                    <SelectItem value="low_credit">Low Credit Score</SelectItem>
                    <SelectItem value="disciplinary">Disciplinary</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">Detailed Reason *</Label>
                <Textarea
                  id="reason"
                  value={detainForm.reason}
                  onChange={(e) => setDetainForm({ ...detainForm, reason: e.target.value })}
                  placeholder="Provide a detailed explanation for why these students are being detained..."
                  className="min-h-[120px]"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This reason will be applied to all selected students
                </p>
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={detainForm.notes}
                  onChange={(e) => setDetainForm({ ...detainForm, notes: e.target.value })}
                  placeholder="Any additional information or context..."
                  className="min-h-[80px]"
                />
              </div>

              {/* Detain Date */}
              <div className="space-y-2">
                <Label htmlFor="detainDate">Detention Date *</Label>
                <MiniCalendar
                  value={detainForm.date ? new Date(detainForm.date) : new Date()}
                  onChange={(date) => setDetainForm({ ...detainForm, date: date.toISOString().split('T')[0] })}
                  placeholder="Select detention date"
                  maxDate={new Date()}
                />
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-900">Warning</p>
                  <p className="text-yellow-700 mt-1">
                    This action will mark {selectedStudentIds.size} student(s) as detained. They will be excluded from promotions and may have restricted access.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowConfirmDialog(false);
                  setDetainForm({
                    reasonType: 'custom',
                    reason: '',
                    notes: '',
                    date: new Date().toISOString().split('T')[0],
                  });
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleBulkDetain} 
                disabled={loading || !detainForm.reason.trim()}
                variant="destructive"
              >
                {loading ? 'Processing...' : `Detain ${selectedStudentIds.size} Student(s)`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Detained Students */}
        {viewMode === 'detained' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Detained Students ({filteredDetainedStudents.length})</CardTitle>
                <Input
                  placeholder="Search by name or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-4 text-muted-foreground">Loading detained students...</p>
                </div>
              ) : filteredDetainedStudents.length === 0 ? (
                <div className="p-12 text-center">
                  <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No detained students found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'No students match your search criteria' : 'No students are currently detained'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Roll No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Year</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Section</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Detained Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-background divide-y divide-border">
                      {filteredDetainedStudents.map(student => (
                        <tr key={student._id} className="hover:bg-muted/50 transition-colors bg-red-50">
                          <td className="px-6 py-4 font-medium whitespace-nowrap text-red-600">
                            {student.rollNo}
                            <span className="ml-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded">DETAINED</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-red-600 font-semibold">{student.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {typeof student.department === 'string' ? 'N/A' : student.department?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">Year {student.yearOfStudy}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {student.section ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Section {student.section}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="max-w-xs">
                              <p className="font-medium text-red-700">{(student as any).detainReasonType?.replace('_', ' ').toUpperCase() || 'N/A'}</p>
                              <p className="text-muted-foreground text-xs truncate" title={(student as any).detainReason}>
                                {(student as any).detainReason || 'No reason provided'}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {(student as any).detainDate ? new Date((student as any).detainDate).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BulkDetain;
