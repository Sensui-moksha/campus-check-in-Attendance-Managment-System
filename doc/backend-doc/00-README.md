# Backend Documentation Overview

## 🚀 Campus Check-In Backend Architecture

**Runtime:** Node.js v18+  
**Framework:** Express.js v4  
**Database:** MongoDB (Mongoose ODM)  
**Authentication:** JWT (httpOnly cookies)

---

## 🗂️ Directory Structure

```
backend/
├── src/
│   ├── app.js                  # Express app configuration
│   ├── index.js                # Server entry point
│   ├── config/
│   │   └── index.js            # Configuration loader
│   ├── controllers/            # Route handlers (business logic)
│   │   ├── adminSettingsController.js
│   │   ├── analyticsController.js
│   │   ├── attendanceController.js
│   │   ├── attendanceUndoController.js
│   │   ├── authController.js
│   │   ├── bulkUploadController.js
│   │   ├── courseController.js
│   │   ├── detainController.js
│   │   ├── exportsController.js
│   │   ├── exportTemplateController.js
│   │   ├── importsController.js
│   │   ├── promotionController.js
│   │   ├── reportController.js
│   │   ├── sectionController.js
│   │   ├── semesterController.js
│   │   ├── sessionController.js
│   │   ├── studentAttendanceController.js
│   │   ├── subjectController.js
│   │   ├── teacherAssignmentController.js
│   │   ├── timetableController.js
│   │   └── userController.js
│   ├── middleware/             # Custom middleware
│   │   ├── auth.js             # JWT authentication
│   │   ├── authorize.js        # Role-based authorization
│   │   ├── deptCheck.js        # Department validation
│   │   ├── errorHandler.js     # Global error handler
│   │   └── validate.js         # Input validation
│   ├── models/                 # Mongoose schemas
│   │   ├── Attendance.js
│   │   ├── AuditLog.js
│   │   ├── ClassSession.js
│   │   ├── Course.js
│   │   ├── Department.js
│   │   ├── DetainedStudent.js
│   │   ├── ExportTemplate.js
│   │   ├── Semester.js
│   │   ├── StudentSemester.js
│   │   ├── Subject.js
│   │   ├── SystemSettings.js
│   │   ├── TeacherAssignment.js
│   │   ├── Timetable.js
│   │   └── User.js
│   ├── routes/                 # API route definitions
│   │   ├── admin.js
│   │   ├── adminSettings.js
│   │   ├── analytics.js
│   │   ├── attendance.js
│   │   ├── attendanceUndo.js
│   │   ├── auth.js
│   │   ├── classes.js
│   │   ├── courses.js
│   │   ├── departments.js
│   │   ├── detain.js
│   │   ├── exports.js
│   │   ├── exportTemplates.js
│   │   ├── imports.js
│   │   ├── promotions.js
│   │   ├── reports.js
│   │   ├── sections.js
│   │   ├── semesters.js
│   │   ├── sessions.js
│   │   ├── students.js
│   │   ├── subjects.js
│   │   ├── teachers.js
│   │   ├── timetable.js
│   │   └── users.js
│   └── utils/                  # Utility functions
│       ├── csvParser.js
│       ├── excelGenerator.js
│       ├── logger.js
│       └── validation.js
├── scripts/                    # Utility scripts
│   ├── check-section-names.js
│   ├── check-sections.js
│   ├── cleanup-invalid-sections.js
│   ├── create-admin-user.js    # Create admin user
│   ├── fix-duplicate-sections.js
│   ├── fix-section-index.js
│   ├── init-system-settings.js
│   └── remove-subject-code-unique-index.js
├── tests/                      # Unit & integration tests
│   ├── attendance.spec.js
│   ├── exports.spec.js
│   └── rbac.spec.js
├── uploads/                    # Uploaded files directory
├── package.json                # Dependencies
└── .env                        # Environment variables
```

---

## 📊 Database Models

### Core Models

#### User Model
```javascript
{
  username: String (unique, required),
  email: String (unique, required),
  password: String (hashed, required),
  firstName: String (required),
  lastName: String (required),
  role: String (enum: ['admin', 'principal', 'hod', 'teacher', 'student']),
  department: ObjectId (ref: 'Department'),
  course: ObjectId (ref: 'Course'),
  semester: Number,
  section: String,
  enrollmentNo: String (unique, for students),
  phoneNumber: String,
  address: String,
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Attendance Model
```javascript
{
  student: ObjectId (ref: 'User', required),
  session: ObjectId (ref: 'ClassSession', required),
  subject: ObjectId (ref: 'Subject', required),
  date: Date (required),
  status: String (enum: ['present', 'absent', 'late', 'excused'], required),
  markedBy: ObjectId (ref: 'User', required),
  markedAt: Date (default: now),
  updatedBy: ObjectId (ref: 'User'),
  updatedAt: Date,
  notes: String,
  createdAt: Date
}
```

#### ClassSession Model
```javascript
{
  subject: ObjectId (ref: 'Subject', required),
  teacher: ObjectId (ref: 'User', required),
  date: Date (required),
  startTime: String (required),
  endTime: String (required),
  period: Number (required),
  course: ObjectId (ref: 'Course', required),
  semester: Number (required),
  section: String (required),
  department: ObjectId (ref: 'Department', required),
  timetableEntry: ObjectId (ref: 'Timetable'),
  totalStudents: Number (default: 0),
  presentCount: Number (default: 0),
  absentCount: Number (default: 0),
  attendanceMarked: Boolean (default: false),
  markedAt: Date,
  status: String (enum: ['scheduled', 'conducted', 'cancelled']),
  createdAt: Date,
  updatedAt: Date
}
```

#### Subject Model
```javascript
{
  name: String (required),
  code: String (required),
  department: ObjectId (ref: 'Department', required),
  course: ObjectId (ref: 'Course', required),
  semester: Number (required),
  credits: Number (required),
  type: String (enum: ['theory', 'practical', 'lab']),
  minAttendance: Number (default: 75),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

#### Department Model
```javascript
{
  name: String (unique, required),
  code: String (unique, required),
  hod: ObjectId (ref: 'User'),
  description: String,
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

#### Course Model
```javascript
{
  name: String (required),
  code: String (required),
  department: ObjectId (ref: 'Department', required),
  duration: Number (required, in semesters),
  totalSemesters: Number (required),
  degree: String (enum: ['bachelor', 'master', 'diploma']),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

#### Timetable Model
```javascript
{
  department: ObjectId (ref: 'Department', required),
  course: ObjectId (ref: 'Course', required),
  semester: Number (required),
  section: String (required),
  dayOfWeek: Number (required, 0-6),
  period: Number (required),
  subject: ObjectId (ref: 'Subject', required),
  teacher: ObjectId (ref: 'User', required),
  startTime: String (required),
  endTime: String (required),
  room: String,
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

#### DetainedStudent Model
```javascript
{
  student: ObjectId (ref: 'User', required),
  subject: ObjectId (ref: 'Subject', required),
  semester: Number (required),
  academicYear: String (required),
  attendancePercentage: Number (required),
  totalClasses: Number (required),
  attendedClasses: Number (required),
  detainedBy: ObjectId (ref: 'User', required),
  detainedAt: Date (default: now),
  reason: String,
  status: String (enum: ['detained', 'cleared', 'pending']),
  clearedBy: ObjectId (ref: 'User'),
  clearedAt: Date,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Semester Model
```javascript
{
  name: String (required),
  academicYear: String (required),
  startDate: Date (required),
  endDate: Date (required),
  isCurrent: Boolean (default: false),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

#### StudentSemester Model
```javascript
{
  student: ObjectId (ref: 'User', required),
  semester: Number (required),
  academicYear: String (required),
  section: String (required),
  status: String (enum: ['active', 'detained', 'completed']),
  promotedFrom: Number,
  promotedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### TeacherAssignment Model
```javascript
{
  teacher: ObjectId (ref: 'User', required),
  subject: ObjectId (ref: 'Subject', required),
  course: ObjectId (ref: 'Course', required),
  semester: Number (required),
  sections: [String] (required),
  academicYear: String (required),
  assignedBy: ObjectId (ref: 'User', required),
  assignedAt: Date (default: now),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

#### AuditLog Model
```javascript
{
  user: ObjectId (ref: 'User', required),
  action: String (required),
  entity: String (required),
  entityId: ObjectId,
  changes: Mixed,
  ipAddress: String,
  userAgent: String,
  timestamp: Date (default: now)
}
```

#### ExportTemplate Model
```javascript
{
  name: String (required),
  description: String,
  type: String (enum: ['attendance', 'report', 'student']),
  columns: [String] (required),
  filters: Mixed,
  createdBy: ObjectId (ref: 'User', required),
  isPublic: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

#### SystemSettings Model
```javascript
{
  key: String (unique, required),
  value: Mixed (required),
  description: String,
  category: String (enum: ['general', 'attendance', 'notification', 'security']),
  isPublic: Boolean (default: false),
  updatedBy: ObjectId (ref: 'User'),
  updatedAt: Date (default: now)
}
```

---

## 🔐 Authentication & Authorization

### JWT Authentication Flow

1. **Login:** User submits credentials → Server validates → JWT token generated → Token sent in httpOnly cookie
2. **Protected Route:** Request with cookie → `auth` middleware extracts token → Verifies JWT → Attaches user to `req.user`
3. **Authorization:** `authorize` middleware checks `req.user.role` → Allows/denies access based on roles
4. **Logout:** Server clears cookie → Token invalidated

### Middleware Chain

```javascript
// Example protected route
router.get('/admin/dashboard',
  auth,                           // 1. Verify JWT
  authorize(['admin', 'principal']), // 2. Check role
  deptCheck,                      // 3. Validate department
  adminController.getDashboard    // 4. Execute controller
);
```

### Role Hierarchy

```
admin (superuser)
  ├── Full system access
  ├── User management
  ├── System settings
  └── All department access

principal
  ├── View all departments
  ├── Generate reports
  └── Analytics access

hod (Head of Department)
  ├── Department management
  ├── Teacher assignments
  ├── Department reports
  └── Student promotions

teacher
  ├── Mark attendance
  ├── View assigned classes
  ├── Generate class reports
  └── View student profiles

student
  ├── View own attendance
  ├── View timetable
  └── View profile
```

---

## 📡 API Routes

### Base URL: `http://localhost:5000/api`

### Authentication Routes (`/api/auth`)
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user (requires auth)
- `POST /auth/refresh` - Refresh JWT token

### User Routes (`/api/users`)
- `GET /users` - Get all users (admin only)
- `GET /users/:id` - Get user by ID
- `POST /users` - Create new user (admin only)
- `PUT /users/:id` - Update user (admin/self)
- `DELETE /users/:id` - Delete user (admin only)
- `PUT /users/:id/password` - Change password
- `PUT /users/:id/activate` - Activate user (admin only)
- `PUT /users/:id/deactivate` - Deactivate user (admin only)

### Department Routes (`/api/departments`)
- `GET /departments` - Get all departments
- `GET /departments/:id` - Get department by ID
- `POST /departments` - Create department (admin only)
- `PUT /departments/:id` - Update department (admin/hod)
- `DELETE /departments/:id` - Delete department (admin only)

### Course Routes (`/api/courses`)
- `GET /courses` - Get all courses
- `GET /courses/:id` - Get course by ID
- `POST /courses` - Create course (admin only)
- `PUT /courses/:id` - Update course (admin/hod)
- `DELETE /courses/:id` - Delete course (admin only)
- `GET /courses/department/:deptId` - Get courses by department

### Subject Routes (`/api/subjects`)
- `GET /subjects` - Get all subjects
- `GET /subjects/:id` - Get subject by ID
- `POST /subjects` - Create subject (admin/hod)
- `PUT /subjects/:id` - Update subject (admin/hod)
- `DELETE /subjects/:id` - Delete subject (admin only)
- `GET /subjects/course/:courseId` - Get subjects by course
- `GET /subjects/semester/:semester` - Get subjects by semester

### Attendance Routes (`/api/attendance`)
- `POST /attendance/mark` - Mark attendance (teacher)
- `GET /attendance/session/:sessionId` - Get session attendance
- `PUT /attendance/:id` - Update attendance (teacher)
- `DELETE /attendance/:id` - Delete attendance (admin only)
- `GET /attendance/student/:studentId` - Get student attendance history
- `POST /attendance/bulk` - Bulk mark attendance (teacher)
- `GET /attendance/subject/:subjectId` - Get subject attendance
- `GET /attendance/stats/:studentId` - Get attendance statistics

### Session Routes (`/api/sessions`)
- `GET /sessions` - Get all sessions
- `GET /sessions/:id` - Get session by ID
- `POST /sessions` - Create session (teacher/admin)
- `PUT /sessions/:id` - Update session (teacher)
- `DELETE /sessions/:id` - Delete session (admin only)
- `GET /sessions/teacher/:teacherId` - Get teacher sessions
- `GET /sessions/date/:date` - Get sessions by date
- `GET /sessions/upcoming` - Get upcoming sessions

### Timetable Routes (`/api/timetable`)
- `GET /timetable` - Get timetable
- `GET /timetable/:id` - Get timetable entry by ID
- `POST /timetable` - Create timetable entry (admin/hod)
- `PUT /timetable/:id` - Update timetable entry (admin/hod)
- `DELETE /timetable/:id` - Delete timetable entry (admin/hod)
- `GET /timetable/course/:courseId` - Get course timetable
- `GET /timetable/teacher/:teacherId` - Get teacher timetable
- `POST /timetable/bulk` - Bulk create timetable (admin/hod)

### Report Routes (`/api/reports`)
- `GET /reports/attendance` - Generate attendance report
- `GET /reports/detain` - Generate detain report
- `GET /reports/subject/:subjectId` - Subject-wise report
- `GET /reports/course/:courseId` - Course-wise report
- `GET /reports/student/:studentId` - Student report
- `POST /reports/custom` - Generate custom report

### Analytics Routes (`/api/analytics`)
- `GET /analytics/dashboard` - Dashboard analytics
- `GET /analytics/attendance-trends` - Attendance trends
- `GET /analytics/subject-performance` - Subject performance
- `GET /analytics/department-stats` - Department statistics

### Import/Export Routes
- `POST /imports/students` - Import students (admin/hod)
- `POST /imports/subjects` - Import subjects (admin/hod)
- `POST /imports/timetable` - Import timetable (admin/hod)
- `GET /exports/attendance` - Export attendance
- `GET /exports/students` - Export students
- `GET /exports/reports` - Export reports
- `POST /exports/custom` - Custom export

### Detain Routes (`/api/detain`)
- `GET /detain` - Get all detained students
- `GET /detain/:id` - Get detained student by ID
- `POST /detain` - Detain student (admin/hod)
- `PUT /detain/:id/clear` - Clear detention (admin/hod)
- `GET /detain/student/:studentId` - Get student detention history

### Promotion Routes (`/api/promotions`)
- `POST /promotions/promote` - Promote students (admin/hod)
- `GET /promotions/eligible` - Get eligible students
- `POST /promotions/bulk` - Bulk promote (admin only)

### Semester Routes (`/api/semesters`)
- `GET /semesters` - Get all semesters
- `GET /semesters/current` - Get current semester
- `POST /semesters` - Create semester (admin only)
- `PUT /semesters/:id` - Update semester (admin only)
- `PUT /semesters/:id/activate` - Set as current semester

### Admin Settings Routes (`/api/admin-settings`)
- `GET /admin-settings` - Get all settings (admin only)
- `GET /admin-settings/:key` - Get setting by key
- `PUT /admin-settings/:key` - Update setting (admin only)
- `POST /admin-settings` - Create setting (admin only)

### Student Routes (`/api/students`)
- `GET /students` - Get all students
- `GET /students/:id` - Get student by ID
- `GET /students/course/:courseId` - Get students by course
- `GET /students/semester/:semester` - Get students by semester
- `GET /students/section/:section` - Get students by section

### Teacher Routes (`/api/teachers`)
- `GET /teachers` - Get all teachers
- `GET /teachers/:id` - Get teacher by ID
- `GET /teachers/department/:deptId` - Get teachers by department
- `GET /teachers/:id/assignments` - Get teacher assignments

### Section Routes (`/api/sections`)
- `GET /sections` - Get all sections
- `GET /sections/course/:courseId` - Get sections by course
- `POST /sections` - Create section (admin/hod)
- `PUT /sections/:id` - Update section (admin/hod)
- `DELETE /sections/:id` - Delete section (admin only)

### Attendance Undo Routes (`/api/attendance-undo`)
- `POST /attendance-undo/:id` - Undo attendance (admin only)
- `GET /attendance-undo/history` - Get undo history (admin only)

### Export Template Routes (`/api/export-templates`)
- `GET /export-templates` - Get all templates
- `GET /export-templates/:id` - Get template by ID
- `POST /export-templates` - Create template (admin/hod)
- `PUT /export-templates/:id` - Update template (admin/hod)
- `DELETE /export-templates/:id` - Delete template (admin only)

---

## 🛠️ Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/campus-checkin
DB_NAME=campus-checkin

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# Security
BCRYPT_ROUNDS=10

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

---

## 🚦 Middleware Documentation

### 1. Authentication Middleware (`auth.js`)

**Purpose:** Verify JWT token and attach user to request

**Usage:**
```javascript
router.get('/protected', auth, controller.handler);
```

**Flow:**
1. Extract token from httpOnly cookie
2. Verify JWT signature
3. Check token expiration
4. Attach decoded user to `req.user`
5. Continue to next middleware

**Error Cases:**
- No token → 401 Unauthorized
- Invalid token → 401 Unauthorized
- Expired token → 401 Token Expired

---

### 2. Authorization Middleware (`authorize.js`)

**Purpose:** Check if user has required role

**Usage:**
```javascript
router.post('/admin', auth, authorize(['admin']), controller.handler);
router.get('/dashboard', auth, authorize(['admin', 'principal']), controller.handler);
```

**Parameters:**
- `roles` (Array<string>): Allowed roles

**Flow:**
1. Check if `req.user` exists (auth middleware must run first)
2. Check if `req.user.role` is in allowed roles
3. Allow or deny access

**Error Cases:**
- No user → 401 Unauthorized
- Insufficient permissions → 403 Forbidden

---

### 3. Department Check Middleware (`deptCheck.js`)

**Purpose:** Validate user has access to requested department

**Usage:**
```javascript
router.get('/department/:deptId', auth, deptCheck, controller.handler);
```

**Flow:**
1. Extract department ID from params/body/query
2. Check if user is admin (bypass check)
3. Check if user belongs to the department
4. Allow or deny access

**Error Cases:**
- No department ID → 400 Bad Request
- User not in department → 403 Forbidden

---

### 4. Validation Middleware (`validate.js`)

**Purpose:** Validate request data against schema

**Usage:**
```javascript
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

router.post('/users',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 })
  ],
  validate,
  controller.handler
);
```

**Flow:**
1. Run express-validator checks
2. Collect validation errors
3. If errors exist → 400 Bad Request with error details
4. If valid → Continue to next middleware

---

### 5. Error Handler Middleware (`errorHandler.js`)

**Purpose:** Global error handling

**Usage:**
```javascript
// In app.js
app.use(errorHandler);
```

**Flow:**
1. Catch all errors from routes/middleware
2. Log error details
3. Format error response
4. Send appropriate status code

**Error Types:**
- Validation errors → 400
- Authentication errors → 401
- Authorization errors → 403
- Not found errors → 404
- Server errors → 500

---

## 📦 Dependencies

### Core Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^7.4.0",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.1",
  "cookie-parser": "^1.4.6",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1"
}
```

### Utility Dependencies

```json
{
  "multer": "^1.4.5-lts.1",
  "exceljs": "^4.3.0",
  "csv-parser": "^3.0.0",
  "express-validator": "^7.0.1",
  "winston": "^3.10.0"
}
```

### Dev Dependencies

```json
{
  "nodemon": "^3.0.1",
  "jest": "^29.6.2",
  "supertest": "^6.3.3",
  "eslint": "^8.46.0"
}
```

---

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

### Test Files
- `attendance.spec.js` - Attendance marking tests
- `exports.spec.js` - Export functionality tests
- `rbac.spec.js` - Role-based access control tests

---

## 🚀 Deployment

### Production Setup

1. **Environment Variables:**
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=strong-random-secret
CLIENT_URL=https://yourdomain.com
```

2. **Build & Start:**
```bash
npm install --production
npm start
```

3. **Process Manager (PM2):**
```bash
npm install -g pm2
pm2 start src/index.js --name campus-checkin
pm2 save
pm2 startup
```

4. **Nginx Reverse Proxy:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📚 Scripts

### Admin User Creation
```bash
npm run create-admin
```

### System Settings Initialization
```bash
node scripts/init-system-settings.js
```

### Database Maintenance
```bash
node scripts/check-sections.js
node scripts/cleanup-invalid-sections.js
node scripts/fix-duplicate-sections.js
```

---

## 🐛 Common Issues

### Issue: MongoDB Connection Failed
**Solution:** Check `MONGODB_URI` in `.env`, ensure MongoDB is running

### Issue: JWT Token Invalid
**Solution:** Verify `JWT_SECRET` matches between environments

### Issue: CORS Error
**Solution:** Add frontend URL to `CLIENT_URL` in `.env`

### Issue: File Upload Failed
**Solution:** Check `uploads/` directory permissions, verify `MAX_FILE_SIZE`

---

**Last Updated:** December 9, 2025  
**Version:** 2.0.0
