/**
 * Configuration loader for environment variables
 */

module.exports = {
  PORT: process.env.PORT || 5000,
  // Default to local MongoDB when no env is provided (no Docker required)
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-check-in',
  JWT_SECRET: process.env.JWT_SECRET || 'REPLACE_WITH_STRONG_SECRET',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  NODE_ENV: process.env.NODE_ENV || 'development',
  ACADEMIC_YEAR: process.env.ACADEMIC_YEAR || '2025-26',
  ACADEMIC_YEAR_START: process.env.ACADEMIC_YEAR_START || '2025-07-01',
};
