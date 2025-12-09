import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/api';
import { useToast } from '@/hooks/use-toast';

interface Section {
  _id: string;
  name: string;
  yearOfStudy?: number;
}

interface Subject {
  _id: string;
  code: string;
  name: string;
  yearOfStudy: number;
  semester: number;
  section?: Section;
}

interface Student {
  _id: string;
  name: string;
  rollNo: string;
  email: string;
}

const statusIcons: Record<string, string> = {
  present: '✓',
  absent: '✗',
  late: '⏰',
  leave: '📋',
};

interface StudentAttendance {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'leave';
}

export default function PrincipalMarkAttendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, StudentAttendance>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all subjects on load
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setIsLoading(true);
        // Principal can view all subjects
        const response = await api.subjects.list();
        if (response.data?.subjects) {
          setSubjects(response.data.subjects);
        }
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
        toast({
          description: 'Failed to load subjects',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  // Fetch students when subject is selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedSubject) return;

      try {
        setIsLoading(true);
        const response = await api.subjects.get(selectedSubject._id);
        if (response.data?.students) {
          setStudents(response.data.students);
          // Initialize attendance state
          const initialAttendance: Record<string, StudentAttendance> = {};
          response.data.students.forEach((student: Student) => {
            initialAttendance[student._id] = {
              studentId: student._id,
              status: 'present',
            };
          });
          setAttendance(initialAttendance);
        }
      } catch (error) {
        console.error('Failed to fetch students:', error);
        toast({
          description: 'Failed to load students',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [selectedSubject]);

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late' | 'leave') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!selectedSubject) return;

    try {
      setIsSubmitting(true);
      const attendanceData = Object.values(attendance);

      await api.attendance.markSubjectAttendance({
        subjectId: selectedSubject._id,
        attendance: attendanceData,
        markedBy: user?._id,
        markedAt: new Date(),
      });

      toast({
        description: 'Attendance marked successfully',
      });

      // Reset form
      setSelectedSubject(null);
      setStudents([]);
      setAttendance({});
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      toast({
        description: 'Failed to mark attendance',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mark Attendance</h1>
          <p className="text-muted-foreground mt-2">Mark attendance for any subject</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <p className="text-muted-foreground">Loading subjects...</p>
              ) : subjects.length === 0 ? (
                <p className="text-muted-foreground">No subjects available</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjects.map(subject => (
                    <button
                      key={subject._id}
                      onClick={() => setSelectedSubject(subject)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedSubject?._id === subject._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-left">
                        <p className="font-semibold">{subject.name}</p>
                        <p className="text-sm text-gray-600">{subject.code}</p>
                        <p className="text-xs text-gray-500">
                          {subject.section?.name || 'Section'} - Year {subject.yearOfStudy}, Sem {subject.semester}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedSubject && (
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedSubject.name} - Mark Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading students...</p>
              ) : students.length === 0 ? (
                <p className="text-muted-foreground">No students in this subject</p>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Roll No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map(student => (
                        <TableRow key={student._id}>
                          <TableCell>{student.rollNo}</TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {(['present', 'absent', 'late', 'leave'] as const).map(status => (
                                <Button
                                  key={status}
                                  size="sm"
                                  variant={
                                    attendance[student._id]?.status === status
                                      ? 'default'
                                      : 'outline'
                                  }
                                  onClick={() => handleStatusChange(student._id, status)}
                                >
                                  {statusIcons[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
                                </Button>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex gap-4">
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Attendance'}
                    </Button>
                    <Button
                      onClick={() => setSelectedSubject(null)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
