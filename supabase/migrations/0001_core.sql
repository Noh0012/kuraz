-- Core: grades, profiles, signup trigger.
-- The mobile app never reads tables directly; the Node API uses the secret key.
-- RLS is enabled everywhere with no policies (deny-by-default for anon/authenticated).

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.grades (
  id smallint primary key,
  name text not null,
  sort smallint not null default 0
);
alter table public.grades enable row level security;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text,
  phone text,
  grade_id smallint references public.grades (id) on delete set null,
  school text,
  region text,
  city text,
  avatar_url text,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_grade_id_idx on public.profiles (grade_id);
alter table public.profiles enable row level security;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Creates the profile row for every new auth user.
-- Must never throw: a failure here would make Supabase reject the signup.
-- If it does fail, the API lazily creates the profile on GET /me.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_grade smallint;
begin
  begin
    v_grade := nullif(v_meta ->> 'grade_id', '')::smallint;
    if v_grade is not null
       and not exists (select 1 from public.grades g where g.id = v_grade) then
      v_grade := null;
    end if;
  exception when others then
    v_grade := null;
  end;

  begin
    insert into public.profiles (id, full_name, email, phone, grade_id)
    values (
      new.id,
      coalesce(left(trim(v_meta ->> 'full_name'), 120), ''),
      new.email,
      nullif(left(trim(v_meta ->> 'phone'), 32), ''),
      v_grade
    )
    on conflict (id) do nothing;
  exception when others then
    raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
