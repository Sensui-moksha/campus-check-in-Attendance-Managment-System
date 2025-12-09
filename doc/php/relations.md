# Database Relations & Entity Relationships

## 📊 Entity Relationship Diagram (ERD)

```
┌─────────────────┐
│   departments   │
│─────────────────│
│ PK: id          │
│ name            │
│ code            │
│ FK: hod_id ────┐│
└─────────────────┘│
         │         │
         │         │
         ▼         │
┌─────────────────┐│
│     courses     ││
│─────────────────││
│ PK: id          ││
│ name            ││
│ code            ││
│ FK: department_id
└─────────────────┘│
         │         │
         │         │
         ▼         │
┌─────────────────┐│
│     subjects    ││
│─────────────────││
│ PK: id          ││
│ name            ││
│ code            ││
│ FK: department_id
│ FK: course_id   ││
│ semester        ││
└─────────────────┘│
         │         │
         │         │
         ├─────────┼───────────────────────┐
         │         │                       │
         ▼         ▼                       ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    timetable    │  │  class_sessions │  │teacher_assignments
│─────────────────│  │─────────────────│  │─────────────────│
│ PK: id          │  │ PK: id          │  │ PK: id          │
│ FK: department_id  │ FK: subject_id  │  │ FK: teacher_id  │
│ FK: course_id   │  │ FK: teacher_id  │  │ FK: subject_id  │
│ FK: subject_id  │  │ FK: department_id  │ FK: course_id   │
│ FK: teacher_id  │  │ FK: course_id   │  │ sections        │
│ day_of_week     │  │ date            │  │ academic_year   │
│ period          │  │ period          │  └─────────────────┘
└─────────────────┘  │ status          │           │
         │           └─────────────────┘           │
         │                    │                    │
         │                    │                    │
         │                    ▼                    │
         │           ┌─────────────────┐           │
         │           │   attendance    │           │
         │           │─────────────────│           │
         │           │ PK: id          │           │
         │           │ FK: student_id  │◄──────────┤
         │           │ FK: session_id  │           │
         │           │ FK: subject_id  │           │
         │           │ date            │           │
         │           │ status          │           │
         │           │ FK: marked_by   │           │
         │           └─────────────────┘           │
         │                    │                    │
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────────────────────────────────────────────┐
│                      users                           │
│──────────────────────────────────────────────────────│
│ PK: id                                               │
│ username, email, password_hash                       │
│ role (admin/principal/hod/teacher/student)           │
│ FK: department_id, course_id                         │
│ semester, section, enrollment_no                     │
└──────────────────────────────────────────────────────┘
         │
         │
         ├──────────────┬──────────────┬──────────────┐
         │              │              │              │
         ▼              ▼              ▼              ▼
┌─────────────────┐┌─────────────────┐┌─────────────────┐┌─────────────────┐
│student_semesters││detained_students││  audit_logs     ││  sessions       │
│─────────────────││─────────────────││─────────────────││─────────────────│
│ PK: id          ││ PK: id          ││ PK: id          ││ PK: id          │
│ FK: student_id  ││ FK: student_id  ││ FK: user_id     ││ FK: user_id     │
│ semester        ││ FK: subject_id  ││ action          ││ payload         │
│ academic_year   ││ semester        ││ entity          ││ last_activity   │
│ section         ││ academic_year   ││ changes (JSON)  ││                 │
│ status          ││ attendance_%    ││ timestamp       ││                 │
└─────────────────┘│ FK: detained_by ││                 ││                 │
                   │ FK: cleared_by  ││                 ││                 │
                   └─────────────────┘└─────────────────┘└─────────────────┘
```

---

## 🔗 Relationship Types

### One-to-Many Relationships

#### 1. Department → Courses
- **Type:** One-to-Many
- **Foreign Key:** `courses.department_id` → `departments.id`
- **Description:** One department can have multiple courses
- **Cascade:** DELETE CASCADE (deleting department deletes all courses)

#### 2. Department → Users
- **Type:** One-to-Many
- **Foreign Key:** `users.department_id` → `departments.id`
- **Description:** One department can have multiple users (teachers, students, HOD)
- **Cascade:** SET NULL (deleting department sets user's department_id to NULL)

#### 3. Course → Subjects
- **Type:** One-to-Many
- **Foreign Key:** `subjects.course_id` → `courses.id`
- **Description:** One course can have multiple subjects
- **Cascade:** DELETE CASCADE

#### 4. Subject → Class Sessions
- **Type:** One-to-Many
- **Foreign Key:** `class_sessions.subject_id` → `subjects.id`
- **Description:** One subject can have multiple class sessions
- **Cascade:** DELETE CASCADE

#### 5. Subject → Attendance Records
- **Type:** One-to-Many
- **Foreign Key:** `attendance.subject_id` → `subjects.id`
- **Description:** One subject can have multiple attendance records
- **Cascade:** DELETE CASCADE

#### 6. User (Teacher) → Class Sessions
- **Type:** One-to-Many
- **Foreign Key:** `class_sessions.teacher_id` → `users.id`
- **Description:** One teacher can conduct multiple class sessions
- **Cascade:** DELETE CASCADE

#### 7. User (Student) → Attendance Records
- **Type:** One-to-Many
- **Foreign Key:** `attendance.student_id` → `users.id`
- **Description:** One student can have multiple attendance records
- **Cascade:** DELETE CASCADE

#### 8. Class Session → Attendance Records
- **Type:** One-to-Many
- **Foreign Key:** `attendance.session_id` → `class_sessions.id`
- **Description:** One class session can have multiple attendance records (one per student)
- **Cascade:** DELETE CASCADE

---

### One-to-One Relationships

#### 1. Department → HOD (Head of Department)
- **Type:** One-to-One
- **Foreign Key:** `departments.hod_id` → `users.id`
- **Description:** One department has one HOD (user with role='hod')
- **Cascade:** SET NULL
- **Note:** This is optional; department can exist without HOD

---

### Many-to-Many Relationships

#### 1. Teachers ↔ Subjects (via teacher_assignments)
- **Type:** Many-to-Many
- **Junction Table:** `teacher_assignments`
- **Description:** 
  - One teacher can teach multiple subjects
  - One subject can be taught by multiple teachers (different sections/semesters)
- **Foreign Keys:**
  - `teacher_assignments.teacher_id` → `users.id`
  - `teacher_assignments.subject_id` → `subjects.id`
- **Additional Fields:** `sections`, `academic_year`, `assigned_by`

#### 2. Students ↔ Subjects (via attendance)
- **Type:** Many-to-Many
- **Junction Table:** `attendance`
- **Description:**
  - One student attends multiple subjects
  - One subject is attended by multiple students
- **Foreign Keys:**
  - `attendance.student_id` → `users.id`
  - `attendance.subject_id` → `subjects.id`
- **Additional Fields:** `status`, `date`, `marked_by`

---

## 📋 Detailed Relationship Descriptions

### 1. Users Table Relationships

#### As Student:
- **One-to-Many with attendance:** `attendance.student_id` → `users.id`
- **One-to-Many with student_semesters:** `student_semesters.student_id` → `users.id`
- **One-to-Many with detained_students:** `detained_students.student_id` → `users.id`
- **Many-to-One with department:** `users.department_id` → `departments.id`
- **Many-to-One with course:** `users.course_id` → `courses.id`

#### As Teacher:
- **One-to-Many with class_sessions:** `class_sessions.teacher_id` → `users.id`
- **One-to-Many with teacher_assignments:** `teacher_assignments.teacher_id` → `users.id`
- **One-to-Many with timetable:** `timetable.teacher_id` → `users.id`
- **One-to-One with department (as HOD):** `departments.hod_id` → `users.id`

#### As Admin/Principal/HOD:
- **One-to-Many with audit_logs:** `audit_logs.user_id` → `users.id`
- **One-to-Many with detained_students (as detainer):** `detained_students.detained_by` → `users.id`
- **One-to-Many with teacher_assignments (as assigner):** `teacher_assignments.assigned_by` → `users.id`

---

### 2. Department Table Relationships

```sql
departments
  ├── Has Many: courses (department_id)
  ├── Has Many: subjects (department_id)
  ├── Has Many: users (department_id)
  ├── Has Many: class_sessions (department_id)
  ├── Has Many: timetable (department_id)
  └── Has One: HOD (hod_id) → users.id
```

**Example Query:**
```sql
-- Get department with all courses and students
SELECT 
    d.name AS department_name,
    c.name AS course_name,
    u.first_name,
    u.last_name
FROM departments d
LEFT JOIN courses c ON d.id = c.department_id
LEFT JOIN users u ON d.id = u.department_id AND u.role = 'student'
WHERE d.id = 1;
```

---

### 3. Subject Table Relationships

```sql
subjects
  ├── Belongs To: department (department_id)
  ├── Belongs To: course (course_id)
  ├── Has Many: class_sessions (subject_id)
  ├── Has Many: attendance (subject_id)
  ├── Has Many: teacher_assignments (subject_id)
  ├── Has Many: timetable (subject_id)
  └── Has Many: detained_students (subject_id)
```

**Example Query:**
```sql
-- Get subject with all class sessions and attendance
SELECT 
    s.name AS subject_name,
    cs.date,
    cs.status,
    COUNT(a.id) AS total_attendance
FROM subjects s
INNER JOIN class_sessions cs ON s.id = cs.subject_id
LEFT JOIN attendance a ON cs.id = a.session_id
WHERE s.id = 1
GROUP BY cs.id;
```

---

### 4. Attendance Table Relationships

```sql
attendance
  ├── Belongs To: student (student_id) → users
  ├── Belongs To: session (session_id) → class_sessions
  ├── Belongs To: subject (subject_id) → subjects
  ├── Belongs To: marked_by (marked_by) → users (teacher)
  └── Belongs To: updated_by (updated_by) → users
```

**Unique Constraint:** One attendance record per student per session
- `UNIQUE KEY (student_id, session_id)`

**Example Query:**
```sql
-- Get student attendance with session and subject details
SELECT 
    u.first_name,
    u.last_name,
    s.name AS subject_name,
    cs.date,
    a.status,
    t.first_name AS marked_by
FROM attendance a
INNER JOIN users u ON a.student_id = u.id
INNER JOIN subjects s ON a.subject_id = s.id
INNER JOIN class_sessions cs ON a.session_id = cs.id
INNER JOIN users t ON a.marked_by = t.id
WHERE u.id = 1;
```

---

### 5. Timetable Table Relationships

```sql
timetable
  ├── Belongs To: department (department_id)
  ├── Belongs To: course (course_id)
  ├── Belongs To: subject (subject_id)
  ├── Belongs To: teacher (teacher_id) → users
  └── Has Many: class_sessions (timetable_id)
```

**Unique Constraint:** One timetable entry per slot
- `UNIQUE KEY (department_id, course_id, semester, section, day_of_week, period)`

**Example Query:**
```sql
-- Get weekly timetable for a course
SELECT 
    t.day_of_week,
    t.period,
    t.start_time,
    t.end_time,
    s.name AS subject_name,
    u.first_name AS teacher_name,
    t.room
FROM timetable t
INNER JOIN subjects s ON t.subject_id = s.id
INNER JOIN users u ON t.teacher_id = u.id
WHERE t.course_id = 1 
  AND t.semester = 3 
  AND t.section = 'A'
ORDER BY t.day_of_week, t.period;
```

---

## 🔍 Common Query Patterns

### 1. Get Student's Complete Attendance Summary
```sql
SELECT 
    u.enrollment_no,
    u.first_name,
    u.last_name,
    s.name AS subject_name,
    COUNT(a.id) AS total_classes,
    SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present,
    SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent,
    ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100, 2) AS percentage
FROM users u
INNER JOIN attendance a ON u.id = a.student_id
INNER JOIN subjects s ON a.subject_id = s.id
WHERE u.role = 'student' AND u.id = ?
GROUP BY s.id;
```

### 2. Get Teacher's Daily Schedule
```sql
SELECT 
    t.period,
    t.start_time,
    t.end_time,
    s.name AS subject_name,
    c.name AS course_name,
    t.semester,
    t.section,
    t.room
FROM timetable t
INNER JOIN subjects s ON t.subject_id = s.id
INNER JOIN courses c ON t.course_id = c.id
WHERE t.teacher_id = ? 
  AND t.day_of_week = DAYOFWEEK(CURDATE()) - 1
  AND t.is_active = TRUE
ORDER BY t.period;
```

### 3. Get Students Below Minimum Attendance
```sql
SELECT 
    u.enrollment_no,
    u.first_name,
    u.last_name,
    s.name AS subject_name,
    s.min_attendance AS required_percentage,
    ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100, 2) AS current_percentage
FROM users u
INNER JOIN attendance a ON u.id = a.student_id
INNER JOIN subjects s ON a.subject_id = s.id
WHERE u.role = 'student'
GROUP BY u.id, s.id
HAVING current_percentage < s.min_attendance;
```

### 4. Get Department-wise Statistics
```sql
SELECT 
    d.name AS department_name,
    COUNT(DISTINCT c.id) AS total_courses,
    COUNT(DISTINCT s.id) AS total_subjects,
    COUNT(DISTINCT CASE WHEN u.role = 'teacher' THEN u.id END) AS total_teachers,
    COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.id END) AS total_students,
    COUNT(DISTINCT cs.id) AS total_sessions_conducted
FROM departments d
LEFT JOIN courses c ON d.id = c.department_id
LEFT JOIN subjects s ON d.id = s.department_id
LEFT JOIN users u ON d.id = u.department_id
LEFT JOIN class_sessions cs ON d.id = cs.department_id AND cs.status = 'conducted'
GROUP BY d.id;
```

### 5. Get Student's Timetable
```sql
SELECT 
    t.day_of_week,
    t.period,
    t.start_time,
    t.end_time,
    s.name AS subject_name,
    s.code AS subject_code,
    CONCAT(u.first_name, ' ', u.last_name) AS teacher_name,
    t.room
FROM users student
INNER JOIN timetable t ON 
    student.department_id = t.department_id AND
    student.course_id = t.course_id AND
    student.semester = t.semester AND
    student.section = t.section
INNER JOIN subjects s ON t.subject_id = s.id
INNER JOIN users u ON t.teacher_id = u.id
WHERE student.id = ? AND t.is_active = TRUE
ORDER BY t.day_of_week, t.period;
```

---

## ⚠️ Referential Integrity Rules

### CASCADE Rules

1. **Deleting Department:**
   - ✅ Cascades to: courses, subjects, timetable, class_sessions
   - ⚠️ Sets NULL for: users.department_id
   - ⚠️ Warning: Will delete all related data

2. **Deleting User (Student):**
   - ✅ Cascades to: attendance, student_semesters, detained_students
   - ⚠️ Cannot delete if user is HOD (must reassign HOD first)

3. **Deleting Subject:**
   - ✅ Cascades to: attendance, class_sessions, timetable, teacher_assignments
   - ⚠️ Warning: Will lose all attendance history

4. **Deleting Class Session:**
   - ✅ Cascades to: attendance
   - ⚠️ Warning: Will delete all attendance for that session

---

## 🎯 Indexing Strategy

### Primary Indexes (for joins)
- All foreign keys are indexed automatically
- `users.username`, `users.email`, `users.enrollment_no`
- `departments.code`, `courses.code`, `subjects.code`

### Composite Indexes (for common queries)
- `attendance(student_id, subject_id, date)`
- `class_sessions(date, teacher_id)`
- `timetable(course_id, semester, section)`

### Performance Tips:
1. Always filter by date ranges for attendance queries
2. Use indexes on `status` columns when filtering
3. Avoid SELECT * in production queries
4. Use LIMIT for pagination

---

## 📈 Data Integrity Constraints

### Check Constraints (MySQL 8.0+)
```sql
ALTER TABLE users 
ADD CONSTRAINT chk_role 
CHECK (role IN ('admin', 'principal', 'hod', 'teacher', 'student'));

ALTER TABLE attendance 
ADD CONSTRAINT chk_status 
CHECK (status IN ('present', 'absent', 'late', 'excused'));

ALTER TABLE subjects 
ADD CONSTRAINT chk_min_attendance 
CHECK (min_attendance BETWEEN 0 AND 100);
```

### Unique Constraints
1. `users.username` - Must be unique
2. `users.email` - Must be unique
3. `users.enrollment_no` - Must be unique (for students)
4. `departments.code` - Must be unique
5. `attendance(student_id, session_id)` - One record per student per session

---

**Version:** 1.0  
**Last Updated:** December 9, 2025
