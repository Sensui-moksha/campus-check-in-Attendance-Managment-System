import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Plus, Edit, Trash2, Clock } from 'lucide-react';
import { api } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { MiniCalendar } from '@/components/ui/mini-calendar';

interface Semester {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  academicYear: string;
  isActive: boolean;
  department?: any;
  year?: number;
}

export default function ManageSemesters() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    academicYear: '',
  });

  useEffect(() => {
    loadSemesters();
  }, []);

  const loadSemesters = async () => {
    try {
      setIsLoading(true);
      const response = await api.semesters.list();
      setSemesters((response.data?.semesters || []) as Semester[]);
    } catch (error) {
      console.error('Failed to load semesters:', error);
      toast({
        description: 'Failed to load semesters',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSemester) {
        await api.semesters.update(editingSemester._id, formData);
        toast({ description: 'Semester updated successfully' });
      } else {
        await api.semesters.create(formData);
        toast({ description: 'Semester created successfully' });
      }
      
      setShowDialog(false);
      resetForm();
      loadSemesters();
    } catch (error: any) {
      console.error('Failed to save semester:', error);
      toast({
        description: error.response?.data?.error || 'Failed to save semester',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (semester: Semester) => {
    setEditingSemester(semester);
    setFormData({
      name: semester.name,
      startDate: semester.startDate.split('T')[0],
      endDate: semester.endDate.split('T')[0],
      academicYear: semester.academicYear,
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this semester?')) return;
    
    try {
      await api.semesters.delete(id);
      toast({ description: 'Semester deleted successfully' });
      loadSemesters();
    } catch (error: any) {
      console.error('Failed to delete semester:', error);
      toast({
        description: error.response?.data?.error || 'Failed to delete semester',
        variant: 'destructive',
      });
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await api.semesters.update(id, { isActive: true });
      toast({ description: 'Active semester updated' });
      loadSemesters();
    } catch (error: any) {
      toast({
        description: error.response?.data?.error || 'Failed to set active semester',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      startDate: '',
      endDate: '',
      academicYear: '',
    });
    setEditingSemester(null);
  };

  const handleOpenDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manage Semesters</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage academic semesters with start and end dates
            </p>
          </div>
          <Button onClick={handleOpenDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Semester
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Semesters</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading semesters...</div>
            ) : semesters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No semesters found. Create your first semester.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {semesters.map((semester) => (
                    <TableRow key={semester._id}>
                      <TableCell className="font-medium">
                        {semester.name}
                      </TableCell>
                      <TableCell>{semester.academicYear}</TableCell>
                      <TableCell>
                        {new Date(semester.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(semester.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {semester.isActive ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Active
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetActive(semester._id)}
                          >
                            Set Active
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(semester)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(semester._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSemester ? 'Edit Semester' : 'Create New Semester'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Semester Name</Label>
                  <Select
                    value={formData.name}
                    onValueChange={(value) =>
                      setFormData({ ...formData, name: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Semester 1">Semester 1</SelectItem>
                      <SelectItem value="Semester 2">Semester 2</SelectItem>
                      <SelectItem value="Semester 3">Semester 3</SelectItem>
                      <SelectItem value="Semester 4">Semester 4</SelectItem>
                      <SelectItem value="Semester 5">Semester 5</SelectItem>
                      <SelectItem value="Semester 6">Semester 6</SelectItem>
                      <SelectItem value="Semester 7">Semester 7</SelectItem>
                      <SelectItem value="Semester 8">Semester 8</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Input
                    id="academicYear"
                    placeholder="e.g., 2025-26"
                    value={formData.academicYear}
                    onChange={(e) =>
                      setFormData({ ...formData, academicYear: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <MiniCalendar
                    value={formData.startDate ? new Date(formData.startDate) : undefined}
                    onChange={(date) =>
                      setFormData({ ...formData, startDate: date.toISOString().split('T')[0] })
                    }
                    placeholder="Select start date"
                    maxDate={formData.endDate ? new Date(formData.endDate) : undefined}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <MiniCalendar
                    value={formData.endDate ? new Date(formData.endDate) : undefined}
                    onChange={(date) =>
                      setFormData({ ...formData, endDate: date.toISOString().split('T')[0] })
                    }
                    placeholder="Select end date"
                    minDate={formData.startDate ? new Date(formData.startDate) : undefined}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDialog(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSemester ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
