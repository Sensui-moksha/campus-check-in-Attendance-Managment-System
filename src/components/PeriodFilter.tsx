import { Button } from '@/components/ui/button';

interface PeriodFilterProps {
  value: 'day' | 'week' | 'month';
  onChange: (value: 'day' | 'week' | 'month') => void;
}

/**
 * PeriodFilter - Toggle group to select attendance view period
 */
export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  const periods = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
  ] as const;

  return (
    <div className="inline-flex rounded-md shadow-sm" role="group">
      {periods.map((period, index) => (
        <Button
          key={period.value}
          type="button"
          variant={value === period.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(period.value)}
          className={`
            ${index === 0 ? 'rounded-r-none' : ''}
            ${index === periods.length - 1 ? 'rounded-l-none' : ''}
            ${index > 0 && index < periods.length - 1 ? 'rounded-none border-x-0' : ''}
          `}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
}
