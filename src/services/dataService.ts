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
    fileUrl: '#',
    fileName: 'Accountancy_Ch3_Solutions.pdf',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'assign-2',
    title: 'Principles of Scientific Management (Taylor & Fayol)',
    description: 'Lecture notes covering 14 principles of management and comparative analysis.',
    subjectId: 'business_studies',
    fileUrl: '#',
    fileName: 'Business_Studies_Taylor_Fayol.pdf',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: 'assign-3',
    title: 'Macroeconomics: National Income Accounting',
    description: 'Numerical practice problems on GDP, GNP, NNP calculations and deflators.',
    subjectId: 'economics',
    fileUrl: '#',
    fileName: 'Economics_National_Income.pdf',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString()
  },
  {
    id: 'assign-4',
    title: 'Comprehensive Business Plan Project Guidelines',
    description: 'Detailed rubric and structure for the annual commerce project submission.',
    subjectId: 'practical_projects',
    fileUrl: '#',
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

// Storage helpers
export const dataService = {
  getAssignments(): Assignment[] {
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
  },

  addAssignment(item: Omit<Assignment, 'id' | 'createdAt'>): Assignment {
    const list = this.getAssignments();
    const newAssignment: Assignment = {
      ...item,
      id: 'assign-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    const updated = [newAssignment, ...list];
    localStorage.setItem('biocom_assignments', JSON.stringify(updated));
    return newAssignment;
  },

  deleteAssignment(id: string): Assignment[] {
    const list = this.getAssignments();
    const updated = list.filter((a) => a.id !== id);
    localStorage.setItem('biocom_assignments', JSON.stringify(updated));
    return updated;
  },

  getStudents(): Student[] {
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
  },

  registerStudent(name: string, email: string): Student {
    const list = this.getStudents();
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
