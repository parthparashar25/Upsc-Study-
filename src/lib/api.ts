import { supabase, isSupabaseConfigured } from './supabase';
import { DailyStats, HabitCompletion, Note, Profile, StudyFile, Subject, SyllabusTopic, TopicProgress, TopicStatus } from '@/types/database';
import { INITIAL_SUBJECTS } from './constants';
import { MASTER_SYLLABUS, getAllTopics, computeTopicStatus } from './syllabus-data';

// Local storage keys for offline/demo operation
const LS_PREFIX = 'upsc_tracker_';
const LS_HABITS = `${LS_PREFIX}habits`;
const LS_STATS = `${LS_PREFIX}stats`;
const LS_NOTES = `${LS_PREFIX}notes`;
const LS_FILES = `${LS_PREFIX}files`;
const LS_PROFILE = `${LS_PREFIX}profile`;
const LS_TOPIC_PROGRESS = `${LS_PREFIX}topic_progress`;

function getLocal<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving to localStorage key: ${key}`, err);
  }
}

// ----------------------------------------------------------------------
// CHAPTER / SYLLABUS TOPIC PROGRESS API
// ----------------------------------------------------------------------

export async function fetchTopicProgress(userId: string): Promise<Record<string, TopicProgress>> {
  if (isSupabaseConfigured && userId) {
    try {
      const { data, error } = await supabase
        .from('topic_progress')
        .select('*')
        .eq('user_id', userId);

      if (!error && data) {
        const map: Record<string, TopicProgress> = {};
        data.forEach((row: any) => {
          map[row.topic_id] = row as TopicProgress;
        });
        return map;
      }
    } catch (err) {
      console.error('Error fetching topic progress from Supabase:', err);
    }
  }

  // Fallback
  const allProgress = getLocal<Record<string, TopicProgress>>(LS_TOPIC_PROGRESS, {});
  return allProgress;
}

export async function updateTopicProgress(
  userId: string,
  topicId: string,
  updates: Partial<TopicProgress>
): Promise<TopicProgress> {
  const now = new Date().toISOString();

  // Determine current record
  const currentMap = getLocal<Record<string, TopicProgress>>(LS_TOPIC_PROGRESS, {});
  const current = currentMap[topicId] || {
    user_id: userId || 'demo-user',
    topic_id: topicId,
    study_completed: false,
    revision_completed: false,
    pyq_completed: false,
    status: 'Not Started' as TopicStatus,
    notes: '',
  };

  const study = updates.study_completed !== undefined ? updates.study_completed : current.study_completed;
  const revision = updates.revision_completed !== undefined ? updates.revision_completed : current.revision_completed;
  const pyq = updates.pyq_completed !== undefined ? updates.pyq_completed : current.pyq_completed;
  const notes = updates.notes !== undefined ? updates.notes : current.notes;
  const status = updates.status !== undefined ? updates.status : computeTopicStatus(study, revision, pyq, current.status);

  const payload: TopicProgress = {
    ...current,
    ...updates,
    user_id: userId || 'demo-user',
    topic_id: topicId,
    study_completed: study,
    revision_completed: revision,
    pyq_completed: pyq,
    notes,
    status,
    last_studied: now,
    updated_at: now,
  };

  if (isSupabaseConfigured && userId) {
    try {
      const { data, error } = await supabase
        .from('topic_progress')
        .upsert(
          {
            user_id: userId,
            topic_id: topicId,
            study_completed: study,
            revision_completed: revision,
            pyq_completed: pyq,
            status,
            notes,
            last_studied: now,
            updated_at: now,
          },
          { onConflict: 'user_id,topic_id' }
        )
        .select()
        .single();

      if (!error && data) {
        currentMap[topicId] = data as TopicProgress;
        setLocal(LS_TOPIC_PROGRESS, currentMap);
        return data as TopicProgress;
      }
    } catch (err) {
      console.error('Error updating topic progress in Supabase:', err);
    }
  }

  currentMap[topicId] = payload;
  setLocal(LS_TOPIC_PROGRESS, currentMap);
  return payload;
}

export async function fetchRecentlyStudiedTopics(userId: string, limit = 5): Promise<(SyllabusTopic & { progress: TopicProgress })[]> {
  const allTopics = getAllTopics();
  const progressMap = await fetchTopicProgress(userId);

  const list: (SyllabusTopic & { progress: TopicProgress })[] = [];

  Object.values(progressMap).forEach((prog) => {
    if (prog.last_studied && (prog.study_completed || prog.status !== 'Not Started')) {
      const topic = allTopics.find((t) => t.id === prog.topic_id);
      if (topic) {
        list.push({
          ...topic,
          progress: prog,
        });
      }
    }
  });

  list.sort((a, b) => {
    const timeA = a.progress.last_studied ? new Date(a.progress.last_studied).getTime() : 0;
    const timeB = b.progress.last_studied ? new Date(b.progress.last_studied).getTime() : 0;
    return timeB - timeA;
  });

  if (list.length === 0) {
    // Return first 3 default topics as suggestion
    return allTopics.slice(0, 3).map((t) => ({
      ...t,
      progress: {
        user_id: userId || 'demo-user',
        topic_id: t.id,
        study_completed: false,
        revision_completed: false,
        pyq_completed: false,
        status: 'Not Started',
      },
    }));
  }

  return list.slice(0, limit);
}

export interface SyllabusCategoryStats {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  revisionDue: number;
  percent: number;
}

export async function fetchSyllabusStatistics(userId: string): Promise<{
  overall: SyllabusCategoryStats;
  prelims: SyllabusCategoryStats;
  mains: SyllabusCategoryStats;
  subjectStats: Record<string, SyllabusCategoryStats>;
}> {
  const allTopics = getAllTopics();
  const progressMap = await fetchTopicProgress(userId);

  const createStats = (): SyllabusCategoryStats => ({
    total: 0,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    revisionDue: 0,
    percent: 0,
  });

  const overall = createStats();
  const prelims = createStats();
  const mains = createStats();
  const subjectStats: Record<string, SyllabusCategoryStats> = {};

  MASTER_SYLLABUS.forEach((s) => {
    subjectStats[s.id] = createStats();
  });

  allTopics.forEach((t) => {
    const prog = progressMap[t.id];
    const status: TopicStatus = prog?.status || 'Not Started';

    // Overall
    overall.total++;
    if (status === 'Completed') overall.completed++;
    else if (status === 'In Progress') overall.inProgress++;
    else if (status === 'Revision Due') overall.revisionDue++;
    else overall.notStarted++;

    // Exam category
    const targetExam = t.exam === 'Prelims' ? prelims : mains;
    targetExam.total++;
    if (status === 'Completed') targetExam.completed++;
    else if (status === 'In Progress') targetExam.inProgress++;
    else if (status === 'Revision Due') targetExam.revisionDue++;
    else targetExam.notStarted++;

    // Subject
    if (t.subject_id && subjectStats[t.subject_id]) {
      const subj = subjectStats[t.subject_id];
      subj.total++;
      if (status === 'Completed') subj.completed++;
      else if (status === 'In Progress') subj.inProgress++;
      else if (status === 'Revision Due') subj.revisionDue++;
      else subj.notStarted++;
    }
  });

  // Calculate percentages
  overall.percent = overall.total > 0 ? Math.round((overall.completed / overall.total) * 100) : 0;
  prelims.percent = prelims.total > 0 ? Math.round((prelims.completed / prelims.total) * 100) : 0;
  mains.percent = mains.total > 0 ? Math.round((mains.completed / mains.total) * 100) : 0;

  Object.keys(subjectStats).forEach((sId) => {
    const s = subjectStats[sId];
    s.percent = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
  });

  return { overall, prelims, mains, subjectStats };
}

// ----------------------------------------------------------------------
// SUBJECTS API
// ----------------------------------------------------------------------
export async function fetchSubjects(): Promise<Subject[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as Subject[];
      }
    } catch (err) {
      console.warn('Could not fetch subjects from Supabase, using defaults', err);
    }
  }
  return INITIAL_SUBJECTS;
}

// ----------------------------------------------------------------------
// HABITS API
// ----------------------------------------------------------------------
export async function fetchHabitsForDate(userId: string, dateStr: string): Promise<Record<string, boolean>> {
  if (isSupabaseConfigured && userId) {
    try {
      const { data, error } = await supabase
        .from('habit_completions')
        .select('subject_id, completed')
        .eq('user_id', userId)
        .eq('completion_date', dateStr);

      if (!error && data) {
        const map: Record<string, boolean> = {};
        data.forEach(row => {
          map[row.subject_id] = row.completed;
        });
        return map;
      }
    } catch (err) {
      console.error('Error fetching habit completions:', err);
    }
  }

  const habits = getLocal<HabitCompletion[]>(LS_HABITS, []);
  const map: Record<string, boolean> = {};
  habits
    .filter(h => h.completion_date === dateStr && (!userId || h.user_id === userId))
    .forEach(h => {
      map[h.subject_id] = h.completed;
    });
  return map;
}

export async function toggleHabitCompletion(
  userId: string,
  subjectId: string,
  dateStr: string,
  completed: boolean
): Promise<boolean> {
  if (isSupabaseConfigured && userId) {
    try {
      const { error } = await supabase
        .from('habit_completions')
        .upsert(
          {
            user_id: userId,
            subject_id: subjectId,
            completion_date: dateStr,
            completed,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,subject_id,completion_date' }
        );

      if (error) {
        console.error('Supabase habit upsert error:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Exception updating habit:', err);
      return false;
    }
  }

  const habits = getLocal<HabitCompletion[]>(LS_HABITS, []);
  const existingIdx = habits.findIndex(
    h => h.subject_id === subjectId && h.completion_date === dateStr && h.user_id === (userId || 'demo-user')
  );

  if (existingIdx >= 0) {
    habits[existingIdx].completed = completed;
    habits[existingIdx].updated_at = new Date().toISOString();
  } else {
    habits.push({
      id: `local-habit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId || 'demo-user',
      subject_id: subjectId,
      completion_date: dateStr,
      completed,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
  setLocal(LS_HABITS, habits);
  return true;
}

// ----------------------------------------------------------------------
// DAILY STATS API
// ----------------------------------------------------------------------
export async function fetchDailyStats(userId: string, dateStr: string): Promise<DailyStats> {
  const defaultStats: DailyStats = {
    user_id: userId || 'demo-user',
    study_date: dateStr,
    study_hours: 0,
    study_minutes: 0,
    revision_count: 0,
    pyq_count: 0,
  };

  if (isSupabaseConfigured && userId) {
    try {
      const { data, error } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('study_date', dateStr)
        .maybeSingle();

      if (!error && data) {
        return data as DailyStats;
      }
    } catch (err) {
      console.error('Error fetching daily stats:', err);
    }
  }

  const allStats = getLocal<DailyStats[]>(LS_STATS, []);
  const found = allStats.find(s => s.study_date === dateStr && (!userId || s.user_id === userId));
  return found || defaultStats;
}

export async function saveDailyStats(userId: string, stats: Partial<DailyStats> & { study_date: string }): Promise<boolean> {
  const payload = {
    user_id: userId || 'demo-user',
    study_date: stats.study_date,
    study_hours: Number(stats.study_hours) || 0,
    study_minutes: Number(stats.study_minutes) || 0,
    revision_count: Number(stats.revision_count) || 0,
    pyq_count: Number(stats.pyq_count) || 0,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && userId) {
    try {
      const { error } = await supabase
        .from('daily_stats')
        .upsert(payload, { onConflict: 'user_id,study_date' });

      if (error) {
        console.error('Supabase stats upsert error:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Exception saving daily stats:', err);
      return false;
    }
  }

  const allStats = getLocal<DailyStats[]>(LS_STATS, []);
  const idx = allStats.findIndex(s => s.study_date === stats.study_date && s.user_id === (userId || 'demo-user'));
  if (idx >= 0) {
    allStats[idx] = { ...allStats[idx], ...payload };
  } else {
    allStats.push({
      id: `local-stat-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...payload,
    });
  }
  setLocal(LS_STATS, allStats);
  return true;
}

// ----------------------------------------------------------------------
// CALENDAR MONTH AGGREGATE API
// ----------------------------------------------------------------------
export interface DaySummary {
  date: string;
  completedCount: number;
  totalPlanned: number;
  studyHours: number;
  studyMinutes: number;
  revisionCount: number;
  pyqCount: number;
}

export async function fetchMonthSummary(userId: string, year: number, month: number): Promise<Record<string, DaySummary>> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

  const summaryMap: Record<string, DaySummary> = {};

  if (isSupabaseConfigured && userId) {
    try {
      const [habitsRes, statsRes] = await Promise.all([
        supabase
          .from('habit_completions')
          .select('completion_date, completed')
          .eq('user_id', userId)
          .gte('completion_date', startDate)
          .lte('completion_date', endDate),
        supabase
          .from('daily_stats')
          .select('*')
          .eq('user_id', userId)
          .gte('study_date', startDate)
          .lte('study_date', endDate),
      ]);

      if (habitsRes.data) {
        habitsRes.data.forEach(h => {
          if (!summaryMap[h.completion_date]) {
            summaryMap[h.completion_date] = {
              date: h.completion_date,
              completedCount: 0,
              totalPlanned: 8,
              studyHours: 0,
              studyMinutes: 0,
              revisionCount: 0,
              pyqCount: 0,
            };
          }
          if (h.completed) {
            summaryMap[h.completion_date].completedCount += 1;
          }
        });
      }

      if (statsRes.data) {
        statsRes.data.forEach(s => {
          if (!summaryMap[s.study_date]) {
            summaryMap[s.study_date] = {
              date: s.study_date,
              completedCount: 0,
              totalPlanned: 8,
              studyHours: 0,
              studyMinutes: 0,
              revisionCount: 0,
              pyqCount: 0,
            };
          }
          summaryMap[s.study_date].studyHours = s.study_hours;
          summaryMap[s.study_date].studyMinutes = s.study_minutes;
          summaryMap[s.study_date].revisionCount = s.revision_count;
          summaryMap[s.study_date].pyqCount = s.pyq_count;
        });
      }

      return summaryMap;
    } catch (err) {
      console.error('Error fetching calendar month summary:', err);
    }
  }

  const habits = getLocal<HabitCompletion[]>(LS_HABITS, []);
  const stats = getLocal<DailyStats[]>(LS_STATS, []);

  habits.forEach(h => {
    if (h.completion_date >= startDate && h.completion_date <= endDate && (!userId || h.user_id === userId)) {
      if (!summaryMap[h.completion_date]) {
        summaryMap[h.completion_date] = {
          date: h.completion_date,
          completedCount: 0,
          totalPlanned: 8,
          studyHours: 0,
          studyMinutes: 0,
          revisionCount: 0,
          pyqCount: 0,
        };
      }
      if (h.completed) {
        summaryMap[h.completion_date].completedCount += 1;
      }
    }
  });

  stats.forEach(s => {
    if (s.study_date >= startDate && s.study_date <= endDate && (!userId || s.user_id === userId)) {
      if (!summaryMap[s.study_date]) {
        summaryMap[s.study_date] = {
          date: s.study_date,
          completedCount: 0,
          totalPlanned: 8,
          studyHours: 0,
          studyMinutes: 0,
          revisionCount: 0,
          pyqCount: 0,
        };
      }
      summaryMap[s.study_date].studyHours = s.study_hours;
      summaryMap[s.study_date].studyMinutes = s.study_minutes;
      summaryMap[s.study_date].revisionCount = s.revision_count;
      summaryMap[s.study_date].pyqCount = s.pyq_count;
    }
  });

  return summaryMap;
}

// ----------------------------------------------------------------------
// NOTES API
// ----------------------------------------------------------------------
export async function fetchNotes(userId: string): Promise<Note[]> {
  if (isSupabaseConfigured && userId) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          id,
          user_id,
          title,
          subject_id,
          topic,
          content,
          created_at,
          updated_at,
          subjects ( name )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (!error && data) {
        return data.map((n: any) => ({
          ...n,
          subject_name: n.subjects?.name || '',
        }));
      }
    } catch (err) {
      console.error('Error fetching notes from Supabase:', err);
    }
  }

  return getLocal<Note[]>(LS_NOTES, []);
}

export async function saveNote(userId: string, note: Partial<Note>): Promise<{ success: boolean; note?: Note }> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured && userId) {
    try {
      const payload: any = {
        user_id: userId,
        title: note.title?.trim() || 'Untitled Note',
        subject_id: note.subject_id || null,
        topic: note.topic?.trim() || '',
        content: note.content || '',
        updated_at: now,
      };

      if (note.id && !note.id.startsWith('local-')) {
        const { data, error } = await supabase
          .from('notes')
          .update(payload)
          .eq('id', note.id)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        return { success: true, note: data as Note };
      } else {
        payload.created_at = now;
        const { data, error } = await supabase
          .from('notes')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        return { success: true, note: data as Note };
      }
    } catch (err) {
      console.error('Error saving note in Supabase:', err);
      return { success: false };
    }
  }

  const notes = getLocal<Note[]>(LS_NOTES, []);
  if (note.id) {
    const idx = notes.findIndex(n => n.id === note.id);
    if (idx >= 0) {
      notes[idx] = {
        ...notes[idx],
        title: note.title?.trim() || notes[idx].title,
        subject_id: note.subject_id ?? notes[idx].subject_id,
        subject_name: note.subject_name ?? notes[idx].subject_name,
        topic: note.topic !== undefined ? note.topic : notes[idx].topic,
        content: note.content !== undefined ? note.content : notes[idx].content,
        updated_at: now,
      };
      setLocal(LS_NOTES, notes);
      return { success: true, note: notes[idx] };
    }
  }

  const newNote: Note = {
    id: `local-note-${Date.now()}`,
    user_id: userId || 'demo-user',
    title: note.title?.trim() || 'Untitled Note',
    subject_id: note.subject_id || null,
    subject_name: note.subject_name || '',
    topic: note.topic?.trim() || '',
    content: note.content || '',
    created_at: now,
    updated_at: now,
  };
  notes.unshift(newNote);
  setLocal(LS_NOTES, notes);
  return { success: true, note: newNote };
}

export async function deleteNote(userId: string, noteId: string): Promise<boolean> {
  if (isSupabaseConfigured && userId && !noteId.startsWith('local-')) {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting note:', err);
      return false;
    }
  }

  const notes = getLocal<Note[]>(LS_NOTES, []);
  const filtered = notes.filter(n => n.id !== noteId);
  setLocal(LS_NOTES, filtered);
  return true;
}

// ----------------------------------------------------------------------
// FILES API
// ----------------------------------------------------------------------
export async function fetchStudyFiles(userId: string): Promise<StudyFile[]> {
  if (isSupabaseConfigured && userId) {
    try {
      const { data, error } = await supabase
        .from('study_files')
        .select(`
          id,
          user_id,
          subject_id,
          section_id,
          topic_id,
          filename,
          storage_path,
          file_type,
          file_size,
          created_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((f: any) => ({
          ...f,
          subject_name: f.subject_id || '',
        }));
      }
    } catch (err) {
      console.error('Error fetching files:', err);
    }
  }

  return getLocal<StudyFile[]>(LS_FILES, []);
}

export async function uploadStudyFile(
  userId: string,
  file: File,
  subjectId: string | null,
  subjectName?: string,
  sectionId?: string | null,
  sectionName?: string,
  topicId?: string | null,
  topicName?: string
): Promise<{ success: boolean; file?: StudyFile; error?: string }> {
  if (isSupabaseConfigured && userId) {
    try {
      const fileExt = file.name.split('.').pop();
      const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const safeSubject = (subjectName || subjectId || 'general')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');
      const storagePath = `${userId}/${safeSubject}/${Date.now()}_${safeFilename}`;

      const { error: storageError } = await supabase.storage
        .from('study-files')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (storageError) {
        throw new Error(`Storage upload failed: ${storageError.message}`);
      }

      const { data: dbData, error: dbError } = await supabase
        .from('study_files')
        .insert({
          user_id: userId,
          subject_id: subjectId || null,
          section_id: sectionId || null,
          topic_id: topicId || null,
          filename: file.name,
          storage_path: storagePath,
          file_type: file.type || fileExt || 'application/octet-stream',
          file_size: file.size,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return {
        success: true,
        file: {
          ...dbData,
          subject_name: subjectName || subjectId || '',
          section_name: sectionName || '',
          topic_name: topicName || '',
        },
      };
    } catch (err: any) {
      console.error('Upload failed:', err);
      return { success: false, error: err?.message || 'Could not upload file.' };
    }
  }

  const files = getLocal<StudyFile[]>(LS_FILES, []);
  const newFile: StudyFile = {
    id: `local-file-${Date.now()}`,
    user_id: userId || 'demo-user',
    subject_id: subjectId || null,
    subject_name: subjectName || subjectId || '',
    section_id: sectionId || null,
    section_name: sectionName || '',
    topic_id: topicId || null,
    topic_name: topicName || '',
    filename: file.name,
    storage_path: `local/${file.name}`,
    file_type: file.type || 'document',
    file_size: file.size,
    created_at: new Date().toISOString(),
    download_url: URL.createObjectURL(file),
  };
  files.unshift(newFile);
  setLocal(LS_FILES, files);
  return { success: true, file: newFile };
}

export async function linkFileToTopic(
  userId: string,
  fileId: string,
  subjectId: string | null,
  subjectName?: string,
  sectionId?: string | null,
  sectionName?: string,
  topicId?: string | null,
  topicName?: string
): Promise<{ success: boolean; file?: StudyFile; error?: string }> {
  if (isSupabaseConfigured && userId && !fileId.startsWith('local-')) {
    try {
      const { data, error } = await supabase
        .from('study_files')
        .update({
          subject_id: subjectId || null,
          section_id: sectionId || null,
          topic_id: topicId || null,
        })
        .eq('id', fileId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return {
        success: true,
        file: {
          ...data,
          subject_name: subjectName || subjectId || '',
          section_name: sectionName || '',
          topic_name: topicName || '',
        },
      };
    } catch (err: any) {
      console.error('Error linking file:', err);
      return { success: false, error: err?.message || 'Could not link file.' };
    }
  }

  const files = getLocal<StudyFile[]>(LS_FILES, []);
  const idx = files.findIndex((f) => f.id === fileId);
  if (idx >= 0) {
    files[idx] = {
      ...files[idx],
      subject_id: subjectId || null,
      subject_name: subjectName || subjectId || files[idx].subject_name,
      section_id: sectionId || null,
      section_name: sectionName || files[idx].section_name,
      topic_id: topicId || null,
      topic_name: topicName || files[idx].topic_name,
    };
    setLocal(LS_FILES, files);
    return { success: true, file: files[idx] };
  }
  return { success: false, error: 'File not found.' };
}

export async function fetchFilesForTopic(userId: string, topicId: string): Promise<StudyFile[]> {
  const allFiles = await fetchStudyFiles(userId);
  return allFiles.filter((f) => f.topic_id === topicId);
}

export async function deleteStudyFile(
  userId: string,
  fileId: string,
  storagePath: string
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && userId && !fileId.startsWith('local-')) {
    try {
      // 1. Delete from Supabase Storage first
      const { error: storageError } = await supabase.storage
        .from('study-files')
        .remove([storagePath]);

      if (storageError) {
        throw new Error(`Storage removal failed: ${storageError.message}`);
      }

      // 2. Delete metadata only after storage removal succeeds
      const { error: dbError } = await supabase
        .from('study_files')
        .delete()
        .eq('id', fileId)
        .eq('user_id', userId);

      if (dbError) throw dbError;
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting file:', err);
      return { success: false, error: err?.message || 'Could not delete file.' };
    }
  }

  const files = getLocal<StudyFile[]>(LS_FILES, []);
  setLocal(LS_FILES, files.filter((f) => f.id !== fileId));
  return { success: true };
}

export async function getFileDownloadUrl(storagePath: string): Promise<string | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.storage
        .from('study-files')
        .createSignedUrl(storagePath, 3600);

      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
    } catch (err) {
      console.error('Error getting download URL:', err);
    }
  }
  return null;
}

// ----------------------------------------------------------------------
// PROFILE API
// ----------------------------------------------------------------------
export async function fetchProfile(userId: string): Promise<Profile> {
  const defaultProfile: Profile = {
    id: userId || 'demo-user',
    full_name: 'Aspirant',
    email: 'aspirant@upsc.test',
    optional_subject: 'General',
    daily_study_target: 4,
  };

  if (isSupabaseConfigured && userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        return data as Profile;
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }

  return getLocal<Profile>(LS_PROFILE, defaultProfile);
}

export async function updateProfileData(userId: string, profile: Partial<Profile>): Promise<boolean> {
  if (isSupabaseConfigured && userId) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          optional_subject: profile.optional_subject,
          daily_study_target: profile.daily_study_target,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      return false;
    }
  }

  const existing = getLocal<Profile>(LS_PROFILE, {
    id: userId || 'demo-user',
    full_name: 'Aspirant',
    email: 'aspirant@upsc.test',
    optional_subject: 'General',
    daily_study_target: 4,
  });
  setLocal(LS_PROFILE, { ...existing, ...profile, updated_at: new Date().toISOString() });
  return true;
}
