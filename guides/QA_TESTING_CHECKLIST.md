# QA Testing Checklist - Campus Check-In UI

## 📋 Overview
This checklist provides comprehensive test scenarios for validating responsive design, animations, accessibility, and overall UX improvements.

---

## ✅ Quick Reference

### Testing Devices/Viewports
- [ ] Mobile Portrait: 320px, 375px, 420px
- [ ] Mobile Landscape: 480px, 640px
- [ ] Tablet: 768px, 820px
- [ ] Desktop: 1024px, 1280px, 1440px
- [ ] Large Desktop: 1600px+

### Testing Browsers
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (macOS + iOS)
- [ ] Chrome Android

---

## 🎨 Visual Regression Testing

### Homepage / Login Page
| Test ID | Viewport | Expected Behavior | Status |
|---------|----------|-------------------|--------|
| VR-01 | 320px | Login form centered, logo above form, full-width inputs | ⬜ |
| VR-02 | 768px | Login form + logo side-by-side on tablet | ⬜ |
| VR-03 | 1024px+ | Desktop layout with decorative elements | ⬜ |

### Profile Page
| Test ID | Viewport | Expected Behavior | Status |
|---------|----------|-------------------|--------|
| PR-01 | 320px | Avatar centered, name below, single column cards | ⬜ |
| PR-02 | 375px | Same as 320px, slightly larger spacing | ⬜ |
| PR-03 | 640px | Avatar size increases to 28×28 (112px) | ⬜ |
| PR-04 | 768px | Two-column grid activates, avatar on left | ⬜ |
| PR-05 | 1024px | Full desktop layout, 32×32 avatar, proper gaps | ⬜ |
| PR-06 | 1440px+ | Max-width container (7xl), centered | ⬜ |

### Dashboard Layout
| Test ID | Viewport | Expected Behavior | Status |
|---------|----------|-------------------|--------|
| DL-01 | <1024px | Hamburger menu visible, sidebar hidden | ⬜ |
| DL-02 | ≥1024px | Sidebar visible on left, sticky behavior | ⬜ |
| DL-03 | All | Main content scrolls independently | ⬜ |
| DL-04 | Student mobile | Bottom navigation bar visible and functional | ⬜ |

---

## 🎭 Animation Testing

### Performance Metrics
**Target:** 60 FPS (16.67ms per frame)

| Test ID | Component | Animation | Performance Check | Status |
|---------|-----------|-----------|-------------------|--------|
| AN-01 | Profile Header | Fade-in on load | No jank, smooth entry | ⬜ |
| AN-02 | Info Cards | Staggered fade-up (delay-100 to delay-600) | Sequential animation, no overlap | ⬜ |
| AN-03 | Card Hover | Lift + shadow on hover | Smooth transform, no flicker | ⬜ |
| AN-04 | Modal Open | Scale-in with overlay fade | No layout shift, 60 FPS | ⬜ |
| AN-05 | Sidebar Items | Slide-in-left on initial load | Clean entry, proper stagger | ⬜ |

### Chrome DevTools Performance Profiling
**Steps:**
1. Open Chrome DevTools → Performance tab
2. Click Record
3. Perform interaction (open modal, scroll, hover)
4. Stop recording
5. Analyze:
   - Green bars = good (60 FPS)
   - Yellow/Red = investigate
   - Look for "Forced Reflow" warnings

**Checklist:**
- [ ] No forced reflows detected
- [ ] Frame rate stays ≥ 55 FPS
- [ ] GPU acceleration active (check Layers panel)
- [ ] Total animation time < 300ms

---

## ♿ Accessibility Testing

### Keyboard Navigation
| Test ID | Page | Interaction | Expected Behavior | Status |
|---------|------|-------------|-------------------|--------|
| KB-01 | Profile | Tab through all elements | Visible focus ring on each element | ⬜ |
| KB-02 | Profile | Press Enter on "Edit Profile" | Modal opens | ⬜ |
| KB-03 | Edit Modal | Tab through form fields | Focus stays within modal | ⬜ |
| KB-04 | Edit Modal | Press Esc | Modal closes, focus returns to trigger | ⬜ |
| KB-05 | Sidebar | Tab through nav links | Each link focusable, active state visible | ⬜ |
| KB-06 | Mobile Drawer | Open drawer, press Esc | Drawer closes | ⬜ |

### Screen Reader Testing (NVDA/JAWS/VoiceOver)
| Test ID | Component | Expected Announcement | Status |
|---------|-----------|------------------------|--------|
| SR-01 | Avatar | "User initials, profile picture" | ⬜ |
| SR-02 | Edit Button | "Edit Profile, button" | ⬜ |
| SR-03 | Form Inputs | Label + field type announced | ⬜ |
| SR-04 | Error Messages | "Error: [message]" announced | ⬜ |
| SR-05 | Modal | "Dialog, Edit Profile" announced | ⬜ |
| SR-06 | Sidebar Links | Link text + active state | ⬜ |

### Color Contrast (WCAG AA)
| Test ID | Element | Foreground | Background | Ratio | Required | Status |
|---------|---------|------------|------------|-------|----------|--------|
| CC-01 | Body text | #1f1f1f | #f5f5f5 | — | 4.5:1 | ⬜ |
| CC-02 | Muted text | #606060 | #f5f5f5 | — | 4.5:1 | ⬜ |
| CC-03 | Primary button | White | #4d94ff | — | 4.5:1 | ⬜ |
| CC-04 | Badge text | Varies | Varies | — | 4.5:1 | ⬜ |

**Tool:** Use Chrome DevTools → Elements → Accessibility or WebAIM Contrast Checker

---

## 📱 Mobile-Specific Testing

### Touch Interactions
| Test ID | Component | Interaction | Expected | Status |
|---------|-----------|-------------|----------|--------|
| MO-01 | Hamburger Menu | Tap to open | Drawer slides in from left | ⬜ |
| MO-02 | Drawer Overlay | Tap overlay | Drawer closes | ⬜ |
| MO-03 | Bottom Nav (students) | Tap each icon | Navigate to respective page | ⬜ |
| MO-04 | Edit Button | Tap | Modal opens (min 44×44 tap target) | ⬜ |
| MO-05 | Form Inputs | Tap to focus | Keyboard appears, input focused | ⬜ |

### Orientation Changes
| Test ID | Device | Action | Expected | Status |
|---------|--------|--------|----------|--------|
| OR-01 | iPhone 12 | Portrait → Landscape | Layout reflows, no overflow | ⬜ |
| OR-02 | iPad | Portrait → Landscape | Sidebar remains accessible | ⬜ |

---

## 🌐 Cross-Browser Testing

### Layout Consistency
| Browser | Version | Profile Page | Dashboard | Animations | Status |
|---------|---------|--------------|-----------|------------|--------|
| Chrome | Latest | | | | ⬜ |
| Firefox | Latest | | | | ⬜ |
| Safari | 14+ | | | | ⬜ |
| Edge | Latest | | | | ⬜ |
| Safari iOS | 14+ | | | | ⬜ |
| Chrome Android | Latest | | | | ⬜ |

**Check for:**
- [ ] CSS Grid support (all modern browsers)
- [ ] CSS Custom Properties (IE11 NOT supported)
- [ ] Flexbox layout (all browsers)
- [ ] Backdrop-filter (Safari may need prefix)

---

## 🎯 Functional Testing

### Profile Page
| Test ID | Action | Expected Result | Status |
|---------|--------|-----------------|--------|
| FN-01 | Click "Edit Profile" | Modal opens with pre-filled data | ⬜ |
| FN-02 | Edit name, click Save | Name updates, success toast appears | ⬜ |
| FN-03 | Enter mismatched passwords | Error message: "Passwords do not match" | ⬜ |
| FN-04 | Leave password fields blank | Other fields update, password unchanged | ⬜ |
| FN-05 | Click Cancel | Modal closes, no changes saved | ⬜ |

### Sidebar Navigation
| Test ID | Action | Expected Result | Status |
|---------|--------|-----------------|--------|
| SB-01 | Click sidebar link | Navigate to page, active state updates | ⬜ |
| SB-02 | Collapse sidebar (desktop) | Sidebar hides, main content expands | ⬜ |
| SB-03 | Open hamburger menu (mobile) | Drawer opens, overlay visible | ⬜ |
| SB-04 | Click outside drawer | Drawer closes | ⬜ |

---

## 🔍 Edge Cases & Stress Testing

### Long Content
| Test ID | Scenario | Expected Behavior | Status |
|---------|----------|-------------------|--------|
| EC-01 | Very long name (50+ chars) | Text wraps properly, no overflow | ⬜ |
| EC-02 | Long email (60+ chars) | Text breaks with word-break | ⬜ |
| EC-03 | Many badges (10+) | Badges wrap to next line, no horizontal scroll | ⬜ |

### Network Conditions
| Test ID | Condition | Expected | Status |
|---------|-----------|----------|--------|
| NC-01 | Slow 3G | Loading states visible, no layout shift | ⬜ |
| NC-02 | Offline | Error message, graceful degradation | ⬜ |

---

## 🏆 Lighthouse Audit Targets

Run Lighthouse audit in Chrome DevTools:

| Category | Target Score | Actual Score | Status |
|----------|--------------|--------------|--------|
| Performance | ≥ 90 | — | ⬜ |
| Accessibility | 100 | — | ⬜ |
| Best Practices | ≥ 95 | — | ⬜ |
| SEO | ≥ 90 | — | ⬜ |

**Key Metrics:**
- First Contentful Paint: < 1.8s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- Time to Interactive: < 3.8s

---

## 📊 Test Execution Summary

### Test Coverage
- Total Test Cases: **78**
- Passed: ___
- Failed: ___
- Blocked: ___
- Not Run: ___

### Critical Issues
Record any critical bugs found:

| Issue ID | Description | Severity | Status |
|----------|-------------|----------|--------|
| — | — | — | — |

### Sign-Off

**Tested By:** _______________  
**Date:** _______________  
**Environment:** _______________  
**Build Version:** _______________  

**Approval:**
- [ ] QA Lead
- [ ] Product Owner
- [ ] Technical Lead

---

## 🔄 Regression Testing Notes

After any code changes, re-run:
1. **Critical Path Tests:** PR-01 to PR-06, DL-01 to DL-04, FN-01 to FN-05
2. **Accessibility:** All KB-* and SR-* tests
3. **Animation Performance:** AN-01 to AN-05
4. **Lighthouse Audit:** Must maintain scores

---

## 📝 Additional Notes

Use this section to document:
- Device-specific quirks discovered
- Browser rendering differences
- Performance bottlenecks identified
- Suggested improvements

---

**Document Version:** 1.0  
**Last Updated:** December 9, 2025  
**Next Review Date:** After major feature release
