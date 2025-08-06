# Agent Instructions for The Skeptical Wombat

Hello, agent! This document provides instructions for working on this codebase. Your adherence to these guidelines is crucial for maintaining the project's integrity and unique personality.

## 1. The Skeptical Wombat Persona

The AI persona is the core of this application. It is not a generic, helpful assistant. It is **The Skeptical Wombat**.

**Core Principles:**
*   **Blunt & Direct:** The Wombat does not use "corporate speak" or therapy jargon. It cuts through politeness to get to the raw, underlying feeling or demand.
*   **Witty & Insightful:** The Wombat's analysis should be sharp, clever, and reveal a deeper truth the users might be missing. It should have a dry, sarcastic sense of humor.
*   **Not a Therapist:** The Wombat does not offer emotional support or validation. It provides logical, sometimes unconventional, analysis and solutions. It is skeptical of vague, feel-good answers.
*   **Pragmatic:** The Wombat focuses on what is real and what might actually work, even if the solution is strange or uncomfortable.

**Implementation:**
*   All AI prompts are located in `src/services/ai.ts`.
*   Every prompt MUST begin with a persona lock-in, reinforcing the Wombat's character.
*   When adding or modifying a prompt, ensure the language and goal align strictly with the persona.

## 2. Architectural Overview

The application's AI functionality is centralized for maintainability.

*   **AI Service Layer:** All interactions with the Google Gemini API are handled exclusively within `src/services/ai.ts`. No other file should make direct API calls.
*   **API Client:** The actual `fetch` call is encapsulated in the `callGemini` helper function within `ai.ts`. This is the single point of contact with the external API.
*   **Prompt Functions:** Each specific AI task (e.g., translating text, analyzing a problem) has its own dedicated function (e.g., `getTranslation`, `getAIAnalysis`). This function is responsible for constructing the exact prompt needed for that task.

## 3. How to Add a New AI Feature

When you need to add a new feature that uses the AI, follow this pattern:

1.  **Define the Goal:** What is the specific task the AI needs to perform? What is the Skeptical Wombat's take on this task?
2.  **Create a New Function in `ai.ts`:** Create a new, exported async function in `src/services/ai.ts`. Name it descriptively (e.g., `getNewInsight`).
3.  **Construct the Prompt:** Inside this new function, create a `prompt` constant.
    *   Start with the persona lock-in (e.g., `**Persona Lock-in:** You are The Skeptical Wombat...`).
    *   Clearly define the task, the inputs, and the desired output format.
    *   Use string interpolation to inject any dynamic data (e.g., `"${text}"`).
4.  **Call the Helper:** The function should return the result of calling the `callGemini(prompt)` helper function.
5.  **Integrate in the UI:** Call your new function from the relevant React component. Ensure you handle loading and error states gracefully in the UI.

By following these guidelines, you will help ensure that The Skeptical Wombat remains a consistent, effective, and unique tool.
