import React, { useState, useEffect } from 'react';
import { 
  signInWithCustomToken, 
  onAuthStateChanged,
  signOut,
  signInWithPopup
} from 'firebase/auth';
import { 
  getFirestore, 
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
  User
} from 'lucide-react';

// Backend connection configuration (loads from .env / src/firebase/config.ts)
import { 
  auth, 
  db, 
  appId, 
  googleProvider,
  isFirebaseConfigured 
} from './src/firebase/config';

const SUBJECTS = [
  { id: 'accountancy', name: 'Accountancy', icon: Book, color: 'bg-blue-500' },
  { id: 'business_studies', name: 'Business Studies', icon: Briefcase, color: 'bg-purple-500' },
  { id: 'economics', name: 'Economics', icon: TrendingUp, color: 'bg-green-500' },
  { id: 'practical_projects', name: 'Practical & Projects', icon: FolderOpen, color: 'bg-orange-500' }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  
  // Navigation State
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedSubject, setSelectedSubject] = useState(null);

  // --- Auth & Profile State ---
  const [studentProfile, setStudentProfile] = useState(null);
  const [isLoginView, setIsLoginView] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        }
      } catch (error) {
        console.error("Auth Error:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch student profile from Firestore to display their info
        const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', currentUser.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          setStudentProfile(profileSnap.data());
          setIsLoginView(false);
        } else {
          // Fallback if profile somehow doesn't exist yet
          setStudentProfile({ name: currentUser.displayName || 'Student', email: currentUser.email });
          setIsLoginView(false);
        }
      } else {
        setIsLoginView(true);
        setStudentProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Listen to assignments
    const assignmentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'assignments');
    
    const unsubscribe = onSnapshot(assignmentsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort chronologically (newest first)
      data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      
      setAssignments(data);
    }, (error) => {
      console.error("Firestore Listen Error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSignOut = () => auth && signOut(auth);

  const openSubject = (subject) => {
    setSelectedSubject(subject);
    setCurrentView('subject');
  };

  const handleBack = () => {
    setCurrentView('dashboard');
    setSelectedSubject(null);
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    if (!auth || !db) {
      setAuthError('Firebase credentials are not configured. Please add your API keys to .env');
      return;
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const authenticatedUser = result.user;
      
      // Save/Update user info to the 'students' collection in backend
      const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', authenticatedUser.uid);
      
      const profileData = {
        uid: authenticatedUser.uid,
        name: authenticatedUser.displayName || 'Student',
        email: authenticatedUser.email,
        joinedAt: new Date()
      };

      // merge: true prevents overwriting the original joinedAt date if they log in again later
      await setDoc(profileRef, profileData, { merge: true });

      setStudentProfile(profileData);
      setIsLoginView(false);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      setAuthError('Failed to sign in with Google. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isLoginView && !user) {
    return (
      <div className="min-h-screen bg-gray-100 font-sans text-gray-800 flex justify-center">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col justify-center p-6">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-blue-700">Biocom Institute</h1>
            <p className="text-gray-500 mt-2">Student Portal Login</p>
          </div>

          <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
            {authError && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm mb-6 w-full text-center">{authError}</div>}
            
            <button 
              onClick={handleGoogleSignIn} 
              className="w-full bg-white border border-gray-300 text-gray-700 p-3 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center space-x-3 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Sign in with Google</span>
            </button>
            <p className="text-xs text-gray-400 mt-6 text-center">
              Use your Google account to access your assignments and study materials securely.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="bg-blue-700 text-white p-4 shadow-md z-10 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {currentView !== 'dashboard' && (
              <button onClick={handleBack} className="p-1 hover:bg-blue-600 rounded-full transition">
                <ChevronLeft size={24} />
              </button>
            )}
            <h1 className="text-xl font-bold tracking-tight">Biocom Institute</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {studentProfile && (
              <div className="flex items-center space-x-2 text-sm font-medium bg-blue-800 px-3 py-1.5 rounded-full">
                <User size={16} />
                <span className="truncate max-w-[100px]">{studentProfile.name}</span>
              </div>
            )}
            <button onClick={handleSignOut} className="p-1 hover:bg-blue-600 rounded-full transition" title="Log Out">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <h2 className="text-2xl font-bold text-gray-800">Welcome!</h2>
                <p className="text-gray-500 text-sm mt-1">Select a subject to view your assignments.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {SUBJECTS.map((subject) => {
                  const Icon = subject.icon;
                  const count = assignments.filter(a => a.subjectId === subject.id).length;
                  
                  return (
                    <button
                      key={subject.id}
                      onClick={() => openSubject(subject)}
                      className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center space-y-3 hover:shadow-md transition active:scale-95"
                    >
                      <div className={`${subject.color} text-white p-4 rounded-full shadow-inner`}>
                        <Icon size={32} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-sm leading-tight">{subject.name}</h3>
                        <span className="text-xs text-gray-400 mt-1 block">{count} Files</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {currentView === 'subject' && selectedSubject && (
            <div className="space-y-4 pb-20">
              <div className="flex items-center space-x-3 mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className={`${selectedSubject.color} text-white p-3 rounded-lg`}>
                  <selectedSubject.icon size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">{selectedSubject.name}</h2>
                  <p className="text-xs text-gray-500">Assignments & Materials</p>
                </div>
              </div>

              {(() => {
                const subjectAssignments = assignments.filter(a => a.subjectId === selectedSubject.id);
                
                if (subjectAssignments.length === 0) {
                  return (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                      <FolderOpen size={48} className="mx-auto text-gray-300 mb-3" />
                      <h3 className="text-gray-600 font-medium">No assignments yet</h3>
                      <p className="text-gray-400 text-sm mt-1">Check back later for updates.</p>
                    </div>
                  );
                }

                return subjectAssignments.map((assignment) => (
                  <div key={assignment.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start space-x-4 transition hover:border-blue-200">
                    <div className="bg-blue-50 text-blue-600 p-3 rounded-lg shrink-0">
                      <FileText size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{assignment.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">{assignment.description}</p>
                      <div className="text-xs text-gray-400 mt-2 flex items-center space-x-2">
                        <span>{assignment.createdAt ? new Date(assignment.createdAt.toMillis()).toLocaleDateString() : 'Just now'}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 shrink-0">
                      <a 
                        href={assignment.fileUrl || '#'} 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex justify-center items-center transition"
                        title="Download/View"
                      >
                        <Download size={18} />
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
}