/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_CONFIG: string
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_GEMINI_MODEL_NAME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}