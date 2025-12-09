import type React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import tokens from '../styles/tokens';

/**
 * Login page - authenticate with email/rollNo + password
 * Uses server-side sessions with cookies (no localStorage)
 * Redirects to appropriate dashboard based on role
 */
export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [detentionInfo, setDetentionInfo] = useState<any>(null);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setDetentionInfo(null);
    setLoading(true);

    try {
      console.log('Attempting login with identifier:', identifier);
      const result = await login(identifier, password);

      if (!result.success) {
        throw new Error('Login failed');
      }

      console.log('Login successful for user:', result.user?.email);

      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });

      const roleRedirect: Record<string, string> = {
        student: '/student/dashboard',
        teacher: '/teacher/dashboard',
        hod: '/hod/dashboard',
        admin: '/admin/dashboard',
        principal: '/principal/dashboard',
      };

      const redirectPath = roleRedirect[result.user?.role] || '/student/dashboard';
      console.log('Redirecting to:', redirectPath);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      
      // Check if account is detained
      if (err?.response?.data?.isDetained) {
        const detainData = err.response.data;
        setDetentionInfo(detainData);
        setError('Account Detained');
      } else {
        const message = err?.response?.data?.error || err?.message || 'Login failed';
        setError(message);
        toast({
          title: 'Login Failed',
          description: message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#f5f5f5',
        padding: '24px 16px',
        boxSizing: 'border-box',
        gap: '32px',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Left Side - Login Form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '100%',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: tokens.colors.white,
            borderRadius: '18px',
            padding: '32px 24px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
            border: '1px solid #f0f0f0',
          }}
          className="sm:p-12 md:p-12 animate-fly-up"
        >
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            {/* Logo for mobile/tablet (hidden on desktop) */}
            <div className="lg:hidden flex justify-center mb-6 animate-fade-in delay-200">
              <div
                style={{
                  width: '120px',
                  height: '100px',
                  backgroundColor: 'transparent',
                  borderRadius: '16px',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                }}
              >
                <img
                  src="/logo-small.png"
                  style={{
                    width: '100%',
                    height: 'auto',
                    objectFit: 'contain',
                    backgroundColor: 'transparent',
                  }}
                  alt="Logo"
                />
              </div>
            </div>
            <h1
              className="text-2xl sm:text-3xl lg:text-[34px] animate-fly-up delay-100"
              style={{
                fontWeight: 700,
                color: '#1f1f1f',
                marginBottom: tokens.spacing.sm,
                fontFamily: 'Georgia, "Times New Roman", serif',
              }}
            >
              Welcome back
            </h1>
            <p
              className="text-base sm:text-lg animate-fly-up delay-200"
              style={{
                color: '#606060',
                fontWeight: 400,
                lineHeight: 1.6,
              }}
            >
              Access your account to discover & manage Attendance.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            {error && !detentionInfo && (
              <div
                className="animate-fly-up"
                style={{
                  backgroundColor: `${tokens.colors.status.absent}1A`,
                  borderRadius: '10px',
                  padding: tokens.spacing.md,
                  marginBottom: tokens.spacing.md,
                  color: tokens.colors.status.absent,
                  fontSize: tokens.typography.fontSize.sm,
                }}
              >
                {error}
              </div>
            )}

            {/* Detention Warning */}
            {detentionInfo && (
              <div
                className="animate-fly-up"
                style={{
                  backgroundColor: '#FEF2F2',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '20px',
                  border: '2px solid #DC2626',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ 
                    backgroundColor: '#DC2626', 
                    borderRadius: '50%', 
                    width: '32px', 
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>!</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: 700, 
                      color: '#991B1B',
                      marginBottom: '8px'
                    }}>
                      Account Detained
                    </h3>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#7F1D1D',
                      marginBottom: '12px',
                      lineHeight: 1.5
                    }}>
                      {detentionInfo.detainMessage}
                    </p>
                    <div style={{ 
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '8px'
                    }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#991B1B', marginBottom: '4px' }}>
                        Reason:
                      </p>
                      <p style={{ fontSize: '14px', color: '#1F2937', lineHeight: 1.5 }}>
                        {detentionInfo.detainReason}
                      </p>
                      {detentionInfo.detainNotes && (
                        <>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: '#991B1B', marginTop: '8px', marginBottom: '4px' }}>
                            Additional Notes:
                          </p>
                          <p style={{ fontSize: '14px', color: '#1F2937', lineHeight: 1.5 }}>
                            {detentionInfo.detainNotes}
                          </p>
                        </>
                      )}
                    </div>
                    <p style={{ 
                      fontSize: '13px', 
                      color: '#991B1B',
                      fontStyle: 'italic'
                    }}>
                      Please contact {detentionInfo.detainedBy?.name || 'administration'} for more information.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Email Input */}
            <div className="animate-fly-up delay-300" style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#3a3a3a',
                  marginBottom: tokens.spacing.xs,
                }}
              >
                Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="Enter your academic email or roll number"
                style={{
                  width: '100%',
                  height: '56px',
                  padding: '0 16px',
                  borderRadius: '10px',
                  border: '1px solid #dcdcdc',
                  backgroundColor: '#fafafa',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  fontFamily: tokens.typography.fontFamily.base,
                  transition: 'border-color 0.25s, box-shadow 0.25s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#1f1f1f';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(31, 31, 31, 0.08)';
                  e.currentTarget.style.outline = 'none';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#dcdcdc';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div className="animate-fly-up delay-400" style={{ marginBottom: '26px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#3a3a3a',
                  marginBottom: tokens.spacing.xs,
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    height: '56px',
                    padding: '0 46px 0 16px',
                    borderRadius: '10px',
                    border: '1px solid #dcdcdc',
                    backgroundColor: '#fafafa',
                    fontSize: '15px',
                    boxSizing: 'border-box',
                    fontFamily: tokens.typography.fontFamily.base,
                    transition: 'border-color 0.25s, box-shadow 0.25s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1f1f1f';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(31, 31, 31, 0.08)';
                    e.currentTarget.style.outline = 'none';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#dcdcdc';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#8a8a8a',
                    fontSize: '18px',
                    lineHeight: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    transition: 'color 0.25s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = '#3a3a3a';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = '#8a8a8a';
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={loading}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    {showPassword ? (
                      <>
                        <path d="M1.5 12s4-6.5 10.5-6.5S22.5 12 22.5 12 18.5 18.5 12 18.5 1.5 12 1.5 12Z" />
                        <circle cx="12" cy="12" r="3.5" />
                      </>
                    ) : (
                      <>
                        <path d="M3 3l18 18M6 6c-1.5 1.5-3 3.5-3.5 5.5 0 0 4 6.5 10.5 6.5 1.5 0 3-.25 4.25-.75l2.25 2.25M12 18.5c-6.5 0-10.5-6.5-10.5-6.5s.5-1 1-2" />
                        <path d="M12 12c-.5.5-1 1-1 2 0 1.66 1.34 3 3 3 1 0 2-.5 2.5-1" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="animate-fly-up delay-500"
              style={{
                width: '100%',
                height: '56px',
                borderRadius: '10px',
                backgroundColor: '#1f1f1f',
                color: tokens.colors.white,
                fontWeight: 700,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                opacity: loading ? 0.75 : 1,
                transition: 'background-color 0.25s, transform 0.1s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#2b2b2b';
                }
              }}
              onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.backgroundColor = '#1f1f1f';
              }}
              onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(1px)';
                }
              }}
              onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {loading && (
                <div className="relative" style={{ width: '24px', height: '24px' }}>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400/40 to-blue-400/40 animate-logo-rotate" style={{ animationDuration: '2s' }} />
                  <img
                    src="/logo-small.png"
                    alt="Loading"
                    className="relative z-10 animate-logo-pulse"
                    style={{ 
                      width: '20px', 
                      height: '20px',
                      objectFit: 'contain',
                      filter: 'brightness(0) invert(1) drop-shadow(0 2px 4px rgba(255,255,255,0.3))'
                    }}
                  />
                </div>
              )}
              {loading ? 'Signing in...' : 'Enter the Realm'}
            </button>

            {/* Sign Up Link */}
            <div
              className="animate-fade-in delay-600"
              style={{
                marginTop: '22px',
                textAlign: 'center',
                fontSize: '15px',
                color: '#616161',
              }}
            >
              Forgot password?{' '}
              <span
                style={{
                  color: '#1f1f1f',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  textDecorationThickness: '2px',
                }}
              >
                Contact Admin
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Logo & Quote (Hidden on mobile/tablet) */}
      <div
        className="hidden lg:flex animate-fade-in delay-300"
        style={{
          flex: 1,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
        }}
      >
        <div
          style={{
            width: '260px',
            height: '180px',
            backgroundColor: 'transparent',
            borderRadius: '18px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12)',
            border: '1px solid rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '32px',
          }}
        >
          <img
            src="/logo-small.png"
            style={{
              width: '220px',
              height: 'auto',
              maxHeight: '160px',
              objectFit: 'contain',
              backgroundColor: 'transparent',
              boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
              borderRadius: '12px',
              padding: '8px',
            }}
            alt="Logo"
          />
        </div>

        <div style={{ textAlign: 'center', maxWidth: '620px' }}>
          <p
            style={{
              fontSize: '40px',
              lineHeight: 1.3,
              color: '#2c2c2c',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              marginBottom: '18px',
            }}
          >
            "Aim for the moon. If you miss, you may hit a star."
          </p>
          <p
            style={{
              fontSize: '18px',
              color: '#666',
              fontFamily: tokens.typography.fontFamily.base,
            }}
          >
            - W. Clement Stone
          </p>
        </div>
      </div>
    </div>
  );
}
