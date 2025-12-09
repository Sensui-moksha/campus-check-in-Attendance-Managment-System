const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const departmentsRoutes = require('./routes/departments');
const coursesRoutes = require('./routes/courses');
const subjectsRoutes = require('./routes/subjects');
const attendanceRoutes = require('./routes/attendance');
const sessionsRoutes = require('./routes/sessions');
const reportsRoutes = require('./routes/reports');
const importsRoutes = require('./routes/imports');
const exportsRoutes = require('./routes/exports');
const timetableRoutes = require('./routes/timetable');
const analyticsRoutes = require('./routes/analytics');
const attendanceUndoRoutes = require('./routes/attendanceUndo');
const exportTemplatesRoutes = require('./routes/exportTemplates');
const sectionsRoutes = require('./routes/sections');
const detainRoutes = require('./routes/detain');
const promotionsRoutes = require('./routes/promotions');
const teachersRoutes = require('./routes/teachers');
const semestersRoutes = require('./routes/semesters');
const adminRoutes = require('./routes/admin');
const studentsRoutes = require('./routes/students');
const classesRoutes = require('./routes/classes');
const adminSettingsRoutes = require('./routes/adminSettings');

const app = express();

// Middleware
// CORS configuration - allow from all origins in development
const corsOptions = {
  origin: function(origin, callback) {
    // In development, allow ALL origins (any IP, localhost, etc.)
    if (process.env.NODE_ENV === 'development') {
      callback(null, true); // Allow any origin
    } else {
      // In production, restrict to specific origins
      const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',');
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true, // Allow cookies to be sent/received
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Also allow all origins as fallback for preflight requests
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', usersRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/departments', sectionsRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/sessions', attendanceUndoRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/imports', importsRoutes);
app.use('/api/exports', exportsRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin/export-templates', exportTemplatesRoutes);
app.use('/api/detain', detainRoutes);
app.use('/api/admin', promotionsRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/semesters', semestersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/admin', adminSettingsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use(errorHandler);

module.exports = app;
