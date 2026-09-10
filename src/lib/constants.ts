import { Subject } from '@/types/database';

export const APP_NAME = "UPSC Study Tracker";
export const APP_SUBTITLE = "Simple habits. Consistent preparation.";

export const DEFAULT_SUBJECTS: Omit<Subject, 'id'>[] = [
  // Prelims Core 8
  { name: 'Polity', category: 'Prelims', paper: 'General', display_order: 1, active: true },
  { name: 'History', category: 'Prelims', paper: 'General', display_order: 2, active: true },
  { name: 'Geography', category: 'Prelims', paper: 'General', display_order: 3, active: true },
  { name: 'Indian Economy', category: 'Prelims', paper: 'General', display_order: 4, active: true },
  { name: 'Environment & Ecology', category: 'Prelims', paper: 'General', display_order: 5, active: true },
  { name: 'Science & Technology', category: 'Prelims', paper: 'General', display_order: 6, active: true },
  { name: 'Current Affairs', category: 'Prelims', paper: 'General', display_order: 7, active: true },
  { name: 'CSAT', category: 'Prelims', paper: 'General', display_order: 8, active: true },

  // Mains GS Paper I
  { name: 'Indian Heritage & Culture', category: 'Mains', paper: 'GS1', display_order: 101, active: true },
  { name: 'History', category: 'Mains', paper: 'GS1', display_order: 102, active: true },
  { name: 'Geography', category: 'Mains', paper: 'GS1', display_order: 103, active: true },
  { name: 'Society', category: 'Mains', paper: 'GS1', display_order: 104, active: true },

  // Mains GS Paper II
  { name: 'Constitution', category: 'Mains', paper: 'GS2', display_order: 201, active: true },
  { name: 'Polity & Governance', category: 'Mains', paper: 'GS2', display_order: 202, active: true },
  { name: 'Social Justice', category: 'Mains', paper: 'GS2', display_order: 203, active: true },
  { name: 'International Relations', category: 'Mains', paper: 'GS2', display_order: 204, active: true },

  // Mains GS Paper III
  { name: 'Economy', category: 'Mains', paper: 'GS3', display_order: 301, active: true },
  { name: 'Agriculture', category: 'Mains', paper: 'GS3', display_order: 302, active: true },
  { name: 'Science & Technology', category: 'Mains', paper: 'GS3', display_order: 303, active: true },
  { name: 'Environment', category: 'Mains', paper: 'GS3', display_order: 304, active: true },
  { name: 'Internal Security', category: 'Mains', paper: 'GS3', display_order: 305, active: true },
  { name: 'Disaster Management', category: 'Mains', paper: 'GS3', display_order: 306, active: true },

  // Mains GS Paper IV
  { name: 'Ethics', category: 'Mains', paper: 'GS4', display_order: 401, active: true },
  { name: 'Integrity', category: 'Mains', paper: 'GS4', display_order: 402, active: true },
  { name: 'Aptitude', category: 'Mains', paper: 'GS4', display_order: 403, active: true },

  // Mains Other
  { name: 'Essay', category: 'Mains', paper: 'Essay', display_order: 501, active: true },
  { name: 'Optional Subject', category: 'Mains', paper: 'Optional', display_order: 502, active: true },
];

export const INITIAL_SUBJECTS: Subject[] = DEFAULT_SUBJECTS.map((s, idx) => ({
  ...s,
  id: `subj-default-${idx + 1}`,
}));

export const PRELIMS_CORE_SUBJECTS = INITIAL_SUBJECTS.filter(s => s.category === 'Prelims');

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

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  'Polity',
  'History',
  'Geography',
  'Economy',
  'Environment & Ecology',
  'Science & Technology',
  'Current Affairs',
  'CSAT',
  'GS I',
  'GS II',
  'GS III',
  'GS IV',
  'Essay',
  'Optional',
  'Other',
];

export const FILE_FILTER_CATEGORIES = [
  'All',
  'Polity',
  'History',
  'Geography',
  'Economy',
  'Environment',
  'Science & Technology',
  'Current Affairs',
  'CSAT',
  'Mains',
  'Other',
];
