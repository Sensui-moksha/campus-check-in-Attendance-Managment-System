import * as React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const roleBadgeStyles = {
  student: 'bg-student-accent text-student-accent-foreground',
  teacher: 'bg-teacher-accent text-teacher-accent-foreground',
  hod: 'bg-hod-accent text-hod-accent-foreground',
  admin: 'bg-admin-accent text-admin-accent-foreground',
  principal: 'bg-principal-accent text-principal-accent-foreground',
};

export function AppHeader({ onToggleSidebar, onToggleDesktopSidebar, isDesktopSidebarCollapsed, onVisibilityChange }: { 
  onToggleSidebar?: () => void;
  onToggleDesktopSidebar?: () => void;
  isDesktopSidebarCollapsed?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        // Scrolling down & past threshold
        setIsVisible(false);
        onVisibilityChange?.(false);
      } else {
        // Scrolling up
        setIsVisible(true);
        onVisibilityChange?.(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, onVisibilityChange]);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <header 
      className="h-16 border-b border-border bg-card px-4 sm:px-6 flex items-center justify-between sticky z-50 transition-transform duration-300"
      style={{
        top: window.innerWidth < 1024 ? '48px' : '0',
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          aria-label="Open menu"
          onClick={() => onToggleSidebar && onToggleSidebar()}
          className="mr-1 lg:hidden p-2 rounded-md hover:bg-muted transition-smooth"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        {/* Desktop sidebar toggle button */}
        <button
          aria-label={isDesktopSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
          onClick={() => onToggleDesktopSidebar && onToggleDesktopSidebar()}
          className="hidden lg:flex p-2 rounded-md hover:bg-muted transition-smooth"
          title={isDesktopSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
        >
          {isDesktopSidebarCollapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
        <div className="w-14 h-14 rounded-lg bg-transparent shadow-md flex items-center justify-center overflow-hidden">
          <img
            src="/logo-small.png"
            alt="College Logo"
            className="h-10 w-10 object-contain"
            style={{ background: 'transparent' }}
          />
        </div>
        <div>
          <h1 className="font-semibold text-foreground">College Attendance</h1>
          <p className="text-xs text-muted-foreground">Management System</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <Badge className={cn('text-xs capitalize', roleBadgeStyles[user.role])}>
              {user.role}
            </Badge>
          </div>
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
