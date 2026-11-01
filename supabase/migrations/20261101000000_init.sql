-- NNN — fixed November 2026 challenge
-- Run this in the Supabase SQL editor, or with `supabase db push`.
--
-- Security model:
--   * profiles / marks are readable only by their owner (RLS).
--   * All writes go through security-definer RPCs. Clients cannot write tables.
--   * Public data (leaderboard, share page) is exposed through narrow RPCs.
--   * Clips live in a private Storage bucket and are signed server-side.

create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null,
  timezone text not null,
  pending_timezone text,
  pending_timezone_at timestamptz,
  joined_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_handle_format check (handle ~ '^[A-Za-z0-9_]{3,20}$'),
  constraint profiles_timezone_length check (length(timezone) between 1 and 64)
);

create unique index profiles_handle_lower_idx on public.profiles (lower(handle));

create table public.marks (
  user_id uuid not null references public.profiles (id) on delete cascade,
  challenge_day smallint not null,
  local_date date not null,
  marked_at timestamptz not null default now(),
  primary key (user_id, challenge_day),
  unique (user_id, local_date),
  constraint marks_day_range check (challenge_day between 1 and 30),
  constraint marks_date_matches_day check (extract(day from local_date)::int = challenge_day),
  constraint marks_date_is_challenge_month check (
    extract(year from local_date) = 2026 and extract(month from local_date) = 11
  )
);

create table public.reminder_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  local_date date not null,
  channel text not null default 'email_stub',
  sent_at timestamptz not null default now(),
  unique (user_id, local_date)
);

create index marks_user_date_idx on public.marks (user_id, local_date);
create index reminder_log_user_date_idx on public.reminder_log (user_id, local_date);

alter table public.profiles enable row level security;
alter table public.marks enable row level security;
alter table public.reminder_log enable row level security;

create policy "profiles are self-only"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "marks are self-only"
  on public.marks for select
  to authenticated
  using (user_id = (select auth.uid()));

-- No insert / update / delete policies: writes happen through RPCs only.
-- No reminder_log policies: service role only.

-- ---------------------------------------------------------------------------
-- Private helpers
-- ---------------------------------------------------------------------------

create or replace function private.day_number(p_date date)
returns integer
language sql
immutable
as $$
  select case
    when p_date between date '2026-11-01' and date '2026-11-30'
      then extract(day from p_date)::integer
    else null
  end;
$$;

create or replace function private.assert_timezone(p_timezone text)
returns void
language plpgsql
stable
as $$
begin
  if p_timezone is null
     or length(btrim(p_timezone)) = 0
     or not exists (
       select 1 from pg_catalog.pg_timezone_names where name = btrim(p_timezone)
     ) then
    raise exception 'invalid_timezone' using errcode = '22023';
  end if;
end;
$$;

create or replace function private.is_blocked_handle(p_handle text)
returns boolean
language sql
immutable
as $$
  select
    lower(btrim(p_handle)) = any (array[
      'admin', 'administrator', 'moderator', 'support', 'official', 'staff',
      'system', 'root', 'nnn', 'november', 'sex'
    ])
    or exists (
      select 1
      from unnest(array[
        'fuck', 'shit', 'bitch', 'cunt', 'asshole', 'dick', 'cock', 'pussy',
        'porn', 'nude', 'rape', 'nazi', 'hitler', 'slut', 'whore', 'onlyfans',
        'pedo', 'paedo'
      ]) as blocked(word)
      where strpos(lower(p_handle), blocked.word) > 0
    );
$$;

-- Returns the profile and applies a pending timezone change if its effective
-- midnight has arrived.
create or replace function private.activate_timezone(p_user_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_profile public.profiles;
begin
  select * into v_profile
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'profile_missing' using errcode = 'P0002';
  end if;

  if v_profile.pending_timezone is not null
     and v_profile.pending_timezone_at is not null
     and v_profile.pending_timezone_at <= now() then
    update public.profiles
    set timezone = v_profile.pending_timezone,
        pending_timezone = null,
        pending_timezone_at = null,
        updated_at = now()
    where id = p_user_id
    returning * into v_profile;
  end if;

  return v_profile;
end;
$$;

-- current_streak is the island ending on p_reference_day (0 means none).
create or replace function private.user_streaks(p_user_id uuid, p_reference_day integer)
returns table (current_streak integer, best_streak integer, days_marked integer)
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  with numbered as (
    select
      challenge_day,
      challenge_day::integer - row_number() over (order by challenge_day)::integer as grp
    from public.marks
    where user_id = p_user_id
  ),
  islands as (
    select
      grp,
      count(*)::integer as len,
      max(challenge_day)::integer as end_day
    from numbered
    group by grp
  )
  select
    coalesce((
      select len from islands
      where end_day = p_reference_day
      order by end_day desc
      limit 1
    ), 0),
    coalesce((select max(len) from islands), 0),
    (select count(*)::integer from public.marks where user_id = p_user_id);
$$;

-- ---------------------------------------------------------------------------
-- Onboarding
-- ---------------------------------------------------------------------------

create or replace function public.onboard(p_handle text, p_timezone text)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_handle text := btrim(coalesce(p_handle, ''));
  v_timezone text := btrim(coalesce(p_timezone, ''));
  v_profile public.profiles;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if v_handle !~ '^[A-Za-z0-9_]{3,20}$' then
    raise exception 'invalid_handle' using errcode = '22023';
  end if;

  if private.is_blocked_handle(v_handle) then
    raise exception 'handle_blocked' using errcode = '22023';
  end if;

  perform private.assert_timezone(v_timezone);

  if exists (select 1 from public.profiles where id = v_user_id) then
    raise exception 'already_onboarded' using errcode = 'P0001';
  end if;

  insert into public.profiles (id, handle, timezone, joined_on)
  values (v_user_id, v_handle, v_timezone, (now() at time zone v_timezone)::date)
  returning * into v_profile;

  return jsonb_build_object(
    'handle', v_profile.handle,
    'timezone', v_profile.timezone,
    'joined_on', v_profile.joined_on
  );
exception
  when unique_violation then
    raise exception 'handle_taken' using errcode = 'P0001';
end;
$$;

-- ---------------------------------------------------------------------------
-- Timezone changes
-- ---------------------------------------------------------------------------

create or replace function public.set_timezone(p_timezone text)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_timezone text := btrim(coalesce(p_timezone, ''));
  v_profile public.profiles;
  v_next_midnight timestamptz;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  perform private.assert_timezone(v_timezone);

  v_profile := private.activate_timezone(v_user_id);

  if v_timezone = v_profile.timezone then
    update public.profiles
    set pending_timezone = null,
        pending_timezone_at = null,
        updated_at = now()
    where id = v_user_id
    returning * into v_profile;

    return jsonb_build_object(
      'timezone', v_profile.timezone,
      'pending_timezone', null,
      'pending_timezone_at', null
    );
  end if;

  -- The new zone takes over at its next local midnight, never immediately.
  v_next_midnight := (
    date_trunc('day', now() at time zone v_timezone) + interval '1 day'
  ) at time zone v_timezone;

  update public.profiles
  set pending_timezone = v_timezone,
      pending_timezone_at = v_next_midnight,
      updated_at = now()
  where id = v_user_id
  returning * into v_profile;

  return jsonb_build_object(
    'timezone', v_profile.timezone,
    'pending_timezone', v_profile.pending_timezone,
    'pending_timezone_at', v_profile.pending_timezone_at
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Marking
-- ---------------------------------------------------------------------------

create or replace function public.mark_today()
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles;
  v_local_date date;
  v_day integer;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  v_profile := private.activate_timezone(v_user_id);
  v_local_date := (now() at time zone v_profile.timezone)::date;
  v_day := private.day_number(v_local_date);

  if v_day is null then
    raise exception 'challenge_closed' using errcode = 'P0001';
  end if;

  if v_local_date < v_profile.joined_on then
    raise exception 'before_join' using errcode = 'P0001';
  end if;

  insert into public.marks (user_id, challenge_day, local_date, marked_at)
  values (v_user_id, v_day, v_local_date, now())
  on conflict (user_id, challenge_day) do nothing;

  return public.dashboard_state();
end;
$$;

create or replace function public.unmark_today()
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles;
  v_local_date date;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  v_profile := private.activate_timezone(v_user_id);
  v_local_date := (now() at time zone v_profile.timezone)::date;

  -- Only a mark whose local date is still today can be removed.
  delete from public.marks
  where user_id = v_user_id
    and local_date = v_local_date;

  return public.dashboard_state();
end;
$$;

-- ---------------------------------------------------------------------------
-- Dashboard state
-- ---------------------------------------------------------------------------

create or replace function public.dashboard_state()
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles;
  v_today date;
  v_day integer;
  v_phase text;
  v_reference_day integer;
  v_stats record;
  v_rank bigint;
  v_next_midnight timestamptz;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  v_profile := private.activate_timezone(v_user_id);
  v_today := (now() at time zone v_profile.timezone)::date;
  v_day := private.day_number(v_today);

  v_phase := case
    when v_today < date '2026-11-01' then 'pre'
    when v_today <= date '2026-11-30' then 'open'
    else 'closed'
  end;

  if v_phase = 'open' then
    v_reference_day := case
      when exists (
        select 1 from public.marks
        where user_id = v_user_id and challenge_day = v_day
      ) then v_day
      else v_day - 1
    end;
  elsif v_phase = 'closed' then
    v_reference_day := 30;
  else
    v_reference_day := 0;
  end if;

  select * into v_stats
  from private.user_streaks(v_user_id, v_reference_day);

  select l.rank into v_rank
  from public.leaderboard() l
  where lower(l.handle) = lower(v_profile.handle);

  v_next_midnight := (
    date_trunc('day', now() at time zone v_profile.timezone) + interval '1 day'
  ) at time zone v_profile.timezone;

  return jsonb_build_object(
    'handle', v_profile.handle,
    'timezone', v_profile.timezone,
    'pending_timezone', v_profile.pending_timezone,
    'pending_timezone_at', v_profile.pending_timezone_at,
    'joined_on', v_profile.joined_on,
    'today', v_today,
    'today_day', v_day,
    'phase', v_phase,
    'marked_days', coalesce((
      select jsonb_agg(challenge_day order by challenge_day)
      from public.marks
      where user_id = v_user_id
    ), '[]'::jsonb),
    'today_marked', exists (
      select 1 from public.marks
      where user_id = v_user_id and challenge_day = v_day
    ),
    'current_streak', v_stats.current_streak,
    'best_streak', v_stats.best_streak,
    'days_marked', v_stats.days_marked,
    'rank', v_rank,
    'next_midnight', v_next_midnight,
    'server_now', now()
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Public board
-- ---------------------------------------------------------------------------

create or replace function public.leaderboard()
returns table (
  rank bigint,
  handle text,
  best_streak integer,
  current_streak integer,
  days_marked integer
)
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  with base as (
    select
      p.id,
      p.handle,
      case
        when p.pending_timezone is not null and p.pending_timezone_at <= now()
          then p.pending_timezone
        else p.timezone
      end as timezone
    from public.profiles p
  ),
  days as (
    select
      b.*,
      private.day_number((now() at time zone b.timezone)::date) as today_day,
      (now() at time zone b.timezone)::date > date '2026-11-30' as is_closed
    from base b
  ),
  refs as (
    select
      d.*,
      case
        when d.is_closed then 30
        when d.today_day is null then 0
        when exists (
          select 1 from public.marks m
          where m.user_id = d.id and m.challenge_day = d.today_day
        ) then d.today_day
        else d.today_day - 1
      end as reference_day
    from days d
  ),
  stats as (
    select
      r.id,
      r.handle,
      s.best_streak,
      s.current_streak,
      s.days_marked
    from refs r
    cross join lateral private.user_streaks(r.id, r.reference_day) s
    where s.days_marked > 0
  )
  select
    row_number() over (
      order by
        s.best_streak desc,
        s.current_streak desc,
        s.days_marked desc,
        lower(s.handle) asc
    )::bigint as rank,
    s.handle,
    s.best_streak,
    s.current_streak,
    s.days_marked
  from stats s;
$$;

create or replace function public.public_profile(p_handle text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_profile public.profiles;
  v_timezone text;
  v_today date;
  v_day integer;
  v_phase text;
  v_reference_day integer;
  v_stats record;
  v_rank bigint;
begin
  select * into v_profile
  from public.profiles
  where lower(handle) = lower(btrim(coalesce(p_handle, '')))
  limit 1;

  if not found then
    return null;
  end if;

  v_timezone := case
    when v_profile.pending_timezone is not null
         and v_profile.pending_timezone_at <= now()
      then v_profile.pending_timezone
    else v_profile.timezone
  end;

  v_today := (now() at time zone v_timezone)::date;
  v_day := private.day_number(v_today);

  v_phase := case
    when v_today < date '2026-11-01' then 'pre'
    when v_today <= date '2026-11-30' then 'open'
    else 'closed'
  end;

  if v_phase = 'open' then
    v_reference_day := case
      when exists (
        select 1 from public.marks
        where user_id = v_profile.id and challenge_day = v_day
      ) then v_day
      else v_day - 1
    end;
  elsif v_phase = 'closed' then
    v_reference_day := 30;
  else
    v_reference_day := 0;
  end if;

  select * into v_stats
  from private.user_streaks(v_profile.id, v_reference_day);

  select l.rank into v_rank
  from public.leaderboard() l
  where lower(l.handle) = lower(v_profile.handle);

  return jsonb_build_object(
    'handle', v_profile.handle,
    'joined_on', v_profile.joined_on,
    'phase', v_phase,
    'today', v_today,
    'today_day', v_day,
    'best_streak', v_stats.best_streak,
    'current_streak', v_stats.current_streak,
    'days_marked', v_stats.days_marked,
    'rank', v_rank,
    'marked_days', coalesce((
      select jsonb_agg(challenge_day order by challenge_day)
      from public.marks
      where user_id = v_profile.id
    ), '[]'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Reminder queue (stub sender)
-- ---------------------------------------------------------------------------

create or replace function public.due_reminders()
returns table (
  user_id uuid,
  email text,
  handle text,
  local_date date,
  challenge_day integer
)
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  with base as (
    select
      p.id,
      p.handle,
      p.joined_on,
      case
        when p.pending_timezone is not null and p.pending_timezone_at <= now()
          then p.pending_timezone
        else p.timezone
      end as timezone
    from public.profiles p
  ),
  local as (
    select
      b.*,
      (now() at time zone b.timezone)::date as today,
      extract(hour from (now() at time zone b.timezone))::integer as local_hour
    from base b
  )
  select
    l.id,
    u.email::text,
    l.handle,
    l.today,
    private.day_number(l.today)
  from local l
  join auth.users u on u.id = l.id
  where l.today between date '2026-11-01' and date '2026-11-30'
    and l.today >= l.joined_on
    and l.local_hour = 20
    and not exists (
      select 1 from public.marks m
      where m.user_id = l.id and m.local_date = l.today
    )
    and not exists (
      select 1 from public.reminder_log r
      where r.user_id = l.id and r.local_date = l.today
    )
  order by l.today, lower(l.handle);
$$;

-- ---------------------------------------------------------------------------
-- Private clips bucket
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('clips', 'clips', false)
on conflict (id) do update set public = false;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke all on function private.day_number(date) from public;
revoke all on function private.assert_timezone(text) from public;
revoke all on function private.is_blocked_handle(text) from public;
revoke all on function private.activate_timezone(uuid) from public;
revoke all on function private.user_streaks(uuid, integer) from public;

revoke all on function public.onboard(text, text) from public;
revoke all on function public.set_timezone(text) from public;
revoke all on function public.mark_today() from public;
revoke all on function public.unmark_today() from public;
revoke all on function public.dashboard_state() from public;
revoke all on function public.leaderboard() from public;
revoke all on function public.public_profile(text) from public;
revoke all on function public.due_reminders() from public;

grant execute on function public.onboard(text, text) to authenticated;
grant execute on function public.set_timezone(text) to authenticated;
grant execute on function public.mark_today() to authenticated;
grant execute on function public.unmark_today() to authenticated;
grant execute on function public.dashboard_state() to authenticated;

grant execute on function public.leaderboard() to anon, authenticated, service_role;
grant execute on function public.public_profile(text) to anon, authenticated, service_role;
grant execute on function public.due_reminders() to service_role;
