const mongoose = require('mongoose');
const config = require('../config');

/**
 * Connect to MongoDB (Atlas or Local)
 * Connection string should be in MONGO_URI env var
 * Atlas format: mongodb+srv://user:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
 */
exports.connectDB = async () => {
  try {
    if (!config.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not set');
    }

    await mongoose.connect(config.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Atlas-specific options
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log('✓ MongoDB connected successfully');
    console.log(`  Database: ${mongoose.connection.db.name}`);
    console.log(`  Host: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('✗ MongoDB connection failed');
    
    // Provide helpful error messages
    if (error.message.includes('authentication failed')) {
      console.error('  → Check username/password in MONGO_URI');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('  → Network error - check internet connection and IP whitelist');
    } else if (error.message.includes('MONGO_URI')) {
      console.error('  → Set MONGO_URI in .env file');
    }
    
    console.error(`  Error: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 */
exports.disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('✓ MongoDB disconnected');
  } catch (error) {
    console.error('✗ MongoDB disconnection failed:', error.message);
  }
};

/**
 * Check connection status
 */
exports.isConnected = () => {
  return mongoose.connection.readyState === 1;
};

