-- Per-user activity. Everything cascades when the auth user is deleted.

create table public.video_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  video_id uuid not null references public.videos (id) on delete cascade,
  position_seconds integer not null default 0 check (position_seconds >= 0),
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, video_id)
);
create index video_progress_video_id_idx on public.video_progress (video_id);
create index video_progress_recent_idx on public.video_progress (user_id, updated_at desc);
alter table public.video_progress enable row level security;

create table public.question_attempts (
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  selected_option text not null,
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  primary key (user_id, question_id)
);
create index question_attempts_question_id_idx on public.question_attempts (question_id);
alter table public.question_attempts enable row level security;

create table public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  test_id uuid not null references public.tests (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  started_at timestamptz not null default now(),
  deadline_at timestamptz not null,
  submitted_at timestamptz,
  score integer,
  total integer,
  created_at timestamptz not null default now()
);
create index test_attempts_user_test_idx on public.test_attempts (user_id, test_id);
create index test_attempts_test_id_idx on public.test_attempts (test_id);
-- At most one in-progress attempt per user and test.
create unique index test_attempts_one_open_idx
  on public.test_attempts (user_id, test_id) where submitted_at is null;
alter table public.test_attempts enable row level security;

create table public.bookmarks (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_type text not null check (item_type in ('video', 'question')),
  item_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);
create index bookmarks_recent_idx on public.bookmarks (user_id, created_at desc);
alter table public.bookmarks enable row level security;

create table public.issue_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null default 'other',
  message text not null check (char_length(message) between 1 and 2000),
  context jsonb,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);
create index issue_reports_user_id_idx on public.issue_reports (user_id);
alter table public.issue_reports enable row level security;
