const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const config = require('../config');

/**
 * Login endpoint
 * Accepts email or rollNo + password
 * Generates JWT token for persistent authentication
 */
exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    // Debug logging
    console.log('Login attempt:', { identifier: identifier || 'missing', password: password ? '***' : 'missing' });

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password required' });
    }

    // Find user by email or rollNo
    const user = await User.findOne({
      $or: [{ email: identifier }, { rollNo: identifier }]
    }).populate('department');

    if (!user) {
      console.log('User not found:', identifier);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('User found:', user.email, 'Role in DB:', user.role, 'ID:', user._id);

    // Verify password
    const passwordValid = await user.comparePassword(password);
    if (!passwordValid) {
      console.log('Password invalid for user:', user.email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Password valid, generating JWT token for user:', user.email, 'with role:', user.role);

    // Check if student is detained
    if (user.role === 'student' && user.isDetained) {
      const detainerInfo = await User.findById(user.detainBy).select('name role');
      const detainerRole = detainerInfo ? detainerInfo.role.toUpperCase() : 'ADMINISTRATOR';
      const detainerName = detainerInfo ? detainerInfo.name : 'Administration';
      
      return res.status(403).json({
        error: 'Account Detained',
        isDetained: true,
        detainMessage: `Your account has been detained by ${detainerRole} (${detainerName}).`,
        detainReason: user.detainReason || 'No reason provided',
        detainReasonType: user.detainReasonType || 'custom',
        detainDate: user.detainDate,
        detainNotes: user.detainNotes,
        detainedBy: {
          name: detainerName,
          role: detainerRole
        },
        message: `Your account is currently detained. Reason: ${user.detainReason || 'Not specified'}. Please contact ${detainerName} for more information.`
      });
    }

    // Generate JWT token (primary authentication method)
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    console.log('✅ JWT token generated with payload:', { userId: user._id, email: user.email, role: user.role });

    // Also create session for audit logging (secondary)
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await Session.create({
      userId: user._id,
      sessionToken,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
      expiresAt,
    });

    console.log('Session created for audit:', session._id);

    // Set JWT in httpOnly cookie (primary method - survives page reloads)
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const cookieOptions = {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
      sameSite: 'lax', // Use 'lax' for localhost development
      secure: false, // Set to true only in production with HTTPS
    };
    
    // Explicitly clear old token and set new one using direct Set-Cookie headers
    // This ensures the old token is completely replaced
    // For localhost development, don't use Secure flag (it's for HTTPS only)
    res.setHeader('Set-Cookie', [
      `token=; Path=/; HttpOnly; SameSite=lax; Max-Age=0`,
      `token=${token}; Path=/; HttpOnly; SameSite=lax; Max-Age=${7 * 24 * 60 * 60}`,
    ]);
    
    console.log('🍪 Old token cleared and new JWT token cookie set');

    res.json({
      message: 'Login successful',
      token, // Also return in response for optional localStorage backup
      user: {
        id: user._id,
        name: user.name,
        displayName: user.displayName,
        email: user.email,
        rollNo: user.rollNo,
        role: user.role,
        programme: user.programme,
        department: user.department,
        batchYear: user.batchYear,
        yearOfStudy: user.yearOfStudy,
        semester: user.semester,
        employeeId: user.employeeId,
        designation: user.designation
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

/**
 * Logout endpoint
 * Clears JWT token and invalidates session
 */
exports.logout = async (req, res, next) => {
  try {
    if (req.sessionId) {
      await Session.findByIdAndUpdate(req.sessionId, { isActive: false });
    }

    // Clear cookies with same settings as login
    const cookieOptions = {
      httpOnly: true,
      path: '/',
      sameSite: 'none',
      secure: false, // Allow HTTP in development
    };
    
    res.clearCookie('token', cookieOptions);
    res.clearCookie('sessionToken', cookieOptions);
    
    console.log('🚪 User logged out, cookies cleared');
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 * Returns user info from session
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
};
