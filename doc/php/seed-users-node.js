/**
 * Campus Check-In System - Seed Users (Node.js Version)
 * 
 * Purpose: Create initial users with proper password hashing
 * Usage: node doc/php/seed-users-node.js
 * 
 * This script:
 * - Connects to MySQL database
 * - Creates departments, courses, subjects
 * - Creates admin, principal, HOD, teacher, and student users
 * - Displays credentials in terminal
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'your_mysql_password',  // CHANGE THIS
  database: 'campus_checkin',
  multipleStatements: true
};

// ============================================================================
// COLOR CODES FOR TERMINAL OUTPUT
// ============================================================================
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Print colored text
 */
function print(text, color = colors.reset) {
  console.log(color + text + colors.reset);
}

/**
 * Print section header
 */
function printHeader(title) {
  const line = '═'.repeat(80);
  print('\n' + line, colors.cyan);
  print(title.padStart(40 + title.length / 2).padEnd(80), colors.cyan + colors.bright);
  print(line, colors.cyan);
}

/**
 * Print credential box
 */
function printCredentials(title, users) {
  const line = '─'.repeat(78);
  print('\n┌' + line + '┐', colors.blue);
  print('│ ' + title.padEnd(77) + '│', colors.blue + colors.bright);
  print('├' + line + '┤', colors.blue);
  
  users.forEach(user => {
    const text = `${user.label.padEnd(30)} → ${user.email.padEnd(35)} | Password: ${user.password}`;
    print('│ ' + text.padEnd(77) + '│', colors.yellow);
  });
  
  print('└' + line + '┘', colors.blue);
}

/**
 * Hash password using bcrypt
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Insert department and return ID
 */
async function insertDepartment(connection, name, code, description) {
  const [result] = await connection.execute(
    'INSERT INTO departments (name, code, description, is_active) VALUES (?, ?, ?, TRUE)',
    [name, code, description]
  );
  return result.insertId;
}

/**
 * Insert course and return ID
 */
async function insertCourse(connection, name, code, departmentId, duration, totalSemesters, degree) {
  const [result] = await connection.execute(
    'INSERT INTO courses (name, code, department_id, duration, total_semesters, degree, is_active) VALUES (?, ?, ?, ?, ?, ?, TRUE)',
    [name, code, departmentId, duration, totalSemesters, degree]
  );
  return result.insertId;
}

/**
 * Insert user and return ID
 */
async function insertUser(connection, userData) {
  const {
    username, email, passwordHash, firstName, lastName, role,
    departmentId = null, courseId = null, semester = null,
    section = null, enrollmentNo = null
  } = userData;

  const [result] = await connection.execute(
    `INSERT INTO users 
    (username, email, password_hash, first_name, last_name, role, department_id, course_id, semester, section, enrollment_no, is_active) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
    [username, email, passwordHash, firstName, lastName, role, departmentId, courseId, semester, section, enrollmentNo]
  );
  return result.insertId;
}

/**
 * Insert subject
 */
async function insertSubject(connection, name, code, departmentId, courseId, semester, credits, type) {
  await connection.execute(
    'INSERT INTO subjects (name, code, department_id, course_id, semester, credits, type, min_attendance, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 75, TRUE)',
    [name, code, departmentId, courseId, semester, credits, type]
  );
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================
async function seedDatabase() {
  let connection;
  const credentials = {
    admin: [],
    principal: [],
    hod: [],
    teacher: [],
    student: []
  };

  try {
    // Connect to database
    print('Connecting to MySQL database...', colors.cyan);
    connection = await mysql.createConnection(DB_CONFIG);
    print('✓ Connected successfully!', colors.green);

    // Disable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

    // Clear existing data (optional - comment out if needed)
    print('\nClearing existing data...', colors.yellow);
    await connection.execute('TRUNCATE TABLE audit_logs');
    await connection.execute('TRUNCATE TABLE attendance');
    await connection.execute('TRUNCATE TABLE class_sessions');
    await connection.execute('TRUNCATE TABLE teacher_assignments');
    await connection.execute('TRUNCATE TABLE detained_students');
    await connection.execute('TRUNCATE TABLE student_semesters');
    await connection.execute('TRUNCATE TABLE users');
    await connection.execute('TRUNCATE TABLE timetable');
    await connection.execute('TRUNCATE TABLE subjects');
    await connection.execute('TRUNCATE TABLE courses');
    await connection.execute('TRUNCATE TABLE departments');
    print('✓ Tables cleared!', colors.green);

    // ========================================================================
    // INSERT DEPARTMENTS
    // ========================================================================
    printHeader('CREATING DEPARTMENTS');
    const departments = {
      cse: await insertDepartment(connection, 'Computer Science', 'CSE', 'Department of Computer Science and Engineering'),
      ece: await insertDepartment(connection, 'Electronics', 'ECE', 'Department of Electronics and Communication Engineering'),
      me: await insertDepartment(connection, 'Mechanical', 'ME', 'Department of Mechanical Engineering'),
      ce: await insertDepartment(connection, 'Civil', 'CE', 'Department of Civil Engineering'),
      it: await insertDepartment(connection, 'Information Technology', 'IT', 'Department of Information Technology')
    };
    print('✓ 5 departments created', colors.green);

    // ========================================================================
    // INSERT COURSES
    // ========================================================================
    printHeader('CREATING COURSES');
    const courses = {
      btechCSE: await insertCourse(connection, 'Bachelor of Technology in Computer Science', 'BTech-CSE', departments.cse, 8, 8, 'bachelor'),
      btechECE: await insertCourse(connection, 'Bachelor of Technology in Electronics', 'BTech-ECE', departments.ece, 8, 8, 'bachelor'),
      btechME: await insertCourse(connection, 'Bachelor of Technology in Mechanical', 'BTech-ME', departments.me, 8, 8, 'bachelor'),
      btechCE: await insertCourse(connection, 'Bachelor of Technology in Civil', 'BTech-CE', departments.ce, 8, 8, 'bachelor'),
      btechIT: await insertCourse(connection, 'Bachelor of Technology in Information Technology', 'BTech-IT', departments.it, 8, 8, 'bachelor'),
      mtechCSE: await insertCourse(connection, 'Master of Technology in Computer Science', 'MTech-CSE', departments.cse, 4, 4, 'master')
    };
    print('✓ 6 courses created', colors.green);

    // ========================================================================
    // INSERT ADMIN USERS
    // ========================================================================
    printHeader('CREATING ADMIN USERS');
    const adminPassword = 'Admin@123';
    const adminHash = await hashPassword(adminPassword);

    await insertUser(connection, {
      username: 'admin',
      email: 'admin@campus.edu',
      passwordHash: adminHash,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin'
    });
    credentials.admin.push({ label: 'Admin', email: 'admin@campus.edu', password: adminPassword });

    await insertUser(connection, {
      username: 'super_admin',
      email: 'superadmin@campus.edu',
      passwordHash: adminHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'admin'
    });
    credentials.admin.push({ label: 'Super Admin', email: 'superadmin@campus.edu', password: adminPassword });
    print('✓ 2 admin users created', colors.green);

    // ========================================================================
    // INSERT PRINCIPAL
    // ========================================================================
    printHeader('CREATING PRINCIPAL');
    const principalPassword = 'Principal@123';
    const principalHash = await hashPassword(principalPassword);

    await insertUser(connection, {
      username: 'principal',
      email: 'principal@campus.edu',
      passwordHash: principalHash,
      firstName: 'Dr. John',
      lastName: 'Smith',
      role: 'principal'
    });
    credentials.principal.push({ label: 'Principal', email: 'principal@campus.edu', password: principalPassword });
    print('✓ 1 principal created', colors.green);

    // ========================================================================
    // INSERT HODs
    // ========================================================================
    printHeader('CREATING HODs (Heads of Department)');
    const hodPassword = 'Hod@123';
    const hodHash = await hashPassword(hodPassword);

    const hods = [
      { username: 'hod_cse', email: 'hod.cse@campus.edu', firstName: 'Dr. Sarah', lastName: 'Johnson', dept: departments.cse, label: 'CSE' },
      { username: 'hod_ece', email: 'hod.ece@campus.edu', firstName: 'Dr. Michael', lastName: 'Brown', dept: departments.ece, label: 'ECE' },
      { username: 'hod_me', email: 'hod.me@campus.edu', firstName: 'Dr. David', lastName: 'Wilson', dept: departments.me, label: 'ME' },
      { username: 'hod_ce', email: 'hod.ce@campus.edu', firstName: 'Dr. Emily', lastName: 'Davis', dept: departments.ce, label: 'CE' },
      { username: 'hod_it', email: 'hod.it@campus.edu', firstName: 'Dr. Robert', lastName: 'Martinez', dept: departments.it, label: 'IT' }
    ];

    const hodIds = {};
    for (const hod of hods) {
      const hodId = await insertUser(connection, {
        username: hod.username,
        email: hod.email,
        passwordHash: hodHash,
        firstName: hod.firstName,
        lastName: hod.lastName,
        role: 'hod',
        departmentId: hod.dept
      });
      hodIds[hod.username] = hodId;
      credentials.hod.push({ label: hod.label, email: hod.email, password: hodPassword });

      // Update department with HOD
      await connection.execute('UPDATE departments SET hod_id = ? WHERE id = ?', [hodId, hod.dept]);
    }
    print('✓ 5 HODs created and assigned', colors.green);

    // ========================================================================
    // INSERT TEACHERS
    // ========================================================================
    printHeader('CREATING TEACHERS');
    const teacherPassword = 'Teacher@123';
    const teacherHash = await hashPassword(teacherPassword);

    const teachers = [
      { username: 'teacher_cse1', email: 'teacher1.cse@campus.edu', firstName: 'Prof. Lisa', lastName: 'Anderson', dept: departments.cse, label: 'CSE Teacher 1' },
      { username: 'teacher_cse2', email: 'teacher2.cse@campus.edu', firstName: 'Prof. James', lastName: 'Thomas', dept: departments.cse, label: 'CSE Teacher 2' },
      { username: 'teacher_cse3', email: 'teacher3.cse@campus.edu', firstName: 'Prof. Mary', lastName: 'Jackson', dept: departments.cse, label: 'CSE Teacher 3' },
      { username: 'teacher_ece1', email: 'teacher1.ece@campus.edu', firstName: 'Prof. William', lastName: 'White', dept: departments.ece, label: 'ECE Teacher 1' },
      { username: 'teacher_ece2', email: 'teacher2.ece@campus.edu', firstName: 'Prof. Patricia', lastName: 'Harris', dept: departments.ece, label: 'ECE Teacher 2' },
      { username: 'teacher_me1', email: 'teacher1.me@campus.edu', firstName: 'Prof. Richard', lastName: 'Martin', dept: departments.me, label: 'ME Teacher 1' },
      { username: 'teacher_me2', email: 'teacher2.me@campus.edu', firstName: 'Prof. Jennifer', lastName: 'Thompson', dept: departments.me, label: 'ME Teacher 2' },
      { username: 'teacher_ce1', email: 'teacher1.ce@campus.edu', firstName: 'Prof. Charles', lastName: 'Garcia', dept: departments.ce, label: 'CE Teacher 1' },
      { username: 'teacher_it1', email: 'teacher1.it@campus.edu', firstName: 'Prof. Barbara', lastName: 'Rodriguez', dept: departments.it, label: 'IT Teacher 1' },
      { username: 'teacher_it2', email: 'teacher2.it@campus.edu', firstName: 'Prof. Christopher', lastName: 'Lee', dept: departments.it, label: 'IT Teacher 2' }
    ];

    for (const teacher of teachers) {
      await insertUser(connection, {
        username: teacher.username,
        email: teacher.email,
        passwordHash: teacherHash,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        role: 'teacher',
        departmentId: teacher.dept
      });
      credentials.teacher.push({ label: teacher.label, email: teacher.email, password: teacherPassword });
    }
    print('✓ 10 teachers created', colors.green);

    // ========================================================================
    // INSERT STUDENTS
    // ========================================================================
    printHeader('CREATING STUDENTS');
    const studentPassword = 'Student@123';
    const studentHash = await hashPassword(studentPassword);

    const students = [
      // CSE Students
      { username: 'student_cse001', email: 'student001.cse@campus.edu', firstName: 'Alice', lastName: 'Cooper', enrollment: 'CSE2023001', dept: departments.cse, course: courses.btechCSE, section: 'A' },
      { username: 'student_cse002', email: 'student002.cse@campus.edu', firstName: 'Bob', lastName: 'Miller', enrollment: 'CSE2023002', dept: departments.cse, course: courses.btechCSE, section: 'A' },
      { username: 'student_cse003', email: 'student003.cse@campus.edu', firstName: 'Charlie', lastName: 'Davis', enrollment: 'CSE2023003', dept: departments.cse, course: courses.btechCSE, section: 'A' },
      { username: 'student_cse004', email: 'student004.cse@campus.edu', firstName: 'Diana', lastName: 'Wilson', enrollment: 'CSE2023004', dept: departments.cse, course: courses.btechCSE, section: 'A' },
      { username: 'student_cse005', email: 'student005.cse@campus.edu', firstName: 'Ethan', lastName: 'Moore', enrollment: 'CSE2023005', dept: departments.cse, course: courses.btechCSE, section: 'A' },
      { username: 'student_cse006', email: 'student006.cse@campus.edu', firstName: 'Fiona', lastName: 'Taylor', enrollment: 'CSE2023006', dept: departments.cse, course: courses.btechCSE, section: 'B' },
      { username: 'student_cse007', email: 'student007.cse@campus.edu', firstName: 'George', lastName: 'Anderson', enrollment: 'CSE2023007', dept: departments.cse, course: courses.btechCSE, section: 'B' },
      { username: 'student_cse008', email: 'student008.cse@campus.edu', firstName: 'Hannah', lastName: 'Thomas', enrollment: 'CSE2023008', dept: departments.cse, course: courses.btechCSE, section: 'B' },
      // ECE Students
      { username: 'student_ece001', email: 'student001.ece@campus.edu', firstName: 'Ian', lastName: 'Jackson', enrollment: 'ECE2023001', dept: departments.ece, course: courses.btechECE, section: 'A' },
      { username: 'student_ece002', email: 'student002.ece@campus.edu', firstName: 'Julia', lastName: 'White', enrollment: 'ECE2023002', dept: departments.ece, course: courses.btechECE, section: 'A' },
      // IT Students
      { username: 'student_it001', email: 'student001.it@campus.edu', firstName: 'Kevin', lastName: 'Harris', enrollment: 'IT2023001', dept: departments.it, course: courses.btechIT, section: 'A' },
      { username: 'student_it002', email: 'student002.it@campus.edu', firstName: 'Laura', lastName: 'Martin', enrollment: 'IT2023002', dept: departments.it, course: courses.btechIT, section: 'A' }
    ];

    for (const student of students) {
      await insertUser(connection, {
        username: student.username,
        email: student.email,
        passwordHash: studentHash,
        firstName: student.firstName,
        lastName: student.lastName,
        role: 'student',
        departmentId: student.dept,
        courseId: student.course,
        semester: 3,
        section: student.section,
        enrollmentNo: student.enrollment
      });
      credentials.student.push({ label: student.enrollment, email: student.email, password: studentPassword });
    }
    print('✓ 12 students created', colors.green);

    // ========================================================================
    // INSERT SUBJECTS
    // ========================================================================
    printHeader('CREATING SUBJECTS');
    await insertSubject(connection, 'Data Structures', 'CSE301', departments.cse, courses.btechCSE, 3, 4, 'theory');
    await insertSubject(connection, 'Database Management Systems', 'CSE302', departments.cse, courses.btechCSE, 3, 4, 'theory');
    await insertSubject(connection, 'Operating Systems', 'CSE303', departments.cse, courses.btechCSE, 3, 4, 'theory');
    await insertSubject(connection, 'Computer Networks', 'CSE304', departments.cse, courses.btechCSE, 3, 3, 'theory');
    await insertSubject(connection, 'Data Structures Lab', 'CSE305', departments.cse, courses.btechCSE, 3, 2, 'lab');
    await insertSubject(connection, 'Signals and Systems', 'ECE301', departments.ece, courses.btechECE, 3, 4, 'theory');
    await insertSubject(connection, 'Digital Electronics', 'ECE302', departments.ece, courses.btechECE, 3, 4, 'theory');
    await insertSubject(connection, 'Object Oriented Programming', 'IT301', departments.it, courses.btechIT, 3, 4, 'theory');
    await insertSubject(connection, 'Web Technologies', 'IT302', departments.it, courses.btechIT, 3, 4, 'theory');
    print('✓ 9 subjects created', colors.green);

    // ========================================================================
    // INSERT SEMESTERS
    // ========================================================================
    printHeader('CREATING SEMESTERS');
    await connection.execute(
      "INSERT INTO semesters (name, academic_year, start_date, end_date, is_current, is_active) VALUES ('Semester 1 (2024-2025)', '2024-2025', '2024-08-01', '2024-12-31', FALSE, TRUE)"
    );
    await connection.execute(
      "INSERT INTO semesters (name, academic_year, start_date, end_date, is_current, is_active) VALUES ('Semester 2 (2024-2025)', '2024-2025', '2025-01-01', '2025-05-31', TRUE, TRUE)"
    );
    print('✓ 2 semesters created', colors.green);

    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

    // ========================================================================
    // DISPLAY CREDENTIALS
    // ========================================================================
    printHeader('CAMPUS CHECK-IN SYSTEM - SEED DATA CREATED');
    
    print('\n🔐 DEFAULT LOGIN CREDENTIALS:', colors.bright + colors.cyan);
    
    printCredentials('ADMIN ACCOUNTS', credentials.admin);
    printCredentials('PRINCIPAL ACCOUNT', credentials.principal);
    printCredentials('HEAD OF DEPARTMENT (HOD) ACCOUNTS', credentials.hod);
    printCredentials('TEACHER ACCOUNTS', credentials.teacher);
    printCredentials('STUDENT ACCOUNTS (Sample)', credentials.student.slice(0, 5));
    
    print('\n' + '─'.repeat(78), colors.blue);
    print('│ ⓘ Total ' + credentials.student.length + ' students created across departments'.padEnd(76) + ' │', colors.blue);
    print('─'.repeat(78) + '\n', colors.blue);

    // Statistics
    printHeader('DATABASE STATISTICS');
    print('• Departments: 5', colors.yellow);
    print('• Courses: 6', colors.yellow);
    print('• Subjects: 9', colors.yellow);
    print('• Users: ' + (credentials.admin.length + credentials.principal.length + credentials.hod.length + credentials.teacher.length + credentials.student.length), colors.yellow);
    print('• Semesters: 2\n', colors.yellow);

    // Next steps
    printHeader('NEXT STEPS');
    print('1. Login with any account above', colors.green);
    print('2. Navigate to your role-specific dashboard', colors.green);
    print('3. Start marking attendance (Teachers)', colors.green);
    print('4. View reports (Admin/HOD)', colors.green);
    print('5. Check attendance (Students)\n', colors.green);

    // Security warning
    print('⚠️  SECURITY WARNING:', colors.yellow + colors.bright);
    print('   Change all default passwords before deploying to production!\n', colors.yellow);

    printHeader('✨ SEED COMPLETED SUCCESSFULLY! 🎓');

  } catch (error) {
    print('\n❌ ERROR: ' + error.message, colors.reset);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      print('Connection closed.', colors.cyan);
    }
  }
}

// ============================================================================
// RUN THE SCRIPT
// ============================================================================
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
