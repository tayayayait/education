<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# EduMeter Web (Monorepo)

This app lives under `apps/web`.

## Run Locally

**Prerequisites:** Node.js

From the repo root:
1. Install dependencies: `npm install`
2. Run the web app: `npm run dev`

(Or run directly inside `apps/web` with `npm install` / `npm run dev`.)

## Design Tokens

Design tokens live in:
- `apps/web/src/index.css` (CSS variables)
- `apps/web/tailwind.config.cjs` (Tailwind theme mappings)

Key tokens (CSS variables):
```css
--color-primary: 37 99 235;
--color-secondary: 139 92 246;
--color-success: 16 185 129;
--color-danger: 220 38 38;
--color-warning: 245 158 11;
--color-info: 14 165 233;
--color-background: 247 250 252;
--color-card: 255 255 255;
--color-border: 229 231 235;
--color-text-primary: 17 24 39;
--color-text-secondary: 107 114 128;
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--shadow-card: 0 2px 4px rgba(0, 0, 0, 0.05);
--shadow-elevated: 0 6px 16px rgba(15, 23, 42, 0.08);
```

Tailwind usage (examples):
```tsx
<div className="bg-background text-text-primary border-border shadow-card rounded-md" />
<button className="bg-primary text-white hover:bg-primary/90" />
```

## Component Usage Rules

Use the shared UI components under `apps/web/src/components/ui` for consistency:
- Form: `Button`, `Input`, `Select`, `Textarea`
- Layout: `Card`, `Tabs`, `Table`, `Badge`, `Progress`, `Modal`, `ToastProvider`

Recommended patterns:
- Use `TableContainer` for horizontal scroll, sticky headers, and mobile stacking.
  ```tsx
  <TableContainer stickyHeader stackOnMobile>
    <Table>
      <TableBody>
        <TableRow>
          <TableCell dataLabel="Name">Alice</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </TableContainer>
  ```
- Wrap the app in `ToastProvider` (already done in `apps/web/src/index.tsx`).
- Use `Modal` with `ariaLabelledby` / `ariaDescribedby` when the modal has visible title/description.

## Layout

Shared layout components:
- `Header` / `Sidebar`
- `AdminShell`
- `PageContainer` (max width 1200px, horizontal padding)

## Accessibility

Global behavior:
- `:focus-visible` styles are enabled in `apps/web/src/index.css`.
- `prefers-reduced-motion` is respected for reduced animation.

Component behavior:
- `Modal` traps focus, supports ESC close, and supports ARIA labeling.
- `ToastProvider` uses ARIA live regions for announcements.
