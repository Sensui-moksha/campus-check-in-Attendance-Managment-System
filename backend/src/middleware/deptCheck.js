/**
 * Department scope check middleware
 * Ensures HOD can only access their own department
 */
const deptCheck = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  // For HOD role, verify department matches request department
  if (req.user.role === 'hod') {
    const requestDept = req.params.deptId || req.body.departmentId;
    if (requestDept && requestDept !== req.user.department?.toString()) {
      return res.status(403).json({ error: 'Cannot access other departments' });
    }
  }

  next();
};

module.exports = deptCheck;
