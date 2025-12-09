import { ReactNode, useState, useEffect } from 'react';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import OverlayFooter from '../OverlayFooter';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isDesktopSidebarCollapsed.toString());
  }, [isDesktopSidebarCollapsed]);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Header - z-40 */}
      <AppHeader 
        onToggleSidebar={() => setSidebarOpen(v => !v)} 
        onToggleDesktopSidebar={() => setDesktopSidebarCollapsed(v => !v)}
        isDesktopSidebarCollapsed={isDesktopSidebarCollapsed}
        onVisibilityChange={setIsHeaderVisible}
      />
      
      {/* Main content area - flex layout for sticky sidebar */}
      <div className="flex relative">
        {/* Sidebar - sticky on desktop, drawer on mobile */}
        <AppSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          isDesktopCollapsed={isDesktopSidebarCollapsed}
          isHeaderVisible={isHeaderVisible}
        />
        
        {/* Main scrollable content - independent scroll */}
        <main 
          className={cn(
            "flex-1 p-4 pt-20 pb-32 animate-fade-in-up relative z-10 overflow-y-auto",
            "sm:p-6 sm:pt-20 sm:pb-32",
            "lg:p-8 lg:pt-6 lg:pb-24",
            "transition-all-smooth"
          )}
          style={{ 
            minHeight: '100vh',
            maxHeight: '100vh'
          }}
        >
          {children}
        </main>
      </div>
      
      {/* Scrolling overlay footer */}
      <OverlayFooter />
    </div>
  );
}
