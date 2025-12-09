/**
 * Global error handler middleware
 * Catches and formats all errors
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    console.error('Validation error details:', messages);
    return res.status(400).json({ error: 'Validation error', details: messages });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    let message = 'Duplicate entry detected';
    if (field) {
      message = `${field} already exists`;
    }
    // Check if error has keyValue to provide more context
    if (err.keyValue) {
      const keyValueStr = Object.entries(err.keyValue).map(([k, v]) => `${k}='${v}'`).join(', ');
      message = `Duplicate entry: ${keyValueStr}`;
    }
    console.error('Duplicate key error:', message, err.keyPattern, err.keyValue);
    return res.status(409).json({ error: message });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};

module.exports = errorHandler;
