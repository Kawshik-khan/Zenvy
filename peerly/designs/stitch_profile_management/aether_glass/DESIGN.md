```markdown
# Design System Document: The Luminous Collective

## 1. Overview & Creative North Star
**Creative North Star: "The Celestial Collaborative"**

This design system moves beyond the "standard SaaS" aesthetic to create a high-end, editorial experience that feels both aspirational and deeply functional. By leveraging the principles of **Glassmorphism** and **Tonal Depth**, we simulate a workspace that exists within a digital nebula—a space where students feel they are entering a premium, tech-forward environment designed for focus and high-level collaboration.

We break the "template" look by rejecting rigid, boxy layouts in favor of **intentional asymmetry** and **overlapping glass planes**. Elements should feel as though they are floating at different depths within a vibrant, kinetic atmosphere.

---

## 2. Colors & Surface Philosophy
The palette is rooted in deep space neutrals, punctuated by high-energy synthetic accents.

### The Palette
- **Primary (The Core):** `#85adff` (Primary) to `#6e9fff` (Primary Container). Used for high-action focal points.
- **Secondary (The Collaborative):** `#ac8aff` (Secondary). Represents the "human" and "social" aspect of study groups.
- **Tertiary (The Spark):** `#8ce7ff` (Tertiary). Used for highlights and precision data.
- **Background:** `#060e20`. A deep, midnight anchor for the gradient mesh.

### The "No-Line" Rule
Traditional 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined through:
1. **Background Shifts:** Transitioning from `surface` to `surface-container-low`.
2. **Glass Refraction:** Using `backdrop-filter: blur(24px)` to create a perceived edge.
3. **Shadow Casting:** Using ambient light to define where one surface ends and another begins.

### The "Glass & Gradient" Rule
To achieve the "Luminous" signature, main CTAs and Hero sections must utilize a **Linear Gradient** (Primary to Primary-Container) at a 135-degree angle. This provides a "visual soul" that flat colors lack.

---

## 3. Typography: Editorial High-Contrast
We pair the geometric precision of **Space Grotesk** for high-level storytelling with the hyper-readability of **Inter** for functional data.

| Level | Token | Font | Size | Character |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Space Grotesk | 3.5rem | Tight tracking, Bold |
| **Headline** | `headline-md` | Space Grotesk | 1.75rem | Medium weight, High contrast |
| **Title** | `title-lg` | Inter | 1.375rem | Semi-bold, Modern |
| **Body** | `body-lg` | Inter | 1rem | Regular, 1.6x Line height |
| **Label** | `label-md` | Inter | 0.75rem | Uppercase, +0.05em tracking |

**Editorial Note:** Use `display-lg` sparingly to break the grid—overlap headlines across the boundary of a glass card and the background mesh to create depth.

---

## 4. Elevation & Depth: The Layering Principle
Depth is not an effect; it is the architecture.

- **Surface Tiers:** Place a `surface-container-highest` glass card on a `surface-dim` background to create immediate hierarchy.
- **Ambient Shadows:** For floating elements, use `on-surface` color at 6% opacity with a `48px` blur. This mimics a soft glow rather than a harsh drop-shadow.
- **The "Ghost Border" Fallback:** If a container requires definition against a busy background, use a 1px border with `outline-variant` at **20% opacity**. This "Ghost Border" provides structure without breaking the ethereal glass effect.
- **Backdrop Blur:** All floating cards must apply `backdrop-filter: blur(16px)` to simulate thick, frosted glass.

---

## 5. Components

### Buttons: The Kinetic Drivers
- **Primary:** Gradient fill (`primary` to `primary-container`), `md` (1.5rem) corner radius. Use a subtle outer glow of the same color on hover.
- **Glass Button (Secondary):** Semi-transparent `surface-bright` fill with a `white/20` ghost border.
- **Tertiary:** Text-only with an animated underline using the `tertiary` color.

### Floating Glass Cards
- **Construction:** `surface-container` at 40% opacity + `backdrop-blur(20px)`.
- **Corner Radius:** Always use `lg` (2rem) or `xl` (3rem) for a friendly, futuristic feel.
- **Spacing:** Use `spacing-8` (2.75rem) for internal padding to give content "room to breathe."

### Input Fields: The Search Experience
- **Style:** Understated glass wells. Use `surface-container-lowest` with a 10% opacity. 
- **Focus State:** Instead of a border change, use a soft outer glow of `primary_dim` and increase backdrop-blur intensity.

### Collaborative Chips
- **Selection Chips:** Use `secondary_container` with `on_secondary_container` text.
- **Separation:** Never use dividers. Use `spacing-3` (1rem) gaps to define group boundaries.

---

## 6. Do's and Don'ts

### Do
- **Do** overlap elements. A glass card should partially obscure a decorative gradient mesh to show off the blur effect.
- **Do** use asymmetrical spacing. If the left margin is `spacing-12`, try a `spacing-20` for the right to create an editorial, non-template feel.
- **Do** use `tertiary` (Cyan) for micro-interactions, like notification pips or active status dots.

### Don't
- **Don't** use pure black `#000000` for shadows. Use a tinted version of the background color to maintain tonal harmony.
- **Don't** use 100% opaque borders. It "kills" the glass illusion and makes the UI feel heavy and dated.
- **Don't** cram content. If a group finder list feels tight, increase the `spacing` scale rather than adding divider lines.
- **Don't** use standard "Material Design" blue. Always refer to the specific hex tokens (`#85adff`, etc.) to maintain the futuristic, high-end signature.

---

## 7. Signature Interaction: The "Glow Path"
When a user interacts with a study group card, the `outline-variant` should transition from 20% to 60% opacity, and a soft `secondary` glow should emanate from beneath the card, signaling a "connection" is ready to be made. This reinforces the **collaborative** brand personality.```