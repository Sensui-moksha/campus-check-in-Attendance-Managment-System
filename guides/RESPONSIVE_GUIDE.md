# 📱 Responsive Design Visual Guide

## Device & Breakpoint Reference

This guide provides visual reference for how the application adapts across different screen sizes.

---

## 📐 Breakpoint System

### Standard Breakpoints

```
┌─────────────────────────────────────────────────────────────────┐
│ Breakpoint │ Width Range    │ Device Type          │ Tailwind   │
├────────────┼────────────────┼──────────────────────┼────────────┤
│ xs         │ 375px+         │ Phone (portrait)     │ xs:...     │
│ sm         │ 640px+         │ Phone (landscape)    │ sm:...     │
│ md         │ 768px+         │ Tablet (portrait)    │ md:...     │
│ tablet     │ 820px+         │ iPad specific        │ tablet:... │
│ lg         │ 1024px+        │ Desktop              │ lg:...     │
│ xl         │ 1280px+        │ Large Desktop        │ xl:...     │
│ 2xl        │ 1440px+        │ Extra Large          │ 2xl:...    │
│ 3xl        │ 1600px+        │ Ultra Wide           │ 3xl:...    │
└────────────┴────────────────┴──────────────────────┴────────────┘
```

---

## 📱 Profile Page Layouts

### Mobile Portrait (320px - 640px)
```
┌─────────────────────────┐
│                         │
│  ╔═════════════════╗    │
│  ║   Cover Image   ║    │
│  ╚═════════════════╝    │
│          ┌───┐          │
│          │ A │          │ ← Avatar (24×24, 96px)
│          └───┘          │
│      User Name          │
│   user@example.com      │
│   [Badge] [Badge]       │
│                         │
│  ┌───────────────────┐  │
│  │  Edit Profile     │  │ ← Full width button
│  └───────────────────┘  │
│                         │
│  ╔═════════════════════╗│
│  ║ Personal Info       ║│
│  ║ ┌────────────────┐  ║│
│  ║ │ 📧 Email       │  ║│ ← Single column cards
│  ║ └────────────────┘  ║│
│  ║ ┌────────────────┐  ║│
│  ║ │ 🎓 Department  │  ║│
│  ║ └────────────────┘  ║│
│  ╚═════════════════════╝│
│                         │
└─────────────────────────┘
```

### Tablet (768px - 1023px)
```
┌───────────────────────────────────────────────┐
│                                               │
│  ╔═══════════════════════════════════════╗   │
│  ║         Cover Image                   ║   │
│  ╚═══════════════════════════════════════╝   │
│    ┌────┐                                    │
│    │ AB │  User Name          [Edit Profile] │ ← Avatar (28×28, 112px)
│    └────┘  user@example.com                  │
│            [Badge] [Badge]                    │
│                                               │
│  ╔══════════════════╗ ╔══════════════════╗   │
│  ║ Personal Info    ║ ║ Academic Details ║   │ ← Two column grid
│  ║ ┌──────────────┐ ║ ║ ┌──────────────┐ ║   │
│  ║ │ 📧 Email     │ ║ ║ │ 🏢 Dept      │ ║   │
│  ║ └──────────────┘ ║ ║ └──────────────┘ ║   │
│  ║ ┌──────────────┐ ║ ║ ┌──────────────┐ ║   │
│  ║ │ 📱 Phone     │ ║ ║ │ 🎓 Year      │ ║   │
│  ║ └──────────────┘ ║ ║ └──────────────┘ ║   │
│  ╚══════════════════╝ ╚══════════════════╝   │
│                                               │
└───────────────────────────────────────────────┘
```

### Desktop (1024px+)
```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ╔═══════════════════════════════════════════════════════════════╗ │
│  ║                    Cover Image (192px height)                 ║ │
│  ╚═══════════════════════════════════════════════════════════════╝ │
│     ┌─────┐                                                         │
│     │ AB  │  User Name                           [Edit Profile]    │ ← Avatar (32×32, 128px)
│     │     │  user@example.com                                      │
│     └─────┘  [Badge] [Badge] [Badge]                               │
│                                                                     │
│  ╔══════════════════════════════╗ ╔══════════════════════════════╗│
│  ║ Personal Information         ║ ║ Academic Details             ║│
│  ║                              ║ ║                              ║│
│  ║ ┌──────────────────────────┐ ║ ║ ┌──────────────────────────┐║│
│  ║ │ 👤 AB                    │ ║ ║ │ 🏢 Computer Science      │║│
│  ║ │    Full Name             │ ║ ║ │    Department            │║│
│  ║ │    John Doe              │ ║ ║ │    CS                    │║│
│  ║ └──────────────────────────┘ ║ ║ └──────────────────────────┘║│
│  ║                              ║ ║                              ║│
│  ║ ┌──────────────────────────┐ ║ ║ ┌──────────────────────────┐║│
│  ║ │ 📧 john@example.com      │ ║ ║ │ 🎓 Year 3                │║│
│  ║ └──────────────────────────┘ ║ ║ └──────────────────────────┘║│
│  ║                              ║ ║                              ║│
│  ║ ┌──────────────────────────┐ ║ ║ ┌──────────────────────────┐║│
│  ║ │ 🔢 CS2021001             │ ║ ║ │ 📅 Semester 5            │║│
│  ║ └──────────────────────────┘ ║ ║ └──────────────────────────┘║│
│  ║                              ║ ║                              ║│
│  ╚══════════════════════════════╝ ╚══════════════════════════════╝│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Dashboard Layout Behavior

### Mobile (<1024px)
```
┌─────────────────────────────┐
│ ☰  Campus Check-In      👤  │ ← Header (fixed)
├─────────────────────────────┤
│                             │
│                             │
│    Main Content Area        │
│    (Scrollable)             │
│                             │
│                             │
│                             │
│                             │
│                             │
├─────────────────────────────┤
│ 🏠  📚  📊  📝  ⚙️          │ ← Bottom Nav (students only)
└─────────────────────────────┘
```

**Sidebar Access:** Tap ☰ to open drawer overlay

---

### Desktop (≥1024px)
```
┌────────┬──────────────────────────────────────────────────┐
│        │ Campus Check-In                             👤   │ ← Header
├────────┼──────────────────────────────────────────────────┤
│        │                                                  │
│  📊   │                                                  │
│ Dash  │                                                  │
│        │                                                  │
│  📝   │          Main Content Area                       │
│ Mark  │          (Scrollable independently)              │
│        │                                                  │
│  📚   │                                                  │
│ Tmt   │                                                  │
│        │                                                  │
│  ⚙️   │                                                  │
│ Set   │                                                  │
│        │                                                  │
└────────┴──────────────────────────────────────────────────┘
  ↑ Sidebar (sticky, does not scroll)
```

**Key Behaviors:**
- Sidebar: Sticky positioning, remains visible
- Content: Scrolls independently in its own container
- Collapse: Click hamburger to hide sidebar, content expands

---

## 📊 Grid Layouts

### Stats Cards

**Mobile (< 640px):**
```
┌──────────────┐
│  Card 1      │
├──────────────┤
│  Card 2      │
├──────────────┤
│  Card 3      │
├──────────────┤
│  Card 4      │
└──────────────┘
  1 column
```

**Tablet (640px - 1024px):**
```
┌──────────────┬──────────────┐
│  Card 1      │  Card 2      │
├──────────────┼──────────────┤
│  Card 3      │  Card 4      │
└──────────────┴──────────────┘
  2 columns
```

**Desktop (≥1024px):**
```
┌─────────┬─────────┬─────────┬─────────┐
│ Card 1  │ Card 2  │ Card 3  │ Card 4  │
└─────────┴─────────┴─────────┴─────────┘
  4 columns
```

---

## 🎭 Animation States

### Card Hover Effect
```
Normal State:
┌─────────────────┐
│                 │  transform: translateY(0)
│   Card Content  │  box-shadow: soft
│                 │
└─────────────────┘

Hover State:
  ┌─────────────────┐
  │                 │  transform: translateY(-4px)
  │   Card Content  │  box-shadow: medium
  │                 │  transition: 160ms smooth
  └─────────────────┘
    └── Lifted 4px ──┘
```

### Modal Animation
```
Step 1: Overlay Fade In (250ms)
  Background: transparent → rgba(0,0,0,0.4)

Step 2: Content Scale In (280ms)
  ┌─────────┐           ┌─────────────┐
  │  95%    │    →      │    100%     │
  └─────────┘           └─────────────┘
  opacity: 0 → 1        transform: scale(0.95 → 1)
```

---

## 📏 Spacing Reference

### Padding Scale
```
Mobile    Tablet    Desktop
───────   ───────   ───────
p-4       p-6       p-8
(16px)    (24px)    (32px)

Example:
<div className="p-4 sm:p-6 lg:p-8">
```

### Gap Scale
```
Mobile    Tablet    Desktop
───────   ───────   ───────
gap-4     gap-6     gap-8
(16px)    (24px)    (32px)

Example:
<div className="grid gap-4 md:gap-6 lg:gap-8">
```

---

## 🎯 Typography Scaling

### Heading Levels
```
Element   Mobile    Tablet    Desktop
──────────────────────────────────────
H1        2xl       3xl       4xl
          (24px)    (30px)    (36px)

H2        xl        2xl       3xl
          (20px)    (24px)    (30px)

H3        lg        xl        2xl
          (18px)    (20px)    (24px)

Body      sm        base      base
          (14px)    (16px)    (16px)

Small     xs        sm        sm
          (12px)    (14px)    (14px)
```

### Usage Example
```tsx
<h1 className="text-2xl sm:text-3xl lg:text-4xl">
  Scales from 24px → 30px → 36px
</h1>
```

---

## 🔘 Interactive Elements

### Button Sizing
```
Mobile (Full Width):
┌───────────────────────────┐
│      Primary Action       │ ← h-11 (44px) - thumb friendly
└───────────────────────────┘

Desktop (Auto Width):
┌─────────────────┐
│ Primary Action  │ ← h-11, padding based on content
└─────────────────┘
```

### Form Inputs
```
Mobile/Desktop (Consistent):
┌─────────────────────────────┐
│ user@example.com         ↓ │ ← h-11 (44px minimum)
└─────────────────────────────┘
   Minimum 44×44 tap target
```

---

## ♿ Accessibility Features

### Focus Indicators
```
Normal:
┌─────────────┐
│   Button    │
└─────────────┘

Focused (Tab):
  ┌─────────────┐
  │   Button    │  ← 2px primary outline
  └─────────────┘     2px offset
     └────┬────┘      box-shadow ring
```

### Skip Links
```
Hidden until focused:
┌────────────────────────────┐
│ [Skip to main content]     │ ← Appears on Tab focus
├────────────────────────────┤
│                            │
│        Page Content        │
│                            │
└────────────────────────────┘
```

---

## 🎨 Color Usage

### Role Badges
```
Student:   ■ Blue (#3B82F6)
Teacher:   ■ Cyan (#06B6D4)
HOD:       ■ Indigo (#6366F1)
Admin:     ■ Slate (#475569)
Principal: ■ Sky (#0EA5E9)
```

### Status Colors
```
Present: ■ Green (#16A34A)
Absent:  ■ Red (#DC2626)
Late:    ■ Amber (#F59E0B)
Leave:   ■ Blue (#3B82F6)
```

---

## 📱 Real Device Testing

### Recommended Test Devices
```
Phone:
  • iPhone SE (375×667)
  • iPhone 12 (390×844)
  • Samsung Galaxy S21 (360×800)

Tablet:
  • iPad (768×1024)
  • iPad Pro (1024×1366)

Desktop:
  • MacBook Air (1440×900)
  • 1080p Display (1920×1080)
  • 4K Display (3840×2160)
```

---

## 🚀 Quick Testing Commands

### Responsive Testing in Browser
```
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test these widths:
   - 375px (iPhone SE)
   - 768px (iPad portrait)
   - 1024px (Desktop)
   - 1440px (Large desktop)
```

### Animation Performance
```
1. DevTools → Performance tab
2. Click Record
3. Interact with page (scroll, hover, open modal)
4. Stop recording
5. Check: All frames should be green (60 FPS)
```

---

**Pro Tip:** Keep this guide open while developing responsive features. Reference the visual layouts to ensure your implementation matches the expected behavior at each breakpoint.

---

**Last Updated:** December 9, 2025  
**Document Version:** 1.0
