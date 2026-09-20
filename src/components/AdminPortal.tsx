import React, { useState, useEffect, useRef } from 'react';
import { 
  Trash2,
  UploadCloud,
  Users,
  FileText,
  Download,
  Shield,
  CheckCircle,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { SUBJECTS } from './StudentPortal';
import { dataService, Assignment, Student } from '../services/dataService';


export const AdminPortal: React.FC = () => {

  const [activeTab, setActiveTab] = useState<'assignments' | 'students'>('assignments');
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState(SUBJECTS[0].id);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);


  useEffect(() => {
    refreshData();
  }, []);


  const refreshData = async () => {
    const [assigns, studs] = await Promise.all([
      dataService.getAssignments(),
      dataService.getStudents()
    ]);
    setAssignments(assigns);
    setStudents(studs);
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };


  const handleSignOut = () => {
    // Delegate logout to the AdminPage session manager
    if ((window as any).__biocomAdminLogout) {
      (window as any).__biocomAdminLogout();
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
      showNotification('Please fill in all fields and choose a file.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      await dataService.addAssignment({
        title: title.trim(),
        description: description.trim(),
        subjectId,
        fileName: selectedFile.name
      }, selectedFile);

      await refreshData();
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      showNotification('New assignment published successfully!', 'success');
    } catch (err: any) {
      showNotification('Failed to upload assignment: ' + err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    await dataService.deleteAssignment(id);
    await refreshData();
    showNotification('Assignment removed.', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* Top Bar */}
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
                Logged in as <strong className="text-slate-200">Administrator</strong>
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
            
            {/* Upload Form */}
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
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
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
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUploading}
                    className={`w-full text-white text-sm font-semibold p-3 rounded-xl transition shadow-sm active:scale-[0.99] flex items-center justify-center ${
                      isUploading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isUploading ? (
                      <span className="flex items-center space-x-2">
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Uploading & Publishing...</span>
                      </span>
                    ) : (
                      'Publish Assignment'
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* List of Assignments */}
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
                                  {new Date(assignment.createdAt).toLocaleDateString()}
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
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-medium text-slate-800 flex items-center space-x-3">
                          <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">
                            {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <span>{student.name || 'Unknown Student'}</span>
                        </td>
                        <td className="p-4 text-slate-600 font-mono text-xs">{student.email || 'No email'}</td>
                        <td className="p-4 text-slate-500 text-xs">
                          {new Date(student.joinedAt).toLocaleDateString()}
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
