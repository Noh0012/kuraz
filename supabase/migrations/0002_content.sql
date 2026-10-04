-- Content: subjects -> chapters -> videos / questions, and tests.

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  grade_id smallint not null references public.grades (id) on delete cascade,
  name text not null,
  icon text not null default 'book',
  color text not null default '#0A9BF5',
  teacher_name text,
  teacher_avatar_url text,
  sort smallint not null default 0,
  created_at timestamptz not null default now()
);
create index subjects_grade_id_idx on public.subjects (grade_id, sort);
alter table public.subjects enable row level security;

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  title text not null,
  sort smallint not null default 0,
  created_at timestamptz not null default now()
);
create index chapters_subject_id_idx on public.chapters (subject_id, sort);
alter table public.chapters enable row level security;

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  title text not null,
  description text,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  thumbnail_url text,
  source_url text not null,
  notes_url text,
  is_free boolean not null default false,
  view_count integer not null default 0,
  sort smallint not null default 0,
  created_at timestamptz not null default now()
);
create index videos_chapter_id_idx on public.videos (chapter_id, sort);
create index videos_view_count_idx on public.videos (view_count desc);
alter table public.videos enable row level security;

-- QBank questions have a chapter_id. Exam-paper questions (national/mock) may have none.
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  chapter_id uuid references public.chapters (id) on delete set null,
  stem text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array'),
  correct_option text not null,
  explanation text,
  difficulty smallint not null default 2 check (difficulty between 1 and 3),
  is_free boolean not null default false,
  sort smallint not null default 0,
  created_at timestamptz not null default now()
);
create index questions_subject_id_idx on public.questions (subject_id);
create index questions_chapter_id_idx on public.questions (chapter_id, sort);
alter table public.questions enable row level security;

create table public.tests (
  id uuid primary key default gen_random_uuid(),
  grade_id smallint not null references public.grades (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  type text not null check (type in ('national', 'mock', 'unit')),
  title text not null,
  description text,
  exam_year smallint,
  year_label text,
  duration_minutes smallint not null check (duration_minutes > 0),
  is_free boolean not null default false,
  scheduled_for date,
  sort smallint not null default 0,
  created_at timestamptz not null default now()
);
create index tests_grade_type_idx on public.tests (grade_id, type);
create index tests_subject_id_idx on public.tests (subject_id);
alter table public.tests enable row level security;

create table public.test_questions (
  test_id uuid not null references public.tests (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  position smallint not null,
  primary key (test_id, question_id)
);
create index test_questions_question_id_idx on public.test_questions (question_id);
alter table public.test_questions enable row level security;
