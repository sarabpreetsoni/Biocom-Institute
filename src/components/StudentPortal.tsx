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
  ArrowRight
} from 'lucide-react';
import { dataService, Assignment, Student } from '../services/dataService';

export const SUBJECTS = [
  { id: 'accountancy', name: 'Accountancy', icon: Book, color: 'bg-blue-500' },
  { id: 'business_studies', name: 'Business Studies', icon: Briefcase, color: 'bg-purple-500' },
  { id: 'economics', name: 'Economics', icon: TrendingUp, color: 'bg-green-500' },
  { id: 'practical_projects', name: 'Practical & Projects', icon: FolderOpen, color: 'bg-orange-500' }
];

export const StudentPortal: React.FC = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  
  // Navigation State
  const [currentView, setCurrentView] = useState<'dashboard' | 'subject'>('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<typeof SUBJECTS[0] | null>(null);

  // Login Form
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [isLoginView, setIsLoginView] = useState<boolean>(true);

  useEffect(() => {
    // Check local session
    const saved = localStorage.getItem('biocom_active_student');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStudent(parsed);
        setIsLoginView(false);
      } catch {
        setIsLoginView(true);
      }
    }
    
    dataService.getAssignments().then((res) => {
      setAssignments(res);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !emailInput.trim()) return;

    const registered = await dataService.registerStudent(nameInput.trim(), emailInput.trim());
    localStorage.setItem('biocom_active_student', JSON.stringify(registered));
    setStudent(registered);
    setIsLoginView(false);
  };


  const handleSignOut = () => {
    localStorage.removeItem('biocom_active_student');
    setStudent(null);
    setIsLoginView(true);
  };

  const openSubject = (subject: typeof SUBJECTS[0]) => {
    setSelectedSubject(subject);
    setCurrentView('subject');
  };

  const handleBack = () => {
    setCurrentView('dashboard');
    setSelectedSubject(null);
  };

  if (isLoginView && !student) {
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

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Your Full Name
              </label>
              <input
                type="text"
                required
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Sarabpreet Soni"
                className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Student Email
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="e.g. student@biocom.edu"
                className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3.5 rounded-xl transition flex items-center justify-center space-x-2 shadow-sm active:scale-[0.99]"
            >
              <span>Enter Student Portal</span>
              <ArrowRight size={16} />
            </button>
          </form>


          <p className="text-xs text-slate-400 mt-6 text-center leading-relaxed">
            Free commerce education for all. Access study notes, problem sets, and practical assignments.
          </p>
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
            {student && (
              <div className="flex items-center space-x-1.5 text-xs font-medium bg-blue-800/80 px-2.5 py-1 rounded-full border border-blue-600">
                <User size={14} />
                <span className="truncate max-w-[90px]">{student.name}</span>
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
                  Welcome, {student?.name?.split(' ')[0] || 'Student'}!
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
