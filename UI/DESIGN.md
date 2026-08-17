# CompanionLMS Landing Page Design System

## Overview

The landing page follows an editorial/magazine aesthetic inspired by modern SaaS marketing sites. It uses clean whitespace, bold serif typography, and a coral accent color to create a confident, professional look.

**Design Philosophy:** Minimal decoration, large typography, generous whitespace, real content over stock imagery.

---

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Coral | `#e8432a` | Primary accent, CTAs, badges, highlights |
| Coral Dark | `#c9351e` | Hover states for coral buttons |
| Ink | `#1a1a1a` | Primary text, dark backgrounds |
| Muted | `#666` | Body text, descriptions |
| Light BG | `#f7f7f7` | Section backgrounds, hero bg |
| Border | `#eee` | Card borders, dividers |
| Success | `#16a34a` | Positive indicators, matched skills |
| Info | `#2563eb` | Neutral indicators, links |
| Warning | `#d97706` | Caution indicators |

---

## Typography

### Headings
- **Font:** Playfair Display (serif)
- **Weights:** 700, 800, 900
- **Usage:** All section headings (h2, h3 in hero)
- **Sizes:** `clamp(32px, 4vw, 48px)` for sections, `clamp(44px, 5.2vw, 68px)` for hero

### Body
- **Font:** Inter (sans-serif)
- **Weights:** 300, 400, 500, 600, 700
- **Usage:** All body text, labels, navigation, buttons
- **Base size:** 14-16px

---

## Layout

### Max Width
- Content max-width: `1140px`
- Horizontal padding: `40px` (desktop), `20px` (mobile)

### Grid
- Hero: 2-column grid (`1fr 1.1fr`)
- Features: 4-column grid (pillars), 3-column (features list)
- Split sections: 2-column grid (`1fr 1fr`) with 64px gap
- Footer: 4-column grid (`1.4fr 1fr 1fr 1fr`)

---

## Components

### Navbar
- Sticky, white bg with backdrop blur
- Logo (left), nav links (center), Login/Register (right)
- Height: 72px
- Border bottom: 1px solid `#eee`

### Hero Badge
- Coral bg, white text
- 11.5px font, 700 weight, 1.8px letter-spacing
- Uppercase, pill shape (100px border-radius)
- Padding: 9px 20px

### CTA Buttons
- **Primary:** Black bg, white text, pill shape (100px radius)
- **Secondary:** White bg, dark border, pill shape
- **Coral:** Coral bg, white text, pill shape
- **Outline:** Transparent bg, dark border, pill shape
- Padding: 14px 32px (lg), 11px 28px (default)

### Cards
- White bg, 1px solid `#eee` border
- 16px border-radius
- Subtle shadow on hover

### Section Labels
- Small pill badges (11px font, uppercase, letter-spacing)
- Two variants: filled coral, outlined coral

### Phone Mockups
- White bg, 28px border-radius
- 2px solid `#e8e8e8` border
- Subtle shadow: `0 20px 60px rgba(0,0,0,.12)`
- Contains realistic UI mockups built with CSS

### Dashboard Mockups
- White bg, 16px border-radius
- Shadow: `0 16px 56px rgba(0,0,0,.08)`
- Contains KPI cards, charts, tables built with CSS

### Kanban Mockup
- 4-column grid layout
- Column headers with colored dots
- Candidate cards with avatar, name, role, match score

---

## Sections (in order)

1. **Navbar** - Sticky nav with logo, links, auth buttons
2. **Hero** - Badge, headline, subtext, CTAs, phone stack mockup
3. **How It Works** - 3-step flywheel with numbered circles
4. **Platform Pillars** - 4 feature cards with icons
5. **For Students** - Split: text left, dashboard mockup right
6. **For Companies** - Split: text left, kanban + analytics right
7. **For Admins** - Split: text left, admin dashboard right
8. **Stats Bar** - 4 key metrics on dark background
9. **Testimonial** - Centered quote with avatar
10. **Features Grid** - 6 additional features
11. **CTA Form** - Contact form with 6 fields
12. **Footer** - Brand, social, links, app store badges

---

## Responsive Breakpoints

| Breakpoint | Width | Changes |
|------------|-------|---------|
| Desktop | >1024px | Full 2-column layouts, phone stack visible |
| Tablet | 640-1024px | Single column, phones hidden, 2-col grids |
| Mobile | <640px | Single column, reduced padding, stacked elements |

---

## Image Placeholders

### Required Images (to be provided)

1. **Hero Phone Screenshots** (3 images)
   - Student course dashboard
   - AI job matching screen
   - Resume intelligence screen

2. **Feature Screenshots** (3 images)
   - Student dashboard full view
   - Company kanban pipeline
   - Admin analytics dashboard

3. **Background/Decorative** (optional)
   - Abstract shapes or patterns for hero section

### Placeholder Strategy
- Use CSS-based mockups that replicate the actual app UI
- Each mockup is built with HTML/CSS divs
- Ready to swap with real screenshots when available
- Placeholder images use `next/image` with `fill` prop for optimization

---

## File Structure

```
UI/
  app/
    page.tsx                    # Landing page (main)
    globals.css                 # CSS variables and base styles
  components/
    landing/
      navbar.tsx               # Navigation bar
      hero.tsx                 # Hero section with phone mockups
      how-it-works.tsx         # 3-step flywheel
      pillars.tsx              # Platform feature cards
      for-students.tsx         # Student benefits + dashboard mockup
      for-companies.tsx        # Company benefits + kanban mockup
      for-admins.tsx           # Admin benefits + dashboard mockup
      stats-bar.tsx            # Key metrics
      testimonial.tsx          # Quote section
      features-grid.tsx        # Additional features
      cta-form.tsx             # Contact form
      footer.tsx               # Footer
      mockups/
        phone-stack.tsx        # Hero phone mockups
        student-dashboard.tsx  # Student dashboard mockup
        kanban-pipeline.tsx    # Company kanban mockup
        admin-dashboard.tsx    # Admin dashboard mockup
```

---

## CSS Custom Properties

Added to `globals.css` for the landing page:

```css
:root {
  --coral: #e8432a;
  --coral-dark: #c9351e;
  --ink: #1a1a1a;
  --light-bg: #f7f7f7;
}
```

---

## Tailwind Extensions

Added to `tailwind.config.ts`:

```ts
colors: {
  coral: {
    DEFAULT: '#e8432a',
    dark: '#c9351e',
  },
  ink: '#1a1a1a',
}
```

---

## Notes

- The coral accent is intentionally different from the app's primary teal (`--primary: 172 66% 30%`)
- The landing page uses its own color system for marketing purposes
- The app portal pages continue to use the teal primary color
- Font loading uses Google Fonts with `display=swap` for performance
- All mockups are pure CSS - no images required for layout
- Real screenshots should be exported at 2x resolution for retina displays
