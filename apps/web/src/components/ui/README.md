# UI Components Quick Reference

Shared UI components live in `apps/web/src/components/ui`.
Use these instead of ad-hoc Tailwind for consistent spacing, color, and accessibility.

## Core Form Controls

- Button
  - Variants: `primary`, `secondary`, `danger`, `ghost`
  - Sizes: `sm` (h-8), `md` (h-10), `lg` (h-12)
- Input / Select
  - Height 40px, radius `--radius-sm`
  - Focus ring uses primary token
- Textarea
  - Default rows: 3
  - Same focus/disabled behavior as Input

## Layout + Data

- Card
  - Radius `--radius-md`, `shadow-card`, border `--color-border`
  - Header + Content + Footer slots
- Table
  - Use `TableContainer` for scroll/sticky/stack:
    - `stickyHeader`: sticky thead
    - `stackOnMobile`: block rows with `dataLabel` on cells
- Badge
  - Variants: `default`, `primary`, `secondary`, `success`, `danger`, `warning`, `info`, `outline`
- Tabs
  - `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent`
- Progress
  - Sizes: `sm`, `md`, `lg`

## Dialog + Feedback

- Modal
  - Focus trap, ESC close, overlay click close
  - ARIA: pass `ariaLabelledby` / `ariaDescribedby` when possible
- ToastProvider
  - Live region announcements
  - Max 3 stacked toasts
  - Use `useToast().addToast({ variant, message })`

## Token Usage

Prefer tokenized classes:
- Colors: `bg-primary`, `text-text-primary`, `border-border`
- Radius: `rounded-sm`, `rounded-md`
- Shadow: `shadow-card`, `shadow-elevated`
