import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { api } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { StatusBadge } from './ui/status-badge';

interface Session {
  _id: string;
  status: string;
  session: {
    course?: {
      name?: string;
      code?: string;
      subject?: {
        name?: string;
        code?: string;
      };
    };
  };
  markedBy?: {
    name?: string;
    role?: string;
  };
  markedAt?: string;
}

type NormalizedStatus = 'present' | 'absent' | 'late' | 'leave';

interface CalendarDay {
  date: string;
  dayOfWeek: number;
  isSunday: boolean;
  isWorkingDay: boolean;
  sessions: Session[];
}

interface MonthlyAttendance {
  userId: string;
  month: string;
  workingDays: number;
  totalDays: number;
  calendar: CalendarDay[];
  stats: {
    totalSessions: number;
    present: number;
    absent: number;
    leave: number;
    attendancePercent: string | null;
  };
}

interface AttendanceCalendarProps {
  userId: string;
  initialMonth?: string; // Format: YYYY-MM
}

const statusColors: Record<NormalizedStatus, string> = {
  present: 'bg-status-present/20 border-status-present/40 text-status-present',
  absent: 'bg-status-absent/20 border-status-absent/40 text-status-absent',
  late: 'bg-status-late/20 border-status-late/40 text-status-late',
  leave: 'bg-status-leave/20 border-status-leave/40 text-status-leave',
};

const dotColors: Record<NormalizedStatus, string> = {
  present: 'bg-status-present',
  absent: 'bg-status-absent',
  late: 'bg-status-late',
  leave: 'bg-status-leave',
};

const normalizeStatus = (status: string): NormalizedStatus => {
  const value = (status || '').toLowerCase();
  if (value === 'p' || value === 'present') return 'present';
  if (value === 'a' || value === 'absent') return 'absent';
  if (value === 'late') return 'late';
  if (value === 'l' || value === 'leave') return 'leave';
  return 'absent';
};

const formatMonth = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ userId, initialMonth }) => {
  const [currentMonth, setCurrentMonth] = useState<string>(
    initialMonth || formatMonth(new Date())
  );
  const [data, setData] = useState<MonthlyAttendance | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  useEffect(() => {
    fetchMonthlyAttendance();
  }, [currentMonth, userId]);

  const fetchMonthlyAttendance = async () => {
    setLoading(true);
    try {
      const response = await api.attendance.getMonthlyAttendance(userId, currentMonth);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch monthly attendance:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-').map(Number);
    const newDate = new Date(year, month - 1 + (direction === 'next' ? 1 : -1), 1);
    const newMonth = formatMonth(newDate);
    setCurrentMonth(newMonth);
  };

  const exportToCSV = () => {
    if (!data) return;

    const headers = ['Date', 'Day', 'Status', 'Sessions'];
    const rows = data.calendar.map(day => {
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.dayOfWeek];
      const status = day.isSunday
        ? 'Holiday'
        : day.sessions.length === 0
        ? 'No Sessions'
        : day.sessions.map(s => normalizeStatus(s.status)).join(', ');
      const sessionCount = day.sessions.length;

      return [day.date, dayName, status, sessionCount];
    });

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${currentMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const monthLabel = useMemo(() => {
    return new Date(currentMonth + '-01').toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [currentMonth]);

  const renderDots = (sessions: Session[]) => {
    if (!sessions.length) return null;

    const dots = sessions.slice(0, 4).map((session, idx) => {
      const status = normalizeStatus(session.status);
      return (
        <span
          key={idx}
          className={`h-2.5 w-2.5 rounded-full ${dotColors[status]}`}
          aria-hidden
        />
      );
    });

    const remaining = sessions.length - 4;

    return (
      <div className="flex items-center gap-1 flex-wrap mt-1 min-h-[12px]">
        {dots}
        {remaining > 0 && (
          <span className="text-[10px] text-muted-foreground">+{remaining}</span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading attendance...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No attendance data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Attendance Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold min-w-[120px] text-center">{monthLabel}</span>
              <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-status-present">
                {data.stats.attendancePercent || 'N/A'}%
              </div>
              <div className="text-sm text-muted-foreground">Attendance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-status-present">{data.stats.present}</div>
              <div className="text-sm text-muted-foreground">Present</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-status-absent">{data.stats.absent}</div>
              <div className="text-sm text-muted-foreground">Absent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-status-late">{data.stats.leave}</div>
              <div className="text-sm text-muted-foreground">Leave</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{data.workingDays}</div>
              <div className="text-sm text-muted-foreground">Working Days</div>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-status-present/20 border border-status-present/40"></div>
              <span>Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-status-absent/20 border border-status-absent/40"></div>
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-status-late/20 border border-status-late/40"></div>
              <span>Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-status-leave/20 border border-status-leave/40"></div>
              <span>Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300"></div>
              <span>Sunday</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-sm py-2">
                {day}
              </div>
            ))}

            {data.calendar.map((day, index) => {
              const date = new Date(day.date);
              const dayNum = date.getDate();
              const hasAbsent = day.sessions.some(s => normalizeStatus(s.status) === 'absent');
              const isClickable = day.sessions.length > 0 && !day.isSunday;

              return (
                <button
                  type="button"
                  key={index}
                  onClick={() => isClickable && setSelectedDay(day)}
                  className={`
                    min-h-[90px] border-2 rounded p-2 text-left transition-all
                    ${day.isSunday ? 'bg-gray-50 border-gray-200' : hasAbsent ? 'bg-status-absent/15 border-status-absent/60' : 'bg-background border-border'}
                    ${day.sessions.length === 0 && !day.isSunday ? 'border-dashed' : ''}
                    ${isClickable ? 'hover:shadow-md hover:scale-105' : ''}
                    ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                  `}
                  aria-label={`Attendance for ${day.date}${hasAbsent ? ' - has absences' : ''}`}
                >
                  <div className="text-sm font-semibold mb-1">{dayNum}</div>

                  {day.isSunday ? (
                    <div className="text-xs text-muted-foreground">Holiday</div>
                  ) : day.sessions.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No sessions</div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {day.sessions.map((session, idx) => {
                          const status = normalizeStatus(session.status);
                          return (
                            <span
                              key={idx}
                              className={`text-[11px] px-2 py-0.5 rounded-full border ${statusColors[status]}`}
                            >
                              {session.session?.subject?.code || 'Session'}
                            </span>
                          );
                        })}
                      </div>
                      {renderDots(day.sessions)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedDay} onOpenChange={open => !open && setSelectedDay(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {selectedDay ? format(new Date(selectedDay.date), 'MMMM dd, yyyy') : 'Attendance details'}
            </DialogTitle>
            <DialogDescription>
              Detailed sessions for this date
            </DialogDescription>
          </DialogHeader>

          {!selectedDay || selectedDay.sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions recorded for this day.</p>
          ) : (
            <ScrollArea className="max-h-[420px] pr-2">
              <div className="space-y-3">
                {selectedDay.sessions.map((session, idx) => {
                  const status = normalizeStatus(session.status);
                  // Try to get subject name from subject field first, then course name
                  const subjectName = session.session?.course?.subject?.name || session.session?.course?.name || 'Unknown subject';
                  const subjectCode = session.session?.course?.subject?.code || session.session?.course?.code;
                  const markedBy = session.markedBy?.name;
                  const markedByRole = session.markedBy?.role;

                  return (
                    <div 
                      key={session._id || idx} 
                      className={`rounded-lg border-2 p-4 transition-all ${
                        status === 'absent' 
                          ? 'bg-status-absent/10 border-status-absent/40' 
                          : 'bg-background border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground text-base">{subjectName}</p>
                            {subjectCode && (
                              <span className="text-xs font-mono bg-secondary/50 px-2 py-1 rounded">
                                {subjectCode}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {markedBy ? (
                              <>
                                Marked by {markedByRole === 'teacher' ? 'Teacher ' : ''}<span className="font-medium text-foreground">{markedBy}</span>
                              </>
                            ) : (
                              'Marked by System'
                            )}
                          </p>
                          {session.markedAt && (
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(session.markedAt), 'MMM dd · hh:mm a')}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendanceCalendar;
