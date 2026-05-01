---
name: Nocturnal Logic
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#d4c5ab'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#9c8f78'
  outline-variant: '#4f4632'
  surface-tint: '#fabd00'
  primary: '#ffe4af'
  on-primary: '#3f2e00'
  primary-container: '#ffc107'
  on-primary-container: '#6d5100'
  inverse-primary: '#785900'
  secondary: '#44e2cd'
  on-secondary: '#003731'
  secondary-container: '#03c6b2'
  on-secondary-container: '#004d44'
  tertiary: '#e9e6e6'
  on-tertiary: '#303030'
  tertiary-container: '#cdcaca'
  on-tertiary-container: '#565555'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdf9e'
  primary-fixed-dim: '#fabd00'
  on-primary-fixed: '#261a00'
  on-primary-fixed-variant: '#5b4300'
  secondary-fixed: '#62fae3'
  secondary-fixed-dim: '#3cddc7'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005047'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1b1b1c'
  on-tertiary-fixed-variant: '#474746'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-base:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  code-base:
    fontFamily: monospace
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
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
  sidebar-width: 240px
  gutter: 16px
  container-padding: 24px
  stack-xs: 4px
  stack-sm: 8px
  stack-md: 16px
---

## Brand & Style

The brand personality is rooted in high-performance utility and intellectual rigor. It is designed for developers who value local execution speed and data privacy above visual decoration. The emotional response is one of "focused control"—the interface should feel like a sophisticated instrument rather than a consumer app.

This design system employs a **Minimalist** style with a **Corporate / Modern** structure. It prioritizes information density and structural clarity, using thin lines and a strict grid to organize complex data. Every element serves a functional purpose, eschewing "fluff" like excessive padding or playful animations in favor of immediate feedback and high readability.

## Colors

The color palette is a "True Dark" scheme optimized for long-duration coding sessions. 

- **Primary:** A refined Owl-inspired Gold (#FFC107) used sparingly for critical actions, status indicators, and brand touchpoints.
- **Secondary:** A focused Teal (#2DD4BF) reserved for active code states, successful operations, and specialized AI interactions.
- **Neutral/Background:** The foundational layer is #121212, providing a deep, low-glare canvas. Surfaces and cards use #1E1E1E to create subtle depth.
- **Borders:** A consistent #333333 is used for all structural divisions, ensuring high-contrast boundaries without visual noise.

## Typography

This design system uses **Inter** for all UI elements to maintain a systematic, neutral appearance that does not distract from the content. 

For code blocks, data logs, and token counts, use the system's default **Monospace** font (e.g., Roboto Mono, JetBrains Mono, or SF Mono). Typography is set at a smaller-than-average scale to support high information density. 

- **Hierarchy:** Use `label-caps` for table headers and sidebar category labels.
- **Code:** Code should be rendered at 13px for optimal character-per-line counts in local panels.
- **Contrast:** Maintain pure white (#FFFFFF) for headlines and a muted gray (#A0A0A0) for secondary body text to reduce eye strain.

## Layout & Spacing

The layout is defined by a **fixed left sidebar** and a fluid main content area. This ensures that primary navigation is always accessible while the workspace expands to fit the developer's screen.

- **Grid:** A 12-column fluid grid is used for the main content area.
- **Rhythm:** Spacing follows a strict 4px baseline. Components are tightly packed to ensure as much data as possible is visible above the fold.
- **Sidebar:** The 240px sidebar is anchored to the left, containing high-level navigation, project selection, and system health monitors.
- **Density:** Use `stack-xs` for related input/label pairs and `stack-sm` for list items in data tables.

## Elevation & Depth

In this design system, depth is conveyed through **tonal layers** and **low-contrast outlines** rather than shadows. 

- **Level 0 (Background):** #121212 - The main application canvas.
- **Level 1 (Surface):** #1E1E1E - Used for cards, sidebars, and panels.
- **Level 2 (Overlay):** #252525 - Used for dropdown menus or modals.

Every surface is bounded by a 1px solid border (#333). Shadows are strictly reserved for temporary overlays (like tooltips or context menus) and should be sharp with low spread (e.g., `0px 4px 12px rgba(0,0,0,0.5)`).

## Shapes

The shape language is "Soft-Industrial." By using a **0.25rem (4px)** corner radius, the UI maintains a structured, rigorous feel that is slightly more modern than pure sharp corners without becoming "bubbly."

- **Buttons & Inputs:** 4px radius.
- **Cards & Panels:** 4px radius.
- **Selection States:** Subtle 2px radius for inner focus rings.
- **AI Surfaces:** Maintain the same 4px radius but are differentiated by border treatment rather than shape.

## Components

### Buttons & Inputs
Buttons should be flat. The primary action uses the Owl Gold background with black text. Secondary actions use the #333 border with no background. Inputs use #1E1E1E background with a #333 border, shifting to a Teal border on focus.

### Data Tables
Tables are the heart of the tool. Use high-density rows (32px height).
- **Header:** `label-caps` typography with #1E1E1E background.
- **Hover:** Rows should highlight with a subtle shift to #252525.
- **Borders:** Only horizontal borders are used to separate rows, maintaining a clean flow.

### AI Surfaces (✨)
Surfaces that are powered by AI or represent LLM output are marked with a subtle ✨ icon in the top-right corner. These areas use a very faint Teal gradient border (0.5px) or a subtle "noise" texture background to signal that the content is machine-generated.

### Cards & Metrics
Metric cards are used for token usage, latency, and local resource monitoring. They are flat, using Level 1 surfaces and `headline-md` for the primary value.

### Navigation Sidebar
The fixed sidebar uses icons with text labels. The active state is indicated by a primary Gold vertical bar (2px wide) on the far left of the item and a text color change to white.
