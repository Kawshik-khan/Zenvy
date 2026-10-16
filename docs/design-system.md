# Zenvy Brutal — design system

Soft Neubrutalism: flat colour, 3px ink edges, hard offset shadows, a tactile press.
**Loud** for connecting with people (landing, matching, dashboard, jobs); **quiet** for doing
the work (focus, calls, long chat threads).

- Live reference: `/ui` (dev server, or any build with `UI_GALLERY=true`)
- Design canvas: [Zenvy Neubrutalism UI](https://claude.ai/artifact/PB673C1RhKVFdDrzTFSfwD)
- Source: tokens in `app/globals.css`, components in `components/ui/`

## Rules

1. Use `components/ui` first. Reach for raw Tailwind only for layout (flex, grid, gap, spacing).
2. Never write hex colours in `className` or inline styles. Use the tokens below.
3. Text on any accent fill is **ink**. `textOn(tone)` returns the right class; never put two
   `text-*` colour classes on one element (Tailwind's stylesheet order decides, not class order).
4. Each accent means one thing. Don't use `match` pink for a jobs button.
5. Every interactive element: a real `<button>`/`<a>`/`<input>`, at least 44px tall, `nb-focus` ring.
   Icon-only buttons use `IconButton` (its `label` prop is required).
6. Don't add new glass, blur or gradient styles. The old `glass-*`, `app-*` classes and the
   Material Symbols font are being removed screen by screen.

## Tokens

### Palette (layer 1)

| Token | Hex | Meaning | Tailwind |
|---|---|---|---|
| paper | `#fff8ec` | Page ground | `bg-paper` |
| ink | `#111111` | Text, edges, shadows | `bg-ink`, `text-ink` |
| match | `#ff6b9d` | People, matching | `bg-match` |
| chat | `#4d96ff` | Messages, focus ring | `bg-chat` |
| focus | `#ffd23f` | Timers, streaks | `bg-focus` |
| live | `#3ddc97` | Online, calls, success | `bg-live` |
| alert | `#ff5a36` | Errors, leave, deadlines | `bg-alert` |
| career | `#b794f6` | Jobs | `bg-career` |
| muted | `#4a4a4a` | Secondary text | (use `text-fg-muted`) |
| quiet-paper / quiet-card / quiet-ink | `#f4eee2` / `#fbf8f1` / `#2b2b2b` | Quiet volume | (via `.quiet`) |

Ink on every accent and every text pair above passes WCAG AA (4.5:1). This is
enforced by `components/ui/tokens.test.ts`, which also fails if `tokens.ts` and
`globals.css` drift apart.

### Semantic (layer 2): switch with `.quiet`

| Utility | Loud | Quiet |
|---|---|---|
| `bg-canvas` | paper | quiet-paper |
| `bg-card` | white | quiet-card |
| `text-fg` / `border-line` | ink | quiet-ink |
| `text-fg-muted` | muted | `#4f4a42` |
| `border-nb` | 3px solid line | 2px |
| `shadow-nb-sm` / `shadow-nb` / `shadow-nb-md` / `shadow-nb-lg` | 3 / 4 / 6 / 8px | 2.25 / 3 / 4.5 / 6px |

Wrap a whole screen (or section) in `className="quiet"` to switch volume.

### Shape, type, motion

| Utility | Value |
|---|---|
| `rounded-nb` / `rounded-nb-lg` | 10px / 14px (don't use `rounded-lg`/`rounded-xl`: the legacy theme overrides them to 2rem/3rem) |
| `font-grotesk` | Space Grotesk: all UI text |
| `font-jetbrains` | JetBrains Mono: timers, scores, stats, dates |
| `nb-press` | Hover lifts 2px, press sinks by the shadow offset; disabled under `prefers-reduced-motion` |
| `nb-focus` | 3px chat-blue outline on `:focus-visible` |

## Components (`components/ui`)

| Component | Use | Key props |
|---|---|---|
| `Button` | Actions | `variant`: primary · secondary · ghost · danger · match · chat · focus · live · career; `size` sm/md/lg; `loading`; `icon`; `fullWidth` |
| `ButtonLink` | Navigation styled as a button | Same as Button + `href` (next/link) |
| `IconButton` | Icon-only actions | `label` (required), `icon`, `variant`, `size` |
| `Card` | Any surface | `tone`, `shadow` none/sm/md/lg, `padding`, `as`, `interactive` |
| `CardHeader` | Coloured header band | `title`, `level`, `tone`, `action` |
| `Input`, `Textarea`, `Select` | Form fields with label, hint, error wired to ARIA | `id` (required), `label`, `hint`, `error` |
| `Checkbox` | Single checkbox with label | `id`, `label` |
| `Badge` | Static tag or label | `tone`, `size`, `shape` pill/label |
| `Chip` | Filter toggle (`aria-pressed`) | `selected`, `tone` |
| `Avatar`, `AvatarStack` | People, groups, orgs | `name`, `src`, `size`, `shape`, `presence`; stack `max` |
| `StatTile` | Dashboard numbers | `label`, `value`, `detail`, `tone`, `icon` |
| `ProgressBar` | Progress with `role="progressbar"` | `label` (required), `value`, `max`, `tone` |
| `EmptyState` | Nothing-here-yet panels | `title`, `description`, `icon`, `action` |

Icons: `lucide-react`, stroke style, passed as `icon` props.

### Still to come (Phase 1, next PR)

Radix-based `Dialog`, `Sheet`, `Popover`, `Tabs`, `Toast`; moving `Skeleton` into `components/ui`; `ImageDropzone`.
