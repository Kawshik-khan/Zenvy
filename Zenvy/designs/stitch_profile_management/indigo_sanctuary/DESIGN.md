# Design System Specification: Academic Etherealism

## 1. Overview & Creative North Star: "The Digital Curator"
This design system rejects the "boxed-in" aesthetic of standard SaaS templates. Our Creative North Star is **"The Digital Curator"**—a philosophy that treats a student study group finder not as a utility tool, but as a focused, high-end editorial experience. 

By utilizing intentional asymmetry, sweeping white space, and tonal depth, we move away from the "grid of grey boxes" and toward a layered, breathable environment. We prioritize intellectual focus through **Soft Minimalism**, where the UI recedes to let collaborative content shine. The goal is a "Sanctuary" effect: calming, authoritative, and frictionless.

---

## 2. Color & Surface Architecture
We move beyond flat hex codes to a system of **Tonal Primaries**. The palette is designed to feel "lit from within" rather than painted on.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning content. Boundaries must be defined solely through background color shifts or subtle tonal transitions. For example, a `surface-container-low` section should sit directly on a `surface` background to define its edges.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, semi-transparent layers rather than a flat canvas.
- **Base Layer:** `surface` (#f7f9fb)
- **Secondary Sectioning:** `surface-container-low` (#f2f4f6)
- **High-Emphasis Cards:** `surface-container-lowest` (#ffffff)
- **Active/Hover States:** `surface-container-high` (#e6e8ea)

### The Glass & Gradient Rule
To provide a signature "soul" to the interface:
- **Hero Backgrounds:** Use a subtle linear gradient from `primary` (#4648d4) to `primary-container` (#6063ee) at a 135° angle.
- **Floating Elements:** Navigation bars and modal overlays must utilize **Glassmorphism**. Apply `surface` at 80% opacity with a `24px` backdrop-blur to allow background colors to bleed through softly.

---

## 3. Typography: Editorial Authority
We use **Inter** not just for legibility, but as a structural element. 

| Token | Size | Weight | Role |
| :--- | :--- | :--- | :--- |
| **display-lg** | 3.5rem | 700 | Hero moments; high-impact headlines. |
| **headline-md** | 1.75rem | 600 | Section headers; emphasizes group categories. |
| **title-sm** | 1rem | 600 | Card titles; navigational elements. |
| **body-lg** | 1rem | 400 | Primary reading text; study group descriptions. |
| **label-md** | 0.75rem | 500 | Metadata (e.g., "3 Spots Left," "Calculus II"). |

**Editorial Note:** Use `display-lg` with tight letter-spacing (-0.02em) to create a premium, authoritative look. Pair it with generous `body-lg` line heights (1.6) to ensure the "Sanctuary" feels spacious and non-claustrophobic.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are often "dirty." In this system, we use **Ambient Shadows** and **Tonal Stacking**.

- **The Layering Principle:** Avoid elevation shadows where possible. Instead, place a `surface-container-lowest` card (Pure White) on a `surface-container-low` background. This creates a natural "lift" through contrast alone.
- **Ambient Shadows:** When a float is required (e.g., a "Join Group" FAB), use: `0px 20px 40px rgba(70, 75, 214, 0.08)`. The shadow color must be a tinted version of the `primary` token, never pure black/grey.
- **The "Ghost Border" Fallback:** If a border is required for accessibility (e.g., input fields), use `outline-variant` (#c7c4d7) at **20% opacity**. 100% opaque borders are strictly forbidden.

---

## 5. Components

### Buttons & CTAs
- **Primary:** Gradient fill (`primary` to `primary_container`), `md` (0.75rem) roundedness. No border.
- **Secondary:** `secondary_fixed` background with `on_secondary_fixed` text.
- **Interaction:** On hover, apply a `4px` Y-axis lift and increase shadow spread.

### Cards & Lists
- **The Divider Rule:** Forbid the use of horizontal divider lines. Use `1.5rem` (spacing-6) of vertical white space to separate list items.
- **Group Cards:** Use `surface-container-lowest` with a `md` (0.75rem) corner radius. Instead of a border, use a 2px left-accent bar of `tertiary` (#006577) to denote the group category (e.g., STEM vs. Humanities).

### Input Fields
- **Styling:** Use `surface_container_low` as the background. No border.
- **Focus State:** Transition background to `surface_container_lowest` and apply a 2px "Ghost Border" using `primary` at 30% opacity.

### Selection Chips
- **Action Chips:** Use `secondary_fixed_dim` for the background.
- **Active State:** Shift to `tertiary_container` with `on_tertiary_container` text for high-contrast feedback.

---

## 6. Do’s and Don'ts

### Do
- **DO** use white space as a functional tool to group related content.
- **DO** overlap elements (e.g., a card slightly overlapping a hero gradient) to create depth.
- **DO** use `tertiary` (#006577) for "success" or "positive" metaphors instead of a generic green.

### Don't
- **DON'T** use 1px solid borders to separate sections.
- **DON'T** use pure black (#000000) for text. Use `on_surface` (#191c1e) to maintain the soft editorial tone.
- **DON'T** use "Standard" drop shadows. If it looks like a default CSS shadow, it is wrong.
- **DON'T** crowd the layout. If in doubt, increase the spacing by one tier (e.g., from `spacing-4` to `spacing-5`).