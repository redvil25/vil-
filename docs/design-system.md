# Sandbox Design System

**Version**: 1.1
**Last Updated**: 2025-10-19
**Based on**: fictiverse project design patterns

---

## Overview

This design system defines the visual language, component patterns, and user experience guidelines for the Sandbox platform. It is inspired by modern content platforms with a focus on readability, elegance, and user engagement for web application.

### Design Philosophy

- **Content-First**: Prioritize readability and story discovery
- **Clean & Modern**: Use whitespace effectively, minimal design with purposeful details
- **Accessible**: WCAG AA compliant, keyboard navigable, screen reader friendly
- **Responsive**: Mobile-first approach with seamless desktop experiences
- **Delightful**: Subtle animations and interactions that enhance without distracting

---

## Color System

### Brand Colors

The Sandbox platform uses a **blue color palette** ("fiction" colors) as the primary brand identity, suggesting creativity, trust, and depth.

```typescript
fiction: {
  50:  '#f0f9ff',  // Lightest - backgrounds, subtle highlights
  100: '#e0f2fe',  // Very light - hover states, secondary backgrounds
  200: '#bae6fd',  // Light - borders, inactive states
  300: '#7dd3fc',  // Medium light - accents
  400: '#38bdf8',  // Medium - interactive elements
  500: '#0ea5e9',  // Primary - main brand color
  600: '#0284c7',  // Primary dark - primary buttons, links
  700: '#0369a1',  // Dark - active states, emphasis
  800: '#075985',  // Very dark - text on light backgrounds
  900: '#0c4a6e',  // Darkest - strong emphasis
  950: '#082f49',  // Extra dark - headers on light backgrounds
}
```

### Semantic Colors (HSL-based CSS Variables)

#### Light Theme

```css
--background: 210 40% 98%;        /* Off-white background */
--foreground: 222.2 84% 4.9%;     /* Near-black text */

--card: 0 0% 100%;                /* White cards */
--card-foreground: 222.2 84% 4.9%;

--primary: 221 83% 53%;            /* Fiction blue */
--primary-foreground: 210 40% 98%;

--secondary: 210 40% 96.1%;        /* Light gray */
--secondary-foreground: 222.2 47.4% 11.2%;

--muted: 210 40% 96.1%;            /* Muted backgrounds */
--muted-foreground: 215.4 16.3% 46.9%;

--accent: 210 40% 96.1%;           /* Accent backgrounds */
--accent-foreground: 222.2 47.4% 11.2%;

--destructive: 0 84.2% 60.2%;      /* Red for errors/delete */
--destructive-foreground: 210 40% 98%;

--border: 214.3 31.8% 91.4%;       /* Border color */
--input: 214.3 31.8% 91.4%;        /* Input borders */
--ring: 221 83% 53%;               /* Focus ring color */

--radius: 0.75rem;                 /* Border radius (12px) */
```

#### Dark Theme

```css
--background: 222.2 84% 4.9%;      /* Dark background */
--foreground: 210 40% 98%;         /* Light text */

--card: 222.2 84% 4.9%;
--card-foreground: 210 40% 98%;

--primary: 217.2 91.2% 59.8%;      /* Lighter blue for dark mode */
--primary-foreground: 222.2 47.4% 11.2%;

--secondary: 217.2 32.6% 17.5%;
--secondary-foreground: 210 40% 98%;

--muted: 217.2 32.6% 17.5%;
--muted-foreground: 215 20.2% 65.1%;

--accent: 217.2 32.6% 17.5%;
--accent-foreground: 210 40% 98%;

--destructive: 0 62.8% 30.6%;
--destructive-foreground: 210 40% 98%;

--border: 217.2 32.6% 17.5%;
--input: 217.2 32.6% 17.5%;
--ring: 224.3 76.3% 48%;
```

### Usage Guidelines

- **Primary Color (fiction-600)**: Use for primary CTAs, links, and important interactive elements
- **Secondary Colors**: Use for less prominent actions, backgrounds, and supporting elements
- **Muted Colors**: Use for disabled states, placeholders, and subtle UI elements
- **Destructive**: Use only for delete actions, error states, and warnings
- **Background/Foreground**: Maintain at least 4.5:1 contrast ratio for accessibility

---

## Typography

### Font Families

The platform uses a **system font stack** (similar to Reddit) instead of downloading web fonts.
This eliminates font loading delays, prevents flash of unstyled/invisible text (FOUT/FOIT),
and gives users a native platform feel.

```css
font-family: {
  sans: [
    '-apple-system',        /* San Francisco on macOS/iOS */
    'BlinkMacSystemFont',   /* San Francisco on Chrome macOS */
    'Segoe UI',             /* Windows */
    'Roboto',               /* Android / Chrome OS */
    'Helvetica Neue',       /* Older macOS */
    'Arial',                /* Universal fallback */
    'sans-serif',           /* Generic fallback */
    'Apple Color Emoji',    /* Emoji support - Apple */
    'Segoe UI Emoji',       /* Emoji support - Windows */
    'Segoe UI Symbol',      /* Symbol support - Windows */
  ],
  serif: ['Georgia', 'serif'],
}
```

**Primary (sans)**: Native system font per platform for all headings, UI elements, and body text
**Secondary (serif)**: Georgia for reading-focused content and literary contexts

| Platform            | Rendered Font             |
| ------------------- | ------------------------- |
| macOS / iOS         | San Francisco             |
| Windows             | Segoe UI                  |
| Android / Chrome OS | Roboto                    |
| Linux               | System default sans-serif |

### Type Scale

```css
/* Headings - Bold, tight tracking */
h1: text-4xl md:text-5xl lg:text-6xl  /* 36px / 48px / 60px */
h2: text-3xl md:text-4xl              /* 30px / 36px */
h3: text-2xl md:text-3xl              /* 24px / 30px */
h4: text-xl                            /* 20px */
h5: text-lg                            /* 18px */
h6: text-base                          /* 16px */

/* Body text */
p: text-base leading-relaxed          /* 16px, 1.75 line-height */
   text-foreground/80                  /* 80% opacity for softer text */

/* Small text */
small: text-sm                         /* 14px */
tiny: text-xs                          /* 12px */

/* Large text */
lead: text-lg md:text-xl              /* 18px / 20px */
```

### Font Weights

- **300**: Light - rarely used, decorative purposes only
- **400**: Regular/Normal - body text
- **500**: Medium - navigation, labels, emphasized text
- **600**: Semibold - subheadings, cards titles
- **700**: Bold - headings, strong emphasis

### Line Heights

- **Headings**: `tracking-tight` (tighter letter spacing for readability)
- **Body text**: `leading-relaxed` (1.75 line-height for comfortable reading)
- **UI elements**: `leading-none` or default (compact spacing)

---

## Spacing System

Based on Tailwind CSS's 4px spacing scale:

```
spacing = value * 4px

0.5  = 2px    (tight spacing, icon gaps)
1    = 4px    (minimal gaps)
2    = 8px    (small gaps)
3    = 12px   (default gaps)
4    = 16px   (medium gaps)
5    = 20px   (comfortable gaps)
6    = 24px   (large gaps)
8    = 32px   (section spacing)
10   = 40px   (large section spacing)
12   = 48px   (major section spacing)
16   = 64px   (hero spacing)
20   = 80px   (major section dividers)
```

### Layout Containers

```css
.container {
  max-width: 1400px;  /* 2xl breakpoint */
  padding: 2rem;      /* 32px horizontal padding */
  margin: 0 auto;     /* Centered */
}

.content-container {
  max-width: 7xl;     /* 1280px - for main content areas */
}

.reading-container {
  max-width: 65ch;    /* ~65 characters for optimal reading */
}
```

---

## Border Radius

```css
--radius: 0.75rem;                  /* Base: 12px */
--radius-lg: 0.75rem;               /* Large: 12px */
--radius-md: calc(0.75rem - 2px);   /* Medium: 10px */
--radius-sm: calc(0.75rem - 4px);   /* Small: 8px */
--radius-full: 9999px;              /* Fully rounded (pills) */
```

### Usage

- **Cards**: `rounded-xl` (12px)
- **Buttons**: `rounded-md` (6px) or `rounded-full` for CTAs
- **Inputs**: `rounded-md` (6px)
- **Badges/Tags**: `rounded-full`
- **Images**: `rounded-2xl` (16px) for feature images

---

## Shadows

```css
/* Default shadow - cards, hover states */
shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)

shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)

shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)

/* Elevated elements */
shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)

shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)

/* Hero sections, modals */
shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25)
```

---

## Animation & Transitions

### Keyframe Animations

```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
/* Usage: animate-fade-in, duration: 0.6s */

@keyframes fade-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Usage: animate-fade-up, duration: 0.8s */

@keyframes slide-in {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
/* Usage: animate-slide-in, duration: 0.5s */

@keyframes blur-in {
  from { opacity: 0; filter: blur(10px); }
  to { opacity: 1; filter: blur(0); }
}
/* Usage: animate-blur-in, duration: 0.6s */

@keyframes accordion-down {
  from { height: 0; }
  to { height: var(--radix-accordion-content-height); }
}
/* Usage: animate-accordion-down, duration: 0.2s */

@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height); }
  to { height: 0; }
}
/* Usage: animate-accordion-up, duration: 0.2s */
```

### Transition Durations

- **Fast**: 150ms - hover states, simple property changes
- **Normal**: 300ms - default transitions, most UI interactions
- **Slow**: 500-800ms - page transitions, major state changes
- **Extra slow**: 1000ms+ - decorative animations

### Hover Effects

```css
/* Lift effect for cards */
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

/* Scale for images */
group-hover:scale-105
transition-transform duration-500

/* Glow effect for buttons */
.button-glow::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(to right, hsl(var(--primary)), transparent);
  opacity: 0.5;
  filter: blur(8px);
  z-index: -1;
  transition: opacity 300ms;
}

.button-glow:hover::after {
  opacity: 0.75;
}
```

---

## Component Patterns

### Button Variants

```typescript
// Primary (default)
className="bg-primary text-primary-foreground hover:bg-primary/90"

// Secondary
className="bg-secondary text-secondary-foreground hover:bg-secondary/80"

// Outline
className="border border-input bg-background hover:bg-accent hover:text-accent-foreground"

// Ghost
className="hover:bg-accent hover:text-accent-foreground"

// Destructive
className="bg-destructive text-destructive-foreground hover:bg-destructive/90"

// Link
className="text-primary underline-offset-4 hover:underline"
```

#### Button Sizes

```typescript
// Small
className="h-9 rounded-md px-3"

// Default
className="h-10 px-4 py-2"

// Large
className="h-11 rounded-md px-8"

// Icon
className="h-10 w-10"
```

#### Button Special Styles

```tsx
// Pill-shaped CTA
<Button className="rounded-full px-6 py-6 bg-fiction-600 hover:bg-fiction-700">
  Call to Action
</Button>

// With icon
<Button>
  Continue
  <ChevronRight className="ml-2 h-4 w-4" />
</Button>
```

### Card Component

```tsx
// Basic Card
<div className="bg-card text-card-foreground rounded-xl border border-border/40
                shadow-sm hover:shadow-md transition-all duration-300">
  <div className="p-6">
    {/* Card content */}
  </div>
</div>

// Interactive Card (with hover lift)
<div className="group bg-background border border-border/40 rounded-xl
                overflow-hidden shadow-sm hover:shadow-md transition-all
                duration-300 flex flex-col hover:-translate-y-1">
  {/* Card content */}
</div>

// Glass Card (frosted glass effect)
<div className="glass-card">
  {/* bg-white/10 backdrop-blur-md border border-white/20 shadow-lg */}
  {/* Content */}
</div>
```

### Story Card Pattern

```tsx
<div className="group bg-background border border-border/40 rounded-xl
                overflow-hidden shadow-sm hover:shadow-md transition-all
                duration-300 flex flex-col hover:-translate-y-1">
  {/* Image Container */}
  <div className="relative aspect-[4/3] overflow-hidden">
    <img
      src={coverImage}
      alt={title}
      className="w-full h-full object-cover group-hover:scale-105
                 transition-transform duration-500"
    />

    {/* Badge - New */}
    <span className="absolute top-3 right-3 bg-fiction-600 text-white
                     text-xs font-medium py-1 px-2 rounded-full">
      New
    </span>

    {/* Badge - Category */}
    <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm
                     text-white text-xs font-medium py-1 px-3 rounded-full">
      {category}
    </span>
  </div>

  {/* Content */}
  <div className="p-5 flex-grow flex flex-col">
    <h3 className="font-semibold text-lg mb-1 line-clamp-1">
      {title}
    </h3>

    <p className="text-foreground/70 text-sm mb-4">
      By <span className="hover:text-fiction-600 cursor-pointer">{author}</span>
    </p>

    {/* Metadata */}
    <div className="mt-auto flex items-center justify-between
                    text-xs text-foreground/60 mb-4">
      <div className="flex items-center">
        <BookOpen className="h-3.5 w-3.5 mr-1" />
        <span>{episodeCount} Episodes</span>
      </div>
      <div className="flex items-center">
        <Clock className="h-3.5 w-3.5 mr-1" />
        <span>{readTime}</span>
      </div>
    </div>

    {/* CTA */}
    <Button variant="outline" size="sm" className="w-full">
      Read Story
    </Button>
  </div>
</div>
```

### Badge Component

```tsx
// Category badge
<span className="bg-black/60 backdrop-blur-sm text-white text-xs
               font-medium py-1 px-3 rounded-full">
  {category}
</span>

// New/Featured badge
<span className="bg-fiction-600 text-white text-xs font-medium
               py-1 px-2 rounded-full">
  New
</span>

// Status badge
<span className="inline-flex items-center rounded-full bg-fiction-100
               px-3 py-1 text-sm text-fiction-800">
  <Sparkles className="h-4 w-4 mr-1" />
  <span>Featured</span>
</span>
```

---

## Layout Patterns

### Header (Fixed Navigation)

```tsx
<header className={cn(
  "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 md:px-10",
  isScrolled
    ? "py-3 bg-background/80 backdrop-blur-md border-b"
    : "py-5 bg-transparent"
)}>
  <div className="max-w-7xl mx-auto flex items-center justify-between">
    {/* Logo */}
    <Link to="/" className="flex items-center space-x-2">
      <img src="/graphics/sandbox-logo.png" alt="Sandbox Logo" className="h-8 w-auto" />
    </Link>

    {/* Desktop Navigation */}
    <nav className="hidden md:flex items-center space-x-8">
      {navLinks.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          className={cn(
            "text-sm font-medium transition-colors hover:text-fiction-700",
            isActive(link.path)
              ? "text-fiction-700"
              : "text-foreground/70"
          )}
        >
          {link.name}
        </Link>
      ))}
    </nav>

    {/* Auth buttons */}
    <div className="hidden md:flex items-center space-x-4">
      {/* Auth UI */}
    </div>

    {/* Mobile menu button */}
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden"
      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
    >
      {mobileMenuOpen ? <X /> : <MenuIcon />}
    </Button>
  </div>

  {/* Mobile menu */}
  {mobileMenuOpen && (
    <div className="md:hidden fixed inset-0 z-40 bg-background
                    pt-20 px-6 flex flex-col animate-fade-in">
      {/* Mobile nav content */}
    </div>
  )}
</header>
```

**Key Features**:

- Fixed position with backdrop blur on scroll
- Transparent when at top, opaque with border when scrolled
- Responsive: full nav on desktop, hamburger menu on mobile
- Active state highlighting

### Hero Section

```tsx
<section className="hero-section pt-32 pb-20 px-6">
  {/* background: linear-gradient(to right, bg, muted) */}
  <div className="max-w-7xl mx-auto">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      {/* Left column - Content */}
      <div className="space-y-6 animate-fade-up">
        {/* Badge */}
        <div className="inline-flex items-center rounded-full bg-fiction-100
                        px-3 py-1 text-sm text-fiction-800">
          <Sparkles className="h-4 w-4 mr-1" />
          <span>Tagline or feature</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold
                       tracking-tight text-balance">
          Main headline <br className="hidden sm:block" />
          <span className="bg-clip-text text-transparent
                         bg-gradient-to-r from-fiction-600 to-fiction-800">
            with gradient
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-foreground/80 max-w-xl">
          Supporting text that explains the value proposition
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4 pt-2">
          <Button size="lg" className="rounded-full px-6 py-6
                                       bg-fiction-600 hover:bg-fiction-700">
            Primary CTA
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>

          <Button variant="outline" size="lg"
                  className="rounded-full px-6 py-6 border-fiction-600/30
                           text-fiction-700 hover:bg-fiction-50">
            Secondary CTA
          </Button>
        </div>

        {/* Social proof */}
        <div className="flex items-center gap-2 text-sm text-foreground/60 pt-2">
          <div className="flex -space-x-1">
            {/* Avatar stack */}
          </div>
          <span>Join 10,000+ users</span>
        </div>
      </div>

      {/* Right column - Image */}
      <div className="relative">
        <div className="absolute -inset-4 bg-gradient-to-r
                        from-fiction-200 to-fiction-50
                        rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="relative rounded-2xl overflow-hidden
                        shadow-2xl animate-blur-in">
          <img src={heroImage} alt="Hero" className="w-full h-auto" />
        </div>
      </div>
    </div>
  </div>
</section>
```

### Content Section

```tsx
<section className="py-20 px-6 bg-gradient-to-b from-fiction-50/50 to-background">
  <div className="max-w-7xl mx-auto">
    {/* Section header */}
    <div className="flex flex-wrap items-center justify-between mb-12">
      <div>
        <h2 className="text-3xl font-bold mb-3">Section Title</h2>
        <p className="text-foreground/70">Section description</p>
      </div>
      <Button variant="ghost"
              className="text-fiction-700 hover:text-fiction-800
                       hover:bg-fiction-50">
        View all
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>

    {/* Content grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Cards */}
    </div>
  </div>
</section>
```

### Feature Grid (How It Works)

```tsx
<section className="py-20 px-6 bg-fiction-50/50">
  <div className="max-w-7xl mx-auto">
    <div className="text-center mb-16">
      <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
      <p className="text-foreground/70 max-w-2xl mx-auto">
        Supporting description
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
      {/* Feature card */}
      <div className="flex flex-col items-center text-center p-6">
        <div className="w-16 h-16 rounded-full bg-fiction-100
                        flex items-center justify-center mb-6">
          <Icon className="h-8 w-8 text-fiction-700" />
        </div>
        <h3 className="text-xl font-semibold mb-3">Feature Title</h3>
        <p className="text-foreground/70">
          Feature description explaining the benefit
        </p>
      </div>
      {/* Repeat for 2-3 features */}
    </div>
  </div>
</section>
```

### CTA Section (Full-width gradient)

```tsx
<section className="py-24 px-6 bg-gradient-to-r from-fiction-900
                    to-fiction-800 text-white">
  <div className="max-w-7xl mx-auto text-center">
    <h2 className="text-3xl md:text-4xl font-bold mb-6 max-w-2xl mx-auto">
      Compelling call-to-action headline
    </h2>
    <p className="text-white/80 max-w-2xl mx-auto mb-10 text-lg">
      Supporting text that reinforces the value proposition
    </p>
    <div className="flex flex-wrap justify-center gap-4">
      <Button size="lg"
              className="rounded-full px-8 py-6 bg-white
                       text-fiction-900 hover:bg-white/90">
        Primary CTA
      </Button>
      <Button size="lg" variant="outline"
              className="rounded-full px-8 py-6 border-white/30
                       text-white hover:bg-white/10">
        Secondary CTA
      </Button>
    </div>
  </div>
</section>
```

---

## Responsive Design

### Breakpoints

```typescript
screens: {
  'sm': '640px',   // Mobile landscape, small tablets
  'md': '768px',   // Tablets
  'lg': '1024px',  // Laptops, small desktops
  'xl': '1280px',  // Desktops
  '2xl': '1400px', // Large desktops (custom container max-width)
}
```

### Mobile-First Approach

```tsx
// Stack on mobile, side-by-side on desktop
<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

// 1 column on mobile, 2 on tablet, 4 on desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

// Hide on mobile, show on desktop
<nav className="hidden md:flex items-center space-x-8">

// Show on mobile, hide on desktop
<Button className="md:hidden">

// Responsive text sizes
<h1 className="text-4xl md:text-5xl lg:text-6xl">

// Responsive padding
<div className="px-6 md:px-10">
```

---

## Utility Classes

### Custom Utilities

```css
/* Hide scrollbar but keep functionality */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Text balancing for headings */
.text-balance {
  text-wrap: balance;
}

/* Glass effect */
.glass-card {
  @apply bg-white/10 backdrop-blur-md border border-white/20 shadow-lg;
}

/* Button glow effect */
.button-glow {
  @apply relative overflow-hidden;
}
.button-glow::after {
  content: '';
  @apply absolute inset-0 rounded-md blur-md opacity-50
         transition-all duration-300;
  background: linear-gradient(to right, hsl(var(--primary)), transparent);
  z-index: -1;
}
.button-glow:hover::after {
  @apply opacity-75;
}

/* Hero section gradient background */
.hero-section {
  @apply relative overflow-hidden;
  background: linear-gradient(to right,
    hsl(var(--background)),
    hsl(var(--muted)));
}
```

---

## Icon System

**Library**: Lucide React
**Size**: Typically `h-4 w-4` (16px) for inline icons, `h-8 w-8` (32px) for feature icons

### Common Icons

```tsx
import {
  ArrowRight,      // Navigation, CTAs
  ChevronRight,    // Forward actions
  BookOpen,        // Episodes, reading
  Clock,           // Time, reading time
  Users,           // Community, followers
  Star,            // Ratings, featured
  Sparkles,        // Special features
  MenuIcon, X,     // Mobile menu
  Search,          // Search functionality
  Heart,           // Favorites
  Share,           // Social sharing
  Settings,        // Configuration
  User,            // Profile
} from "lucide-react";
```

### Icon Usage

```tsx
// Inline with text
<Button>
  Continue
  <ChevronRight className="ml-2 h-4 w-4" />
</Button>

// In badges
<span className="inline-flex items-center ...">
  <Sparkles className="h-4 w-4 mr-1" />
  <span>Featured</span>
</span>

// As feature icons
<div className="w-16 h-16 rounded-full bg-fiction-100
                flex items-center justify-center">
  <BookOpen className="h-8 w-8 text-fiction-700" />
</div>

// With metadata
<div className="flex items-center">
  <Clock className="h-3.5 w-3.5 mr-1" />
  <span>{readTime}</span>
</div>
```

---

## Graphics Assets

All graphics files are located in `/frontend/public/graphics/` directory.

### Logo

**File**: `/graphics/sandbox-logo.png`
**Size**: 21 KB
**Usage**: Main brand logo for header navigation

```tsx
// In Next.js components
import Image from 'next/image';

<Image
  src="/graphics/sandbox-logo.png"
  alt="Sandbox Logo"
  width={32}
  height={32}
  priority
  className="h-8 w-auto"
/>

// Or with standard img tag
<img
  src="/graphics/sandbox-logo.png"
  alt="Sandbox Logo"
  className="h-8 w-auto"
/>
```

### Favicon

**File**: `/graphics/favicon.ico`
**Size**: 164 KB
**Usage**: Browser tab icon

```html
<!-- In Next.js app/layout.tsx or pages/_document.tsx -->
<link rel="icon" href="/graphics/favicon.ico" />
```



### Usage Guidelines

- **Logo**: Always use on light backgrounds, maintain minimum height of 32px (h-8)
- **Favicon**: Automatically loaded by browsers, ensure it's in the public directory

---

## Accessibility

### Focus States

All interactive elements must have visible focus indicators:

```css
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-2
```

### ARIA Labels

```tsx
// Buttons without text
<Button aria-label="Toggle menu">
  <MenuIcon />
</Button>

// Links
<a href="/story/123" aria-label="Read The Chronicles of Aether">
  <img src={cover} alt="" />
</a>

// Forms
<input
  type="email"
  id="email"
  aria-describedby="email-help"
  aria-required="true"
/>
```

### Color Contrast

- **Text on background**: Minimum 4.5:1 ratio
- **Large text (18px+)**: Minimum 3:1 ratio
- **UI components**: Minimum 3:1 ratio against adjacent colors

### Keyboard Navigation

- Tab order follows visual flow
- Skip links for main content
- All interactive elements keyboard accessible
- Modal traps focus appropriately

---

## Writing & Content Guidelines

### Tone of Voice

- **Friendly**: Approachable and conversational
- **Encouraging**: Support authors and readers
- **Clear**: Avoid jargon, explain complex concepts
- **Inclusive**: Welcome all genres, styles, and voices

### Microcopy

**Buttons**:

- "Start Reading" (not "Click Here")
- "Create Story" (not "Submit")

**Empty States**:

- "No stories yet" (not "404 Error")
- "Get started by creating your first story" (provide clear next step)

**Error Messages**:

- "Something went wrong. Please try again." (friendly, actionable)
- Include specific error only if helpful to user

**Success Messages**:

- "Story published successfully!"
- "Episode added to your story"

---

## Best Practices

### Performance

- **Images**: Use Next.js Image component with proper sizing
- **Lazy Loading**: Load content below the fold lazily
- **Code Splitting**: Dynamic imports for heavy components
- **Bundle Size**: Keep JavaScript bundles under 300KB gzipped

### SEO

- **Unique page titles**: Each page has descriptive `<title>`
- **Meta descriptions**: Compelling, 150-160 characters
- **Semantic HTML**: Use proper heading hierarchy (h1 → h2 → h3)
- **Alt text**: Descriptive alt text for all images
- **Structured data**: JSON-LD for stories, authors

### Loading States

```tsx
// Skeleton for cards
<div className="bg-muted animate-pulse rounded-xl h-64" />

// Spinner for buttons
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Loading...
</Button>

// Suspense boundaries
<Suspense fallback={<LoadingSkeleton />}>
  <Content />
</Suspense>
```

---

## Implementation with shadcn/ui

This design system is built to work with [shadcn/ui](https://ui.shadcn.com/) components. Install components as needed:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add input
# etc.
```

All shadcn/ui components automatically use the CSS variables defined in this design system.

---

## Version History

**v1.1** (2025-10-19)

- Added Graphics Assets section with all file paths
- Updated logo references to use `/graphics/sandbox-logo.png`
- Added usage examples for favicon, OG image, and placeholder

**v1.0** (2025-10-19)

- Initial design system based on fictiverse-inkflow
- Color palette, typography, spacing defined
- Component patterns documented
- Layout patterns established
- Responsive guidelines added
- Accessibility requirements specified

---

## References

- **Tailwind CSS**: https://tailwindcss.com/
- **shadcn/ui**: https://ui.shadcn.com/
- **Radix UI**: https://www.radix-ui.com/
- **Lucide Icons**: https://lucide.dev/
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
