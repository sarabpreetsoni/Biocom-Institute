import { supabase, isSupabaseConfigured } from './supabase';

export interface Subject {
  id: string;
  name: string;
  color: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  fileUrl?: string;
  fileName?: string;
  createdAt: string;
  authorId?: string;
}

export interface Student {
  id: string;          // Supabase auth UUID (or local fallback ID)
  name: string;
  email: string;
  joinedAt: string;
}

// ─── Seed data for local / offline mode ───────────────────────────────────────
const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'assign-1',
    title: 'Financial Statements Analysis - Chapter 3',
    description: 'Comprehensive balance sheet and P&L statement case studies with solution guide.',
    subjectId: 'accountancy',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'Accountancy_Ch3_Solutions.pdf',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'assign-2',
    title: 'Principles of Scientific Management (Taylor & Fayol)',
    description: 'Lecture notes covering 14 principles of management and comparative analysis.',
    subjectId: 'business_studies',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'Business_Studies_Taylor_Fayol.pdf',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: 'assign-3',
    title: 'Macroeconomics: National Income Accounting',
    description: 'Numerical practice problems on GDP, GNP, NNP calculations and deflators.',
    subjectId: 'economics',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'Economics_National_Income.pdf',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString()
  },
  {
    id: 'assign-4',
    title: 'Comprehensive Business Plan Project Guidelines',
    description: 'Detailed rubric and structure for the annual commerce project submission.',
    subjectId: 'practical_projects',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'Practical_Project_Guidelines.pdf',
    createdAt: new Date(Date.now() - 3600000 * 96).toISOString()
  }
];

const INITIAL_STUDENTS: Student[] = [
  { id: 'std-1', name: 'Aarav Sharma',  email: 'aarav.sharma@example.com',  joinedAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString() },
  { id: 'std-2', name: 'Priya Patel',   email: 'priya.patel@example.com',   joinedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString() },
  { id: 'std-3', name: 'Rohan Gupta',   email: 'rohan.gupta@example.com',   joinedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString() }
];

// ─── Local storage helpers ────────────────────────────────────────────────────
function getLocalAssignments(): Assignment[] {
  const data = localStorage.getItem('biocom_assignments');
  if (!data) { localStorage.setItem('biocom_assignments', JSON.stringify(INITIAL_ASSIGNMENTS)); return INITIAL_ASSIGNMENTS; }
  try { return JSON.parse(data); } catch { return INITIAL_ASSIGNMENTS; }
}

function getLocalStudents(): Student[] {
  const data = localStorage.getItem('biocom_students');
  if (!data) { localStorage.setItem('biocom_students', JSON.stringify(INITIAL_STUDENTS)); return INITIAL_STUDENTS; }
  try { return JSON.parse(data); } catch { return INITIAL_STUDENTS; }
}

// ─── Data Service ─────────────────────────────────────────────────────────────
export const dataService = {
  isConfigured(): boolean {
    return isSupabaseConfigured;
  },

  // ── Auth: Sign Up ────────────────────────────────────────────────────────────
  async signUp(name: string, email: string, password: string): Promise<{ student: Student | null; error: string | null }> {
    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Create auth account
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } }
        });

        if (authError) {
          if (authError.message.toLowerCase().includes('rate limit')) {
            return {
              student: null,
              error: 'Email rate limit exceeded. Please disable "Confirm email" in Supabase (Authentication > Providers > Email) so students can sign up instantly without email restrictions.'
            };
          }
          return { student: null, error: authError.message };
        }
        if (!authData.user) return { student: null, error: 'Sign up failed. Please try again.' };

        // 2. Insert student profile linked to auth UUID
        const { data: profileData, error: profileError } = await supabase
          .from('students')
          .insert([{ id: authData.user.id, name, email }])
          .select()
          .single();

        if (profileError && profileError.code !== '23505') {
          // 23505 = unique violation (already exists), treat as ok
          console.warn('Profile insert warning:', profileError.message);
        }

        const student: Student = {
          id: authData.user.id,
          name,
          email,
          joinedAt: authData.user.created_at ?? new Date().toISOString()
        };

        // Check if email confirmation is required
        const needsConfirmation = !authData.session;
        if (needsConfirmation) {
          return { student: null, error: '__EMAIL_CONFIRM__' };
        }

        return { student, error: null };
      } catch (err: any) {
        return { student: null, error: err.message ?? 'Unexpected error during sign up.' };
      }
    }

    // ── Local fallback ──
    const list = getLocalStudents();
    if (list.find(s => s.email.toLowerCase() === email.toLowerCase())) {
      return { student: null, error: 'An account with this email already exists. Please sign in.' };
    }
    const newStudent: Student = {
      id: 'std-' + Date.now(),
      name,
      email,
      joinedAt: new Date().toISOString()
    };
    localStorage.setItem('biocom_students', JSON.stringify([newStudent, ...list]));
    return { student: newStudent, error: null };
  },

  // ── Auth: Sign In ────────────────────────────────────────────────────────────
  async signIn(email: string, password: string): Promise<{ student: Student | null; error: string | null }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) return { student: null, error: error.message };
        if (!data.user) return { student: null, error: 'Sign in failed. Please try again.' };

        // Fetch profile from students table
        const { data: profile } = await supabase
          .from('students')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const student: Student = {
          id: data.user.id,
          name: profile?.name ?? data.user.user_metadata?.full_name ?? email.split('@')[0],
          email: data.user.email ?? email,
          joinedAt: profile?.created_at ?? data.user.created_at ?? new Date().toISOString()
        };

        return { student, error: null };
      } catch (err: any) {
        return { student: null, error: err.message ?? 'Unexpected error during sign in.' };
      }
    }

    // ── Local fallback (password not checked in local mode) ──
    const list = getLocalStudents();
    const existing = list.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (!existing) return { student: null, error: 'No account found with this email. Please sign up first.' };
    return { student: existing, error: null };
  },

  // ── Auth: Sign Out ───────────────────────────────────────────────────────────
  async signOut(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('biocom_active_student');
  },

  // ── Auth: Restore session on page load ──────────────────────────────────────
  async getSession(): Promise<Student | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return null;

        const { data: profile } = await supabase
          .from('students')
          .select('*')
          .eq('id', session.user.id)
          .single();

        return {
          id: session.user.id,
          name: profile?.name ?? session.user.user_metadata?.full_name ?? session.user.email?.split('@')[0] ?? 'Student',
          email: session.user.email ?? '',
          joinedAt: profile?.created_at ?? session.user.created_at ?? new Date().toISOString()
        };
      } catch {
        return null;
      }
    }

    // Local fallback
    const saved = localStorage.getItem('biocom_active_student');
    if (!saved) return null;
    try { return JSON.parse(saved); } catch { return null; }
  },

  // ── Assignments ──────────────────────────────────────────────────────────────
  async getAssignments(): Promise<Assignment[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('assignments')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Supabase getAssignments warning, using local fallback:', error.message);
          return getLocalAssignments();
        }

        if (data && data.length > 0) {
          return data.map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            subjectId: item.subject_id,
            fileUrl: item.file_url,
            fileName: item.file_name,
            createdAt: item.created_at
          }));
        }
      } catch (err) {
        console.error('Error querying Supabase assignments:', err);
      }
    }
    return getLocalAssignments();
  },

  async addAssignment(item: Omit<Assignment, 'id' | 'createdAt'>, file?: File | null): Promise<Assignment> {
    let finalFileUrl = item.fileUrl || '';

    if (isSupabaseConfigured && supabase && file) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('assignments').upload(fileName, file);

        if (!uploadError) {
          const { data } = supabase.storage.from('assignments').getPublicUrl(fileName);
          finalFileUrl = data.publicUrl;
        } else {
          console.warn('Supabase storage upload error:', uploadError.message);
        }
      } catch (uploadErr) {
        console.error('Storage upload exception:', uploadErr);
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('assignments')
          .insert([{ title: item.title, description: item.description, subject_id: item.subjectId, file_url: finalFileUrl, file_name: item.fileName }])
          .select()
          .single();

        if (!error && data) {
          return { id: data.id, title: data.title, description: data.description, subjectId: data.subject_id, fileUrl: data.file_url, fileName: data.file_name, createdAt: data.created_at };
        }
        console.warn('Supabase insert warning, falling back to local:', error?.message);
      } catch (err) {
        console.error('Error inserting assignment to Supabase:', err);
      }
    }

    const list = getLocalAssignments();
    const newAssignment: Assignment = { ...item, fileUrl: finalFileUrl || item.fileUrl, id: 'assign-' + Date.now(), createdAt: new Date().toISOString() };
    localStorage.setItem('biocom_assignments', JSON.stringify([newAssignment, ...list]));
    return newAssignment;
  },

  async deleteAssignment(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('assignments').delete().eq('id', id);
        if (!error) return;
        console.warn('Supabase delete warning:', error.message);
      } catch (err) {
        console.error('Error deleting assignment in Supabase:', err);
      }
    }
    const list = getLocalAssignments();
    localStorage.setItem('biocom_assignments', JSON.stringify(list.filter(a => a.id !== id)));
  },

  async getStudents(): Promise<Student[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map((item: any) => ({ id: item.id, name: item.name, email: item.email, joinedAt: item.created_at }));
        }
      } catch (err) {
        console.error('Error querying Supabase students:', err);
      }
    }
    return getLocalStudents();
  },

  // Keep for backwards compatibility — used internally
  async registerStudent(name: string, email: string): Promise<Student> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('students')
          .upsert([{ name, email }], { onConflict: 'email' })
          .select()
          .single();
        if (!error && data) return { id: data.id, name: data.name, email: data.email, joinedAt: data.created_at };
      } catch (err) {
        console.error('Error registering student in Supabase:', err);
      }
    }
    const list = getLocalStudents();
    const existing = list.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (existing) return existing;
    const newStudent: Student = { id: 'std-' + Date.now(), name, email, joinedAt: new Date().toISOString() };
    localStorage.setItem('biocom_students', JSON.stringify([newStudent, ...list]));
    return newStudent;
  }
};
