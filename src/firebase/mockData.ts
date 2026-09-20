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
  createdAt?: any;
  authorId?: string;
}

export interface Student {
  id: string;
  uid: string;
  name: string;
  email: string;
  joinedAt: any;
}

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'assign-1',
    title: 'Financial Statements Analysis - Chapter 3',
    description: 'Comprehensive balance sheet and P&L statement case studies with solution guide.',
    subjectId: 'accountancy',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'Accountancy_Ch3_Solutions.pdf',
    createdAt: { toMillis: () => Date.now() - 3600000 * 24 }
  },
  {
    id: 'assign-2',
    title: 'Principles of Scientific Management (Taylor & Fayol)',
    description: 'Lecture notes covering 14 principles of management and comparative analysis.',
    subjectId: 'business_studies',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'Business_Studies_Taylor_Fayol.pdf',
    createdAt: { toMillis: () => Date.now() - 3600000 * 48 }
  },
  {
    id: 'assign-3',
    title: 'Macroeconomics: National Income Accounting',
    description: 'Numerical practice problems on GDP, GNP, NNP calculations and deflators.',
    subjectId: 'economics',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'Economics_National_Income.pdf',
    createdAt: { toMillis: () => Date.now() - 3600000 * 72 }
  },
  {
    id: 'assign-4',
    title: 'Comprehensive Business Plan Project Guidelines',
    description: 'Detailed rubric and structure for the annual commerce project submission.',
    subjectId: 'practical_projects',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'Practical_Project_Guidelines.pdf',
    createdAt: { toMillis: () => Date.now() - 3600000 * 96 }
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-1',
    uid: 'std-1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    joinedAt: { toMillis: () => Date.now() - 3600000 * 24 * 7 }
  },
  {
    id: 'std-2',
    uid: 'std-2',
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    joinedAt: { toMillis: () => Date.now() - 3600000 * 24 * 5 }
  },
  {
    id: 'std-3',
    uid: 'std-3',
    name: 'Rohan Gupta',
    email: 'rohan.gupta@example.com',
    joinedAt: { toMillis: () => Date.now() - 3600000 * 24 * 2 }
  }
];
