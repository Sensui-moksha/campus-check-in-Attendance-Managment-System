import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import {
  Home,
  Table,
  Edit,
  Book,
  BookOpen,
  BarChart3,
  UserPlus,
  FileOutput,
  Upload,
  FileSpreadsheet,
  LucideIcon,
  UserX,
  Settings,
  History,
  Calendar,
  CalendarClock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarLink {
  label: string;
  to: string;
  icon: LucideIcon;
}

const sidebarLinksByRole: Record<UserRole, SidebarLink[]> = {
  student: [
    { label: 'Dashboard', to: '/student/dashboard', icon: Home },
    { label: 'Conducted Classes', to: '/student/conducted-classes', icon: BookOpen },
    { label: 'My Timetable', to: '/student/timetable', icon: Calendar },
    { label: 'Calendar', to: '/student/calendar', icon: CalendarClock },
    { label: 'History', to: '/student/history', icon: Table },
  ],
  teacher: [
    { label: 'Dashboard', to: '/teacher/dashboard', icon: Home },
    { label: 'View Timetable', to: '/teacher/timetable', icon: Calendar },
    { label: 'Mark Attendance', to: '/teacher/mark-attendance', icon: Edit },
    { label: 'Attendance History', to: '/attendance/history', icon: History },
    { label: 'Reports', to: '/teacher/reports', icon: BarChart3 },
  ],
  hod: [
    { label: 'Dashboard', to: '/hod/dashboard', icon: Home },
    { label: 'View Timetable', to: '/hod/timetable', icon: Calendar },
    { label: 'Mark Attendance', to: '/hod/mark-attendance', icon: Edit },
    { label: 'Attendance History', to: '/attendance/history', icon: History },
    { label: 'Manage Teachers', to: '/hod/manage-teachers', icon: UserPlus },
    { label: 'Manage Students', to: '/hod/manage-students', icon: UserPlus },
    { label: 'Manage Subjects', to: '/hod/manage-subjects', icon: BookOpen },
    { label: 'Manage Sections', to: '/hod/manage-sections', icon: Table },
    { label: 'Manage Timetable', to: '/admin/manage-timetable', icon: Table },
    { label: 'Manage Semesters', to: '/admin/manage-semesters', icon: BookOpen },
    { label: 'Detained Students', to: '/admin/detain', icon: UserX },
    { label: 'Department Report', to: '/hod/department-report', icon: BarChart3 },
    { label: 'Import Students', to: '/admin/import-students', icon: Upload },
    { label: 'Export Templates', to: '/admin/export-templates', icon: FileSpreadsheet },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin/dashboard', icon: Home },
    { label: 'View Timetable', to: '/admin/timetable', icon: Calendar },
    { label: 'Mark Attendance', to: '/admin/mark-attendance', icon: Edit },
    { label: 'Attendance History', to: '/attendance/history', icon: History },
    { label: 'Create User', to: '/admin/create-user', icon: UserPlus },
    { label: 'Manage HODs', to: '/admin/manage-hods', icon: UserPlus },
    { label: 'Manage Subjects', to: '/admin/manage-subjects', icon: BookOpen },
    { label: 'Manage Timetable', to: '/admin/manage-timetable', icon: Table },
    { label: 'Manage Semesters', to: '/admin/manage-semesters', icon: BookOpen },
    { label: 'Detained Students', to: '/admin/detain', icon: UserX },
    { label: 'Import Students', to: '/admin/import-students', icon: Upload },
    { label: 'Export Templates', to: '/admin/export-templates', icon: FileSpreadsheet },
    { label: 'Reports', to: '/admin/reports', icon: FileOutput },
    { label: 'Settings', to: '/admin/settings', icon: Settings },
  ],
  principal: [
    { label: 'Dashboard', to: '/principal/dashboard', icon: Home },
    { label: 'View Timetable', to: '/principal/timetable', icon: Calendar },
    { label: 'Mark Attendance', to: '/principal/mark-attendance', icon: Edit },
    { label: 'Attendance History', to: '/attendance/history', icon: History },
    { label: 'Create User', to: '/admin/create-user', icon: UserPlus },
    { label: 'Manage Subjects', to: '/admin/manage-subjects', icon: BookOpen },
    { label: 'Manage Timetable', to: '/admin/manage-timetable', icon: Table },
    { label: 'Manage Semesters', to: '/admin/manage-semesters', icon: BookOpen },
    { label: 'Detained Students', to: '/admin/detain', icon: UserX },
    { label: 'Import Students', to: '/admin/import-students', icon: Upload },
    { label: 'Export Templates', to: '/admin/export-templates', icon: FileSpreadsheet },
    { label: 'Reports', to: '/admin/reports', icon: FileOutput },
  ],
};

const roleAccentBorder: Record<UserRole, string> = {
  student: 'border-l-student-accent',
  teacher: 'border-l-teacher-accent',
  hod: 'border-l-hod-accent',
  admin: 'border-l-admin-accent',
  principal: 'border-l-principal-accent',
};

export function AppSidebar({ isOpen, onClose, isDesktopCollapsed, isHeaderVisible }: { isOpen?: boolean; onClose?: () => void; isDesktopCollapsed?: boolean; isHeaderVisible?: boolean }) {
  const { user } = useAuth();

  if (!user) return null;

  const links = sidebarLinksByRole[user.role];

  return (
    <>
      {/* Desktop sidebar for all users */}
      <aside className={cn(
        "hidden lg:block lg:sticky bg-sidebar border-r border-sidebar-border p-4 pb-20 overflow-auto z-20 transition-all duration-300",
        isHeaderVisible ? "lg:top-16 lg:h-[calc(100vh-8rem)]" : "lg:top-0 lg:h-screen",
        isDesktopCollapsed ? "lg:w-0 lg:p-0 lg:border-0 lg:opacity-0" : "lg:w-64"
      )}>
        <nav className="space-y-1">
          {links.map((link, index) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={cn(
                'flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:translate-x-1 transition-all duration-200 border-l-4 border-transparent animate-slide-in-left',
              )}
              style={{ animationDelay: `${index * 50}ms` }}
              activeClassName={cn(
                'bg-sidebar-accent font-medium',
                roleAccentBorder[user.role]
              )}
            >
              <link.icon className="h-5 w-5" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom navigation for students only */}
      {user.role === 'student' && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-lg backdrop-blur-sm bg-card/95">
          <div className="flex items-center justify-around px-2 py-2">
            {links.map((link, index) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="flex flex-col items-center justify-center gap-1 px-4 py-2 min-w-[70px] rounded-lg text-muted-foreground hover:text-foreground hover:scale-110 transition-all duration-200 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
                activeClassName="text-primary bg-primary/10"
              >
                <link.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{link.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}

      {/* Mobile drawer for all roles */}
      {isOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={onClose} />
          <aside className="relative w-64 bg-sidebar border-r border-sidebar-border p-4 overflow-auto transition-smooth" style={{ transformOrigin: 'left' }}>
            <button aria-label="Close menu" onClick={onClose} className="mb-4 p-2 rounded-md hover:bg-muted transition-smooth">
              Close
            </button>
            <nav className="space-y-1">
              {links.map((link, index) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:translate-x-1 transition-all duration-200 border-l-4 border-transparent animate-slide-in-left',
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                  activeClassName={cn(
                    'bg-sidebar-accent font-medium',
                    roleAccentBorder[user.role]
                  )}
                >
                  <link.icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
