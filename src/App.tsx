import React, { useState } from 'react';
import { StudentPortal } from './components/StudentPortal';
import { AdminPortal } from './components/AdminPortal';
import { FirebaseStatusBanner } from './components/FirebaseStatusBanner';
import { isFirebaseConfigured } from './firebase/config';
import { GraduationCap, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activePortal, setActivePortal] = useState<'student' | 'admin'>('student');
  const [useDemoMode, setUseDemoMode] = useState<boolean>(!isFirebaseConfigured);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Firebase Connection & Status Bar */}
      <FirebaseStatusBanner
        useDemoMode={useDemoMode}
        onToggleDemoMode={(val) => setUseDemoMode(val)}
      />

      {/* Global Navigation Switcher */}
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

            {/* Portal Switcher Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActivePortal('student')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activePortal === 'student'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap size={16} />
                <span>Student Portal</span>
              </button>

              <button
                onClick={() => setActivePortal('admin')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activePortal === 'admin'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck size={16} />
                <span>Admin Portal</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Portal Container */}
      <div className="flex-1">
        {activePortal === 'student' ? (
          <StudentPortal useDemoMode={useDemoMode} />
        ) : (
          <AdminPortal useDemoMode={useDemoMode} />
        )}
      </div>
    </div>
  );
}
