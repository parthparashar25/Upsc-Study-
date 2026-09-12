export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role?: string;
  optional_subject?: string;
  daily_study_target: number;
  created_at?: string;
  updated_at?: string;
}

export type ExamCategory = 'Prelims' | 'Mains';
export type PaperType = 'General' | 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'Essay' | 'Optional';
export type TopicStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Revision Due';

export interface SyllabusSubject {
  id: string;
  name: string;
  exam: ExamCategory;
  paper: PaperType;
  display_order: number;
  active: boolean;
}

export interface SyllabusSection {
  id: string;
  subject_id: string;
  name: string;
  display_order: number;
}

export interface SyllabusTopic {
  id: string;
  section_id: string;
  name: string;
  description?: string;
  display_order: number;
  active: boolean;
  // Denormalized/joined convenience fields
  subject_id?: string;
  subject_name?: string;
  section_name?: string;
  exam?: ExamCategory;
  paper?: PaperType;
}

export interface TopicProgress {
  id?: string;
  user_id: string;
  topic_id: string;
  study_completed: boolean;
  revision_completed: boolean;
  pyq_completed: boolean;
  status: TopicStatus;
  notes?: string;
  last_studied?: string;
  created_at?: string;
  updated_at?: string;
}

// Legacy habit tables
export interface Subject {
  id: string;
  name: string;
  category: 'Prelims' | 'Mains';
  paper: 'General' | 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'Essay' | 'Optional';
  display_order: number;
  active: boolean;
  created_at?: string;
}

export interface HabitCompletion {
  id: string;
  user_id: string;
  subject_id: string;
  completion_date: string;
  completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DailyStats {
  id?: string;
  user_id: string;
  study_date: string;
  study_hours: number;
  study_minutes: number;
  revision_count: number;
  pyq_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  subject_id: string | null;
  subject_name?: string;
  topic: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface StudyFile {
  id: string;
  user_id: string;
  subject_id: string | null;
  subject_name?: string;
  section_id?: string | null;
  section_name?: string;
  topic_id?: string | null;
  topic_name?: string;
  filename: string;
  storage_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
  download_url?: string;
}

export type BookReadingStatus = 'To Read' | 'Reading' | 'Completed';
export type BookImportance = 'Essential' | 'Recommended' | 'Reference';

export interface ReferenceBook {
  id: string;
  user_id: string;
  title: string;
  author: string;
  subject_id: string;
  subject_name: string;
  category: string; // 'Standard Reference' | 'NCERT' | 'Government Report' | 'Custom'
  importance: BookImportance;
  edition?: string;
  description?: string;
  storage_path?: string | null;
  download_url?: string | null;
  status: BookReadingStatus;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

