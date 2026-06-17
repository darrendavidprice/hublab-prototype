import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { MotionProvider } from './a11y/MotionContext';
import App from './App';
import './styles/tokens.css';
import './styles/global.css';
import './styles/components.css';

// HashRouter is used so the built site works on GitHub Pages subpaths AND
// when the dist/index.html is opened directly from disk (file://), with no server.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MotionProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </MotionProvider>
  </React.StrictMode>,
);
