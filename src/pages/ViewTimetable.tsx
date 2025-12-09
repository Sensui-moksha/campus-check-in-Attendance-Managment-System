import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Calendar, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TimeSlot {
  startTime: string;
  endTime: string;
  subject?: string;
  subjectId?: {
    _id: string;
    name: string;
    code: string;
  };
  teacher?: string;
  teacherId?: {
    _id: string;
    name: string;
    email: string;
  };
  room?: string;
  rowSpan?: number;
  colSpan?: number;
  isHidden?: boolean;
}

interface DaySchedule {
  day: string;
  slots: TimeSlot[];
}

interface Timetable {
  _id: string;
  department: string;
  departmentId: {
    _id: string;
    name: string;
    code: string;
  };
  year: number;
  section: string;
  semester: string;
  semesterId: {
    _id: string;
    name: string;
    academicYear: string;
    startDate: string;
    endDate: string;
  };
  schedule: DaySchedule[];
  timeSlots?: { start: string; end: string }[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ViewTimetable = () => {
  const { user } = useAuth();
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<Timetable | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDay, setCurrentDay] = useState<string>('');

  useEffect(() => {
    // Get current day
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    setCurrentDay(today);
  }, []);

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔍 Fetching from:', '/api/timetable/my-timetable');
      const response = await fetch('/api/timetable/my-timetable', {
        credentials: 'include',
      });
      
      console.log('📡 Response received:', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        ok: response.ok
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch timetable');
        } else {
          const text = await response.text();
          console.error('❌ HTML Response:', text.substring(0, 200));
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('✅ Data received:', data);

      if (data.success) {
        const timetableList = data.timetables || [];
        setTimetables(timetableList);
        
        // Auto-select first timetable for students, or show all for others
        if (timetableList.length > 0) {
          setSelectedTimetable(timetableList[0]);
        }
      }
    } catch (err: any) {
      console.error('Error fetching timetable:', err);
      setError(err.message || 'Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const getTimeSlots = (timetable: Timetable): string[] => {
    if (timetable.timeSlots && timetable.timeSlots.length > 0) {
      return timetable.timeSlots.map(slot => `${slot.start} - ${slot.end}`);
    }

    // Default time slots if not defined
    const defaultSlots = [];
    for (let hour = 9; hour <= 15; hour++) {
      defaultSlots.push(`${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`);
    }
    return defaultSlots;
  };

  const getSlotForDayAndTime = (day: string, timeSlot: string): TimeSlot | null => {
    if (!selectedTimetable) return null;

    const daySchedule = selectedTimetable.schedule.find(s => s.day === day);
    if (!daySchedule) return null;

    // Match by time slot
    const [startTime] = timeSlot.split(' - ');
    return daySchedule.slots.find(slot => slot.startTime === startTime) || null;
  };

  const renderTimetableCard = (timetable: Timetable, index: number) => {
    const isSelected = selectedTimetable?._id === timetable._id;
    
    return (
      <Card 
        key={timetable._id} 
        className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
        onClick={() => setSelectedTimetable(timetable)}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {timetable.departmentId.name} - Year {timetable.year} - Section {timetable.section}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {timetable.semesterId.name}
          </p>
        </CardHeader>
      </Card>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading timetable..." />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  if (timetables.length === 0) {
    return (
      <DashboardLayout>
        <Alert>
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            No timetable available. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Timetable</h1>
            <p className="text-muted-foreground mt-1">View your weekly class schedule</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Today: {currentDay}</span>
          </div>
        </div>

      {/* Show timetable selector for teachers/HOD/admin */}
      {/* Show timetable selector for teachers/HOD/admin */}
      {timetables.length > 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Select a class:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {timetables.map((timetable, index) => renderTimetableCard(timetable, index))}
          </div>
        </div>
      )}

      {/* Timetable Grid */}
      {selectedTimetable && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedTimetable.departmentId.name} - Year {selectedTimetable.year} - Section {selectedTimetable.section}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {selectedTimetable.semesterId.name}
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-gray-300 bg-gray-50 p-3 text-center font-semibold min-w-[100px]">
                      Day
                    </th>
                    {getTimeSlots(selectedTimetable).map((timeSlot, index) => (
                      <th 
                        key={index}
                        className="border border-gray-300 bg-gray-50 p-3 text-center font-semibold min-w-[120px]"
                      >
                        <div className="text-xs font-medium">
                          {timeSlot}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map(day => {
                    const daySchedule = selectedTimetable.schedule.find(s => s.day === day);
                    
                    return (
                      <tr key={day}>
                        <td className={`border border-gray-300 p-3 text-center text-sm font-medium ${
                          day === currentDay ? 'bg-blue-50 text-blue-700' : 'bg-gray-50'
                        }`}>
                          {day}
                          {day === currentDay && (
                            <span className="block text-xs font-normal text-blue-600 mt-1">Today</span>
                          )}
                        </td>
                        {getTimeSlots(selectedTimetable).map((timeSlot, slotIndex) => {
                          const slot = daySchedule?.slots[slotIndex];
                          
                          if (slot?.isHidden) {
                            return null;
                          }

                          const isMerged = slot?.rowSpan || slot?.colSpan;

                          return (
                            <td
                              key={slotIndex}
                              rowSpan={slot?.rowSpan || 1}
                              colSpan={slot?.colSpan || 1}
                              className={`border border-gray-300 p-3 text-sm ${
                                day === currentDay ? 'bg-blue-50/50' : ''
                              } ${slot && (slot.subject || slot.subjectId) ? 'bg-white' : 'bg-gray-50'} ${
                                isMerged ? 'align-middle text-center' : ''
                              }`}
                            >
                              {slot && (slot.subject || slot.subjectId) ? (
                                <div className={`space-y-1 ${isMerged ? 'flex flex-col items-center justify-center min-h-[80px] w-full' : ''}`}>
                                  <div className={`font-semibold text-primary ${isMerged ? 'text-base' : ''}`}>
                                    {slot.subjectId?.name || slot.subject}
                                  </div>
                                  {slot.subjectId?.code && (
                                    <div className="text-xs text-muted-foreground">
                                      {slot.subjectId.code}
                                    </div>
                                  )}
                                  {(slot.teacherId?.name || slot.teacher) && (
                                    <div className="text-xs text-muted-foreground">
                                      {slot.teacherId?.name || slot.teacher}
                                    </div>
                                  )}
                                  {slot.room && (
                                    <div className="text-xs text-muted-foreground">
                                      Room: {slot.room}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center text-muted-foreground text-xs">-</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-4 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This is a read-only view. Contact your administrator to make changes to the timetable.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </DashboardLayout>
  );
};

export default ViewTimetable;
