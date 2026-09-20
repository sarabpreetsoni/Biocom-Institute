import React, { useState, useEffect, useRef } from 'react';
import { 
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import { 
  Book, 
  LogOut, 
  Trash2,
  UploadCloud,
  Users,
  FileText,
  Download,
  Shield,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { auth, db, storage, googleProvider, appId, isFirebaseConfigured, getAssignmentsRef, getStudentsRef, getAssignmentDocRef } from '../firebase/config';
import { SUBJECTS } from './StudentPortal';
import { INITIAL_ASSIGNMENTS, INITIAL_STUDENTS } from '../firebase/mockData';

interface AdminPortalProps {
  useDemoMode: boolean;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ useDemoMode }) => {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string>('');
  
  const [activeTab, setActiveTab] = useState<'assignments' | 'students'>('assignments');
  
  const [assignments, setAssignments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState(SUBJECTS[0].id);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth Effect
  useEffect(() => {
    if (useDemoMode || !isFirebaseConfigured || !auth) {
      const storedDemoAdmin = localStorage.getItem('biocom_demo_admin');
      if (storedDemoAdmin) {
        try {
          setAdminUser(JSON.parse(storedDemoAdmin));
        } catch {
          setAdminUser(null);
        }
      } else {
        setAdminUser(null);
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser: FirebaseUser | null) => {
      setAdminUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [useDemoMode]);

  // Data Listeners
  useEffect(() => {
    if (!adminUser) return;

    if (useDemoMode || !isFirebaseConfigured || !db) {
      // Load demo data
      const storedAssigns = localStorage.getItem('biocom_assignments');
      setAssignments(storedAssigns ? JSON.parse(storedAssigns) : INITIAL_ASSIGNMENTS);

      const storedStudents = localStorage.getItem('biocom_students');
      setStudents(storedStudents ? JSON.parse(storedStudents) : INITIAL_STUDENTS);
      return;
    }

    // Listen to Assignments
    const assignmentsRef = getAssignmentsRef(db);
    const unsubAssignments = onSnapshot(
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
        console.error('Firestore Assignments error:', error);
      }
    );

    // Listen to Students
    const studentsRef = getStudentsRef(db);
    const unsubStudents = onSnapshot(
      studentsRef,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        data.sort((a: any, b: any) => {
          const timeA = a.joinedAt?.toMillis ? a.joinedAt.toMillis() : new Date(a.joinedAt || 0).getTime();
          const timeB = b.joinedAt?.toMillis ? b.joinedAt.toMillis() : new Date(b.joinedAt || 0).getTime();
          return timeB - timeA;
        });
        setStudents(data);
      },
      (error) => {
        console.error('Firestore Students error:', error);
      }
    );

    return () => {
      unsubAssignments();
      unsubStudents();
    };
  }, [adminUser, useDemoMode]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAdminGoogleLogin = async () => {
    setAuthError('');

    if (useDemoMode || !isFirebaseConfigured || !auth) {
      const demoAdmin = {
        uid: 'demo-admin-1',
        email: 'admin@biocom.edu',
        displayName: 'Biocom Administrator'
      };
      localStorage.setItem('biocom_demo_admin', JSON.stringify(demoAdmin));
      setAdminUser(demoAdmin);
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Admin Login Error:', error);
      setAuthError(error.message || 'Failed to sign in. Ensure Google Auth is enabled in Firebase Console.');
    }
  };

  const handleSignOut = async () => {
    if (useDemoMode || !isFirebaseConfigured || !auth) {
      localStorage.removeItem('biocom_demo_admin');
      setAdminUser(null);
      return;
    }

    try {
      await signOut(auth);
    } catch (error) {
      console.error('Admin Sign Out Error:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !selectedFile) {
      showNotification('Please fill in all fields and select a file to upload.', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    // If demo mode or no live storage available
    if (useDemoMode || !isFirebaseConfigured || !storage || !db) {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            setTimeout(() => {
              const newAssignment = {
                id: 'assign-' + Date.now(),
                title,
                description,
                subjectId,
                fileUrl: URL.createObjectURL(selectedFile),
                fileName: selectedFile.name,
                createdAt: { toMillis: () => Date.now() },
                authorId: adminUser?.uid || 'demo-admin'
              };

              const updatedList = [newAssignment, ...assignments];
              setAssignments(updatedList);
              localStorage.setItem('biocom_assignments', JSON.stringify(updatedList));

              // Reset Form
              setTitle('');
              setDescription('');
              setSelectedFile(null);
              setUploadProgress(0);
              setIsUploading(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
              showNotification('Assignment uploaded successfully (Demo Storage)!', 'success');
            }, 300);
            return 100;
          }
          return prev + 25;
        });
      }, 150);
      return;
    }

    try {
      // 1. Upload File to Firebase Storage
      const fileRef = ref(storage, `assignments/${appId}/${Date.now()}_${selectedFile.name}`);
      const uploadTask = uploadBytesResumable(fileRef, selectedFile);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Firebase Storage Upload failed:', error);
          showNotification('File upload failed: ' + error.message, 'error');
          setIsUploading(false);
        },
        async () => {
          try {
            // 2. Get Download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            // 3. Save assignment metadata to Firestore Database
            await addDoc(getAssignmentsRef(db), {
              title,
              description,
              subjectId,
              fileUrl: downloadURL,
              fileName: selectedFile.name,
              createdAt: serverTimestamp(),
              authorId: adminUser.uid
            });

            // Reset Form
            setTitle('');
            setDescription('');
            setSelectedFile(null);
            setUploadProgress(0);
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            showNotification('Assignment published to Firestore and Storage successfully!', 'success');
          } catch (firestoreError: any) {
            console.error('Firestore save error:', firestoreError);
            showNotification('Saved file, but failed to record in Firestore: ' + firestoreError.message, 'error');
            setIsUploading(false);
          }
        }
      );
    } catch (error: any) {
      console.error('Error adding assignment: ', error);
      showNotification('Error adding assignment: ' + error.message, 'error');
      setIsUploading(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;

    if (useDemoMode || !isFirebaseConfigured || !db) {
      const filtered = assignments.filter((a) => a.id !== id);
      setAssignments(filtered);
      localStorage.setItem('biocom_assignments', JSON.stringify(filtered));
      showNotification('Assignment deleted (Demo Data)', 'success');
      return;
    }

    try {
      await deleteDoc(getAssignmentDocRef(db, id));
      showNotification('Assignment deleted from Firestore.', 'success');
    } catch (error: any) {
      console.error('Error deleting assignment: ', error);
      showNotification('Failed to delete assignment. Please check Firestore security rules.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 text-white p-8 rounded-2xl shadow-2xl border border-slate-800 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl mb-4 border border-blue-500/30">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mb-6">Manage study materials and view enrolled students</p>

          {authError && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg text-xs mb-6 text-left">
              {authError}
            </div>
          )}

          <button
            onClick={handleAdminGoogleLogin}
            className="w-full bg-white text-slate-900 font-bold p-3.5 rounded-xl hover:bg-slate-100 transition flex items-center justify-center space-x-3 shadow-md hover:shadow-lg active:scale-[0.99]"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>{useDemoMode || !isFirebaseConfigured ? 'Sign in as Demo Admin' : 'Admin Login with Google'}</span>
          </button>

          <p className="text-xs text-slate-500 mt-6">
            Authorized administrator credentials required for assignment publication and database management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* Admin Navbar */}
      <nav className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <Shield size={22} />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight block leading-tight">Biocom Admin Portal</span>
                <span className="text-[11px] text-slate-400">Content Management & Analytics</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-xs text-slate-400 hidden sm:block">
                Logged in as <strong className="text-slate-200">{adminUser.email || 'Admin'}</strong>
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 rounded-lg transition text-xs font-medium border border-slate-700"
              >
                <LogOut size={14} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {notification && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center space-x-3 border ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-6 mb-8 border-b border-slate-300">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`pb-3 font-semibold text-base flex items-center space-x-2 transition border-b-2 -mb-px ${
              activeTab === 'assignments'
                ? 'text-blue-600 border-blue-600'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            <FileText size={18} />
            <span>Assignments & Coursework</span>
            <span className="ml-1 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">
              {assignments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`pb-3 font-semibold text-base flex items-center space-x-2 transition border-b-2 -mb-px ${
              activeTab === 'students'
                ? 'text-blue-600 border-blue-600'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            <Users size={18} />
            <span>Registered Students</span>
            <span className="ml-1 bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full font-bold">
              {students.length}
            </span>
          </button>
        </div>

        {/* --- ASSIGNMENTS TAB --- */}
        {activeTab === 'assignments' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Upload Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-8">
                <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center">
                  <UploadCloud className="mr-2 text-blue-600" size={20} />
                  Upload New Material
                </h2>
                
                <form onSubmit={handleAddAssignment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                      Subject
                    </label>
                    <select
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-slate-50"
                    >
                      {SUBJECTS.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                      Material Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Accountancy Unit 1 Summary"
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                      Description & Instructions
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief details about what students need to prepare..."
                      rows={3}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                      Select Document (PDF, DOCX, Images)
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/jpg"
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUploading}
                    className={`w-full text-white text-sm font-semibold p-3 rounded-xl transition relative overflow-hidden shadow-sm ${
                      isUploading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99]'
                    }`}
                  >
                    {isUploading ? (
                      <span className="relative z-10 flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading {Math.round(uploadProgress)}%
                      </span>
                    ) : (
                      'Publish Assignment'
                    )}
                    {isUploading && (
                      <div
                        className="absolute top-0 left-0 h-full bg-blue-700 transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: List of Assignments */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Published Materials</h2>
                  <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {assignments.length} Files
                  </span>
                </div>

                <div className="divide-y divide-slate-100 max-h-[650px] overflow-y-auto">
                  {assignments.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                      <FileText size={42} className="mx-auto mb-2 text-slate-300" />
                      <p className="text-sm font-medium">No assignments uploaded yet.</p>
                      <p className="text-xs text-slate-400 mt-1">Use the upload form on the left to publish coursework.</p>
                    </div>
                  ) : (
                    assignments.map((assignment) => {
                      const subject = SUBJECTS.find((s) => s.id === assignment.subjectId);
                      return (
                        <div
                          key={assignment.id}
                          className="p-5 hover:bg-slate-50/80 transition flex items-start justify-between gap-4"
                        >
                          <div className="flex space-x-3.5 min-w-0">
                            <div className={`${subject?.color || 'bg-slate-500'} text-white p-3 rounded-xl shrink-0 mt-0.5 shadow-sm`}>
                              {subject ? <subject.icon size={22} /> : <FileText size={22} />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2 text-[11px]">
                                <span className="font-bold text-slate-500 uppercase tracking-wider">{subject?.name}</span>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-400">
                                  {assignment.createdAt?.toMillis
                                    ? new Date(assignment.createdAt.toMillis()).toLocaleDateString()
                                    : assignment.createdAt
                                    ? new Date(assignment.createdAt).toLocaleDateString()
                                    : 'Recently added'}
                                </span>
                              </div>

                              <h3 className="text-base font-bold text-slate-800 mt-0.5 truncate">{assignment.title}</h3>
                              <p className="text-slate-600 mt-1 text-xs leading-relaxed">{assignment.description}</p>

                              {assignment.fileName && (
                                <div className="mt-2.5 flex items-center">
                                  <a
                                    href={assignment.fileUrl || '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-xs font-medium inline-flex items-center bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100"
                                  >
                                    <Download size={13} className="mr-1.5" />
                                    <span className="truncate max-w-[200px]">{assignment.fileName}</span>
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition shrink-0"
                            title="Delete Assignment"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- STUDENTS DATA TAB --- */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Registered Students</h2>
                <p className="text-xs text-slate-500">Live roster populated when students sign in through the portal</p>
              </div>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                {students.length} Enrolled
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4 font-semibold">Student Name</th>
                    <th className="p-4 font-semibold">Email Address</th>
                    <th className="p-4 font-semibold">Registration Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-12 text-center text-slate-500">
                        <Users size={42} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-sm font-medium">No students registered yet.</p>
                        <p className="text-xs text-slate-400 mt-1">When students sign in, their profile will appear here in real-time.</p>
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id || student.uid} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-medium text-slate-800 flex items-center space-x-3">
                          <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">
                            {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <span>{student.name || 'Unknown Student'}</span>
                        </td>
                        <td className="p-4 text-slate-600 font-mono text-xs">{student.email || 'No email provided'}</td>
                        <td className="p-4 text-slate-500 text-xs">
                          {student.joinedAt?.toMillis
                            ? new Date(student.joinedAt.toMillis()).toLocaleDateString()
                            : student.joinedAt
                            ? new Date(student.joinedAt).toLocaleDateString()
                            : 'Active Student'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
