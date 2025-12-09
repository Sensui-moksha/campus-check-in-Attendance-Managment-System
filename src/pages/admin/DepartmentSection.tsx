import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/api';

// Fixed: Using standard HTML input instead of shadcn Input component
export default function DepartmentSection() {
  const { deptId, year, section } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [deptName, setDeptName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [sectionId, setSectionId] = useState<string>('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);

  const loadSectionData = useCallback(async () => {
    if (!deptId || !year || !section) return;
    try {
      setIsLoading(true);
      const [deptRes, studentsRes, sectionsRes] = await Promise.all([
        api.departments.get(deptId),
        api.departments.getStudents(deptId, { year: Number(year), section, page, limit }),
        api.departments.getSections(deptId, { year: Number(year) }),
      ]);

      setDeptName(deptRes.data.department?.name || 'Department');
      setStudents(studentsRes.data.students || []);
      setTotal(studentsRes.data.pagination?.total || 0);

      const sectionsList = sectionsRes.data.sections || [];
      const foundSection = sectionsList.find(
        (s: any) => s.name === section && s.yearOfStudy === Number(year)
      );
      if (foundSection) {
        setSectionId(foundSection._id);
      }
    } catch (err) {
      console.error('Failed to load section students', err);
    } finally {
      setIsLoading(false);
    }
  }, [deptId, year, section, page, limit]);

  useEffect(() => {
    loadSectionData();
  }, [loadSectionData]);

  // Load subjects assigned to this section
  useEffect(() => {
    const loadSubjects = async () => {
      if (!sectionId || !year) return;
      try {
        console.log('🔍 Loading subjects for sectionId:', sectionId, 'year:', year, 'type:', typeof sectionId);
        
        // Get all subjects for this year
        const res = await api.subjects.list({ yearOfStudy: Number(year), departmentId: deptId });
        const allSubjects = res.data.subjects || [];
        
        console.log('📚 All subjects for year', year, ':', allSubjects.length, 'subjects');
        
        // Debug: show raw data
        allSubjects.forEach((s: any, idx: number) => {
          console.log(`Subject ${idx}: ${s.name}, assignments count: ${s.sectionAssignments?.length || 0}`);
          s.sectionAssignments?.forEach((a: any, aidx: number) => {
            console.log(`  - Assignment ${aidx}:`, {
              sectionId: a.section?._id || a.section,
              sectionIdType: typeof (a.section?._id || a.section),
              sectionName: a.section?.name
            });
          });
        });
        
        // Filter subjects that have this section assigned
        const assignedSubjects = allSubjects.filter((subject: any) => {
          const hasSection = subject.sectionAssignments?.some(
            (assignment: any) => {
              const assignmentSectionId = (assignment.section?._id || assignment.section || '').toString();
              const match = assignmentSectionId === sectionId;
              return match;
            }
          );
          return hasSection;
        });
        
        console.log('✅ Assigned subjects found:', assignedSubjects.length);
        setSubjects(assignedSubjects);
      } catch (err) {
        console.error('Failed to load subjects', err);
      }
    };
    loadSubjects();
  }, [sectionId, year]);

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.rollNo && s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{deptName} — Year {year} — Section {section}</h1>
            <p className="text-muted-foreground">Students in this section</p>
          </div>
          <div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadSectionData} disabled={isLoading}>
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button variant="ghost" onClick={() => navigate(-1)}>Back</Button>
            </div>
          </div>
        </div>

        {/* Subjects Section */}
        <Card>
          <CardHeader>
            <CardTitle>Subjects for Section {section}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* List of Subjects */}
            {subjects.length > 0 ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Available Subjects:</label>
                <div className="grid grid-cols-1 gap-3">
                  {subjects.map(subject => {
                    // Find the assignment for this section
                    const assignment = subject.sectionAssignments?.find(
                      (a: any) => a.section._id === sectionId
                    );
                    const teacher = assignment?.teacher;
                    
                    return (
                      <div 
                        key={subject._id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedSubject?._id === subject._id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary'
                        }`}
                        onClick={() => setSelectedSubject(subject)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-base">{subject.name}</div>
                            <div className="text-sm text-muted-foreground space-x-2 mt-1">
                              <span>Code: {subject.code}</span>
                              <span>•</span>
                              <span>{subject.numberOfClasses} Classes</span>
                            </div>
                            {teacher && (
                              <div className="text-sm text-primary mt-1">
                                Teacher: {teacher.name}
                              </div>
                            )}
                            {!teacher && (
                              <div className="text-sm text-muted-foreground italic mt-1">
                                No teacher assigned
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-2">No subjects assigned to this section yet</p>
                <p className="text-xs text-muted-foreground">
                  Go to Manage Subjects to assign subjects to Year {year}, Section {section}
                </p>
              </div>
            )}

            {/* Take Attendance Button */}
            {selectedSubject && (
              <Button 
                className="w-full"
                onClick={() => navigate(`/admin/mark-attendance?deptId=${deptId}&year=${year}&section=${section}&subject=${encodeURIComponent(selectedSubject.name)}&subjectCode=${encodeURIComponent(selectedSubject.code)}&semester=${selectedSubject.semester || ''}`)}
              >
                Take Attendance for {selectedSubject.name}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Students Section */}
        <Card>
          <CardHeader>
            <CardTitle>Students ({isLoading ? '...' : filteredStudents.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="text"
              placeholder="Search by name, roll no, or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {isLoading ? (
              <p>Loading students...</p>
            ) : filteredStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No students found for this section.</p>
            ) : (
              <div className="space-y-2">
                {filteredStudents.map(s => (
                  <div key={s._id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.rollNo || s.email || '—'}</div>
                    </div>
                    <div>
                      <Button size="sm" onClick={() => navigate(`/student/profile/${s._id}`)}>View</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {total > limit && (
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-xs text-muted-foreground">Page {page} of {Math.ceil(total / limit)}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= Math.ceil(total / limit)}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
