import React, { useState, useEffect, useRef } from 'react';
import { 
  onAuthStateChanged,
  signOut,
  signInWithPopup
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
  Briefcase, 
  TrendingUp, 
  FolderOpen,
  LogOut, 
  Trash2,
  UploadCloud,
  Users,
  FileText
} from 'lucide-react';

// Backend connection configuration (loads from .env / src/firebase/config.ts)
import { 
  auth, 
  db, 
  storage, 
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

export default function AdminApp() {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  
  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' or 'students'
  
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState(SUBJECTS[0].id);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setAdminUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!adminUser || !db) return;

    // Listen to Assignments
    const assignmentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'assignments');
    const unsubAssignments = onSnapshot(assignmentsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setAssignments(data);
    });

    // Listen to Students
    const studentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
    const unsubStudents = onSnapshot(studentsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by joinedAt newest first
      data.sort((a, b) => {
        const timeA = a.joinedAt?.toMillis ? a.joinedAt.toMillis() : new Date(a.joinedAt).getTime() || 0;
        const timeB = b.joinedAt?.toMillis ? b.joinedAt.toMillis() : new Date(b.joinedAt).getTime() || 0;
        return timeB - timeA;
      });
      setStudents(data);
    });

    return () => {
      unsubAssignments();
      unsubStudents();
    };
  }, [adminUser]);

  const handleAdminGoogleLogin = async () => {
    setAuthError('');
    if (!auth) {
      setAuthError('Firebase credentials are not configured. Please add your API keys to .env');
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Admin Login Error:", error);
      setAuthError('Failed to sign in. Ensure Google Auth is enabled.');
    }
  };

  const handleSignOut = () => auth && signOut(auth);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (!title || !description || !selectedFile) {
      alert("Please fill all fields and select a file.");
      return;
    }

    try {
      setIsUploading(true);
      
      // 1. Upload File to Firebase Storage
      const fileRef = ref(storage, `assignments/${appId}/${Date.now()}_${selectedFile.name}`);
      const uploadTask = uploadBytesResumable(fileRef, selectedFile);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error) => {
          console.error("Upload failed:", error);
          alert("File upload failed.");
          setIsUploading(false);
        }, 
        async () => {
          // 2. Get Download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // 3. Save to Firestore Database
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'assignments'), {
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
          alert("Assignment uploaded successfully!");
        }
      );
    } catch (error) {
      console.error("Error adding assignment: ", error);
      alert("Error adding assignment");
      setIsUploading(false);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assignments', id));
      } catch (error) {
        console.error("Error deleting assignment: ", error);
        alert("Failed to delete assignment. Check your Firestore Security Rules.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center font-sans">
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-slate-400 mb-8">Secure login required</p>
          
          {authError && <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg mb-6">{authError}</div>}
          
          <button 
            onClick={handleAdminGoogleLogin}
            className="w-full bg-white text-slate-900 font-bold p-3 rounded-lg hover:bg-slate-100 transition flex items-center justify-center space-x-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Admin Login with Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      {/* Top Navbar */}
      <nav className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Book size={24} className="text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">Biocom Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-400 hidden sm:block">Logged in as {adminUser.email}</span>
              <button 
                onClick={handleSignOut}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition text-sm font-medium border border-slate-700"
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-8 border-b border-slate-300">
          <button 
            onClick={() => setActiveTab('assignments')}
            className={`pb-4 px-4 font-semibold text-lg flex items-center space-x-2 transition-colors ${activeTab === 'assignments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <FileText size={20} />
            <span>Assignments</span>
          </button>
          <button 
            onClick={() => setActiveTab('students')}
            className={`pb-4 px-4 font-semibold text-lg flex items-center space-x-2 transition-colors ${activeTab === 'students' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Users size={20} />
            <span>Students Data</span>
          </button>
        </div>

        {/* --- ASSIGNMENTS TAB --- */}
        {activeTab === 'assignments' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Upload Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-8">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <UploadCloud className="mr-2 text-blue-600" size={20} />
                  Upload New Material
                </h2>
                <form onSubmit={handleAddAssignment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                    <select 
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-slate-50"
                    >
                      {SUBJECTS.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Chapter 1 Notes"
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief details about the file..."
                      rows="3"
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Upload File (PDF, DOC, DOCX, PNG, JPG)</label>
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/jpg"
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isUploading}
                    className={`w-full text-white font-semibold p-3 rounded-lg transition relative overflow-hidden ${isUploading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {isUploading ? (
                      <span className="relative z-10 flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-slate-800">Uploaded Materials</h2>
                  <span className="bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">
                    {assignments.length} Total
                  </span>
                </div>
                
                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                  {assignments.length === 0 ? (
                    <div className="p-10 text-center text-slate-500">
                      <FolderOpen size={48} className="mx-auto mb-3 text-slate-300" />
                      <p>No assignments uploaded yet.</p>
                    </div>
                  ) : (
                    assignments.map((assignment) => {
                      const subject = SUBJECTS.find(s => s.id === assignment.subjectId);
                      return (
                        <div key={assignment.id} className="p-6 hover:bg-slate-50 transition flex items-start justify-between">
                          <div className="flex space-x-4">
                            <div className={`${subject?.color || 'bg-gray-500'} text-white p-3 rounded-xl shrink-0 mt-1`}>
                              {subject ? <subject.icon size={24} /> : <FileText size={24} />}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{subject?.name}</span>
                                <span className="text-slate-300">•</span>
                                <span className="text-xs text-slate-400">
                                  {assignment.createdAt ? new Date(assignment.createdAt.toMillis()).toLocaleDateString() : 'Just now'}
                                </span>
                              </div>
                              <h3 className="text-lg font-bold text-slate-800 mt-1">{assignment.title}</h3>
                              <p className="text-slate-600 mt-1 text-sm">{assignment.description}</p>
                              {assignment.fileName && (
                                <div className="mt-3 flex items-center">
                                  <a href={assignment.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                    <Download size={14} className="mr-1.5" /> {assignment.fileName}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition"
                            title="Delete Assignment"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- STUDENTS DATA TAB --- */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Registered Students</h2>
              <span className="bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">
                {students.length} Students
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4 font-semibold">Name</th>
                    <th className="p-4 font-semibold">Email Account</th>
                    <th className="p-4 font-semibold">Join Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="p-10 text-center text-slate-500">
                        <Users size={48} className="mx-auto mb-3 text-slate-300" />
                        <p>No students have registered yet.</p>
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50 transition">
                        <td className="p-4 font-medium text-slate-800 flex items-center space-x-3">
                          <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                            {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <span>{student.name || 'Unknown'}</span>
                        </td>
                        <td className="p-4 text-slate-600 font-mono text-sm">{student.email || 'No email provided'}</td>
                        <td className="p-4 text-slate-500 text-sm">
                          {student.joinedAt 
                            ? new Date(student.joinedAt.toMillis ? student.joinedAt.toMillis() : student.joinedAt).toLocaleDateString()
                            : 'Unknown'
                          }
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
}