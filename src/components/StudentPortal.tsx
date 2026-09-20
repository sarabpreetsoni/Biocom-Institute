import React, { useState, useEffect } from 'react';
import {
  Book,
  Briefcase,
  TrendingUp,
  FolderOpen,
  ChevronLeft,
  LogOut,
  FileText,
  Download,
  User,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  Lock,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { dataService, Assignment, Student } from '../services/dataService';
import { isSupabaseConfigured } from '../services/supabase';

export const SUBJECTS = [
  { id: 'accountancy',       name: 'Accountancy',         icon: Book,       color: 'bg-blue-500'   },
  { id: 'business_studies',  name: 'Business Studies',    icon: Briefcase,  color: 'bg-purple-500' },
  { id: 'economics',         name: 'Economics',           icon: TrendingUp, color: 'bg-green-500'  },
  { id: 'practical_projects',name: 'Practical & Projects',icon: FolderOpen, color: 'bg-orange-500' }
];

type AuthMode = 'signin' | 'signup';
type AuthStatus = 'idle' | 'loading' | 'error' | 'email_confirm';

export const StudentPortal: React.FC = () => {
  const [student, setStudent]       = useState<Student | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // Navigation
  const [currentView, setCurrentView]     = useState<'dashboard' | 'subject'>('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<typeof SUBJECTS[0] | null>(null);

  // Auth form
  const [authMode, setAuthMode]       = useState<AuthMode>('signin');
  const [nameInput, setNameInput]     = useState('');
  const [emailInput, setEmailInput]   = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]   = useState(false);
  const [authStatus, setAuthStatus]   = useState<AuthStatus>('idle');
  const [authError, setAuthError]     = useState('');

  // Restore session on load
  useEffect(() => {
    dataService.getSession().then((sess) => {
      if (sess) {
        setStudent(sess);
        if (isSupabaseConfigured) {
          // keep Supabase session — no localStorage needed
        } else {
          localStorage.setItem('biocom_active_student', JSON.stringify(sess));
        }
      }
    });
    dataService.getAssignments().then(setAssignments);
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setNameInput(''); setEmailInput(''); setPasswordInput(''); setConfirmPassword('');
    setAuthError(''); setAuthStatus('idle'); setShowPassword(false);
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    resetForm();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !emailInput.trim() || !passwordInput) return;

    if (passwordInput.length < 6) {
      setAuthError('Password must be at least 6 characters.'); return;
    }
    if (passwordInput !== confirmPassword) {
      setAuthError('Passwords do not match.'); return;
    }

    setAuthStatus('loading');
    setAuthError('');

    const { student: newStudent, error } = await dataService.signUp(
      nameInput.trim(), emailInput.trim(), passwordInput
    );

    if (error === '__EMAIL_CONFIRM__') {
      setAuthStatus('email_confirm');
      return;
    }

    if (error) {
      setAuthError(error);
      setAuthStatus('error');
      return;
    }

    if (newStudent) {
      if (!isSupabaseConfigured) {
        localStorage.setItem('biocom_active_student', JSON.stringify(newStudent));
      }
      setStudent(newStudent);
      setAuthStatus('idle');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput) return;

    setAuthStatus('loading');
    setAuthError('');

    const { student: found, error } = await dataService.signIn(
      emailInput.trim(), passwordInput
    );

    if (error) {
      setAuthError(error);
      setAuthStatus('error');
      return;
    }

    if (found) {
      if (!isSupabaseConfigured) {
        localStorage.setItem('biocom_active_student', JSON.stringify(found));
      }
      setStudent(found);
      setAuthStatus('idle');
    }
  };

  const handleSignOut = async () => {
    await dataService.signOut();
    setStudent(null);
    setAuthMode('signin');
    resetForm();
  };

  const openSubject = (subject: typeof SUBJECTS[0]) => {
    setSelectedSubject(subject);
    setCurrentView('subject');
  };

  const handleBack = () => {
    setCurrentView('dashboard');
    setSelectedSubject(null);
  };

  // ── Auth Screen ──────────────────────────────────────────────────────────────
  if (!student) {
    const isSignUp = authMode === 'signup';
    const isLoading = authStatus === 'loading';

    if (authStatus === 'email_confirm') {
      return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl mb-4">
              <Mail size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Verify your email</h2>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed">
              A confirmation link has been sent to <strong>{emailInput}</strong>.<br />
              Click the link in that email to activate your account, then come back and sign in.
            </p>
            <button
              onClick={() => { resetForm(); setAuthMode('signin'); }}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Top accent */}
          <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600" />

          <div className="p-8">
            {/* Branding */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 text-blue-700 rounded-2xl mb-3 shadow-sm">
                <Book size={28} />
              </div>
              <h1 className="text-2xl font-bold text-slate-800">Biocom Institute</h1>
              <p className="text-slate-500 mt-1 text-sm">Student Learning Portal</p>
            </div>

            {/* Tab Toggle */}
            <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                  !isSignUp ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                  isSignUp ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Form */}
            <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">

              {/* Full Name (sign up only) */}
              {isSignUp && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="e.g. Sarabpreet Soni"
                      disabled={isLoading}
                      className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60 transition"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="you@example.com"
                    disabled={isLoading}
                    autoComplete={isSignUp ? 'email' : 'username'}
                    className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password {isSignUp && <span className="text-slate-400 normal-case font-normal">(min 6 characters)</span>}
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    className="w-full border border-slate-300 rounded-xl pl-10 pr-10 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (sign up only) */}
              {isSignUp && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
                      autoComplete="new-password"
                      className={`w-full border rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60 transition ${
                        confirmPassword && confirmPassword !== passwordInput
                          ? 'border-red-300 bg-red-50'
                          : confirmPassword && confirmPassword === passwordInput
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-slate-300'
                      }`}
                    />
                    {confirmPassword && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        {confirmPassword === passwordInput
                          ? <CheckCircle2 size={15} className="text-emerald-500" />
                          : <AlertCircle size={15} className="text-red-400" />
                        }
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Error */}
              {authError && (
                <div className="flex items-start space-x-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3">
                  <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-600 leading-relaxed">{authError}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center space-x-2 shadow-sm active:scale-[0.99]"
              >
                {isLoading ? (
                  <><Loader2 size={16} className="animate-spin" /><span>Please wait…</span></>
                ) : isSignUp ? (
                  <><UserPlus size={16} /><span>Create My Account</span></>
                ) : (
                  <><span>Sign In</span><ArrowRight size={16} /></>
                )}
              </button>
            </form>

            {/* Unique ID note */}
            {isSignUp && (
              <p className="text-xs text-slate-400 mt-4 text-center leading-relaxed">
                A unique Student ID will be generated for your account upon registration.
              </p>
            )}

            <p className="text-xs text-slate-400 mt-5 text-center leading-relaxed">
              Free commerce education for all. Access study notes, problem sets, and practical assignments.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Student Dashboard ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100 flex justify-center py-6 px-3 sm:px-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[85vh] border border-slate-200">

        {/* Header */}
        <header className="bg-blue-700 text-white p-4 shadow-sm flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {currentView !== 'dashboard' && (
              <button
                onClick={handleBack}
                className="p-1 hover:bg-blue-600 rounded-lg transition"
                title="Back to Dashboard"
              >
                <ChevronLeft size={22} />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-tight">Biocom Student</h1>
              <p className="text-[11px] text-blue-200">Commerce Learning Portal</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {student && (
              <div className="flex items-center space-x-1.5 text-xs font-medium bg-blue-800/80 px-2.5 py-1 rounded-full border border-blue-600" title={`ID: ${student.id}`}>
                <User size={14} />
                <span className="truncate max-w-[90px]">{student.name}</span>
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="p-1.5 hover:bg-blue-600 rounded-lg transition text-blue-100 hover:text-white"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 p-4 overflow-y-auto bg-slate-50/50">
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              <div className="text-center py-2">
                <h2 className="text-xl font-bold text-slate-800">
                  Welcome, {student?.name?.split(' ')[0] || 'Student'}!
                </h2>
                <p className="text-slate-500 text-xs mt-1">Select a subject below to browse notes & assignments.</p>
                {/* Show unique student ID */}
                <p className="text-[10px] text-slate-400 mt-1 font-mono">ID: {student?.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {SUBJECTS.map((subject) => {
                  const Icon = subject.icon;
                  const count = assignments.filter((a) => a.subjectId === subject.id).length;
                  return (
                    <button
                      key={subject.id}
                      onClick={() => openSubject(subject)}
                      className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 flex flex-col items-center justify-center text-center space-y-2.5 hover:shadow-md hover:border-blue-300 transition active:scale-[0.98] group"
                    >
                      <div className={`${subject.color} text-white p-3.5 rounded-2xl shadow-inner group-hover:scale-105 transition-transform`}>
                        <Icon size={28} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-sm leading-snug">{subject.name}</h3>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">{count} {count === 1 ? 'Material' : 'Materials'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Mission Card */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center space-x-2 text-blue-100 text-xs font-semibold uppercase tracking-wider mb-1">
                  <Sparkles size={14} />
                  <span>Biocom Institute Mission</span>
                </div>
                <h4 className="font-bold text-sm">Free Education To All</h4>
                <p className="text-xs text-blue-100 mt-1">
                  All assignments, notes, and practical guidance are made available free of cost for student advancement.
                </p>
              </div>
            </div>
          )}

          {currentView === 'subject' && selectedSubject && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3.5 bg-white rounded-xl shadow-sm border border-slate-200">
                <div className={`${selectedSubject.color} text-white p-2.5 rounded-lg`}>
                  <selectedSubject.icon size={22} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">{selectedSubject.name}</h2>
                  <p className="text-xs text-slate-500">Assignments, Worksheets & PDFs</p>
                </div>
              </div>

              {(() => {
                const subjectAssignments = assignments.filter((a) => a.subjectId === selectedSubject.id);
                if (subjectAssignments.length === 0) {
                  return (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 p-6">
                      <FolderOpen size={42} className="mx-auto text-slate-300 mb-2" />
                      <h3 className="text-slate-600 font-medium text-sm">No assignments posted yet</h3>
                      <p className="text-slate-400 text-xs mt-1">Check back soon or notify your instructor.</p>
                    </div>
                  );
                }

                return subjectAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-start space-x-3 hover:border-blue-300 transition"
                  >
                    <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg shrink-0 mt-0.5">
                      <FileText size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 text-sm leading-snug">{assignment.title}</h3>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1">{assignment.description}</p>
                      <div className="text-[11px] text-slate-400 mt-2 flex items-center space-x-2">
                        <span>{new Date(assignment.createdAt).toLocaleDateString()}</span>
                        {assignment.fileName && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[120px] font-mono text-[10px] text-slate-500">
                              {assignment.fileName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <a
                        href={assignment.fileUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex justify-center items-center transition shadow-sm"
                        title="Download / View File"
                      >
                        {assignment.fileUrl?.startsWith('http') ? <Download size={16} /> : <ExternalLink size={16} />}
                      </a>
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
