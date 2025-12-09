import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import api from '../api';

interface DetainModalProps {
  isOpen: boolean;
  onClose: () => void;
  userIds: string[];
  students: Array<{
    _id: string;
    name: string;
    rollNo: string;
    attendancePercent?: number | null;
    creditScore?: number;
  }>;
  onSuccess?: () => void;
  performedBy: string;
}

const REASON_TYPES = [
  { value: 'low_attendance', label: 'Low Attendance' },
  { value: 'low_credit', label: 'Low Credit Score' },
  { value: 'disciplinary', label: 'Disciplinary Issues' },
  { value: 'custom', label: 'Custom Reason' }
];

const DetainModal: React.FC<DetainModalProps> = ({
  isOpen,
  onClose,
  userIds,
  students,
  onSuccess,
  performedBy
}) => {
  const [reasonType, setReasonType] = useState<string>('low_attendance');
  const [reason, setReason] = useState<string>('');
  const [detainDate, setDetainDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  const [notify, setNotify] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError('Please provide a reason for detention');
      return;
    }

    if (userIds.length === 0) {
      setError('No students selected');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/detain', {
        userIds,
        reason: reason.trim(),
        reasonType,
        detainDate,
        notes: notes.trim() || null,
        performedBy,
        notify
      });

      console.log('Detention response:', response.data);

      if (onSuccess) {
        onSuccess();
      }

      // Reset form
      setReason('');
      setNotes('');
      setReasonType('low_attendance');
      setNotify(false);

      onClose();
    } catch (err: any) {
      console.error('Failed to detain students:', err);
      setError(err.response?.data?.error || 'Failed to detain students');
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill reason based on reason type
  const handleReasonTypeChange = (value: string) => {
    setReasonType(value);

    // Auto-fill reason based on type
    if (value === 'low_attendance') {
      setReason('Attendance below 75% threshold');
    } else if (value === 'low_credit') {
      setReason('Credit score below 40 threshold');
    } else if (value === 'disciplinary') {
      setReason('Disciplinary action required');
    } else {
      setReason('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">
                Detain Students
              </DialogTitle>
              <DialogDescription className="text-sm">
                You are about to detain {userIds.length} student(s). This will prevent promotion to the next academic year.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selected Students Summary */}
          <div className="bg-gray-50 p-4 rounded border">
            <h3 className="font-semibold mb-2">Selected Students ({students.length})</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {students.map(student => (
                <div key={student._id} className="flex justify-between text-sm">
                  <span>
                    {student.rollNo} - {student.name}
                  </span>
                  <span className="text-gray-600">
                    {student.attendancePercent !== null && student.attendancePercent !== undefined
                      ? `${student.attendancePercent.toFixed(1)}%`
                      : 'N/A'}
                    {student.creditScore !== undefined && ` | ${student.creditScore} credits`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Reason Type */}
          <div className="space-y-2">
            <Label htmlFor="reasonType">Reason Type *</Label>
            <Select value={reasonType} onValueChange={handleReasonTypeChange}>
              <SelectTrigger id="reasonType">
                <SelectValue placeholder="Select reason type" />
              </SelectTrigger>
              <SelectContent>
                {REASON_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for detention"
              rows={3}
              required
            />
          </div>

          {/* Detain Date */}
          <div className="space-y-2">
            <Label htmlFor="detainDate">Detention Date *</Label>
            <input
              type="date"
              id="detainDate"
              value={detainDate}
              onChange={(e) => setDetainDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any additional notes or comments"
              rows={3}
            />
          </div>

          {/* Notify Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="notify"
              checked={notify}
              onCheckedChange={(checked) => setNotify(checked as boolean)}
            />
            <Label htmlFor="notify" className="cursor-pointer">
              Send notification to students and their parents
            </Label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          {/* Footer */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? 'Detaining...' : `Detain ${userIds.length} Student(s)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DetainModal;
