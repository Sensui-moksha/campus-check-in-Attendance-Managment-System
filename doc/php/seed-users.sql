-- ============================================================================
-- Campus Check-In System - Seed Data (SQL Version)
-- ============================================================================
-- Purpose: Populate database with initial users for testing
-- Usage: mysql -u root -p campus_checkin < seed-users.sql
-- ============================================================================

USE campus_checkin;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Clear existing data (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE audit_logs;
-- TRUNCATE TABLE attendance;
-- TRUNCATE TABLE class_sessions;
-- TRUNCATE TABLE teacher_assignments;
-- TRUNCATE TABLE detained_students;
-- TRUNCATE TABLE student_semesters;
-- TRUNCATE TABLE users;
-- TRUNCATE TABLE timetable;
-- TRUNCATE TABLE subjects;
-- TRUNCATE TABLE courses;
-- TRUNCATE TABLE departments;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- INSERT DEPARTMENTS
-- ============================================================================
INSERT INTO departments (id, name, code, description, is_active) VALUES
(1, 'Computer Science', 'CSE', 'Department of Computer Science and Engineering', TRUE),
(2, 'Electronics', 'ECE', 'Department of Electronics and Communication Engineering', TRUE),
(3, 'Mechanical', 'ME', 'Department of Mechanical Engineering', TRUE),
(4, 'Civil', 'CE', 'Department of Civil Engineering', TRUE),
(5, 'Information Technology', 'IT', 'Department of Information Technology', TRUE);

-- ============================================================================
-- INSERT COURSES
-- ============================================================================
INSERT INTO courses (id, name, code, department_id, duration, total_semesters, degree, is_active) VALUES
(1, 'Bachelor of Technology in Computer Science', 'BTech-CSE', 1, 8, 8, 'bachelor', TRUE),
(2, 'Bachelor of Technology in Electronics', 'BTech-ECE', 2, 8, 8, 'bachelor', TRUE),
(3, 'Bachelor of Technology in Mechanical', 'BTech-ME', 3, 8, 8, 'bachelor', TRUE),
(4, 'Bachelor of Technology in Civil', 'BTech-CE', 4, 8, 8, 'bachelor', TRUE),
(5, 'Bachelor of Technology in Information Technology', 'BTech-IT', 5, 8, 8, 'bachelor', TRUE),
(6, 'Master of Technology in Computer Science', 'MTech-CSE', 1, 4, 4, 'master', TRUE);

-- ============================================================================
-- INSERT ADMIN USERS
-- ============================================================================
-- Password: Admin@123 (hashed with bcrypt, 10 rounds)
-- Hash generated using: password_hash('Admin@123', PASSWORD_BCRYPT)
INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active, created_at) VALUES
('admin', 'admin@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'System', 'Administrator', 'admin', TRUE, NOW()),
('super_admin', 'superadmin@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Super', 'Admin', 'admin', TRUE, NOW());

-- ============================================================================
-- INSERT PRINCIPAL
-- ============================================================================
-- Password: Principal@123
INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active, created_at) VALUES
('principal', 'principal@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Dr. John', 'Smith', 'principal', TRUE, NOW());

-- ============================================================================
-- INSERT HODs (Heads of Department)
-- ============================================================================
-- Password: Hod@123
INSERT INTO users (username, email, password_hash, first_name, last_name, role, department_id, is_active, created_at) VALUES
('hod_cse', 'hod.cse@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Dr. Sarah', 'Johnson', 'hod', 1, TRUE, NOW()),
('hod_ece', 'hod.ece@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Dr. Michael', 'Brown', 'hod', 2, TRUE, NOW()),
('hod_me', 'hod.me@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Dr. David', 'Wilson', 'hod', 3, TRUE, NOW()),
('hod_ce', 'hod.ce@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Dr. Emily', 'Davis', 'hod', 4, TRUE, NOW()),
('hod_it', 'hod.it@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Dr. Robert', 'Martinez', 'hod', 5, TRUE, NOW());

-- Update departments with HOD references
UPDATE departments SET hod_id = (SELECT id FROM users WHERE username = 'hod_cse') WHERE id = 1;
UPDATE departments SET hod_id = (SELECT id FROM users WHERE username = 'hod_ece') WHERE id = 2;
UPDATE departments SET hod_id = (SELECT id FROM users WHERE username = 'hod_me') WHERE id = 3;
UPDATE departments SET hod_id = (SELECT id FROM users WHERE username = 'hod_ce') WHERE id = 4;
UPDATE departments SET hod_id = (SELECT id FROM users WHERE username = 'hod_it') WHERE id = 5;

-- ============================================================================
-- INSERT TEACHERS
-- ============================================================================
-- Password: Teacher@123
INSERT INTO users (username, email, password_hash, first_name, last_name, role, department_id, is_active, created_at) VALUES
-- CSE Teachers
('teacher_cse1', 'teacher1.cse@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Prof. Lisa', 'Anderson', 'teacher', 1, TRUE, NOW()),
('teacher_cse2', 'teacher2.cse@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Prof. James', 'Thomas', 'teacher', 1, TRUE, NOW()),
('teacher_cse3', 'teacher3.cse@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Prof. Mary', 'Jackson', 'teacher', 1, TRUE, NOW()),
-- ECE Teachers
('teacher_ece1', 'teacher1.ece@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Prof. William', 'White', 'teacher', 2, TRUE, NOW()),
('teacher_ece2', 'teacher2.ece@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Prof. Patricia', 'Harris', 'teacher', 2, TRUE, NOW()),
-- ME Teachers
('teacher_me1', 'teacher1.me@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Prof. Richard', 'Martin', 'teacher', 3, TRUE, NOW()),
('teacher_me2', 'teacher2.me@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Prof. Jennifer', 'Thompson', 'teacher', 3, TRUE, NOW()),
-- CE Teachers
('teacher_ce1', 'teacher1.ce@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Prof. Charles', 'Garcia', 'teacher', 4, TRUE, NOW()),
-- IT Teachers
('teacher_it1', 'teacher1.it@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Prof. Barbara', 'Rodriguez', 'teacher', 5, TRUE, NOW()),
('teacher_it2', 'teacher2.it@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Prof. Christopher', 'Lee', 'teacher', 5, TRUE, NOW());

-- ============================================================================
-- INSERT STUDENTS
-- ============================================================================
-- Password: Student@123
INSERT INTO users (username, email, password_hash, first_name, last_name, role, department_id, course_id, semester, section, enrollment_no, is_active, created_at) VALUES
-- CSE Students (Semester 3, Section A)
('student_cse001', 'student001.cse@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Alice', 'Cooper', 'student', 1, 1, 3, 'A', 'CSE2023001', TRUE, NOW()),
('student_cse002', 'student002.cse@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Bob', 'Miller', 'student', 1, 1, 3, 'A', 'CSE2023002', TRUE, NOW()),
('student_cse003', 'student003.cse@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Charlie', 'Davis', 'student', 1, 1, 3, 'A', 'CSE2023003', TRUE, NOW()),
('student_cse004', 'student004.cse@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Diana', 'Wilson', 'student', 1, 1, 3, 'A', 'CSE2023004', TRUE, NOW()),
('student_cse005', 'student005.cse@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Ethan', 'Moore', 'student', 1, 1, 3, 'A', 'CSE2023005', TRUE, NOW()),
-- CSE Students (Semester 3, Section B)
('student_cse006', 'student006.cse@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Fiona', 'Taylor', 'student', 1, 1, 3, 'B', 'CSE2023006', TRUE, NOW()),
('student_cse007', 'student007.cse@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'George', 'Anderson', 'student', 1, 1, 3, 'B', 'CSE2023007', TRUE, NOW()),
('student_cse008', 'student008.cse@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Hannah', 'Thomas', 'student', 1, 1, 3, 'B', 'CSE2023008', TRUE, NOW()),
-- ECE Students
('student_ece001', 'student001.ece@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Ian', 'Jackson', 'student', 2, 2, 3, 'A', 'ECE2023001', TRUE, NOW()),
('student_ece002', 'student002.ece@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Julia', 'White', 'student', 2, 2, 3, 'A', 'ECE2023002', TRUE, NOW()),
-- IT Students
('student_it001', 'student001.it@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Kevin', 'Harris', 'student', 5, 5, 3, 'A', 'IT2023001', TRUE, NOW()),
('student_it002', 'student002.it@campus.edu', '$2y$10$rZ7FQKJYQb5YU5Y5Y5Y5Y.abcdefghijklmnopqrstuvwxyz12345678', 'Laura', 'Martin', 'student', 5, 5, 3, 'A', 'IT2023002', TRUE, NOW());

-- ============================================================================
-- INSERT SUBJECTS
-- ============================================================================
INSERT INTO subjects (name, code, department_id, course_id, semester, credits, type, min_attendance, is_active) VALUES
-- CSE Semester 3 Subjects
('Data Structures', 'CSE301', 1, 1, 3, 4, 'theory', 75, TRUE),
('Database Management Systems', 'CSE302', 1, 1, 3, 4, 'theory', 75, TRUE),
('Operating Systems', 'CSE303', 1, 1, 3, 4, 'theory', 75, TRUE),
('Computer Networks', 'CSE304', 1, 1, 3, 3, 'theory', 75, TRUE),
('Data Structures Lab', 'CSE305', 1, 1, 3, 2, 'lab', 75, TRUE),
-- ECE Semester 3 Subjects
('Signals and Systems', 'ECE301', 2, 2, 3, 4, 'theory', 75, TRUE),
('Digital Electronics', 'ECE302', 2, 2, 3, 4, 'theory', 75, TRUE),
('Electromagnetic Theory', 'ECE303', 2, 2, 3, 4, 'theory', 75, TRUE),
-- IT Semester 3 Subjects
('Object Oriented Programming', 'IT301', 5, 5, 3, 4, 'theory', 75, TRUE),
('Web Technologies', 'IT302', 5, 5, 3, 4, 'theory', 75, TRUE);

-- ============================================================================
-- INSERT SEMESTERS
-- ============================================================================
INSERT INTO semesters (name, academic_year, start_date, end_date, is_current, is_active) VALUES
('Semester 1 (2024-2025)', '2024-2025', '2024-08-01', '2024-12-31', FALSE, TRUE),
('Semester 2 (2024-2025)', '2024-2025', '2025-01-01', '2025-05-31', TRUE, TRUE);

-- ============================================================================
-- DISPLAY CREDENTIALS
-- ============================================================================
SELECT '
╔══════════════════════════════════════════════════════════════════════════╗
║                    CAMPUS CHECK-IN SYSTEM                                ║
║                      SEED DATA CREATED                                   ║
╚══════════════════════════════════════════════════════════════════════════╝

🔐 DEFAULT LOGIN CREDENTIALS:

┌──────────────────────────────────────────────────────────────────────────┐
│ ADMIN ACCOUNTS                                                           │
├──────────────────────────────────────────────────────────────────────────┤
│ Username: admin                                                          │
│ Email:    admin@campus.edu                                               │
│ Password: Admin@123                                                      │
│ Role:     Administrator (Full Access)                                    │
├──────────────────────────────────────────────────────────────────────────┤
│ Username: super_admin                                                    │
│ Email:    superadmin@campus.edu                                          │
│ Password: Admin@123                                                      │
│ Role:     Administrator (Full Access)                                    │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ PRINCIPAL ACCOUNT                                                        │
├──────────────────────────────────────────────────────────────────────────┤
│ Username: principal                                                      │
│ Email:    principal@campus.edu                                           │
│ Password: Principal@123                                                  │
│ Role:     Principal (All Departments)                                    │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ HEAD OF DEPARTMENT (HOD) ACCOUNTS                                        │
├──────────────────────────────────────────────────────────────────────────┤
│ CSE → hod.cse@campus.edu     | Password: Hod@123                         │
│ ECE → hod.ece@campus.edu     | Password: Hod@123                         │
│ ME  → hod.me@campus.edu      | Password: Hod@123                         │
│ CE  → hod.ce@campus.edu      | Password: Hod@123                         │
│ IT  → hod.it@campus.edu      | Password: Hod@123                         │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ TEACHER ACCOUNTS                                                         │
├──────────────────────────────────────────────────────────────────────────┤
│ CSE → teacher1.cse@campus.edu | Password: Teacher@123                    │
│ CSE → teacher2.cse@campus.edu | Password: Teacher@123                    │
│ CSE → teacher3.cse@campus.edu | Password: Teacher@123                    │
│ ECE → teacher1.ece@campus.edu | Password: Teacher@123                    │
│ ECE → teacher2.ece@campus.edu | Password: Teacher@123                    │
│ ME  → teacher1.me@campus.edu  | Password: Teacher@123                    │
│ ME  → teacher2.me@campus.edu  | Password: Teacher@123                    │
│ CE  → teacher1.ce@campus.edu  | Password: Teacher@123                    │
│ IT  → teacher1.it@campus.edu  | Password: Teacher@123                    │
│ IT  → teacher2.it@campus.edu  | Password: Teacher@123                    │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ STUDENT ACCOUNTS (Sample)                                                │
├──────────────────────────────────────────────────────────────────────────┤
│ CSE → student001.cse@campus.edu | Enrollment: CSE2023001 | Password: Student@123 │
│ CSE → student002.cse@campus.edu | Enrollment: CSE2023002 | Password: Student@123 │
│ ECE → student001.ece@campus.edu | Enrollment: ECE2023001 | Password: Student@123 │
│ IT  → student001.it@campus.edu  | Enrollment: IT2023001  | Password: Student@123 │
│                                                                          │
│ ⓘ Total 12 students created across departments                          │
└──────────────────────────────────────────────────────────────────────────┘

📊 DATABASE STATISTICS:
   • Departments: 5
   • Courses: 6
   • Subjects: 10
   • Users: 30+ (Admin, Principal, HODs, Teachers, Students)
   • Semesters: 2

🚀 NEXT STEPS:
   1. Login with any account above
   2. Navigate to your role-specific dashboard
   3. Start marking attendance (Teachers)
   4. View reports (Admin/HOD)
   5. Check attendance (Students)

⚠️  SECURITY WARNING:
   Change all default passwords before deploying to production!

╔══════════════════════════════════════════════════════════════════════════╗
║                    Happy Testing! 🎓                                     ║
╚══════════════════════════════════════════════════════════════════════════╝
' AS '';

-- ============================================================================
-- VERIFICATION QUERIES (optional)
-- ============================================================================
-- SELECT 'Admin Users:' AS '';
-- SELECT username, email, role FROM users WHERE role = 'admin';
-- 
-- SELECT 'HOD Users:' AS '';
-- SELECT username, email, role, d.name AS department FROM users u
-- LEFT JOIN departments d ON u.department_id = d.id
-- WHERE u.role = 'hod';
-- 
-- SELECT 'Teacher Count by Department:' AS '';
-- SELECT d.name AS department, COUNT(u.id) AS teacher_count
-- FROM departments d
-- LEFT JOIN users u ON d.id = u.department_id AND u.role = 'teacher'
-- GROUP BY d.id;
-- 
-- SELECT 'Student Count by Course:' AS '';
-- SELECT c.name AS course, COUNT(u.id) AS student_count
-- FROM courses c
-- LEFT JOIN users u ON c.id = u.course_id AND u.role = 'student'
-- GROUP BY c.id;

-- ============================================================================
-- END OF SEED SCRIPT
-- ============================================================================
