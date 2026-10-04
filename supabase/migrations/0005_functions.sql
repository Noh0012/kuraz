-- Atomic view counter, callable only by the backend (service role).
create or replace function public.increment_video_views(p_video_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.videos set view_count = view_count + 1 where id = p_video_id;
$$;

revoke execute on function public.increment_video_views(uuid) from public, anon, authenticated;
grant execute on function public.increment_video_views(uuid) to service_role;
