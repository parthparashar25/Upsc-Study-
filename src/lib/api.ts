import { supabase, isSupabaseConfigured } from './supabase';
import {
  BookImportance,
  BookReadingStatus,
  DailyStats,
  DailyTopicLog,
  HabitCompletion,
  Note,
  Profile,
  ReferenceBook,
  StudyFile,
  Subject,
  SyllabusTopic,
  TopicProgress,
  TopicStatus,
} from '@/types/database';
import { INITIAL_SUBJECTS } from './constants';
import { MASTER_SYLLABUS, getAllTopics, computeTopicStatus } from './syllabus-data';
import { DEFAULT_UPSC_BOOKS } from './books-data';

// Local storage keys for offline/demo operation
const LS_PREFIX = 'upsc_tracker_';
const LS_HABITS = `${LS_PREFIX}habits`;
const LS_STATS = `${LS_PREFIX}stats`;
const LS_NOTES = `${LS_PREFIX}notes`;
const LS_FILES = `${LS_PREFIX}files`;
const LS_PROFILE = `${LS_PREFIX}profile`;
const LS_TOPIC_PROGRESS = `${LS_PREFIX}topic_progress`;
const LS_BOOKS = `${LS_PREFIX}reference_books`;
const LS_DAILY_LOGS = `${LS_PREFIX}daily_topic_logs`;

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
// IN-MEMORY PERFORMANCE CACHE & REQUEST DEDUPLICATION
// Eliminates network latency on repeated views, tab changes & concurrent calls
// ----------------------------------------------------------------------
const cache = {
  subjects: null as Subject[] | null,
  topicProgress: {} as Record<string, { data: Record<string, TopicProgress>; ts: number }>,
  habits: {} as Record<string, { data: Record<string, boolean>; ts: number }>,
  dailyStats: {} as Record<string, { data: DailyStats; ts: number }>,
  dailyTopicLogs: {} as Record<string, { data: DailyTopicLog[]; ts: number }>,
  monthSummary: {} as Record<string, { data: Record<string, DaySummary>; ts: number }>,
  notes: {} as Record<string, { data: Note[]; ts: number }>,
  studyFiles: {} as Record<string, { data: StudyFile[]; ts: number }>,
  referenceBooks: {} as Record<string, { data: ReferenceBook[]; ts: number }>,
  profile: {} as Record<string, { data: Profile; ts: number }>,
  syllabusStats: {} as Record<string, { data: any; ts: number }>,
};

const inFlight = new Map<string, Promise<any>>();

function dedup<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (inFlight.has(key)) {
    return inFlight.get(key) as Promise<T>;
  }
  const promise = fn().finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, promise);
  return promise;
}

const CACHE_TTL_MS = 60000; // 1 minute fresh cache window

// ----------------------------------------------------------------------
// CHAPTER / SYLLABUS TOPIC PROGRESS API
// ----------------------------------------------------------------------

export async function fetchTopicProgress(userId: string): Promise<Record<string, TopicProgress>> {
  if (!userId) return getLocal<Record<string, TopicProgress>>(LS_TOPIC_PROGRESS, {});

  // 1. Check in-memory cache for instant 0ms response
  const cached = cache.topicProgress[userId];
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  // 2. Fetch from Supabase with request deduplication
  if (isSupabaseConfigured) {
    return dedup(`topicProgress_${userId}`, async () => {
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
          cache.topicProgress[userId] = { data: map, ts: Date.now() };
          setLocal(LS_TOPIC_PROGRESS, map);
          return map;
        }
      } catch (err) {
        console.error('Error fetching topic progress from Supabase:', err);
      }
      const fallback = getLocal<Record<string, TopicProgress>>(LS_TOPIC_PROGRESS, {});
      cache.topicProgress[userId] = { data: fallback, ts: Date.now() };
      return fallback;
    });
  }

  // Fallback
  const allProgress = getLocal<Record<string, TopicProgress>>(LS_TOPIC_PROGRESS, {});
  cache.topicProgress[userId] = { data: allProgress, ts: Date.now() };
  return allProgress;
}

export async function updateTopicProgress(
  userId: string,
  topicId: string,
  updates: Partial<TopicProgress>
): Promise<TopicProgress> {
  const now = new Date().toISOString();

  // Determine current record
  const currentMap =
    cache.topicProgress[userId]?.data ||
    getLocal<Record<string, TopicProgress>>(LS_TOPIC_PROGRESS, {});

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

  // Immediate optimistic update in memory for 0ms delay
  currentMap[topicId] = payload;
  cache.topicProgress[userId] = { data: currentMap, ts: Date.now() };
  delete cache.syllabusStats[userId]; // invalidate aggregate stats
  setLocal(LS_TOPIC_PROGRESS, currentMap);

  if (isSupabaseConfigured && userId) {
    (async () => {
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
          cache.topicProgress[userId] = { data: currentMap, ts: Date.now() };
          setLocal(LS_TOPIC_PROGRESS, currentMap);
        }
      } catch (err) {
        console.error('Error updating topic progress in Supabase:', err);
      }
    })();
  }

  return payload;
}

export async function fetchRecentlyStudiedTopics(
  userId: string,
  limit = 5
): Promise<(SyllabusTopic & { progress: TopicProgress })[]> {
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
  if (cache.syllabusStats[userId] && Date.now() - cache.syllabusStats[userId].ts < CACHE_TTL_MS) {
    return cache.syllabusStats[userId].data;
  }

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

  let totalRevisionsCount = 0;
  let totalPyqsCount = 0;
  let totalStudySessionsCount = 0;

  Object.values(progressMap).forEach((prog) => {
    if (prog.study_completed) totalStudySessionsCount++;
    if (prog.revision_completed) totalRevisionsCount++;
    if (prog.pyq_completed) totalPyqsCount++;
  });

  const result = {
    overall,
    prelims,
    mains,
    subjectStats,
    totalRevisionsCount,
    totalPyqsCount,
    totalStudySessionsCount,
  };
  cache.syllabusStats[userId] = { data: result, ts: Date.now() };
  return result;
}

// ----------------------------------------------------------------------
// SUBJECTS API
// ----------------------------------------------------------------------
export async function fetchSubjects(): Promise<Subject[]> {
  // Return cached metadata immediately in 0ms
  if (cache.subjects && cache.subjects.length > 0) {
    return cache.subjects;
  }

  if (isSupabaseConfigured) {
    return dedup('subjects', async () => {
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('*')
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          cache.subjects = data as Subject[];
          return cache.subjects;
        }
      } catch (err) {
        console.warn('Could not fetch subjects from Supabase, using defaults', err);
      }
      cache.subjects = INITIAL_SUBJECTS;
      return INITIAL_SUBJECTS;
    });
  }

  cache.subjects = INITIAL_SUBJECTS;
  return INITIAL_SUBJECTS;
}

// ----------------------------------------------------------------------
// HABITS API
// ----------------------------------------------------------------------
export async function fetchHabitsForDate(userId: string, dateStr: string): Promise<Record<string, boolean>> {
  const cacheKey = `${userId}_${dateStr}`;
  const cached = cache.habits[cacheKey];
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  if (isSupabaseConfigured && userId) {
    return dedup(`habits_${cacheKey}`, async () => {
      try {
        const { data, error } = await supabase
          .from('habit_completions')
          .select('subject_id, completed')
          .eq('user_id', userId)
          .eq('completion_date', dateStr);

        if (!error && data) {
          const map: Record<string, boolean> = {};
          data.forEach((row) => {
            map[row.subject_id] = row.completed;
          });
          cache.habits[cacheKey] = { data: map, ts: Date.now() };
          return map;
        }
      } catch (err) {
        console.error('Error fetching habit completions:', err);
      }
      return getLocalHabits(userId, dateStr);
    });
  }

  return getLocalHabits(userId, dateStr);
}

function getLocalHabits(userId: string, dateStr: string): Record<string, boolean> {
  const habits = getLocal<HabitCompletion[]>(LS_HABITS, []);
  const map: Record<string, boolean> = {};
  habits
    .filter((h) => h.completion_date === dateStr && (!userId || h.user_id === userId))
    .forEach((h) => {
      map[h.subject_id] = h.completed;
    });
  const cacheKey = `${userId}_${dateStr}`;
  cache.habits[cacheKey] = { data: map, ts: Date.now() };
  return map;
}

export async function toggleHabitCompletion(
  userId: string,
  subjectId: string,
  dateStr: string,
  completed: boolean
): Promise<boolean> {
  const cacheKey = `${userId}_${dateStr}`;
  if (!cache.habits[cacheKey]) {
    cache.habits[cacheKey] = { data: {}, ts: Date.now() };
  }

  // Instant optimistic in-memory update (0ms)
  cache.habits[cacheKey].data[subjectId] = completed;

  // Invalidate month summary so calendar updates
  const [yearStr, monthStr] = dateStr.split('-');
  if (yearStr && monthStr) {
    delete cache.monthSummary[`${userId}_${parseInt(yearStr)}_${parseInt(monthStr)}`];
  }

  if (isSupabaseConfigured && userId) {
    try {
      const { error } = await supabase.from('habit_completions').upsert(
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
    (h) => h.subject_id === subjectId && h.completion_date === dateStr && h.user_id === (userId || 'demo-user')
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
  const cacheKey = `${userId}_${dateStr}`;
  const cached = cache.dailyStats[cacheKey];
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  const defaultStats: DailyStats = {
    user_id: userId || 'demo-user',
    study_date: dateStr,
    study_hours: 0,
    study_minutes: 0,
    revision_count: 0,
    pyq_count: 0,
  };

  if (isSupabaseConfigured && userId) {
    return dedup(`dailyStats_${cacheKey}`, async () => {
      try {
        const { data, error } = await supabase
          .from('daily_stats')
          .select('*')
          .eq('user_id', userId)
          .eq('study_date', dateStr)
          .maybeSingle();

        if (!error && data) {
          cache.dailyStats[cacheKey] = { data: data as DailyStats, ts: Date.now() };
          return data as DailyStats;
        }
      } catch (err) {
        console.error('Error fetching daily stats:', err);
      }
      cache.dailyStats[cacheKey] = { data: defaultStats, ts: Date.now() };
      return defaultStats;
    });
  }

  const allStats = getLocal<DailyStats[]>(LS_STATS, []);
  const found = allStats.find((s) => s.study_date === dateStr && (!userId || s.user_id === userId));
  const res = found || defaultStats;
  cache.dailyStats[cacheKey] = { data: res, ts: Date.now() };
  return res;
}

export async function saveDailyStats(
  userId: string,
  stats: Partial<DailyStats> & { study_date: string }
): Promise<boolean> {
  const cacheKey = `${userId}_${stats.study_date}`;
  const payload: DailyStats = {
    id: cache.dailyStats[cacheKey]?.data?.id || `local-stat-${Date.now()}`,
    user_id: userId || 'demo-user',
    study_date: stats.study_date,
    study_hours: Number(stats.study_hours) || 0,
    study_minutes: Number(stats.study_minutes) || 0,
    revision_count: Number(stats.revision_count) || 0,
    pyq_count: Number(stats.pyq_count) || 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Instant optimistic update in memory (0ms)
  cache.dailyStats[cacheKey] = { data: payload, ts: Date.now() };

  // Invalidate month summary so calendar updates immediately
  const [yearStr, monthStr] = stats.study_date.split('-');
  if (yearStr && monthStr) {
    delete cache.monthSummary[`${userId}_${parseInt(yearStr)}_${parseInt(monthStr)}`];
  }

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
  const idx = allStats.findIndex(
    (s) => s.study_date === stats.study_date && s.user_id === (userId || 'demo-user')
  );
  if (idx >= 0) {
    allStats[idx] = { ...allStats[idx], ...payload };
  } else {
    allStats.push(payload);
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

export async function fetchMonthSummary(
  userId: string,
  year: number,
  month: number
): Promise<Record<string, DaySummary>> {
  const cacheKey = `${userId}_${year}_${month}`;
  const cached = cache.monthSummary[cacheKey];
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

  const summaryMap: Record<string, DaySummary> = {};

  if (isSupabaseConfigured && userId) {
    return dedup(`monthSummary_${cacheKey}`, async () => {
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
          habitsRes.data.forEach((h) => {
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
          statsRes.data.forEach((s) => {
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

        cache.monthSummary[cacheKey] = { data: summaryMap, ts: Date.now() };
        return summaryMap;
      } catch (err) {
        console.error('Error fetching calendar month summary:', err);
      }
      return getLocalMonthSummary(userId, startDate, endDate, summaryMap);
    });
  }

  return getLocalMonthSummary(userId, startDate, endDate, summaryMap);
}

function getLocalMonthSummary(
  userId: string,
  startDate: string,
  endDate: string,
  summaryMap: Record<string, DaySummary>
): Record<string, DaySummary> {
  const habits = getLocal<HabitCompletion[]>(LS_HABITS, []);
  const stats = getLocal<DailyStats[]>(LS_STATS, []);

  habits.forEach((h) => {
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

  stats.forEach((s) => {
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
  if (cache.notes[userId] && Date.now() - cache.notes[userId].ts < CACHE_TTL_MS) {
    return cache.notes[userId].data;
  }

  if (isSupabaseConfigured && userId) {
    return dedup(`notes_${userId}`, async () => {
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
          const notes = data
            .filter((n: any) => !n.title?.startsWith('__upsc_'))
            .map((n: any) => ({
              ...n,
              subject_name: n.subjects?.name || '',
            }));
          cache.notes[userId] = { data: notes, ts: Date.now() };
          setLocal(LS_NOTES, notes);
          return notes;
        }
      } catch (err) {
        console.error('Error fetching notes from Supabase:', err);
      }
      const local = getLocal<Note[]>(LS_NOTES, []).filter((n) => !n.title?.startsWith('__upsc_'));
      cache.notes[userId] = { data: local, ts: Date.now() };
      return local;
    });
  }

  const local = getLocal<Note[]>(LS_NOTES, []).filter((n) => !n.title?.startsWith('__upsc_'));
  cache.notes[userId] = { data: local, ts: Date.now() };
  return local;
}

export async function saveNote(
  userId: string,
  note: Partial<Note>
): Promise<{ success: boolean; note?: Note }> {
  const now = new Date().toISOString();

  // Optimistic update in memory
  const currentNotes = cache.notes[userId]?.data || getLocal<Note[]>(LS_NOTES, []);

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
        const saved = data as Note;
        const idx = currentNotes.findIndex((n) => n.id === note.id);
        if (idx >= 0) currentNotes[idx] = { ...currentNotes[idx], ...saved };
        cache.notes[userId] = { data: [...currentNotes], ts: Date.now() };
        return { success: true, note: saved };
      } else {
        payload.created_at = now;
        const { data, error } = await supabase
          .from('notes')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        const created = data as Note;
        const updatedList = [created, ...currentNotes];
        cache.notes[userId] = { data: updatedList, ts: Date.now() };
        return { success: true, note: created };
      }
    } catch (err) {
      console.error('Error saving note in Supabase:', err);
      return { success: false };
    }
  }

  const notes = getLocal<Note[]>(LS_NOTES, []);
  if (note.id) {
    const idx = notes.findIndex((n) => n.id === note.id);
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
      cache.notes[userId] = { data: [...notes], ts: Date.now() };
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
  cache.notes[userId] = { data: [...notes], ts: Date.now() };
  return { success: true, note: newNote };
}

export async function deleteNote(userId: string, noteId: string): Promise<boolean> {
  // Optimistic removal from cache (0ms)
  if (cache.notes[userId]) {
    cache.notes[userId].data = cache.notes[userId].data.filter((n) => n.id !== noteId);
  }

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
  const filtered = notes.filter((n) => n.id !== noteId);
  setLocal(LS_NOTES, filtered);
  return true;
}

// ----------------------------------------------------------------------
// FILES API
// ----------------------------------------------------------------------
export async function fetchStudyFiles(userId: string): Promise<StudyFile[]> {
  if (cache.studyFiles[userId] && Date.now() - cache.studyFiles[userId].ts < CACHE_TTL_MS) {
    return cache.studyFiles[userId].data;
  }

  if (isSupabaseConfigured && userId) {
    return dedup(`studyFiles_${userId}`, async () => {
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
          // Batch generate signed URLs (valid for 24 hours = 86400s) for files with storage_path
          const paths = data.map((f: any) => f.storage_path).filter((p: any): p is string => Boolean(p));
          let signedUrlMap: Record<string, string> = {};
          if (paths.length > 0) {
            try {
              const { data: signedData, error: signedErr } = await supabase.storage
                .from('study-files')
                .createSignedUrls(paths, 86400);
              if (!signedErr && signedData) {
                signedData.forEach((item: any) => {
                  if (item?.path && item?.signedUrl) {
                    signedUrlMap[item.path] = item.signedUrl;
                  }
                });
              }
            } catch (sErr) {
              console.warn('Could not generate batch signed URLs:', sErr);
            }
          }

          const files = data.map((f: any) => ({
            ...f,
            subject_name: f.subject_id || '',
            download_url: signedUrlMap[f.storage_path] || null,
          }));
          cache.studyFiles[userId] = { data: files, ts: Date.now() };
          setLocal(LS_FILES, files);
          return files;
        }
      } catch (err) {
        console.error('Error fetching files:', err);
      }
      const local = getLocal<StudyFile[]>(LS_FILES, []);
      cache.studyFiles[userId] = { data: local, ts: Date.now() };
      return local;
    });
  }

  const local = getLocal<StudyFile[]>(LS_FILES, []);
  cache.studyFiles[userId] = { data: local, ts: Date.now() };
  return local;
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

      // Generate signed URL immediately for 24 hours
      let downloadUrl: string | null = null;
      try {
        const { data: signData } = await supabase.storage
          .from('study-files')
          .createSignedUrl(storagePath, 86400);
        if (signData?.signedUrl) {
          downloadUrl = signData.signedUrl;
        }
      } catch (signErr) {
        console.warn('Could not generate signed URL for uploaded file:', signErr);
      }

      const newFile: StudyFile = {
        ...dbData,
        subject_name: subjectName || subjectId || '',
        section_name: sectionName || '',
        topic_name: topicName || '',
        download_url: downloadUrl,
      };

      // Add to in-memory cache
      if (cache.studyFiles[userId]) {
        cache.studyFiles[userId].data.unshift(newFile);
      }

      return { success: true, file: newFile };
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
  if (cache.studyFiles[userId]) {
    cache.studyFiles[userId].data.unshift(newFile);
  }
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
  // Optimistically update cache (0ms)
  if (cache.studyFiles[userId]) {
    cache.studyFiles[userId].data = cache.studyFiles[userId].data.map((f) => {
      if (f.id === fileId) {
        return {
          ...f,
          subject_id: subjectId || null,
          subject_name: subjectName || subjectId || f.subject_name,
          section_id: sectionId || null,
          section_name: sectionName || f.section_name,
          topic_id: topicId || null,
          topic_name: topicName || f.topic_name,
        };
      }
      return f;
    });
  }

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
  // Optimistically remove from cache (0ms)
  if (cache.studyFiles[userId]) {
    cache.studyFiles[userId].data = cache.studyFiles[userId].data.filter((f) => f.id !== fileId);
  }

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
  if (cache.profile[userId] && Date.now() - cache.profile[userId].ts < CACHE_TTL_MS) {
    return cache.profile[userId].data;
  }

  const defaultProfile: Profile = {
    id: userId || 'demo-user',
    full_name: 'Aspirant',
    email: 'aspirant@upsc.test',
    optional_subject: 'General',
    daily_study_target: 4,
  };

  if (isSupabaseConfigured && userId) {
    return dedup(`profile_${userId}`, async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (!error && data) {
          cache.profile[userId] = { data: data as Profile, ts: Date.now() };
          return data as Profile;
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
      cache.profile[userId] = { data: defaultProfile, ts: Date.now() };
      return defaultProfile;
    });
  }

  const p = getLocal<Profile>(LS_PROFILE, defaultProfile);
  cache.profile[userId] = { data: p, ts: Date.now() };
  return p;
}

export async function updateProfileData(userId: string, profile: Partial<Profile>): Promise<boolean> {
  if (cache.profile[userId]) {
    cache.profile[userId].data = { ...cache.profile[userId].data, ...profile };
  }

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

// ----------------------------------------------------------------------
// REFERENCE BOOKS & TEXTBOOKS API (Cross-Device Cloud Sync)
// ----------------------------------------------------------------------

interface PersistedBooksState {
  userOverrides: Record<string, {
    status?: BookReadingStatus;
    notes?: string;
    storage_path?: string | null;
  }>;
  customBooks: ReferenceBook[];
}

async function getPersistedBooksState(userId: string): Promise<{ noteId?: string; state: PersistedBooksState }> {
  const fallbackState: PersistedBooksState = { userOverrides: {}, customBooks: [] };

  if (isSupabaseConfigured && userId) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('id, content')
        .eq('user_id', userId)
        .eq('title', '__upsc_reference_books__')
        .maybeSingle();

      if (!error && data?.content) {
        try {
          const parsed = JSON.parse(data.content);
          return {
            noteId: data.id,
            state: {
              userOverrides: parsed.userOverrides || {},
              customBooks: parsed.customBooks || [],
            },
          };
        } catch {
          return { noteId: data.id, state: fallbackState };
        }
      } else if (data?.id) {
        return { noteId: data.id, state: fallbackState };
      }
    } catch (err) {
      console.warn('Could not load reference books state from Supabase:', err);
    }
  }

  const local = getLocal<PersistedBooksState>(LS_BOOKS, fallbackState);
  return { state: local };
}

async function savePersistedBooksState(
  userId: string,
  state: PersistedBooksState,
  noteId?: string
): Promise<void> {
  setLocal(LS_BOOKS, state);

  if (isSupabaseConfigured && userId) {
    try {
      const payload = {
        user_id: userId,
        title: '__upsc_reference_books__',
        topic: 'Reference Books State',
        content: JSON.stringify(state),
        updated_at: new Date().toISOString(),
      };

      if (noteId) {
        await supabase
          .from('notes')
          .update({
            content: payload.content,
            updated_at: payload.updated_at,
          })
          .eq('id', noteId)
          .eq('user_id', userId);
      } else {
        const { data: existing } = await supabase
          .from('notes')
          .select('id')
          .eq('user_id', userId)
          .eq('title', '__upsc_reference_books__')
          .maybeSingle();

        if (existing?.id) {
          await supabase
            .from('notes')
            .update({
              content: payload.content,
              updated_at: payload.updated_at,
            })
            .eq('id', existing.id)
            .eq('user_id', userId);
        } else {
          await supabase.from('notes').insert(payload);
        }
      }
    } catch (err) {
      console.error('Error saving reference books state to Supabase:', err);
    }
  }
}

export async function fetchReferenceBooks(userId: string): Promise<ReferenceBook[]> {
  if (cache.referenceBooks[userId] && Date.now() - cache.referenceBooks[userId].ts < CACHE_TTL_MS) {
    return cache.referenceBooks[userId].data;
  }

  const { state } = await getPersistedBooksState(userId);

  // 1. Build list starting with standard UPSC reference books catalog
  const books: ReferenceBook[] = DEFAULT_UPSC_BOOKS.map((b) => {
    const override = state.userOverrides[b.id] || {};
    return {
      id: b.id,
      user_id: userId || 'demo-user',
      title: b.title,
      author: b.author,
      subject_id: b.subject_id,
      subject_name: b.subject_name,
      category: b.category,
      importance: b.importance,
      edition: b.edition,
      description: b.description,
      status: override.status || 'To Read',
      notes: override.notes || '',
      storage_path: override.storage_path || null,
      download_url: null,
      created_at: '2025-01-01T00:00:00.000Z',
    };
  });

  // 2. Append user custom books
  if (Array.isArray(state.customBooks)) {
    state.customBooks.forEach((cb) => {
      const override = state.userOverrides[cb.id] || {};
      books.push({
        ...cb,
        status: override.status || cb.status || 'To Read',
        notes: override.notes !== undefined ? override.notes : (cb.notes || ''),
        storage_path: override.storage_path || cb.storage_path || null,
      });
    });
  }

  // 3. Batch generate 24h signed URLs for any attached PDFs
  if (isSupabaseConfigured) {
    const paths = books
      .map((b) => b.storage_path)
      .filter((p): p is string => Boolean(p && !p.startsWith('local/')));

    if (paths.length > 0) {
      try {
        const { data: signedData, error: signedErr } = await supabase.storage
          .from('study-files')
          .createSignedUrls(paths, 86400);

        if (!signedErr && signedData) {
          const urlMap: Record<string, string> = {};
          signedData.forEach((item: any) => {
            if (item?.path && item?.signedUrl) {
              urlMap[item.path] = item.signedUrl;
            }
          });
          books.forEach((b) => {
            if (b.storage_path && urlMap[b.storage_path]) {
              b.download_url = urlMap[b.storage_path];
            }
          });
        }
      } catch (err) {
        console.warn('Error resolving signed URLs for reference books:', err);
      }
    }
  }

  cache.referenceBooks[userId] = { data: books, ts: Date.now() };
  return books;
}

export async function updateBookStatus(
  userId: string,
  bookId: string,
  status: BookReadingStatus,
  notes?: string
): Promise<boolean> {
  // Optimistic update in cache
  if (cache.referenceBooks[userId]) {
    cache.referenceBooks[userId].data = cache.referenceBooks[userId].data.map((b) => {
      if (b.id === bookId) {
        return {
          ...b,
          status,
          notes: notes !== undefined ? notes : b.notes,
          updated_at: new Date().toISOString(),
        };
      }
      return b;
    });
  }

  const { noteId, state } = await getPersistedBooksState(userId);
  state.userOverrides[bookId] = {
    ...state.userOverrides[bookId],
    status,
    ...(notes !== undefined ? { notes } : {}),
  };
  await savePersistedBooksState(userId, state, noteId);
  return true;
}

export async function attachFileToBook(
  userId: string,
  bookId: string,
  storagePath: string,
  downloadUrl?: string
): Promise<boolean> {
  // Optimistic update in cache
  if (cache.referenceBooks[userId]) {
    cache.referenceBooks[userId].data = cache.referenceBooks[userId].data.map((b) => {
      if (b.id === bookId) {
        return {
          ...b,
          storage_path: storagePath,
          download_url: downloadUrl || b.download_url,
          updated_at: new Date().toISOString(),
        };
      }
      return b;
    });
  }

  const { noteId, state } = await getPersistedBooksState(userId);
  state.userOverrides[bookId] = {
    ...state.userOverrides[bookId],
    storage_path: storagePath,
  };
  await savePersistedBooksState(userId, state, noteId);
  return true;
}

export async function uploadBookPdf(
  userId: string,
  bookId: string,
  file: File,
  bookTitle: string,
  subjectName: string
): Promise<{ success: boolean; book?: ReferenceBook; error?: string }> {
  if (isSupabaseConfigured && userId) {
    try {
      const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const safeSubject = (subjectName || 'books').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const storagePath = `${userId}/books/${Date.now()}_${safeFilename}`;

      const { error: storageError } = await supabase.storage
        .from('study-files')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (storageError) {
        throw new Error(`Storage upload failed: ${storageError.message}`);
      }

      // Also register in study_files table for unified file library
      await supabase.from('study_files').insert({
        user_id: userId,
        subject_id: subjectName,
        section_id: 'reference_book',
        topic_id: bookId,
        filename: file.name,
        storage_path: storagePath,
        file_type: file.type || 'application/pdf',
        file_size: file.size,
      });

      // Generate signed URL
      let downloadUrl: string | null = null;
      const { data: signData } = await supabase.storage
        .from('study-files')
        .createSignedUrl(storagePath, 86400);
      if (signData?.signedUrl) {
        downloadUrl = signData.signedUrl;
      }

      await attachFileToBook(userId, bookId, storagePath, downloadUrl || undefined);

      // Invalidate studyFiles cache so the file library immediately reflects it
      delete cache.studyFiles[userId];

      const currentBooks = cache.referenceBooks[userId]?.data || [];
      const updatedBook = currentBooks.find((b) => b.id === bookId);

      return { success: true, book: updatedBook };
    } catch (err: any) {
      console.error('Error uploading book PDF:', err);
      return { success: false, error: err?.message || 'Failed to upload book PDF.' };
    }
  }

  // Fallback for offline/demo
  const localUrl = URL.createObjectURL(file);
  await attachFileToBook(userId, bookId, `local/books/${file.name}`, localUrl);
  const currentBooks = cache.referenceBooks[userId]?.data || [];
  const updatedBook = currentBooks.find((b) => b.id === bookId);
  return { success: true, book: updatedBook };
}

export async function createCustomBook(
  userId: string,
  bookData: Omit<ReferenceBook, 'id' | 'user_id' | 'created_at'>
): Promise<ReferenceBook> {
  const newBook: ReferenceBook = {
    ...bookData,
    id: `custom-book-${Date.now()}`,
    user_id: userId || 'demo-user',
    created_at: new Date().toISOString(),
    status: bookData.status || 'To Read',
  };

  const { noteId, state } = await getPersistedBooksState(userId);
  state.customBooks = [newBook, ...(state.customBooks || [])];
  await savePersistedBooksState(userId, state, noteId);

  if (cache.referenceBooks[userId]) {
    cache.referenceBooks[userId].data.unshift(newBook);
  }

  return newBook;
}

export async function deleteCustomBook(userId: string, bookId: string): Promise<boolean> {
  if (cache.referenceBooks[userId]) {
    cache.referenceBooks[userId].data = cache.referenceBooks[userId].data.filter((b) => b.id !== bookId);
  }

  const { noteId, state } = await getPersistedBooksState(userId);
  state.customBooks = (state.customBooks || []).filter((b) => b.id !== bookId);
  delete state.userOverrides[bookId];
  await savePersistedBooksState(userId, state, noteId);
  return true;
}

// ----------------------------------------------------------------------
// DAILY TOPIC LOGS API (Granular Combined Study Tracking)
// ----------------------------------------------------------------------

export async function fetchDailyTopicLogs(userId: string, dateStr: string): Promise<DailyTopicLog[]> {
  const cacheKey = `${userId}_${dateStr}`;
  if (cache.dailyTopicLogs?.[cacheKey] && Date.now() - cache.dailyTopicLogs[cacheKey].ts < CACHE_TTL_MS) {
    return cache.dailyTopicLogs[cacheKey].data;
  }

  if (isSupabaseConfigured && userId) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('id, content')
        .eq('user_id', userId)
        .eq('title', `__upsc_daily_logs__${dateStr}`)
        .maybeSingle();

      if (!error && data?.content) {
        try {
          const logs = JSON.parse(data.content);
          if (Array.isArray(logs)) {
            if (!cache.dailyTopicLogs) cache.dailyTopicLogs = {};
            cache.dailyTopicLogs[cacheKey] = { data: logs, ts: Date.now() };
            return logs;
          }
        } catch {}
      }
    } catch (err) {
      console.warn('Error fetching daily topic logs from Supabase:', err);
    }
  }

  const allLogs = getLocal<Record<string, DailyTopicLog[]>>(LS_DAILY_LOGS, {});
  const logs = allLogs[dateStr] || [];
  if (!cache.dailyTopicLogs) cache.dailyTopicLogs = {};
  cache.dailyTopicLogs[cacheKey] = { data: logs, ts: Date.now() };
  return logs;
}

export async function logTopicStudySession(
  userId: string,
  logData: Omit<DailyTopicLog, 'id' | 'created_at'>
): Promise<DailyTopicLog> {
  const newLog: DailyTopicLog = {
    ...logData,
    id: `topic-log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString(),
  };

  const dateStr = logData.date;
  const cacheKey = `${userId}_${dateStr}`;

  // Update in-memory cache
  const currentLogs = await fetchDailyTopicLogs(userId, dateStr);
  const updatedLogs = [newLog, ...currentLogs];
  if (!cache.dailyTopicLogs) cache.dailyTopicLogs = {};
  cache.dailyTopicLogs[cacheKey] = { data: updatedLogs, ts: Date.now() };

  // Update local storage
  const allLogs = getLocal<Record<string, DailyTopicLog[]>>(LS_DAILY_LOGS, {});
  allLogs[dateStr] = updatedLogs;
  setLocal(LS_DAILY_LOGS, allLogs);

  // Sync to Supabase topic progress
  await updateTopicProgress(userId, logData.topic_id, {
    study_completed: logData.study_completed,
    revision_completed: logData.revision_completed,
    pyq_completed: logData.pyq_completed,
    notes: logData.notes,
  });

  // Sync to Supabase daily notes
  if (isSupabaseConfigured && userId) {
    try {
      const { data: existing } = await supabase
        .from('notes')
        .select('id')
        .eq('user_id', userId)
        .eq('title', `__upsc_daily_logs__${dateStr}`)
        .maybeSingle();

      if (existing?.id) {
        await supabase
          .from('notes')
          .update({
            content: JSON.stringify(updatedLogs),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('notes').insert({
          user_id: userId,
          title: `__upsc_daily_logs__${dateStr}`,
          topic: 'Daily Topic Logs',
          content: JSON.stringify(updatedLogs),
        });
      }
    } catch (err) {
      console.warn('Error saving daily topic log to Supabase:', err);
    }
  }

  return newLog;
}

export async function deleteDailyTopicLog(
  userId: string,
  logId: string,
  dateStr: string
): Promise<boolean> {
  const currentLogs = await fetchDailyTopicLogs(userId, dateStr);
  const updatedLogs = currentLogs.filter((l) => l.id !== logId);
  const cacheKey = `${userId}_${dateStr}`;

  if (!cache.dailyTopicLogs) cache.dailyTopicLogs = {};
  cache.dailyTopicLogs[cacheKey] = { data: updatedLogs, ts: Date.now() };

  const allLogs = getLocal<Record<string, DailyTopicLog[]>>(LS_DAILY_LOGS, {});
  allLogs[dateStr] = updatedLogs;
  setLocal(LS_DAILY_LOGS, allLogs);

  if (isSupabaseConfigured && userId) {
    try {
      const { data: existing } = await supabase
        .from('notes')
        .select('id')
        .eq('user_id', userId)
        .eq('title', `__upsc_daily_logs__${dateStr}`)
        .maybeSingle();

      if (existing?.id) {
        await supabase
          .from('notes')
          .update({
            content: JSON.stringify(updatedLogs),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      }
    } catch (err) {
      console.warn('Error deleting daily topic log from Supabase:', err);
    }
  }

  return true;
}
