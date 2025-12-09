# Campus Check-In - Master Documentation Index

## 📚 Documentation Structure

This documentation covers the complete Campus Check-In Attendance Management System including frontend, backend, and PHP migration guides.

**Generated:** December 9, 2025  
**Version:** 2.0.0  
**Status:** Production Ready

---

## 📁 Folder Structure

```
doc/
├── 00-MASTER-INDEX.md          # This file
├── frontend-doc/               # React/TypeScript frontend documentation
│   ├── 00-README.md           # Frontend documentation overview
│   ├── components/            # Component documentation
│   ├── pages/                 # Page documentation
│   └── contexts/              # Context documentation
├── backend-doc/               # Node.js/Express backend documentation
│   ├── 00-README.md          # Backend documentation overview
│   ├── API-endpoints.md      # Complete API reference
│   ├── controllers/          # Controller documentation
│   ├── models/               # Database model documentation
│   └── services/             # Service layer documentation
└── php/                       # PHP migration resources
    ├── schema.sql            # MySQL database schema
    ├── relations.md          # Database relationships
    ├── convert-to-php.md     # Node → PHP conversion guide
    ├── node-modules-used.md  # Dependency reference
    ├── seed-users.sql        # SQL seed script
    └── seed-users-node.js    # Node seed script (prints credentials)
```

---

## 🎯 Quick Navigation

### Frontend Documentation
- **React Components:** `frontend-doc/components/`
- **Page Components:** `frontend-doc/pages/`
- **Authentication:** `frontend-doc/contexts/AuthContext.md`
- **UI Components:** `frontend-doc/components/ui/`
- **Layout System:** `frontend-doc/components/layout/`

### Backend Documentation
- **API Reference:** `backend-doc/API-endpoints.md`
- **Controllers:** `backend-doc/controllers/`
- **Database Models:** `backend-doc/models/`
- **Authentication:** `backend-doc/middleware/auth.md`
- **Authorization:** `backend-doc/middleware/authorize.md`

### PHP Migration
- **Database Schema:** `php/schema.sql`
- **Conversion Guide:** `php/convert-to-php.md`
- **Seed Users:** `php/seed-users-node.js`

---

## 🚀 Getting Started with Documentation

### For New Developers
1. Start with `frontend-doc/00-README.md` for frontend overview
2. Read `backend-doc/00-README.md` for backend architecture
3. Review `backend-doc/API-endpoints.md` for API contracts
4. Check `php/convert-to-php.md` if migrating to PHP

### For Frontend Developers
1. Review component documentation in `frontend-doc/components/`
2. Understand the layout system in `frontend-doc/components/layout/`
3. Study authentication flow in `frontend-doc/contexts/AuthContext.md`
4. Reference UI patterns in responsive guides

### For Backend Developers
1. Study model relationships in `backend-doc/models/`
2. Understand controller patterns in `backend-doc/controllers/`
3. Review middleware chain in `backend-doc/middleware/`
4. Check API endpoints in `backend-doc/API-endpoints.md`

### For PHP Developers
1. Start with `php/schema.sql` for database structure
2. Read `php/relations.md` for entity relationships
3. Follow `php/convert-to-php.md` for migration steps
4. Use `php/seed-users-node.js` to create test users

---

## 📋 Documentation Standards

### Every Frontend Component Document Includes:
- ✅ Purpose and usage context
- ✅ Exported components/functions
- ✅ Props with types and descriptions
- ✅ State management details
- ✅ Key functions with line numbers
- ✅ API calls and endpoints
- ✅ Dependencies (imports)
- ✅ Styling approach (Tailwind classes)
- ✅ Accessibility considerations
- ✅ Testing approach
- ✅ Migration notes

### Every Backend Document Includes:
- ✅ File purpose and responsibilities
- ✅ Exported functions/classes
- ✅ Route → Controller mapping
- ✅ Function signatures with line numbers
- ✅ Database models used
- ✅ Request/response examples
- ✅ Security requirements
- ✅ Error handling patterns
- ✅ Test coverage
- ✅ Known issues/TODOs

---

## 🗂️ Key Files Reference

### Critical Frontend Files
| File | Location | Purpose |
|------|----------|---------|
| App.tsx | `src/App.tsx` | Main app router |
| AuthContext | `src/contexts/AuthContext.tsx` | Authentication state |
| DashboardLayout | `src/components/layout/DashboardLayout.tsx` | Main layout wrapper |
| Profile | `src/pages/Profile.tsx` | User profile page |
| Login | `src/pages/Login.tsx` | Login page |

### Critical Backend Files
| File | Location | Purpose |
|------|----------|---------|
| app.js | `backend/src/app.js` | Express app setup |
| authController | `backend/src/controllers/authController.js` | Auth endpoints |
| User model | `backend/src/models/User.js` | User database model |
| auth middleware | `backend/src/middleware/auth.js` | JWT verification |
| config | `backend/src/config/index.js` | Environment config |

---

## 🔐 Seed Users Script

### Quick Start
```bash
cd doc/php
node seed-users-node.js
```

**Output shows:**
```
=== SEEDED USERS ===
Admin     → admin@example.com  | Password: Admin@123
Principal → principal@example.com | Password: Principal@123
HOD       → hod@example.com  | Password: Hod@123
=====================
```

**⚠️ Save these credentials securely!**

---

## 📊 Technology Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 5
- **Routing:** React Router v6
- **Styling:** Tailwind CSS v3
- **UI Components:** Radix UI + shadcn/ui
- **State Management:** React Context API
- **HTTP Client:** Axios
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js v18+
- **Framework:** Express.js v4
- **Database:** MongoDB (Mongoose ODM)
- **Authentication:** JWT + bcrypt
- **Session:** Cookie-based sessions
- **Validation:** Express Validator
- **File Upload:** Multer
- **Excel:** ExcelJS
- **CSV:** csv-parser + csv-writer

### DevOps
- **Version Control:** Git
- **Package Manager:** npm
- **Environment:** dotenv
- **Testing:** Jest + Supertest

---

## 🎓 User Roles & Permissions

### Role Hierarchy
```
admin / principal (highest)
    ↓
  hod (department head)
    ↓
teacher (instructor)
    ↓
student (lowest)
```

### Permission Matrix
| Feature | Student | Teacher | HOD | Admin | Principal |
|---------|---------|---------|-----|-------|-----------|
| View own attendance | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mark attendance | ❌ | ✅ | ✅ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ⚠️ (dept) | ✅ | ✅ |
| Manage subjects | ❌ | ❌ | ⚠️ (dept) | ✅ | ✅ |
| View reports | ⚠️ (own) | ⚠️ (taught) | ⚠️ (dept) | ✅ | ✅ |
| Detain students | ❌ | ❌ | ✅ | ✅ | ✅ |
| System settings | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 📈 Project Statistics

### Frontend
- **Total Components:** 50+
- **Total Pages:** 35+
- **UI Components:** 25+ (shadcn/ui)
- **Context Providers:** 2
- **Custom Hooks:** 3

### Backend
- **Total Models:** 15
- **Total Controllers:** 20
- **Total Routes:** 100+
- **Middleware:** 5
- **Utility Functions:** 10+

### Lines of Code
- **Frontend:** ~15,000 lines
- **Backend:** ~10,000 lines
- **Total:** ~25,000 lines

---

## 🧪 Testing Checklist

### Frontend Tests
- [ ] Component rendering
- [ ] User interactions
- [ ] Form validation
- [ ] API integration
- [ ] Routing
- [ ] Authentication flow
- [ ] Responsive design (320px - 1920px)
- [ ] Accessibility (WCAG AA)

### Backend Tests
- [ ] Unit tests (models, utilities)
- [ ] Integration tests (controllers)
- [ ] API endpoint tests
- [ ] Authentication tests
- [ ] Authorization tests
- [ ] Database operations
- [ ] Error handling
- [ ] Performance tests

---

## 🔧 Development Workflow

### Setup
```bash
# Clone repository
git clone <repo-url>

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Setup environment
cp .env.example .env
# Edit .env with your values

# Start MongoDB
mongod

# Start backend
npm run dev

# Start frontend (new terminal)
cd ..
npm run dev
```

### Daily Development
1. Pull latest changes: `git pull origin main`
2. Check for dependency updates: `npm outdated`
3. Run tests before committing: `npm test`
4. Follow code style guides
5. Update documentation for new features

---

## 📞 Support & Resources

### Documentation Issues
- Check the relevant section's README first
- Review code comments in source files
- Consult API endpoint documentation
- Check migration guides for PHP conversion

### Common Issues
- **MongoDB Connection:** Verify `MONGO_URI` in config
- **CORS Errors:** Check `backend/src/app.js` CORS settings
- **JWT Errors:** Verify `JWT_SECRET` in config
- **Build Errors:** Clear node_modules and reinstall

---

## 🎯 Next Steps

### For Immediate Use
1. ✅ Review `frontend-doc/00-README.md`
2. ✅ Review `backend-doc/00-README.md`
3. ✅ Read `backend-doc/API-endpoints.md`
4. ✅ Run seed script: `node doc/php/seed-users-node.js`
5. ✅ Test login with seeded credentials

### For PHP Migration
1. ✅ Study `php/schema.sql`
2. ✅ Read `php/relations.md`
3. ✅ Follow `php/convert-to-php.md`
4. ✅ Adapt controllers to PHP (Laravel/Symfony)
5. ✅ Test with PHP seed script

### For Deployment
1. ✅ Build frontend: `npm run build`
2. ✅ Configure production environment variables
3. ✅ Setup MongoDB replica set
4. ✅ Configure reverse proxy (Nginx)
5. ✅ Enable SSL/TLS
6. ✅ Setup monitoring and logging

---

## 📝 Change Log

### v2.0.0 (December 9, 2025)
- ✨ Added comprehensive UI improvements
- ✨ Responsive design system (mobile-first)
- ✨ Enhanced profile page
- ✨ Smooth animations and transitions
- ✨ Accessibility improvements (WCAG AA)
- ✨ Admin user creation script
- 📚 Complete documentation generation

### v1.0.0 (Previous)
- Initial release
- Basic attendance management
- User authentication
- Role-based access control

---

## 📄 License

MIT License - See LICENSE file for details

---

**Last Updated:** December 9, 2025  
**Maintained By:** Campus Check-In Development Team  
**Status:** ✅ Production Ready
