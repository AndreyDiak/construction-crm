# Construction CRM

Мини-CRM для строительной компании: объекты, задачи, исполнители и статусы.

## Демо

- Приложение: https://construction-crm-ashy-ten.vercel.app
- Репозиторий: https://github.com/AndreyDiak/construction-crm

| Роль | Email | Пароль |
|---|---|---|
| Постановщик (manager) | `manager@example.com` | `P@ssw0rd1` |
| Исполнитель 1 | `ex1@example.com` | `P@ssw0rd2` |
| Исполнитель 2 | `ex2@example.com` | `P@ssw0rd3` |

В базе уже есть 3 объекта и задачи во всех статусах: новая, в работе, на проверке, на доработке, принята.

Дополнительно к сдаче:

- [Объяснение для руководителя](docs/for-manager.md)
- [Решения и допущения](docs/decisions.md)

## Запуск локально

### 1. Supabase

1. Создайте проект на [supabase.com](https://supabase.com/dashboard).
2. Выполните SQL из `supabase/migrations/20261104000000_init.sql` в SQL Editor.
3. В **Authentication → Providers → Email** отключите самостоятельную регистрацию.
4. Создайте пользователей вручную в **Authentication → Users**.
5. Новым пользователям по умолчанию выдаётся роль исполнителя. Постановщика назначьте так:

```sql
update public.profiles p
set role = 'manager'
from auth.users u
where p.id = u.id
  and u.email = 'manager@example.com';
```

### 2. Переменные окружения

```bash
copy .env.example .env.local
```

В `.env.local` укажите URL и **publishable** key из **Project Settings → API Keys**:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Секретный ключ (`sb_secret_...` / `service_role`) во фронтенд не кладите.

### 3. Приложение

```bash
npm install
npm run dev
```

Сборка: `npm run build`.
