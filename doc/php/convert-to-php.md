# MongoDB to PHP/MySQL Conversion Guide

## 🎯 Overview

This guide provides step-by-step instructions for converting the **Campus Check-In** system from **Node.js + MongoDB** to **PHP + MySQL**.

---

## 📦 Technology Stack Comparison

| Component | Node.js Stack | PHP Stack |
|-----------|---------------|-----------|
| **Runtime** | Node.js 18+ | PHP 8.1+ |
| **Web Framework** | Express.js | Laravel 10 / Symfony 6 / Plain PHP |
| **Database** | MongoDB (NoSQL) | MySQL 8.0+ / MariaDB 10.6+ |
| **ORM/ODM** | Mongoose | Eloquent (Laravel) / Doctrine (Symfony) / PDO |
| **Authentication** | JWT (jsonwebtoken) | Laravel Sanctum / PHP-JWT / Sessions |
| **Password Hashing** | bcrypt.js | password_hash() / password_verify() |
| **Validation** | express-validator | Laravel Validation / Respect\\Validation |
| **Excel/CSV** | ExcelJS, csv-parser | PhpSpreadsheet |
| **HTTP Client** | Axios | Guzzle |

---

## 🗂️ Step-by-Step Migration Process

### Phase 1: Environment Setup (Day 1)

#### 1.1 Install Required Software

```bash
# Install PHP 8.1+
sudo apt install php8.1 php8.1-cli php8.1-fpm php8.1-mysql php8.1-xml php8.1-curl php8.1-mbstring

# Install MySQL 8.0+
sudo apt install mysql-server

# Install Composer (PHP package manager)
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Install Apache/Nginx
sudo apt install apache2  # or nginx
```

#### 1.2 Set Up MySQL Database

```bash
# Login to MySQL
mysql -u root -p

# Run the schema
mysql -u root -p < doc/php/schema.sql

# Create database user
CREATE USER 'campus_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON campus_checkin.* TO 'campus_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 1.3 Choose PHP Framework (Recommended: Laravel)

```bash
# Option 1: Laravel (Recommended)
composer create-project laravel/laravel campus-checkin-php
cd campus-checkin-php

# Option 2: Plain PHP
mkdir campus-checkin-php
cd campus-checkin-php
composer init

# Option 3: Symfony
composer create-project symfony/skeleton campus-checkin-php
```

---

### Phase 2: Database Migration (Day 2-3)

#### 2.1 MongoDB vs MySQL Data Type Mapping

| MongoDB | MySQL | Notes |
|---------|-------|-------|
| `_id: ObjectId()` | `id INT AUTO_INCREMENT` | Use auto-increment integers |
| `String` | `VARCHAR(255)` or `TEXT` | Use TEXT for long strings |
| `Number` | `INT`, `BIGINT`, `DECIMAL` | Choose based on size |
| `Boolean` | `BOOLEAN` or `TINYINT(1)` | MySQL uses TINYINT(1) |
| `Date` | `TIMESTAMP`, `DATETIME`, `DATE` | TIMESTAMP for auto-updates |
| `Array` | `JSON` or separate table | JSON for simple arrays |
| `Object/Subdocument` | `JSON` or separate table | Normalize for complex objects |
| `Mixed` | `JSON` | JSON column type in MySQL 8+ |

#### 2.2 Schema Conversion Examples

**MongoDB Schema (Mongoose):**
```javascript
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'teacher', 'student'] },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  createdAt: { type: Date, default: Date.now }
});
```

**MySQL Schema (already created in schema.sql):**
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'teacher', 'student') NOT NULL,
    department_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);
```

#### 2.3 Data Migration Script

Create `migrate-data.php`:

```php
<?php
// Connect to MongoDB
$mongoClient = new MongoDB\Driver\Manager("mongodb://localhost:27017");

// Connect to MySQL
$pdo = new PDO('mysql:host=localhost;dbname=campus_checkin', 'campus_user', 'password');

// Migrate users
$query = new MongoDB\Driver\Query([]);
$cursor = $mongoClient->executeQuery('campus_checkin.users', $query);

foreach ($cursor as $doc) {
    $stmt = $pdo->prepare("
        INSERT INTO users (username, email, password_hash, first_name, last_name, role, department_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $doc->username,
        $doc->email,
        $doc->password,  // Already hashed
        $doc->firstName,
        $doc->lastName,
        $doc->role,
        getDepartmentMySQLId($doc->department, $pdo),  // Convert ObjectId to INT
        $doc->createdAt->toDateTime()->format('Y-m-d H:i:s')
    ]);
}

echo "Migration complete!\n";
```

---

### Phase 3: Backend API Conversion (Day 4-7)

#### 3.1 Framework Structure Comparison

**Node.js/Express Structure:**
```
backend/
├── src/
│   ├── app.js
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   └── config/
```

**Laravel Structure:**
```
campus-checkin-php/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   └── Requests/
│   └── Models/
├── routes/
│   ├── api.php
│   └── web.php
├── database/
│   └── migrations/
└── config/
```

#### 3.2 Routing Conversion

**Node.js/Express:**
```javascript
// backend/src/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.getMe);

module.exports = router;
```

**Laravel:**
```php
// routes/api.php
use App\Http\Controllers\AuthController;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'getMe']);
});
```

**Plain PHP:**
```php
// routes.php
$router->post('/api/auth/login', 'AuthController@login');
$router->get('/api/auth/me', 'AuthController@getMe', ['middleware' => 'auth']);
$router->post('/api/auth/logout', 'AuthController@logout', ['middleware' => 'auth']);
```

#### 3.3 Controller Conversion

**Node.js/Express:**
```javascript
// backend/src/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
```

**Laravel:**
```php
<?php
// app/Http/Controllers/AuthController.php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password_hash)) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'firstName' => $user->first_name,
                'lastName' => $user->last_name
            ]
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    public function getMe(Request $request)
    {
        return response()->json(['user' => $request->user()]);
    }
}
```

**Plain PHP:**
```php
<?php
// controllers/AuthController.php
class AuthController
{
    private $db;
    private $jwtSecret;

    public function __construct($db, $config)
    {
        $this->db = $db;
        $this->jwtSecret = $config['jwt_secret'];
    }

    public function login($request)
    {
        $email = $request['email'] ?? '';
        $password = $request['password'] ?? '';

        if (empty($email) || empty($password)) {
            return $this->jsonResponse(['message' => 'Email and password required'], 400);
        }

        $stmt = $this->db->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !password_verify($password, $user['password_hash'])) {
            return $this->jsonResponse(['message' => 'Invalid credentials'], 401);
        }

        $payload = [
            'id' => $user['id'],
            'role' => $user['role'],
            'exp' => time() + (7 * 24 * 60 * 60)  // 7 days
        ];

        $token = JWT::encode($payload, $this->jwtSecret, 'HS256');

        setcookie('token', $token, [
            'expires' => time() + (7 * 24 * 60 * 60),
            'path' => '/',
            'httponly' => true,
            'secure' => true,
            'samesite' => 'Strict'
        ]);

        return $this->jsonResponse([
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role'],
                'firstName' => $user['first_name'],
                'lastName' => $user['last_name']
            ]
        ]);
    }

    private function jsonResponse($data, $status = 200)
    {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
}
```

#### 3.4 Model Conversion

**Node.js/Mongoose:**
```javascript
// backend/src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'principal', 'hod', 'teacher', 'student'],
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
```

**Laravel Eloquent:**
```php
<?php
// app/Models/User.php
namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;

    protected $fillable = [
        'username',
        'email',
        'password_hash',
        'first_name',
        'last_name',
        'role',
        'department_id',
        'is_active'
    ];

    protected $hidden = [
        'password_hash'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Relationships
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'student_id');
    }

    public function classSessions()
    {
        return $this->hasMany(ClassSession::class, 'teacher_id');
    }
}
```

#### 3.5 Middleware Conversion

**Node.js/Express:**
```javascript
// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
```

**Laravel:**
```php
<?php
// app/Http/Middleware/CustomAuth.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use App\Models\User;

class CustomAuth
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->cookie('token');

        if (!$token) {
            return response()->json(['message' => 'Not authenticated'], 401);
        }

        try {
            $decoded = JWT::decode($token, new Key(config('app.jwt_secret'), 'HS256'));
            $user = User::find($decoded->id);

            if (!$user) {
                return response()->json(['message' => 'User not found'], 401);
            }

            $request->merge(['user' => $user]);
            return $next($request);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Invalid token'], 401);
        }
    }
}
```

---

### Phase 4: Authentication System (Day 8-9)

#### 4.1 Password Hashing

**Node.js (bcrypt):**
```javascript
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash(password, 10);
const isMatch = await bcrypt.compare(password, hashedPassword);
```

**PHP:**
```php
// Hash password
$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

// Verify password
$isMatch = password_verify($password, $hashedPassword);
```

#### 4.2 JWT Token Implementation

**Option 1: Using firebase/php-jwt library**

```bash
composer require firebase/php-jwt
```

```php
<?php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Generate token
$payload = [
    'id' => $user['id'],
    'role' => $user['role'],
    'exp' => time() + (7 * 24 * 60 * 60)  // 7 days
];
$token = JWT::encode($payload, $jwtSecret, 'HS256');

// Verify token
$decoded = JWT::decode($token, new Key($jwtSecret, 'HS256'));
```

**Option 2: Using Laravel Sanctum (Recommended for Laravel)**

```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

```php
// Generate token
$token = $user->createToken('auth-token')->plainTextToken;

// Middleware: auth:sanctum
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
```

---

### Phase 5: API Endpoints Migration (Day 10-14)

#### 5.1 Endpoint Mapping Table

| Node.js Endpoint | PHP Endpoint | Method | Controller |
|------------------|--------------|--------|------------|
| `/api/auth/login` | `/api/auth/login` | POST | AuthController@login |
| `/api/auth/logout` | `/api/auth/logout` | POST | AuthController@logout |
| `/api/users` | `/api/users` | GET | UserController@index |
| `/api/users/:id` | `/api/users/{id}` | GET | UserController@show |
| `/api/attendance/mark` | `/api/attendance/mark` | POST | AttendanceController@mark |
| `/api/reports/attendance` | `/api/reports/attendance` | GET | ReportController@attendance |

#### 5.2 Query Conversion Examples

**MongoDB (Mongoose):**
```javascript
// Find users by role
const users = await User.find({ role: 'student', isActive: true })
  .populate('department')
  .select('firstName lastName email')
  .limit(10);

// Aggregate attendance
const stats = await Attendance.aggregate([
  { $match: { student: studentId } },
  { $group: {
      _id: '$subject',
      total: { $sum: 1 },
      present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
    }
  }
]);
```

**MySQL (Laravel Eloquent):**
```php
// Find users by role
$users = User::where('role', 'student')
    ->where('is_active', true)
    ->with('department')
    ->select('first_name', 'last_name', 'email')
    ->limit(10)
    ->get();

// Aggregate attendance
$stats = DB::table('attendance')
    ->where('student_id', $studentId)
    ->join('subjects', 'attendance.subject_id', '=', 'subjects.id')
    ->select(
        'subjects.name as subject_name',
        DB::raw('COUNT(*) as total'),
        DB::raw('SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END) as present')
    )
    ->groupBy('subject_id')
    ->get();
```

**MySQL (Plain PHP/PDO):**
```php
// Find users by role
$stmt = $pdo->prepare("
    SELECT u.first_name, u.last_name, u.email, d.name as department_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.role = ? AND u.is_active = 1
    LIMIT 10
");
$stmt->execute(['student']);
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Aggregate attendance
$stmt = $pdo->prepare("
    SELECT 
        s.name AS subject_name,
        COUNT(*) AS total,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present
    FROM attendance a
    INNER JOIN subjects s ON a.subject_id = s.id
    WHERE a.student_id = ?
    GROUP BY s.id
");
$stmt->execute([$studentId]);
$stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
```

---

### Phase 6: File Upload & Export (Day 15-16)

#### 6.1 File Upload Conversion

**Node.js (Multer):**
```javascript
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  // Process file
});
```

**PHP:**
```php
// Plain PHP
if ($_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $tmpName = $_FILES['file']['tmp_name'];
    $name = $_FILES['file']['name'];
    move_uploaded_file($tmpName, "uploads/$name");
}

// Laravel
$path = $request->file('file')->store('uploads');
```

#### 6.2 Excel Export Conversion

**Node.js (ExcelJS):**
```javascript
const ExcelJS = require('exceljs');
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Attendance');

worksheet.addRow(['Name', 'Email', 'Status']);
users.forEach(user => {
  worksheet.addRow([user.name, user.email, user.status]);
});

await workbook.xlsx.writeFile('attendance.xlsx');
```

**PHP (PhpSpreadsheet):**
```bash
composer require phpoffice/phpspreadsheet
```

```php
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

$spreadsheet = new Spreadsheet();
$sheet = $spreadsheet->getActiveSheet();

$sheet->setCellValue('A1', 'Name');
$sheet->setCellValue('B1', 'Email');
$sheet->setCellValue('C1', 'Status');

$row = 2;
foreach ($users as $user) {
    $sheet->setCellValue("A$row", $user['name']);
    $sheet->setCellValue("B$row", $user['email']);
    $sheet->setCellValue("C$row", $user['status']);
    $row++;
}

$writer = new Xlsx($spreadsheet);
$writer->save('attendance.xlsx');
```

---

### Phase 7: Testing & Deployment (Day 17-20)

#### 7.1 Unit Testing

**Node.js (Jest):**
```javascript
const request = require('supertest');
const app = require('../src/app');

describe('Auth API', () => {
  test('POST /auth/login - success', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'admin123' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('user');
  });
});
```

**PHP (PHPUnit):**
```php
<?php
use PHPUnit\Framework\TestCase;

class AuthTest extends TestCase
{
    public function testLoginSuccess()
    {
        $response = $this->post('/api/auth/login', [
            'email' => 'admin@test.com',
            'password' => 'admin123'
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['user']);
    }
}
```

#### 7.2 Deployment

**Apache Configuration:**
```apache
<VirtualHost *:80>
    ServerName campus-checkin.local
    DocumentRoot /var/www/campus-checkin-php/public

    <Directory /var/www/campus-checkin-php/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name campus-checkin.local;
    root /var/www/campus-checkin-php/public;

    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

---

## 📚 Key Differences Summary

| Feature | Node.js/MongoDB | PHP/MySQL |
|---------|-----------------|-----------|
| **Async/Await** | Built-in (async/await) | Not native (sequential) |
| **ORM Queries** | Mongoose (chainable) | Eloquent (chainable) or raw SQL |
| **Foreign Keys** | No enforcement | Enforced by database |
| **Joins** | Populate/Aggregate | Native SQL JOINs |
| **Transactions** | MongoDB sessions | BEGIN/COMMIT/ROLLBACK |
| **Schema** | Flexible (NoSQL) | Strict (SQL) |
| **Data Types** | Loose typing | Strong typing |
| **Arrays** | Native support | JSON column or separate table |

---

## ⚠️ Common Pitfalls

1. **ObjectId vs Integer IDs**: Convert all `ObjectId` references to integer foreign keys
2. **Embedded Documents**: Normalize into separate tables or use JSON columns
3. **Array Fields**: Use JSON columns or create junction tables
4. **Async/Await**: PHP doesn't have native async; use sequential code
5. **Middleware Order**: Ensure middleware runs in correct order
6. **CORS**: Configure properly for frontend-backend communication
7. **Sessions**: Use database sessions for horizontal scaling

---

## 🎯 Testing Checklist

- [ ] All API endpoints return correct responses
- [ ] Authentication (login/logout) works
- [ ] Authorization (role-based access) enforced
- [ ] Database relationships intact
- [ ] File uploads functional
- [ ] Excel/CSV exports working
- [ ] Password reset functional
- [ ] Performance acceptable (< 500ms per request)
- [ ] Security headers configured
- [ ] SQL injection protected (use prepared statements)
- [ ] XSS protection enabled

---

**Version:** 1.0  
**Last Updated:** December 9, 2025
