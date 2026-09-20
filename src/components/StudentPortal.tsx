import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
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
  Sparkles
} from 'lucide-react';
import { auth, db, googleProvider, isFirebaseConfigured, getAssignmentsRef, getStudentDocRef } from '../firebase/config';
import { INITIAL_ASSIGNMENTS } from '../firebase/mockData';

export const SUBJECTS = [
  { id: 'accountancy', name: 'Accountancy', icon: Book, color: 'bg-blue-500' },
  { id: 'business_studies', name: 'Business Studies', icon: Briefcase, color: 'bg-purple-500' },
  { id: 'economics', name: 'Economics', icon: TrendingUp, color: 'bg-green-500' },
  { id: 'practical_projects', name: 'Practical & Projects', icon: FolderOpen, color: 'bg-orange-500' }
];

interface StudentPortalProps {
  useDemoMode: boolean;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ useDemoMode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [assignments, setAssignments] = useState<any[]>([]);
  
  // Navigation State
  const [currentView, setCurrentView] = useState<'dashboard' | 'subject'>('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<typeof SUBJECTS[0] | null>(null);

  // Auth & Profile State
  const [studentProfile, setStudentProfile] = useState<{ name: string; email?: string } | null>(null);
  const [isLoginView, setIsLoginView] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string>('');

  // Manage Auth State
  useEffect(() => {
    if (useDemoMode || !isFirebaseConfigured || !auth || !db) {
      // Demo Mode auth handling
      const savedDemoUser = localStorage.getItem('biocom_demo_student');
      if (savedDemoUser) {
        try {
          const parsed = JSON.parse(savedDemoUser);
          setUser(parsed);
          setStudentProfile(parsed);
          setIsLoginView(false);
        } catch {
          setIsLoginView(true);
        }
      } else {
        setIsLoginView(true);
        setUser(null);
        setStudentProfile(null);
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser: FirebaseUser | null) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profileRef = getStudentDocRef(db, currentUser.uid);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            setStudentProfile(profileSnap.data() as any);
          } else {
            setStudentProfile({
              name: currentUser.displayName || 'Student',
              email: currentUser.email || ''
            });
          }
          setIsLoginView(false);
        } catch (error) {
          console.error('Error fetching student profile:', error);
          setStudentProfile({
            name: currentUser.displayName || 'Student',
            email: currentUser.email || ''
          });
          setIsLoginView(false);
        }
      } else {
        setIsLoginView(true);
        setStudentProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [useDemoMode]);

  // Manage Assignments Stream
  useEffect(() => {
    if (!user) return;

    if (useDemoMode || !isFirebaseConfigured || !db) {
      // Read demo assignments from localStorage or initial constant
      const stored = localStorage.getItem('biocom_assignments');
      if (stored) {
        try {
          setAssignments(JSON.parse(stored));
        } catch {
          setAssignments(INITIAL_ASSIGNMENTS);
        }
      } else {
        setAssignments(INITIAL_ASSIGNMENTS);
      }
      return;
    }

    try {
      const assignmentsRef = getAssignmentsRef(db);
      const unsubscribe = onSnapshot(
        assignmentsRef,
        (snapshot) => {
          const data = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data()
          }));

          data.sort((a: any, b: any) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
            return timeB - timeA;
          });

          setAssignments(data);
        },
        (error) => {
          console.error('Firestore Listen Error:', error);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.error('Error attaching assignments listener:', e);
    }
  }, [user, useDemoMode]);

  const handleGoogleSignIn = async () => {
    setAuthError('');
    if (useDemoMode || !isFirebaseConfigured || !auth || !db) {
      // Handle demo sign-in
      const demoUser = {
        uid: 'demo-student-1',
        name: 'Sarabpreet Soni (Student)',
        email: 'student@biocom.edu',
        joinedAt: new Date().toISOString()
      };
      localStorage.setItem('biocom_demo_student', JSON.stringify(demoUser));
      setUser(demoUser);
      setStudentProfile(demoUser);
      setIsLoginView(false);
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const authenticatedUser = result.user;

      const profileRef = getStudentDocRef(db, authenticatedUser.uid);
      const profileData = {
        uid: authenticatedUser.uid,
        name: authenticatedUser.displayName || 'Student',
        email: authenticatedUser.email || '',
        joinedAt: new Date()
      };

      await setDoc(profileRef, profileData, { merge: true });
      setStudentProfile(profileData);
      setIsLoginView(false);
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      setAuthError(error.message || 'Failed to sign in with Google. Please check your Firebase configuration.');
    }
  };

  const handleSignOut = async () => {
    if (useDemoMode || !isFirebaseConfigured || !auth) {
      localStorage.removeItem('biocom_demo_student');
      setUser(null);
      setStudentProfile(null);
      setIsLoginView(true);
      return;
    }

    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign Out Error:', error);
    }
  };

  const openSubject = (subject: typeof SUBJECTS[0]) => {
    setSelectedSubject(subject);
    setCurrentView('subject');
  };

  const handleBack = () => {
    setCurrentView('dashboard');
    setSelectedSubject(null);
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isLoginView && !user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-700 rounded-2xl mb-4 shadow-sm">
              <Book size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Biocom Institute</h1>
            <p className="text-slate-500 mt-1 text-sm">Student Learning Portal</p>
          </div>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200/70">
            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs mb-4">
                {authError}
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              className="w-full bg-white border border-slate-300 text-slate-700 p-3.5 rounded-xl font-semibold hover:bg-slate-50 transition flex items-center justify-center space-x-3 shadow-sm hover:shadow active:scale-[0.99]"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>{useDemoMode || !isFirebaseConfigured ? 'Continue as Demo Student' : 'Sign in with Google'}</span>
            </button>

            {(!isFirebaseConfigured || useDemoMode) && (
              <div className="mt-4 flex items-center justify-center space-x-1 text-xs text-amber-600 font-medium">
                <Sparkles size={14} />
                <span>Instant demo login enabled</span>
              </div>
            )}

            <p className="text-xs text-slate-400 mt-6 text-center leading-relaxed">
              Access your syllabus, study notes, and assignments securely. Free education for all.
            </p>
          </div>
        </div>
      </div>
    );
  }

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

          <div className="flex items-center space-x-3">
            {studentProfile && (
              <div className="flex items-center space-x-1.5 text-xs font-medium bg-blue-800/80 px-2.5 py-1 rounded-full border border-blue-600">
                <User size={14} />
                <span className="truncate max-w-[90px]">{studentProfile.name}</span>
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="p-1.5 hover:bg-blue-600 rounded-lg transition text-blue-100 hover:text-white"
              title="Log Out"
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
                  Welcome, {studentProfile?.name?.split(' ')[0] || 'Student'}!
                </h2>
                <p className="text-slate-500 text-xs mt-1">Select a subject below to browse notes & assignments.</p>
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

              {/* Quick Summary Card */}
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
                        <span>
                          {assignment.createdAt?.toMillis
                            ? new Date(assignment.createdAt.toMillis()).toLocaleDateString()
                            : assignment.createdAt
                            ? new Date(assignment.createdAt).toLocaleDateString()
                            : 'Recently added'}
                        </span>
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

                    <div className="flex flex-col space-y-1.5 shrink-0">
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
