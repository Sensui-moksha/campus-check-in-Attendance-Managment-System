import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api';
import { BatchYearSelector } from '../../components/Selectors';
import tokens from '../../styles/tokens';

/**
 * Admin Import Students Page
 * Bulk import students via CSV file
 */
export default function ImportStudents() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [departmentId, setDepartmentId] = useState('');
  const [batchYear, setBatchYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);

  // Load departments on mount and set HOD's department
  React.useEffect(() => {
    loadDepartments();
    
    // If user is HOD, auto-select their department
    if (user?.role === 'hod') {
      const userDeptId = typeof user.department === 'string' 
        ? user.department 
        : user.department?._id || user.departmentId;
      if (userDeptId) {
        setDepartmentId(userDeptId);
      }
    }
  }, [user]);

  const loadDepartments = async () => {
    try {
      const response = await api.departments.list();
      if (response.data.departments) {
        // If HOD, filter to only show their department
        if (user?.role === 'hod') {
          const userDeptId = typeof user.department === 'string' 
            ? user.department 
            : user.department?._id || user.departmentId;
          const filtered = response.data.departments.filter(
            dept => dept._id === userDeptId
          );
          setDepartments(filtered);
        } else {
          setDepartments(response.data.departments);
        }
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  // Generate sample CSV data
  const generateSampleCSV = () => {
    const sampleData = [
      { name: 'John Doe', email: 'john.doe@college.edu', rollNo: 'CS001', section: 'A', yearOfStudy: '1', semester: '1', batchYear: '2024', password: 'SecurePass@123', academicStartDate: '01-09-2024', isLateralEntry: 'No' },
      { name: 'Jane Smith', email: 'jane.smith@college.edu', rollNo: 'CS002', section: 'A', yearOfStudy: '1', semester: '1', batchYear: '2024', password: 'SecurePass@123', academicStartDate: '01-09-2024', isLateralEntry: 'No' },
      { name: 'Ahmed Khan', email: 'ahmed.khan@college.edu', rollNo: 'CS003', section: 'B', yearOfStudy: '1', semester: '1', batchYear: '2024', password: 'SecurePass@123', academicStartDate: '01-09-2024', isLateralEntry: 'No' },
      { name: 'Priya Sharma', email: 'priya.sharma@college.edu', rollNo: 'CS004', section: 'B', yearOfStudy: '2', semester: '3', batchYear: '2024', password: 'SecurePass@123', academicStartDate: '01-09-2024', isLateralEntry: 'Yes' },
      { name: 'Raj Kumar', email: 'raj.kumar@college.edu', rollNo: 'CS005', section: 'C', yearOfStudy: '1', semester: '1', batchYear: '2024', password: 'SecurePass@123', academicStartDate: '01-09-2024', isLateralEntry: 'No' },
      { name: 'Amira Hassan', email: 'amira.hassan@college.edu', rollNo: 'CS006', section: 'A', yearOfStudy: '2', semester: '3', batchYear: '2024', password: 'SecurePass@123', academicStartDate: '01-09-2024', isLateralEntry: 'Yes' },
      { name: 'David Chen', email: 'david.chen@college.edu', rollNo: 'CS007', section: 'B', yearOfStudy: '1', semester: '1', batchYear: '2024', password: 'SecurePass@123', academicStartDate: '01-09-2024', isLateralEntry: 'No' },
      { name: 'Emma Wilson', email: 'emma.wilson@college.edu', rollNo: 'CS008', section: 'C', yearOfStudy: '1', semester: '1', batchYear: '2024', password: 'SecurePass@123', academicStartDate: '01-09-2024', isLateralEntry: 'No' },
      { name: 'Carlos Lopez', email: 'carlos.lopez@college.edu', rollNo: 'CS009', section: 'A', yearOfStudy: '1', semester: '1', batchYear: '2024', password: 'SecurePass@123', academicStartDate: '01-09-2024', isLateralEntry: 'No' },
      { name: 'Sofia Rodriguez', email: 'sofia.rodriguez@college.edu', rollNo: 'CS010', section: 'B', yearOfStudy: '1', semester: '1', batchYear: '2024', password: 'SecurePass@123', academicStartDate: '01-09-2024', isLateralEntry: 'No' },
    ];

    // Create CSV header
    const headers = ['name', 'email', 'rollNo', 'section', 'yearOfStudy', 'semester', 'batchYear', 'password', 'academicStartDate', 'isLateralEntry'];
    const csvContent = [
      headers.join(','),
      ...sampleData.map(student => 
        headers.map(header => `"${student[header]}"`).join(',')
      ),
    ].join('\n');

    return csvContent;
  };

  // Download sample CSV
  const handleDownloadSample = () => {
    const csvContent = generateSampleCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'SAMPLE_STUDENTS_IMPORT.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file');
      return;
    }
    if (!departmentId) {
      setError('Please select a department');
      return;
    }
    // batchYear optional: when empty, CSV values are used

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('departmentId', departmentId);
      if (batchYear) {
        formData.append('batchYear', batchYear);
      }

      // Use apiClient directly for FormData to preserve proper headers
      const { default: apiClient } = await import('../../api');
      const response = await apiClient.post('/imports/students', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(response.data);
      setFile(null);
      setDepartmentId('');
      setBatchYear('');
    } catch (err) {
      setError(err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: tokens.colors.surface }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div style={{ marginBottom: tokens.spacing['2xl'], display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1
              style={{
                fontSize: tokens.typography.fontSize['2xl'],
                fontWeight: tokens.typography.fontWeight.bold,
                color: tokens.colors.gray[900],
                marginBottom: tokens.spacing.sm,
              }}
            >
              Bulk Import Students
            </h1>
            <p style={{ color: tokens.colors.gray[600] }}>
              Upload a CSV file to import students in bulk
            </p>
          </div>
          <button
            onClick={handleDownloadSample}
            style={{
              padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
              backgroundColor: tokens.colors.gray[200],
              color: tokens.colors.gray[900],
              borderRadius: tokens.borderRadius.md,
              fontWeight: tokens.typography.fontWeight.semibold,
              border: `1px solid ${tokens.colors.border}`,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            ⬇ Download Sample
          </button>
        </div>

        {/* Upload Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: tokens.colors.white,
            borderRadius: tokens.borderRadius.lg,
            padding: tokens.spacing.lg,
            boxShadow: tokens.shadow.md,
          }}
        >
          {error && (
            <div
              style={{
                backgroundColor: `${tokens.colors.status.absent}20`,
                color: tokens.colors.status.absent,
                padding: tokens.spacing.md,
                borderRadius: tokens.borderRadius.md,
                marginBottom: tokens.spacing.lg,
              }}
            >
              {error}
            </div>
          )}

          {/* File Upload */}
          <div style={{ marginBottom: tokens.spacing.lg }}>
            <label style={{ display: 'block', fontWeight: tokens.typography.fontWeight.medium, marginBottom: tokens.spacing.sm }}>
              CSV File
            </label>
            <div
              style={{
                border: `2px dashed ${tokens.colors.border}`,
                borderRadius: tokens.borderRadius.md,
                padding: tokens.spacing.lg,
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={loading}
                style={{ display: 'none' }}
                id="file-input"
              />
              <label htmlFor="file-input" style={{ cursor: 'pointer' }}>
                <p style={{ color: tokens.colors.gray[600], marginBottom: tokens.spacing.sm }}>
                  {file ? file.name : 'Click to upload CSV or drag and drop'}
                </p>
                <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.gray[500] }}>
                  Required columns: name, email, rollNo, section, yearOfStudy, semester, batchYear, password, academicStartDate
                </p>
              </label>
            </div>
          </div>

          {/* Department */}
          <div style={{ marginBottom: tokens.spacing.lg }}>
            <label style={{ display: 'block', fontWeight: tokens.typography.fontWeight.medium, marginBottom: tokens.spacing.sm }}>
              Department *
            </label>
            <select
              value={departmentId}
              onChange={e => setDepartmentId(e.target.value)}
              disabled={loading || user?.role === 'hod'}
              style={{
                width: '100%',
                padding: tokens.spacing.md,
                border: `1px solid ${tokens.colors.border}`,
                borderRadius: tokens.borderRadius.md,
                backgroundColor: user?.role === 'hod' ? tokens.colors.gray[100] : 'white',
              }}
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
            {user?.role === 'hod' && (
              <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.gray[600], marginTop: tokens.spacing.xs }}>
                Locked to your department
              </p>
            )}
          </div>

          {/* Batch Year */}
          <div style={{ marginBottom: tokens.spacing.lg }}>
            <BatchYearSelector
              value={batchYear}
              onChange={setBatchYear}
              label="Batch Year (optional override)"
              placeholder="Use CSV values"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !file}
            style={{
              width: '100%',
              padding: tokens.spacing.md,
              backgroundColor: loading ? tokens.colors.gray[400] : tokens.colors.primary,
              color: tokens.colors.white,
              borderRadius: tokens.borderRadius.md,
              fontWeight: tokens.typography.fontWeight.semibold,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Importing...' : 'Import Students'}
          </button>
        </form>

        {/* Results */}
        {result && (
          <div
            style={{
              marginTop: tokens.spacing['2xl'],
              backgroundColor: tokens.colors.white,
              borderRadius: tokens.borderRadius.lg,
              padding: tokens.spacing.lg,
              boxShadow: tokens.shadow.md,
            }}
          >
            <h2 style={{ fontSize: tokens.typography.fontSize.lg, fontWeight: tokens.typography.fontWeight.bold, marginBottom: tokens.spacing.lg }}>
              Import Summary
            </h2>

            {/* Stats */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: tokens.spacing.md,
                marginBottom: tokens.spacing.lg,
              }}
            >
              <div style={{ backgroundColor: tokens.colors.gray[100], padding: tokens.spacing.md, borderRadius: tokens.borderRadius.md }}>
                <p style={{ color: tokens.colors.gray[600], fontSize: tokens.typography.fontSize.sm }}>Total Processed</p>
                <p style={{ fontSize: tokens.typography.fontSize.xl, fontWeight: tokens.typography.fontWeight.bold }}>
                  {result.summary.total}
                </p>
              </div>
              <div style={{ backgroundColor: '#10b98120', padding: tokens.spacing.md, borderRadius: tokens.borderRadius.md }}>
                <p style={{ color: '#10b981', fontSize: tokens.typography.fontSize.sm }}>Created</p>
                <p style={{ fontSize: tokens.typography.fontSize.xl, fontWeight: tokens.typography.fontWeight.bold, color: '#10b981' }}>
                  {result.summary.created}
                </p>
              </div>
              <div style={{ backgroundColor: '#ef444420', padding: tokens.spacing.md, borderRadius: tokens.borderRadius.md }}>
                <p style={{ color: '#ef4444', fontSize: tokens.typography.fontSize.sm }}>Failed</p>
                <p style={{ fontSize: tokens.typography.fontSize.xl, fontWeight: tokens.typography.fontWeight.bold, color: '#ef4444' }}>
                  {result.summary.failed}
                </p>
              </div>
            </div>

            {/* Created Students */}
            {result.created.length > 0 && (
              <div style={{ marginBottom: tokens.spacing.lg }}>
                <h3 style={{ fontWeight: tokens.typography.fontWeight.semibold, marginBottom: tokens.spacing.md }}>
                  Created Students (showing {Math.min(10, result.created.length)} of {result.created.length})
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${tokens.colors.border}` }}>
                        <th style={{ padding: tokens.spacing.sm, textAlign: 'left' }}>Name</th>
                        <th style={{ padding: tokens.spacing.sm, textAlign: 'left' }}>Email</th>
                        <th style={{ padding: tokens.spacing.sm, textAlign: 'left' }}>Roll No</th>
                        <th style={{ padding: tokens.spacing.sm, textAlign: 'left' }}>Temp Password</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.created.map(student => (
                        <tr key={student.id} style={{ borderBottom: `1px solid ${tokens.colors.border}` }}>
                          <td style={{ padding: tokens.spacing.sm }}>{student.name}</td>
                          <td style={{ padding: tokens.spacing.sm }}>{student.email}</td>
                          <td style={{ padding: tokens.spacing.sm }}>{student.rollNo}</td>
                          <td style={{ padding: tokens.spacing.sm, fontFamily: 'monospace' }}>
                            <code style={{ backgroundColor: tokens.colors.gray[100], padding: '2px 6px' }}>
                              {student.tempPassword}
                            </code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Errors */}
            {result.errors.length > 0 && (
              <div>
                <h3 style={{ fontWeight: tokens.typography.fontWeight.semibold, marginBottom: tokens.spacing.md, color: tokens.colors.status.absent }}>
                  Errors ({result.errors.length})
                </h3>
                <div style={{ backgroundColor: `${tokens.colors.status.absent}10`, padding: tokens.spacing.md, borderRadius: tokens.borderRadius.md }}>
                  {result.errors.map((err, i) => (
                    <p key={i} style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.status.absent, marginBottom: tokens.spacing.xs }}>
                      {err.error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
