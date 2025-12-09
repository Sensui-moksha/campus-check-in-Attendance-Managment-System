import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import tokens from '../../styles/tokens';

/**
 * Admin Export Templates Page
 * Create and manage export templates with custom column selections
 */
export default function ExportTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [userDepartmentId, setUserDepartmentId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scope: 'course',
    columns: [],
    filters: {},
  });

  const columnOptions = {
    course: [
      { id: 'studentName', label: 'Student Name' },
      { id: 'studentEmail', label: 'Student Email' },
      { id: 'studentRollNo', label: 'Roll Number' },
      { id: 'presentCount', label: 'Present Count' },
      { id: 'absentCount', label: 'Absent Count' },
      { id: 'lateCount', label: 'Late Count' },
      { id: 'leaveCount', label: 'Leave Count' },
      { id: 'attendancePercentage', label: 'Attendance %' },
      { id: 'sessionDates', label: 'Session Dates' },
    ],
    college: [
      { id: 'departmentName', label: 'Department Name' },
      { id: 'courseName', label: 'Course Name' },
      { id: 'totalStudents', label: 'Total Students' },
      { id: 'presentCount', label: 'Present Count' },
      { id: 'absentCount', label: 'Absent Count' },
      { id: 'attendancePercentage', label: 'Attendance %' },
      { id: 'yearOfStudy', label: 'Year of Study' },
    ],
    department: [
      { id: 'yearOfStudy', label: 'Year of Study' },
      { id: 'courseName', label: 'Course Name' },
      { id: 'totalStudents', label: 'Total Students' },
      { id: 'presentCount', label: 'Present Count' },
      { id: 'absentCount', label: 'Absent Count' },
      { id: 'attendancePercentage', label: 'Attendance %' },
    ],
  };

  useEffect(() => {
    // Get HOD's department if applicable
    if (user?.role === 'hod') {
      const deptId = typeof user.department === 'string' 
        ? user.department 
        : user.department?._id || user.departmentId;
      setUserDepartmentId(deptId || '');
    }
    
    loadTemplates();
    loadCourses();
    loadDepartments();
  }, [user]);

  const loadCourses = async () => {
    try {
      const { default: apiClient } = await import('../../api');
      const response = await apiClient.get('/courses');
      let allCourses = response.data?.courses || response.data || [];
      
      // If HOD, filter courses to only their department
      if (user?.role === 'hod' && userDepartmentId) {
        allCourses = allCourses.filter(course => {
          const courseDeptId = typeof course.department === 'string' 
            ? course.department 
            : course.department?._id;
          return courseDeptId === userDepartmentId;
        });
      }
      
      setCourses(allCourses);
    } catch (err) {
      console.error('Failed to load courses:', err);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await api.departments.list();
      setDepartments(response.data.departments || []);
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      // Use apiClient directly since this endpoint isn't in api object
      const { default: apiClient } = await import('../../api');
      const response = await apiClient.get('/admin/export-templates');
      setTemplates(response.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async e => {
    e.preventDefault();
    if (!formData.name || formData.columns.length === 0) {
      alert('Please fill in template name and select at least one column');
      return;
    }

    try {
      const { default: apiClient } = await import('../../api');
      await apiClient.post('/admin/export-templates', formData);
      await loadTemplates();
      setShowCreateForm(false);
      setFormData({ name: '', description: '', scope: 'course', columns: [], filters: {} });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTemplate = async templateId => {
    if (!confirm('Delete this template?')) return;

    try {
      const { default: apiClient } = await import('../../api');
      await apiClient.delete(`/admin/export-templates/${templateId}`);
      await loadTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async format => {
    if (!selectedTemplate) {
      alert('Please select a template');
      return;
    }

    if (selectedTemplate.scope === 'course' && !selectedCourseId) {
      alert('Please select a course for this export');
      return;
    }

    if (selectedTemplate.scope === 'department' && !selectedDepartmentId) {
      alert('Please select a department for this export');
      return;
    }

    try {
      setExporting(true);
      setExportError('');
      const { default: apiClient } = await import('../../api');
      const requestBody: any = {
        templateId: selectedTemplate._id,
        format: format,
      };

      // Add courseId if template scope is course
      if (selectedTemplate.scope === 'course') {
        requestBody.courseId = selectedCourseId;
      }

      // Add departmentId if template scope is department
      if (selectedTemplate.scope === 'department') {
        requestBody.departmentId = selectedDepartmentId;
      }

      const response = await apiClient.post('/admin/export-templates/execute', requestBody, {
        responseType: 'blob',
      });

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTemplate.name}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err.response?.data?.error || err.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: tokens.spacing.lg }}>Loading...</div>;
  }

  return (
    <div style={{ padding: tokens.spacing.lg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing['2xl'] }}>
        <div>
          <h1 style={{ fontSize: tokens.typography.fontSize['2xl'], fontWeight: tokens.typography.fontWeight.bold }}>
            Export Templates
          </h1>
          {user?.role === 'hod' && (
            <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.gray[600], marginTop: tokens.spacing.xs }}>
              Showing templates and courses for your department only
            </p>
          )}
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            backgroundColor: tokens.colors.primary,
            color: 'white',
            padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
            border: 'none',
            borderRadius: tokens.borderRadius.md,
            cursor: 'pointer',
            fontWeight: tokens.typography.fontWeight.semibold,
          }}
        >
          {showCreateForm ? 'Cancel' : 'Create Template'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div
          style={{
            backgroundColor: tokens.colors.white,
            borderRadius: tokens.borderRadius.lg,
            padding: tokens.spacing.lg,
            boxShadow: tokens.shadow.md,
            marginBottom: tokens.spacing['2xl'],
          }}
        >
          <h2 style={{ fontSize: tokens.typography.fontSize.lg, fontWeight: tokens.typography.fontWeight.bold, marginBottom: tokens.spacing.lg }}>
            New Template
          </h2>

          <form onSubmit={handleCreateTemplate} style={{ display: 'grid', gap: tokens.spacing.md }}>
            <div>
              <label style={{ display: 'block', fontWeight: tokens.typography.fontWeight.medium, marginBottom: tokens.spacing.sm }}>
                Template Name
              </label>
              <input
                type="text"
                placeholder="e.g., Monthly Course Report"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: tokens.spacing.md,
                  border: `1px solid ${tokens.colors.border}`,
                  borderRadius: tokens.borderRadius.md,
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: tokens.typography.fontWeight.medium, marginBottom: tokens.spacing.sm }}>
                Description
              </label>
              <textarea
                placeholder="Optional description of this template"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: tokens.spacing.md,
                  border: `1px solid ${tokens.colors.border}`,
                  borderRadius: tokens.borderRadius.md,
                  fontFamily: 'inherit',
                  minHeight: '80px',
                  resize: 'vertical',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: tokens.typography.fontWeight.medium, marginBottom: tokens.spacing.sm }}>
                Export Scope
              </label>
              <select
                value={formData.scope}
                onChange={e => setFormData({ ...formData, scope: e.target.value, columns: [] })}
                style={{
                  width: '100%',
                  padding: tokens.spacing.md,
                  border: `1px solid ${tokens.colors.border}`,
                  borderRadius: tokens.borderRadius.md,
                  fontFamily: 'inherit',
                }}
              >
                <option value="course">Single Course</option>
                <option value="department">Department</option>
                <option value="college">College-wide</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: tokens.typography.fontWeight.medium, marginBottom: tokens.spacing.sm }}>
                Columns to Include
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: tokens.spacing.md }}>
                {columnOptions[formData.scope]?.map(col => (
                  <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
                    <input
                      type="checkbox"
                      checked={formData.columns.includes(col.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setFormData({ ...formData, columns: [...formData.columns, col.id] });
                        } else {
                          setFormData({
                            ...formData,
                            columns: formData.columns.filter(c => c !== col.id),
                          });
                        }
                      }}
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: tokens.colors.primary,
                color: 'white',
                padding: tokens.spacing.md,
                border: 'none',
                borderRadius: tokens.borderRadius.md,
                cursor: 'pointer',
                fontWeight: tokens.typography.fontWeight.semibold,
              }}
            >
              Create Template
            </button>
          </form>
        </div>
      )}

      {/* Templates List */}
      <div
        style={{
          backgroundColor: tokens.colors.white,
          borderRadius: tokens.borderRadius.lg,
          padding: tokens.spacing.lg,
          boxShadow: tokens.shadow.md,
          marginBottom: tokens.spacing['2xl'],
        }}
      >
        <h2 style={{ fontSize: tokens.typography.fontSize.lg, fontWeight: tokens.typography.fontWeight.bold, marginBottom: tokens.spacing.lg }}>
          Saved Templates
        </h2>

        {templates.length === 0 ? (
          <p style={{ color: tokens.colors.gray[600] }}>No templates created yet</p>
        ) : (
          <div style={{ display: 'grid', gap: tokens.spacing.md }}>
            {templates.map(template => (
              <div
                key={template._id}
                style={{
                  border: `2px solid ${selectedTemplate?._id === template._id ? tokens.colors.primary : tokens.colors.border}`,
                  borderRadius: tokens.borderRadius.md,
                  padding: tokens.spacing.md,
                  cursor: 'pointer',
                  backgroundColor: selectedTemplate?._id === template._id ? `${tokens.colors.primary}10` : 'transparent',
                }}
                onClick={() => setSelectedTemplate(template)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: tokens.typography.fontWeight.bold, marginBottom: tokens.spacing.xs }}>
                      {template.name}
                    </h3>
                    {template.description && (
                      <p style={{ color: tokens.colors.gray[600], fontSize: tokens.typography.fontSize.sm }}>
                        {template.description}
                      </p>
                    )}
                    <p style={{ color: tokens.colors.gray[500], fontSize: tokens.typography.fontSize.sm, marginTop: tokens.spacing.xs }}>
                      Scope: {template.scope} • Columns: {template.columns.length}
                    </p>
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteTemplate(template._id);
                    }}
                    style={{
                      backgroundColor: tokens.colors.status.absent,
                      color: 'white',
                      padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
                      border: 'none',
                      borderRadius: tokens.borderRadius.md,
                      cursor: 'pointer',
                      fontSize: tokens.typography.fontSize.sm,
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export Section */}
      {selectedTemplate && (
        <div
          style={{
            backgroundColor: tokens.colors.white,
            borderRadius: tokens.borderRadius.lg,
            padding: tokens.spacing.lg,
            boxShadow: tokens.shadow.md,
          }}
        >
          <h2 style={{ fontSize: tokens.typography.fontSize.lg, fontWeight: tokens.typography.fontWeight.bold, marginBottom: tokens.spacing.lg }}>
            Export "{selectedTemplate.name}"
          </h2>

          {selectedTemplate.scope === 'course' && (
            <div style={{ marginBottom: tokens.spacing.lg }}>
              <label style={{ display: 'block', fontWeight: tokens.typography.fontWeight.medium, marginBottom: tokens.spacing.sm }}>
                Select Course
              </label>
              <select
                value={selectedCourseId}
                onChange={e => setSelectedCourseId(e.target.value)}
                style={{
                  width: '100%',
                  padding: tokens.spacing.md,
                  border: `1px solid ${tokens.colors.border}`,
                  borderRadius: tokens.borderRadius.md,
                  fontFamily: 'inherit',
                  marginBottom: tokens.spacing.md,
                }}
              >
                <option value="">-- Select a course --</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedTemplate.scope === 'department' && (
            <div style={{ marginBottom: tokens.spacing.lg }}>
              <label style={{ display: 'block', fontWeight: tokens.typography.fontWeight.medium, marginBottom: tokens.spacing.sm }}>
                Select Department
              </label>
              <select
                value={selectedDepartmentId}
                onChange={e => setSelectedDepartmentId(e.target.value)}
                style={{
                  width: '100%',
                  padding: tokens.spacing.md,
                  border: `1px solid ${tokens.colors.border}`,
                  borderRadius: tokens.borderRadius.md,
                  fontFamily: 'inherit',
                  marginBottom: tokens.spacing.md,
                }}
              >
                <option value="">-- Select a department --</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {exportError && (
            <div
              style={{
                backgroundColor: '#fee2e2',
                color: tokens.colors.status.absent,
                padding: tokens.spacing.md,
                borderRadius: tokens.borderRadius.md,
                marginBottom: tokens.spacing.md,
              }}
            >
              {exportError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: tokens.spacing.md }}>
            {['csv', 'xlsx', 'pdf'].map(format => (
              <button
                key={format}
                onClick={() => handleExport(format)}
                disabled={exporting}
                style={{
                  backgroundColor: exporting ? tokens.colors.gray[400] : tokens.colors.primary,
                  color: 'white',
                  padding: tokens.spacing.lg,
                  border: 'none',
                  borderRadius: tokens.borderRadius.md,
                  cursor: exporting ? 'not-allowed' : 'pointer',
                  fontWeight: tokens.typography.fontWeight.semibold,
                  textTransform: 'uppercase',
                  fontSize: tokens.typography.fontSize.sm,
                }}
              >
                {exporting ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
