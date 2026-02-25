/**
 * @file main.jsx
 * @description Application entry point. Mounts the React application into the DOM.
 * Wraps <App /> with <PipelineProvider> to make global pipeline state available
 * to all pages.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import PipelineProvider from './context/PipelineContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PipelineProvider>
      <App />
    </PipelineProvider>
  </StrictMode>,
);

