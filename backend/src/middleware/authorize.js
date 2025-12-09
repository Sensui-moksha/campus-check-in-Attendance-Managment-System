/**
 * Role-based authorization middleware
 * Checks if user has required role(s)
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      console.log('❌ Authorization failed: User not authenticated');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log(`🔒 Authorization check - User role: "${req.user.role}", Allowed roles:`, allowedRoles);

    if (!allowedRoles.includes(req.user.role)) {
      console.log(`❌ Authorization failed - User role "${req.user.role}" not in allowed roles:`, allowedRoles);
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    console.log(`✅ Authorization passed for role: ${req.user.role}`);
    next();
  };
};

module.exports = authorize;
