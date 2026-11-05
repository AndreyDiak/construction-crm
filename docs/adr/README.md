# Architecture Decision Records

Каталог архитектурных решений проекта Construction CRM. ADR фиксируют значимые решения, которые влияют на структуру кода, безопасность, модель данных и дальнейшую разработку.

## Назначение

ADR нужны, чтобы:

- не принимать повторно уже согласованные решения;
- явно разделять реализованное и запланированное;
- давать AI-агентам и разработчикам единый контекст перед изменениями;
- фиксировать причины отказа от альтернатив;
- обнаруживать конфликты между требованиями, кодом и тестами.

## Формат

Каждый документ содержит обязательные разделы:

- `Status`
- `Date`
- `Decision Makers`
- `Context`
- `Decision`
- `Rationale`
- `Alternatives Considered`
- `Consequences`
- `Implementation Guidelines`
- `Validation`
- `Related Decisions`

## Статусы

- `Proposed` — решение предложено, но ещё не согласовано или не реализовано.
- `Accepted` — решение согласовано и является обязательным правилом. Наличие статуса `Accepted` не означает, что все пункты уже реализованы: отклонения явно перечисляются в самом ADR.
- `Superseded` — решение заменено другим ADR; ссылка на замену обязательна.

## Важные соглашения проекта

- Канонические имена статусов задачи: `new`, `in_progress`, `in_review`, `accepted`, `needs_revision`.
- Текущая реализация БД и кода использует `on_review` и `needs_rework`. Это известное расхождение с требованиями; миграция описана в [ADR-005](./ADR-005-task-status-workflow.md) и пока не выполнена.
- UI реализован на Chakra UI v3. shadcn/ui в проекте не используется; это осознанное отклонение от формулировки тестового задания, зафиксированное в [ADR-001](./ADR-001-frontend-architecture.md).
- Часть практик (unit-тесты, типизированные ошибки, автоматическая проверка границ модулей) ещё не реализована. Соответствующие ADR имеют статус `Proposed`.

## Индекс

| ID | Решение | Статус | Назначение |
|---|---|---|---|
| [ADR-001](./ADR-001-frontend-architecture.md) | Frontend Architecture | Accepted | Слои, модули, публичные API, импорты, UI-библиотека |
| [ADR-002](./ADR-002-server-state-management.md) | Server State Management | Accepted | TanStack Query, ключи, инвалидация, локальное состояние |
| [ADR-003](./ADR-003-authentication-and-authorization.md) | Authentication and Authorization | Accepted | Supabase Auth, роли, guards, разделение frontend/backend |
| [ADR-004](./ADR-004-database-schema-and-access-control.md) | Database Schema and Access Control | Accepted | Таблицы, связи, индексы, RLS, гранты, soft delete |
| [ADR-005](./ADR-005-task-status-workflow.md) | Task Status Workflow | Accepted | Машина состояний, RPC, атомарность, защита от обхода |
| [ADR-006](./ADR-006-immutable-task-history.md) | Immutable Task History | Accepted | История статусов, триггеры, аудит, append-only |
| [ADR-007](./ADR-007-forms-and-validation.md) | Forms and Validation | Accepted | React Hook Form, Zod, клиентская и серверная валидация |
| [ADR-008](./ADR-008-testing-strategy.md) | Testing Strategy | Proposed | Unit, integration, RLS/RPC, multi-user, CI |
| [ADR-009](./ADR-009-error-handling.md) | Error Handling | Proposed | Типизированные ошибки, UI-состояния, уведомления, логирование |
| [ADR-010](./ADR-010-security-and-environment-configuration.md) | Security and Environment Configuration | Accepted | Переменные окружения, ключи, миграции, привилегии, деплой |

## Как добавить ADR

1. Проверить, не противоречит ли решение существующим ADR.
2. Создать файл `ADR-XXX-kebab-case-title.md`.
3. Заполнить все обязательные разделы.
4. Указать статус `Proposed`, если решение ещё не согласовано.
5. Добавить запись в индекс.
6. При замене старого решения указать `Superseded` и ссылку на новый ADR.
