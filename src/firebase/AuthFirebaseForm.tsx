import React, { useState, useEffect } from 'react';
import { useAuthFirebase } from './AuthFirebaseContext';
import { sendEmailVerification, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './DatabaseFirebase';
import { useNavigate } from 'react-router-dom';

export default function AuthFirebaseForm() {
  const { signup, login, user, loading } = useAuthFirebase();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [verifySent, setVerifySent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.emailVerified) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isSignup) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      setVerifySent(true);
    }
  };

  const handlePasswordReset = async () => {
    setError(null);
    setResetSent(false);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (user) {
    if (!user.emailVerified) {
      return (
        <div className="p-4 text-center">
          <div className="mb-2">You are logged in as <b>{user.email}</b> but your email is not verified.</div>
          <button
            className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
            onClick={handleSendVerification}
            disabled={verifySent}
          >
            {verifySent ? 'Verification Email Sent!' : 'Send Verification Email'}
          </button>
        </div>
      );
    }
    return <div className="p-4 text-center">You are logged in as <b>{user.email}</b>.</div>;
  }

  return (
    <div className="max-w-xs mx-auto mt-8 p-4 border rounded bg-white shadow">
      <h2 className="text-lg font-semibold mb-4 text-center">{isSignup ? 'Sign Up' : 'Log In'}</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          className="border rounded px-2 py-1"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="border rounded px-2 py-1"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <div className="text-red-600 text-sm text-center">{error}</div>}
        {resetSent && <div className="text-green-600 text-sm text-center">Password reset email sent!</div>}
        <button
          type="submit"
          className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
          disabled={submitting}
        >
          {submitting ? (isSignup ? 'Signing Up...' : 'Logging In...') : (isSignup ? 'Sign Up' : 'Log In')}
        </button>
      </form>
      <div className="mt-3 text-center">
        <button
          className="text-blue-600 hover:underline text-sm"
          onClick={() => setIsSignup(s => !s)}
        >
          {isSignup ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
        </button>
      </div>
      <div className="mt-2 text-center">
        <button
          className="text-blue-500 hover:underline text-xs"
          onClick={handlePasswordReset}
          disabled={!email || submitting}
        >
          Forgot Password?
        </button>
      </div>
      <div className="mt-4 text-center">
        <button
          type="button"
          className="bg-red-500 text-white rounded px-4 py-2 hover:bg-red-600 w-full"
          onClick={handleGoogleSignIn}
          disabled={submitting}
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
} 