# Manual Testing Guide — Sprint 1.0
**For:** QA Testers / Product Owners
**Duration:** 10-15 minutes per device
**Required:** Browser DevTools or real mobile device

---

## ✅ Quick Start

1. Start dev server: `npm run dev`
2. Open http://localhost:5173 in browser
3. Follow testing checklists below for desktop and mobile

---

## 📱 STORY-FE-001: Mobile Sidebar Testing

### Desktop (Chrome DevTools)

```
✓ Expected: Full sidebar visible (240px wide, dark background)
✓ Navigation items: Kanban, Leads, Relatórios all visible
✓ Logo: PropTech CRM branding at top
✓ Footer: "Sistema Interno v1.0" at bottom

Test on breakpoints:
- 1024px+ → Full sidebar visible
- 768px (breakpoint) → Transitions from sidebar to hamburger
```

**Steps:**
1. Open http://localhost:5173 in Chrome
2. Open DevTools (F12)
3. Toggle Device Toolbar (Ctrl+Shift+M)
4. Set viewport to 1024px width
5. ✓ Confirm sidebar visible on right side of screen
6. ✓ Confirm all 3 navigation items visible

---

### Mobile (Chrome DevTools Emulation)

```
✓ Expected: Hamburger button visible (top-left, white with menu icon)
✓ Hamburger hidden on desktop (only appears <768px)
✓ Main content has padding to avoid hamburger overlap
✓ Drawer works when hamburger clicked

Test on breakpoints:
- 375px (iPhone 12) → Hamburger visible, drawer works
- 320px (iPhone SE) → Check button positioning
- 768px (iPad) → Check transition point
```

**Steps:**
1. Open DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Set viewport to 375px (iPhone 12)
4. ✓ Confirm hamburger button visible at top-left
5. Click hamburger button
6. ✓ Confirm drawer slides in from left
7. ✓ Confirm all navigation items visible in drawer
8. Click navigation item (e.g., "Leads")
9. ✓ Confirm drawer closes automatically
10. ✓ Confirm navigated to Leads page
11. Go back, open hamburger again
12. ✓ Confirm drawer closes button (X) works

**Test responsive transition:**
1. Set viewport to 768px
2. ✓ Confirm hamburger visible (< 768px)
3. Gradually increase width to 769px
4. ✓ Confirm hamburger disappears, sidebar appears

---

### Edge Cases to Test

```
? Very small screen (320px) - hamburger button positioning
  Expected: Button doesn't overlap content

? Landscape orientation (e.g., 812x375)
  Expected: Button still positioned correctly

? Drawer animation smoothness
  Expected: No jank/stuttering when opening/closing
```

---

## ⌨️ STORY-FE-002: Keyboard Accessibility Testing

### Desktop (Keyboard Navigation)

```
✓ Expected: Can Tab through cards
✓ Expected: Focus ring visible around focused card
✓ Expected: Can interact with cards using keyboard only
✓ Expected: Screen readers announce card information
```

**Steps:**
1. Open http://localhost:5173 in Chrome
2. Navigate to Kanban page (or it's default)
3. ✓ See cards in columns (REUNIÃO REALIZADA, PROPOSTA ENVIADA, etc.)
4. Press Tab key repeatedly
5. ✓ Confirm focus moves through page elements
6. Continue pressing Tab until focused on a card
7. ✓ Confirm blue/colored focus ring appears around card
8. ✓ Card information is readable and focused
9. Press Tab again
10. ✓ Focus moves to next card (or other interactive element)

---

### Keyboard Drag-Drop (Advanced)

```
Note: This depends on dnd-kit's KeyboardSensor implementation
Typical behavior:
  - Tab: Focus card
  - Arrow keys: Move to different column
  - Enter: Drop card
  - ESC: Cancel
```

**Steps:**
1. Focus on a card (Tab until card has focus ring)
2. Check dnd-kit documentation if arrow keys don't work:
   https://docs.dndkit.org/api-documentation/sensors/keyboard
3. Expected behavior should match dnd-kit docs

---

### Screen Reader Testing (NVDA on Windows / VoiceOver on Mac)

#### Windows (NVDA)
```
Installation: https://www.nvaccess.org/download/

1. Install NVDA
2. Start NVDA (Ctrl+Alt+N or from Start Menu)
3. Open http://localhost:5173 in Chrome
4. NVDA will announce page elements as you navigate
```

#### Mac (VoiceOver)
```
Built-in: Cmd+F5 to toggle

1. Enable VoiceOver: System Preferences → Accessibility → VoiceOver
2. Or: Cmd+F5
3. Open http://localhost:5173 in Safari/Chrome
4. VoiceOver will announce page elements
5. Use VO+Arrow keys to navigate (VO = Control+Option by default)
```

**Listen for:**
- ✓ "Card: [Name] em [Company]" when VoiceOver focuses card
- ✓ Card information clearly announced
- ✓ No confusing or missing descriptions

---

## 🔍 Quick Pass/Fail Checklist

### Mobile Responsive (5 min)

- [ ] Desktop (1024px): Full sidebar visible
- [ ] Mobile (375px): Hamburger button visible, drawer works
- [ ] Mobile (320px): Button positioned correctly, no overlap
- [ ] Transition (768px): Sidebar ↔ Hamburger works correctly
- [ ] Drawer: Closes after navigation, animates smoothly

**Result: ☐ PASS ☐ FAIL**

---

### Keyboard Accessibility (5 min)

- [ ] Tab key: Can focus all interactive elements
- [ ] Focus ring: Visible when card focused (blue/colored)
- [ ] aria-label: Card shows "[Name] em [Company]" to screen reader
- [ ] Fallback: Cards with missing names show "Sem nome" + "empresa desconhecida"
- [ ] No regressions: Mouse/touch drag-drop still works

**Result: ☐ PASS ☐ FAIL**

---

## 📋 Issues Found?

If you find issues, please document:

1. **What:** What did you do?
2. **Expected:** What should happen?
3. **Actual:** What actually happened?
4. **Device/Viewport:** Exact size and device
5. **Browser:** Browser and version
6. **Reproducible:** Can you reproduce it? Yes / No

Example:
```
Issue: Hamburger button overlaps content on iPhone SE (375px)
Expected: Button visible, no overlap
Actual: Button overlaps page header
Device: iPhone SE (375px width)
Browser: Chrome DevTools
Reproducible: Yes, every time
```

---

## ✅ Testing Complete?

When ready to approve:

1. ✅ All desktop tests passed
2. ✅ All mobile tests passed (or documented issues)
3. ✅ Keyboard navigation works
4. ✅ No regressions to existing features
5. Notify @qa (Quinn) → Ready for merge

---

## 🎯 Success Criteria

**PASS when:**
- ✅ Mobile sidebar shows/hides correctly at 768px breakpoint
- ✅ Hamburger button clickable and drawer slides smoothly
- ✅ All nav items accessible in drawer and desktop sidebar
- ✅ Keyboard Tab focuses cards (blue focus ring visible)
- ✅ No broken features or regressions

**CONCERNS when:**
- ⚠️ Minor visual glitches on edge breakpoints (320px, 768px)
- ⚠️ Keyboard navigation partially working but not all keys
- ⚠️ Screen reader doesn't announce some card info

**FAIL when:**
- ❌ Hamburger button doesn't work or drawer doesn't open
- ❌ Sidebar breaks layout (overlaps content)
- ❌ Tab key doesn't focus any elements
- ❌ Critical regression (navigation broken, Kanban board broken)

---

## 📞 Questions?

- **Mobile not working?** → Check Chrome DevTools device emulation
- **Keyboard not working?** → Check Tab key, try different cards
- **Screen reader issues?** → Check browser compatibility (VoiceOver on Mac, NVDA on Windows)
- **Can't reproduce?** → Try exact breakpoint sizes from guide

---

**Time estimate:** 10-15 minutes for full mobile + keyboard testing
**Browser support:** Chrome, Firefox, Safari, Edge (all modern versions)
**Last updated:** 2026-02-20
