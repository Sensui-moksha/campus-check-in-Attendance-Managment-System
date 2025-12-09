import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/api';
import { useAuth } from '@/contexts/AuthContext';

interface Subject {
  _id: string;
  code: string;
  name: string;
  yearOfStudy: number;
  semester: number;
  numberOfClasses: number;
  department?: string | { _id: string; name?: string; code?: string };
  sectionAssignments?: {
    section: {
      _id: string;
      name: string;
    };
    teacher?: {
      _id: string;
      name: string;
      email: string;
    };
  }[];
}

interface Department {
  _id: string;
  name: string;
  code?: string;
}

interface Section {
  _id: string;
  name: string;
  department: string;
  departmentId?: string;
  yearOfStudy: number;
}

interface Teacher {
  _id: string;
  name: string;
  email: string;
}

export default function ManageSubjects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isHod = user?.role === 'hod';
  const hodDeptId = typeof user?.department === 'string'
    ? user.department
    : (user?.department as any)?._id || (user as any)?.departmentId;
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [assignFormData, setAssignFormData] = useState({
    sectionId: '',
    teacherIds: [] as string[],
  });
  const [editMode, setEditMode] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    yearOfStudy: 1,
    semester: 1,
    numberOfClasses: 40,
    departmentId: '',
  });

  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Set default department selections when data is ready
  useEffect(() => {
    if (!departments.length) return;

    const defaultDeptId = isHod && hodDeptId
      ? hodDeptId
      : departments[0]?._id;

    if (!selectedDepartment || selectedDepartment === 'all') {
      setSelectedDepartment(defaultDeptId);
    }

    if (!formData.departmentId) {
      setFormData(prev => ({ ...prev, departmentId: defaultDeptId }));
    }
  }, [departments, isHod, hodDeptId]);

  // Function to refresh subjects list
  const refreshSubjects = async () => {
    try {
      const filters: any = {};
      if (isHod && hodDeptId) filters.departmentId = hodDeptId;
      if (!isHod && selectedDepartment !== 'all') filters.departmentId = selectedDepartment;

      const res = await api.subjects.list(filters);
      setSubjects(res.data.subjects || []);
      console.log('🔄 Subjects refreshed:', res.data.subjects?.length || 0);
    } catch (err: any) {
      console.error('❌ Failed to refresh subjects:', err);
    }
  };

  // Function to load teachers and sections (can be called to refresh)
  const loadTeachersAndSections = async () => {
    try {
      // First get all departments, then fetch sections for each
      if (isHod && hodDeptId) {
        const deptRes = await api.departments.get(hodDeptId);
        const dept = deptRes.data.department || deptRes.data;
        setDepartments(dept ? [dept] : []);
        setSelectedDepartment(hodDeptId);
      } else {
        const deptsRes = await api.departments.list();
        const departments = deptsRes.data.departments || [];
        setDepartments(departments);
      }
      
      const targetDepartments = isHod && hodDeptId ? departments.filter((d: any) => d._id === hodDeptId) : departments;

      // Fetch sections from selected departments
      const sectionPromises = targetDepartments.map((dept: any) => 
        api.departments.getSections(dept._id).catch(() => ({ data: { sections: [] } }))
      );
      
      const [sectionsResults, teachersRes, hodsRes] = await Promise.all([
        Promise.all(sectionPromises),
        api.users.list('teacher', 1, 1000),
        api.users.list('hod', 1, 1000),
      ]);
      
      // Combine all sections from all departments
      const allSections: Section[] = [];
      sectionsResults.forEach((result: any, index: number) => {
        const dept = targetDepartments[index];
        const deptId = dept?._id || dept?.id;
        (result.data.sections || []).forEach((section: any) => {
          allSections.push({
            _id: section._id,
            name: section.name,
            department: dept.name,
            departmentId: deptId,
            yearOfStudy: section.yearOfStudy,
          });
        });
      });
      
      // Combine teachers and HODs - handle both response formats
      const allTeachingStaff = [
        ...(teachersRes.data.teachers || teachersRes.data.users || []),
        ...(hodsRes.data.users || [])
      ];
      
      console.log('🔄 Refreshed sections:', allSections?.length || 0);
      console.log('🔍 Sections details:', allSections);
      console.log('🔄 Refreshed teachers:', teachersRes.data?.teachers?.length || teachersRes.data?.users?.length || 0);
      console.log('🔄 Refreshed HODs:', hodsRes.data?.users?.length || 0);
      console.log('🔍 Teachers data:', teachersRes.data);
      console.log('🔍 Combined teaching staff:', allTeachingStaff);
      
      setSections(allSections || []);
      setTeachers(allTeachingStaff);
    } catch (err: any) {
      console.error('❌ Failed to refresh teachers/sections:', err);
    }
  };

  // Load subjects, sections, and teachers
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        console.log('🔍 Loading subjects, sections, teachers, and HODs...');
        // Load subjects first
        const subjectFilters: any = {};
        if (isHod && hodDeptId) subjectFilters.departmentId = hodDeptId;
        if (!isHod && selectedDepartment !== 'all') subjectFilters.departmentId = selectedDepartment;
        const subjectsRes = await api.subjects.list(subjectFilters);
        
        // Get all departments, then fetch sections for each
        if (isHod && hodDeptId) {
          const deptRes = await api.departments.get(hodDeptId);
          const dept = deptRes.data.department || deptRes.data;
          setDepartments(dept ? [dept] : []);
          setSelectedDepartment(hodDeptId);
        } else {
          const deptsRes = await api.departments.list();
          const departments = deptsRes.data.departments || [];
          setDepartments(departments);
        }
        
        const targetDepartments = isHod && hodDeptId ? departments.filter((d: any) => d._id === hodDeptId) : departments;

        // Fetch sections from selected departments
        const sectionPromises = targetDepartments.map((dept: any) => 
          api.departments.getSections(dept._id).catch(() => ({ data: { sections: [] } }))
        );
        
        const [sectionsResults, teachersRes, hodsRes] = await Promise.all([
          Promise.all(sectionPromises),
          api.users.list('teacher', 1, 1000),
          api.users.list('hod', 1, 1000),
        ]);
        
        // Combine all sections from all departments
        const allSections: Section[] = [];
        sectionsResults.forEach((result: any, index: number) => {
          const dept = targetDepartments[index];
          const deptId = dept?._id || dept?.id;
          (result.data.sections || []).forEach((section: any) => {
            allSections.push({
              _id: section._id,
              name: section.name,
              department: dept.name,
              departmentId: deptId,
              yearOfStudy: section.yearOfStudy,
            });
          });
        });
        
        console.log('📦 Subjects response:', subjectsRes.data);
        console.log('📚 Subjects loaded:', subjectsRes.data.subjects);
        console.log('👥 Sections loaded:', allSections?.length || 0);
        console.log('🔍 Sections details:', allSections);
        console.log('👨‍🏫 Teachers response:', teachersRes.data);
        console.log('👔 HODs response:', hodsRes.data);
        
        // Combine teachers and HODs - handle both response formats
        const allTeachingStaff = [
          ...(teachersRes.data.teachers || teachersRes.data.users || []),
          ...(hodsRes.data.users || [])
        ];
        
        console.log('✅ Combined teaching staff:', allTeachingStaff);
        
        setSubjects(subjectsRes.data.subjects || []);
        setSections(allSections || []);
        setTeachers(allTeachingStaff);
      } catch (err: any) {
        console.error('❌ Failed to load data:', err);
        console.error('Error details:', err.response?.data || err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter subjects by year and semester
  const filteredSubjects = subjects.filter(s => {
    const subjectDeptId = typeof s.department === 'string'
      ? s.department
      : (s as any)?.department?._id;
    const matchesYear = selectedYear === 'all' || s.yearOfStudy === Number(selectedYear);
    const matchesSemester = selectedSemester === 'all' || s.semester === Number(selectedSemester);
    const matchesDepartment = selectedDepartment === 'all' || subjectDeptId === selectedDepartment;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesYear && matchesSemester && matchesDepartment && matchesSearch;
  });

  // Get heading text based on filters
  const getHeadingText = () => {
    const deptLabel = selectedDepartment === 'all'
      ? 'All Departments'
      : departments.find(d => d._id === selectedDepartment)?.name || 'Department';

    if (selectedYear === 'all' && selectedSemester === 'all') {
      return `${deptLabel} · All Years & Semesters`;
    } else if (selectedYear === 'all') {
      return `${deptLabel} · All Years - Semester ${selectedSemester}`;
    } else if (selectedSemester === 'all') {
      return `${deptLabel} · Year ${selectedYear} - All Semesters`;
    } else {
      return `${deptLabel} · Year ${selectedYear}, Semester ${selectedSemester}`;
    }
  };

  const handleAssignTeacher = async () => {
    try {
      if (!selectedSubject || !assignFormData.sectionId) {
        alert('Please select a section');
        return;
      }

      if (assignFormData.teacherIds.length === 0) {
        alert('Please select at least one teacher');
        return;
      }

      console.log('📝 Assigning teachers:', {
        subject: selectedSubject._id,
        section: assignFormData.sectionId,
        teachers: assignFormData.teacherIds
      });

      // Assign each selected teacher to the section
      for (const teacherId of assignFormData.teacherIds) {
        console.log(`Assigning ${teacherId} to section ${assignFormData.sectionId}`);
        const result = await api.subjects.assignTeacher(selectedSubject._id, {
          sectionId: assignFormData.sectionId,
          teacherId: teacherId,
        });
        console.log('✅ Assignment result:', result.data);
      }

      // Reload subjects to get updated data
      await refreshSubjects();

      alert('Teachers assigned successfully!');

      // Close modal but keep teacher selections for next assignment
      setAssignModalOpen(false);
      setSelectedSubject(null);
      // Only reset section, keep teacher selections
      setAssignFormData({ sectionId: '', teacherIds: assignFormData.teacherIds });
    } catch (err: any) {
      console.error('❌ Failed to assign teacher:', err);
      console.error('Error details:', err.response?.data);
      alert(err.response?.data?.error || 'Failed to assign teacher');
    }
  };

  const toggleTeacherSelection = (teacherId: string) => {
    setAssignFormData(prev => ({
      ...prev,
      teacherIds: prev.teacherIds.includes(teacherId)
        ? prev.teacherIds.filter(id => id !== teacherId)
        : [...prev.teacherIds, teacherId]
    }));
  };

  const handleDeleteSubject = async (subjectId: string) => {
    const confirmed = window.confirm('Delete this subject? This cannot be undone.');
    if (!confirmed) return;

    try {
      await api.subjects.delete(subjectId);
      // Refresh list after delete
      await refreshSubjects();
    } catch (err: any) {
      console.error('❌ Failed to delete subject:', err);
      alert(err.response?.data?.error || 'Failed to delete subject');
    }
  };

  const handleEditSubject = (subject: Subject) => {
    setEditMode(true);
    setEditingSubjectId(subject._id);
    setFormData({
      code: subject.code,
      name: subject.name,
      yearOfStudy: subject.yearOfStudy,
      semester: subject.semester,
      numberOfClasses: subject.numberOfClasses,
      departmentId: typeof subject.department === 'string'
        ? subject.department
        : (subject.department?._id || ''),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.code.trim() || !formData.name.trim()) {
      setFormError('Subject code and name are required');
      return;
    }

    if (!formData.departmentId) {
      setFormError('Please select a department');
      return;
    }

    try {
      setFormLoading(true);
      
      if (editMode && editingSubjectId) {
        // Update existing subject
        console.log('📝 Updating subject:', editingSubjectId, formData);
        await api.subjects.update(editingSubjectId, {
          code: formData.code,
          name: formData.name,
          yearOfStudy: formData.yearOfStudy,
          semester: formData.semester,
          numberOfClasses: formData.numberOfClasses,
          department: formData.departmentId,
        });
        console.log('✅ Subject updated successfully');
      } else {
        // Create new subject
        // Get all sections matching department + year
        const matchingSections = sections.filter(s => 
          s.yearOfStudy === formData.yearOfStudy && s.departmentId === formData.departmentId
        );

        // Create section assignments array
        const sectionAssignments = matchingSections.map(section => ({
          section: section._id,
          teacher: undefined // No teacher assigned initially
        }));

        console.log('📝 Creating subject:', formData);
        console.log('🔄 Total sections available:', sections.length);
        console.log('🔄 Matching sections for year', formData.yearOfStudy, ':', matchingSections.length);
        console.log('📦 Matching section details:', matchingSections.map((s: any) => ({
          id: s._id,
          name: s.name,
          dept: s.department,
          year: s.yearOfStudy
        })));
        console.log('📋 Section assignments to send:', sectionAssignments);
        
        const createRes = await api.subjects.create({
          code: formData.code,
          name: formData.name,
          yearOfStudy: formData.yearOfStudy,
          semester: formData.semester,
          numberOfClasses: formData.numberOfClasses,
          department: formData.departmentId,
          sectionAssignments: sectionAssignments.length > 0 ? sectionAssignments : [],
        });
        console.log('✅ Subject created successfully:', createRes.data);
      }

      // Reload subjects
      console.log('Fetching updated subjects list...');
      await refreshSubjects();

      // Reset form
      setFormData({
        code: '',
        name: '',
        yearOfStudy: 1,
        semester: 1,
        numberOfClasses: 40,
        departmentId: isHod && hodDeptId ? hodDeptId : '',
      });
      setShowForm(false);
      setEditMode(false);
      setEditingSubjectId(null);
    } catch (err: any) {
      console.error('Full error:', err);
      console.error('Error response:', err.response?.data);
      
      setFormError(err.response?.data?.error || err.message || `Failed to ${editMode ? 'update' : 'create'} subject`);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manage Subjects</h1>
            <p className="text-muted-foreground">Create and organize subjects by year and semester</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate(-1)}>Back</Button>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : '+ Add Subject'}
            </Button>
          </div>
        </div>

        {/* Create/Edit Subject Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editMode ? 'Edit Subject' : 'Create New Subject'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Subject Code</label>
                    <input
                      type="text"
                      placeholder="e.g., CS101"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Subject Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Data Structures"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Department</label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      disabled={isHod}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
                    >
                      <option value="">Select department</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name || dept.code || 'Department'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Year of Study</label>
                    <select
                      value={formData.yearOfStudy}
                      onChange={(e) => setFormData({ ...formData, yearOfStudy: Number(e.target.value) })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {[1, 2, 3, 4].map(year => (
                        <option key={year} value={year}>Year {year}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Semester</label>
                    <select
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Classes</label>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={formData.numberOfClasses}
                      onChange={(e) => setFormData({ ...formData, numberOfClasses: Number(e.target.value) })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                </div>

                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    {formError}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditMode(false);
                      setEditingSubjectId(null);
                      setFormData({
                        code: '',
                        name: '',
                        yearOfStudy: 1,
                        semester: 1,
                        numberOfClasses: 40,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={formLoading}>
                    {formLoading ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update Subject' : 'Create Subject')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Filter Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 flex-wrap">
              <div>
                <label className="block text-sm font-medium mb-2">Year of Study</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">All Years</option>
                  {[1, 2, 3, 4].map(year => (
                    <option key={year} value={year}>Year {year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Semester</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name || dept.code || 'Department'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subjects List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Subjects - {getHeadingText()}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({filteredSubjects.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground">Loading subjects...</p>
            ) : filteredSubjects.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No subjects found for {getHeadingText()}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredSubjects.map(subject => (
                  <div
                    key={subject._id}
                    className="border rounded-lg p-4 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold text-lg">{subject.name}</div>
                        <div className="text-sm text-muted-foreground space-x-2">
                          <span>Code: {subject.code}</span>
                          <span>•</span>
                          <span>Year {subject.yearOfStudy}</span>
                          <span>•</span>
                          <span>Semester {subject.semester}</span>
                          <span>•</span>
                          <span>{subject.numberOfClasses} Classes</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            setSelectedSubject(subject);
                            setAssignModalOpen(true);
                            // Refresh teachers and sections when opening modal
                            await loadTeachersAndSections();
                          }}
                        >
                          Assign Teacher
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => navigate(`/admin/detain?reasonType=attendance&subjectCode=${encodeURIComponent(subject.code)}`)}
                        >
                          Detain (Attendance)
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => navigate(`/admin/detain?reasonType=credits&subjectCode=${encodeURIComponent(subject.code)}`)}
                        >
                          Detain (Low Credits)
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditSubject(subject)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteSubject(subject._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    
                    {/* Section Assignments */}
                      {subject.sectionAssignments && subject.sectionAssignments.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-sm font-medium mb-2">Section Assignments:</div>
                          <div className="grid grid-cols-2 gap-2">
                            {(() => {
                              // Group assignments by section, only show each section once
                              const sectionMap = new Map();
                              subject.sectionAssignments.forEach((assignment: any) => {
                                const sectionId = assignment.section._id;
                                const sectionName = assignment.section.name;
                                if (!sectionMap.has(sectionId)) {
                                  sectionMap.set(sectionId, {
                                    name: sectionName,
                                    teachers: []
                                  });
                                }
                                if (assignment.teacher) {
                                  sectionMap.get(sectionId).teachers.push(assignment.teacher.name);
                                }
                              });
                              // Only show each section once
                              return Array.from(sectionMap.values()).map((data, idx) => (
                                <div key={data.name + idx} className="text-sm bg-secondary/50 rounded p-2">
                                  <span className="font-medium">Section {data.name}</span>
                                  {data.teachers.length > 0 ? (
                                    <div className="text-muted-foreground ml-2">
                                      → {data.teachers.join(', ')}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground ml-2 italic">
                                      → Not assigned
                                    </span>
                                  )}
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assign Teacher Modal */}
        {assignModalOpen && selectedSubject && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl mx-auto shadow-2xl border-2 animate-in fade-in-0 zoom-in-95">
              <CardHeader className="border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold">Assign Teacher to {selectedSubject.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select section and teachers for this subject
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6 pt-6">
                {/* Section Selection */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2">
                    <div className="p-2 rounded-md bg-emerald-500/10">
                      <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      Section <span className="text-red-500">*</span>
                    </h3>
                  </div>
                  
                  <select
                    value={assignFormData.sectionId}
                    onChange={(e) => setAssignFormData({ ...assignFormData, sectionId: e.target.value })}
                    className="flex h-11 w-full rounded-lg border-2 border-input bg-background px-4 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:border-primary/50"
                  >
                    <option value="">Select Section</option>
                    {(() => {
                      const filteredSections = sections.filter(s => s.yearOfStudy === selectedSubject.yearOfStudy);
                      console.log('🎯 Filtered sections for year', selectedSubject.yearOfStudy, ':', filteredSections);
                      return filteredSections.map(section => (
                        <option key={section._id} value={section._id}>
                          {section.name} - {section.department}
                        </option>
                      ));
                    })()}
                  </select>
                </div>

                {/* Teachers Selection */}
                <div className="space-y-3 border-t pt-6">
                  <div className="flex items-center gap-2 pb-2">
                    <div className="p-2 rounded-md bg-blue-500/10">
                      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      Teachers (Select Multiple)
                    </h3>
                  </div>
                  
                  <div className="max-h-72 overflow-y-auto border-2 border-border rounded-lg bg-muted/30">
                    {teachers.length === 0 ? (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <p className="text-sm text-muted-foreground mt-3">No teachers available</p>
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {teachers.map(teacher => (
                          <label
                            key={teacher._id}
                            className="flex items-center gap-3 p-3 hover:bg-background rounded-lg cursor-pointer transition-colors group border border-transparent hover:border-primary/20"
                          >
                            <input
                              type="checkbox"
                              checked={assignFormData.teacherIds.includes(teacher._id)}
                              onChange={() => toggleTeacherSelection(teacher._id)}
                              className="w-5 h-5 rounded border-2 border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                {teacher.name}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {teacher.email}
                              </div>
                            </div>
                            {assignFormData.teacherIds.includes(teacher._id) && (
                              <div className="p-1 rounded-full bg-primary/10">
                                <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 px-1">
                    <div className="p-1.5 rounded-full bg-primary/10">
                      <svg className="h-3.5 w-3.5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {assignFormData.teacherIds.length} teacher{assignFormData.teacherIds.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setAssignModalOpen(false);
                      setSelectedSubject(null);
                      setAssignFormData({ sectionId: '', teacherIds: [] });
                    }}
                    className="px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleAssignTeacher}
                    disabled={!assignFormData.sectionId}
                    className="px-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
                  >
                    Assign Teachers
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
