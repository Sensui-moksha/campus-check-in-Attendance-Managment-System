import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  footer?: string;
  icon?: LucideIcon;
  accentColor?: 'primary' | 'student' | 'teacher' | 'hod' | 'admin' | 'principal';
  onClick?: () => void;
}

const accentStyles = {
  primary: 'border-l-primary',
  student: 'border-l-student-accent',
  teacher: 'border-l-teacher-accent',
  hod: 'border-l-hod-accent',
  admin: 'border-l-admin-accent',
  principal: 'border-l-principal-accent',
};

const iconBgStyles = {
  primary: 'bg-primary/10 text-primary',
  student: 'bg-student-accent/10 text-student-accent',
  teacher: 'bg-teacher-accent/10 text-teacher-accent',
  hod: 'bg-hod-accent/10 text-hod-accent',
  admin: 'bg-admin-accent/10 text-admin-accent',
  principal: 'bg-principal-accent/10 text-principal-accent',
};

export function StatCard({
  title,
  value,
  footer,
  icon: Icon,
  accentColor = 'primary',
  onClick,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-card rounded-lg border border-border p-5 border-l-4 transition-all',
        accentStyles[accentColor],
        onClick && 'cursor-pointer hover:shadow-md hover:scale-[1.02]'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold text-card-foreground">{value}</p>
          {footer && (
            <p className="text-sm text-muted-foreground">{footer}</p>
          )}
        </div>
        {Icon && (
          <div className={cn('p-3 rounded-lg', iconBgStyles[accentColor])}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
}
