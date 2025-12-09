# 🔌 API Endpoints Documentation

**Campus Check-In Attendance Management System**  
**Base URL:** `http://localhost:5000/api`  
**Date:** December 9, 2025

---

## 📑 Table of Contents

1. [Authentication](#authentication)
2. [Users & Students](#users--students)
3. [Departments](#departments)
4. [Courses](#courses)
5. [Subjects](#subjects)
6. [Sections](#sections)
7. [Timetables](#timetables)
8. [Attendance](#attendance)
9. [Sessions](#sessions)
10. [Attendance Undo](#attendance-undo)
11. [Teachers & Assignments](#teachers--assignments)
12. [Semesters](#semesters)
13. [Reports](#reports)
14. [Analytics](#analytics)
15. [Exports](#exports)
16. [Imports](#imports)
17. [Detain Management](#detain-management)
18. [Promotions](#promotions)
19. [Admin Settings](#admin-settings)
20. [Export Templates](#export-templates)

---

## 🔐 Authentication

### Login
```http
POST /api/auth/login
```

**Description:** Login with email/rollNo and password. Sets secure httpOnly cookie.

**Request Body:**
```json
{
  "email": "admin@campus.edu",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "user": {
    "_id": "...",
    "name": "Admin User",
    "email": "admin@campus.edu",
    "role": "admin",
    "department": "..."
  },
  "token": "jwt_token_here"
}
```

**Authentication:** None (public endpoint)

---

### Logout
```http
POST /api/auth/logout
```

**Description:** Logout and invalidate session cookie.

**Authentication:** Required (any role)

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

### Get Current User
```http
GET /api/auth/me
```

**Description:** Get current authenticated user details.

**Authentication:** Required (any role)

**Response:**
```json
{
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@campus.edu",
    "role": "student",
    "department": {...},
    "yearOfStudy": 2,
    "section": "A"
  }
}
```

---

## 👥 Users & Students

### Create User
```http
POST /api/users
```

**Description:** Create a new user (student/teacher/hod/admin).

**Authentication:** Admin, Principal, HOD

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@campus.edu",
  "rollNo": "CS001",
  "password": "Student@123",
  "role": "student",
  "department": "dept_id",
  "yearOfStudy": 1,
  "section": "A",
  "batchYear": 2024
}
```

**Response:**
```json
{
  "user": {
    "_id": "...",
    "name": "Jane Doe",
    "email": "jane@campus.edu",
    "role": "student"
  }
}
```

---

### Bulk Delete Users
```http
POST /api/users/bulk-delete
```

**Description:** Delete multiple users at once.

**Authentication:** Admin, Principal, HOD

**Request Body:**
```json
{
  "userIds": ["user_id_1", "user_id_2", "user_id_3"]
}
```

**Response:**
```json
{
  "message": "3 users deleted successfully"
}
```

---

### List Users by Role
```http
GET /api/users
```

**Description:** List users filtered by role (excludes students).

**Authentication:** Admin, Principal, HOD, Teacher

**Query Parameters:**
- `role` (optional): admin, principal, hod, teacher
- `department` (optional): department ID
- `page` (default: 1)
- `limit` (default: 50)

**Response:**
```json
{
  "users": [...],
  "total": 45,
  "page": 1,
  "pages": 1
}
```

---

### List Students
```http
GET /api/students
```

**Description:** List all students with optional filters.

**Authentication:** Required (any role)

**Query Parameters:**
- `department` (optional): department ID
- `yearOfStudy` (optional): 1, 2, 3, 4
- `section` (optional): A, B, C, etc.
- `batchYear` (optional): 2024, 2023, etc.
- `search` (optional): search by name or rollNo
- `page` (default: 1)
- `limit` (default: 50)

**Response:**
```json
{
  "students": [
    {
      "_id": "...",
      "name": "John Doe",
      "rollNo": "CS001",
      "email": "john@campus.edu",
      "department": {...},
      "yearOfStudy": 2,
      "section": "A",
      "batchYear": 2023
    }
  ],
  "total": 120,
  "page": 1,
  "pages": 3
}
```

---

### List Teachers
```http
GET /api/teachers
```

**Description:** List all teachers with optional filters.

**Authentication:** Required (any role)

**Query Parameters:**
- `department` (optional): department ID
- `page` (default: 1)
- `limit` (default: 50)

**Response:**
```json
{
  "teachers": [...],
  "total": 15,
  "page": 1,
  "pages": 1
}
```

---

### List Students by Department
```http
GET /api/departments/:deptId/students
```

**Description:** Get all students in a specific department.

**Authentication:** Admin, Principal, HOD

**Query Parameters:**
- `year` (optional): 1, 2, 3, 4
- `batchYear` (optional): 2024, 2023, etc.
- `page` (default: 1)
- `limit` (default: 50)

**Response:**
```json
{
  "students": [...],
  "total": 80,
  "page": 1,
  "pages": 2
}
```

---

### Get Students by Section
```http
GET /api/students/section
```

**Description:** Get students filtered by section and department.

**Authentication:** Teacher, HOD, Admin, Principal

**Query Parameters (required):**
- `departmentId`: department ID
- `sectionId`: section ID
- `yearOfStudy`: 1, 2, 3, 4

**Query Parameters (optional):**
- `page` (default: 1)
- `limit` (default: 50)

**Response:**
```json
{
  "students": [...],
  "section": {...},
  "total": 30
}
```

---

### Get Student Details
```http
GET /api/students/:studentId
```

**Description:** Get detailed information about a specific student.

**Authentication:** Admin, Principal, HOD, Teacher

**Response:**
```json
{
  "student": {
    "_id": "...",
    "name": "John Doe",
    "rollNo": "CS001",
    "email": "john@campus.edu",
    "department": {...},
    "yearOfStudy": 2,
    "section": "A",
    "isActive": true
  }
}
```

---

### Update Student
```http
PUT /api/students/:studentId
```

**Description:** Update student information.

**Authentication:** Admin, Principal, HOD

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "john.new@campus.edu",
  "section": "B",
  "isActive": true
}
```

**Response:**
```json
{
  "student": {...}
}
```

---

### Delete Student
```http
DELETE /api/students/:studentId
```

**Description:** Delete a student permanently.

**Authentication:** Admin, Principal, HOD

**Response:**
```json
{
  "message": "Student deleted successfully"
}
```

---

### Get Student Attendance (Monthly Calendar)
```http
GET /api/users/:userId/attendance
```

**Description:** Get monthly attendance calendar for a user.

**Authentication:** Required (any role)

**Query Parameters:**
- `month` (required): YYYY-MM format (e.g., 2025-01)

**Response:**
```json
{
  "month": "2025-01",
  "attendance": [
    {
      "date": "2025-01-15",
      "status": "present",
      "subject": "Mathematics"
    }
  ]
}
```

---

### Get Student Subject-wise Attendance
```http
GET /api/students/:studentId/attendance
```

**Description:** Get detailed subject-wise and monthly attendance for a student.

**Authentication:** Admin, Principal, HOD, Teacher

**Response:**
```json
{
  "bySubject": [
    {
      "subject": "Mathematics",
      "present": 25,
      "total": 30,
      "percentage": 83.33
    }
  ],
  "overall": {
    "present": 120,
    "total": 150,
    "percentage": 80.0
  }
}
```

---

### Get Student Attendance Summary
```http
GET /api/students/:id/attendance/summary
```

**Description:** Get per-subject attendance summary for a student.

**Authentication:** Required (any role)

**Response:**
```json
{
  "summary": [
    {
      "subjectId": "...",
      "subjectName": "Mathematics",
      "present": 25,
      "absent": 3,
      "late": 2,
      "total": 30,
      "percentage": 83.33
    }
  ]
}
```

---

### Get Student Attendance History
```http
GET /api/students/:id/attendance/history
```

**Description:** Get detailed attendance history with filters.

**Authentication:** Required (any role)

**Query Parameters:**
- `from` (optional): ISO date string
- `to` (optional): ISO date string
- `subjectId` (optional): filter by subject
- `status` (optional): present, absent, late, excused

**Response:**
```json
{
  "history": [
    {
      "date": "2025-01-15",
      "subject": "Mathematics",
      "status": "present",
      "markedBy": "Teacher Name"
    }
  ]
}
```

---

### Export Student Attendance History
```http
GET /api/students/:id/attendance/export
```

**Description:** Export attendance history as CSV file.

**Authentication:** Required (any role)

**Query Parameters:**
- `from` (optional): ISO date string
- `to` (optional): ISO date string

**Response:** CSV file download

---

## 🏢 Departments

### List Departments
```http
GET /api/departments
```

**Description:** Get all departments sorted by name.

**Authentication:** Required (any role)

**Response:**
```json
{
  "departments": [
    {
      "_id": "...",
      "name": "Computer Science",
      "code": "CSE"
    }
  ]
}
```

---

### Get Department by ID
```http
GET /api/departments/:id
```

**Description:** Get department details.

**Authentication:** Required (any role)

**Response:**
```json
{
  "department": {
    "_id": "...",
    "name": "Computer Science",
    "code": "CSE"
  }
}
```

---

### Create Department
```http
POST /api/departments
```

**Description:** Create a new department.

**Authentication:** Admin, Principal

**Request Body:**
```json
{
  "name": "Computer Science",
  "code": "CSE"
}
```

**Response:**
```json
{
  "department": {
    "_id": "...",
    "name": "Computer Science",
    "code": "CSE"
  }
}
```

---

### Update Department
```http
PUT /api/departments/:id
```

**Description:** Update department information.

**Authentication:** Admin, Principal

**Request Body:**
```json
{
  "name": "Computer Science & Engineering",
  "code": "CSE"
}
```

**Response:**
```json
{
  "department": {...}
}
```

---

### Delete Department
```http
DELETE /api/departments/:id
```

**Description:** Delete a department.

**Authentication:** Admin, Principal

**Response:**
```json
{
  "message": "Department deleted successfully"
}
```

---

### Get Department Students
```http
GET /api/departments/:id/students
```

**Description:** Get all students in a department.

**Authentication:** Required (any role)

**Query Parameters:**
- `year` (optional): 1, 2, 3, 4
- `batchYear` (optional): 2024, 2023, etc.
- `page` (default: 1)
- `limit` (default: 50)

**Response:**
```json
{
  "students": [...],
  "total": 80,
  "page": 1,
  "pages": 2
}
```

---

## 📚 Courses

### Create Course
```http
POST /api/courses
```

**Description:** Create a new course.

**Authentication:** Admin, Principal, HOD

**Request Body:**
```json
{
  "name": "Data Structures",
  "code": "CS201",
  "department": "dept_id",
  "yearOfStudy": 2,
  "semester": "Fall 2025",
  "credits": 4
}
```

**Response:**
```json
{
  "course": {
    "_id": "...",
    "name": "Data Structures",
    "code": "CS201"
  }
}
```

---

### List Courses
```http
GET /api/courses
```

**Description:** List courses with filters.

**Authentication:** Admin, Principal, HOD, Teacher

**Query Parameters:**
- `department` (optional): department ID
- `yearOfStudy` (optional): 1, 2, 3, 4
- `semester` (optional): semester name
- `page` (default: 1)
- `limit` (default: 50)

**Response:**
```json
{
  "courses": [...],
  "total": 25,
  "page": 1,
  "pages": 1
}
```

---

### Get Course Roster
```http
GET /api/courses/:courseId/roster
```

**Description:** Get list of eligible students for a course.

**Authentication:** Teacher, HOD, Admin

**Response:**
```json
{
  "roster": [
    {
      "_id": "...",
      "name": "John Doe",
      "rollNo": "CS001",
      "department": {...}
    }
  ]
}
```

---

### Assign Teacher to Course
```http
PUT /api/courses/:courseId/assign-teacher
```

**Description:** Assign a teacher to a course.

**Authentication:** Admin, Principal, HOD

**Request Body:**
```json
{
  "teacherId": "teacher_id"
}
```

**Response:**
```json
{
  "course": {...}
}
```

---

## 📖 Subjects

### Create Subject
```http
POST /api/subjects
```

**Description:** Create a new subject.

**Authentication:** Admin, Principal, HOD

**Request Body:**
```json
{
  "name": "Data Structures",
  "code": "CS201",
  "department": "dept_id",
  "yearOfStudy": 2,
  "semester": 1,
  "credits": 4,
  "totalClasses": 60
}
```

**Response:**
```json
{
  "subject": {
    "_id": "...",
    "name": "Data Structures",
    "code": "CS201"
  }
}
```

---

### List Subjects
```http
GET /api/subjects
```

**Description:** List all subjects with optional filters.

**Authentication:** Required (any role)

**Query Parameters:**
- `yearOfStudy` (optional): 1, 2, 3, 4
- `semester` (optional): 1, 2
- `department` (optional): department ID

**Response:**
```json
{
  "subjects": [
    {
      "_id": "...",
      "name": "Data Structures",
      "code": "CS201",
      "credits": 4
    }
  ]
}
```

---

### Get Teacher's Assigned Subjects
```http
GET /api/subjects/teacher/assigned
```

**Description:** Get subjects assigned to current teacher.

**Authentication:** Teacher, HOD

**Query Parameters:**
- `departmentId` (optional): department ID
- `yearOfStudy` (optional): 1, 2, 3, 4
- `sectionId` (optional): section ID
- `semester` (optional): 1, 2

**Response:**
```json
{
  "subjects": [...]
}
```

---

### Get Subject Details
```http
GET /api/subjects/:id
```

**Description:** Get detailed subject information.

**Authentication:** Required (any role)

**Response:**
```json
{
  "subject": {
    "_id": "...",
    "name": "Data Structures",
    "code": "CS201",
    "credits": 4,
    "totalClasses": 60
  }
}
```

---

### Update Subject
```http
PUT /api/subjects/:id
```

**Description:** Update subject information.

**Authentication:** Admin, Principal, HOD

**Request Body:**
```json
{
  "name": "Advanced Data Structures",
  "credits": 5
}
```

**Response:**
```json
{
  "subject": {...}
}
```

---

### Delete Subject
```http
DELETE /api/subjects/:id
```

**Description:** Delete a subject.

**Authentication:** Admin, Principal, HOD

**Response:**
```json
{
  "message": "Subject deleted successfully"
}
```

---

### Assign Teacher to Subject
```http
POST /api/subjects/:id/assign-teacher
```

**Description:** Assign teacher to subject for a specific section.

**Authentication:** Admin, Principal, HOD

**Request Body:**
```json
{
  "teacherId": "teacher_id",
  "sectionId": "section_id",
  "departmentId": "dept_id",
  "yearOfStudy": 2
}
```

**Response:**
```json
{
  "message": "Teacher assigned successfully",
  "assignment": {...}
}
```

---

## 📋 Sections

### Get Distinct Sections
```http
GET /api/departments/:deptId/sections/distinct
```

**Description:** Get distinct section names from students (fast aggregation).

**Authentication:** Required (any role)

**Response:**
```json
{
  "sections": ["A", "B", "C"]
}
```

---

### List Sections
```http
GET /api/departments/:deptId/sections
```

**Description:** List all sections for a department.

**Authentication:** Required (any role)

**Response:**
```json
{
  "sections": [
    {
      "_id": "...",
      "name": "A",
      "department": "...",
      "capacity": 60
    }
  ]
}
```

---

### Create Section
```http
POST /api/departments/:deptId/sections
```

**Description:** Create a new section.

**Authentication:** Admin, Principal, HOD

**Request Body:**
```json
{
  "name": "A",
  "capacity": 60
}
```

**Response:**
```json
{
  "section": {
    "_id": "...",
    "name": "A",
    "capacity": 60
  }
}
```

---

### Update Section
```http
PUT /api/departments/:deptId/sections/:sectionId
```

**Description:** Update section information.

**Authentication:** Admin, Principal, HOD

**Request Body:**
```json
{
  "name": "A",
  "capacity": 70
}
```

**Response:**
```json
{
  "section": {...}
}
```

---

### Delete Section
```http
DELETE /api/departments/:deptId/sections/:sectionId
```

**Description:** Delete a section.

**Authentication:** Admin, Principal, HOD

**Response:**
```json
{
  "message": "Section deleted successfully"
}
```

---

## 📅 Timetables

### List Timetables
```http
GET /api/timetable
```

**Description:** Get timetables with optional filters.

**Authentication:** Admin, Principal, HOD

**Query Parameters:**
- `departmentId` (optional): department ID
- `year` (optional): 1, 2, 3, 4
- `section` (optional): A, B, C, etc.
- `semesterId` (optional): semester ID

**Response:**
```json
{
  "timetables": [...]
}
```

---

### Get Timetable by Query
```http
GET /api/timetable/query
```

**Description:** Get specific timetable by exact parameters.

**Authentication:** Admin, Principal, HOD

**Query Parameters:**
- `departmentId` (required): department ID
- `year` (required): 1, 2, 3, 4
- `section` (required): A, B, C, etc.
- `semesterId` (optional): semester ID

**Response:**
```json
{
  "timetable": {...}
}
```

---

### Get My Timetable
```http
GET /api/timetable/my-timetable
```

**Description:** Get timetable for current user (role-based).

**Authentication:** Required (any role)

**Query Parameters:**
- `semesterId` (optional): semester ID

**Response:**
```json
{
  "timetable": {
    "Monday": [
      {
        "period": 1,
        "subject": "Mathematics",
        "teacher": "Prof. Smith",
        "room": "101"
      }
    ]
  }
}
```

---

### Get Teacher Subjects for Day
```http
GET /api/timetable/teacher-subjects-day
```

**Description:** Get subjects for teacher on a specific day.

**Authentication:** Teacher, HOD, Admin, Principal

**Query Parameters:**
- `day` (required): Monday, Tuesday, etc.
- `date` (optional): ISO date string

**Response:**
```json
{
  "subjects": [
    {
      "subject": "Mathematics",
      "section": "A",
      "period": 1,
      "room": "101"
    }
  ]
}
```

---

### Get Teacher Timetable
```http
GET /api/timetable/teacher/:teacherId
```

**Description:** Get timetable for a specific teacher.

**Authentication:** Required (any role)

**Query Parameters:**
- `semesterId` (optional): semester ID

**Response:**
```json
{
  "timetable": {...}
}
```

---

### Get Student Timetable
```http
GET /api/timetable/student/:studentId
```

**Description:** Get timetable for a specific student.

**Authentication:** Required (any role)

**Query Parameters:**
- `semesterId` (optional): semester ID

**Response:**
```json
{
  "timetable": {...}
}
```

---

### Get Timetable by ID
```http
GET /api/timetable/:id
```

**Description:** Get timetable by its ID.

**Authentication:** Admin, Principal, HOD

**Response:**
```json
{
  "timetable": {...}
}
```

---

### Create Timetable
```http
POST /api/timetable
```

**Description:** Create a new timetable.

**Authentication:** Admin, Principal, HOD

**Request Body:**
```json
{
  "department": "dept_id",
  "yearOfStudy": 2,
  "section": "A",
  "semester": "semester_id",
  "schedule": {
    "Monday": [
      {
        "period": 1,
        "subject": "subject_id",
        "teacher": "teacher_id",
        "room": "101",
        "startTime": "09:00",
        "endTime": "10:00"
      }
    ]
  }
}
```

**Response:**
```json
{
  "timetable": {...}
}
```

---

### Update Timetable
```http
PUT /api/timetable/:id
```

**Description:** Update existing timetable.

**Authentication:** Admin, Principal, HOD

**Request Body:**
```json
{
  "schedule": {...}
}
```

**Response:**
```json
{
  "timetable": {...}
}
```

---

### Delete Timetable
```http
DELETE /api/timetable/:id
```

**Description:** Delete a timetable.

**Authentication:** Admin, Principal, HOD

**Response:**
```json
{
  "message": "Timetable deleted successfully"
}
```

---

## ✅ Attendance

### Mark Subject Attendance
```http
POST /api/attendance/subject/mark
```

**Description:** Mark attendance for a subject-section.

**Authentication:** Teacher, HOD, Admin

**Request Body:**
```json
{
  "subjectId": "subject_id",
  "sectionId": "section_id",
  "departmentId": "dept_id",
  "date": "2025-01-15",
  "students": [
    {
      "studentId": "student_id_1",
      "status": "present"
    },
    {
      "studentId": "student_id_2",
      "status": "absent"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Attendance marked successfully",
  "records": [...]
}
```

---

### Get Subject Attendance
```http
GET /api/attendance/subject
```

**Description:** Get attendance for a subject-section by period.

**Authentication:** Teacher, HOD, Admin, Principal

**Query Parameters:**
- `subjectId` (required): subject ID
- `sectionId` (required): section ID
- `departmentId` (required): department ID
- `period` (required): day, week, month
- `date` (optional): ISO date string

**Response:**
```json
{
  "attendance": [...]
}
```

---

### Bulk Mark Attendance
```http
POST /api/sessions/:sessionId/attendance
```

**Description:** Bulk mark attendance for a session.

**Authentication:** Teacher, HOD, Admin

**Request Body:**
```json
{
  "students": [
    {
      "studentId": "student_id",
      "status": "present"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Attendance marked",
  "count": 30
}
```

---

### Get Course Attendance by Period
```http
GET /api/courses/:courseId/attendance
```

**Description:** Get attendance for a course by period.

**Authentication:** Teacher, HOD, Admin, Principal

**Query Parameters:**
- `period` (required): day, week, month
- `date` (optional): ISO date string

**Response:**
```json
{
  "attendance": [...]
}
```

---

### Get Student Attendance Overview
```http
GET /api/students/:studentId/overview
```

**Description:** Get student attendance overview (includes expected classes from subject config).

**Authentication:** Student (own), HOD, Admin, Principal

**Response:**
```json
{
  "overall": {
    "present": 120,
    "absent": 10,
    "total": 130,
    "percentage": 92.31
  },
  "bySubject": [...]
}
```

---

### Get Student Attendance Overview V2
```http
GET /api/students/:studentId/conducted-overview
```

**Description:** Get student attendance overview based only on conducted classes.

**Authentication:** Student (own), HOD, Admin, Principal

**Response:**
```json
{
  "overall": {
    "present": 120,
    "absent": 10,
    "total": 130,
    "percentage": 92.31
  },
  "bySubject": [...]
}
```

---

### Get Student Attendance History
```http
GET /api/students/:studentId/history
```

**Description:** Get detailed student attendance history.

**Authentication:** Student (own), HOD, Admin, Principal

**Query Parameters:**
- `from` (optional): ISO date string
- `to` (optional): ISO date string
- `subjectId` (optional): filter by subject

**Response:**
```json
{
  "history": [
    {
      "date": "2025-01-15",
      "subject": "Mathematics",
      "status": "present",
      "markedBy": "Teacher Name"
    }
  ]
}
```

---

### Get Attendance History (All)
```http
GET /api/attendance/history
```

**Description:** Get attendance marking history across sessions.

**Authentication:** Teacher, HOD, Admin, Principal

**Query Parameters:**
- `from` (optional): ISO date string
- `to` (optional): ISO date string
- `departmentId` (optional): department ID
- `subjectId` (optional): subject ID

**Response:**
```json
{
  "history": [...]
}
```

---

### Get Session Details
```http
GET /api/attendance/session/:sessionId
```

**Description:** Get detailed attendance records for a session.

**Authentication:** Teacher, HOD, Admin, Principal

**Response:**
```json
{
  "session": {
    "date": "2025-01-15",
    "subject": "Mathematics",
    "attendance": [...]
  }
}
```

---

### Update Session Attendance
```http
PUT /api/attendance/session/:sessionId
```

**Description:** Update attendance records for a session.

**Authentication:** Teacher, HOD, Admin, Principal

**Request Body:**
```json
{
  "students": [
    {
      "studentId": "student_id",
      "status": "present"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Attendance updated",
  "session": {...}
}
```

---

### Mark Attendance V2
```http
POST /api/attendance/mark-v2
```

**Description:** Mark attendance using new semester-based schema.

**Authentication:** Teacher, HOD, Admin, Principal

**Request Body:**
```json
{
  "semesterId": "semester_id",
  "subjectId": "subject_id",
  "sectionId": "section_id",
  "date": "2025-01-15",
  "period": 1,
  "students": [
    {
      "studentId": "student_id",
      "status": "present"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Attendance marked successfully",
  "records": [...]
}
```

---

### Get Attendance by Class
```http
GET /api/attendance/by-class
```

**Description:** Get attendance by class (department, year, section, subject, date).

**Authentication:** Teacher, HOD, Admin, Principal

**Query Parameters:**
- `departmentId` (required): department ID
- `year` (required): 1, 2, 3, 4
- `section` (required): A, B, C, etc.
- `subjectId` (required): subject ID
- `date` (required): ISO date string

**Response:**
```json
{
  "attendance": [...]
}
```

---

## 🎓 Sessions

### Create Session
```http
POST /api/sessions
```

**Description:** Create a new class session.

**Authentication:** Teacher, HOD, Admin, Principal

**Request Body:**
```json
{
  "courseId": "course_id",
  "sessionDate": "2025-01-15T09:00:00Z",
  "academicYear": "2024-2025"
}
```

**Response:**
```json
{
  "session": {
    "_id": "...",
    "courseId": "...",
    "sessionDate": "2025-01-15T09:00:00Z"
  }
}
```

---

### Get Session by ID
```http
GET /api/sessions/:sessionId
```

**Description:** Get session details.

**Authentication:** Required (any role)

**Response:**
```json
{
  "session": {...}
}
```

---

### Get Course Sessions
```http
GET /api/sessions/course/:courseId/sessions
```

**Description:** Get all sessions for a course.

**Authentication:** Required (any role)

**Query Parameters:**
- `from` (optional): ISO date string
- `to` (optional): ISO date string

**Response:**
```json
{
  "sessions": [...]
}
```

---

### Undo Last Session Attendance
```http
POST /api/sessions/:sessionId/undo-last
```

**Description:** Undo the last attendance action for a session.

**Authentication:** Teacher, HOD, Admin, Principal

**Response:**
```json
{
  "message": "Attendance undone successfully",
  "count": 30
}
```

---

### Cancel Session
```http
PUT /api/sessions/:sessionId/cancel
```

**Description:** Cancel a class session.

**Authentication:** Teacher, HOD, Admin, Principal

**Response:**
```json
{
  "message": "Session cancelled",
  "session": {...}
}
```

---

## ↩️ Attendance Undo

### Undo Last Session Attendance
```http
POST /api/sessions/:sessionId/undo-last
```

**Description:** Undo last grouped attendance action.

**Authentication:** Teacher, HOD, Admin, Principal

**Response:**
```json
{
  "message": "Attendance undone",
  "count": 30
}
```

---

### Get Undo History
```http
GET /api/sessions/:sessionId/undo-history
```

**Description:** Get undo history for a session.

**Authentication:** Teacher, HOD, Admin, Principal

**Response:**
```json
{
  "history": [
    {
      "action": "undo",
      "performedBy": "Teacher Name",
      "timestamp": "2025-01-15T10:30:00Z",
      "count": 30
    }
  ]
}
```

---

### Undo Specific Attendance Record
```http
POST /api/attendance/:attendanceId/undo
```

**Description:** Undo a specific attendance record.

**Authentication:** Admin, Principal, HOD

**Response:**
```json
{
  "message": "Attendance record undone"
}
```

---

## 👨‍🏫 Teachers & Assignments

### Get Teacher Assignments
```http
GET /api/teachers/:id/assignments
```

**Description:** Get all assignments for a teacher.

**Authentication:** Required (any role)

**Response:**
```json
{
  "assignments": [
    {
      "subject": "Mathematics",
      "department": "CSE",
      "section": "A",
      "year": 2
    }
  ]
}
```

---

### Create Teacher Assignments (Bulk)
```http
POST /api/teachers/:id/assignments
```

**Description:** Create or update assignments for a teacher (bulk operation).

**Authentication:** Required (any role)

**Request Body:**
```json
{
  "assignments": [
    {
      "subjectId": "subject_id",
      "departmentId": "dept_id",
      "sectionId": "section_id",
      "yearOfStudy": 2
    }
  ]
}
```

**Response:**
```json
{
  "message": "Assignments updated",
  "assignments": [...]
}
```

---

### Update Teacher Assignment
```http
PUT /api/teachers/:teacherId/assignments/:assignmentId
```

**Description:** Update a specific assignment.

**Authentication:** Required (any role)

**Request Body:**
```json
{
  "sectionId": "new_section_id"
}
```

**Response:**
```json
{
  "assignment": {...}
}
```

---

### Delete Teacher Assignment
```http
DELETE /api/teachers/:teacherId/assignments/:assignmentId
```

**Description:** Delete or deactivate an assignment.

**Authentication:** Required (any role)

**Response:**
```json
{
  "message": "Assignment deleted"
}
```

---

### Get Class Assignments
```http
GET /api/classes/:department/:year/:section/assignments
```

**Description:** Get all teacher assignments for a specific class.

**Authentication:** Required (any role)

**Response:**
```json
{
  "assignments": [...]
}
```

---

## 📆 Semesters

### List Semesters
```http
GET /api/semesters
```

**Description:** Get all semesters.

**Authentication:** Required (any role)

**Response:**
```json
{
  "semesters": [
    {
      "_id": "...",
      "name": "Fall 2025",
      "startDate": "2025-08-01",
      "endDate": "2025-12-15",
      "isActive": true
    }
  ]
}
```

---

### Get Active Semester
```http
GET /api/semesters/active
```

**Description:** Get the currently active semester.

**Authentication:** Required (any role)

**Response:**
```json
{
  "semester": {
    "_id": "...",
    "name": "Fall 2025",
    "isActive": true
  }
}
```

---

### Get Semester by ID
```http
GET /api/semesters/:id
```

**Description:** Get semester details.

**Authentication:** Required (any role)

**Response:**
```json
{
  "semester": {...}
}
```

---

### Create Semester
```http
POST /api/semesters
```

**Description:** Create a new semester.

**Authentication:** Required (any role)

**Request Body:**
```json
{
  "name": "Fall 2025",
  "startDate": "2025-08-01",
  "endDate": "2025-12-15",
  "academicYear": "2025-2026"
}
```

**Response:**
```json
{
  "semester": {...}
}
```

---

### Update Semester
```http
PUT /api/semesters/:id
```

**Description:** Update semester information.

**Authentication:** Required (any role)

**Request Body:**
```json
{
  "name": "Fall 2025 (Updated)",
  "endDate": "2025-12-20"
}
```

**Response:**
```json
{
  "semester": {...}
}
```

---

### Delete Semester
```http
DELETE /api/semesters/:id
```

**Description:** Delete a semester.

**Authentication:** Required (any role)

**Response:**
```json
{
  "message": "Semester deleted"
}
```

---

### Activate Semester
```http
POST /api/semesters/:id/activate
```

**Description:** Set a semester as active (deactivates others).

**Authentication:** Required (any role)

**Response:**
```json
{
  "message": "Semester activated",
  "semester": {...}
}
```

---

## 📊 Reports

### Get Department Report
```http
GET /api/reports/department/:departmentId
```

**Description:** Get attendance report for a department.

**Authentication:** HOD, Admin, Principal

**Query Parameters:**
- `period` (required): day, week, month
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "report": {
    "department": "Computer Science",
    "period": "month",
    "totalStudents": 200,
    "averageAttendance": 85.5,
    "byYear": [...]
  }
}
```

---

### Get Course Report
```http
GET /api/reports/course/:courseId
```

**Description:** Get attendance report for a course.

**Authentication:** Teacher, HOD, Admin, Principal

**Query Parameters:**
- `period` (required): day, week, month
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "report": {
    "course": "Data Structures",
    "totalSessions": 30,
    "averageAttendance": 87.5,
    "students": [...]
  }
}
```

---

### Get College Report
```http
GET /api/reports/college
```

**Description:** Get college-wide attendance report.

**Authentication:** Admin, Principal

**Query Parameters:**
- `period` (required): day, week, month
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "report": {
    "totalStudents": 1000,
    "averageAttendance": 83.2,
    "byDepartment": [...]
  }
}
```

---

## 📈 Analytics

### Get Course Summary
```http
GET /api/analytics/courses/:courseId/summary
```

**Description:** Get course attendance summary with per-student stats and trends.

**Authentication:** Admin, Principal, HOD, Teacher

**Query Parameters:**
- `from` (optional): ISO date string
- `to` (optional): ISO date string
- `batchYear` (optional): 2024, 2023, etc.
- `yearOfStudy` (optional): 1, 2, 3, 4

**Response:**
```json
{
  "summary": {
    "totalSessions": 30,
    "averageAttendance": 85.5,
    "trends": [...],
    "students": [
      {
        "studentId": "...",
        "name": "John Doe",
        "present": 25,
        "absent": 5,
        "percentage": 83.33
      }
    ]
  }
}
```

---

### Get Department Summary
```http
GET /api/analytics/departments/:departmentId/summary
```

**Description:** Get department attendance summary.

**Authentication:** Admin, Principal, HOD

**Query Parameters:**
- `from` (optional): ISO date string
- `to` (optional): ISO date string

**Response:**
```json
{
  "summary": {
    "totalStudents": 200,
    "averageAttendance": 84.5,
    "byYear": [...],
    "bySection": [...]
  }
}
```

---

### Get College Summary
```http
GET /api/analytics/college/summary
```

**Description:** Get college-wide attendance summary.

**Authentication:** Admin, Principal

**Query Parameters:**
- `from` (optional): ISO date string
- `to` (optional): ISO date string

**Response:**
```json
{
  "summary": {
    "totalStudents": 1000,
    "averageAttendance": 82.5,
    "byDepartment": [...],
    "trends": [...]
  }
}
```

---

### Get Department Students Analytics
```http
GET /api/analytics/departments/:departmentId/students
```

**Description:** Get department students with accurate attendance for HOD Dashboard.

**Authentication:** Admin, Principal, HOD

**Response:**
```json
{
  "students": [
    {
      "studentId": "...",
      "name": "John Doe",
      "rollNo": "CS001",
      "attendancePercentage": 85.5,
      "present": 120,
      "total": 140
    }
  ]
}
```

---

## 📤 Exports

### Export Course Attendance
```http
GET /api/exports/course/:courseId
```

**Description:** Export course attendance to CSV/Excel/PDF.

**Authentication:** Admin, Principal, HOD, Teacher

**Query Parameters:**
- `format` (required): csv, xlsx, pdf
- `period` (optional): day, week, month
- `date` (optional): ISO date string

**Response:** File download (CSV/XLSX/PDF)

---

### Export College Attendance
```http
GET /api/exports/college
```

**Description:** Export college-wide attendance.

**Authentication:** Admin, Principal

**Query Parameters:**
- `format` (required): csv, xlsx, pdf
- `from` (optional): ISO date string
- `to` (optional): ISO date string

**Response:** File download (CSV/XLSX/PDF)

---

### Export Department Attendance
```http
GET /api/exports/department/:departmentId
```

**Description:** Export department attendance.

**Authentication:** Admin, Principal, HOD

**Query Parameters:**
- `format` (required): csv, xlsx, pdf
- `from` (optional): ISO date string
- `to` (optional): ISO date string

**Response:** File download (CSV/XLSX/PDF)

---

### Export Section-wise Attendance
```http
GET /api/exports/section-wise/:departmentId/:year
```

**Description:** Export section-wise attendance for all sections in a department and year.

**Authentication:** Admin, Principal, HOD

**Query Parameters:**
- `format` (required): csv, xlsx, pdf

**Response:** File download (CSV/XLSX/PDF)

---

## 📥 Imports

### Bulk Import Students
```http
POST /api/imports/students
```

**Description:** Bulk import students via CSV file.

**Authentication:** Admin, Principal, HOD

**Request Body:** multipart/form-data
- `file`: CSV file

**CSV Format:**
```csv
name,email,rollNo,department,yearOfStudy,section,batchYear
John Doe,john@campus.edu,CS001,CSE,2,A,2023
```

**Response:**
```json
{
  "message": "Import completed",
  "imported": 50,
  "failed": 2,
  "errors": [...]
}
```

---

## 🚫 Detain Management

### Detain Students (Bulk)
```http
POST /api/detain
```

**Description:** Bulk detain students for low attendance or other reasons.

**Authentication:** Admin, Principal, HOD

**Request Body:**
```json
{
  "userIds": ["student_id_1", "student_id_2"],
  "reason": "Low attendance",
  "reasonType": "attendance",
  "detainDate": "2025-01-15",
  "notes": "Attendance below 75%",
  "performedBy": "HOD Name",
  "notify": true
}
```

**Response:**
```json
{
  "message": "2 students detained",
  "detainedStudents": [...]
}
```

---

### Release Students from Detention
```http
POST /api/detain/release
```

**Description:** Release students from detention.

**Authentication:** Admin, Principal, HOD

**Request Body:**
```json
{
  "userIds": ["student_id_1", "student_id_2"],
  "releaseDate": "2025-02-01",
  "releaseNotes": "Attendance improved",
  "performedBy": "HOD Name"
}
```

**Response:**
```json
{
  "message": "2 students released",
  "releasedStudents": [...]
}
```

---

### Suggest Students for Detention
```http
POST /api/detain/suggest
```

**Description:** Get suggestions for students to detain based on thresholds.

**Authentication:** Admin, Principal, HOD

**Request Body:**
```json
{
  "attendanceLt": 75,
  "creditLt": 40,
  "department": "dept_id",
  "year": 2
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "studentId": "...",
      "name": "John Doe",
      "attendancePercentage": 65,
      "credits": 30,
      "reason": "Low attendance and credits"
    }
  ]
}
```

---

### Get Detained Students
```http
GET /api/detain
```

**Description:** Get list of detained students with filters.

**Authentication:** Admin, Principal, HOD

**Query Parameters:**
- `department` (optional): department ID
- `year` (optional): 1, 2, 3, 4
- `reasonType` (optional): attendance, credits, behavior
- `from` (optional): ISO date string
- `to` (optional): ISO date string
- `page` (default: 1)
- `limit` (default: 50)

**Response:**
```json
{
  "detainedStudents": [
    {
      "studentId": "...",
      "name": "John Doe",
      "reason": "Low attendance",
      "detainDate": "2025-01-15",
      "isActive": true
    }
  ],
  "total": 15,
  "page": 1,
  "pages": 1
}
```

---

### Get Detention History
```http
GET /api/detain/history/:userId
```

**Description:** Get detention history for a specific student.

**Authentication:** Admin, Principal, HOD, Teacher

**Response:**
```json
{
  "history": [
    {
      "reason": "Low attendance",
      "detainDate": "2025-01-15",
      "releaseDate": "2025-02-01",
      "notes": "Attendance below 75%",
      "performedBy": "HOD Name"
    }
  ]
}
```

---

## 🎓 Promotions

### Promote Students
```http
POST /api/admin/promote
```

**Description:** Promote students to next academic year.

**Authentication:** Admin, Principal

**Request Body:**
```json
{
  "dryRun": false,
  "department": "dept_id",
  "year": 1,
  "performedBy": "Admin Name"
}
```

**Response:**
```json
{
  "message": "50 students promoted from year 1 to year 2",
  "promoted": 50,
  "failed": 0
}
```

---

### Get Promotion Preview
```http
GET /api/admin/promote/preview
```

**Description:** Get promotion preview without making changes.

**Authentication:** Admin, Principal

**Query Parameters:**
- `department` (optional): department ID
- `year` (optional): 1, 2, 3

**Response:**
```json
{
  "preview": {
    "totalStudents": 50,
    "eligible": 48,
    "detained": 2,
    "students": [...]
  }
}
```

---

### Rollback Promotion
```http
POST /api/admin/promote/rollback
```

**Description:** Rollback last promotion (emergency use only).

**Authentication:** Admin, Principal

**Request Body:**
```json
{
  "confirm": true,
  "performedBy": "Admin Name"
}
```

**Response:**
```json
{
  "message": "Promotion rolled back",
  "count": 50
}
```

---

### Process Auto Promotions
```http
POST /api/admin/promote/auto/process
```

**Description:** Process automatic promotions for all ended semesters.

**Authentication:** Admin, Principal

**Request Body:**
```json
{
  "performedBy": "Admin Name"
}
```

**Response:**
```json
{
  "message": "Auto promotions processed",
  "processed": 200
}
```

---

### Manual Trigger Promotion
```http
POST /api/admin/promote/manual
```

**Description:** Manually trigger promotion for specific department.

**Authentication:** Admin, Principal

**Request Body:**
```json
{
  "departmentId": "dept_id",
  "performedBy": "Admin Name"
}
```

**Response:**
```json
{
  "message": "Manual promotion triggered",
  "count": 80
}
```

---

### Get Auto Promotion Status
```http
GET /api/admin/promote/auto/status
```

**Description:** Get automatic promotion status for all semesters.

**Authentication:** Admin, Principal

**Response:**
```json
{
  "status": [
    {
      "semester": "Fall 2024",
      "status": "completed",
      "processedDate": "2024-12-20",
      "count": 200
    }
  ]
}
```

---

## ⚙️ Admin Settings

### Get Settings
```http
GET /api/admin/settings
```

**Description:** Get current system settings.

**Authentication:** Required (any role)

**Response:**
```json
{
  "settings": {
    "attendanceThreshold": 75,
    "detainThreshold": 65,
    "academicYear": "2024-2025",
    "allowLateMarking": true,
    "lateMarkingDays": 7
  }
}
```

---

### Update Settings
```http
PUT /api/admin/settings
```

**Description:** Update system settings.

**Authentication:** Required (any role)

**Request Body:**
```json
{
  "attendanceThreshold": 80,
  "detainThreshold": 70,
  "allowLateMarking": false
}
```

**Response:**
```json
{
  "message": "Settings updated",
  "settings": {...}
}
```

---

### Reset Settings
```http
POST /api/admin/settings/reset
```

**Description:** Reset settings to system defaults.

**Authentication:** Required (any role)

**Response:**
```json
{
  "message": "Settings reset to defaults",
  "settings": {...}
}
```

---

### Get Settings Audit Logs
```http
GET /api/admin/settings/audit-logs
```

**Description:** Get audit logs for settings changes.

**Authentication:** Required (any role)

**Query Parameters:**
- `from` (optional): ISO date string
- `to` (optional): ISO date string
- `limit` (default: 50)

**Response:**
```json
{
  "logs": [
    {
      "action": "update",
      "changedBy": "Admin Name",
      "changes": {...},
      "timestamp": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

## 📋 Export Templates

### Get Export Templates
```http
GET /api/admin/export-templates
```

**Description:** Get all saved export templates.

**Authentication:** Admin, Principal, HOD

**Response:**
```json
{
  "templates": [
    {
      "_id": "...",
      "name": "Monthly Report",
      "columns": ["name", "rollNo", "attendance"],
      "filters": {...}
    }
  ]
}
```

---

### Create Export Template
```http
POST /api/admin/export-templates
```

**Description:** Create a new export template.

**Authentication:** Admin, Principal, HOD

**Request Body:**
```json
{
  "name": "Custom Report",
  "columns": ["name", "rollNo", "attendance", "department"],
  "filters": {
    "yearOfStudy": 2,
    "section": "A"
  }
}
```

**Response:**
```json
{
  "template": {
    "_id": "...",
    "name": "Custom Report"
  }
}
```

---

### Delete Export Template
```http
DELETE /api/admin/export-templates/:id
```

**Description:** Delete an export template.

**Authentication:** Admin, Principal, HOD

**Response:**
```json
{
  "message": "Template deleted"
}
```

---

### Export with Template
```http
POST /api/exports/template/execute
```

**Description:** Export using a saved template.

**Authentication:** Admin, Principal, HOD

**Request Body:**
```json
{
  "templateId": "template_id",
  "format": "xlsx",
  "courseId": "course_id",
  "departmentId": "dept_id"
}
```

**Response:** File download (CSV/XLSX/PDF)

---

## 📂 Bulk Upload

### Download User Template
```http
GET /api/admin/csv-templates/users/download
```

**Description:** Download CSV template for bulk user upload.

**Authentication:** Required (any role)

**Response:** CSV file download with headers

---

### Bulk Upload Users
```http
POST /api/admin/users/bulk-upload
```

**Description:** Bulk upload users via CSV file.

**Authentication:** Required (any role)

**Request Body:** multipart/form-data
- `file`: CSV file

**CSV Format:**
```csv
name,email,rollNo,role,department,yearOfStudy,section,batchYear
John Doe,john@campus.edu,CS001,student,CSE,2,A,2023
Jane Smith,jane@campus.edu,EMP001,teacher,CSE,,,
```

**Response:**
```json
{
  "message": "Bulk upload completed",
  "imported": 45,
  "failed": 5,
  "errors": [
    {
      "row": 10,
      "error": "Invalid email format"
    }
  ]
}
```

---

## 🔑 Authentication & Authorization

### Roles Hierarchy
1. **Admin** - Full system access
2. **Principal** - All departments access
3. **HOD** - Department-specific access
4. **Teacher** - Class and subject access
5. **Student** - Personal data access only

### Protected Routes
All endpoints (except `/api/auth/login`) require authentication via JWT token in httpOnly cookie or Authorization header.

### Authorization Middleware
Routes are protected with role-based authorization:
```javascript
authorize(['admin', 'principal', 'hod'])
```

### Department Check Middleware
HODs are automatically restricted to their own department data.

---

## 📝 Request/Response Formats

### Success Response
```json
{
  "data": {...},
  "message": "Success message"
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": [...] // Optional validation errors
}
```

### Pagination
All list endpoints support pagination:
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "pages": 5,
  "limit": 20
}
```

---

## 🔒 Security Features

- **JWT Authentication** with httpOnly cookies
- **bcrypt** password hashing (10 rounds)
- **CORS** configured for development & production
- **Input Validation** using express-validator
- **SQL Injection Protection** (prepared statements)
- **XSS Protection** (httpOnly cookies)
- **Rate Limiting** (optional - can be configured)

---

## 📊 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not authorized)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🧪 Testing Endpoints

### Using cURL
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@campus.edu","password":"Admin@123"}' \
  -c cookies.txt

# Get current user
curl -X GET http://localhost:5000/api/auth/me \
  -b cookies.txt
```

### Using Postman
1. Import the Postman collection from `backend/POSTMAN_COLLECTION.json`
2. Set environment variable `BASE_URL` to `http://localhost:5000/api`
3. Login to get token
4. Token is automatically stored in cookies for subsequent requests

---

## 📚 Additional Resources

- **Postman Collection:** `backend/POSTMAN_COLLECTION.json`
- **Backend Documentation:** `doc/backend-doc/00-README.md`
- **Frontend Documentation:** `doc/frontend-doc/00-README.md`
- **Database Schema:** `doc/php/schema.sql`
- **Master Index:** `doc/00-MASTER-INDEX.md`

---

## 🎯 Quick Reference

### Most Common Endpoints

**Authentication:**
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

**Students:**
- `GET /api/students` - List students
- `POST /api/users` - Create student

**Attendance:**
- `POST /api/attendance/mark-v2` - Mark attendance
- `GET /api/students/:id/overview` - Student attendance overview

**Reports:**
- `GET /api/reports/department/:id` - Department report
- `GET /api/exports/course/:id` - Export course attendance

**Admin:**
- `POST /api/detain` - Detain students
- `POST /api/admin/promote` - Promote students

---

**Total Endpoints:** 120+  
**API Version:** 1.0  
**Last Updated:** December 9, 2025

**Ready for submission! 🚀**
