# Design System Strategy: The Academic Sanctuary

This document outlines the visual and structural language for a high-end Student Study Group Finder. Moving beyond the "generic SaaS" aesthetic, this system prioritizes focus, cognitive ease, and a premium editorial feel that mirrors the quiet sophistication of a modern university library.

---

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Commons"**
The design system rejects the "box-within-a-box" rigidity of legacy educational software. Instead, it adopts an editorial, layered approach inspired by high-end productivity tools. By utilizing intentional asymmetry, expansive breathing room (whitespace), and soft-touch surfaces, we create a "sanctuary" for focus. 

The layout breaks the template look by treating the sidebar not as a separate utility, but as a grounded anchor for floating, glass-like content cards that overlap and breathe.

---

## 2. Colors: Tonal Depth & Soul
Our palette transitions from a stable Indigo (`primary: #4647d3`) to a visionary Violet (`secondary: #6a37d4`). This isn't just a color choice; it’s a functional hierarchy.

### The "No-Line" Rule
**Strict Mandate:** 1px solid borders are prohibited for sectioning. 
Structure must be defined through background shifts. For example, a `surface-container-low` (`#eef1f3`) sidebar sitting against a `surface` (`#f5f7f9`) main stage. Content is separated by depth, not lines.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, fine-paper sheets:
- **Base Layer:** `surface` (#f5f7f9) for the global background.
- **Section Layer:** `surface-container` (#e5e9eb) for large structural areas.
- **Content Layer:** `surface-container-lowest` (#ffffff) for primary cards.
- **Interaction Layer:** `surface-bright` (#f5f7f9) for hovered states.

### The "Glass & Gradient" Rule
To inject "soul" into the UI, use the **Signature Gradient** (`primary` to `secondary`) for high-impact CTAs and progress indicators. For floating overlays (modals or popovers), apply `surface-container-lowest` at 80% opacity with a `backdrop-filter: blur(20px)` to create a frosted glass effect that keeps the student tethered to their context.

---

## 3. Typography: The Editorial Voice
We use **Inter** exclusively, but we treat it with editorial intent. The contrast between massive `display` sizes and tight `label` sizes creates an authoritative, modern hierarchy.

- **Display & Headlines:** Use `display-md` (2.75rem) for welcome states (e.g., "Find your tribe.") with a `-0.02em` letter-spacing to feel premium.
- **Body & Labels:** Use `body-md` (0.875rem) for most content to maximize information density without clutter.
- **The Brand Voice:** Headlines use `on-surface` (#2c2f31), while secondary metadata uses `on-surface-variant` (#595c5e). This 30% drop in contrast guides the eye to what matters first.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are heavy; we use **Ambient Light Simulation**.

- **The Layering Principle:** Instead of a shadow, place a `surface-container-lowest` (#ffffff) card on a `surface-container-low` (#eef1f3) background. The 4% difference in luminosity creates a "soft lift" that feels natural.
- **Ambient Shadows:** For "Floating" elements (Active Study Group cards), use a shadow: `0 20px 40px rgba(70, 71, 211, 0.06)`. Note the tint—we use a 6% opacity of our `primary` color, not black.
- **The "Ghost Border":** If a button or input needs definition on a white background, use `outline-variant` (#abadaf) at **15% opacity**. It should be felt, not seen.

---

## 5. Components: Soft & Intentional

### Cards (The Core Unit)
- **Styling:** Use `roundedness-lg` (2rem) for main containers and `roundedness-DEFAULT` (1rem) for internal elements.
- **Rule:** Forbid divider lines. Use `spacing-8` (2rem) of vertical whitespace to separate header from body content.

### Buttons
- **Primary:** A linear gradient from `primary` (#4647d3) to `secondary` (#6a37d4). Text is `on-primary` (#f4f1ff). Radius: `full`.
- **Secondary:** `primary-container` (#9396ff) with `on-primary-container` (#0a0081) text. No border.

### Sidebar Navigation
- **Active State:** Instead of a highlight box, use a vertical "pill" indicator (4px wide) in `primary` and shift the icon color to `primary`.
- **Background:** `surface-container-low` (#eef1f3).

### Study Group "Chips"
- **Status:** Use `tertiary-container` (#ff8ed2) for "Active Now" indicators. The high-chroma pink acts as a "look at me" signal against the calm grays and indigos.

---

## 6. Do's and Don'ts

### Do
- **Do** use `roundedness-xl` (3rem) for large hero images or decorative containers to emphasize the "soft" brand personality.
- **Do** lean into `on-surface-variant` for "supporting" text to reduce visual noise.
- **Do** use `spacing-12` (3rem) for outer page margins to give the content room to breathe.

### Don't
- **Don't** use `#000000` for text. Always use `on-surface` (#2c2f31) to maintain a premium, ink-on-paper feel.
- **Don't** use standard 4px or 8px border radii. This system requires `DEFAULT` (1rem) or higher to achieve its signature friendliness.
- **Don't** use dividers. If you feel the need to "separate" two items, increase the `spacing` token or shift the `surface-container` tier.

---

## 7. Accessibility Note
While we use soft grays and tonal shifts, ensure that all `on-surface` text against `surface` containers maintains a contrast ratio of at least 4.5:1. For critical actions, the `primary` Indigo (#4647d3) is our anchor for AAA compliance.