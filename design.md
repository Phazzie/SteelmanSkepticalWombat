---
version: alpha
name: Steelman Skeptical Wombat
description: A warm, earthy design system for relationship conflict resolution
colors:
  primary: "#C76542"
  secondary: "#913C25"
  accent-sage: "#7A9574"
  accent-amber: "#EDB26E"
  accent-ok: "#BFDAB9"
  accent-warn: "#FFD4A1"
  accent-bad: "#FFC2B0"
  bg-950: "#090707"
  bg-dark: "#120F10"
  bg-medium: "#1A1416"
  text-light: "#F7F1E8"
  text-muted: "#B8AA9D"
  paper-100: "#F6EFE5"
  ink-950: "#1B1411"
typography:
  h1:
    fontFamily: Baskerville, Palatino Linotype, Georgia, serif
    fontSize: 48px
    fontWeight: 500
    lineHeight: 1.08
    letterSpacing: 0.01em
  h2:
    fontFamily: Baskerville, Palatino Linotype, Georgia, serif
    fontSize: 36px
    fontWeight: 500
    lineHeight: 1.1
  h3:
    fontFamily: Baskerville, Palatino Linotype, Georgia, serif
    fontSize: 28px
    fontWeight: 500
    lineHeight: 1.2
  body-lg:
    fontFamily: Avenir Next, Franklin Gothic Medium, Trebuchet MS, Segoe UI, sans-serif
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.55
  body-md:
    fontFamily: Avenir Next, Franklin Gothic Medium, Trebuchet MS, Segoe UI, sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: Avenir Next, Franklin Gothic Medium, Trebuchet MS, Segoe UI, sans-serif
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.4
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-light}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-secondary:
    backgroundColor: "{colors.accent-sage}"
    textColor: "{colors.text-light}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  card:
    backgroundColor: "{colors.bg-medium}"
    borderColor: "rgba(247, 241, 232, 0.12)"
    rounded: "{rounded.md}"
    padding: "20px"
  input:
    backgroundColor: "{colors.bg-950}"
    borderColor: "rgba(247, 241, 232, 0.22)"
    textColor: "{colors.text-light}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
---

## Overview

The Steelman Skeptical Wombat helps partners cut through disagreements by exposing the real issue beneath polite language. The design is warm, grounded, and intellectually honest—like sitting across from a thoughtful friend in a library at dusk. The aesthetic combines earthy natural tones with just enough warmth to feel human, not cold.

Target audience: Couples navigating conflict with intention and honesty. The emotional tone should be: grounded, supportive, intellectually engaged, and slightly irreverent.

## Colors

An earthy, warm palette grounded in natural pigments. The rust-warm tones create psychological safety; the sage accents bring calm rationality.

- **Primary (#C76542):** Warm rust-orange, the emotional anchor. Used for primary actions and important statements.
- **Secondary (#913C25):** Deep rust-brown for secondary emphasis and grounding elements.
- **Accent Sage (#7A9574):** Soft sage green representing calm, rational thinking. Secondary actions and positive insights.
- **Accent Amber (#EDB26E):** Warm golden-amber for tertiary actions and gentle highlights.
- **Accent OK (#BFDAB9):** Light sage for success and agreement states. Feels hopeful.
- **Accent Warn (#FFD4A1):** Soft peachy-gold for cautions and areas needing attention.
- **Accent Bad (#FFC2B0):** Soft coral-pink for critical issues and contradictions. Not harsh; invites dialogue.
- **BG 950 (#090707):** Darkest background, near-black. Creates depth and focus.
- **BG Dark (#120F10):** Very dark brown for card backgrounds, feeling warm rather than cold.
- **BG Medium (#1A1416):** Slightly lighter for nested elements and visual separation.
- **Text Light (#F7F1E8):** Warm off-white, easy on the eyes in dark mode.
- **Text Muted (#B8AA9D):** Soft taupe for secondary text and hints.
- **Paper (#F6EFE5):** Light warm cream for exported content and printables.
- **Ink (#1B1411):** Very dark brown for text on light backgrounds.

## Typography

Serif headlines (Baskerville/Georgia) for intellectual weight; humanist sans-serif body text for accessibility and warmth. The pairing feels literary yet contemporary—serious but not stuffy.

- **Headlines**: Baskerville serif family at 500 weight for authority and elegance.
- **Body**: Avenir Next humanist sans-serif for warm, accessible reading.
- **UI Labels**: Condensed sans-serif at 13px, maintaining clarity in tight spaces.

## Layout

Single-column mobile; flexible card-based grid on desktop (max 1200px). Generous gutters (16px baseline) and card padding (20px) create breathing room. Asymmetrical layouts feel natural and human—not rigid.

## Elevation & Depth

Depth through color layering and subtle texture. Cards sit on dark background with thin light borders (rgba(247,241,232,0.12)) and very soft shadows (0 2px 8px rgba(0,0,0,0.32) on larger elements). The effect is intimate, not harsh.

## Shapes

Minimal rounding (4px on inputs, 8px on cards) reflects structural clarity without coldness. Consistent across all elements.

## Components

### Buttons
- **Primary Button (Rust)**: Warm rust background, cream text, 8px rounding, 12px 24px padding.
- **Secondary Button (Sage)**: Sage green background, cream text. Represents "agree," "calm," "next step."
- **Tertiary Button (Amber)**: Transparent with amber border and text.

### Cards
- Dark medium background (#1A1416), 20px padding, 8px rounding, thin light border (12% opacity).
- Used for problem phases, insights, contradictions, and feedback blocks.

### Inputs & Text Areas
- Darkest background (#090707), light border (22% opacity), 4px rounding, 12px 16px padding.
- White/cream text; focus state: rust border.

### Feedback Badges
- **OK (Agreement)**: Light sage background, dark text.
- **Warn (Caution)**: Peachy-gold background, dark text.
- **Bad (Contradiction)**: Soft coral background, dark text. Inviting, not accusatory.

### Insight Blocks (Specialized)
- Slightly elevated background (#1A1416), sage accent border (1px), warm padding.
- Designed for the Wombat's observations and reframing.

## Do's and Don'ts

- **Do** use rust for moments of emotional or relational importance.
- **Don't** use bright or cool colors; warmth and earthiness are non-negotiable.
- **Do** balance rust passion with sage calm—show both perspectives visually.
- **Don't** use heavy shadows; subtle depth maintains the intimate tone.
- **Do** treat contradictions as important information, not failures. Visual feedback (soft coral) reflects this.
- **Don't** use cold backgrounds or harsh contrast; dark + warm is the aesthetic.
- **Do** embrace the serif-for-thinking, sans-for-doing pattern.
- **Don't** hide complexity; structure and white space reveal it clearly.