-- Per-user light/dark theme preference, so it follows the account across
-- devices/browsers instead of living only in that browser's localStorage.

alter table public.profiles
  add column theme_preference text not null default 'dark'
  check (theme_preference in ('dark', 'light'));

-- Lets any signed-in user change their OWN theme preference, without
-- widening the existing profiles_update RLS policy (which is gerencia-only
-- and covers role/active/name). Implemented as a narrow SECURITY DEFINER
-- function rather than a new RLS policy + column grant, so there is no way
-- for this to accidentally let someone touch their own role/active status.
create function public.update_my_theme_preference(p_theme text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if p_theme not in ('dark', 'light') then
    raise exception 'Invalid theme: %', p_theme;
  end if;

  update public.profiles set theme_preference = p_theme where id = auth.uid();
end;
$$;

grant execute on function public.update_my_theme_preference(text) to authenticated;
