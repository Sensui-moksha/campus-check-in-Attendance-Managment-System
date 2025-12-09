import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Trash2, Plus } from 'lucide-react';

interface Section {
  _id: string;
  name: string;
  yearOfStudy?: number;
  capacity?: number;
}

interface StudentCount {
  [key: string]: number; // key format: "year-section" e.g., "1-A", "2-A"
}

export default function ManageSections() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [studentCounts, setStudentCounts] = useState<StudentCount>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    yearOfStudy: '1',
    capacity: '90',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deptId = typeof user?.department === 'string'
    ? user.department
    : user?.department?._id || user?.departmentId;

  const deptName = typeof user?.department === 'object'
    ? user?.department?.name
    : 'Your Department';

  useEffect(() => {
    loadSections();
  }, [deptId]);

  const loadSections = async () => {
    if (!deptId) return;
    try {
      setIsLoading(true);
      const res = await api.departments.getSections(deptId);
      setSections((res.data.sections || []) as Section[]);
      
      // Load student counts for each section
      const counts: StudentCount = {};
      for (const section of (res.data.sections || []) as Section[]) {
        try {
          const studentsRes = await api.departments.getStudents(deptId, {
            section: section.name,
            year: section.yearOfStudy
          });
          const key = `${section.yearOfStudy}-${section.name}`;
          counts[key] = studentsRes.data.pagination?.total || 0;
        } catch (err) {
          const key = `${section.yearOfStudy}-${section.name}`;
          counts[key] = 0;
        }
      }
      setStudentCounts(counts);
    } catch (error) {
      console.error('Failed to load sections:', error);
      toast.error('Failed to load sections');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSection = async () => {
    if (!formData.name.trim()) {
      toast.error('Section name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.departments.createSection(deptId, {
        name: formData.name.trim().toUpperCase(),
        yearOfStudy: Number(formData.yearOfStudy),
        capacity: Number(formData.capacity),
      });

      toast.success('Section created successfully');
      setFormData({ name: '', yearOfStudy: '1', capacity: '90' });
      setShowDialog(false);
      loadSections();
    } catch (error: any) {
      console.error('Failed to create section:', error);
      const errorMsg = error.response?.data?.error || error.message;
      if (errorMsg.includes('duplicate') || errorMsg.includes('E11000')) {
        toast.error(`Section "${formData.name.toUpperCase()}" already exists for Year ${formData.yearOfStudy}`);
      } else {
        toast.error(errorMsg || 'Failed to create section');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    const confirmed = window.confirm('Delete this section? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await api.departments.deleteSection(deptId, sectionId);
      toast.success('Section deleted successfully');
      loadSections();
    } catch (error: any) {
      console.error('Failed to delete section:', error);
      toast.error(error.response?.data?.error || 'Failed to delete section');
    }
  };

  // Group sections by year
  const sectionsByYear: { [key: number]: Section[] } = {};
  sections.forEach(section => {
    const year = section.yearOfStudy || 0;
    if (!sectionsByYear[year]) {
      sectionsByYear[year] = [];
    }
    sectionsByYear[year].push(section);
  });

  // Always show all years (1-4), even if they have no sections
  const allYears = [1, 2, 3, 4];
  const filteredYears = selectedYear === 'all' 
    ? allYears
    : [Number(selectedYear)];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{deptName} — Sections</h1>
            <p className="text-muted-foreground">Create and manage sections for your department</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              Back
            </Button>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Section
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] flex flex-col animate-scale-in">
                <DialogHeader className="border-b pb-4 flex-shrink-0">
                  <DialogTitle className="flex items-center gap-3 text-2xl">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Plus className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-semibold">Create New Section</span>
                  </DialogTitle>
                  <DialogDescription className="text-base mt-2">
                    Add a new section for {deptName}. You can create sections for any year (1-4).
                  </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto pr-2 pt-4">
                  <div className="p-4 border-2 border-primary/30 rounded-lg bg-primary/5 space-y-4 animate-fade-in-up">
                    <h3 className="text-base font-semibold text-primary flex items-center gap-2">
                      <div className="w-1 h-4 bg-primary rounded-full"></div>
                      Section Details
                    </h3>
                    
                    <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                      <Label htmlFor="section-name" className="text-sm font-medium">
                        Section Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="section-name"
                        placeholder="e.g., A, B, C"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value.toUpperCase() })
                        }
                        className="h-11"
                        maxLength={2}
                      />
                      <p className="text-xs text-muted-foreground">Enter a single letter (A, B, C, etc.)</p>
                    </div>

                    <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                      <Label htmlFor="year-select" className="text-sm font-medium">
                        Year of Study <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.yearOfStudy}
                        onValueChange={(value) =>
                          setFormData({ ...formData, yearOfStudy: value })
                        }
                      >
                        <SelectTrigger id="year-select" className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Year 1</SelectItem>
                          <SelectItem value="2">Year 2</SelectItem>
                          <SelectItem value="3">Year 3</SelectItem>
                          <SelectItem value="4">Year 4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                      <Label htmlFor="capacity" className="text-sm font-medium">
                        Capacity
                      </Label>
                      <Input
                        id="capacity"
                        type="number"
                        placeholder="e.g., 90"
                        value={formData.capacity}
                        onChange={(e) =>
                          setFormData({ ...formData, capacity: e.target.value })
                        }
                        className="h-11"
                        min="1"
                        max="200"
                      />
                      <p className="text-xs text-muted-foreground">Maximum number of students (optional)</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t mt-6 flex-shrink-0 bg-background">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDialog(false)}
                    disabled={isSubmitting}
                    className="h-11 px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateSection}
                    disabled={isSubmitting}
                    className="h-11 px-8 bg-primary hover:bg-primary/90 shadow-lg"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Section'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Year Filter */}
        <Card>
          <CardContent className="pt-6">
            <div>
              <label className="block text-sm font-medium mb-2">Filter by Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">All Years</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Sections by Year */}
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading sections...</p>
            </CardContent>
          </Card>
        ) : (
          filteredYears.map((year) => (
            <div key={year} className="space-y-4">
              <h2 className="text-xl font-semibold">
                Year {year}
              </h2>
              {(sectionsByYear[year] || []).length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground mb-2">No sections created for Year {year}</p>
                    <p className="text-sm text-muted-foreground">Click "Add Section" above to create one</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(sectionsByYear[year] || []).map((section) => (
                    <Card 
                      key={section._id}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                    >
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-2xl font-bold">Section {section.name}</h3>
                          </div>
                          <div>
                            <p className="text-3xl font-bold text-foreground">
                              {studentCounts[`${section.yearOfStudy}-${section.name}`] || 0}
                            </p>
                            <p className="text-sm text-muted-foreground">Students enrolled</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              className="flex-1"
                              onClick={() => navigate(`/admin/department/${deptId}/year/${section.yearOfStudy}/section/${section.name}`)}
                            >
                              View Details
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSection(section._id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
