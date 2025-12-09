const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Department = require('../src/models/Department');

describe('RBAC (Role-Based Access Control) Tests', () => {
  let adminToken, hodToken, teacherToken, studentToken;
  let adminUser, hodUser, teacherUser, studentUser;
  let testDepartment, testCourse;

  beforeAll(async () => {
    // Create test department
    testDepartment = await Department.create({
      code: 'CS',
      name: 'Computer Science',
    });

    // Create test users
    adminUser = await User.create({
      email: 'admin@test.com',
      password: 'password123',
      name: 'Admin User',
      role: 'admin',
    });

    hodUser = await User.create({
      email: 'hod@test.com',
      password: 'password123',
      name: 'HOD User',
      role: 'hod',
      department: testDepartment._id,
    });

    teacherUser = await User.create({
      email: 'teacher@test.com',
      password: 'password123',
      name: 'Teacher User',
      role: 'teacher',
      department: testDepartment._id,
    });

    studentUser = await User.create({
      email: 'student@test.com',
      password: 'password123',
      name: 'Student User',
      role: 'student',
      department: testDepartment._id,
    });

    // Create test course
    testCourse = await Course.create({
      code: 'CS101',
      name: 'Introduction to Programming',
      department: testDepartment._id,
      teacherId: teacherUser._id,
    });

    // Login users to get tokens
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

    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@test.com', password: 'password123' });
    studentToken = studentLogin.body.token;
  });

  describe('Export Endpoints RBAC', () => {
    test('Admin can export course attendance', async () => {
      const response = await request(app)
        .get(`/api/exports/course/${testCourse._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ format: 'csv' });

      expect(response.status).toBe(200);
      expect(response.type).toMatch(/text\/csv|application\/json/);
    });

    test('HOD can export college attendance', async () => {
      const response = await request(app)
        .get('/api/exports/college')
        .set('Authorization', `Bearer ${hodToken}`)
        .query({ format: 'csv' });

      expect(response.status).toBe(200);
    });

    test('Teacher cannot export college attendance', async () => {
      const response = await request(app)
        .get('/api/exports/college')
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({ format: 'csv' });

      expect(response.status).toBe(403);
    });

    test('Student cannot export attendance', async () => {
      const response = await request(app)
        .get(`/api/exports/course/${testCourse._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ format: 'csv' });

      expect(response.status).toBe(403);
    });
  });

  describe('Analytics Endpoints RBAC', () => {
    test('Teacher can view course analytics', async () => {
      const response = await request(app)
        .get(`/api/analytics/courses/${testCourse._id}/summary`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
    });

    test('HOD can view department analytics', async () => {
      const response = await request(app)
        .get(`/api/analytics/departments/${testDepartment._id}/summary`)
        .set('Authorization', `Bearer ${hodToken}`);

      expect(response.status).toBe(200);
    });

    test('Teacher cannot view college analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/college/summary')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(403);
    });

    test('Student cannot view analytics', async () => {
      const response = await request(app)
        .get(`/api/analytics/courses/${testCourse._id}/summary`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Import Endpoints RBAC', () => {
    test('Admin can import students', async () => {
      const response = await request(app)
        .post('/api/imports/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from('name,email,rollNo\nJohn,john@test.com,001'), 'students.csv')
        .field('departmentId', testDepartment._id)
        .field('batchYear', '2023');

      expect(response.status).toMatch(/200|201|422/);
    });

    test('Teacher cannot import students', async () => {
      const response = await request(app)
        .post('/api/imports/students')
        .set('Authorization', `Bearer ${teacherToken}`)
        .attach('file', Buffer.from('name,email,rollNo\nJohn,john@test.com,001'), 'students.csv')
        .field('departmentId', testDepartment._id)
        .field('batchYear', '2023');

      expect(response.status).toBe(403);
    });

    test('Student cannot import students', async () => {
      const response = await request(app)
        .post('/api/imports/students')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('file', Buffer.from('name,email,rollNo\nJohn,john@test.com,001'), 'students.csv')
        .field('departmentId', testDepartment._id)
        .field('batchYear', '2023');

      expect(response.status).toBe(403);
    });
  });

  describe('Export Templates RBAC', () => {
    test('Admin can create export templates', async () => {
      const response = await request(app)
        .post('/api/admin/export-templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Monthly Report',
          scope: 'college',
          columns: ['departmentName', 'totalStudents', 'presentCount'],
        });

      expect(response.status).toMatch(/200|201/);
    });

    test('HOD cannot create export templates', async () => {
      const response = await request(app)
        .post('/api/admin/export-templates')
        .set('Authorization', `Bearer ${hodToken}`)
        .send({
          name: 'Monthly Report',
          scope: 'college',
          columns: ['departmentName', 'totalStudents', 'presentCount'],
        });

      expect(response.status).toBe(403);
    });

    test('Teacher cannot view export templates', async () => {
      const response = await request(app)
        .get('/api/admin/export-templates')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(403);
    });

    test('Student cannot view export templates', async () => {
      const response = await request(app)
        .get('/api/admin/export-templates')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Undo Endpoints RBAC', () => {
    test('Teacher can undo last attendance', async () => {
      const response = await request(app)
        .post(`/api/sessions/507f1f77bcf86cd799439011/undo-last`)
        .set('Authorization', `Bearer ${teacherToken}`);

      // Will return 404 if session not found, but not 403 for RBAC
      expect(response.status).toMatch(/200|404|422/);
    });

    test('Student cannot undo attendance', async () => {
      const response = await request(app)
        .post(`/api/sessions/507f1f77bcf86cd799439011/undo-last`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Timetable Endpoints RBAC', () => {
    test('Admin can import timetable', async () => {
      const response = await request(app)
        .post('/api/timetable/import')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from('courseCode,dayOfWeek,startTime,endTime\nCS101,1,09:00,10:00'), 'timetable.csv');

      expect(response.status).toMatch(/200|201|422/);
    });

    test('Teacher cannot import timetable', async () => {
      const response = await request(app)
        .post('/api/timetable/import')
        .set('Authorization', `Bearer ${teacherToken}`)
        .attach('file', Buffer.from('courseCode,dayOfWeek,startTime,endTime\nCS101,1,09:00,10:00'), 'timetable.csv');

      expect(response.status).toBe(403);
    });

    test('Student cannot import timetable', async () => {
      const response = await request(app)
        .post('/api/timetable/import')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('file', Buffer.from('courseCode,dayOfWeek,startTime,endTime\nCS101,1,09:00,10:00'), 'timetable.csv');

      expect(response.status).toBe(403);
    });

    test('Teacher can view timetable', async () => {
      const response = await request(app)
        .get('/api/timetable')
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({ courseId: testCourse._id });

      expect(response.status).toMatch(/200|404/);
    });
  });

  describe('Cross-Department RBAC', () => {
    let otherDepartment, otherHodUser, otherHodToken;

    beforeAll(async () => {
      otherDepartment = await Department.create({
        code: 'EC',
        name: 'Electronics',
      });

      otherHodUser = await User.create({
        email: 'otherhod@test.com',
        password: 'password123',
        name: 'Other HOD User',
        role: 'hod',
        department: otherDepartment._id,
      });

      const otherHodLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'otherhod@test.com', password: 'password123' });
      otherHodToken = otherHodLogin.body.token;
    });

    test('HOD cannot export attendance for other department', async () => {
      const response = await request(app)
        .get(`/api/exports/department/${testDepartment._id}`)
        .set('Authorization', `Bearer ${otherHodToken}`)
        .query({ format: 'csv' });

      // Should be 403 if properly enforced
      expect([403, 404]).toContain(response.status);
    });

    test('HOD cannot view analytics for other department', async () => {
      const response = await request(app)
        .get(`/api/analytics/departments/${testDepartment._id}/summary`)
        .set('Authorization', `Bearer ${otherHodToken}`);

      expect([403, 404]).toContain(response.status);
    });
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({});
    await Department.deleteMany({});
    await Course.deleteMany({});
  });
});
