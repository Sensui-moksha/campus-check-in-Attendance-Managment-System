const jwt = require('jsonwebtoken');
const Session = require('../models/Session');
const User = require('../models/User');
const config = require('../config');

/**
 * Authentication middleware
 * Primary: Verifies JWT token from httpOnly cookie
 * Fallback: Validates server-side session for audit
 * Attaches user info to request
 */
const auth = async (req, res, next) => {
  try {
    // Primary: JWT token from cookie
    // Fallback: JWT token from Authorization header
    let token = req.cookies?.token;
    
    // If no cookie, try Authorization header (Bearer token)
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
        console.log('🔐 Auth check - Using token from Authorization header');
      }
    }

    // Debug: Log what we're receiving
    console.log('🔐 Auth check - Cookies:', Object.keys(req.cookies || {}), 'Token present:', !!token);

    if (!token) {
      console.log('❌ No token in cookies or Authorization header, returning 401');
      return res.status(401).json({ error: 'No authentication token. Please login.' });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET);
      console.log('✅ JWT verified - User ID:', decoded.userId, 'Role:', decoded.role, 'Email:', decoded.email);
    } catch (jwtError) {
      // JWT verification failed - clear the invalid token
      console.log('❌ JWT verification failed:', jwtError.message);
      console.log('💡 Hint: Token may have been created with different JWT_SECRET. Clearing cookie.');
      
      // Clear the invalid token cookie
      res.clearCookie('token', { path: '/' });
      
      return res.status(401).json({ 
        error: 'Invalid or expired token. Please login again.',
        reason: jwtError.message 
      });
    }

    // Fetch full user data from database
    const user = await User.findById(decoded.userId).populate('department');

    if (!user) {
      console.log('❌ User not found in database - ID:', decoded.userId);
      return res.status(401).json({ error: 'User not found.' });
    }
    
    console.log('✅ User loaded from DB - Name:', user.name, 'Role:', user.role);

    // Optional: Log session for audit purposes
    const sessionToken = req.cookies?.sessionToken;
    if (sessionToken) {
      const session = await Session.findOne({
        sessionToken,
        isActive: true,
      });

      if (session) {
        session.lastActivityAt = new Date();
        await session.save();
        req.sessionId = session._id;
      }
    }

    // Attach user to request
    req.user = {
      id: user._id,
      userId: user._id,
      _id: user._id,
      email: user.email,
      name: user.name,
      displayName: user.displayName,
      role: user.role,
      department: user.department,
      yearOfStudy: user.yearOfStudy,
      semester: user.semester,
      batchYear: user.batchYear,
      rollNo: user.rollNo,
      employeeId: user.employeeId,
      designation: user.designation,
      programme: user.programme,
    };

    console.log('✅ Auth complete - req.user set with role:', req.user.role, 'email:', req.user.email);
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(500).json({ error: 'Authentication error' });
  }
};

module.exports = auth;
