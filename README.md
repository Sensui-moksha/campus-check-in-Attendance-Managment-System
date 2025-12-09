<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-6.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
</p>

<h1 align="center">🎓 Campus Check-In</h1>

<p align="center">
  <strong>A Modern College Attendance Management System</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#demo">Demo</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#api">API</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#documentation">Documentation</a>
</p>

---

## 📖 About

**Campus Check-In** is a comprehensive, full-stack attendance management system designed for educational institutions. It features role-based access control (RBAC) with support for Admin, Principal, HOD, Teacher, and Student roles, each with tailored dashboards and permissions.

The system enables teachers to mark attendance efficiently, generates detailed analytics and reports, and provides students with real-time access to their attendance records.

---

## ✨ Features

### 🔐 Authentication & Authorization
- Secure JWT-based authentication with httpOnly cookies
- Role-based access control (5 roles: Admin, Principal, HOD, Teacher, Student)
- Department-level access restrictions for HODs
- Password hashing with bcrypt (10 rounds)

### 👥 User Management
- Bulk user creation via CSV/Excel upload
- Student, Teacher, HOD management
- Department and Course management
- Automatic student promotion between years

### 📊 Attendance Management
- Real-time attendance marking (Present/Absent/Late/Excused)
- Subject-wise attendance tracking
- Bulk attendance operations
- Attendance history with filters
- Undo functionality for corrections

### 📈 Analytics & Reports
- Interactive dashboards for each role
- Department-wise attendance analytics
- Student attendance trends and graphs
- Export to CSV, Excel, and PDF formats
- Custom report templates

### 📅 Timetable Management
- Class schedule management
- Teacher assignment to subjects
- Period-wise attendance integration
- Semester-based organization

### ⚠️ Detention System
- Automatic detention suggestions based on attendance threshold
- Manual detention management
- Release and history tracking
- Notification support

### 📱 Responsive Design
- Mobile-first approach
- 8 custom breakpoints (375px to 1920px)
- Touch-friendly interface
- WCAG AA accessibility compliant

---

## 🖼️ Screenshots

<details>
<summary>Click to view screenshots</summary>

### Login Page
Clean, modern login interface with email/roll number authentication.

### Student Dashboard
Overview of attendance statistics, upcoming classes, and quick actions.

### Teacher Attendance View
Efficient attendance marking interface with student list and status buttons.

### Admin Dashboard
Comprehensive system overview with user management and analytics.

### HOD Reports
Department-specific analytics and exportable reports.

</details>

---

## 🚀 Demo

### Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@campus.edu | Admin@123 |
| Principal | principal@campus.edu | Principal@123 |
| HOD | hod.cse@campus.edu | Hod@123 |
| Teacher | teacher1.cse@campus.edu | Teacher@123 |
| Student | student001.cse@campus.edu | Student@123 |

---

## 📥 Installation

### Prerequisites

- **Node.js** 18.x or higher
- **MongoDB** 6.0 or higher
- **npm** or **yarn**

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/campus-check-in.git
cd campus-check-in

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI and JWT secret

# Run both frontend and backend
npm run dev
```

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/campus_checkin

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

## 📁 Project Structure

```
campus-check-in/
├── 📂 backend/                    # Express.js Backend
│   ├── 📂 scripts/                # Utility scripts
│   │   ├── create-admin-user.js   # Create admin users
│   │   └── init-system-settings.js
│   ├── 📂 src/
│   │   ├── 📂 config/             # Configuration files
│   │   ├── 📂 controllers/        # Route controllers
│   │   │   ├── authController.js
│   │   │   ├── attendanceController.js
│   │   │   ├── userController.js
│   │   │   ├── reportController.js
│   │   │   └── ... (15+ controllers)
│   │   ├── 📂 middleware/         # Express middleware
│   │   │   ├── auth.js            # JWT authentication
│   │   │   ├── authorize.js       # Role authorization
│   │   │   └── errorHandler.js
│   │   ├── 📂 models/             # Mongoose models
│   │   │   ├── User.js
│   │   │   ├── Attendance.js
│   │   │   ├── Subject.js
│   │   │   └── ... (14 models)
│   │   ├── 📂 routes/             # API routes
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── attendance.js
│   │   │   └── ... (20+ route files)
│   │   ├── 📂 utils/              # Utility functions
│   │   ├── app.js                 # Express app setup
│   │   └── index.js               # Server entry point
│   ├── 📂 tests/                  # Backend tests
│   ├── 📂 uploads/                # File uploads directory
│   ├── .env.example
│   ├── package.json
│   └── POSTMAN_COLLECTION.json    # API testing collection
│
├── 📂 src/                        # React Frontend
│   ├── 📂 api/                    # API client
│   │   └── index.ts               # Axios configuration
│   ├── 📂 components/             # React components
│   │   ├── 📂 layout/             # Layout components
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── 📂 ui/                 # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ... (25+ components)
│   │   ├── AttendanceCalendar.tsx
│   │   ├── FileUploader.tsx
│   │   └── ProtectedRoute.tsx
│   ├── 📂 contexts/               # React contexts
│   │   └── AuthContext.tsx        # Authentication context
│   ├── 📂 hooks/                  # Custom hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── 📂 pages/                  # Page components
│   │   ├── 📂 admin/              # Admin pages
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Users.tsx
│   │   │   ├── Departments.tsx
│   │   │   └── Settings.tsx
│   │   ├── 📂 hod/                # HOD pages
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Teachers.tsx
│   │   │   └── Reports.tsx
│   │   ├── 📂 teacher/            # Teacher pages
│   │   │   ├── Dashboard.tsx
│   │   │   ├── MarkAttendance.tsx
│   │   │   └── MyClasses.tsx
│   │   ├── 📂 student/            # Student pages
│   │   │   ├── Dashboard.tsx
│   │   │   └── MyAttendance.tsx
│   │   ├── Login.tsx
│   │   ├── Profile.tsx
│   │   └── ViewTimetable.tsx
│   ├── 📂 types/                  # TypeScript types
│   ├── 📂 utils/                  # Utility functions
│   ├── App.tsx                    # Main App component
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styles
│
├── 📂 doc/                        # Documentation
│   ├── 00-MASTER-INDEX.md         # Documentation index
│   ├── API-ENDPOINTS.md           # Complete API reference
│   ├── 📂 frontend-doc/           # Frontend documentation
│   ├── 📂 backend-doc/            # Backend documentation
│   └── 📂 php/                    # PHP migration resources
│       ├── schema.sql             # MySQL schema
│       ├── relations.md           # Database ERD
│       └── convert-to-php.md      # Migration guide
│
├── 📂 public/                     # Static assets
├── 📂 tests/                      # E2E tests
│
├── .gitignore
├── index.html                     # HTML entry point
├── package.json                   # Frontend dependencies
├── tailwind.config.ts             # Tailwind configuration
├── tsconfig.json                  # TypeScript configuration
├── vite.config.ts                 # Vite configuration
└── README.md                      # This file
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI library with hooks |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | UI component library |
| **Radix UI** | Accessible primitives |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client |
| **Recharts** | Data visualization |
| **Lucide React** | Icon library |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **MongoDB** | Database |
| **Mongoose** | ODM for MongoDB |
| **JWT** | Authentication tokens |
| **bcrypt** | Password hashing |
| **Multer** | File uploads |
| **ExcelJS** | Excel generation |
| **PDFKit** | PDF generation |
| **csv-parser** | CSV processing |

---

## 📚 API Reference

### Authentication
```http
POST   /api/auth/login          # Login
POST   /api/auth/logout         # Logout
GET    /api/auth/me             # Get current user
```

### Users
```http
GET    /api/users               # List users
POST   /api/users               # Create user
GET    /api/students            # List students
GET    /api/teachers            # List teachers
PUT    /api/students/:id        # Update student
DELETE /api/students/:id        # Delete student
```

### Attendance
```http
POST   /api/attendance/mark-v2  # Mark attendance
GET    /api/attendance/history  # Get attendance history
GET    /api/attendance/by-class # Get by class
PUT    /api/attendance/session/:id # Update session
```

### Reports & Exports
```http
GET    /api/reports/department/:id  # Department report
GET    /api/reports/college         # College report
GET    /api/exports/course/:id      # Export course data
GET    /api/analytics/college/summary # Analytics
```

📖 **Full API Documentation:** See [doc/API-ENDPOINTS.md](./doc/API-ENDPOINTS.md) for complete endpoint reference with request/response examples.

---

## 🔧 Available Scripts

### Root Directory
```bash
npm run dev          # Run frontend + backend concurrently
npm run build        # Build frontend for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend Directory
```bash
npm start            # Start production server
npm run dev          # Start development server with nodemon
npm test             # Run tests
```

### Utility Scripts
```bash
# Create admin user
node backend/scripts/create-admin-user.js

# Initialize system settings
node backend/scripts/init-system-settings.js
```

---

## 📊 Database Models

| Model | Description |
|-------|-------------|
| **User** | Students, teachers, HODs, admins |
| **Department** | Academic departments |
| **Course** | Course/program information |
| **Subject** | Subject details with credits |
| **Timetable** | Class schedules |
| **Attendance** | Attendance records |
| **ClassSession** | Individual class sessions |
| **TeacherAssignment** | Teacher-subject mappings |
| **Semester** | Academic semesters |
| **DetainedStudent** | Detention records |
| **AuditLog** | System activity logs |
| **ExportTemplate** | Custom export configurations |
| **SystemSettings** | Global settings |

---

## 🔒 Security Features

- ✅ JWT tokens with httpOnly cookies (XSS protection)
- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ Role-based access control (RBAC)
- ✅ Input validation with express-validator
- ✅ CORS configuration
- ✅ Department-level data isolation
- ✅ Rate limiting ready (optional)

---

## 📱 Responsive Breakpoints

| Breakpoint | Width | Target Device |
|------------|-------|---------------|
| `xs` | 375px | Small phones |
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1440px | Large desktops |
| `3xl` | 1600px | Wide screens |
| `4xl` | 1920px | Full HD |

---

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run specific test file
npm test -- attendance.spec.js

# Run with coverage
npm test -- --coverage
```

---

## 📄 Documentation

### 📚 Main Guides

| Document | Description |
|----------|-------------|
| [🎯 Detailed Project Guide](./guides/DETAILED_PROJECT_GUIDE.md) | **Comprehensive documentation** - Architecture, APIs, Security, Deployment |
| [API Endpoints](./doc/API-ENDPOINTS.md) | Complete REST API reference (120+ endpoints) |
| [Frontend Guide](./doc/frontend-doc/00-README.md) | React architecture & components |
| [Backend Guide](./doc/backend-doc/00-README.md) | Express.js & MongoDB setup |
| [Master Index](./doc/00-MASTER-INDEX.md) | Full documentation index |

### 📂 Additional Guides (./guides/)

| Guide | Description |
|-------|-------------|
| [Detailed Project Guide](./guides/DETAILED_PROJECT_GUIDE.md) | Complete system architecture, API docs, deployment guide |
| [Changelog](./guides/CHANGELOG.md) | Project version history and updates |
| [Code Snippets](./guides/CODE_SNIPPETS.md) | Useful code examples and patterns |
| [Implementation Summary](./guides/IMPLEMENTATION_SUMMARY.md) | Feature implementation details |
| [QA Testing Checklist](./guides/QA_TESTING_CHECKLIST.md) | Testing procedures and checklist |
| [Responsive Design Guide](./guides/RESPONSIVE_GUIDE.md) | Mobile-first responsive design patterns |
| [Submission Summary](./guides/SUBMISSION-SUMMARY.md) | Project submission overview |
| [UI Improvements Guide](./guides/UI_IMPROVEMENTS_GUIDE.md) | UI/UX enhancements documentation |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

**© 2025 Dontiboina Mokshyagna Yadav. All Rights Reserved.**

This project and its source code are proprietary and confidential. Unauthorized copying, modification, distribution, or use of this software, via any medium, is strictly prohibited without explicit written permission from the author.

For licensing inquiries, please contact the author.

---

## 👨‍💻 Author

**Dontiboina Mokshyagna Yadav**

- GitHub: [@Sensui-moksha](https://github.com/Sensui-moksha)

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Radix UI](https://www.radix-ui.com/) for accessible primitives
- [Lucide](https://lucide.dev/) for beautiful icons

---


<p align="center">
  ⭐ Star this repo if you find it helpful!
</p>
#   c a m p u s - c h e c k - i n - A t t e n d a n c e - M a n a g m e n t - S y s t e m  
 