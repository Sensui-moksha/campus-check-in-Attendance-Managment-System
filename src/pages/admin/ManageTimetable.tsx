import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Clock, Plus, Edit, Trash2, Save, AlertCircle } from 'lucide-react';
import { api } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TimeSlot {
  startTime: string;
  endTime: string;
  subject?: string;
  subjectId?: string;
  teacher?: string;
  teacherId?: string;
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
  _id?: string;
  department: string;
  departmentId: string;
  year: number;
  section: string;
  semester: string;
  semesterId: string;
  schedule: DaySchedule[];
  timeSlots?: { start: string; end: string }[];
}

const DEFAULT_TIME_SLOTS = [
  { start: '09:00', end: '10:00' },
  { start: '10:00', end: '11:00' },
  { start: '11:00', end: '12:00' },
  { start: '12:00', end: '13:00' },
  { start: '13:00', end: '14:00' },
  { start: '14:00', end: '15:00' },
  { start: '15:00', end: '16:00' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Convert 24-hour time to 12-hour format
const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${minutes} ${period}`;
};

export default function ManageTimetable() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSlotDialog, setShowSlotDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{ day: string; slotIndex: number } | null>(null);
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    departmentId: '',
    year: '',
    section: '',
    semesterId: '',
  });

  const [slotForm, setSlotForm] = useState({
    subjectId: '',
    teacherId: '',
    room: '',
  });

  const [timeSlots, setTimeSlots] = useState(DEFAULT_TIME_SLOTS);
  const [showTimeSlotDialog, setShowTimeSlotDialog] = useState(false);
  const [newTimeSlot, setNewTimeSlot] = useState({ start: '', end: '' });
  const [selectedCells, setSelectedCells] = useState<{ day: string; slotIndex: number }[]>([]);
  const [draggedSlotIndex, setDraggedSlotIndex] = useState<number | null>(null);
  const [dragOverSlotIndex, setDragOverSlotIndex] = useState<number | null>(null);

  // For HOD, auto-select their department
  useEffect(() => {
    if (user?.role === 'hod' && user?.department) {
      const deptId = typeof user.department === 'string' ? user.department : user.department._id;
      setFilters((prev) => ({ ...prev, departmentId: deptId }));
    }
  }, [user]);

  useEffect(() => {
    loadDepartments();
    loadSemesters();
    loadTeachers();
  }, []);

  useEffect(() => {
    if (filters.departmentId && filters.year) {
      loadSubjects();
      loadSections();
    }
  }, [filters.departmentId, filters.year]);

  useEffect(() => {
    if (filters.departmentId && filters.year && filters.section && filters.semesterId) {
      loadTimetable();
    }
  }, [filters.departmentId, filters.year, filters.section, filters.semesterId]);

  const loadDepartments = async () => {
    try {
      const response = await api.departments.list();
      let depts = response.data?.departments || [];
      
      // Filter for HOD - only show their department
      if (user?.role === 'hod' && user?.department) {
        const deptId = typeof user.department === 'string' ? user.department : user.department._id;
        depts = depts.filter((d: any) => d._id === deptId);
      }
      
      setDepartments(depts);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const loadSemesters = async () => {
    try {
      const response = await api.semesters.list();
      setSemesters(response.data?.semesters || []);
    } catch (error) {
      console.error('Failed to load semesters:', error);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await api.subjects.list({
        departmentId: filters.departmentId,
        yearOfStudy: filters.year,
      });
      setSubjects(response.data?.subjects || []);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    }
  };

  const loadSections = async () => {
    try {
      const response = await api.departments.getSections(filters.departmentId);
      const allSections = response.data?.sections || [];
      // Filter sections by the selected year
      const filteredSections = allSections.filter(
        (section: any) => section.yearOfStudy === parseInt(filters.year)
      );
      setSections(filteredSections);
      
      // Reset section selection if current selection is not in the filtered list
      if (filters.section && !filteredSections.find((s: any) => s.name === filters.section)) {
        setFilters((prev) => ({ ...prev, section: '' }));
      }
    } catch (error) {
      console.error('Failed to load sections:', error);
      setSections([]);
    }
  };

  const loadTeachers = async () => {
    try {
      const response = await api.users.list('teacher', 1, 500);
      setTeachers(response.data?.teachers || []);
    } catch (error) {
      console.error('Failed to load teachers:', error);
    }
  };

  const loadTimetable = async () => {
    try {
      setIsLoading(true);
      const response = await api.timetable.get({
        departmentId: filters.departmentId,
        year: filters.year,
        section: filters.section,
        semesterId: filters.semesterId,
      });

      if (response.data?.timetable) {
        setTimetable(response.data.timetable);
      } else {
        // Initialize empty timetable
        initializeEmptyTimetable();
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        initializeEmptyTimetable();
      } else {
        console.error('Failed to load timetable:', error);
        toast({
          description: 'Failed to load timetable',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const initializeEmptyTimetable = () => {
    const currentTimeSlots = timeSlots;
    const schedule: DaySchedule[] = DAYS.map((day) => ({
      day,
      slots: currentTimeSlots.map((slot) => ({
        startTime: slot.start,
        endTime: slot.end,
      })),
    }));

    setTimetable({
      department: departments.find((d) => d._id === filters.departmentId)?.name || '',
      departmentId: filters.departmentId,
      year: parseInt(filters.year),
      section: filters.section,
      semester: semesters.find((s) => s._id === filters.semesterId)?.name || '',
      semesterId: filters.semesterId,
      schedule,
      timeSlots: currentTimeSlots,
    });
  };

  const handleAddTimeSlot = () => {
    if (!newTimeSlot.start || !newTimeSlot.end) {
      toast({ description: 'Please enter start and end times', variant: 'destructive' });
      return;
    }

    const updatedSlots = [...timeSlots, { start: newTimeSlot.start, end: newTimeSlot.end }];
    setTimeSlots(updatedSlots);

    if (timetable) {
      const updatedSchedule = timetable.schedule.map((daySchedule) => ({
        ...daySchedule,
        slots: [
          ...daySchedule.slots,
          { startTime: newTimeSlot.start, endTime: newTimeSlot.end },
        ],
      }));
      setTimetable({ ...timetable, schedule: updatedSchedule, timeSlots: updatedSlots });
    }

    setNewTimeSlot({ start: '', end: '' });
    setShowTimeSlotDialog(false);
    toast({ description: 'Time slot added successfully' });
  };

  const handleDeleteTimeSlot = (index: number) => {
    const updatedSlots = timeSlots.filter((_, i) => i !== index);
    setTimeSlots(updatedSlots);

    if (timetable) {
      const updatedSchedule = timetable.schedule.map((daySchedule) => ({
        ...daySchedule,
        slots: daySchedule.slots.filter((_, i) => i !== index),
      }));
      setTimetable({ ...timetable, schedule: updatedSchedule, timeSlots: updatedSlots });
    }

    toast({ description: 'Time slot deleted successfully' });
  };

  const handleCellClick = (day: string, slotIndex: number, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Multi-select with Ctrl/Cmd
      const cellId = { day, slotIndex };
      const exists = selectedCells.find((c) => c.day === day && c.slotIndex === slotIndex);
      if (exists) {
        setSelectedCells(selectedCells.filter((c) => !(c.day === day && c.slotIndex === slotIndex)));
      } else {
        setSelectedCells([...selectedCells, cellId]);
      }
    } else {
      // Single select or edit
      handleSlotEdit(day, slotIndex);
    }
  };

  const handleMergeCells = () => {
    if (selectedCells.length < 2) {
      toast({ description: 'Select at least 2 cells to merge', variant: 'destructive' });
      return;
    }

    // Check if cells are in same row or column
    const days = [...new Set(selectedCells.map((c) => c.day))];
    const slots = [...new Set(selectedCells.map((c) => c.slotIndex))];

    if (days.length !== 1 && slots.length !== 1) {
      toast({ 
        description: 'Can only merge cells in the same row or column', 
        variant: 'destructive' 
      });
      return;
    }

    if (!timetable) return;

    const updatedSchedule = timetable.schedule.map((daySchedule) => {
      if (days.includes(daySchedule.day)) {
        return {
          ...daySchedule,
          slots: daySchedule.slots.map((slot, idx) => {
            const firstCell = selectedCells[0];
            if (daySchedule.day === firstCell.day && idx === firstCell.slotIndex) {
              return {
                ...slot,
                rowSpan: slots.length > 1 ? slots.length : undefined,
                colSpan: days.length > 1 ? days.length : undefined,
              };
            }
            if (selectedCells.find((c) => c.day === daySchedule.day && c.slotIndex === idx && 
                !(c.day === firstCell.day && c.slotIndex === firstCell.slotIndex))) {
              return { ...slot, isHidden: true };
            }
            return slot;
          }),
        };
      }
      return daySchedule;
    });

    setTimetable({ ...timetable, schedule: updatedSchedule });
    setSelectedCells([]);
    toast({ description: 'Cells merged successfully' });
  };

  const handleUnmergeCells = () => {
    if (!timetable) return;

    const updatedSchedule = timetable.schedule.map((daySchedule) => ({
      ...daySchedule,
      slots: daySchedule.slots.map((slot) => ({
        ...slot,
        rowSpan: undefined,
        colSpan: undefined,
        isHidden: false,
      })),
    }));

    setTimetable({ ...timetable, schedule: updatedSchedule });
    setSelectedCells([]);
    toast({ description: 'All cells unmerged' });
  };

  const handleSlotEdit = (day: string, slotIndex: number) => {
    const daySchedule = timetable?.schedule.find((d) => d.day === day);
    const slot = daySchedule?.slots[slotIndex];

    if (slot) {
      setSlotForm({
        subjectId: slot.subjectId || '',
        teacherId: slot.teacherId || '',
        room: slot.room || '',
      });
      setEditingSlot({ day, slotIndex });
      setShowSlotDialog(true);
    }
  };

  const handleSlotSave = () => {
    if (!editingSlot || !timetable) return;

    const subject = subjects.find((s) => s._id === slotForm.subjectId);
    const teacher = teachers.find((t) => t._id === slotForm.teacherId);

    const updatedSchedule = timetable.schedule.map((daySchedule) => {
      if (daySchedule.day === editingSlot.day) {
        const updatedSlots = [...daySchedule.slots];
        updatedSlots[editingSlot.slotIndex] = {
          ...updatedSlots[editingSlot.slotIndex],
          subject: subject?.name,
          subjectId: slotForm.subjectId,
          teacher: teacher?.name,
          teacherId: slotForm.teacherId,
          room: slotForm.room,
        };
        return { ...daySchedule, slots: updatedSlots };
      }
      return daySchedule;
    });

    setTimetable({ ...timetable, schedule: updatedSchedule });
    setShowSlotDialog(false);
    setEditingSlot(null);
    setSlotForm({ subjectId: '', teacherId: '', room: '' });
  };

  const handleSlotClear = (day: string, slotIndex: number) => {
    if (!timetable) return;

    const updatedSchedule = timetable.schedule.map((daySchedule) => {
      if (daySchedule.day === day) {
        const updatedSlots = [...daySchedule.slots];
        updatedSlots[slotIndex] = {
          startTime: updatedSlots[slotIndex].startTime,
          endTime: updatedSlots[slotIndex].endTime,
        };
        return { ...daySchedule, slots: updatedSlots };
      }
      return daySchedule;
    });

    setTimetable({ ...timetable, schedule: updatedSchedule });
  };

  const handleTimeSlotDragStart = (e: React.DragEvent, slotIndex: number) => {
    setDraggedSlotIndex(slotIndex);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTimeSlotDragOver = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlotIndex(slotIndex);
  };

  const handleTimeSlotDragLeave = () => {
    setDragOverSlotIndex(null);
  };

  const handleTimeSlotDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (draggedSlotIndex === null || draggedSlotIndex === targetIndex) {
      setDraggedSlotIndex(null);
      setDragOverSlotIndex(null);
      return;
    }

    // Reorder time slots
    const newTimeSlots = [...timeSlots];
    const [draggedSlot] = newTimeSlots.splice(draggedSlotIndex, 1);
    newTimeSlots.splice(targetIndex, 0, draggedSlot);
    setTimeSlots(newTimeSlots);

    // Reorder all schedule slots accordingly
    if (timetable) {
      const updatedSchedule = timetable.schedule.map((daySchedule) => {
        const newSlots = [...daySchedule.slots];
        const [draggedDaySlot] = newSlots.splice(draggedSlotIndex, 1);
        newSlots.splice(targetIndex, 0, draggedDaySlot);
        return { ...daySchedule, slots: newSlots };
      });

      setTimetable({ 
        ...timetable, 
        schedule: updatedSchedule,
        timeSlots: newTimeSlots 
      });
    }

    setDraggedSlotIndex(null);
    setDragOverSlotIndex(null);
    
    toast({ description: 'Time slot reordered successfully' });
  };

  const handleSaveTimetable = async () => {
    if (!timetable) return;

    try {
      if (timetable._id) {
        await api.timetable.update(timetable._id, timetable);
        toast({ description: 'Timetable updated successfully' });
      } else {
        await api.timetable.create(timetable);
        toast({ description: 'Timetable created successfully' });
      }
      loadTimetable();
    } catch (error: any) {
      console.error('Failed to save timetable:', error);
      toast({
        description: error.response?.data?.error || 'Failed to save timetable',
        variant: 'destructive',
      });
    }
  };

  const selectedDepartment = departments.find((d) => d._id === filters.departmentId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manage Timetable</h1>
            <p className="text-muted-foreground mt-2">
              Create weekly timetables - editable like Excel (add slots, merge cells)
            </p>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Each timetable is unique for a specific <strong>Department, Year, Section, and Semester</strong> combination. 
            Select all filters to create or edit a timetable for that specific class.
          </AlertDescription>
        </Alert>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Select Class & Semester</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={filters.departmentId}
                  onValueChange={(value) =>
                    setFilters({ ...filters, departmentId: value })
                  }
                  disabled={user?.role === 'hod'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept._id} value={dept._id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Year</Label>
                <Select
                  value={filters.year}
                  onValueChange={(value) => setFilters({ ...filters, year: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Year 1</SelectItem>
                    <SelectItem value="2">Year 2</SelectItem>
                    <SelectItem value="3">Year 3</SelectItem>
                    <SelectItem value="4">Year 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Section</Label>
                <Select
                  value={filters.section}
                  onValueChange={(value) => setFilters({ ...filters, section: value })}
                  disabled={!filters.departmentId || !filters.year}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !filters.departmentId || !filters.year 
                        ? "Select department & year first" 
                        : sections.length === 0
                        ? "No sections available"
                        : "Select section"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((section) => (
                      <SelectItem key={section._id} value={section.name}>
                        Section {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Semester</Label>
                <Select
                  value={filters.semesterId}
                  onValueChange={(value) =>
                    setFilters({ ...filters, semesterId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((sem) => (
                      <SelectItem key={sem._id} value={sem._id}>
                        {sem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timetable Grid */}
        {timetable && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Weekly Timetable
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowTimeSlotDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Time Slot
                  </Button>
                  {selectedCells.length > 1 && (
                    <>
                      <Button variant="outline" size="sm" onClick={handleMergeCells}>
                        Merge Cells
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleUnmergeCells}>
                        Unmerge All
                      </Button>
                    </>
                  )}
                  <Button size="sm" onClick={handleSaveTimetable}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Timetable
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="mb-4 text-sm text-muted-foreground flex items-center gap-2">
                <span>💡 Tip: Hold Ctrl/Cmd and click cells to select multiple, then click "Merge Cells"</span>
                <span className="text-primary">| 🔄 Drag time slot headers to reorder columns</span>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 bg-muted min-w-[100px]">
                      <div className="flex items-center justify-between">
                        <span>Day</span>
                      </div>
                    </th>
                    {timeSlots.map((timeSlot, slotIndex) => (
                      <th 
                        key={slotIndex} 
                        className={`border p-2 bg-muted min-w-[120px] cursor-move transition-all ${
                          dragOverSlotIndex === slotIndex && draggedSlotIndex !== slotIndex
                            ? 'bg-primary/20 scale-105' 
                            : draggedSlotIndex === slotIndex 
                            ? 'opacity-50' 
                            : ''
                        }`}
                        draggable
                        onDragStart={(e) => handleTimeSlotDragStart(e, slotIndex)}
                        onDragOver={(e) => handleTimeSlotDragOver(e, slotIndex)}
                        onDragLeave={handleTimeSlotDragLeave}
                        onDrop={(e) => handleTimeSlotDrop(e, slotIndex)}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-medium select-none">
                            {formatTime12Hour(timeSlot.start)} - {formatTime12Hour(timeSlot.end)}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTimeSlot(slotIndex);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day) => {
                    const daySchedule = timetable.schedule.find((d) => d.day === day);
                    
                    return (
                      <tr key={day}>
                        <td className="border p-2 text-center text-sm font-medium bg-muted/50">
                          {day}
                        </td>
                        {timeSlots.map((timeSlot, slotIndex) => {
                          const slot = daySchedule?.slots[slotIndex];

                          if (slot?.isHidden) return null;

                          const isSelected = selectedCells.find(
                            (c) => c.day === day && c.slotIndex === slotIndex
                          );

                          const isMerged = slot?.rowSpan || slot?.colSpan;
                          
                          return (
                            <td
                              key={slotIndex}
                              rowSpan={slot?.rowSpan}
                              colSpan={slot?.colSpan}
                              className={`border p-2 hover:bg-muted/50 cursor-pointer group relative ${
                                isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''
                              } ${isMerged ? 'align-middle text-center' : ''}`}
                              onClick={(e) => handleCellClick(day, slotIndex, e)}
                            >
                              {slot?.subject ? (
                                <div className={`space-y-1 ${isMerged ? 'flex flex-col items-center justify-center min-h-[80px] w-full' : ''}`}>
                                  <div className={`font-semibold ${isMerged ? 'text-base' : 'text-sm'} ${isMerged ? 'text-center' : ''}`}>
                                    {slot.subject}
                                  </div>
                                  {slot.teacher && (
                                    <div className="text-xs text-muted-foreground">
                                      {slot.teacher}
                                    </div>
                                  )}
                                  {slot.room && (
                                    <div className="text-xs text-muted-foreground">
                                      Room: {slot.room}
                                    </div>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSlotClear(day, slotIndex);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-center text-muted-foreground text-sm opacity-0 group-hover:opacity-100">
                                  Click to add
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Edit Slot Dialog */}
        <Dialog open={showSlotDialog} onOpenChange={setShowSlotDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Time Slot</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select
                  value={slotForm.subjectId}
                  onValueChange={(value) =>
                    setSlotForm({ ...slotForm, subjectId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject._id} value={subject._id}>
                        {subject.code} - {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Teacher</Label>
                <Select
                  value={slotForm.teacherId}
                  onValueChange={(value) =>
                    setSlotForm({ ...slotForm, teacherId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher._id} value={teacher._id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Room</Label>
                <Input
                  type="text"
                  placeholder="Enter room number or name"
                  value={slotForm.room}
                  onChange={(e) =>
                    setSlotForm({ ...slotForm, room: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (!timetable || !editingSlot) return;
                    const updatedSchedule = timetable.schedule.map((daySchedule) => {
                      if (daySchedule.day === editingSlot.day) {
                        const updatedSlots = [...daySchedule.slots];
                        updatedSlots[editingSlot.slotIndex] = {
                          ...updatedSlots[editingSlot.slotIndex],
                          subject: 'Short Break',
                          subjectId: undefined,
                          teacher: undefined,
                          teacherId: undefined,
                          room: undefined,
                        };
                        return { ...daySchedule, slots: updatedSlots };
                      }
                      return daySchedule;
                    });
                    setTimetable({ ...timetable, schedule: updatedSchedule });
                    setShowSlotDialog(false);
                    setEditingSlot(null);
                    setSlotForm({ subjectId: '', teacherId: '', room: '' });
                    toast({ description: 'Short Break added successfully' });
                  }}
                >
                  Short Break
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (!timetable || !editingSlot) return;
                    const updatedSchedule = timetable.schedule.map((daySchedule) => {
                      if (daySchedule.day === editingSlot.day) {
                        const updatedSlots = [...daySchedule.slots];
                        updatedSlots[editingSlot.slotIndex] = {
                          ...updatedSlots[editingSlot.slotIndex],
                          subject: 'Lunch Break',
                          subjectId: undefined,
                          teacher: undefined,
                          teacherId: undefined,
                          room: undefined,
                        };
                        return { ...daySchedule, slots: updatedSlots };
                      }
                      return daySchedule;
                    });
                    setTimetable({ ...timetable, schedule: updatedSchedule });
                    setShowSlotDialog(false);
                    setEditingSlot(null);
                    setSlotForm({ subjectId: '', teacherId: '', room: '' });
                    toast({ description: 'Lunch Break added successfully' });
                  }}
                >
                  Lunch Break
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSlotDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSlotSave}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Time Slot Dialog */}
        <Dialog open={showTimeSlotDialog} onOpenChange={setShowTimeSlotDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Time Slot</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newTimeSlot.start}
                  onChange={(e) =>
                    setNewTimeSlot({ ...newTimeSlot, start: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={newTimeSlot.end}
                  onChange={(e) =>
                    setNewTimeSlot({ ...newTimeSlot, end: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowTimeSlotDialog(false);
                  setNewTimeSlot({ start: '', end: '' });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddTimeSlot}>Add Time Slot</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
