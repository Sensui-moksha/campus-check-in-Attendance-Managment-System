import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from './button';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

interface MiniCalendarProps {
  value?: Date;
  onChange?: (date: Date) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  value,
  onChange,
  className,
  placeholder = 'Select date',
  disabled = false,
  minDate,
  maxDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value || new Date());
  const [selectedYear, setSelectedYear] = useState(viewDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(viewDate.getMonth());

  // Generate year options (2000 to 2050 to match HTML date input)
  const startYear = 2000;
  const endYear = 2050;
  const yearOptions = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Handle month change
  const handleMonthChange = (direction: 'prev' | 'next') => {
    let newMonth = selectedMonth;
    let newYear = selectedYear;

    if (direction === 'prev') {
      newMonth--;
      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      }
    } else {
      newMonth++;
      if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  // Handle date selection
  const handleDateClick = (day: number) => {
    const newDate = new Date(selectedYear, selectedMonth, day);
    
    // Check if date is within allowed range
    if (minDate && newDate < minDate) return;
    if (maxDate && newDate > maxDate) return;

    onChange?.(newDate);
    setIsOpen(false);
  };

  // Check if date is disabled
  const isDateDisabled = (day: number) => {
    const date = new Date(selectedYear, selectedMonth, day);
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  // Check if date is selected
  const isDateSelected = (day: number) => {
    if (!value) return false;
    return (
      value.getDate() === day &&
      value.getMonth() === selectedMonth &&
      value.getFullYear() === selectedYear
    );
  };

  // Check if date is today
  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === selectedMonth &&
      today.getFullYear() === selectedYear
    );
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);
    const days: (number | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'MMMM dd, yyyy') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="bg-white rounded-lg shadow-lg border">
          {/* Header with Month/Year selectors */}
          <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleMonthChange('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex gap-2">
              <Select
                value={selectedMonth.toString()}
                onValueChange={(val) => setSelectedMonth(parseInt(val))}
              >
                <SelectTrigger className="h-8 w-[110px] text-sm font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, index) => (
                    <SelectItem key={month} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedYear.toString()}
                onValueChange={(val) => setSelectedYear(parseInt(val))}
              >
                <SelectTrigger className="h-8 w-[80px] text-sm font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleMonthChange('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="p-3">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const disabled = isDateDisabled(day);
                const selected = isDateSelected(day);
                const today = isToday(day);

                return (
                  <button
                    key={day}
                    onClick={() => !disabled && handleDateClick(day)}
                    disabled={disabled}
                    className={cn(
                      'aspect-square rounded-md text-sm font-medium transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                      disabled && 'text-muted-foreground opacity-50 cursor-not-allowed hover:bg-transparent',
                      selected && 'bg-primary text-primary-foreground hover:bg-primary/90',
                      !selected && today && 'bg-accent font-bold',
                      !selected && !today && !disabled && 'text-foreground'
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer with today button */}
          <div className="border-t p-2 flex justify-between items-center bg-gray-50">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => {
                const today = new Date();
                setSelectedYear(today.getFullYear());
                setSelectedMonth(today.getMonth());
                onChange?.(today);
                setIsOpen(false);
              }}
            >
              Today
            </Button>
            <span className="text-xs text-muted-foreground">
              {format(new Date(selectedYear, selectedMonth, 1), 'MMMM yyyy')}
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
