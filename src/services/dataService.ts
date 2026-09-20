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
  id: string;
  name: string;
  email: string;
  joinedAt: string;
}

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
  {
    id: 'std-1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    joinedAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString()
  },
  {
    id: 'std-2',
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    joinedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString()
  },
  {
    id: 'std-3',
    name: 'Rohan Gupta',
    email: 'rohan.gupta@example.com',
    joinedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
  }
];

// Helper to get local fallback assignments
function getLocalAssignments(): Assignment[] {
  const data = localStorage.getItem('biocom_assignments');
  if (!data) {
    localStorage.setItem('biocom_assignments', JSON.stringify(INITIAL_ASSIGNMENTS));
    return INITIAL_ASSIGNMENTS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_ASSIGNMENTS;
  }
}

// Helper to get local fallback students
function getLocalStudents(): Student[] {
  const data = localStorage.getItem('biocom_students');
  if (!data) {
    localStorage.setItem('biocom_students', JSON.stringify(INITIAL_STUDENTS));
    return INITIAL_STUDENTS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_STUDENTS;
  }
}

export const dataService = {
  isConfigured(): boolean {
    return isSupabaseConfigured;
  },

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

  async addAssignment(
    item: Omit<Assignment, 'id' | 'createdAt'>,
    file?: File | null
  ): Promise<Assignment> {
    let finalFileUrl = item.fileUrl || '';

    // If Supabase is connected and a file is selected, upload to Supabase Storage
    if (isSupabaseConfigured && supabase && file) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('assignments')
          .upload(fileName, file);

        if (!uploadError) {
          const { data } = supabase.storage
            .from('assignments')
            .getPublicUrl(fileName);
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
          .insert([
            {
              title: item.title,
              description: item.description,
              subject_id: item.subjectId,
              file_url: finalFileUrl,
              file_name: item.fileName
            }
          ])
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            title: data.title,
            description: data.description,
            subjectId: data.subject_id,
            fileUrl: data.file_url,
            fileName: data.file_name,
            createdAt: data.created_at
          };
        }
        console.warn('Supabase insert warning, falling back to local:', error?.message);
      } catch (err) {
        console.error('Error inserting assignment to Supabase:', err);
      }
    }

    // Local fallback
    const list = getLocalAssignments();
    const newAssignment: Assignment = {
      ...item,
      fileUrl: finalFileUrl || item.fileUrl,
      id: 'assign-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    const updated = [newAssignment, ...list];
    localStorage.setItem('biocom_assignments', JSON.stringify(updated));
    return newAssignment;
  },

  async deleteAssignment(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('assignments')
          .delete()
          .eq('id', id);
        if (!error) return;
        console.warn('Supabase delete warning:', error.message);
      } catch (err) {
        console.error('Error deleting assignment in Supabase:', err);
      }
    }

    const list = getLocalAssignments();
    const updated = list.filter((a) => a.id !== id);
    localStorage.setItem('biocom_assignments', JSON.stringify(updated));
  },

  async getStudents(): Promise<Student[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((item: any) => ({
            id: item.id,
            name: item.name,
            email: item.email,
            joinedAt: item.created_at
          }));
        }
      } catch (err) {
        console.error('Error querying Supabase students:', err);
      }
    }
    return getLocalStudents();
  },

  async registerStudent(name: string, email: string): Promise<Student> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('students')
          .upsert([{ name, email }], { onConflict: 'email' })
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            name: data.name,
            email: data.email,
            joinedAt: data.created_at
          };
        }
      } catch (err) {
        console.error('Error registering student in Supabase:', err);
      }
    }

    // Local fallback
    const list = getLocalStudents();
    const existing = list.find((s) => s.email.toLowerCase() === email.toLowerCase());
    if (existing) return existing;

    const newStudent: Student = {
      id: 'std-' + Date.now(),
      name,
      email,
      joinedAt: new Date().toISOString()
    };
    const updated = [newStudent, ...list];
    localStorage.setItem('biocom_students', JSON.stringify(updated));
    return newStudent;
  }
};
