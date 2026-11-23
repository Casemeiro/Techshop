import { createRoot } from 'react-dom/client';
import { App } from './App';
import './app.css';

// No StrictMode: it would mount the WebGL surface twice in development and
// churn through GPU contexts. The production build is unaffected either way.
createRoot(document.getElementById('root')!).render(<App />);
