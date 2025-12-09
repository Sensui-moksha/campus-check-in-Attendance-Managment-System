import { cn } from '@/lib/utils';

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
  color?: 'primary' | 'student' | 'teacher' | 'hod' | 'success' | 'warning' | 'danger';
}

const colorMap = {
  primary: 'stroke-primary',
  student: 'stroke-student-accent',
  teacher: 'stroke-teacher-accent',
  hod: 'stroke-hod-accent',
  success: 'stroke-status-present',
  warning: 'stroke-status-late',
  danger: 'stroke-status-absent',
};

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 10,
  className,
  showLabel = true,
  color = 'primary',
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  // Determine color based on value if not specified
  const autoColor = value >= 75 ? 'success' : value >= 50 ? 'warning' : 'danger';
  const strokeColor = color === 'primary' ? autoColor : color;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn('transition-all duration-500', colorMap[strokeColor])}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{Math.round(value)}%</span>
        </div>
      )}
    </div>
  );
}
