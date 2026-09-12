import { Subject } from '@/types/database';

export const APP_NAME = "UPSC Study Tracker";
export const APP_SUBTITLE = "Simple habits. Consistent preparation.";

// ----------------------------------------------------------------------
// CANONICAL UPSC SYLLABUS PAPERS & SUBJECTS
// ----------------------------------------------------------------------

export const DEFAULT_SUBJECTS: Omit<Subject, 'id'>[] = [
  // Prelims Paper I (General Studies)
  { name: 'Current Events of National & International Importance', category: 'Prelims', paper: 'General', display_order: 1, active: true },
  { name: 'Indian and World Geography', category: 'Prelims', paper: 'General', display_order: 2, active: true },
  { name: 'Indian History and National Movement', category: 'Prelims', paper: 'General', display_order: 3, active: true },
  { name: 'Indian Polity and Governance', category: 'Prelims', paper: 'General', display_order: 4, active: true },
  { name: 'Economic and Social Development', category: 'Prelims', paper: 'General', display_order: 5, active: true },
  { name: 'Environment and Ecology', category: 'Prelims', paper: 'General', display_order: 6, active: true },
  { name: 'General Science', category: 'Prelims', paper: 'General', display_order: 7, active: true },

  // Prelims Paper II (CSAT)
  { name: 'CSAT: Reading Comprehension', category: 'Prelims', paper: 'General', display_order: 8, active: true },
  { name: 'CSAT: Interpersonal Skills & Communication', category: 'Prelims', paper: 'General', display_order: 9, active: true },
  { name: 'CSAT: Logical Reasoning & Analytical Ability', category: 'Prelims', paper: 'General', display_order: 10, active: true },
  { name: 'CSAT: Decision-Making & Problem-Solving', category: 'Prelims', paper: 'General', display_order: 11, active: true },
  { name: 'CSAT: Basic Numeracy', category: 'Prelims', paper: 'General', display_order: 12, active: true },
  { name: 'CSAT: Data Interpretation', category: 'Prelims', paper: 'General', display_order: 13, active: true },

  // Mains General Studies & Compulsory Papers
  { name: 'Qualifying Papers: Indian Language & English', category: 'Mains', paper: 'Essay', display_order: 101, active: true },
  { name: 'Paper I: Essay', category: 'Mains', paper: 'Essay', display_order: 102, active: true },
  { name: 'Paper II (GS-I): Indian Heritage, Culture, History, World Geography, Society', category: 'Mains', paper: 'GS1', display_order: 103, active: true },
  { name: 'Paper III (GS-II): Governance, Constitution, Polity, Social Justice, IR', category: 'Mains', paper: 'GS2', display_order: 104, active: true },
  { name: 'Paper IV (GS-III): Technology, Economic Development, Biodiversity, Environment, Security, Disaster Management', category: 'Mains', paper: 'GS3', display_order: 105, active: true },
  { name: 'Paper V (GS-IV): Ethics, Integrity, and Aptitude', category: 'Mains', paper: 'GS4', display_order: 106, active: true },

  // Optional Subject
  { name: 'Optional Subject (Paper I & II)', category: 'Mains', paper: 'Optional', display_order: 107, active: true },
];

export const INITIAL_SUBJECTS: Subject[] = DEFAULT_SUBJECTS.map((s, idx) => ({
  ...s,
  id: `subj-default-${idx + 1}`,
}));

export const PRELIMS_CORE_SUBJECTS = INITIAL_SUBJECTS.filter(s => s.category === 'Prelims');

// 25 Core UPSC Optional Subjects
export const UPSC_OPTIONAL_CORE_SUBJECTS = [
  'Agriculture',
  'Animal Husbandry and Veterinary Science',
  'Anthropology',
  'Botany',
  'Chemistry',
  'Civil Engineering',
  'Commerce and Accountancy',
  'Economics',
  'Electrical Engineering',
  'Geography',
  'Geology',
  'History',
  'Law',
  'Management',
  'Mathematics',
  'Mechanical Engineering',
  'Medical Science',
  'Philosophy',
  'Physics',
  'Political Science and International Relations (PSIR)',
  'Psychology',
  'Public Administration',
  'Sociology',
  'Statistics',
  'Zoology',
];

// 23 UPSC Literature Optional Subjects
export const UPSC_OPTIONAL_LITERATURE_SUBJECTS = [
  'Assamese Literature',
  'Bengali Literature',
  'Bodo Literature',
  'Dogri Literature',
  'Gujarati Literature',
  'Hindi Literature',
  'Kannada Literature',
  'Kashmiri Literature',
  'Konkani Literature',
  'Maithili Literature',
  'Malayalam Literature',
  'Manipuri Literature',
  'Marathi Literature',
  'Nepali Literature',
  'Odia Literature',
  'Punjabi Literature',
  'Sanskrit Literature',
  'Santhali Literature',
  'Sindhi Literature',
  'Tamil Literature',
  'Telugu Literature',
  'Urdu Literature',
  'English Literature',
];

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatDateToIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// 1 GB file upload limit support
export const MAX_FILE_SIZE_BYTES = 1024 * 1024 * 1024; // 1 GB (1,073,741,824 bytes)
export const MAX_FILE_SIZE_LABEL = '1 GB';

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
];

export const ALLOWED_EXTENSIONS = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png';

export const FILE_SUBJECT_CATEGORIES = [
  'Indian History & National Movement',
  'Indian and World Geography',
  'Indian Polity and Governance',
  'Economic and Social Development',
  'Environment and Ecology',
  'General Science & Technology',
  'Current Events & Affairs',
  'CSAT',
  'Mains GS I',
  'Mains GS II',
  'Mains GS III',
  'Mains GS IV (Ethics)',
  'Essay',
  'Optional Subject',
  'Other',
];

export const FILE_FILTER_CATEGORIES = [
  'All',
  'History',
  'Geography',
  'Polity',
  'Economy',
  'Environment',
  'Science',
  'Current Events',
  'CSAT',
  'Mains',
  'Optional',
  'Other',
];

// ----------------------------------------------------------------------
// TARGETED UPSC ATTEMPT CONSTANTS (23-05-2027 SUNDAY)
// ----------------------------------------------------------------------
export const TARGET_EXAM_DATE = '2027-05-23';
export const TARGET_EXAM_TIME = '09:30:00'; // 9:30 AM IST (Prelims Paper I start time)
export const TARGET_EXAM_NAME = 'UPSC Civil Services Examination (Prelims 2027)';
export const TARGET_EXAM_DISPLAY = '23-05-2027 SUNDAY | 23rd May 2027';

export interface ExamCountdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  weeks: number;
  isPast: boolean;
}

export function getTimeRemainingToTargetExam(targetDateStr = TARGET_EXAM_DATE): ExamCountdown {
  const target = new Date(`${targetDateStr}T${TARGET_EXAM_TIME}`);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalDays: 0,
      weeks: 0,
      isPast: true,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;
  const days = Math.floor(totalHours / 24);
  const weeks = Math.floor(days / 7);

  return {
    days,
    hours,
    minutes,
    seconds,
    totalDays: days,
    weeks,
    isPast: false,
  };
}

export const PREPARATION_PHASES = [
  {
    phase: 1,
    name: 'Portion Coverage & Foundation',
    target: '100% Syllabus Coverage (NCERTs + Standard Reference Textbooks)',
    status: 'In Progress',
    badge: 'Phase 1',
  },
  {
    phase: 2,
    name: 'Consolidated Revision & Sectional PYQs',
    target: '1st & 2nd Consolidated Revision + 10-Year Subject-wise PYQs',
    status: 'Upcoming',
    badge: 'Phase 2',
  },
  {
    phase: 3,
    name: 'Rapid Revision & Mock Marathon',
    target: '3rd Rapid Revision Sprint + 30 Full-Length Mocks & CSAT Drills',
    status: 'Final 90 Days',
    badge: 'Phase 3',
  },
];
