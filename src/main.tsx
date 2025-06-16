import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { DropdownOptionsProvider } from './context/DropdownOptionsContext';
import { AuthFirebaseProvider } from './firebase/AuthFirebaseContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthFirebaseProvider>
      <DropdownOptionsProvider>
        <App />
      </DropdownOptionsProvider>
    </AuthFirebaseProvider>
  </React.StrictMode>
); 