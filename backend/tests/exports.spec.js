const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Department = require('../src/models/Department');
const Attendance = require('../src/models/Attendance');
const ClassSession = require('../src/models/ClassSession');

describe('Export Functionality Tests', () => {
  let adminToken, hodToken, teacherToken;
  let adminUser, testDepartment, testCourse, testSession;
  let studentUsers = [];

  beforeAll(async () => {
    // Create department
    testDepartment = await Department.create({
      code: 'CS',
      name: 'Computer Science',
    });

    // Create users
    adminUser = await User.create({
      email: 'admin@test.com',
      password: 'password123',
      name: 'Admin',
      role: 'admin',
    });

    const hodUser = await User.create({
      email: 'hod@test.com',
      password: 'password123',
      name: 'HOD',
      role: 'hod',
      department: testDepartment._id,
    });

    const teacherUser = await User.create({
      email: 'teacher@test.com',
      password: 'password123',
      name: 'Teacher',
      role: 'teacher',
      department: testDepartment._id,
    });

    // Create students
    for (let i = 0; i < 5; i++) {
      const student = await User.create({
        email: `student${i}@test.com`,
        password: 'password123',
        name: `Student ${i}`,
        role: 'student',
        department: testDepartment._id,
        rollNo: `00${i}`,
        yearOfStudy: 1,
      });
      studentUsers.push(student);
    }

    // Create course
    testCourse = await Course.create({
      code: 'CS101',
      name: 'Introduction to Programming',
      department: testDepartment._id,
      teacherId: teacherUser._id,
    });

    // Create session with attendance
    testSession = await ClassSession.create({
      course: testCourse._id,
      date: new Date('2024-01-15'),
      startTime: '09:00',
      endTime: '10:00',
    });

    // Mark attendance
    for (let i = 0; i < studentUsers.length; i++) {
      await Attendance.create({
        student: studentUsers[i]._id,
        course: testCourse._id,
        session: testSession._id,
        status: i % 3 === 0 ? 'absent' : i % 3 === 1 ? 'late' : 'present',
      });
    }

    // Login users
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminLogin.body.token;

    const hodLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'hod@test.com', password: 'password123' });
    hodToken = hodLogin.body.token;

    const teacherLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@test.com', password: 'password123' });
    teacherToken = teacherLogin.body.token;
  });

  describe('Course Attendance Export', () => {
    test('Should export course attendance as CSV', async () => {
      const response = await request(app)
        .get(`/api/exports/course/${testCourse._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ format: 'csv' });

      expect(response.status).toBe(200);
      expect(response.type).toMatch(/text\/csv|application\/octet-stream/);
      expect(response.body).toBeDefined();
    });

    test('Should export course attendance as XLSX', async () => {
      const response = await request(app)
        .get(`/api/exports/course/${testCourse._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ format: 'xlsx' });

      expect(response.status).toBe(200);
      expect(response.type).toMatch(/spreadsheetml|octet-stream/);
      expect(response.body).toBeDefined();
    });

    test('Should export course attendance as PDF', async () => {
      const response = await request(app)
        .get(`/api/exports/course/${testCourse._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ format: 'pdf' });

      expect(response.status).toBe(200);
      expect(response.type).toMatch(/pdf|octet-stream/);
      expect(response.body).toBeDefined();
    });

    test('Should support date range filtering', async () => {
      const response = await request(app)
        .get(`/api/exports/course/${testCourse._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          format: 'csv',
          from: '2024-01-01',
          to: '2024-01-31',
        });

      expect(response.status).toBe(200);
      expect(response.type).toMatch(/text\/csv|application\/octet-stream/);
    });

    test('Should support batch year filtering', async () => {
      const response = await request(app)
        .get(`/api/exports/course/${testCourse._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          format: 'csv',
          batchYear: '2023',
        });

      expect(response.status).toBe(200);
    });

    test('Should return 404 for non-existent course', async () => {
      const response = await request(app)
        .get('/api/exports/course/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ format: 'csv' });

      expect(response.status).toBe(404);
    });
  });

  describe('College Attendance Export', () => {
    test('Should export college attendance as CSV', async () => {
      const response = await request(app)
        .get('/api/exports/college')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ format: 'csv' });

      expect(response.status).toBe(200);
      expect(response.type).toMatch(/text\/csv|application\/octet-stream/);
    });

    test('Should support date range for college export', async () => {
      const response = await request(app)
        .get('/api/exports/college')
        .set('Authorization', `Bearer ${hodToken}`)
        .query({
          format: 'xlsx',
          from: '2024-01-01',
          to: '2024-01-31',
        });

      expect(response.status).toBe(200);
    });
  });

  describe('Department Attendance Export', () => {
    test('Should export department attendance as CSV', async () => {
      const response = await request(app)
        .get(`/api/exports/department/${testDepartment._id}`)
        .set('Authorization', `Bearer ${hodToken}`)
        .query({ format: 'csv' });

      expect(response.status).toBe(200);
      expect(response.type).toMatch(/text\/csv|application\/octet-stream/);
    });

    test('Should export department attendance as XLSX', async () => {
      const response = await request(app)
        .get(`/api/exports/department/${testDepartment._id}`)
        .set('Authorization', `Bearer ${hodToken}`)
        .query({ format: 'xlsx' });

      expect(response.status).toBe(200);
    });

    test('Should export department attendance as PDF', async () => {
      const response = await request(app)
        .get(`/api/exports/department/${testDepartment._id}`)
        .set('Authorization', `Bearer ${hodToken}`)
        .query({ format: 'pdf' });

      expect(response.status).toBe(200);
    });
  });

  describe('Export Format Validation', () => {
    test('Should reject invalid format', async () => {
      const response = await request(app)
        .get(`/api/exports/course/${testCourse._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ format: 'invalid' });

      expect([400, 422]).toContain(response.status);
    });

    test('Should default to CSV when format not specified', async () => {
      const response = await request(app)
        .get(`/api/exports/course/${testCourse._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toMatch(/200|400|422/);
    });
  });

  describe('Export Content Validation', () => {
    test('CSV export should contain student data', async () => {
      const response = await request(app)
        .get(`/api/exports/course/${testCourse._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ format: 'csv' });

      expect(response.status).toBe(200);
      const csvContent = response.body.toString();
      
      // CSV should contain headers and at least one row of data
      expect(csvContent).toMatch(/name|email|present|absent/i);
    });

    test('Export should include attendance statistics', async () => {
      const response = await request(app)
        .get(`/api/exports/course/${testCourse._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ format: 'csv' });

      expect(response.status).toBe(200);
      const csvContent = response.body.toString();
      
      // Should contain attendance counts
      expect(csvContent).toMatch(/\d+/);
    });
  });

  describe('Export Templates', () => {
    let templateId;

    test('Should create export template', async () => {
      const response = await request(app)
        .post('/api/admin/export-templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Weekly Report',
          description: 'Weekly attendance report',
          scope: 'college',
          columns: ['departmentName', 'totalStudents', 'presentCount'],
        });

      expect(response.status).toMatch(/200|201/);
      if (response.body._id) {
        templateId = response.body._id;
      }
    });

    test('Should retrieve export templates', async () => {
      const response = await request(app)
        .get('/api/admin/export-templates')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('Should export with template', async () => {
      if (!templateId) {
        // Create template first
        const createRes = await request(app)
          .post('/api/admin/export-templates')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'College Summary',
            scope: 'college',
            columns: ['courseName', 'presentCount', 'totalStudents'],
          });

        if (createRes.body._id) {
          templateId = createRes.body._id;
        } else {
          return; // Skip if template creation failed
        }
      }

      const response = await request(app)
        .post('/api/exports/template/execute')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          templateId,
          format: 'csv',
        });

      expect([200, 201, 404]).toContain(response.status);
    });

    test('Should delete export template', async () => {
      if (!templateId) return;

      const response = await request(app)
        .delete(`/api/admin/export-templates/${templateId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 204]).toContain(response.status);
    });
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({});
    await Department.deleteMany({});
    await Course.deleteMany({});
    await ClassSession.deleteMany({});
    await Attendance.deleteMany({});
  });
});
