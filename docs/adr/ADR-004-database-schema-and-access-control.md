# ADR-004: Database Schema and Access Control

- Status: Accepted
- Date: 2026-11-05
- Decision Makers: Project Team

## Context

Данные мини-CRM должны быть защищены на уровне PostgreSQL, потому что клиент использует publishable key и может обращаться к PostgREST напрямую. Нельзя полагаться на то, что UI скроет чужие объекты или запретит опасные действия.

Схема уже реализована миграцией `supabase/migrations/20261104000000_init.sql`. Она включает:

- таблицы `profiles`, `objects`, `tasks`, `task_status_history`;
- enum-типы `user_role` и `task_status`;
- RLS с `FORCE ROW LEVEL SECURITY`;
- helper-функции `SECURITY DEFINER`;
- триггеры целостности и истории;
- RPC `transition_task_status`;
- точечные гранты на колонки.

Отдельно существует расхождение имён статусов: текущий enum использует `on_review` и `needs_rework`, канонические имена по требованиям — `in_review` и `needs_revision` ([ADR-005](./ADR-005-task-status-workflow.md)). Этот ADR описывает текущую схему; при миграции имён меняются значения enum и ссылки в коде/тестах, но не структура таблиц.

## Decision

Сохранить текущую реляционную схему и модель доступа.

### Таблицы

`public.profiles`

- `id uuid primary key references auth.users(id) on delete cascade`
- `full_name text not null` с ограничением длины 1–200 после `btrim`
- `role public.user_role not null default 'executor'`
- `created_at timestamptz not null default now()`

`public.objects`

- `id uuid primary key default gen_random_uuid()`
- `name text not null` с ограничением 1–200
- `address text not null` с ограничением 1–500
- `created_by uuid not null references public.profiles(id) on delete restrict`
- `created_at timestamptz not null default now()`
- `is_deleted boolean not null default false`

`public.tasks`

- `id uuid primary key default gen_random_uuid()`
- `title text not null` с ограничением 1–200
- `description text` с ограничением до 5000 или `null`
- `object_id uuid not null references public.objects(id) on delete restrict`
- `assignee_id uuid not null references public.profiles(id) on delete restrict`
- `author_id uuid not null references public.profiles(id) on delete restrict`
- `status public.task_status not null default 'new'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `is_deleted boolean not null default false`

`public.task_status_history`

- `id uuid primary key default gen_random_uuid()`
- `task_id uuid not null references public.tasks(id) on delete restrict`
- `changed_by uuid not null references public.profiles(id) on delete restrict`
- `from_status public.task_status` (nullable для первой записи)
- `to_status public.task_status not null`
- `comment text` с ограничением до 2000 или `null`
- `created_at timestamptz not null default now()`

### Enum-типы

Текущие значения:

```sql
create type public.user_role as enum ('manager', 'executor');

create type public.task_status as enum (
  'new',
  'in_progress',
  'on_review',
  'accepted',
  'needs_rework'
);
```

Канонические имена по требованиям: `new`, `in_progress`, `in_review`, `accepted`, `needs_revision`. До выполнения миграции код, тесты и БД используют текущие значения. Нельзя смешивать оба набора в одном окружении.

### Индексы

- `profiles_role_idx` по `profiles(role)`.
- `objects_active_idx` по `objects(created_at desc) where not is_deleted`.
- `tasks_assignee_active_idx` по `tasks(assignee_id, created_at desc) where not is_deleted`.
- `tasks_object_active_idx` по `tasks(object_id, created_at desc) where not is_deleted`.
- `tasks_status_active_idx` по `tasks(status) where not is_deleted`.
- `tasks_author_idx` по `tasks(author_id)`.
- `task_history_task_created_idx` по `task_status_history(task_id, created_at)`.

Частичные индексы используются, потому что мягко удалённые строки не участвуют в типичных выборках.

### Soft delete

- Объекты и задачи не удаляются физически.
- `is_deleted = true` скрывает строку из активных списков.
- Мягко удалённый объект скрывает связанные задачи от executor и блокирует переходы статусов.
- Manager может видеть исторические строки и историю, но не может выполнять переходы по удалённому объекту/задаче.
- `DELETE`-гранты клиенту не выдаются.

### RLS-политики

Для всех четырёх таблиц включён `ENABLE ROW LEVEL SECURITY` и `FORCE ROW LEVEL SECURITY`.

`profiles`:

- `profiles_select_authenticated`: `SELECT` для `authenticated` с `using (true)`. Нужно для отображения имён в задачах и истории.
- Нет политик и грантов на `INSERT`, `UPDATE`, `DELETE` через клиентский API.

`objects`:

- `objects_select_access`: manager видит всё; executor видит активные объекты, по которым у него есть активная задача.
- `objects_insert_manager`: только manager, `created_by = auth.uid()`.
- `objects_update_manager`: только manager, `using` и `with check` — `is_manager()`.
- Нет `DELETE`-политики.

`tasks`:

- `tasks_select_access`: manager видит всё; executor видит только свои активные задачи на активном объекте.
- `tasks_insert_manager`: только manager, `author_id = auth.uid()`, `not is_deleted`, активный объект, assignee с ролью `executor`.
- `tasks_update_manager`: только manager, объект активен.
- Нет `DELETE`-политики.
- Колонка `status` не входит в `UPDATE`-грант; прямой `UPDATE status` запрещён также триггером.

`task_status_history`:

- `task_history_select_access`: manager видит всё; executor видит историю доступных ему задач.
- Нет политик и грантов на `INSERT`, `UPDATE`, `DELETE`.

### Гранты

Клиентские роли `anon` и `authenticated` не получают `ALL` на таблицы.

`authenticated` получает:

- `SELECT` на `profiles`;
- `SELECT` на `objects`;
- `INSERT (name, address)` на `objects`;
- `UPDATE (name, address, is_deleted)` на `objects`;
- `SELECT` на `tasks`;
- `INSERT (title, description, object_id, assignee_id)` на `tasks`;
- `UPDATE (title, description, object_id, assignee_id, is_deleted)` на `tasks`;
- `SELECT` на `task_status_history`.

Не выдаются права на:

- `profiles.role` и любые изменения `profiles`;
- `tasks.status`;
- `tasks.author_id`;
- `objects.created_by`;
- `created_at` и `updated_at`;
- `INSERT/UPDATE/DELETE` истории;
- `DELETE` объектов и задач.

`ALTER DEFAULT PRIVILEGES` отзывает права у `anon` и `authenticated` для новых таблиц, последовательностей и функций в `public`, чтобы новые объекты не становились доступными автоматически.

### Helper-функции

Все `SECURITY DEFINER`-функции имеют фиксированный `search_path = public, pg_temp`.

- `is_manager()` — проверяет роль текущего пользователя.
- `is_executor(profile_id)` — проверяет, что указанный профиль имеет роль `executor`.
- `is_object_active(object_id)` — проверяет, что объект существует и не удалён.
- `can_access_object(object_id)` — manager или executor с активной задачей на активный объект.
- `can_access_task(task_id)` — manager или назначенный executor активной задачи на активном объекте.
- `handle_new_user()` — создаёт профиль при создании `auth.users`.
- `prepare_object()`, `prepare_task()` — заполняют/защищают служебные поля.
- `protect_task_status()` — запрещает менять `status` вне RPC.
- `protect_profile_role()` — запрещает менять роль через клиентский API.
- `log_task_status_history()` — единственный писатель истории.

Исполнение функций отозвано у `public` и `anon`; нужные функции выданы `authenticated`.

### Триггеры целостности

`objects`:

- `prepare_object_before_insert` — подставляет `created_by = auth.uid()` и `created_at = now()`.
- `prepare_object_before_update` — запрещает менять `id`, `created_by`, `created_at`.

`tasks`:

- `prepare_task_before_insert` — подставляет `author_id = auth.uid()`, принудительно ставит `status = 'new'`, `created_at`, `updated_at`, проверяет assignee и активность объекта.
- `prepare_task_before_update` — запрещает менять `id`, `author_id`, `created_at`; проверяет смену assignee и активность объекта; обновляет `updated_at`.
- `protect_task_status_before_update` — разрешает смену статуса только при `crm.allow_status_transition = 'on'`.
- `log_task_status_history_after_insert` — пишет начальную запись истории.
- `log_task_status_history_after_status_update` — пишет запись при смене статуса.

`profiles`:

- `protect_profile_role_before_update` — запрещает менять `id` всегда, а `role` — при `auth.uid() is not null`.

## Rationale

- RLS — обязательный барьер для прямых запросов через PostgREST.
- Точечные гранты на колонки уменьшают поверхность атаки: даже при ошибке в политике клиент не сможет записать `status`, `role`, `author_id`.
- `SECURITY DEFINER` с фиксированным `search_path` позволяет helper-функциям проверять доступ без рекурсивных RLS-проверок и без подмены схемы.
- Soft delete сохраняет историю и ссылочную целостность.
- Частичные индексы соответствуют реальным запросам приложения.
- Отдельная таблица истории позволяет аудитировать переходы и не смешивать аудит с текущим состоянием задачи.

## Alternatives Considered

### Только RLS без точечных грантов

Отклонено: RLS защищает строки, но не запрещает запись отдельных колонок. Гранты на колонки дают второй независимый барьер.

### Жёсткое удаление

Отклонено: уничтожает историю и усложняет аудит. Требование — сохранять данные при удалении задач.

### Роль в `auth.users` или JWT claims

Отклонено: усложняет синхронизацию и не даёт преимуществ перед `profiles`.

### Отдельная таблица прав/ACL

Отклонено: для двух ролей и простых правил это избыточно. Если появятся дополнительные роли и гранулярные разрешения, решение можно пересмотреть.

### `SECURITY INVOKER` для helper-функций

Отклонено: может привести к рекурсивным RLS-проверкам и усложнить политики. `SECURITY DEFINER` с фиксированным `search_path` и минимальными грантами безопаснее и проще.

## Consequences

Положительные:

- Прямые запросы через publishable key ограничены RLS и грантами.
- История и служебные поля защищены от подделки.
- Soft delete сохраняет аудит.
- Схема явно описывает домен и ограничения.

Отрицательные:

- Схема и RLS требуют аккуратной синхронизации с TypeScript-типами.
- `profiles` доступны всем authenticated-пользователям; это нужно для отображения имён, но снижает приватность.
- `is_manager`, `is_executor`, `can_access_*` доступны authenticated и позволяют проверять существование записей по UUID. Риск низкий, но он существует.
- `on delete restrict` для профилей означает, что удаление `auth.users` с задачами/объектами невозможно без предварительной очистки ссылок.
- Изменение enum статусов требует миграции и обновления всех контрактов.

## Implementation Guidelines

### Изменение схемы

- Любое изменение схемы — только новой миграцией в `supabase/migrations/`.
- Не редактировать уже применённую миграцию в облачном окружении.
- После изменения схемы обновить `src/shared/api/database.types.ts` или сгенерировать типы Supabase CLI.
- Проверить, что новые таблицы не получили автоматических прав: `ALTER DEFAULT PRIVILEGES` уже отзывает их, но гранты нужно выдавать явно.
- Для новых таблиц с пользовательскими данными обязательно включить RLS, `FORCE RLS`, политики и минимальные гранты.
- Не выдавать `ALL` на таблицы ролям `anon` и `authenticated`.
- Не выдавать `UPDATE` на служебные колонки.
- Не добавлять `DELETE`-политики без отдельного решения об отказе от soft delete.

### Правила доступа

- Manager не должен получать доступ к данным, которые ему не нужны по бизнес-требованиям, даже если это удобно.
- Executor не должен видеть объекты без своих задач.
- Проверка доступа к объекту должна учитывать `is_deleted`.
- Проверка доступа к задаче должна учитывать `is_deleted` задачи и объекта.
- История доступна только manager или пользователю, который имеет доступ к задаче.

### Soft delete

- Удаление объекта/задачи — `update ... set is_deleted = true`.
- Восстановление — только manager и только через явное решение; текущий UI не предоставляет восстановление.
- Списки должны фильтровать `is_deleted = false`.
- Детальные страницы могут показывать удалённые строки manager, но действия должны быть заблокированы.

### Типы

- `ProfileRow`, `ObjectRow`, `TaskRow`, `TaskStatusHistoryRow` описывают строки БД.
- `ObjectListItem`, `TaskWithRelations`, `TaskHistoryItem` описывают составные модели.
- Не использовать `any` для обхода несовпадений типов; исправлять тип или добавлять явный mapper.

## Validation

- Проверить, что `anon` не читает таблицы и не вызывает RPC.
- Проверить, что executor не видит чужие объекты/задачи/историю.
- Проверить, что manager видит все объекты, задачи и историю.
- Проверить, что прямой `UPDATE tasks.status` запрещён и manager, и executor.
- Проверить, что `author_id`, `created_by`, `created_at` нельзя подделать.
- Проверить, что assignee имеет роль `executor`.
- Проверить, что история недоступна для записи/изменения/удаления.
- Проверить, что мягко удалённый объект скрывает задачи и блокирует переходы.
- Проверить, что новые таблицы/функции не доступны автоматически.
- Запустить `npm run test:security` при наличии тестового окружения.

## Related Decisions

- [ADR-003: Authentication and Authorization](./ADR-003-authentication-and-authorization.md)
- [ADR-005: Task Status Workflow](./ADR-005-task-status-workflow.md)
- [ADR-006: Immutable Task History](./ADR-006-immutable-task-history.md)
- [ADR-010: Security and Environment Configuration](./ADR-010-security-and-environment-configuration.md)
