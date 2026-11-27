import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App, { LostLuggage } from './ui/App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <LostLuggage>
            <App />
        </LostLuggage>
    </StrictMode>
);
