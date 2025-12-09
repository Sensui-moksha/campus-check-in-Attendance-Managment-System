# 📘 Campus Check-In: Complete Project Guide

**A Comprehensive Guide to Understanding, Setting Up, and Using the Attendance Management System**

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Architecture](#2-system-architecture)
3. [Role-Based Access Control](#3-role-based-access-control)
4. [Installation Guide](#4-installation-guide)
5. [Configuration](#5-configuration)
6. [Database Schema](#6-database-schema)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Backend Architecture](#8-backend-architecture)
9. [API Documentation](#9-api-documentation)
10. [User Workflows](#10-user-workflows)
11. [Features Deep Dive](#11-features-deep-dive)
12. [Security Implementation](#12-security-implementation)
13. [Testing Guide](#13-testing-guide)
14. [Deployment Guide](#14-deployment-guide)
15. [Troubleshooting](#15-troubleshooting)
16. [PHP Migration Guide](#16-php-migration-guide)
17. [Best Practices](#17-best-practices)
18. [FAQ](#18-faq)

---

## 1. Introduction

### 1.1 What is Campus Check-In?

Campus Check-In is a modern, full-stack web application designed to streamline attendance management in educational institutions. It replaces traditional paper-based attendance systems with a digital solution that provides real-time tracking, analytics, and reporting.

### 1.2 Key Objectives

- **Efficiency**: Reduce time spent on attendance management
- **Accuracy**: Eliminate manual errors in record-keeping
- **Accessibility**: Provide 24/7 access to attendance data
- **Analytics**: Generate insights from attendance patterns
- **Compliance**: Meet institutional attendance requirements

### 1.3 Target Users

| User Type | Description |
|-----------|-------------|
| **Administrator** | System-wide management and configuration |
| **Principal** | Institution-wide oversight and reporting |
| **Head of Department (HOD)** | Department-level management |
| **Teacher** | Class attendance marking and tracking |
| **Student** | Personal attendance viewing |

### 1.4 Technology Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   React 18  │  │  TypeScript │  │ Tailwind CSS│          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         API LAYER                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Express.js │  │     JWT     │  │    CORS     │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   MongoDB   │  │   Mongoose  │  │   Indexes   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    React Application                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │  │
│  │  │  Pages   │  │Components│  │ Contexts │  │  Hooks   │   │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │  │
│  │                         │                                   │  │
│  │                    ┌────▼────┐                              │  │
│  │                    │  Axios  │                              │  │
│  │                    └────┬────┘                              │  │
│  └─────────────────────────│──────────────────────────────────┘  │
└────────────────────────────│─────────────────────────────────────┘
                             │ HTTP/HTTPS
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                           BACKEND                                 │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Express.js Server                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │  │
│  │  │  Routes  │──│Middleware│──│Controllers│──│  Models  │   │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │  │
│  │                                               │             │  │
│  │                                          ┌────▼────┐        │  │
│  │                                          │Mongoose │        │  │
│  │                                          └────┬────┘        │  │
│  └───────────────────────────────────────────────│─────────────┘  │
└──────────────────────────────────────────────────│────────────────┘
                                                   │
                                                   ▼
                                          ┌───────────────┐
                                          │    MongoDB    │
                                          └───────────────┘
```

### 2.2 Directory Structure

```
campus-check-in/
│
├── 📁 src/                          # Frontend source code
│   ├── 📁 api/                      # API client configuration
│   ├── 📁 components/               # Reusable UI components
│   │   ├── 📁 layout/               # Layout components (Header, Sidebar)
│   │   └── 📁 ui/                   # shadcn/ui components
│   ├── 📁 contexts/                 # React Context providers
│   ├── 📁 hooks/                    # Custom React hooks
│   ├── 📁 pages/                    # Page components by role
│   │   ├── 📁 admin/                # Admin dashboard pages
│   │   ├── 📁 hod/                  # HOD dashboard pages
│   │   ├── 📁 teacher/              # Teacher dashboard pages
│   │   └── 📁 student/              # Student dashboard pages
│   ├── 📁 types/                    # TypeScript type definitions
│   └── 📁 utils/                    # Utility functions
│
├── 📁 backend/                      # Backend source code
│   ├── 📁 src/
│   │   ├── 📁 config/               # Configuration files
│   │   ├── 📁 controllers/          # Request handlers
│   │   ├── 📁 middleware/           # Express middleware
│   │   ├── 📁 models/               # Mongoose models
│   │   ├── 📁 routes/               # API route definitions
│   │   └── 📁 utils/                # Utility functions
│   ├── 📁 scripts/                  # Utility scripts
│   └── 📁 tests/                    # Backend tests
│
├── 📁 doc/                          # Documentation
├── 📁 guides/                       # Project guides
└── 📁 public/                       # Static assets
```

### 2.3 Data Flow

```
User Action → React Component → API Call → Express Route → 
Controller → Model → MongoDB → Response → State Update → UI Update
```

---

## 3. Role-Based Access Control

### 3.1 Role Hierarchy

```
                    ┌─────────────┐
                    │    Admin    │ ← Full System Access
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Principal  │ ← All Departments
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │     HOD     │ ← Own Department Only
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Teacher   │ ← Assigned Classes Only
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Student   │ ← Own Data Only
                    └─────────────┘
```

### 3.2 Permission Matrix

| Feature | Admin | Principal | HOD | Teacher | Student |
|---------|:-----:|:---------:|:---:|:-------:|:-------:|
| View All Departments | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ✅ | ✅* | ❌ | ❌ |
| Create Departments | ✅ | ✅ | ❌ | ❌ | ❌ |
| Assign Teachers | ✅ | ✅ | ✅ | ❌ | ❌ |
| Mark Attendance | ✅ | ❌ | ✅ | ✅ | ❌ |
| View All Reports | ✅ | ✅ | ✅* | ❌ | ❌ |
| Export Data | ✅ | ✅ | ✅ | ✅ | ❌ |
| View Own Attendance | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage Settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| Detain Students | ✅ | ✅ | ✅ | ❌ | ❌ |
| Promote Students | ✅ | ✅ | ❌ | ❌ | ❌ |

*Limited to own department

### 3.3 Implementation

```javascript
// Backend Authorization Middleware
const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }
    next();
  };
};

// Usage in routes
router.post('/users', 
  auth, 
  authorize(['admin', 'principal', 'hod']), 
  userController.createUser
);
```

---

## 4. Installation Guide

### 4.1 Prerequisites

Before installing, ensure you have:

| Requirement | Minimum Version | Recommended |
|-------------|-----------------|-------------|
| Node.js | 18.0.0 | 20.x LTS |
| MongoDB | 6.0 | 7.x |
| npm | 9.0.0 | Latest |
| Git | 2.30 | Latest |

### 4.2 Step-by-Step Installation

#### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/campus-check-in.git
cd campus-check-in
```

#### Step 2: Install Frontend Dependencies

```bash
npm install
```

#### Step 3: Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

#### Step 4: Configure Environment Variables

Create `backend/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/campus_checkin

# Authentication
JWT_SECRET=your_very_long_and_secure_secret_key_here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Optional: Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Step 5: Initialize the Database

```bash
# Create admin user
node backend/scripts/create-admin-user.js

# Initialize system settings
node backend/scripts/init-system-settings.js
```

#### Step 6: Start the Application

```bash
# Development mode (runs both frontend and backend)
npm run dev

# Or run separately:
# Terminal 1 - Frontend
npm run dev:frontend

# Terminal 2 - Backend
cd backend && npm run dev
```

#### Step 7: Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api

### 4.3 Verification

```bash
# Test API health
curl http://localhost:5000/api/auth/me

# Should return: {"error": "Not authenticated"}
# This confirms the API is running
```

---

## 5. Configuration

### 5.1 Frontend Configuration

#### Vite Configuration (`vite.config.ts`)

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
```

#### Tailwind Configuration (`tailwind.config.ts`)

```typescript
export default {
  theme: {
    extend: {
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1440px',
        '3xl': '1600px',
        '4xl': '1920px',
      },
    },
  },
};
```

### 5.2 Backend Configuration

#### Database Connection (`backend/src/config/index.js`)

```javascript
module.exports = {
  mongodb: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  }
};
```

### 5.3 System Settings

Access via Admin Dashboard → Settings:

| Setting | Description | Default |
|---------|-------------|---------|
| Attendance Threshold | Minimum attendance % | 75% |
| Detention Threshold | Below this = detention | 65% |
| Academic Year | Current academic year | Auto |
| Late Marking Days | Days allowed for late marking | 7 |
| Allow Weekend Classes | Enable weekend attendance | No |

---

## 6. Database Schema

### 6.1 Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Department  │────<│    Course    │────<│   Subject    │
└──────────────┘     └──────────────┘     └──────────────┘
       │                                         │
       │                                         │
       ▼                                         ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│     User     │────<│  Attendance  │>────│ClassSession  │
└──────────────┘     └──────────────┘     └──────────────┘
       │                                         │
       │                                         │
       ▼                                         ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│TeacherAssign │     │   Semester   │     │  Timetable   │
└──────────────┘     └──────────────┘     └──────────────┘
```

### 6.2 Core Models

#### User Model

```javascript
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'principal', 'hod', 'teacher', 'student'],
    required: true 
  },
  department: { type: Schema.Types.ObjectId, ref: 'Department' },
  rollNo: String,           // For students
  employeeId: String,       // For staff
  yearOfStudy: Number,      // 1, 2, 3, 4
  section: String,          // A, B, C, etc.
  batchYear: Number,        // 2024, 2023, etc.
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});
```

#### Attendance Model

```javascript
const attendanceSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  session: { type: Schema.Types.ObjectId, ref: 'ClassSession' },
  subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  date: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['present', 'absent', 'late', 'excused'],
    required: true 
  },
  markedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  markedAt: { type: Date, default: Date.now },
  semester: { type: Schema.Types.ObjectId, ref: 'Semester' },
  remarks: String
});
```

### 6.3 Indexes for Performance

```javascript
// Compound indexes for common queries
attendanceSchema.index({ student: 1, date: -1 });
attendanceSchema.index({ subject: 1, date: -1 });
attendanceSchema.index({ session: 1 });

userSchema.index({ department: 1, role: 1 });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ rollNo: 1 }, { sparse: true });
```

---

## 7. Frontend Architecture

### 7.1 Component Hierarchy

```
App
├── AuthProvider
│   └── Router
│       ├── PublicRoutes
│       │   └── Login
│       └── ProtectedRoutes
│           └── DashboardLayout
│               ├── Sidebar
│               ├── Header
│               └── PageContent
│                   ├── AdminPages
│                   ├── PrincipalPages
│                   ├── HODPages
│                   ├── TeacherPages
│                   └── StudentPages
```

### 7.2 State Management

```
┌─────────────────────────────────────────┐
│              AuthContext                 │
│  ┌─────────────────────────────────┐    │
│  │  user, login(), logout()        │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│ Component A   │       │ Component B   │
│ useAuth()     │       │ useAuth()     │
└───────────────┘       └───────────────┘
```

### 7.3 API Client

```typescript
// src/api/index.ts
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // For cookies
});

// Request interceptor
api.interceptors.request.use((config) => {
  // Add any headers if needed
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { api };
```

### 7.4 Routing Structure

```typescript
// Route configuration
const routes = [
  // Public
  { path: '/login', element: <Login /> },
  
  // Admin
  { path: '/admin/dashboard', element: <AdminDashboard /> },
  { path: '/admin/users', element: <Users /> },
  { path: '/admin/departments', element: <Departments /> },
  
  // HOD
  { path: '/hod/dashboard', element: <HODDashboard /> },
  { path: '/hod/teachers', element: <Teachers /> },
  
  // Teacher
  { path: '/teacher/dashboard', element: <TeacherDashboard /> },
  { path: '/teacher/mark-attendance', element: <MarkAttendance /> },
  
  // Student
  { path: '/student/dashboard', element: <StudentDashboard /> },
  { path: '/student/attendance', element: <MyAttendance /> },
  
  // Common
  { path: '/profile', element: <Profile /> },
  { path: '/timetable', element: <ViewTimetable /> },
];
```

---

## 8. Backend Architecture

### 8.1 Request Flow

```
HTTP Request
     │
     ▼
┌─────────────┐
│   app.js    │ ← Express app setup
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Middleware │ ← CORS, JSON parsing, etc.
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Routes    │ ← Route matching
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Auth     │ ← JWT verification
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Authorize  │ ← Role checking
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Controller  │ ← Business logic
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Model     │ ← Database operations
└──────┬──────┘
       │
       ▼
HTTP Response
```

### 8.2 Middleware Stack

```javascript
// app.js
const app = express();

// 1. Security
app.use(helmet());
app.use(cors(corsOptions));

// 2. Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 3. Logging (development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 4. Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
// ... more routes

// 5. Error handling
app.use(errorHandler);
```

### 8.3 Controller Pattern

```javascript
// controllers/attendanceController.js
exports.markAttendance = async (req, res, next) => {
  try {
    // 1. Validate input
    const { subjectId, students, date } = req.body;
    
    // 2. Business logic
    const records = await Promise.all(
      students.map(async (s) => {
        return await Attendance.create({
          student: s.studentId,
          subject: subjectId,
          date,
          status: s.status,
          markedBy: req.user._id
        });
      })
    );
    
    // 3. Send response
    res.status(201).json({
      message: 'Attendance marked successfully',
      count: records.length
    });
  } catch (error) {
    next(error);
  }
};
```

---

## 9. API Documentation

### 9.1 Authentication Endpoints

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response (200):
{
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "teacher"
  }
}
```

#### Logout
```http
POST /api/auth/logout

Response (200):
{
  "message": "Logged out successfully"
}
```

### 9.2 Attendance Endpoints

#### Mark Attendance
```http
POST /api/attendance/mark-v2
Authorization: Bearer <token>
Content-Type: application/json

{
  "subjectId": "...",
  "sectionId": "...",
  "date": "2025-01-15",
  "period": 1,
  "students": [
    { "studentId": "...", "status": "present" },
    { "studentId": "...", "status": "absent" }
  ]
}

Response (201):
{
  "message": "Attendance marked successfully",
  "records": [...]
}
```

#### Get Student Attendance
```http
GET /api/students/:studentId/overview
Authorization: Bearer <token>

Response (200):
{
  "overall": {
    "present": 120,
    "absent": 10,
    "total": 130,
    "percentage": 92.31
  },
  "bySubject": [
    {
      "subject": "Mathematics",
      "present": 25,
      "total": 30,
      "percentage": 83.33
    }
  ]
}
```

📖 **Full API Reference**: See [doc/API-ENDPOINTS.md](../doc/API-ENDPOINTS.md)

---

## 10. User Workflows

### 10.1 Teacher: Marking Attendance

```
┌─────────────────────────────────────────────────────────────┐
│                    MARK ATTENDANCE FLOW                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Login as Teacher                                         │
│         │                                                    │
│         ▼                                                    │
│  2. Navigate to "Mark Attendance"                            │
│         │                                                    │
│         ▼                                                    │
│  3. Select: Subject → Section → Date                         │
│         │                                                    │
│         ▼                                                    │
│  4. Student list loads automatically                         │
│         │                                                    │
│         ▼                                                    │
│  5. Click status buttons: ✓ Present | ✗ Absent | ⏰ Late     │
│         │                                                    │
│         ▼                                                    │
│  6. Click "Submit Attendance"                                │
│         │                                                    │
│         ▼                                                    │
│  7. Success! View in "Attendance History"                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Student: Viewing Attendance

```
1. Login → Student Dashboard
2. See overall attendance percentage
3. Click "View Details" for subject-wise breakdown
4. Use calendar to view day-by-day attendance
5. Export attendance history if needed
```

### 10.3 HOD: Generating Reports

```
1. Login → HOD Dashboard
2. Navigate to "Reports"
3. Select filters:
   - Department (auto-selected)
   - Year of Study
   - Section
   - Date Range
4. Click "Generate Report"
5. View analytics and charts
6. Export to Excel/PDF
```

### 10.4 Admin: Managing Users

```
1. Login → Admin Dashboard
2. Navigate to "User Management"
3. Options:
   - Add Single User: Fill form
   - Bulk Upload: CSV file
   - Edit User: Click edit icon
   - Delete User: Click delete icon
4. Assign roles and departments
5. Activate/Deactivate accounts
```

---

## 11. Features Deep Dive

### 11.1 Attendance Marking System

#### Status Types
| Status | Icon | Color | Description |
|--------|------|-------|-------------|
| Present | ✓ | Green | Student attended |
| Absent | ✗ | Red | Student did not attend |
| Late | ⏰ | Yellow | Student arrived late |
| Excused | 📋 | Blue | Approved absence |

#### Bulk Operations
- Mark all present
- Mark all absent
- Import from previous session
- Quick toggle per student

### 11.2 Analytics Dashboard

#### Metrics Displayed
- **Overall Attendance %**: Institution-wide
- **Department-wise**: Compare departments
- **Trend Charts**: Weekly/Monthly patterns
- **Low Attendance Alerts**: Students below threshold
- **Subject Performance**: Which subjects have low attendance

### 11.3 Export System

#### Supported Formats
| Format | Use Case |
|--------|----------|
| CSV | Data analysis in Excel |
| XLSX | Formatted Excel reports |
| PDF | Official printable reports |

#### Export Templates
Custom templates with:
- Selected columns
- Filters (date range, department, etc.)
- Formatting options
- Header/footer customization

### 11.4 Detention System

#### Workflow
```
1. System identifies students below threshold (e.g., <65%)
2. HOD/Admin reviews suggestions
3. Select students → Mark as detained
4. Enter reason and notes
5. Students see detention status
6. When resolved → Release from detention
```

---

## 12. Security Implementation

### 12.1 Authentication Flow

```
┌─────────┐         ┌─────────┐         ┌─────────┐
│ Client  │         │ Server  │         │   DB    │
└────┬────┘         └────┬────┘         └────┬────┘
     │                   │                   │
     │  POST /login      │                   │
     │ {email, password} │                   │
     │──────────────────>│                   │
     │                   │  Find user        │
     │                   │──────────────────>│
     │                   │<──────────────────│
     │                   │                   │
     │                   │ Verify password   │
     │                   │ (bcrypt.compare)  │
     │                   │                   │
     │                   │ Generate JWT      │
     │                   │                   │
     │   Set-Cookie:     │                   │
     │   token=jwt...    │                   │
     │<──────────────────│                   │
     │                   │                   │
```

### 12.2 JWT Token Structure

```javascript
// Payload
{
  "userId": "abc123",
  "role": "teacher",
  "department": "xyz789",
  "iat": 1699000000,
  "exp": 1699604800
}

// Cookie settings
{
  httpOnly: true,      // Prevents XSS
  secure: true,        // HTTPS only (production)
  sameSite: 'strict',  // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
}
```

### 12.3 Password Security

```javascript
// Hashing (on registration/update)
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// Verification (on login)
const isMatch = await bcrypt.compare(inputPassword, user.password);
```

### 12.4 Input Validation

```javascript
// Using express-validator
const validateUser = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').trim().notEmpty(),
  body('role').isIn(['admin', 'principal', 'hod', 'teacher', 'student']),
];
```

---

## 13. Testing Guide

### 13.1 Running Tests

```bash
# Backend tests
cd backend
npm test

# Run specific test file
npm test -- attendance.spec.js

# With coverage report
npm test -- --coverage
```

### 13.2 Test Structure

```javascript
// tests/attendance.spec.js
describe('Attendance API', () => {
  describe('POST /api/attendance/mark-v2', () => {
    it('should mark attendance for students', async () => {
      const response = await request(app)
        .post('/api/attendance/mark-v2')
        .set('Cookie', authCookie)
        .send({
          subjectId: '...',
          students: [{ studentId: '...', status: 'present' }]
        });
      
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Attendance marked successfully');
    });
    
    it('should reject unauthorized users', async () => {
      const response = await request(app)
        .post('/api/attendance/mark-v2')
        .send({ ... });
      
      expect(response.status).toBe(401);
    });
  });
});
```

### 13.3 Manual Testing Checklist

- [ ] Login with each role
- [ ] Mark attendance (various scenarios)
- [ ] View attendance as student
- [ ] Generate reports
- [ ] Export data (CSV, Excel, PDF)
- [ ] Create/edit/delete users
- [ ] Test on mobile devices
- [ ] Test with slow network

---

## 14. Deployment Guide

### 14.1 Production Build

```bash
# Build frontend
npm run build

# Output in dist/ folder
```

### 14.2 Environment Setup

```env
# Production .env
NODE_ENV=production
PORT=5000

MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/campus_checkin

JWT_SECRET=<very-long-random-string>
JWT_EXPIRES_IN=7d

CORS_ORIGIN=https://your-domain.com
```

### 14.3 PM2 Deployment

```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start src/index.js --name "campus-api"

# Save process list
pm2 save

# Setup startup script
pm2 startup
```

### 14.4 Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend
    location / {
        root /var/www/campus-check-in/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # API Proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 14.5 SSL Setup

```bash
# Using Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 15. Troubleshooting

### 15.1 Common Issues

#### MongoDB Connection Failed
```
Error: MongoNetworkError: failed to connect
```
**Solution**:
1. Check if MongoDB is running: `sudo systemctl status mongod`
2. Verify connection string in `.env`
3. Check firewall rules

#### JWT Token Errors
```
Error: JsonWebTokenError: invalid token
```
**Solution**:
1. Clear browser cookies
2. Check JWT_SECRET matches
3. Verify token hasn't expired

#### CORS Errors
```
Access-Control-Allow-Origin error
```
**Solution**:
1. Check CORS_ORIGIN in `.env`
2. Ensure credentials: true in CORS config
3. Verify frontend URL matches

#### Build Failures
```
Error: Module not found
```
**Solution**:
1. Delete node_modules and package-lock.json
2. Run `npm install` again
3. Check for typos in imports

### 15.2 Debug Mode

```javascript
// Enable debug logging
// backend/.env
DEBUG=app:*

// Frontend console
localStorage.setItem('debug', 'true');
```

### 15.3 Health Checks

```bash
# Check API health
curl http://localhost:5000/api/health

# Check database connection
curl http://localhost:5000/api/health/db

# Check memory usage
pm2 monit
```

---

## 16. PHP Migration Guide

For institutions requiring PHP implementation, comprehensive migration resources are available:

### 16.1 Available Resources

| File | Description |
|------|-------------|
| `doc/php/schema.sql` | Complete MySQL database schema |
| `doc/php/relations.md` | Entity relationship diagrams |
| `doc/php/convert-to-php.md` | Step-by-step conversion guide |
| `doc/php/seed-users.sql` | Sample data with credentials |
| `doc/php/node-modules-used.md` | PHP equivalents for npm packages |

### 16.2 Migration Timeline

```
Week 1-2: Database setup (MySQL schema)
Week 3-4: Authentication system
Week 5-6: Core CRUD operations
Week 7-8: Attendance marking
Week 9-10: Reports and exports
Week 11-12: Testing and deployment
```

📖 **Full Migration Guide**: See [doc/php/convert-to-php.md](../doc/php/convert-to-php.md)

---

## 17. Best Practices

### 17.1 Code Quality

- ✅ Use TypeScript for type safety
- ✅ Follow ESLint rules
- ✅ Write meaningful commit messages
- ✅ Document complex functions
- ✅ Use constants for magic values

### 17.2 Security

- ✅ Never store plain-text passwords
- ✅ Use environment variables for secrets
- ✅ Validate all user input
- ✅ Implement rate limiting
- ✅ Keep dependencies updated

### 17.3 Performance

- ✅ Use database indexes
- ✅ Implement pagination
- ✅ Cache frequently accessed data
- ✅ Optimize images and assets
- ✅ Use lazy loading for routes

### 17.4 Accessibility

- ✅ Use semantic HTML
- ✅ Add ARIA labels
- ✅ Ensure keyboard navigation
- ✅ Maintain color contrast
- ✅ Test with screen readers

---

## 18. FAQ

### Q: How do I reset a user's password?
**A**: Admin can reset via User Management → Edit User → Generate New Password.

### Q: Can attendance be edited after marking?
**A**: Yes, within the "Late Marking Days" limit (default 7 days). Use Attendance History → Edit.

### Q: How are students promoted to the next year?
**A**: Admin → Promotions → Select department and year → Preview → Confirm.

### Q: Can I import students from Excel?
**A**: Yes, Admin → Users → Bulk Upload. Download the CSV template first.

### Q: How is attendance percentage calculated?
**A**: `(Present + Late) / Total Classes × 100`

### Q: Can the system work offline?
**A**: Currently no. Future enhancement planned with service workers.

### Q: How do I backup the database?
**A**: Use `mongodump` for MongoDB or export via Admin → Settings → Backup.

### Q: Is there an API for mobile apps?
**A**: Yes, all endpoints support REST API calls. See API documentation.

---

## 📞 Support

For issues or questions:

1. Check this guide first
2. Review [Troubleshooting](#15-troubleshooting)
3. Search existing issues on GitHub
4. Create a new issue with details

---

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">
  <strong>Happy Attendance Tracking! 🎓</strong>
</p>
