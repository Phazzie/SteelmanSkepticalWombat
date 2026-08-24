import React from 'react';
import ReactDOM from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import App from './App';
import { SupabaseDataService } from './services/SupabaseDataService';
import './styles.css';

// The only place in the app that constructs a Supabase client. Everything
// downstream depends on the DataService interface (src/services/DataService.ts),
// not on Supabase directly — swapping backends means changing only this file.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. See .env.example.'
  );
}

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
const dataService = new SupabaseDataService(supabaseClient);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App dataService={dataService} />
  </React.StrictMode>
);
