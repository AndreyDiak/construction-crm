-- Construction CRM: schema, helper functions, triggers, RLS, privileges, RPC.
-- Applied as the database owner (postgres) in Supabase.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('manager', 'executor');

create type public.task_status as enum (
  'new',
  'in_progress',
  'on_review',
  'accepted',
  'needs_rework'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 200),
  role public.user_role not null default 'executor',
  created_at timestamptz not null default now()
);

create table public.objects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 200),
  address text not null check (char_length(btrim(address)) between 1 and 500),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text check (description is null or char_length(description) <= 5000),
  object_id uuid not null references public.objects (id) on delete restrict,
  assignee_id uuid not null references public.profiles (id) on delete restrict,
  author_id uuid not null references public.profiles (id) on delete restrict,
  status public.task_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

create table public.task_status_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete restrict,
  changed_by uuid not null references public.profiles (id) on delete restrict,
  from_status public.task_status,
  to_status public.task_status not null,
  comment text check (comment is null or char_length(comment) <= 2000),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index profiles_role_idx on public.profiles (role);
create index objects_active_idx on public.objects (created_at desc) where not is_deleted;
create index tasks_assignee_active_idx on public.tasks (assignee_id, created_at desc) where not is_deleted;
create index tasks_object_active_idx on public.tasks (object_id, created_at desc) where not is_deleted;
create index tasks_status_active_idx on public.tasks (status) where not is_deleted;
create index tasks_author_idx on public.tasks (author_id);
create index task_history_task_created_idx on public.task_status_history (task_id, created_at);

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER avoids recursive RLS checks)
-- ---------------------------------------------------------------------------

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'manager'
  );
$$;

create or replace function public.is_executor(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_profile_id
      and p.role = 'executor'
  );
$$;

create or replace function public.is_object_active(p_object_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.objects o
    where o.id = p_object_id
      and not o.is_deleted
  );
$$;

create or replace function public.can_access_object(p_object_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_manager()
    or exists (
      select 1
      from public.objects o
      where o.id = p_object_id
        and not o.is_deleted
        and exists (
          select 1
          from public.tasks t
          where t.object_id = o.id
            and t.assignee_id = auth.uid()
            and not t.is_deleted
        )
    );
$$;

create or replace function public.can_access_task(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_manager()
    or exists (
      select 1
      from public.tasks t
      join public.objects o on o.id = t.object_id
      where t.id = p_task_id
        and t.assignee_id = auth.uid()
        and not t.is_deleted
        and not o.is_deleted
    );
$$;

-- ---------------------------------------------------------------------------
-- Auth profile bootstrap
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Пользователь'
    ),
    'executor'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Data integrity triggers
-- ---------------------------------------------------------------------------

create or replace function public.prepare_object()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
    if new.created_by is null then
      raise exception 'Не удалось определить создателя объекта'
        using errcode = '42501';
    end if;
    new.created_at := now();
  else
    if new.id is distinct from old.id then
      raise exception 'Нельзя изменить идентификатор объекта'
        using errcode = '42501';
    end if;
    if new.created_by is distinct from old.created_by then
      raise exception 'Нельзя изменить создателя объекта'
        using errcode = '42501';
    end if;
    if new.created_at is distinct from old.created_at then
      raise exception 'Нельзя изменить дату создания объекта'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger prepare_object_before_insert
before insert on public.objects
for each row execute function public.prepare_object();

create trigger prepare_object_before_update
before update on public.objects
for each row execute function public.prepare_object();

create or replace function public.prepare_task()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    new.author_id := coalesce(auth.uid(), new.author_id);
    if new.author_id is null then
      raise exception 'Не удалось определить автора задачи'
        using errcode = '42501';
    end if;
    new.status := 'new';
    new.created_at := now();
    new.updated_at := now();

    if not public.is_executor(new.assignee_id) then
      raise exception 'Исполнитель задачи должен иметь роль executor'
        using errcode = '23514';
    end if;
  else
    if new.id is distinct from old.id then
      raise exception 'Нельзя изменить идентификатор задачи'
        using errcode = '42501';
    end if;
    if new.author_id is distinct from old.author_id then
      raise exception 'Нельзя изменить автора задачи'
        using errcode = '42501';
    end if;
    if new.created_at is distinct from old.created_at then
      raise exception 'Нельзя изменить дату создания задачи'
        using errcode = '42501';
    end if;

    if new.assignee_id is distinct from old.assignee_id
      and not public.is_executor(new.assignee_id)
    then
      raise exception 'Исполнитель задачи должен иметь роль executor'
        using errcode = '23514';
    end if;

    new.updated_at := now();
  end if;

  if not exists (
    select 1
    from public.objects o
    where o.id = new.object_id
      and not o.is_deleted
  ) then
    raise exception 'Объект не найден или удалён'
      using errcode = '23503';
  end if;

  return new;
end;
$$;

create trigger prepare_task_before_insert
before insert on public.tasks
for each row execute function public.prepare_task();

create trigger prepare_task_before_update
before update on public.tasks
for each row execute function public.prepare_task();

create or replace function public.protect_task_status()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status is distinct from old.status then
    if current_setting('crm.allow_status_transition', true) is distinct from 'on' then
      raise exception 'Статус задачи можно изменить только через transition_task_status'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger protect_task_status_before_update
before update on public.tasks
for each row execute function public.protect_task_status();

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'Нельзя изменить идентификатор профиля'
      using errcode = '42501';
  end if;

  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'Роль пользователя нельзя изменить через клиентский API'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger protect_profile_role_before_update
before update on public.profiles
for each row execute function public.protect_profile_role();

-- ---------------------------------------------------------------------------
-- Status history triggers (the only writers of task_status_history)
-- ---------------------------------------------------------------------------

create or replace function public.log_task_status_history()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_changed_by uuid;
  v_comment text;
begin
  if tg_op = 'INSERT' then
    v_changed_by := coalesce(auth.uid(), new.author_id);

    insert into public.task_status_history (
      task_id,
      changed_by,
      from_status,
      to_status,
      comment
    )
    values (
      new.id,
      v_changed_by,
      null,
      new.status,
      null
    );

    return new;
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    v_changed_by := coalesce(auth.uid(), new.author_id);
    v_comment := nullif(btrim(current_setting('crm.transition_comment', true)), '');

    insert into public.task_status_history (
      task_id,
      changed_by,
      from_status,
      to_status,
      comment
    )
    values (
      new.id,
      v_changed_by,
      old.status,
      new.status,
      v_comment
    );
  end if;

  return new;
end;
$$;

create trigger log_task_status_history_after_insert
after insert on public.tasks
for each row execute function public.log_task_status_history();

create trigger log_task_status_history_after_status_update
after update of status on public.tasks
for each row execute function public.log_task_status_history();

-- ---------------------------------------------------------------------------
-- RPC: the only allowed way to change task status
-- ---------------------------------------------------------------------------

create or replace function public.transition_task_status(
  p_task_id uuid,
  p_to_status public.task_status,
  p_comment text default null
)
returns public.tasks
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.user_role;
  v_task public.tasks;
  v_comment text := nullif(btrim(p_comment), '');
  v_allowed boolean := false;
begin
  if v_uid is null then
    raise exception 'Требуется авторизация'
      using errcode = '42501';
  end if;

  select p.role
  into v_role
  from public.profiles p
  where p.id = v_uid;

  if v_role is null then
    raise exception 'Профиль пользователя не найден'
      using errcode = '42501';
  end if;

  select *
  into v_task
  from public.tasks t
  where t.id = p_task_id
  for update;

  if not found then
    raise exception 'Задача не найдена'
      using errcode = 'P0002';
  end if;

  if v_task.is_deleted then
    raise exception 'Задача удалена'
      using errcode = '23514';
  end if;

  if not public.is_object_active(v_task.object_id) then
    raise exception 'Объект задачи удалён'
      using errcode = '23514';
  end if;

  if v_role = 'executor' then
    if v_task.assignee_id is distinct from v_uid then
      raise exception 'Задача назначена другому исполнителю'
        using errcode = '42501';
    end if;

    if (v_task.status = 'new' and p_to_status = 'in_progress')
      or (v_task.status = 'in_progress' and p_to_status = 'on_review')
      or (v_task.status = 'needs_rework' and p_to_status = 'in_progress')
    then
      v_allowed := true;
    end if;
  elsif v_role = 'manager' then
    if v_task.status = 'on_review'
      and p_to_status in ('accepted', 'needs_rework')
    then
      v_allowed := true;
    end if;
  end if;

  if not v_allowed then
    raise exception 'Недопустимый переход статуса: % -> %', v_task.status, p_to_status
      using errcode = '23514';
  end if;

  if v_task.status = 'on_review'
    and p_to_status = 'needs_rework'
    and v_comment is null
  then
    raise exception 'Комментарий обязателен при возврате задачи на доработку'
      using errcode = '23514';
  end if;

  perform set_config('crm.allow_status_transition', 'on', true);
  perform set_config('crm.transition_comment', coalesce(v_comment, ''), true);

  update public.tasks
  set status = p_to_status
  where id = p_task_id
  returning * into v_task;

  return v_task;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.objects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_status_history enable row level security;

alter table public.profiles force row level security;
alter table public.objects force row level security;
alter table public.tasks force row level security;
alter table public.task_status_history force row level security;

-- Profiles are readable by any authenticated user so names can be shown in
-- task lists and history. Only administrators can create/update/delete them.
create policy profiles_select_authenticated
on public.profiles
for select
to authenticated
using (true);

-- Objects: managers see everything; executors see active objects that have at
-- least one active task assigned to them.
create policy objects_select_access
on public.objects
for select
to authenticated
using (
  public.is_manager()
  or public.can_access_object(id)
);

create policy objects_insert_manager
on public.objects
for insert
to authenticated
with check (
  public.is_manager()
  and created_by = auth.uid()
);

create policy objects_update_manager
on public.objects
for update
to authenticated
using (public.is_manager())
with check (public.is_manager());

-- Tasks: managers see everything; executors only their active tasks on active
-- objects. Executors cannot update rows directly (status changes go through RPC).
create policy tasks_select_access
on public.tasks
for select
to authenticated
using (
  public.is_manager()
  or (
    assignee_id = auth.uid()
    and not is_deleted
    and public.is_object_active(object_id)
  )
);

create policy tasks_insert_manager
on public.tasks
for insert
to authenticated
with check (
  public.is_manager()
  and author_id = auth.uid()
  and not is_deleted
  and public.is_object_active(object_id)
  and public.is_executor(assignee_id)
);

create policy tasks_update_manager
on public.tasks
for update
to authenticated
using (public.is_manager())
with check (
  public.is_manager()
  and public.is_object_active(object_id)
);

-- History: managers see all; executors see history of their accessible tasks.
create policy task_history_select_access
on public.task_status_history
for select
to authenticated
using (
  public.is_manager()
  or public.can_access_task(task_id)
);

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.objects from anon, authenticated;
revoke all on table public.tasks from anon, authenticated;
revoke all on table public.task_status_history from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on table public.profiles to authenticated;

grant select on table public.objects to authenticated;
grant insert (name, address) on table public.objects to authenticated;
grant update (name, address, is_deleted) on table public.objects to authenticated;

grant select on table public.tasks to authenticated;
grant insert (title, description, object_id, assignee_id) on table public.tasks to authenticated;
grant update (title, description, object_id, assignee_id, is_deleted) on table public.tasks to authenticated;

grant select on table public.task_status_history to authenticated;

revoke all on function public.is_manager() from public, anon;
revoke all on function public.is_executor(uuid) from public, anon;
revoke all on function public.is_object_active(uuid) from public, anon;
revoke all on function public.can_access_object(uuid) from public, anon;
revoke all on function public.can_access_task(uuid) from public, anon;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.prepare_object() from public, anon, authenticated;
revoke all on function public.prepare_task() from public, anon, authenticated;
revoke all on function public.protect_task_status() from public, anon, authenticated;
revoke all on function public.protect_profile_role() from public, anon, authenticated;
revoke all on function public.log_task_status_history() from public, anon, authenticated;
revoke all on function public.transition_task_status(uuid, public.task_status, text) from public, anon;

grant execute on function public.is_manager() to authenticated;
grant execute on function public.is_executor(uuid) to authenticated;
grant execute on function public.is_object_active(uuid) to authenticated;
grant execute on function public.can_access_object(uuid) to authenticated;
grant execute on function public.can_access_task(uuid) to authenticated;
grant execute on function public.transition_task_status(uuid, public.task_status, text) to authenticated;

-- New objects in this schema must not be exposed to API roles by default.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
