-- ============================================================================
-- Campus Check-In System - MySQL Database Schema
-- ============================================================================
-- Purpose: Complete SQL schema for migrating from MongoDB to MySQL/PHP
-- Version: 1.0
-- Database: MySQL 8.0+
-- Character Set: utf8mb4 (supports emojis and international characters)
-- Collation: utf8mb4_unicode_ci
-- ============================================================================

-- Drop existing database and create fresh
DROP DATABASE IF EXISTS campus_checkin;
CREATE DATABASE campus_checkin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE campus_checkin;

-- ============================================================================
-- TABLE: departments
-- Purpose: Store department information
-- ============================================================================
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    hod_id INT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_hod (hod_id)
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE: courses
-- Purpose: Store course/program information
-- ============================================================================
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    department_id INT NOT NULL,
    duration INT NOT NULL COMMENT 'Duration in semesters',
    total_semesters INT NOT NULL,
    degree ENUM('bachelor', 'master', 'diploma') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_department (department_id),
    INDEX idx_code (code),
    UNIQUE KEY unique_course (department_id, code),
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE: users
-- Purpose: Store all users (admin, teachers, students, etc.)
-- ============================================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL COMMENT 'bcrypt hashed password',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'principal', 'hod', 'teacher', 'student') NOT NULL,
    department_id INT NULL,
    course_id INT NULL,
    semester INT NULL,
    section VARCHAR(10) NULL,
    enrollment_no VARCHAR(50) NULL UNIQUE COMMENT 'For students',
    phone_number VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_department (department_id),
    INDEX idx_course (course_id),
    INDEX idx_enrollment (enrollment_no),
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE: subjects
-- Purpose: Store subject/course information
-- ============================================================================
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    department_id INT NOT NULL,
    course_id INT NOT NULL,
    semester INT NOT NULL,
    credits INT NOT NULL,
    type ENUM('theory', 'practical', 'lab') DEFAULT 'theory',
    min_attendance INT DEFAULT 75 COMMENT 'Minimum attendance percentage required',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_department (department_id),
    INDEX idx_course (course_id),
    INDEX idx_semester (semester),
    INDEX idx_code (code),
    UNIQUE KEY unique_subject (department_id, course_id, semester, code),
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE: timetable
-- Purpose: Store timetable entries for all classes
-- ============================================================================
CREATE TABLE timetable (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    course_id INT NOT NULL,
    semester INT NOT NULL,
    section VARCHAR(10) NOT NULL,
    day_of_week TINYINT NOT NULL COMMENT '0=Sunday, 1=Monday, ... 6=Saturday',
    period INT NOT NULL,
    subject_id INT NOT NULL,
    teacher_id INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_department (department_id),
    INDEX idx_course (course_id),
    INDEX idx_teacher (teacher_id),
    INDEX idx_subject (subject_id),
    INDEX idx_day (day_of_week),
    UNIQUE KEY unique_timetable (department_id, course_id, semester, section, day_of_week, period),
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE: class_sessions
-- Purpose: Store individual class session records
-- ============================================================================
CREATE TABLE class_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    teacher_id INT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    period INT NOT NULL,
    course_id INT NOT NULL,
    semester INT NOT NULL,
    section VARCHAR(10) NOT NULL,
    department_id INT NOT NULL,
    timetable_id INT NULL,
    total_students INT DEFAULT 0,
    present_count INT DEFAULT 0,
    absent_count INT DEFAULT 0,
    attendance_marked BOOLEAN DEFAULT FALSE,
    marked_at TIMESTAMP NULL,
    status ENUM('scheduled', 'conducted', 'cancelled') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_subject (subject_id),
    INDEX idx_teacher (teacher_id),
    INDEX idx_date (date),
    INDEX idx_department (department_id),
    INDEX idx_course (course_id),
    INDEX idx_status (status),
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (timetable_id) REFERENCES timetable(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE: attendance
-- Purpose: Store individual student attendance records
-- ============================================================================
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    session_id INT NOT NULL,
    subject_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
    marked_by INT NOT NULL,
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INT NULL,
    updated_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student (student_id),
    INDEX idx_session (session_id),
    INDEX idx_subject (subject_id),
    INDEX idx_date (date),
    INDEX idx_status (status),
    UNIQUE KEY unique_attendance (student_id, session_id),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES class_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE: teacher_assignments
-- Purpose: Store teacher-subject assignments
-- ============================================================================
CREATE TABLE teacher_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    subject_id INT NOT NULL,
    course_id INT NOT NULL,
    semester INT NOT NULL,
    sections VARCHAR(255) NOT NULL COMMENT 'Comma-separated section names',
    academic_year VARCHAR(20) NOT NULL,
    assigned_by INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_teacher (teacher_id),
    INDEX idx_subject (subject_id),
    INDEX idx_course (course_id),
    INDEX idx_academic_year (academic_year),
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE: semesters
-- Purpose: Store academic semester information
-- ============================================================================
CREATE TABLE semesters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_academic_year (academic_year),
    INDEX idx_current (is_current),
    UNIQUE KEY unique_semester (name, academic_year)
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE: student_semesters
-- Purpose: Track student progression through semesters
-- ============================================================================
CREATE TABLE student_semesters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    semester INT NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    section VARCHAR(10) NOT NULL,
    status ENUM('active', 'detained', 'completed') DEFAULT 'active',
    promoted_from INT NULL,
    promoted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student (student_id),
    INDEX idx_semester (semester),
    INDEX idx_academic_year (academic_year),
    INDEX idx_status (status),
    UNIQUE KEY unique_student_semester (student_id, semester, academic_year),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE: detained_students
-- Purpose: Store student detention records
-- ============================================================================
CREATE TABLE detained_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    semester INT NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    attendance_percentage DECIMAL(5,2) NOT NULL,
    total_classes INT NOT NULL,
    attended_classes INT NOT NULL,
    detained_by INT NOT NULL,
    detained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    status ENUM('detained', 'cleared', 'pending') DEFAULT 'detained',
    cleared_by INT NULL,
    cleared_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student (student_id),
    INDEX idx_subject (subject_id),
    INDEX idx_semester (semester),
    INDEX idx_status (status),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (detained_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (cleared_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE: audit_logs
-- Purpose: Track all important system actions for security
-- ============================================================================
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id INT NULL,
    changes JSON NULL COMMENT 'JSON object with old and new values',
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_entity (entity, entity_id),
    INDEX idx_timestamp (timestamp),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE: export_templates
-- Purpose: Store custom export templates
-- ============================================================================
CREATE TABLE export_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('attendance', 'report', 'student') NOT NULL,
    columns JSON NOT NULL COMMENT 'Array of column names',
    filters JSON NULL COMMENT 'Filter configuration',
    created_by INT NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_created_by (created_by),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE: system_settings
-- Purpose: Store system-wide configuration settings
-- ============================================================================
CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value JSON NOT NULL,
    description TEXT,
    category ENUM('general', 'attendance', 'notification', 'security') DEFAULT 'general',
    is_public BOOLEAN DEFAULT FALSE,
    updated_by INT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_key (setting_key),
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE: password_resets
-- Purpose: Store password reset tokens
-- ============================================================================
CREATE TABLE password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE: sessions (for PHP session management)
-- Purpose: Store user session data
-- ============================================================================
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    payload TEXT NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_last_activity (last_activity),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS (that require forward references)
-- ============================================================================
ALTER TABLE departments
ADD CONSTRAINT fk_departments_hod
FOREIGN KEY (hod_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- DEFAULT DATA INSERTION
-- ============================================================================

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description, category, is_public) VALUES
('min_attendance_percentage', '75', 'Minimum attendance percentage required', 'attendance', TRUE),
('max_file_upload_size', '5242880', 'Maximum file upload size in bytes (5MB)', 'general', TRUE),
('academic_year', '"2024-2025"', 'Current academic year', 'general', TRUE),
('enable_notifications', 'true', 'Enable system notifications', 'notification', FALSE),
('session_timeout', '3600', 'Session timeout in seconds (1 hour)', 'security', FALSE);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Student attendance summary
CREATE VIEW view_student_attendance_summary AS
SELECT 
    u.id AS student_id,
    u.first_name,
    u.last_name,
    u.enrollment_no,
    s.id AS subject_id,
    s.name AS subject_name,
    s.code AS subject_code,
    COUNT(a.id) AS total_classes,
    SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS classes_attended,
    SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS classes_absent,
    ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100, 2) AS attendance_percentage
FROM users u
INNER JOIN attendance a ON u.id = a.student_id
INNER JOIN subjects s ON a.subject_id = s.id
WHERE u.role = 'student'
GROUP BY u.id, s.id;

-- View: Teacher class schedule
CREATE VIEW view_teacher_schedule AS
SELECT 
    t.id AS timetable_id,
    u.id AS teacher_id,
    u.first_name,
    u.last_name,
    s.name AS subject_name,
    s.code AS subject_code,
    c.name AS course_name,
    d.name AS department_name,
    t.day_of_week,
    t.period,
    t.start_time,
    t.end_time,
    t.room,
    t.semester,
    t.section
FROM timetable t
INNER JOIN users u ON t.teacher_id = u.id
INNER JOIN subjects s ON t.subject_id = s.id
INNER JOIN courses c ON t.course_id = c.id
INNER JOIN departments d ON t.department_id = d.id
WHERE t.is_active = TRUE AND u.role = 'teacher';

-- View: Department statistics
CREATE VIEW view_department_stats AS
SELECT 
    d.id AS department_id,
    d.name AS department_name,
    d.code AS department_code,
    COUNT(DISTINCT c.id) AS total_courses,
    COUNT(DISTINCT s.id) AS total_subjects,
    COUNT(DISTINCT CASE WHEN u.role = 'teacher' THEN u.id END) AS total_teachers,
    COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.id END) AS total_students
FROM departments d
LEFT JOIN courses c ON d.id = c.department_id
LEFT JOIN subjects s ON d.id = s.department_id
LEFT JOIN users u ON d.id = u.department_id
WHERE d.is_active = TRUE
GROUP BY d.id;

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

DELIMITER //

-- Procedure: Calculate student attendance percentage for a subject
CREATE PROCEDURE sp_calculate_attendance(
    IN p_student_id INT,
    IN p_subject_id INT,
    OUT p_percentage DECIMAL(5,2)
)
BEGIN
    DECLARE total INT;
    DECLARE present INT;
    
    SELECT COUNT(*) INTO total
    FROM attendance
    WHERE student_id = p_student_id AND subject_id = p_subject_id;
    
    SELECT COUNT(*) INTO present
    FROM attendance
    WHERE student_id = p_student_id 
        AND subject_id = p_subject_id 
        AND status = 'present';
    
    IF total > 0 THEN
        SET p_percentage = (present / total) * 100;
    ELSE
        SET p_percentage = 0;
    END IF;
END//

-- Procedure: Mark attendance for entire class
CREATE PROCEDURE sp_bulk_mark_attendance(
    IN p_session_id INT,
    IN p_marked_by INT,
    IN p_attendance_data JSON
)
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE student_id INT;
    DECLARE status VARCHAR(20);
    DECLARE total INT;
    
    SET total = JSON_LENGTH(p_attendance_data);
    
    WHILE i < total DO
        SET student_id = JSON_EXTRACT(p_attendance_data, CONCAT('$[', i, '].student_id'));
        SET status = JSON_UNQUOTE(JSON_EXTRACT(p_attendance_data, CONCAT('$[', i, '].status')));
        
        INSERT INTO attendance (student_id, session_id, subject_id, date, status, marked_by)
        SELECT 
            student_id,
            p_session_id,
            cs.subject_id,
            cs.date,
            status,
            p_marked_by
        FROM class_sessions cs
        WHERE cs.id = p_session_id;
        
        SET i = i + 1;
    END WHILE;
    
    -- Update session counts
    UPDATE class_sessions cs
    SET 
        present_count = (SELECT COUNT(*) FROM attendance WHERE session_id = p_session_id AND status = 'present'),
        absent_count = (SELECT COUNT(*) FROM attendance WHERE session_id = p_session_id AND status = 'absent'),
        attendance_marked = TRUE,
        marked_at = NOW()
    WHERE cs.id = p_session_id;
END//

DELIMITER ;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DELIMITER //

-- Trigger: Update session statistics when attendance is marked
CREATE TRIGGER trg_attendance_after_insert
AFTER INSERT ON attendance
FOR EACH ROW
BEGIN
    UPDATE class_sessions
    SET 
        present_count = (SELECT COUNT(*) FROM attendance WHERE session_id = NEW.session_id AND status = 'present'),
        absent_count = (SELECT COUNT(*) FROM attendance WHERE session_id = NEW.session_id AND status = 'absent')
    WHERE id = NEW.session_id;
END//

-- Trigger: Log user updates
CREATE TRIGGER trg_user_after_update
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, action, entity, entity_id, changes)
    VALUES (
        NEW.id,
        'UPDATE',
        'users',
        NEW.id,
        JSON_OBJECT(
            'old', JSON_OBJECT('email', OLD.email, 'role', OLD.role),
            'new', JSON_OBJECT('email', NEW.email, 'role', NEW.role)
        )
    );
END//

DELIMITER ;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite indexes for common queries
CREATE INDEX idx_attendance_student_subject_date ON attendance(student_id, subject_id, date);
CREATE INDEX idx_session_date_teacher ON class_sessions(date, teacher_id);
CREATE INDEX idx_timetable_course_semester_section ON timetable(course_id, semester, section);

-- ============================================================================
-- GRANTS (adjust as needed for your PHP user)
-- ============================================================================

-- CREATE USER 'campus_user'@'localhost' IDENTIFIED BY 'strong_password_here';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON campus_checkin.* TO 'campus_user'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
