# The Skeptical Wombat

The Skeptical Wombat is a web application designed to help partners navigate disagreements by cutting through polite language and exposing the core of the issue with blunt, witty, and insightful AI-driven analysis.

## Getting Started

To get the project running locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Phazzie/skeptical-wombat.git
    cd skeptical-wombat
    ```

2.  **Install dependencies:**
    This project uses `npm` for package management.
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    You will need to create a `.env` file in the root of the project. You can copy the example file to start:
    ```bash
    cp .env.example .env
    ```
    Then, open the `.env` file and add your specific credentials. At a minimum, you will need:
    *   `VITE_GEMINI_API_KEY`: Your API key for the Google Gemini API.
    *   Firebase configuration keys (`VITE_FIREBASE_...`).

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## Key Technologies

*   **Frontend:** [React](https://react.dev/) with [Vite](https://vitejs.dev/) for a fast development experience.
*   **AI:** [Google Gemini](https://deepmind.google/technologies/gemini/) provides the language model powering the AI's analysis.
*   **Backend & Database:** [Firebase](https://firebase.google.com/) is used for backend services, including the database and user authentication.
*   **Styling:** Standard CSS.

## Project Structure

*   `src/`: Contains all the application source code.
*   `src/components/`: Houses all React components.
    *   `src/components/phases/`: Components that represent a specific "phase" of the user's journey through a problem.
    *   `src/components/ui/`: General-purpose, reusable UI elements.
*   `src/services/`: Contains modules for interacting with external APIs.
    *   `src/services/ai.ts`: All logic for interacting with the Gemini API.
    *   `src/services/firebase.ts`: All logic for interacting with Firebase.
*   `src/context/`: Contains React context providers for global state management.
