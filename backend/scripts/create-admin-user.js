#!/usr/bin/env node
/**
 * Create Admin User Script
 * 
 * This script creates an admin user in the database with a randomly generated
 * password. The credentials are displayed in the terminal for secure access.
 * 
 * Usage:
 *   node scripts/create-admin-user.js
 *   node scripts/create-admin-user.js --email admin@college.edu --name "Admin User"
 * 
 * Options:
 *   --email <email>    Admin email address (default: admin@college.edu)
 *   --name <name>      Admin full name (default: System Administrator)
 *   --password <pass>  Custom password (default: auto-generated)
 *   --role <role>      User role (default: admin, options: admin, principal)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const config = require('../src/config');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    email: 'admin@college.edu',
    name: 'System Administrator',
    password: null,
    role: 'admin'
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      options.email = args[i + 1];
      i++;
    } else if (args[i] === '--name' && args[i + 1]) {
      options.name = args[i + 1];
      i++;
    } else if (args[i] === '--password' && args[i + 1]) {
      options.password = args[i + 1];
      i++;
    } else if (args[i] === '--role' && args[i + 1]) {
      if (['admin', 'principal'].includes(args[i + 1])) {
        options.role = args[i + 1];
      } else {
        console.error('❌ Invalid role. Use: admin or principal');
        process.exit(1);
      }
      i++;
    }
  }

  return options;
}

// Generate secure random password
function generatePassword(length = 16) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Digit
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special char
  
  // Fill the rest
  const bytes = crypto.randomBytes(length - 4);
  for (let i = 0; i < length - 4; i++) {
    password += charset[bytes[i] % charset.length];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// User Schema (inline to avoid import issues)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  displayName: { type: String, trim: true },
  email: { type: String, sparse: true, unique: true, lowercase: true, trim: true },
  rollNo: { type: String, sparse: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['student', 'teacher', 'hod', 'admin', 'principal'],
    required: true 
  },
  programme: { type: String, default: 'B.Tech' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  workingDepartments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
  employeeId: { type: String, sparse: true, unique: true, trim: true },
  designation: { type: String, trim: true },
  batchYear: { type: Number },
  section: { type: String, trim: true },
  yearOfStudy: { type: Number, min: 1, max: 4 },
  semester: { type: Number, min: 1, max: 8 },
  academicStartDate: { type: Date },
  isDetained: { type: Boolean, default: false },
  detainedAt: { type: Date },
  detainedReason: { type: String },
  detainedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  detainmentNotified: { type: Boolean, default: false },
  attendance: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentAttendance' }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(config.BCRYPT_SALT_ROUNDS || 12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Main function
async function createAdminUser() {
  const options = parseArgs();
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║          Campus Check-In - Admin User Creator               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    console.log(`   Database: ${config.MONGO_URI.replace(/\/\/.*@/, '//***:***@')}\n`);
    
    await mongoose.connect(config.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB\n');

    // Get or create User model
    const User = mongoose.models.User || mongoose.model('User', userSchema);

    // Check if user already exists
    const existingUser = await User.findOne({ email: options.email });
    
    if (existingUser) {
      console.log('⚠️  User already exists!\n');
      console.log('   Email:', existingUser.email);
      console.log('   Name:', existingUser.name);
      console.log('   Role:', existingUser.role);
      console.log('   Created:', existingUser.createdAt.toISOString());
      console.log('\n❌ Cannot create duplicate user. Use a different email or delete the existing user.\n');
      process.exit(1);
    }

    // Generate password if not provided
    const password = options.password || generatePassword(16);
    const autoGenerated = !options.password;

    // Create admin user
    console.log('👤 Creating admin user...\n');
    
    const adminUser = new User({
      name: options.name,
      email: options.email,
      passwordHash: password, // Will be hashed by pre-save hook
      role: options.role,
      designation: options.role === 'principal' ? 'Principal' : 'System Administrator'
    });

    await adminUser.save();

    console.log('✅ Admin user created successfully!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                   ADMIN CREDENTIALS                           ');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('   📧 Email:    ', options.email);
    console.log('   🔑 Password: ', password);
    console.log('   👤 Name:     ', options.name);
    console.log('   🎭 Role:     ', options.role.toUpperCase());
    console.log('   🆔 User ID:  ', adminUser._id.toString());
    
    if (autoGenerated) {
      console.log('\n   ⚠️  Password was auto-generated. Save it securely!');
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('⚡ Quick Login:');
    console.log('   1. Navigate to the login page');
    console.log('   2. Enter email:', options.email);
    console.log('   3. Enter password: [shown above]');
    console.log('   4. Click "Login"\n');
    
    console.log('💡 Tips:');
    console.log('   • Change the password after first login');
    console.log('   • Store credentials in a secure password manager');
    console.log('   • Enable 2FA if available\n');

  } catch (error) {
    console.error('\n❌ Error creating admin user:\n');
    
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      console.error(`   Duplicate ${field}: A user with this ${field} already exists.`);
    } else if (error.name === 'ValidationError') {
      console.error('   Validation Error:');
      Object.values(error.errors).forEach(err => {
        console.error(`   - ${err.path}: ${err.message}`);
      });
    } else {
      console.error('   ', error.message);
      console.error('\n   Stack trace:');
      console.error('   ', error.stack);
    }
    
    console.error('\n');
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');
  }
}

// Display help
function showHelp() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║          Campus Check-In - Admin User Creator               ║
╚══════════════════════════════════════════════════════════════╝

USAGE:
  node scripts/create-admin-user.js [OPTIONS]

OPTIONS:
  --email <email>       Admin email address
                        Default: admin@college.edu

  --name <name>         Admin full name
                        Default: System Administrator

  --password <pass>     Custom password (if not provided, auto-generated)
                        Default: [auto-generated 16-char secure password]

  --role <role>         User role (admin or principal)
                        Default: admin

  --help                Show this help message

EXAMPLES:
  # Create admin with default settings (auto-generated password)
  node scripts/create-admin-user.js

  # Create admin with custom email and name
  node scripts/create-admin-user.js --email john@college.edu --name "John Doe"

  # Create principal with custom password
  node scripts/create-admin-user.js --role principal --password "MySecurePass123!"

  # Create admin with all custom options
  node scripts/create-admin-user.js \\
    --email admin@university.edu \\
    --name "Chief Administrator" \\
    --password "SecurePassword123!" \\
    --role admin

NOTES:
  • Auto-generated passwords are 16 characters with mixed case, digits, and symbols
  • Passwords are securely hashed using bcrypt before storage
  • Credentials are displayed in terminal after successful creation
  • Email addresses must be unique in the database

SECURITY:
  ⚠️  Store generated credentials securely
  ⚠️  Change default password after first login
  ⚠️  Never commit credentials to version control
  `);
}

// Check for help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run the script
createAdminUser();
