import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeValues = {
    sm: { container: 48, logo: 42 },
    md: { container: 96, logo: 84 },
    lg: { container: 128, logo: 112 },
  };

  const sizes = sizeValues[size];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: sizes.container, height: sizes.container }}
    >
      {/* Outer glow ring */}
      <div 
        className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400/20 via-blue-500/20 to-red-500/20 animate-logo-rotate"
        style={{ animationDuration: '3s' }}
      />
      
      {/* Middle pulse ring */}
      <div 
        className="absolute inset-2 rounded-full bg-gradient-to-tr from-orange-300/30 to-blue-400/30 animate-logo-glow"
      />
      
      {/* Logo */}
      <img
        src="/logo-small.png"
        alt="Loading"
        className="relative z-10 animate-logo-pulse"
        style={{ 
          width: sizes.logo, 
          height: sizes.logo,
          objectFit: 'contain',
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))'
        }}
      />
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingState({ message = 'Loading...', fullScreen = false }: LoadingStateProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/95 backdrop-blur-md z-50">
        <div className="flex flex-col items-center gap-6 animate-fade-in">
          <LoadingSpinner size="lg" />
          <p className="text-foreground text-base font-semibold animate-pulse">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12 animate-fade-in">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner />
        <p className="text-muted-foreground text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-3 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4"></div>
      <div className="h-3 bg-muted rounded w-1/2"></div>
      <div className="space-y-2 pt-2">
        <div className="h-2 bg-muted rounded"></div>
        <div className="h-2 bg-muted rounded w-5/6"></div>
      </div>
    </div>
  );
}
