-- ==============================================================================
-- UPSC Study Tracker - Supabase SQL Schema & Seeds
-- Complete Database with Chapter/Topic-Level Syllabus Tracking
-- ==============================================================================

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  optional_subject text default '',
  daily_study_target integer default 4,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. MASTER SYLLABUS TABLES (Exam -> Paper -> Subject -> Section -> Topic)
create table if not exists public.syllabus_subjects (
  id text primary key,
  name text not null,
  exam text not null, -- 'Prelims' | 'Mains'
  paper text not null, -- 'General' | 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'Essay' | 'Optional'
  display_order integer default 0,
  active boolean default true
);

alter table public.syllabus_subjects enable row level security;
create policy "Anyone can read syllabus subjects"
  on public.syllabus_subjects for select
  to authenticated, anon
  using (active = true);


create table if not exists public.syllabus_sections (
  id text primary key,
  subject_id text not null references public.syllabus_subjects(id) on delete cascade,
  name text not null,
  display_order integer default 0
);

alter table public.syllabus_sections enable row level security;
create policy "Anyone can read syllabus sections"
  on public.syllabus_sections for select
  to authenticated, anon
  using (true);


create table if not exists public.syllabus_topics (
  id text primary key,
  section_id text not null references public.syllabus_sections(id) on delete cascade,
  name text not null,
  description text default '',
  display_order integer default 0,
  active boolean default true
);

alter table public.syllabus_topics enable row level security;
create policy "Anyone can read syllabus topics"
  on public.syllabus_topics for select
  to authenticated, anon
  using (active = true);


-- 3. USER TOPIC PROGRESS (Tracking at Chapter/Topic level)
create table if not exists public.topic_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id text not null references public.syllabus_topics(id) on delete cascade,
  study_completed boolean default false not null,
  revision_completed boolean default false not null,
  pyq_completed boolean default false not null,
  status text default 'Not Started' not null, -- 'Not Started' | 'In Progress' | 'Completed' | 'Revision Due'
  notes text default '',
  last_studied timestamptz default now(),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint unique_user_topic unique (user_id, topic_id)
);

alter table public.topic_progress enable row level security;

create policy "Users can manage their own topic progress"
  on public.topic_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_topic_progress_user
  on public.topic_progress(user_id, topic_id);


-- 4. LEGACY SUBJECTS & HABITS (For Daily Checklist)
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  paper text not null,
  display_order integer default 0,
  active boolean default true,
  created_at timestamptz default now() not null
);

alter table public.subjects enable row level security;
create policy "Anyone can view active subjects"
  on public.subjects for select
  to authenticated, anon
  using (active = true);


create table if not exists public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  completion_date date not null,
  completed boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint unique_user_subject_date unique (user_id, subject_id, completion_date)
);

alter table public.habit_completions enable row level security;
create policy "Users can manage their own habit completions"
  on public.habit_completions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- 5. DAILY STATS TABLE (Hours, Revisions, PYQs)
create table if not exists public.daily_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  study_date date not null,
  study_hours integer default 0 not null,
  study_minutes integer default 0 not null,
  revision_count integer default 0 not null,
  pyq_count integer default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint unique_user_study_date unique (user_id, study_date)
);

alter table public.daily_stats enable row level security;
create policy "Users can manage their own daily stats"
  on public.daily_stats for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- 6. NOTES TABLE
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  subject_id uuid references public.subjects(id) on delete set null,
  topic text default '',
  content text default '',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.notes enable row level security;
create policy "Users can manage their own notes"
  on public.notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- 7. STUDY FILES METADATA TABLE & STORAGE
create table if not exists public.study_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id text,
  section_id text,
  topic_id text,
  filename text not null,
  storage_path text not null,
  file_type text not null,
  file_size bigint not null,
  created_at timestamptz default now() not null
);

alter table public.study_files enable row level security;
create policy "Users can manage their own study files"
  on public.study_files for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('study-files', 'study-files', false)
on conflict (id) do nothing;

create policy "Users can view and download their own study files"
  on storage.objects for select
  using (
    bucket_id = 'study-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can upload their own study files"
  on storage.objects for insert
  with check (
    bucket_id = 'study-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own study files"
  on storage.objects for delete
  using (
    bucket_id = 'study-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );


-- ==============================================================================
-- 8. SEED CORE SUBJECTS FOR HABITS
-- ==============================================================================
insert into public.subjects (name, category, paper, display_order)
values
  ('Polity', 'Prelims', 'General', 1),
  ('History', 'Prelims', 'General', 2),
  ('Geography', 'Prelims', 'General', 3),
  ('Indian Economy', 'Prelims', 'General', 4),
  ('Environment & Ecology', 'Prelims', 'General', 5),
  ('Science & Technology', 'Prelims', 'General', 6),
  ('Current Affairs', 'Prelims', 'General', 7),
  ('CSAT', 'Prelims', 'General', 8),
  ('Indian Heritage & Culture', 'Mains', 'GS1', 101),
  ('History', 'Mains', 'GS1', 102),
  ('Geography', 'Mains', 'GS1', 103),
  ('Society', 'Mains', 'GS1', 104),
  ('Constitution', 'Mains', 'GS2', 201),
  ('Polity & Governance', 'Mains', 'GS2', 202),
  ('Social Justice', 'Mains', 'GS2', 203),
  ('International Relations', 'Mains', 'GS2', 204),
  ('Economy', 'Mains', 'GS3', 301),
  ('Agriculture', 'Mains', 'GS3', 302),
  ('Science & Technology', 'Mains', 'GS3', 303),
  ('Environment', 'Mains', 'GS3', 304),
  ('Internal Security', 'Mains', 'GS3', 305),
  ('Disaster Management', 'Mains', 'GS3', 306),
  ('Ethics', 'Mains', 'GS4', 401),
  ('Integrity', 'Mains', 'GS4', 402),
  ('Aptitude', 'Mains', 'GS4', 403),
  ('Essay', 'Mains', 'Essay', 501),
  ('Optional Subject', 'Mains', 'Optional', 502)
on conflict do nothing;
