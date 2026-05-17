---
name: Kinetic Broadcast
colors:
  surface: '#0c1324'
  surface-dim: '#0c1324'
  surface-bright: '#33394c'
  surface-container-lowest: '#070d1f'
  surface-container-low: '#151b2d'
  surface-container: '#191f31'
  surface-container-high: '#23293c'
  surface-container-highest: '#2e3447'
  on-surface: '#dce1fb'
  on-surface-variant: '#bacac5'
  inverse-surface: '#dce1fb'
  inverse-on-surface: '#2a3043'
  outline: '#859490'
  outline-variant: '#3c4a46'
  surface-tint: '#3cddc7'
  primary: '#57f1db'
  on-primary: '#003731'
  primary-container: '#2dd4bf'
  on-primary-container: '#00574d'
  inverse-primary: '#006b5f'
  secondary: '#ffb95f'
  on-secondary: '#472a00'
  secondary-container: '#ee9800'
  on-secondary-container: '#5b3800'
  tertiary: '#ffceca'
  on-tertiary: '#68000a'
  tertiary-container: '#ffa7a0'
  on-tertiary-container: '#9e0016'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#62fae3'
  primary-fixed-dim: '#3cddc7'
  on-primary-fixed: '#00201c'
  on-primary-fixed-variant: '#005047'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#0c1324'
  on-background: '#dce1fb'
  surface-variant: '#2e3447'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 72px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  body-md:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.15em
  mono-data:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  container-max: 1440px
---

## Brand & Style

This design system is engineered for the high-octane environment of esports and live data broadcasting. The brand personality is aggressive, precise, and immersive, drawing heavily from cinematic "Heads-Up Display" (HUD) aesthetics and advanced telemetry interfaces. 

The visual style is a hybrid of **Glassmorphism** and **High-Contrast Digital**, utilizing translucent panels to maintain depth while employing neon "blooms" to draw attention to critical data points. The interface should feel like a premium command center—dark, focused, and alive with kinetic energy. Every element must appear functional, as if it were a component of a real-time tactical overlay.

## Colors

The palette is anchored by **Deep Obsidian (#020617)**, providing a void-like canvas that allows vibrant accent colors to "pop" with holographic intensity. 

- **Primary (Neon Teal):** Used for active states, primary actions, and "healthy" data streams. It represents the core energy of the interface.
- **Secondary (Electric Amber):** Reserved for warnings, mid-tier alerts, and high-importance telemetry.
- **Tertiary (Crimson Red):** Strictly for critical errors, system failures, or opponent-related data in a competitive context.
- **Success (Soft Green):** Utilized for confirmations and positive progress indicators.

To achieve the "Neon Bloom" effect, accent colors should be applied with 20-40% opacity glows (box-shadows) to simulate light emitting from the screen.

## Typography

This design system utilizes **Space Grotesk** across all roles to maintain a technical, geometric consistency. 

- **Display & Headlines:** Should be set with tight tracking and heavy weights to command authority.
- **Labels:** Use the `label-caps` style for metadata and UI furniture. The increased letter-spacing is essential for the "technical readout" aesthetic.
- **Data Points:** Numbers and telemetry should use the `mono-data` style to ensure legibility and visual alignment in dense tables or HUD overlays.
- **Mobile scaling:** Headlines should aggressively downscale to ensure full-word visibility on narrower viewports, maintaining the "compact" feel of a mobile terminal.

## Layout & Spacing

The layout follows a **12-column fluid grid** system with a technical 4px base unit. 

- **Density:** Information density should be high. Space is a luxury, but clarity is the priority. Use margins to group modules into "functional zones."
- **Grid Modules:** UI elements should be housed in distinct modular containers. On desktop, sidebars are typically fixed to simulate a dashboard, while the center content fluidly scales.
- **Breakpoints:** 
  - Mobile (<768px): Single column, stack all HUD modules. 
  - Tablet (768px - 1024px): 2-column layout for side-by-side data comparison.
  - Desktop (>1024px): Full 12-column spread with persistent navigation and telemetry rails.

## Elevation & Depth

Depth in this design system is achieved through **Glassmorphism** rather than traditional drop shadows.

- **Background Layers:** The base is a solid #020617.
- **Surface Layers:** Use semi-transparent fills (e.g., `rgba(255, 255, 255, 0.03)`) with a high `backdrop-filter: blur(12px)`. 
- **Borders:** Instead of shadows, use 1px "inner-glow" borders. Use a top-left oriented linear gradient for borders (from 20% white to 0% white) to simulate a light source hitting the edges of a glass pane.
- **HUD Scanlines:** A global overlay of subtle horizontal scanlines (0.05 opacity) should be applied to the primary background to reinforce the broadcast monitor feel.

## Shapes

The shape language is sharp and industrial. While the base roundedness is `1` (Soft, 4px), this is intended to prevent the UI from feeling "sharp" or "dangerous" while maintaining a precise, manufactured look.

- **Chamfered Corners:** Where possible, use 45-degree "clipped" corners for primary buttons and status indicators to mimic military-grade hardware.
- **Dividers:** Use thin, 1px lines with low-opacity glows.
- **Interactive Elements:** Buttons and inputs should maintain a consistent 4px radius, but "active" states can trigger a "glitch" expansion where borders extend slightly beyond the element's container.

## Components

- **Buttons:** Primary buttons feature a solid Teal fill with a `text-shadow` for the label and a `box-shadow` neon bloom. Secondary buttons are "ghost" style with a 1px Teal border and a subtle glass background.
- **Chips / Status Tags:** Small, high-contrast pills. For "Live" status, include a 2px pulsing dot using the Crimson Red palette.
- **Input Fields:** Bottom-border only or very subtle glass fill. On focus, the bottom border should transition from a dim grey to a vibrant Neon Teal with a glowing underline.
- **Cards/Modules:** Every card must have a `backdrop-filter: blur()`. Headers of cards should have a distinct, slightly darker background or a "label-caps" header row.
- **Telemetry Bars:** Progress bars or data visualizations should use segmented "blocks" rather than a smooth continuous fill to emphasize the digital, bit-mapped nature of the system.
- **HUD Navigation:** Side navigation should use vertical icons with abbreviated labels in the `label-caps` style, glowing only when active or hovered.