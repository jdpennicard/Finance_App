import React from 'react';
import { Link } from 'react-router-dom';

export default function NavBar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2 flex gap-6">
      <Link className="font-semibold text-gray-700 hover:text-blue-600" to="/">Dashboard</Link>
      <Link className="font-semibold text-gray-700 hover:text-blue-600" to="/budget-database">Budget Database</Link>
      <Link className="font-semibold text-gray-700 hover:text-blue-600" to="/transactions">Transactions</Link>
      <Link className="font-semibold text-gray-700 hover:text-blue-600" to="/categories">Categories</Link>
      <Link className="font-semibold text-gray-700 hover:text-blue-600" to="/settings">Settings</Link>
    </nav>
  );
} 