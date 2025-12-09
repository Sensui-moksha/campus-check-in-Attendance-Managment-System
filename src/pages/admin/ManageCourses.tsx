import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { UserCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/api';

interface Subject {
  _id: string;
  code: string;
  name: string;
  departmentName: string;
  teacher?: string;
}

export default function ManageCourses() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setIsLoading(true);
        const response = await api.subjects.list();
        
        if (response.data?.subjects) {
          setSubjects(response.data.subjects);
        }
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
        setSubjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  const handleAssign = (courseId: string) => {
    toast.success(`Opened assignment modal for ${courseId}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Subjects</h1>
          <p className="text-muted-foreground">View and manage all subjects</p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Total Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Assigned Teacher</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map(subject => (
                  <TableRow key={subject._id}>
                    <TableCell className="font-medium">{subject.code}</TableCell>
                    <TableCell>{subject.name}</TableCell>
                    <TableCell className="text-muted-foreground">{subject.departmentName || '-'}</TableCell>
                    <TableCell>{subject.teacher || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => handleAssign(subject.code)}>
                        <UserCheck className="h-4 w-4 mr-1" />
                        Assign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
