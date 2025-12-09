import { cn } from '@/lib/utils';
import { Check, X, Clock, CalendarOff } from 'lucide-react';
import { AttendanceStatus } from '@/types/auth';

interface StatusBadgeProps {
  status: AttendanceStatus;
  showIcon?: boolean;
}

const statusConfig = {
  present: {
    label: 'Present',
    icon: Check,
    className: 'bg-status-present/10 text-status-present border-status-present/20',
  },
  absent: {
    label: 'Absent',
    icon: X,
    className: 'bg-status-absent/10 text-status-absent border-status-absent/20',
  },
  late: {
    label: 'Late',
    icon: Clock,
    className: 'bg-status-late/10 text-status-late border-status-late/20',
  },
  leave: {
    label: 'Leave',
    icon: CalendarOff,
    className: 'bg-status-leave/10 text-status-leave border-status-leave/20',
  },
};

export function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  // Handle undefined or invalid status
  if (!config) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-gray-100/10 text-gray-600 border-gray-200/20">
        Unknown
      </span>
    );
  }
  
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        config.className
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      {config.label}
    </span>
  );
}
