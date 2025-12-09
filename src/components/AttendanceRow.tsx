import React, { useState } from 'react';
import tokens from '../styles/tokens';

/**
 * AttendanceRow Component
 * Single student attendance entry with keyboard shortcuts
 * P = Present, A = Absent, L = Late, V = Leave
 */
export function AttendanceRow({ student, sessionId, onStatusChange, currentStatus = 'absent' }) {
  const [status, setStatus] = useState(currentStatus);
  const [isFocused, setIsFocused] = useState(false);

  const statusOptions = [
    { value: 'present', label: 'Present', shortcut: 'P', color: '#10b981' },
    { value: 'absent', label: 'Absent', shortcut: 'A', color: '#ef4444' },
    { value: 'late', label: 'Late', shortcut: 'L', color: '#f59e0b' },
    { value: 'leave', label: 'Leave', shortcut: 'V', color: '#3b82f6' },
  ];

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    onStatusChange(student._id, newStatus);
  };

  const handleKeyDown = (e) => {
    const key = e.key.toUpperCase();
    const option = statusOptions.find(opt => opt.shortcut === key);
    if (option) {
      e.preventDefault();
      handleStatusChange(option.value);
    }
    
    // Arrow keys for navigation
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const currentIndex = statusOptions.findIndex(opt => opt.value === status);
      const nextIndex = (currentIndex + 1) % statusOptions.length;
      handleStatusChange(statusOptions[nextIndex].value);
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const currentIndex = statusOptions.findIndex(opt => opt.value === status);
      const nextIndex = (currentIndex - 1 + statusOptions.length) % statusOptions.length;
      handleStatusChange(statusOptions[nextIndex].value);
    }
  };

  const currentStatusObj = statusOptions.find(opt => opt.value === status);

  return (
    <div
      className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
      style={{
        borderLeft: `4px solid ${currentStatusObj?.color}`,
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Student Info */}
      <div className="flex-1">
        <p className="font-medium text-gray-900">{student.name}</p>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>{student.rollNo}</span>
          <span>{student.email}</span>
        </div>
      </div>

      {/* Status Buttons */}
      <div className="flex gap-2">
        {statusOptions.map(option => (
          <button
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            title={`${option.label} (${option.shortcut})`}
            className="px-3 py-2 rounded-md text-sm font-medium transition-all"
            style={{
              backgroundColor: status === option.value ? option.color : '#f3f4f6',
              color: status === option.value ? 'white' : '#374151',
              border: isFocused ? `2px solid ${option.color}` : '1px solid #e5e7eb',
            }}
          >
            {option.shortcut}
          </button>
        ))}
      </div>

      {/* Status Badge */}
      <div
        className="px-3 py-1 rounded-full text-xs font-semibold text-white"
        style={{ backgroundColor: currentStatusObj?.color }}
      >
        {currentStatusObj?.label}
      </div>
    </div>
  );
}

/**
 * AttendanceRoster Component
 * List of students with AttendanceRow components
 */
export function AttendanceRoster({ students, sessionId, onStatusChange, attendanceMap = {} }) {
  return (
    <div className="space-y-2">
      {students.map(student => (
        <AttendanceRow
          key={student._id}
          student={student}
          sessionId={sessionId}
          onStatusChange={onStatusChange}
          currentStatus={attendanceMap[student._id] || 'absent'}
        />
      ))}
    </div>
  );
}
