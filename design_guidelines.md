# Arhti Business Management System - Design Guidelines

## Design Approach
Following the detailed specifications provided for a professional business management dashboard with rounded modern design aesthetics. This is a **utility-focused, function-differentiated** application requiring clean, efficient interface design.

## Core Visual System

### Typography
- **Font Family**: Inter or Manrope
- **Weights**: 400 (normal), 500 (medium), 700 (bold)
- **Hierarchy**: Bold, clean headings with minimal styling. Subtext/labels use smaller muted tones (gray.500)

### Color Palette
```
Primary: #16a34a (green)
Accent: #facc15 (yellow)
Light Mode Background: #ffffff
Dark Mode Background: #0d1117
Light Mode Text: #1f2937
Dark Mode Text: #e5e7eb
Light Mode Cards: #f9fafb
Dark Mode Cards: #161b22
Light Mode Sidebar: #f3f4f6
Dark Mode Sidebar: #1a1f25
Borders Light: rgba(0,0,0,0.1)
Borders Dark: rgba(255,255,255,0.1)
```

### Shape System
- **Border Radius**: rounded-2xl (1.25rem) consistently across all components
- **Card Shadows**: Soft-md with light blur effect
- **Hover Effects**: Slight scale-up with subtle shadow glow in light mode, green tint glow in dark mode

### Layout & Spacing
- **Container Max Width**: 1200px
- **Card Internal Padding**: 1rem (p-4)
- **Component Gap**: 1.5rem (gap-6)
- **Tailwind Spacing Units**: Primarily use spacing-4, spacing-6, spacing-8, spacing-12 for consistency

## Responsive Design Strategy

### Desktop Layout (lg and above)
- Left sidebar navigation (collapsible)
- Top navbar with user profile dropdown, theme toggle, search
- Main content area scrollable with 3-column grid layouts where applicable
- Maximum content width: max-w-7xl

### Mobile Layout (base to md)
- Bottom floating navigation bar (rounded, elevated)
- Top bar simplified to page title and search only
- All dialogs/forms become bottom sheets instead of center popups
- Single column layouts with full-width cards
- Sticky "Add" floating action button in bottom-right corner

## Navigation Structure

### Desktop Sidebar
Icons (Lucide/HeroIcons style) with labels:
- Dashboard, Farmers, Purchases, Invoices, Payments, Charges, Reports, Settings
- Active item: green background highlight with rounded corners
- Collapsible with smooth Framer Motion animation

### Mobile Bottom Bar
- Home (Dashboard), Clients (Farmers), Invoices, Payments, More
- "More" opens bottom sheet with: Settings, Theme, Reports, Help
- Rounded-full container with backdrop blur

## Component Library (Shadcn/UI)

### Core Components
- **Cards**: `<Card />` with rounded-2xl, soft shadows
- **Buttons**: `<Button />` variants (default, outline, ghost) with green primary color
- **Dialogs**: `<Dialog />` for desktop, bottom sheets for mobile
- **Tables**: `<Table />` with sticky headers and hover row highlights
- **Forms**: `<Input />`, `<Select />`, `<Textarea />` with consistent rounded styling
- **Toggles**: `<Switch />` for theme and settings

## Page-Specific Layouts

### Dashboard
- Welcome header with date/time
- 4 statistic cards grid (2x2 on mobile, 4 columns on desktop): Total Farmers, Pending Payments, Total Commission, Charges Today
- Each card: icon, label, large numeric value, trend indicator (+/- %)
- Recent activity timeline with avatar + timestamp
- Chart section (line/bar) showing monthly trends
- Quick action buttons: "Add Purchase", "Create Invoice", "Add Payment"

### Farmers Page
- Search bar with filter dropdown (crop, date, status)
- Toggle: Table View / Card View
- **Card View** (mobile): Farmer name, crop type, last deal date, total amount, status badge
- **Table View** (desktop): Name | Crop | Weight | Rate | Total | Status | Date | Actions
- Floating "Add Farmer" button

### Purchases, Invoices, Payments, Charges Pages
- Consistent header pattern: Page title + primary action button
- Search bar always visible
- Data tables with columns specific to each page type
- Form dialogs/sheets with consistent field styling
- Status badges with color coding (green: paid/active, yellow: pending, gray: inactive)

### Reports Page
- Date range filter with calendar picker
- Multiple chart types: Pie (charges breakdown), Line (profit trends), Bar (payment comparisons)
- Export buttons (PDF/Excel) in outline variant
- Charts animate-in on viewport entry

### Settings Page
- Sectioned layout: Theme Selection, Commission Settings, Currency & Date Format
- Theme toggle: System / Light / Dark with radio buttons
- Commission type selector with percentage input
- Fixed save button at bottom (mobile) or floating right (desktop)

## Theme Implementation

### Dark Mode Specifics
- Automatic system preference detection via `window.matchMedia`
- Manual toggle override in navbar
- All components adapt colors per theme table
- Smooth color transitions (duration-200)

## Animations & Microinteractions

- **Page Transitions**: Fade + slide-up using Framer Motion
- **Button Hover**: Scale-up (scale-105) with glow border
- **Dialogs**: Slide from bottom with backdrop blur
- **Sidebar**: Animated expand/collapse with icon rotation
- **Table Rows**: Subtle background highlight on hover
- **Charts**: Stagger animation on viewport intersection
- **Loading States**: Skeleton loaders with shimmer effect

## UX Enhancements
- Sticky table headers during scroll
- Breadcrumbs on desktop (Dashboard / Page / Details)
- Confirmation dialogs before destructive actions
- Toast notifications (top-right) for success/error feedback
- Auto-save indicators on forms
- Empty states with illustrations and call-to-action
- Keyboard navigation support throughout

## Images
No hero images required for this dashboard application. Use icons and illustrations for empty states and feature highlights within the application interface.