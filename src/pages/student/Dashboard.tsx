import { useState, useEffect } from 'react';
import { api } from '../../api';
import tokens from '../../styles/tokens';

/**
 * Student Dashboard - displays attendance overview and stats
 * Shows per-course attendance percentages and recent session history
 */
export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        setUser(userData);

        if (userData?.id) {
          const response = await api.attendance.getStudentOverview(userData.id);
          setOverview(response.data);
        }
      } catch (err) {
        setError('Failed to load attendance overview');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: tokens.spacing.lg, textAlign: 'center' }}>
        <p>Loading attendance overview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: tokens.spacing.lg,
          backgroundColor: `${tokens.colors.status.absent}20`,
          borderRadius: tokens.borderRadius.md,
          color: tokens.colors.status.absent,
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div style={{ padding: tokens.spacing.lg }}>
      {/* Header */}
      <div style={{ marginBottom: tokens.spacing['2xl'] }}>
        <h1
          style={{
            fontSize: tokens.typography.fontSize['2xl'],
            fontWeight: tokens.typography.fontWeight.bold,
            color: tokens.colors.gray[900],
            marginBottom: tokens.spacing.sm,
          }}
        >
          Welcome, {user?.name}
        </h1>
        <p style={{ color: tokens.colors.gray[600] }}>
          Year {user?.yearOfStudy} | Semester {user?.semester} | Roll No: {user?.rollNo}
        </p>
      </div>

      {/* Attendance Overview Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: tokens.spacing.lg,
          marginBottom: tokens.spacing['2xl'],
        }}
      >
        {overview?.courseAttendance?.length > 0 ? (
          overview.courseAttendance.map(course => (
            <div
              key={course.courseId}
              style={{
                backgroundColor: tokens.colors.white,
                borderRadius: tokens.borderRadius.lg,
                padding: tokens.spacing.lg,
                boxShadow: tokens.shadow.md,
              }}
            >
              <h3
                style={{
                  fontSize: tokens.typography.fontSize.base,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: tokens.colors.gray[900],
                  marginBottom: tokens.spacing.sm,
                }}
              >
                {course.courseName}
              </h3>
              <p
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  color: tokens.colors.gray[600],
                  marginBottom: tokens.spacing.md,
                }}
              >
                {course.courseCode}
              </p>

              {/* Progress Ring */}
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.lg }}>
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 80 80"
                  style={{ transform: 'rotate(-90deg)' }}
                >
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    fill="none"
                    stroke={tokens.colors.border}
                    strokeWidth="2"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    fill="none"
                    stroke={
                      course.percentage >= 75
                        ? tokens.colors.status.present
                        : course.percentage >= 60
                          ? tokens.colors.status.late
                          : tokens.colors.status.absent
                    }
                    strokeWidth="2"
                    strokeDasharray={`${2 * Math.PI * 35 * (course.percentage / 100)} ${2 * Math.PI * 35}`}
                  />
                </svg>
                <div>
                  <p
                    style={{
                      fontSize: tokens.typography.fontSize['2xl'],
                      fontWeight: tokens.typography.fontWeight.bold,
                      color: tokens.colors.gray[900],
                    }}
                  >
                    {course.percentage.toFixed(1)}%
                  </p>
                  <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.gray[600] }}>
                    {course.attended} of {course.total} sessions
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: tokens.spacing.lg,
              color: tokens.colors.gray[600],
            }}
          >
            No course data available
          </div>
        )}
      </div>

      {/* View History Button */}
      <div style={{ marginTop: tokens.spacing.lg }}>
        <button
          onClick={() => (window.location.href = '/student/history')}
          style={{
            padding: tokens.spacing.md,
            backgroundColor: tokens.colors.primary,
            color: tokens.colors.white,
            borderRadius: tokens.borderRadius.md,
            border: 'none',
            cursor: 'pointer',
            fontWeight: tokens.typography.fontWeight.semibold,
            fontSize: tokens.typography.fontSize.base,
          }}
        >
          View Detailed History
        </button>
      </div>
    </div>
  );
}
