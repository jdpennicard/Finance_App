import React from 'react';
import DropdownOptionsManager from '../components/DropdownOptionsManager';

export default function Settings() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Settings</h2>
      <div className="mb-8">
        <DropdownOptionsManager />
      </div>
      {/* Other settings sections can go here */}
    </div>
  );
} 