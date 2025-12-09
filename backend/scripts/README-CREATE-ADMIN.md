# Admin User Creation Script

## 📖 Overview

This script creates admin or principal users in the Campus Check-In database with secure, randomly-generated passwords. Credentials are displayed in the terminal for immediate access.

---

## 🚀 Quick Start

### Simple Usage (Default Admin)
```bash
cd backend
npm run create-admin
```

This creates an admin user with:
- **Email:** `admin@college.edu`
- **Name:** `System Administrator`
- **Password:** Auto-generated (16 characters, secure)
- **Role:** `admin`

---

## 🎯 Usage Examples

### Create Admin with Custom Email
```bash
npm run create-admin -- --email john.doe@college.edu --name "John Doe"
```

### Create Principal Account
```bash
npm run create-admin -- --role principal --email principal@college.edu --name "Dr. Smith"
```

### Create Admin with Custom Password
```bash
npm run create-admin -- --email admin@university.edu --password "MySecurePass123!"
```

### All Options Combined
```bash
npm run create-admin -- \
  --email admin@college.edu \
  --name "Chief Administrator" \
  --password "SecurePass123!" \
  --role admin
```

---

## ⚙️ Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--email <email>` | Admin email address | `admin@college.edu` |
| `--name <name>` | Full name | `System Administrator` |
| `--password <pass>` | Custom password | Auto-generated (16 chars) |
| `--role <role>` | User role (`admin` or `principal`) | `admin` |
| `--help` | Show help message | - |

---

## 🔐 Security Features

### Auto-Generated Passwords
When no password is provided, the script generates a secure 16-character password with:
- ✅ Uppercase letters (A-Z)
- ✅ Lowercase letters (a-z)
- ✅ Numbers (0-9)
- ✅ Special characters (!@#$%^&*)
- ✅ Cryptographically random generation

### Password Storage
- Passwords are hashed using **bcrypt** with 12 salt rounds
- Raw passwords are **never stored** in the database
- Only the secure hash is saved

---

## 📋 Output Example

```
╔══════════════════════════════════════════════════════════════╗
║          Campus Check-In - Admin User Creator               ║
╚══════════════════════════════════════════════════════════════╝

🔌 Connecting to MongoDB...
   Database: mongodb://127.0.0.1:27017/campus-check-in

✅ Connected to MongoDB

👤 Creating admin user...

✅ Admin user created successfully!

═══════════════════════════════════════════════════════════════
                   ADMIN CREDENTIALS                           
═══════════════════════════════════════════════════════════════

   📧 Email:     admin@college.edu
   🔑 Password:  aB3$xY9@mK2#pL7!
   👤 Name:      System Administrator
   🎭 Role:      ADMIN
   🆔 User ID:   507f1f77bcf86cd799439011

   ⚠️  Password was auto-generated. Save it securely!

═══════════════════════════════════════════════════════════════

⚡ Quick Login:
   1. Navigate to the login page
   2. Enter email: admin@college.edu
   3. Enter password: [shown above]
   4. Click "Login"

💡 Tips:
   • Change the password after first login
   • Store credentials in a secure password manager
   • Enable 2FA if available

🔌 Database connection closed
```

---

## ⚠️ Error Handling

### Duplicate User
If a user with the same email already exists:
```
⚠️  User already exists!

   Email: admin@college.edu
   Name: System Administrator
   Role: admin
   Created: 2025-12-09T10:30:00.000Z

❌ Cannot create duplicate user. Use a different email or delete the existing user.
```

### Database Connection Error
```
❌ Error creating admin user:

   MongoServerError: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:** Ensure MongoDB is running:
```bash
# Check MongoDB status
mongod --version

# Start MongoDB (if not running)
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
```

---

## 🛠️ Advanced Usage

### Direct Script Execution
```bash
node scripts/create-admin-user.js --email admin@college.edu
```

### Using with Environment Variables
```bash
# Set MongoDB URI
export MONGO_URI="mongodb://localhost:27017/campus-check-in"

# Run script
npm run create-admin
```

### Automated Deployment Script
```bash
#!/bin/bash
# deploy-admin.sh

echo "Creating admin user for production..."
npm run create-admin -- \
  --email admin@production.edu \
  --name "Production Admin" \
  --password "$ADMIN_PASSWORD" \
  --role admin
```

---

## 📝 Best Practices

### ✅ Do's
- ✅ Store generated passwords in a secure password manager (1Password, LastPass, Bitwarden)
- ✅ Change default passwords immediately after first login
- ✅ Use strong, unique passwords for each environment (dev, staging, prod)
- ✅ Rotate admin passwords regularly (every 90 days)
- ✅ Keep script logs secure and delete after credential extraction

### ❌ Don'ts
- ❌ Never commit credentials to version control
- ❌ Don't share passwords via email or chat
- ❌ Don't use the same password across multiple environments
- ❌ Don't store passwords in plain text files
- ❌ Don't use weak passwords even if manually specified

---

## 🧪 Testing

### Test Script Locally
```bash
# Start local MongoDB
mongod

# Run script in test mode
npm run create-admin -- --email test@test.com --name "Test Admin"

# Verify user creation
mongo campus-check-in --eval "db.users.findOne({email: 'test@test.com'})"
```

### Clean Up Test Users
```javascript
// MongoDB shell
use campus-check-in
db.users.deleteOne({ email: "test@test.com" })
```

---

## 🔧 Troubleshooting

### Issue: "Cannot find module '../src/config'"
**Solution:** Ensure you're running from the `backend` directory:
```bash
cd backend
npm run create-admin
```

### Issue: "MongoNetworkError: failed to connect"
**Solution:** Check MongoDB connection string in `.env` or config:
```bash
# Check connection
echo $MONGO_URI

# Test MongoDB connection
mongo --eval "db.version()"
```

### Issue: "E11000 duplicate key error"
**Solution:** User already exists. Use different email or delete existing user:
```javascript
// MongoDB shell
db.users.deleteOne({ email: "admin@college.edu" })
```

---

## 📚 Related Scripts

- `init-system-settings.js` - Initialize system settings
- `fix-duplicate-sections.js` - Fix section duplicates
- `cleanup-invalid-sections.js` - Clean invalid data

---

## 🤝 Support

For issues or questions:
1. Check MongoDB is running: `mongod --version`
2. Verify connection string in `backend/src/config/index.js`
3. Review error messages for specific guidance
4. Check database permissions

---

## 📄 License

MIT License - Part of Campus Check-In Attendance Management System

---

**Last Updated:** December 9, 2025  
**Version:** 1.0.0
