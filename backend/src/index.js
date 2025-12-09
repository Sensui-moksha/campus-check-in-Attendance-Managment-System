require('dotenv').config();

const db = require('./utils/db');
const app = require('./app');
const config = require('./config');
const { initializePromotionScheduler } = require('./utils/promotionScheduler');

/**
 * Start server
 */
const start = async () => {
  try {
    // Connect to database
    await db.connectDB();

    // Initialize automatic promotion scheduler
    initializePromotionScheduler();

    // Start server - listen on all network interfaces for campus access
    const server = app.listen(config.PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${config.PORT}`);
      console.log(`📚 API accessible from any campus network`);
      console.log(`   Local: http://localhost:${config.PORT}/api`);
      console.log(`   Network: http://<your-ip>:${config.PORT}/api`);
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await db.disconnectDB();
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

start();
