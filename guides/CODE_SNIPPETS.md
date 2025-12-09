# CSS & Tailwind Quick Reference

## 🎨 Ready-to-Use Code Snippets

This document provides copy-paste ready code snippets for implementing responsive designs, animations, and common patterns across the Campus Check-In application.

---

## 📐 Responsive Layouts

### Two-Column Card Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
  <Card className="card-hover animate-fade-up">
    <CardContent>Left Column</CardContent>
  </Card>
  <Card className="card-hover animate-fade-up delay-100">
    <CardContent>Right Column</CardContent>
  </Card>
</div>
```

### Three-Column Dashboard Stats
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
  {stats.map((stat, index) => (
    <Card 
      key={stat.id}
      className="card-hover animate-fade-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <CardContent className="p-6">
        <h3 className="text-sm text-muted-foreground">{stat.label}</h3>
        <p className="text-2xl sm:text-3xl font-bold mt-2">{stat.value}</p>
      </CardContent>
    </Card>
  ))}
</div>
```

### Responsive Container
```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content auto-centers and has responsive padding */}
</div>
```

---

## 🎭 Animations

### Staggered List Items
```tsx
<div className="space-y-4">
  {items.map((item, index) => (
    <div 
      key={item.id}
      className="animate-fade-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {item.content}
    </div>
  ))}
</div>
```

### Card with Hover Effect
```tsx
<Card className="card-hover transition-all-smooth cursor-pointer">
  <CardContent>
    Hover me for lift effect
  </CardContent>
</Card>
```

### Modal with Smooth Entry
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="modal-content w-[95vw] sm:w-full max-w-2xl">
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
    </DialogHeader>
    <div className="animate-fade-up">
      Modal content
    </div>
  </DialogContent>
</Dialog>
```

### Fade-In Page Content
```tsx
function MyPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-responsive-2xl font-bold">Page Title</h1>
        <Card className="animate-fade-up delay-100">
          <CardContent>Content</CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
```

---

## 🎨 Common Component Patterns

### Info Card with Icon
```tsx
<div className="flex items-start gap-3 sm:gap-4 transition-all-smooth hover:translate-x-1">
  <div className="p-2 sm:p-3 rounded-lg bg-blue-500/10 flex-shrink-0">
    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
  </div>
  <div className="min-w-0 flex-1">
    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
      Email Address
    </p>
    <p className="text-sm sm:text-base font-medium text-foreground break-all">
      user@example.com
    </p>
  </div>
</div>
```

### Stat Card with Badge
```tsx
<Card className="card-hover">
  <CardContent className="p-4 sm:p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs sm:text-sm text-muted-foreground">Total Students</p>
        <p className="text-2xl sm:text-3xl font-bold mt-1">1,234</p>
      </div>
      <div className="p-3 rounded-full bg-blue-500/10">
        <Users className="h-6 w-6 text-blue-600" />
      </div>
    </div>
    <Badge className="mt-3 bg-green-100 text-green-800">
      +12% this month
    </Badge>
  </CardContent>
</Card>
```

### Responsive Avatar with Info
```tsx
<div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
  <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-background shadow-medium">
    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold">
      AB
    </AvatarFallback>
  </Avatar>
  <div className="text-center sm:text-left">
    <h2 className="text-xl sm:text-2xl font-bold">User Name</h2>
    <p className="text-sm sm:text-base text-muted-foreground">user@example.com</p>
    <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
      <Badge>Student</Badge>
      <Badge variant="secondary">Computer Science</Badge>
    </div>
  </div>
</div>
```

---

## 📱 Mobile-First Typography

### Heading Sizes
```tsx
{/* Extra Large - Page Titles */}
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
  Main Page Title
</h1>

{/* Large - Section Titles */}
<h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold">
  Section Title
</h2>

{/* Medium - Card Titles */}
<h3 className="text-lg sm:text-xl font-medium">
  Card Title
</h3>

{/* Small - Labels */}
<p className="text-sm sm:text-base text-muted-foreground">
  Label Text
</p>

{/* Extra Small - Meta Info */}
<span className="text-xs uppercase tracking-wide text-muted-foreground">
  Meta Info
</span>
```

---

## 🎨 Color & Badge System

### Role Badges
```tsx
const roleBadgeStyles = {
  student: 'bg-blue-100 text-blue-800',
  teacher: 'bg-cyan-100 text-cyan-800',
  hod: 'bg-indigo-100 text-indigo-800',
  admin: 'bg-slate-100 text-slate-800',
  principal: 'bg-sky-100 text-sky-800',
};

<Badge className={cn('capitalize', roleBadgeStyles[user.role])}>
  {user.role}
</Badge>
```

### Status Badges
```tsx
const statusStyles = {
  present: 'bg-green-100 text-green-800',
  absent: 'bg-red-100 text-red-800',
  late: 'bg-yellow-100 text-yellow-800',
  leave: 'bg-blue-100 text-blue-800',
};

<Badge className={statusStyles[attendance.status]}>
  {attendance.status}
</Badge>
```

### Icon Color Backgrounds
```tsx
{/* Success/Present */}
<div className="p-3 rounded-lg bg-emerald-500/10">
  <CheckCircle className="h-5 w-5 text-emerald-600" />
</div>

{/* Warning/Late */}
<div className="p-3 rounded-lg bg-amber-500/10">
  <Clock className="h-5 w-5 text-amber-600" />
</div>

{/* Error/Absent */}
<div className="p-3 rounded-lg bg-rose-500/10">
  <XCircle className="h-5 w-5 text-rose-600" />
</div>

{/* Info/General */}
<div className="p-3 rounded-lg bg-blue-500/10">
  <Info className="h-5 w-5 text-blue-600" />
</div>
```

---

## 🔘 Buttons & Forms

### Primary Action Button
```tsx
<Button 
  size="lg" 
  className="w-full sm:w-auto card-hover bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
>
  <Sparkles className="h-4 w-4 mr-2" />
  Primary Action
</Button>
```

### Form Input with Label
```tsx
<div className="space-y-2">
  <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
    Email Address
  </Label>
  <Input
    id="email"
    type="email"
    placeholder="user@example.com"
    className="h-11 focus-ring"
  />
  <p className="text-xs text-muted-foreground">
    We'll never share your email.
  </p>
</div>
```

### Responsive Form Grid
```tsx
<form className="space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label htmlFor="firstName">First Name</Label>
      <Input id="firstName" required />
    </div>
    <div className="space-y-2">
      <Label htmlFor="lastName">Last Name</Label>
      <Input id="lastName" required />
    </div>
  </div>
  
  <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
    <Button type="button" variant="outline" className="w-full sm:w-auto">
      Cancel
    </Button>
    <Button type="submit" className="w-full sm:w-auto">
      Save Changes
    </Button>
  </div>
</form>
```

---

## 📊 Data Tables (Responsive)

### Mobile Card View / Desktop Table
```tsx
function ResponsiveTable({ data }) {
  return (
    <>
      {/* Mobile: Card View */}
      <div className="block md:hidden space-y-4">
        {data.map((item, index) => (
          <Card 
            key={item.id}
            className="animate-fade-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Name</span>
                  <span className="font-medium">{item.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <Badge>{item.status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Desktop: Table View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell><Badge>{item.status}</Badge></TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost">Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
```

---

## 🎯 Focus & Accessibility

### Keyboard-Friendly Link
```tsx
<a 
  href="/profile"
  className="focus-ring rounded-md inline-flex items-center gap-2 px-4 py-2 transition-all-smooth hover:translate-x-1"
>
  <User className="h-4 w-4" />
  View Profile
</a>
```

### Accessible Icon Button
```tsx
<button
  aria-label="Close modal"
  onClick={handleClose}
  className="focus-ring rounded-md p-2 hover:bg-muted transition-smooth"
>
  <X className="h-5 w-5" />
</button>
```

### Skip to Content Link
```tsx
<a 
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md"
>
  Skip to main content
</a>

<main id="main-content">
  {/* Page content */}
</main>
```

---

## 💡 Utility Class Combinations

### Common Patterns

**Card with hover and animation:**
```tsx
className="card-hover animate-fade-up shadow-soft"
```

**Responsive spacing:**
```tsx
className="p-4 sm:p-6 lg:p-8"
className="space-y-4 sm:space-y-6"
className="gap-4 md:gap-6 lg:gap-8"
```

**Responsive text:**
```tsx
className="text-sm sm:text-base lg:text-lg"
className="text-responsive-lg" // Predefined utility
```

**Flex responsive:**
```tsx
className="flex flex-col sm:flex-row items-center sm:items-start gap-4"
```

**Hidden on mobile, visible on desktop:**
```tsx
className="hidden lg:block"
```

**Visible on mobile, hidden on desktop:**
```tsx
className="block lg:hidden"
```

---

## 🌈 Gradient Backgrounds

### Header Gradients
```tsx
{/* Blue to Purple */}
<div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">

{/* Professional Blue */}
<div className="bg-gradient-to-br from-blue-600 to-cyan-500">

{/* Success Green */}
<div className="bg-gradient-to-r from-emerald-500 to-teal-600">

{/* Warning Amber */}
<div className="bg-gradient-to-r from-amber-500 to-orange-600">
```

### Button Gradients
```tsx
<Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
  Gradient Button
</Button>
```

---

## 📝 Complete Page Template

```tsx
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function MyPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              Page Title
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Page description
            </p>
          </div>
          <Button size="lg" className="w-full sm:w-auto card-hover">
            Primary Action
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <Card 
              key={stat.id}
              className="card-hover animate-fade-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Card className="animate-fade-up delay-400">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold mb-4">Section Title</h2>
            {/* Content here */}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
```

---

## 🔧 Custom CSS Variables Usage

```css
/* In your component or CSS file */
.my-custom-card {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-soft);
  transition: all var(--dur-fast) var(--ease-smooth);
}

.my-custom-card:hover {
  box-shadow: var(--shadow-medium);
  transform: translateY(-4px);
}

.my-custom-card:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: var(--focus-offset);
  box-shadow: var(--focus-ring);
}
```

---

## 📚 Import Statements

```tsx
// Layout
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Icons (Lucide React)
import { 
  User, Mail, Phone, Building, Calendar, 
  Edit, Save, X, Check, ChevronRight 
} from 'lucide-react';

// Utils
import { cn } from '@/lib/utils';
```

---

**Quick Tip:** Save this file for easy reference when building new pages. All snippets are production-ready and follow best practices for responsive design and accessibility.
