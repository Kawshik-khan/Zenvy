# Design System Document

## 1. Overview & Creative North Star: "The Ethereal Architect"

This design system is engineered to move beyond the rigid, boxy constraints of traditional SaaS dashboards. Our Creative North Star, **"The Ethereal Architect,"** envisions a UI that feels less like a software interface and more like a high-end physical command center carved from light and obsidian. 

We achieve a signature "Editorial" feel by embracing **intentional asymmetry** and **tonal depth**. Rather than relying on standard grids, we use expansive breathing room (utilizing the `20` and `24` spacing tokens) and overlapping glass layers to create a sense of infinite space. By rejecting heavy borders and solid containers in favor of light-refractive surfaces, we ensure the application feels premium, futuristic, and authoritative.

---

## 2. Colors & Surface Logic

Our palette is rooted in deep space tonalities, using high-chroma accents to guide the user’s eye through complex data landscapes.

### Surface Hierarchy & The "No-Line" Rule
To maintain a high-end aesthetic, **1px solid opaque borders are strictly prohibited for sectioning.** Boundaries must be defined through:
- **Tonal Shifts:** Transitioning from `surface` (#060e20) to `surface_container_low` (#091328).
- **Glass Refraction:** Using the `rgba(255, 255, 255, 0.12)` formula with a `backdrop-filter: blur(12px)`.

### Surface Tiers
Treat the UI as a series of nested physical layers:
- **Base Layer:** `surface` (#060e20) – The foundation of the viewport.
- **Sectional Layer:** `surface_container` (#0f1930) – Use for large sidebar or navigation areas.
- **Interaction Layer:** `surface_container_highest` (#192540) – Use for active states or nested content cards.

### The Glass & Gradient Rule
CTAs and hero elements must possess "visual soul." Instead of flat fills, use subtle linear gradients:
- **Primary Action:** From `primary` (#a8a4ff) to `primary_dim` (#675df9) at a 135° angle.
- **Accent Glow:** Use `tertiary` (#5efde7) with a 20% opacity radial gradient to highlight key data points.

---

## 3. Typography: The Editorial Scale

We pair the technical precision of **Inter** with the avant-garde personality of **Space Grotesk** to create a sophisticated typographic voice.

| Level | Token | Font | Size | Character |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Space Grotesk | 3.5rem | Dramatic, rhythmic, futuristic. |
| **Headline**| `headline-md` | Space Grotesk | 1.75rem | Authoritative headers. |
| **Title**   | `title-lg` | Inter | 1.375rem | Semantic clarity for card titles. |
| **Body**    | `body-md` | Inter | 0.875rem | High readability, generous tracking. |
| **Label**   | `label-sm` | Inter | 0.6875rem | Uppercase with +0.05em letter spacing. |

**Hierarchy Note:** Use `on_surface_variant` (#a3aac4) for secondary body text to ensure the `display` and `headline` levels (in #dee5ff) command the most visual attention.

---

## 4. Elevation & Depth

Hierarchy is achieved through **Tonal Layering** and light physics rather than drop shadows.

- **The Layering Principle:** Depth is created by stacking containers. A `surface_container_lowest` card placed on a `surface_container_low` background creates a natural "sunken" effect that feels integrated into the hardware.
- **Ambient Shadows:** For floating elements (modals/tooltips), use a tinted shadow: `0px 24px 48px rgba(0, 0, 0, 0.4)`. Avoid grey shadows; ensure the shadow inherits the deep blue hue of the background.
- **The Ghost Border:** When containment is required for accessibility, use a "Ghost Border": `outline_variant` (#40485d) at **20% opacity**. This provides a hint of structure without breaking the ethereal aesthetic.
- **Glassmorphism:** All "Glass Cards" must utilize the `lg` (2rem) corner radius. The border should be a top-down linear gradient from `rgba(255,255,255,0.2)` to `rgba(255,255,255,0.05)` to simulate a light source from above.

---

## 5. Component Signatures

### Buttons
- **Primary:** `primary` fill, `on_primary` text. `full` rounded corners. Add a soft outer glow (`primary` at 30% opacity) on hover.
- **Tertiary (Ghost):** No fill. `primary` text. Use for low-priority actions like "Cancel" or "Learn More."

### Input Fields
- **Styling:** `surface_container_high` fill with a `sm` (0.5rem) radius. 
- **Active State:** Border transitions to `secondary` (#44a3f5) with a 10% opacity glow. Forbid the use of standard blue focus rings; use a subtle internal inset shadow to show focus.

### Cards & Lists
- **The No-Divider Rule:** Never use horizontal lines to separate list items. Use the `spacing-4` (1.4rem) token to create white space or alternating background shifts between `surface_container` and `surface_container_low`.
- **Data Visuals:** Charts should utilize the `secondary` (#44a3f5) and `tertiary` (#5efde7) tokens, utilizing 2px strokes with soft glows to mimic neon filaments.

### Chips
- **Status Chips:** Small, `full` rounded caps. Success uses `on_tertiary_container` text on a `tertiary_container` background with 10% opacity.

---

## 6. Do’s and Don’ts

### Do:
- **Use Asymmetry:** Offset your headline from the main body copy to create an editorial, "magazine" feel.
- **Embrace Negative Space:** Use `spacing-16` and `spacing-20` to allow the "Glass Cards" to breathe.
- **Tint Your Neutrals:** Always ensure muted text and borders have a hint of blue/purple to stay within the atmospheric theme.

### Don’t:
- **Don't use 100% Opaque Borders:** This destroys the "Ethereal Architect" aesthetic and makes the UI look like a template.
- **Don't use Pure Black:** Use `surface_container_lowest` (#000000) only for the deepest shadows, never for text or primary backgrounds.
- **Don't Over-Glow:** Glow effects should be reserved for interactive states (hover/active) or critical success/error messages. If everything glows, nothing is important.