# EdgeForce CRM — Design System

**Built by RJ Business Solutions**
📍 1342 NM 333, Tijeras, New Mexico 87059

---

## Brand Identity

### Logo

RJ Business Solutions Logo:
```
https://storage.googleapis.com/msgsndr/qQnxRHDtyx0uydPd5sRl/media/67eb83c5e519ed689430646b.jpeg
```

### Brand Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary | #6366f1 | Buttons, links, accents |
| Primary Dark | #4f46e5 | Hover states, active |
| Secondary | #8b5cf6 | Secondary actions, gradients |
| Accent | #a855f7 | Highlights, badges |
| Success | #22c55e | Positive states, success |
| Warning | #f59e0b | Warnings, attention |
| Danger | #ef4444 | Errors, destructive actions |
| Dark | #0f172a | Dark backgrounds |
| Darker | #020617 | Deepest backgrounds |

---

## Color System

### Background Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-background` | #020617 | Page background |
| `--color-surface` | #0f172a | Cards, panels |
| `--color-surface-hover` | #1e293b | Hover states |

### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-text-primary` | #f8fafc | Primary text |
| `--color-text-secondary` | #94a3b8 | Secondary text |
| `--color-text-muted` | #64748b | Muted text, placeholders |

### Border Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-border` | #334155 | Default borders |
| `--color-border-hover` | #475569 | Hover borders |
| `--color-border-focus` | #6366f1 | Focus rings |

---

## Typography

### Font Stack

```css
--font-sans: "Inter", system-ui, -apple-system, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", monospace;
```

### Type Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 2rem / 32px | 700 | 1.2 |
| H2 | 1.5rem / 24px | 600 | 1.3 |
| H3 | 1.25rem / 20px | 600 | 1.4 |
| H4 | 1rem / 16px | 600 | 1.4 |
| Body | 0.875rem / 14px | 400 | 1.6 |
| Small | 0.75rem / 12px | 400 | 1.5 |
| Caption | 0.625rem / 10px | 500 | 1.4 |

### Usage

```tsx
// Heading styles
<h1 className="text-2xl font-bold">Page Title</h1>
<h2 className="text-xl font-semibold">Section Title</h2>
<h3 className="text-lg font-semibold">Subsection</h3>

// Body text
<p className="text-sm text-slate-300">Description text</p>

// Captions and labels
<span className="text-xs text-slate-500">Label text</span>
```

---

## Spacing

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight spacing |
| `--space-2` | 8px | Small gaps |
| `--space-3` | 12px | Component padding |
| `--space-4` | 16px | Section gaps |
| `--space-6` | 24px | Card padding |
| `--space-8` | 32px | Section spacing |
| `--space-12` | 48px | Large gaps |

### Usage

```tsx
// Component spacing
<div className="p-4">...</div>

// Section spacing
<div className="space-y-6">...</div>

// Inline spacing
<div className="flex items-center gap-2">...</div>
```

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Small elements |
| `--radius-md` | 8px | Buttons, inputs |
| `--radius-lg` | 12px | Cards |
| `--radius-xl` | 16px | Modals |
| `--radius-full` | 9999px | Pills, avatars |

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | 0 1px 2px rgba(0,0,0,0.3) | Subtle elevation |
| `--shadow-md` | 0 4px 6px rgba(0,0,0,0.4) | Cards |
| `--shadow-lg` | 0 10px 15px rgba(0,0,0,0.5) | Modals |
| `--shadow-glow` | 0 0 20px rgba(99,102,241,0.3) | Accent glow |

---

## Components

### Buttons

#### Primary Button
```tsx
<button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition">
  Button Text
</button>
```

**States:**
- Default: `bg-indigo-600`
- Hover: `bg-indigo-500`
- Active: `bg-indigo-700`
- Disabled: `bg-slate-600 opacity-50 cursor-not-allowed`

#### Secondary Button
```tsx
<button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition">
  Secondary
</button>
```

#### Ghost Button
```tsx
<button className="px-4 py-2 hover:bg-slate-800 text-slate-300 rounded-lg font-medium transition">
  Ghost
</button>
```

#### Danger Button
```tsx
<button className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition">
  Delete
</button>
```

#### Button Sizes
```tsx
// Small
<button className="px-3 py-1.5 text-sm ...">Small</button>

// Medium (default)
<button className="px-4 py-2 text-base ...">Medium</button>

// Large
<button className="px-6 py-3 text-lg ...">Large</button>
```

#### Button with Icon
```tsx
<button className="flex items-center gap-2 px-4 py-2 ...">
  <Plus className="h-4 w-4" />
  Add Contact
</button>
```

---

### Inputs

#### Text Input
```tsx
<input
  type="text"
  placeholder="Enter name..."
  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
/>
```

#### Input States
- Default: `border-slate-700`
- Hover: `border-slate-600`
- Focus: `border-indigo-500 ring-1 ring-indigo-500`
- Error: `border-red-500 ring-1 ring-red-500`
- Disabled: `opacity-50 cursor-not-allowed`

#### Textarea
```tsx
<textarea
  rows={4}
  placeholder="Enter description..."
  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500 w-full"
/>
```

#### Select
```tsx
<select className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm">
  <option value="">Select option</option>
  <option value="1">Option 1</option>
</select>
```

---

### Cards

#### Basic Card
```tsx
<div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
  <h3 className="text-lg font-semibold mb-2">Card Title</h3>
  <p className="text-sm text-slate-400">Card content here</p>
</div>
```

#### Interactive Card
```tsx
<div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl hover:bg-slate-800/50 transition cursor-pointer">
  ...
</div>
```

---

### Badges

#### Status Badge
```tsx
<span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
  Active
</span>
```

| Status | Classes |
|--------|---------|
| New | `bg-slate-500/20 text-slate-400` |
| Contacted | `bg-yellow-500/20 text-yellow-400` |
| Qualified | `bg-indigo-500/20 text-indigo-400` |
| Won/Converted | `bg-green-500/20 text-green-400` |
| Lost | `bg-red-500/20 text-red-400` |

#### Score Badge
```tsx
<div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
  <Star className="h-3 w-3" />
  85
</div>
```

---

### Tables

#### Basic Table
```tsx
<div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
  <table className="w-full">
    <thead className="border-b border-slate-800">
      <tr className="text-left text-sm text-slate-400">
        <th className="px-4 py-3 font-medium">Name</th>
        <th className="px-4 py-3 font-medium">Email</th>
        <th className="px-4 py-3 font-medium">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-slate-800/50 hover:bg-slate-800/30">
        <td className="px-4 py-3">John Smith</td>
        <td className="px-4 py-3">john@example.com</td>
        <td className="px-4 py-3"><Badge>Active</Badge></td>
      </tr>
    </tbody>
  </table>
</div>
```

---

### Avatars

#### User Avatar
```tsx
<div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
  JS
</div>
```

| Size | Class |
|------|-------|
| Small (24px) | `h-6 w-6 text-xs` |
| Medium (32px) | `h-8 w-8 text-xs` |
| Default (36px) | `h-9 w-9 text-sm` |
| Large (48px) | `h-12 w-12 text-base` |

---

### Modals

#### Base Modal
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center">
  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
  <div className="relative bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-lg">
    <h2 className="text-lg font-semibold mb-4">Modal Title</h2>
    {content}
    <div className="flex justify-end gap-3 mt-6">
      <button onClick={onClose}>Cancel</button>
      <button>Confirm</button>
    </div>
  </div>
</div>
```

---

### Animations

#### Transitions
```css
/* All elements */
* { transition-property: color, background-color, border-color; transition-duration: 150ms; }

/* Interactive elements */
button, a { transition-property: all; transition-duration: 200ms; }
```

#### Loading Skeleton
```tsx
<div className="skeleton h-4 w-32 rounded" />
```

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

#### Drag and Drop
```css
.dragging { opacity: 0.5; transform: rotate(2deg); }
.drag-over { border: 2px dashed var(--color-primary); }
```

---

## Dark Mode (Default)

The application uses dark mode as the default theme:

```css
/* globals.css */
body {
  background-color: #020617;
  color: #f8fafc;
}
```

---

## Accessibility

### Focus States
```tsx
<button className="focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900">
  Button
</button>
```

### Color Contrast
All text colors meet WCAG AA requirements:
- Primary text on dark: #f8fafc on #020617 (ratio: 19:1)
- Secondary text on dark: #94a3b8 on #020617 (ratio: 7:1)

### Screen Reader
- All interactive elements have accessible labels
- Icons include `aria-label` or visible text
- Tables have proper headers

---

## Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| Mobile | <640px | Single column layouts |
| Tablet | 640-1024px | Two column layouts |
| Desktop | >1024px | Full layouts |

---

*Document Version: 1.0.0 | Generated: 2026-03-29*