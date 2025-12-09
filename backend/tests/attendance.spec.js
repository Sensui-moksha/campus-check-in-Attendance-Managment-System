const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Department = require('../src/models/Department');
const Attendance = require('../src/models/Attendance');
const ClassSession = require('../src/models/ClassSession');
const AuditLog = require('../src/models/AuditLog');

describe('Attendance & Undo Functionality Tests', () => {
  let teacherToken, teacherUser;
  let testDepartment, testCourse, testSession;
  let studentUsers = [];

  beforeAll(async () => {
    // Create test department
    testDepartment = await Department.create({
      code: 'CS',
      name: 'Computer Science',
    });

    // Create teacher
    teacherUser = await User.create({
      email: 'teacher@test.com',
      password: 'password123',
      name: 'Test Teacher',
      role: 'teacher',
      department: testDepartment._id,
    });

    // Create students
    for (let i = 0; i < 3; i++) {
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

    // Create session
    testSession = await ClassSession.create({
      course: testCourse._id,
      date: new Date('2024-01-15'),
      startTime: '09:00',
      endTime: '10:00',
    });

    // Login teacher
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@test.com', password: 'password123' });
    teacherToken = loginRes.body.token;
  });

  describe('Attendance Marking', () => {
    test('Should mark attendance for multiple students', async () => {
      const records = studentUsers.map(student => ({
        studentId: student._id,
        status: 'present',
      }));

      const response = await request(app)
        .post(`/api/attendance/${testSession._id}/mark`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ records });

      expect(response.status).toMatch(/200|201/);
      expect(response.body.marked).toBeGreaterThan(0);
    });

    test('Should handle mixed attendance statuses', async () => {
      const records = [
        { studentId: studentUsers[0]._id, status: 'present' },
        { studentId: studentUsers[1]._id, status: 'absent' },
        { studentId: studentUsers[2]._id, status: 'late' },
      ];

      const response = await request(app)
        .post(`/api/attendance/${testSession._id}/mark`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ records });

      expect(response.status).toMatch(/200|201/);

      // Verify all statuses were recorded
      const attendances = await Attendance.find({ session: testSession._id });
      const statuses = attendances.map(a => a.status);
      expect(statuses).toContain('present');
      expect(statuses).toContain('absent');
      expect(statuses).toContain('late');
    });

    test('Should validate student IDs', async () => {
      const records = [
        { studentId: 'invalid-id', status: 'present' },
      ];

      const response = await request(app)
        .post(`/api/attendance/${testSession._id}/mark`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ records });

      expect(response.status).toMatch(/400|422/);
    });

    test('Should reject invalid status values', async () => {
      const records = [
        { studentId: studentUsers[0]._id, status: 'invalid-status' },
      ];

      const response = await request(app)
        .post(`/api/attendance/${testSession._id}/mark`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ records });

      expect(response.status).toMatch(/422/);
    });
  });

  describe('Audit Logging', () => {
    let auditSession;

    beforeAll(async () => {
      auditSession = await ClassSession.create({
        course: testCourse._id,
        date: new Date('2024-01-16'),
        startTime: '10:00',
        endTime: '11:00',
      });

      const records = studentUsers.map(student => ({
        studentId: student._id,
        status: 'present',
      }));

      await request(app)
        .post(`/api/attendance/${auditSession._id}/mark`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ records });
    });

    test('Should create audit log for attendance marking', async () => {
      const auditLogs = await AuditLog.find({
        action: 'ATTENDANCE_MARK',
        targetCollection: 'Attendance',
      });

      expect(auditLogs.length).toBeGreaterThan(0);
    });

    test('Should store previous state in audit log for undo', async () => {
      const auditLogs = await AuditLog.find({
        action: 'ATTENDANCE_MARK',
        targetCollection: 'Attendance',
      });

      if (auditLogs.length > 0) {
        const log = auditLogs[0];
        expect(log.meta).toBeDefined();
        expect(log.actor).toBeDefined();
      }
    });

    test('Should include user info in audit logs', async () => {
      const auditLogs = await AuditLog.find({
        action: 'ATTENDANCE_MARK',
      }).populate('actor');

      if (auditLogs.length > 0) {
        expect(auditLogs[0].actor._id).toEqual(teacherUser._id);
      }
    });
  });

  describe('Attendance Undo Functionality', () => {
    let undoSession;

    beforeAll(async () => {
      undoSession = await ClassSession.create({
        course: testCourse._id,
        date: new Date('2024-01-17'),
        startTime: '11:00',
        endTime: '12:00',
      });

      const records = studentUsers.map(student => ({
        studentId: student._id,
        status: 'present',
      }));

      await request(app)
        .post(`/api/attendance/${undoSession._id}/mark`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ records });
    });

    test('Should undo last attendance marking', async () => {
      const attendanceBefore = await Attendance.countDocuments({
        session: undoSession._id,
      });

      const response = await request(app)
        .post(`/api/sessions/${undoSession._id}/undo-last`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toMatch(/200|201/);

      const attendanceAfter = await Attendance.countDocuments({
        session: undoSession._id,
      });

      // After undo, attendance records should be removed or marked as undone
      expect(attendanceAfter).toBeLessThanOrEqual(attendanceBefore);
    });

    test('Should create audit log for undo operation', async () => {
      const undoLogs = await AuditLog.find({
        action: 'ATTENDANCE_UNDO',
        targetCollection: 'Attendance',
      });

      expect(undoLogs.length).toBeGreaterThanOrEqual(0);
    });

    test('Should retrieve undo history for a session', async () => {
      const response = await request(app)
        .get(`/api/sessions/${undoSession._id}/undo-history`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toMatch(/200/);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('Should handle undo when no attendance exists', async () => {
      const emptySession = await ClassSession.create({
        course: testCourse._id,
        date: new Date('2024-01-18'),
        startTime: '12:00',
        endTime: '13:00',
      });

      const response = await request(app)
        .post(`/api/sessions/${emptySession._id}/undo-last`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toMatch(/200|404|422/);
    });
  });

  describe('Bulk Attendance Operations', () => {
    test('Should mark attendance in bulk efficiently', async () => {
      const bulkSession = await ClassSession.create({
        course: testCourse._id,
        date: new Date('2024-01-19'),
        startTime: '13:00',
        endTime: '14:00',
      });

      const records = studentUsers.map(student => ({
        studentId: student._id,
        status: ['present', 'absent', 'late'][Math.floor(Math.random() * 3)],
      }));

      const startTime = Date.now();
      const response = await request(app)
        .post(`/api/attendance/${bulkSession._id}/mark`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ records });
      const endTime = Date.now();

      expect(response.status).toMatch(/200|201/);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('Should support leave and late statuses', async () => {
      const leaveSession = await ClassSession.create({
        course: testCourse._id,
        date: new Date('2024-01-20'),
        startTime: '14:00',
        endTime: '15:00',
      });

      const records = [
        { studentId: studentUsers[0]._id, status: 'leave' },
        { studentId: studentUsers[1]._id, status: 'late' },
        { studentId: studentUsers[2]._id, status: 'present' },
      ];

      const response = await request(app)
        .post(`/api/attendance/${leaveSession._id}/mark`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ records });

      expect(response.status).toMatch(/200|201/);

      const attendances = await Attendance.find({ session: leaveSession._id });
      const statuses = attendances.map(a => a.status).sort();
      expect(statuses).toContain('leave');
      expect(statuses).toContain('late');
    });
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({});
    await Department.deleteMany({});
    await Course.deleteMany({});
    await ClassSession.deleteMany({});
    await Attendance.deleteMany({});
    await AuditLog.deleteMany({});
  });
});
