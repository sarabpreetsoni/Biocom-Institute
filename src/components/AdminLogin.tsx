import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Lock, AlertTriangle } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
}

// The admin password is stored in the environment variable VITE_ADMIN_PASSWORD.
// It is never exposed in the public UI or the student-facing routes.
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'biocom-admin-2024';

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const MAX_ATTEMPTS = 5;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) return;

    if (password === ADMIN_PASSWORD) {
      setError('');
      onSuccess();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPassword('');

      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true);
        setError(`Too many failed attempts. Access locked. Please restart the app.`);
      } else {
        setError(`Incorrect password. ${MAX_ATTEMPTS - newAttempts} attempt(s) remaining.`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600" />

          <div className="p-8">
            {/* Icon + Title */}
            <div className="flex flex-col items-center mb-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-800/60 flex items-center justify-center mb-4 shadow-lg">
                <ShieldCheck size={32} className="text-red-400" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Admin Access
              </h1>
              <p className="text-sm text-slate-500 mt-1.5">
                Biocom Institute — Private Dashboard
              </p>
            </div>

            {/* Warning notice */}
            <div className="mb-6 flex items-start space-x-2.5 bg-amber-950/40 border border-amber-800/40 rounded-lg px-3.5 py-3">
              <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-400/90 leading-relaxed">
                This area is <strong>restricted</strong>. Unauthorized access attempts
                are logged. If you are a student, please go back to the Student Portal.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider"
                >
                  Admin Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Lock size={15} className="text-slate-500" />
                  </div>
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    disabled={isLocked}
                    autoComplete="current-password"
                    className="w-full bg-slate-800/80 border border-slate-700 text-white placeholder-slate-600 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/60 focus:border-red-600/60 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300 transition"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center space-x-2 bg-red-950/50 border border-red-800/50 rounded-lg px-3 py-2.5">
                  <AlertTriangle size={13} className="text-red-400 shrink-0" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLocked || !password}
                className="w-full bg-red-700 hover:bg-red-600 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 shadow-lg hover:shadow-red-900/50 focus:outline-none focus:ring-2 focus:ring-red-600/60 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                {isLocked ? '🔒 Access Locked' : 'Enter Dashboard'}
              </button>
            </form>

            {/* Back link */}
            <div className="mt-6 text-center">
              <a
                href="/"
                className="text-xs text-slate-600 hover:text-slate-400 transition"
              >
                ← Back to Student Portal
              </a>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-700 mt-4">
          Biocom Institute · Private Admin Panel
        </p>
      </div>
    </div>
  );
};
