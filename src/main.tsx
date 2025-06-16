import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { DropdownOptionsProvider } from './context/DropdownOptionsContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DropdownOptionsProvider>
      <App />
    </DropdownOptionsProvider>
  </React.StrictMode>
); 