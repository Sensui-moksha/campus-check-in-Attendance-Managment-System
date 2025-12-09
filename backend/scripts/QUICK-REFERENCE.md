# 🚀 Quick Reference: Admin User Creation

## One-Command Setup

```bash
cd backend
npm run create-admin
```

**Output includes:**
- ✅ Email: `admin@college.edu`
- ✅ Auto-generated secure password (16 chars)
- ✅ Role: Admin
- ✅ Displayed in terminal

---

## Common Commands

### Default Admin
```bash
npm run create-admin
```

### Custom Email & Name
```bash
npm run create-admin -- --email john@college.edu --name "John Doe"
```

### Principal Account
```bash
npm run create-admin -- --role principal --email principal@college.edu
```

### Custom Password
```bash
npm run create-admin -- --password "MySecurePass123!"
```

### Full Custom
```bash
npm run create-admin -- \
  --email admin@university.edu \
  --name "Chief Admin" \
  --password "SecurePass123!" \
  --role admin
```

---

## Options

| Flag | Values | Default |
|------|--------|---------|
| `--email` | Any valid email | `admin@college.edu` |
| `--name` | Any string | `System Administrator` |
| `--password` | Any string (8+ chars) | Auto-generated |
| `--role` | `admin` or `principal` | `admin` |

---

## What You'll See

```
╔══════════════════════════════════════════════════════════════╗
║          Campus Check-In - Admin User Creator               ║
╚══════════════════════════════════════════════════════════════╝

🔌 Connecting to MongoDB...
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

═══════════════════════════════════════════════════════════════
```

**💾 Save these credentials immediately!**

---

## Security Notes

✅ **Auto-generated passwords contain:**
- Uppercase letters (A-Z)
- Lowercase letters (a-z)
- Numbers (0-9)
- Special characters (!@#$%^&*)

✅ **Password storage:**
- Hashed with bcrypt (12 salt rounds)
- Never stored in plain text

---

## Quick Troubleshooting

**MongoDB not running?**
```bash
mongod --version  # Check if installed
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
```

**User already exists?**
```javascript
// MongoDB shell
use campus-check-in
db.users.deleteOne({ email: "admin@college.edu" })
```

**Need help?**
```bash
npm run create-admin -- --help
```

---

## Login After Creation

1. Open browser → `http://localhost:3000/login`
2. Enter email from terminal output
3. Enter password from terminal output
4. Click **Login**
5. ⚠️ Change password immediately in profile settings

---

**Pro Tip:** Save credentials in a password manager (1Password, LastPass, Bitwarden) immediately after creation!
