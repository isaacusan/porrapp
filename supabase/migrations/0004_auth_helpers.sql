-- 0004_auth_helpers.sql
-- Helper functions that support the registration and login flows.
-- These run with elevated privileges (SECURITY DEFINER) because they must read
-- data that anonymous visitors cannot read directly (profiles + auth.users).
-- They expose the MINIMUM possible: a yes/no, or an email for an exact username.
--
-- Note: this app is private and used among friends, so allowing a username to be
-- resolved to a login email is an acceptable trade-off for friendly UX. If you
-- ever make the app more public, consider removing get_email_by_username and
-- requiring login by email only.

-- 1) Is a username free to take? (used live during registration)
create or replace function public.username_available(p_username text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles
    where lower(username) = lower(trim(p_username))
  );
$$;

-- 2) Resolve a username to its login email (used only server-side at login).
--    Returns null if no exact match.
create or replace function public.get_email_by_username(p_username text)
returns text
language sql
security definer
set search_path = public, auth
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(p.username) = lower(trim(p_username))
  limit 1;
$$;

grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.get_email_by_username(text) to anon, authenticated;

-- 3) Enforce username uniqueness CASE-INSENSITIVELY at the database level.
--    The original column constraint was case-sensitive, which would let
--    "Pepe" and "pepe" both exist. We replace it with a unique index on
--    lower(username) so the database — not just the app — guarantees that
--    usernames are unique regardless of capitalization.
alter table public.profiles drop constraint if exists profiles_username_key;
drop index if exists public.profiles_username_key;
create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));
