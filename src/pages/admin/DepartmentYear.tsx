import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/api';

interface Student {
  _id: string;
  name: string;
  rollNo?: string;
  email?: string;
}

interface SectionData {
  name: string;
  students: Student[];
  subject?: string;
}

export default function DepartmentYear() {
  const { deptId, year } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [deptName, setDeptName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [sections, setSections] = useState<Record<string, Student[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [page] = useState(1);
  const [limit] = useState(5000); // large enough to cover all students for accurate counts
  const [totalStudents, setTotalStudents] = useState(0);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [createdSections, setCreatedSections] = useState<string[]>([]);

  // Function to refresh sections data silently
  const refreshSectionsData = useCallback(async () => {
    if (!deptId || !year) return;
    try {
      const [studentsRes, sectionsRes] = await Promise.all([
        api.departments.getStudents(deptId, { year: Number(year), page, limit }),
        api.departments.getDistinctSections(deptId, { year: Number(year) }),
      ]);

      const allStudents = studentsRes.data.students || [];
      setTotalStudents(studentsRes.data.pagination?.total || allStudents.length);
      const allSections = sectionsRes.data?.sections || [];
      
      setCreatedSections(allSections.map((s: any) => s.name || s));

      // Update sections with students
      const grouped: Record<string, any[]> = {};
      allStudents.forEach((s: any) => {
        const key = s.section || 'Unassigned';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(s);
      });
      
      allSections.forEach((sec: any) => {
        const secName = sec.name || sec;
        if (!grouped[secName]) {
          grouped[secName] = [];
        }
      });
      
      setSections(grouped);
    } catch (err) {
      console.error('Silent refresh failed:', err);
    }
  }, [deptId, year, page, limit]);

  // Auto-refresh every 3 seconds silently (no page reload)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSectionsData();
    }, 3000);

    return () => clearInterval(interval);
  }, [refreshSectionsData]);

  useEffect(() => {
    const load = async () => {
      if (!deptId || !year) return;
      try {
        setIsLoading(true);
        const [deptRes, studentsRes, sectionsRes] = await Promise.all([
          api.departments.get(deptId),
          api.departments.getStudents(deptId, { year: Number(year), page, limit }),
          api.departments.getDistinctSections(deptId, { year: Number(year) }),
        ]);

        setDeptName(deptRes.data.department?.name || 'Department');
        const allStudents = studentsRes.data.students || [];
        setStudents(allStudents);
        setTotalStudents(studentsRes.data.pagination?.total || allStudents.length);

        // Get all sections from database (including empty ones)
        const allSections = sectionsRes.data?.sections || [];
        setCreatedSections(allSections.map((s: any) => s.name || s));

        // Group students by section
        const grouped: Record<string, any[]> = {};
        allStudents.forEach((s: any) => {
          const key = s.section || 'Unassigned';
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(s);
        });
        
        // Add sections from database that don't have students yet
        allSections.forEach((sec: any) => {
          const secName = sec.name || sec;
          if (!grouped[secName]) {
            grouped[secName] = [];
          }
        });
        
        setSections(grouped);
      } catch (err) {
        console.error('Failed to load department year data', err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [deptId, year, page, limit]);

  const filteredSections = Object.fromEntries(
    Object.entries(sections).filter(([sec]) =>
      sec.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{deptName} — Year {year}</h1>
            <p className="text-muted-foreground">Students & management for the selected year</p>
          </div>
          <div>
            <Button variant="ghost" onClick={() => navigate(-1)}>Back</Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{isLoading ? 'Loading...' : (totalStudents || 0)}</p>
              <p className="text-xs text-muted-foreground mt-2">Students enrolled in Year {year}</p>
            </CardContent>
          </Card>

          <div className="col-span-1 sm:col-span-2 lg:col-span-2">
            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Sections</CardTitle>
                <Button size="sm" onClick={() => setShowAddSection(!showAddSection)}>
                  {showAddSection ? 'Cancel' : 'Add Section'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {showAddSection && (
                  <div className="flex gap-2 p-4 bg-muted rounded-lg">
                    <Input
                      placeholder="Section name (e.g., A, B, C)"
                      value={newSectionName}
                      onChange={e => setNewSectionName(e.target.value.toUpperCase())}
                      className="max-w-xs"
                    />
                    <Button 
                      onClick={async () => {
                        if (!newSectionName.trim()) return;
                        try {
                          // Save section to database
                          await api.departments.createSection(deptId, {
                            name: newSectionName,
                            yearOfStudy: Number(year)
                          });
                          
                          setNewSectionName('');
                          setShowAddSection(false);
                          
                          // Silently refresh data to show new section (no page reload)
                          refreshSectionsData();
                        } catch (err: any) {
                          // 409 means section already exists - that's ok, just refresh
                          if (err.response?.status === 409) {
                            setNewSectionName('');
                            setShowAddSection(false);
                            refreshSectionsData();
                          } else {
                            console.error('Failed to create section:', err);
                          }
                        }
                      }}
                    >
                      Create
                    </Button>
                  </div>
                )}
                <Input
                  placeholder="Search sections..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {isLoading ? (
                  <p>Loading sections...</p>
                ) : Object.keys(filteredSections).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sections found for this year.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(filteredSections).map(([sec, list]) => (
                      <Card 
                        key={sec} 
                        className="border-border hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/admin/department/${deptId}/year/${year}/section/${encodeURIComponent(sec)}`)}
                      >
                        <CardHeader>
                          <CardTitle className="text-sm">Section {sec}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <div className="text-2xl font-semibold">{list.length}</div>
                            <p className="text-xs text-muted-foreground">Students</p>
                          </div>

                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/department/${deptId}/year/${year}/section/${encodeURIComponent(sec)}`);
                            }}
                          >
                            View Details
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
