# Frontend Documentation Overview

## 📱 Campus Check-In Frontend Architecture

**Framework:** React 18 + TypeScript  
**Build Tool:** Vite 5  
**Styling:** Tailwind CSS v3 + shadcn/ui  
**State Management:** React Context API

---

## 🗂️ Directory Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (Header, Sidebar, Footer)
│   ├── ui/             # shadcn/ui components (Button, Card, Dialog, etc.)
│   ├── AttendanceCalendar.tsx
│   ├── AttendanceRow.tsx
│   ├── DetainModal.tsx
│   ├── FileUploader.tsx
│   ├── NavLink.tsx
│   ├── PeriodFilter.tsx
│   ├── ProtectedRoute.tsx
│   └── Selectors.tsx
├── contexts/           # React Context providers
│   └── AuthContext.tsx
├── hooks/              # Custom React hooks
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── lib/                # Utility functions
│   └── utils.ts
├── pages/              # Page components (routes)
│   ├── admin/         # Admin-specific pages
│   ├── hod/           # HOD-specific pages
│   ├── student/       # Student-specific pages
│   ├── teacher/       # Teacher-specific pages
│   ├── AttendanceHistory.tsx
│   ├── AttendancePage.tsx
│   ├── Forbidden.tsx
│   ├── Index.tsx
│   ├── Login.tsx
│   ├── NotFound.tsx
│   ├── Profile.tsx
│   └── ViewTimetable.tsx
├── styles/             # Style utilities
│   └── tokens.js
├── types/              # TypeScript type definitions
│   ├── api.d.ts
│   └── auth.ts
├── utils/              # Utility functions
│   └── semesterUtils.ts
├── api/                # API client
│   └── index.ts
├── App.tsx             # Main app component
├── main.tsx            # App entry point
└── index.css           # Global styles
```

---

## 📋 Documentation Standards

Each component documentation file includes:

### 1. **Purpose**
- What the component does
- Where it's used in the application
- Key use cases

### 2. **Exports**
- Default exports
- Named exports
- Types/interfaces

### 3. **Props**
- Prop name
- Type definition
- Required/optional
- Description
- Default value

### 4. **State & Lifecycle**
- useState hooks
- useEffect hooks
- Custom hooks
- Lifecycle events

### 5. **Key Functions**
- Function signatures
- Line numbers
- Purpose
- Parameters
- Return values

### 6. **API Calls**
- Endpoints called
- Request payloads
- Response handling
- Error handling

### 7. **Dependencies**
- Imported components
- NPM libraries
- Context providers
- Custom hooks

### 8. **Styling**
- Tailwind classes used
- Responsive breakpoints
- Custom CSS
- Theme variables

### 9. **Accessibility**
- ARIA attributes
- Keyboard navigation
- Screen reader support
- Focus management

### 10. **Testing**
- Unit tests
- Integration tests
- Manual test steps

### 11. **Migration Notes**
- Breaking changes
- Deprecations
- Upgrade paths

---

## 🎯 Component Categories

### Layout Components (`components/layout/`)
- **DashboardLayout.tsx** - Main layout wrapper with sidebar
- **AppHeader.tsx** - Top navigation bar
- **AppSidebar.tsx** - Left sidebar navigation
- **OverlayFooter.tsx** - Footer overlay

### UI Components (`components/ui/`)
shadcn/ui components (25+ components):
- Button, Card, Dialog, Input, Label
- Badge, Avatar, Select, Dropdown
- Table, Tabs, Toast, Tooltip
- And more...

### Feature Components (`components/`)
- **AttendanceCalendar.tsx** - Monthly attendance view
- **AttendanceRow.tsx** - Student attendance row
- **DetainModal.tsx** - Student detention dialog
- **FileUploader.tsx** - File upload component
- **NavLink.tsx** - Active navigation link
- **PeriodFilter.tsx** - Period selection filter
- **ProtectedRoute.tsx** - Route authentication wrapper
- **Selectors.tsx** - Dropdown selectors

### Page Components (`pages/`)
35+ page components organized by role

---

## 🔐 Authentication Flow

```
User visits protected route
    ↓
ProtectedRoute checks AuthContext
    ↓
If authenticated → Render page
If not authenticated → Redirect to /login
    ↓
Login page submits credentials
    ↓
AuthContext.login() calls API
    ↓
JWT token stored in httpOnly cookie
    ↓
User data stored in AuthContext
    ↓
Redirect to role-specific dashboard
```

---

## 🎨 Styling System

### Tailwind Configuration
- **Breakpoints:** xs (375px), sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1440px)
- **Colors:** Role-based accent colors, status colors, semantic colors
- **Spacing:** 8px base scale
- **Typography:** Inter font family, responsive text sizes
- **Animations:** Custom keyframes, smooth transitions

### CSS Variables (in `index.css`)
```css
--background, --foreground
--primary, --secondary, --accent
--muted, --destructive
--space-1 through --space-7
--shadow-soft, --shadow-medium, --shadow-strong
--ease-smooth, --dur-fast, --dur-medium
```

### Responsive Patterns
```tsx
// Text scaling
<h1 className="text-2xl sm:text-3xl lg:text-4xl">

// Layout grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Spacing
<div className="p-4 sm:p-6 lg:p-8">

// Visibility
<div className="hidden lg:block">  // Desktop only
<div className="block lg:hidden">  // Mobile only
```

---

## 📊 State Management

### Global State (Context API)
- **AuthContext** - User authentication state
  - Current user
  - Login/logout functions
  - Role-based permissions
  - Loading states

### Local State (useState)
- Form inputs
- UI toggles
- Modal visibility
- Temporary data

### Server State (React Query)
- API data caching
- Automatic refetching
- Background updates
- Optimistic updates

---

## 🔌 API Integration

### API Client (`api/index.ts`)
Centralized Axios instance with:
- Base URL configuration
- Request interceptors
- Response interceptors
- Error handling
- Credential inclusion

### API Modules
```typescript
api.auth.login(credentials)
api.auth.logout()
api.users.getProfile()
api.users.update(id, data)
api.attendance.mark(data)
api.attendance.getHistory(params)
// ... and more
```

### Error Handling
```typescript
try {
  const response = await api.someEndpoint();
  // Handle success
} catch (error) {
  if (error.response?.status === 401) {
    // Redirect to login
  }
  toast.error(error.response?.data?.message || 'An error occurred');
}
```

---

## 🧪 Testing Strategy

### Unit Tests
- Component rendering
- Props validation
- State changes
- Event handlers

### Integration Tests
- User flows
- API integration
- Context providers
- Route navigation

### E2E Tests
- Complete user journeys
- Role-based workflows
- Form submissions
- Error scenarios

### Manual Testing
- Responsive design (all breakpoints)
- Cross-browser compatibility
- Accessibility (keyboard + screen reader)
- Performance (Lighthouse)

---

## ♿ Accessibility Guidelines

### WCAG AA Compliance
- ✅ Color contrast ratios: 4.5:1 (normal text), 3:1 (large text)
- ✅ Keyboard navigation: All interactive elements
- ✅ Focus indicators: Visible on all focusable elements
- ✅ ARIA labels: Proper semantic markup
- ✅ Screen reader support: Meaningful announcements

### Implementation
```tsx
// Keyboard-friendly button
<button
  aria-label="Close modal"
  onClick={handleClose}
  className="focus-ring"
>
  <X className="h-5 w-5" />
</button>

// Form with labels
<Label htmlFor="email">Email Address</Label>
<Input
  id="email"
  type="email"
  aria-describedby="email-error"
  aria-invalid={!!errors.email}
/>
{errors.email && (
  <span id="email-error" role="alert">
    {errors.email}
  </span>
)}
```

---

## 🚀 Performance Optimization

### Code Splitting
```tsx
// Lazy load pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

// Suspense boundary
<Suspense fallback={<Loading />}>
  <AdminDashboard />
</Suspense>
```

### Memoization
```tsx
// Expensive calculations
const computedValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

// Callback stability
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);
```

### Bundle Optimization
- Tree shaking (Vite default)
- Dynamic imports for large components
- Minimize third-party dependencies
- Use production builds

---

## 🔧 Development Workflow

### Setup
```bash
# Install dependencies
npm install

# Start dev server
npm run dev  # http://localhost:3000

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Standards
- **TypeScript:** Strict mode enabled
- **ESLint:** Airbnb config + React rules
- **Prettier:** Auto-formatting on save
- **Naming:** PascalCase for components, camelCase for functions

### Git Workflow
```bash
# Feature branch
git checkout -b feature/new-component

# Commit with conventional commits
git commit -m "feat: add new dashboard widget"

# Push and create PR
git push origin feature/new-component
```

---

## 📖 Component Documentation Index

### Layout Components
- [DashboardLayout.tsx](./components/layout/DashboardLayout.md)
- [AppHeader.tsx](./components/layout/AppHeader.md)
- [AppSidebar.tsx](./components/layout/AppSidebar.md)

### Authentication
- [AuthContext.tsx](./contexts/AuthContext.md)
- [ProtectedRoute.tsx](./components/ProtectedRoute.md)
- [Login.tsx](./pages/Login.md)

### Core Pages
- [Profile.tsx](./pages/Profile.md)
- [AttendanceHistory.tsx](./pages/AttendanceHistory.md)
- [ViewTimetable.tsx](./pages/ViewTimetable.md)

### Student Pages
- [StudentDashboard.tsx](./pages/student/StudentDashboard.md)
- [ConductedClasses.tsx](./pages/student/ConductedClasses.md)
- [StudentHistory.tsx](./pages/student/StudentHistory.md)

### Teacher Pages
- [TeacherDashboard.tsx](./pages/teacher/TeacherDashboard.md)
- [MarkAttendance.tsx](./pages/teacher/MarkAttendance.md)
- [Reports.tsx](./pages/teacher/Reports.md)

### Admin Pages
- [AdminDashboard.tsx](./pages/admin/AdminDashboard.md)
- [CreateUser.tsx](./pages/admin/CreateUser.md)
- [ManageSubjects.tsx](./pages/admin/ManageSubjects.md)

*(See individual files for detailed documentation)*

---

## 🐛 Common Issues & Solutions

### Issue: White screen on load
**Solution:** Check console for errors, verify API URL in `.env`

### Issue: Login redirects to login
**Solution:** Check cookie settings, verify JWT_SECRET matches backend

### Issue: Styles not applying
**Solution:** Check Tailwind config, rebuild with `npm run build`

### Issue: Component not rendering
**Solution:** Check imports, verify export/import syntax

---

## 📚 External Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Vite Guide](https://vitejs.dev/guide/)

---

**Last Updated:** December 9, 2025  
**Version:** 2.0.0
