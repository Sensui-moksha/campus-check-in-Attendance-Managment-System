# Node.js Modules Used in Campus Check-In System

## 📦 Complete Dependency List

This document lists all Node.js packages (npm modules) used in the Campus Check-In system, organized by category with PHP equivalents where applicable.

---

## 🎯 Backend Dependencies (Node.js/Express)

### Core Framework & Server

| Package | Version | Purpose | PHP Equivalent |
|---------|---------|---------|----------------|
| **express** | ^4.18.2 | Web framework for building REST APIs | Laravel, Symfony, Slim |
| **dotenv** | ^16.3.1 | Load environment variables from .env file | `getenv()` or `vlucas/phpdotenv` |
| **nodemon** | ^3.0.1 | Auto-restart server on file changes (dev) | N/A (dev only) |

### Database & ORM

| Package | Version | Purpose | PHP Equivalent |
|---------|---------|---------|----------------|
| **mongoose** | ^7.6.3 | MongoDB ODM (Object Document Mapper) | Eloquent (Laravel), Doctrine |
| **mongodb-memory-server** | ^9.1.6 | In-memory MongoDB for testing | SQLite in-memory |

### Authentication & Security

| Package | Version | Purpose | PHP Equivalent |
|---------|---------|---------|----------------|
| **bcrypt** | ^5.1.1 | Password hashing (bcrypt algorithm) | `password_hash()`, `password_verify()` |
| **jsonwebtoken** | ^9.0.0 | Generate & verify JWT tokens | `firebase/php-jwt` |
| **cookie-parser** | ^1.4.6 | Parse cookies from HTTP requests | `$_COOKIE` (native) |
| **cors** | ^2.8.5 | Enable CORS (Cross-Origin Resource Sharing) | `header()` with CORS headers |

### Validation & Data Processing

| Package | Version | Purpose | PHP Equivalent |
|---------|---------|---------|----------------|
| **express-validator** | ^7.0.0 | Request validation middleware | Laravel Validation, Respect\\Validation |
| **csv-parser** | ^3.0.0 | Parse CSV files | `fgetcsv()`, `league/csv` |
| **csv-writer** | ^1.6.0 | Generate CSV files | `fputcsv()`, `league/csv` |
| **json2csv** | ^5.0.7 | Convert JSON to CSV | Custom function or `league/csv` |

### File Handling

| Package | Version | Purpose | PHP Equivalent |
|---------|---------|---------|----------------|
| **multer** | ^1.4.5-lts.1 | Handle multipart/form-data file uploads | `$_FILES`, `move_uploaded_file()` |
| **exceljs** | ^4.3.0 | Read/write Excel files (.xlsx) | `phpoffice/phpspreadsheet` |
| **pdfkit** | ^0.13.0 | Generate PDF documents | `dompdf/dompdf`, `mpdf/mpdf` |
| **adm-zip** | ^0.5.16 | Create and extract ZIP archives | `ZipArchive` class |
| **stream-buffers** | ^3.0.2 | Buffer streams in memory | `php://memory` |

### Scheduling & Automation

| Package | Version | Purpose | PHP Equivalent |
|---------|---------|---------|----------------|
| **node-cron** | ^4.2.1 | Schedule tasks (cron jobs) | `cron` (Linux) or Laravel Scheduler |

### Testing

| Package | Version | Purpose | PHP Equivalent |
|---------|---------|---------|----------------|
| **jest** | ^29.7.0 | JavaScript testing framework | PHPUnit |
| **supertest** | ^6.3.3 | HTTP assertion library for testing APIs | Guzzle + PHPUnit |

---

## 🎨 Frontend Dependencies (React/TypeScript)

### Core Framework

| Package | Version | Purpose | Replacement in PHP |
|---------|---------|---------|-------------------|
| **react** | ^18.2.0 | UI library | Blade (Laravel), Twig (Symfony), Plain PHP |
| **react-dom** | ^18.2.0 | React DOM renderer | N/A |
| **react-router-dom** | ^6.x | Client-side routing | Server-side routing in PHP |
| **typescript** | ^5.x | Static typing for JavaScript | PHP 8+ type declarations |
| **vite** | ^5.x | Build tool & dev server | Webpack, Laravel Mix |

### UI Components (shadcn/ui + Radix UI)

| Package | Version | Purpose | PHP Alternative |
|---------|---------|---------|-----------------|
| **@radix-ui/react-dialog** | ^1.1.14 | Modal dialogs | Bootstrap Modal, custom modals |
| **@radix-ui/react-dropdown-menu** | ^2.1.15 | Dropdown menus | Bootstrap Dropdown |
| **@radix-ui/react-select** | ^2.2.5 | Select dropdowns | HTML `<select>` + JS |
| **@radix-ui/react-tabs** | ^1.1.12 | Tab components | Bootstrap Tabs |
| **@radix-ui/react-toast** | ^1.2.14 | Toast notifications | Toastr.js, SweetAlert2 |
| **@radix-ui/react-avatar** | ^1.1.10 | Avatar components | Custom HTML/CSS |
| **@radix-ui/react-checkbox** | ^1.3.2 | Checkbox inputs | HTML `<input type="checkbox">` |
| **@radix-ui/react-label** | ^2.1.7 | Form labels | HTML `<label>` |
| **@radix-ui/react-progress** | ^1.1.7 | Progress bars | Bootstrap Progress |
| **@radix-ui/react-slider** | ^1.3.5 | Range sliders | HTML `<input type="range">` |
| **@radix-ui/react-switch** | ^1.2.5 | Toggle switches | Custom CSS switches |
| **@radix-ui/react-tooltip** | ^1.2.7 | Tooltips | Bootstrap Tooltip |
| **@radix-ui/react-accordion** | ^1.2.11 | Accordion components | Bootstrap Collapse |
| **@radix-ui/react-alert-dialog** | ^1.1.14 | Alert dialogs | `window.confirm()` |
| **@radix-ui/react-popover** | ^1.1.14 | Popover components | Bootstrap Popover |
| **@radix-ui/react-scroll-area** | ^1.2.9 | Custom scrollbars | CSS `overflow: auto` |
| **@radix-ui/react-separator** | ^1.1.7 | Divider lines | HTML `<hr>` |

### Form Handling

| Package | Version | Purpose | PHP Alternative |
|---------|---------|---------|-----------------|
| **react-hook-form** | ^7.x | Form state management | Server-side form handling |
| **@hookform/resolvers** | ^3.10.0 | Validation resolver for react-hook-form | Laravel Validation |
| **zod** | ^3.x | Schema validation | Laravel Validation, Respect\\Validation |

### Data Fetching

| Package | Version | Purpose | PHP Alternative |
|---------|---------|---------|-----------------|
| **axios** | ^1.6.0 | HTTP client for API calls | Guzzle, `file_get_contents()` |
| **@tanstack/react-query** | ^5.83.0 | Server state management | N/A (server-side rendering) |

### Styling

| Package | Version | Purpose | PHP Alternative |
|---------|---------|---------|-----------------|
| **tailwindcss** | ^3.x | Utility-first CSS framework | Bootstrap, custom CSS |
| **class-variance-authority** | ^0.7.1 | Dynamic class names | Custom PHP functions |
| **clsx** | ^2.1.1 | Conditional class names | String concatenation |
| **tailwind-merge** | ^2.x | Merge Tailwind classes | N/A |
| **tailwindcss-animate** | ^1.x | Animation utilities | CSS animations |

### Icons & UI

| Package | Version | Purpose | PHP Alternative |
|---------|---------|---------|-----------------|
| **lucide-react** | ^0.x | Icon library | Font Awesome, Material Icons |
| **embla-carousel-react** | ^8.6.0 | Carousel/slider component | Swiper.js, Bootstrap Carousel |
| **cmdk** | ^1.1.1 | Command palette (⌘K menu) | Custom search UI |
| **date-fns** | ^3.6.0 | Date manipulation | PHP DateTime, Carbon |
| **recharts** | ^2.x | Charts and graphs | Chart.js, ApexCharts |

### Utilities

| Package | Version | Purpose | PHP Alternative |
|---------|---------|---------|-----------------|
| **sonner** | ^1.x | Toast notifications | Toastr.js |
| **vaul** | ^0.x | Drawer components | Custom modals |
| **input-otp** | ^1.x | OTP input component | Custom input fields |

---

## 📊 Installation Commands

### Backend (Node.js)
```bash
cd backend
npm install express mongoose bcrypt jsonwebtoken dotenv cors cookie-parser
npm install express-validator multer exceljs csv-parser csv-writer pdfkit
npm install node-cron adm-zip json2csv stream-buffers
npm install --save-dev nodemon jest supertest mongodb-memory-server
```

### Frontend (React)
```bash
npm install react react-dom react-router-dom axios
npm install @tanstack/react-query react-hook-form @hookform/resolvers zod
npm install tailwindcss class-variance-authority clsx tailwind-merge
npm install lucide-react date-fns recharts embla-carousel-react
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-toast
# ... (see package.json for complete list)
```

---

## 🔄 PHP Equivalents Summary

### Must-Have PHP Packages for Migration

```bash
# Install Composer (PHP package manager)
composer require laravel/framework  # If using Laravel

# Core packages
composer require firebase/php-jwt              # JWT authentication
composer require phpoffice/phpspreadsheet      # Excel files
composer require dompdf/dompdf                 # PDF generation
composer require league/csv                     # CSV parsing
composer require guzzlehttp/guzzle             # HTTP client
composer require vlucas/phpdotenv              # Environment variables
composer require respect/validation            # Input validation

# Laravel-specific
composer require laravel/sanctum               # API authentication
composer require spatie/laravel-permission     # Role-based permissions
```

### Native PHP Alternatives (No Package Required)

- **Password hashing:** `password_hash()`, `password_verify()`
- **JSON handling:** `json_encode()`, `json_decode()`
- **File uploads:** `$_FILES`, `move_uploaded_file()`
- **CSV parsing:** `fgetcsv()`, `fputcsv()`
- **Database (MySQL):** `PDO`, `mysqli`
- **Sessions:** `$_SESSION`
- **Cookies:** `$_COOKIE`, `setcookie()`
- **HTTP headers:** `header()`
- **URL routing:** `.htaccess` (Apache) or `nginx.conf` (Nginx)

---

## 📝 Migration Notes

### Key Differences

1. **Async/Await (Node.js) vs Sequential (PHP)**
   - Node.js: `await fetch()`, `async function`
   - PHP: Sequential execution, no native async

2. **Package Managers**
   - Node.js: npm, yarn, pnpm
   - PHP: Composer

3. **Dependency Files**
   - Node.js: `package.json`, `package-lock.json`, `node_modules/`
   - PHP: `composer.json`, `composer.lock`, `vendor/`

4. **Module System**
   - Node.js: `require()`, `import/export`
   - PHP: `require`, `include`, `use` (namespaces)

5. **Environment Variables**
   - Node.js: `process.env.VAR_NAME`
   - PHP: `$_ENV['VAR_NAME']` or `getenv('VAR_NAME')`

---

## 🎯 Minimal PHP Stack (Without Framework)

For a lightweight PHP migration without Laravel/Symfony:

```bash
composer require firebase/php-jwt              # JWT tokens
composer require phpoffice/phpspreadsheet      # Excel files
composer require vlucas/phpdotenv              # .env support
```

Everything else can be done with native PHP:
- PDO for database
- `password_hash()` for bcrypt
- `$_FILES` for uploads
- Native sessions

---

## 📚 Documentation Links

### Node.js Packages
- [Express.js](https://expressjs.com/)
- [Mongoose](https://mongoosejs.com/)
- [JWT](https://github.com/auth0/node-jsonwebtoken)
- [Multer](https://github.com/expressjs/multer)
- [ExcelJS](https://github.com/exceljs/exceljs)

### PHP Packages
- [Laravel](https://laravel.com/docs)
- [PHP-JWT](https://github.com/firebase/php-jwt)
- [PhpSpreadsheet](https://phpspreadsheet.readthedocs.io/)
- [DomPDF](https://github.com/dompdf/dompdf)
- [League CSV](https://csv.thephpleague.com/)

---

**Version:** 1.0  
**Last Updated:** December 9, 2025
