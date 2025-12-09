// Bulk upload controller for CSV import/export
const User = require('../models/User');
const Department = require('../models/Department');
const bcrypt = require('bcrypt');
const config = require('../config');
const csv = require('csv-parser');
const { Readable } = require('stream');

/**
 * Download CSV template for bulk user creation
 * GET /admin/csv-templates/users/download
 * Permissions: admin, hod
 */
exports.downloadUserTemplate = async (req, res, next) => {
  try {
    // Permission check
    if (!['admin', 'hod'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // CSV headers
    const headers = [
      'role',
      'name',
      'email',
      'rollNo',
      'employeeId',
      'password',
      'department',
      'workingDepartments',
      'designation',
      'year',
      'section',
      'semester',
      'batchYear',
      'programme',
      'isLateralEntry'
    ];
    
    // Header descriptions (as comments)
    const descriptions = [
      '# role: Required. Values: admin|principal|hod|teacher|student',
      '# name: Full name (Required)',
      '# email: Unique email address (Required)',
      '# rollNo: Student roll number (Required for students, unique)',
      '# employeeId: Employee ID (Required for teachers/hod/admin, unique)',
      '# password: Plain text password (will be hashed on import). Default: Campus@123',
      '# department: Department code or ID (Required for teachers/HOD/students)',
      '# workingDepartments: For teachers - semicolon-separated department codes/IDs (e.g., CSE;IT;ECE)',
      '# designation: Job title for staff (e.g., Assistant Professor, HOD)',
      '# year: Year of study 1-4 (Required for students, must match semester)',
      '# section: Section letter A,B,C... (Required for students)',
      '# semester: Semester 1-8 (Required). Map: 1-2=Year1, 3-4=Year2, 5-6=Year3, 7-8=Year4',
      '# batchYear: Year of admission (e.g., 2023, 2024, 2025)',
      '# programme: Programme name (default: B.Tech)',
      '# isLateralEntry: Yes/No - Is this a lateral entry student (joined from 2nd year, 3-year program)?',
      ''
    ];
    
    // Sample rows
    const sampleRows = [
      {
        role: 'student',
        name: 'Rahul Kumar',
        email: 'rahul.kumar@college.edu',
        rollNo: '2024CSE001',
        employeeId: '',
        password: 'Campus@123',
        department: 'CSE',
        workingDepartments: '',
        designation: '',
        year: '1',
        section: 'A',
        semester: '1',
        batchYear: '2024',
        programme: 'B.Tech',
        isLateralEntry: 'No'
      },
      {
        role: 'student',
        name: 'Priya Sharma',
        email: 'priya.sharma@college.edu',
        rollNo: '2023CSE045',
        employeeId: '',
        password: 'Campus@123',
        department: 'CSE',
        workingDepartments: '',
        designation: '',
        year: '3',
        section: 'B',
        semester: '6',
        batchYear: '2023',
        programme: 'B.Tech',
        isLateralEntry: 'Yes'
      },
      {
        role: 'teacher',
        name: 'Dr. Anita Sharma',
        email: 'anita.sharma@college.edu',
        rollNo: '',
        employeeId: 'EMP001',
        password: 'Campus@123',
        department: 'CSE',
        workingDepartments: 'CSE;IT',
        designation: 'Assistant Professor',
        year: '',
        section: '',
        semester: '',
        batchYear: '',
        programme: '',
        isLateralEntry: ''
      },
      {
        role: 'hod',
        name: 'Prof. Rajesh Singh',
        email: 'rajesh.singh@college.edu',
        rollNo: '',
        employeeId: 'EMP002',
        password: 'Campus@123',
        department: 'ECE',
        workingDepartments: '',
        designation: 'Head of Department',
        year: '',
        section: '',
        semester: '',
        batchYear: '',
        programme: '',
        isLateralEntry: ''
      }
    ];
    
    // Build CSV content
    let csvContent = descriptions.join('\n') + '\n';
    csvContent += headers.join(',') + '\n';
    
    sampleRows.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        // Escape values containing commas or quotes
        if (value.includes(',') || value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvContent += values.join(',') + '\n';
    });
    
    // Send as downloadable file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users_bulk_template.csv"');
    res.send(csvContent);
    
  } catch (error) {
    console.error('Error generating CSV template:', error);
    next(error);
  }
};

/**
 * Bulk user upload via CSV
 * POST /admin/users/bulk-upload
 * Permissions: admin, hod
 */
exports.bulkUploadUsers = async (req, res, next) => {
  try {
    // Permission check
    if (!['admin', 'hod'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Parse CSV
    const results = {
      processed: 0,
      successes: [],
      failures: [],
      skipped: []
    };
    
    const rows = [];
    const fileContent = req.file.buffer.toString('utf8');
    
    // Parse CSV manually (simple parser)
    const lines = fileContent.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('#');
    });
    
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV file is empty or invalid' });
    }
    
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Validate headers
    const requiredHeaders = ['role', 'name', 'email'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return res.status(400).json({ 
        error: `Missing required headers: ${missingHeaders.join(', ')}`,
        requiredHeaders
      });
    }
    
    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      row._lineNumber = i + 1;
      rows.push(row);
    }
    
    // Get all departments for validation
    const departments = await Department.find({});
    const deptMap = new Map();
    departments.forEach(d => {
      deptMap.set(d.code.toUpperCase(), d._id);
      deptMap.set(d._id.toString(), d._id);
      deptMap.set(d.name.toUpperCase(), d._id);
    });
    
    // Process each row
    for (const row of rows) {
      results.processed++;
      const errors = [];
      
      try {
        // Validate required fields
        if (!row.role) errors.push('Role is required');
        if (!row.name) errors.push('Name is required');
        if (!row.email) errors.push('Email is required');
        
        // Validate role
        const validRoles = ['student', 'teacher', 'hod', 'admin', 'principal'];
        if (row.role && !validRoles.includes(row.role.toLowerCase())) {
          errors.push(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
        }
        
        // Role-specific validation
        const role = row.role.toLowerCase();
        
        if (role === 'student') {
          if (!row.rollNo) errors.push('rollNo is required for students');
          if (!row.department) errors.push('department is required for students');
          if (!row.year) errors.push('year is required for students');
          if (!row.section) errors.push('section is required for students');
          if (!row.semester) errors.push('semester is required for students');
          
          if (row.year && (parseInt(row.year) < 1 || parseInt(row.year) > 4)) {
            errors.push('year must be between 1 and 4');
          }
          if (row.semester && (parseInt(row.semester) < 1 || parseInt(row.semester) > 8)) {
            errors.push('semester must be between 1 and 8');
          }
        }
        
        if (['teacher', 'hod', 'admin'].includes(role)) {
          if (!row.employeeId) errors.push('employeeId is required for staff');
          if (role !== 'admin' && !row.department) {
            errors.push('department is required for teachers and HODs');
          }
        }
        
        // Email validation
        if (row.email && !row.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          errors.push('Invalid email format');
        }
        
        // Check for duplicate email
        if (row.email) {
          const existingUser = await User.findOne({ email: row.email.toLowerCase() });
          if (existingUser) {
            errors.push(`Email already exists (User ID: ${existingUser._id})`);
          }
        }
        
        // Check for duplicate rollNo
        if (row.rollNo) {
          const existingStudent = await User.findOne({ rollNo: row.rollNo });
          if (existingStudent) {
            errors.push(`Roll number already exists (User ID: ${existingStudent._id})`);
          }
        }
        
        // Check for duplicate employeeId
        if (row.employeeId) {
          const existingEmployee = await User.findOne({ employeeId: row.employeeId });
          if (existingEmployee) {
            errors.push(`Employee ID already exists (User ID: ${existingEmployee._id})`);
          }
        }
        
        // Validate department
        let departmentId = null;
        if (row.department) {
          const deptKey = row.department.toUpperCase();
          departmentId = deptMap.get(deptKey);
          if (!departmentId) {
            errors.push(`Department not found: ${row.department}`);
          }
        }
        
        // Parse working departments for teachers
        let workingDepartments = [];
        if (row.workingDepartments && ['teacher'].includes(role)) {
          const deptCodes = row.workingDepartments.split(';').map(d => d.trim());
          for (const code of deptCodes) {
            const deptId = deptMap.get(code.toUpperCase());
            if (deptId) {
              workingDepartments.push(deptId);
            } else {
              errors.push(`Working department not found: ${code}`);
            }
          }
        }
        
        // If there are validation errors, record and continue
        if (errors.length > 0) {
          results.failures.push({
            row: row._lineNumber,
            data: row,
            errors
          });
          continue;
        }
        
        // Create user
        const userData = {
          name: row.name,
          email: row.email.toLowerCase(),
          role: role,
          passwordHash: await bcrypt.hash(row.password || 'Campus@123', config.BCRYPT_SALT_ROUNDS),
          programme: row.programme || 'B.Tech'
        };
        
        if (departmentId) userData.department = departmentId;
        if (workingDepartments.length > 0) userData.workingDepartments = workingDepartments;
        if (row.rollNo) userData.rollNo = row.rollNo;
        if (row.employeeId) userData.employeeId = row.employeeId;
        if (row.designation) userData.designation = row.designation;
        if (row.year) userData.yearOfStudy = parseInt(row.year);
        if (row.section) userData.section = row.section.toUpperCase();
        if (row.semester) userData.semester = parseInt(row.semester);
        if (row.batchYear) userData.batchYear = parseInt(row.batchYear);
        if (row.isLateralEntry) {
          const leValue = row.isLateralEntry.toLowerCase();
          userData.isLateralEntry = leValue === 'yes' || leValue === 'true' || leValue === '1';
        }
        
        const newUser = await User.create(userData);
        
        results.successes.push({
          row: row._lineNumber,
          userId: newUser._id,
          email: newUser.email,
          role: newUser.role,
          name: newUser.name
        });
        
      } catch (error) {
        results.failures.push({
          row: row._lineNumber,
          data: row,
          errors: [error.message]
        });
      }
    }
    
    res.status(200).json({
      message: 'Bulk upload completed',
      ...results,
      successCount: results.successes.length,
      errorCount: results.failures.length,
      skippedCount: results.skipped.length
    });
    
  } catch (error) {
    console.error('Error in bulk upload:', error);
    next(error);
  }
};

module.exports = {
  downloadUserTemplate: exports.downloadUserTemplate,
  bulkUploadUsers: exports.bulkUploadUsers
};
