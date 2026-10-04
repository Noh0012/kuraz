-- Packages (what a grade can buy) and subscriptions (what a user bought).

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  grade_id smallint not null references public.grades (id) on delete cascade,
  name text not null,
  tier text not null default 'basic' check (tier in ('basic', 'premium')),
  description text,
  features text[] not null default '{}',
  price_etb numeric(10, 2) not null check (price_etb >= 0),
  duration_days integer not null check (duration_days > 0),
  includes_videos boolean not null default false,
  includes_qbank boolean not null default false,
  includes_tests boolean not null default false,
  is_active boolean not null default true,
  sort smallint not null default 0,
  created_at timestamptz not null default now()
);
create index packages_grade_id_idx on public.packages (grade_id, sort);
alter table public.packages enable row level security;

-- A renewal bought while a subscription is still running is a new row that
-- starts when the previous one expires, so the history stays a simple ledger.
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  package_id uuid not null references public.packages (id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'cancelled', 'expired')),
  starts_at timestamptz,
  expires_at timestamptz,
  provider text not null default 'stub',
  tx_ref text not null unique,
  amount_etb numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_user_active_idx on public.subscriptions (user_id, status, expires_at);
create index subscriptions_package_id_idx on public.subscriptions (package_id);
alter table public.subscriptions enable row level security;

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- Public bucket for profile pictures. Uploads go through the API (secret key);
-- there are no storage policies, so clients cannot list or write directly.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
