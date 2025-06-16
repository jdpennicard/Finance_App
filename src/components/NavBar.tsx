import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthFirebase } from '../firebase/AuthFirebaseContext';

export default function NavBar() {
  const { user, logout } = useAuthFirebase();

  return (
    <nav className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white">
      <div className="font-bold text-lg">Finance App</div>
      {user && (
        <div className="flex items-center gap-6">
          <Link to="/budget-database" className="hover:underline">Budget Database</Link>
          <Link to="/dashboard" className="hover:underline">Dashboard</Link>
          <Link to="/settings" className="hover:underline">Settings</Link>
        </div>
      )}
      <div>
        {user ? (
          <>
            <span className="mr-4">{user.email}</span>
            <button
              className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
              onClick={logout}
            >
              Log Out
            </button>
          </>
        ) : (
          <a href="/login" className="bg-blue-500 px-3 py-1 rounded hover:bg-blue-600">Log In</a>
        )}
      </div>
    </nav>
  );
} 