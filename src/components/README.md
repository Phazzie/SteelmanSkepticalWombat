# Component Architecture

This directory contains all the React components for the application. The structure is designed to be clear and scalable.

## Component Philosophy

We categorize components into two main types: **Phases** and **UI**.

### 1. Phase Components (`./phases`)

A "phase" represents a distinct step or screen in the user's journey of resolving a problem. These components are typically stateful and orchestrate the main interactions for that specific stage.

*   **Location:** `src/components/phases/`
*   **Examples:** `PhaseSteelman.tsx`, `PhaseAIReview.tsx`, `PhaseResolved.tsx`
*   **Characteristics:**
    *   Often map directly to a "step" in the `ProgressBar`.
    *   Responsible for fetching data and calling AI service functions relevant to that phase.
    *   Compose smaller, reusable `ui` components to build their view.

### 2. UI Components (`./ui`)

"UI" components are general-purpose, reusable building blocks. They should be as stateless and generic as possible to be used across different phases.

*   **Location:** `src/components/ui/`
*   **Examples:** `ProgressBar.tsx`, `WombatAvatar.tsx`, `DraftTextarea.tsx`
*   **Characteristics:**
    *   Receive data and callbacks via props.
    *   Should not contain business logic specific to any single phase.
    *   Should not directly call AI or Firebase services.

## Adding a New Component

*   **Is it a major screen in the user's journey?** Add it to `phases`.
*   **Is it a reusable element like a button, input, or avatar?** Add it to `ui`.

This separation helps keep our application logic organized and promotes reusability.
