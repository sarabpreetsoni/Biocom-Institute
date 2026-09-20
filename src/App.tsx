import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StudentPortal } from './components/StudentPortal';
import { AdminPage } from './components/AdminPage';
import { Database } from 'lucide-react';
import { isSupabaseConfigured } from './services/supabase';

// ─── Public Student Header ────────────────────────────────────────────────────
const StudentHeader: React.FC = () => (
  <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-14">

        {/* Branding */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
            B
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm sm:text-base leading-tight tracking-tight text-slate-900">
              Biocom Institute
            </span>
            <span className="text-[10px] text-blue-600 font-medium">Free Education to All</span>
          </div>
        </div>

        {/* Connection status only — no admin link */}
        <div
          className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
            isSupabaseConfigured
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
          title={
            isSupabaseConfigured
              ? 'Connected to live Supabase project'
              : 'Running in Local Storage mode. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to connect live.'
          }
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
            }`}
          />
          <Database size={12} />
          <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Local Mode'}</span>
        </div>

      </div>
    </div>
  </header>
);

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── PUBLIC: Student Portal ── */}
        <Route
          path="/"
          element={
            <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
              <StudentHeader />
              <div className="flex-1">
                <StudentPortal />
              </div>
            </div>
          }
        />

        {/* ── PRIVATE: Admin Dashboard (hidden URL, password-gated) ── */}
        <Route path="/admin" element={<AdminPage />} />

        {/* Catch-all: redirect unknown URLs to home */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
