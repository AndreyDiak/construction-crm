import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.test' })
dotenv.config({ path: '.env.test.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

const managerEmail = process.env.TEST_MANAGER_EMAIL
const managerPassword = process.env.TEST_MANAGER_PASSWORD
const executorEmail = process.env.TEST_EXECUTOR_EMAIL
const executorPassword = process.env.TEST_EXECUTOR_PASSWORD
const executor2Email = process.env.TEST_EXECUTOR_2_EMAIL
const executor2Password = process.env.TEST_EXECUTOR_2_PASSWORD

const isPublishableKey = Boolean(publishableKey?.startsWith('sb_publishable_'))
const usesInvalidKey = Boolean(publishableKey && !isPublishableKey)

const isConfigured = Boolean(
  supabaseUrl &&
    isPublishableKey &&
    managerEmail &&
    managerPassword &&
    executorEmail &&
    executorPassword &&
    executor2Email &&
    executor2Password,
)

function fetchWithoutKeepAlive(input, init = {}) {
  const headers = new Headers(init.headers)
  headers.set('Connection', 'close')
  return fetch(input, { ...init, headers })
}

function createPublicClient() {
  return createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchWithoutKeepAlive },
  })
}

async function signIn(client, email, password, label) {
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  assert.ifError(error, `${label}: sign in failed`)
  assert.ok(data.user, `${label}: no user returned`)
  return data.user
}

function expectSupabaseError(result, message) {
  assert.ok(result.error, message)
  return result.error
}

if (usesInvalidKey) {
  test('security tests use a publishable key', () => {
    assert.fail(
      'VITE_SUPABASE_PUBLISHABLE_KEY must contain sb_publishable_.... Secret keys and legacy JWT keys are not allowed.',
    )
  })
} else if (!isConfigured) {
  test('security tests are configured', () => {
    assert.fail('Fill .env.test from .env.test.example')
  })
} else {
  describe('Construction CRM security and business rules', () => {
    const manager = createPublicClient()
    const executor = createPublicClient()
    const executor2 = createPublicClient()
    const guest = createPublicClient()

    const createdObjectIds = []
    const createdTaskIds = []

    let managerId
    let executorId
    let executor2Id

    let objectA
    let objectB
    let taskA
    let taskB

    let sequence = 0

    async function createObject(name) {
      const { data, error } = await manager
        .from('objects')
        .insert({ name: name ?? `Security test ${Date.now()}-${sequence++}`, address: 'Test address' })
        .select('*')
        .single()

      assert.ifError(error)
      createdObjectIds.push(data.id)
      return data
    }

    async function createTask(objectId, assigneeId, title) {
      const { data, error } = await manager
        .from('tasks')
        .insert({
          title: title ?? `Security task ${Date.now()}-${sequence++}`,
          object_id: objectId,
          assignee_id: assigneeId,
        })
        .select('*')
        .single()

      assert.ifError(error)
      createdTaskIds.push(data.id)
      return data
    }

    async function getTaskAs(client, taskId) {
      const { data, error } = await client
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .maybeSingle()

      assert.ifError(error)
      return data
    }

    async function getObjectAs(client, objectId) {
      const { data, error } = await client
        .from('objects')
        .select('*')
        .eq('id', objectId)
        .maybeSingle()

      assert.ifError(error)
      return data
    }

    async function transition(client, taskId, to, comment) {
      return client.rpc('transition_task_status', {
        p_task_id: taskId,
        p_to_status: to,
        p_comment: comment ?? null,
      })
    }

    async function getHistory(client, taskId) {
      const { data, error } = await client
        .from('task_status_history')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true })

      assert.ifError(error)
      return data ?? []
    }

    before(async () => {
      const managerUser = await signIn(manager, managerEmail, managerPassword, 'manager')
      const executorUser = await signIn(executor, executorEmail, executorPassword, 'executor')
      const executor2User = await signIn(executor2, executor2Email, executor2Password, 'executor2')

      managerId = managerUser.id
      executorId = executorUser.id
      executor2Id = executor2User.id

      const { data: profiles, error: profilesError } = await manager
        .from('profiles')
        .select('id, role')
        .in('id', [managerId, executorId, executor2Id])

      assert.ifError(profilesError)

      const roles = Object.fromEntries((profiles ?? []).map((profile) => [profile.id, profile.role]))
      assert.equal(roles[managerId], 'manager', 'TEST_MANAGER must have manager role')
      assert.equal(roles[executorId], 'executor', 'TEST_EXECUTOR must have executor role')
      assert.equal(roles[executor2Id], 'executor', 'TEST_EXECUTOR_2 must have executor role')

      objectA = await createObject(`Security object A ${Date.now()}`)
      objectB = await createObject(`Security object B ${Date.now()}`)
      taskA = await createTask(objectA.id, executorId, `Task for executor 1 ${Date.now()}`)
      taskB = await createTask(objectB.id, executor2Id, `Task for executor 2 ${Date.now()}`)
    })

    after(async () => {
      if (createdTaskIds.length > 0) {
        await manager.from('tasks').update({ is_deleted: true }).in('id', createdTaskIds)
      }

      if (createdObjectIds.length > 0) {
        await manager.from('objects').update({ is_deleted: true }).in('id', createdObjectIds)
      }

      await Promise.all([
        manager.auth.signOut(),
        executor.auth.signOut(),
        executor2.auth.signOut(),
      ])
    })

    test('executor sees only assigned tasks', async () => {
      const { data: tasks, error } = await executor
        .from('tasks')
        .select('*')
        .eq('is_deleted', false)

      assert.ifError(error)

      const ids = new Set((tasks ?? []).map((task) => task.id))
      assert.ok(ids.has(taskA.id), 'executor must see own task')
      assert.ok(!ids.has(taskB.id), 'executor must not see another executor task')

      const foreignTask = await getTaskAs(executor, taskB.id)
      assert.equal(foreignTask, null, 'foreign task must be hidden by RLS')

      const foreignHistory = await getHistory(executor, taskB.id)
      assert.equal(foreignHistory.length, 0, 'foreign task history must be hidden by RLS')
    })

    test('executor sees only objects linked to own tasks', async () => {
      const { data: objects, error } = await executor
        .from('objects')
        .select('*')
        .eq('is_deleted', false)

      assert.ifError(error)

      const ids = new Set((objects ?? []).map((object) => object.id))
      assert.ok(ids.has(objectA.id), 'executor must see object with own task')
      assert.ok(!ids.has(objectB.id), 'executor must not see object without own tasks')

      const foreignObject = await getObjectAs(executor, objectB.id)
      assert.equal(foreignObject, null, 'foreign object must be hidden by RLS')
    })

    test('manager sees all objects, tasks and history', async () => {
      const { data: tasks, error } = await manager.from('tasks').select('*')
      assert.ifError(error)

      const ids = new Set((tasks ?? []).map((task) => task.id))
      assert.ok(ids.has(taskA.id))
      assert.ok(ids.has(taskB.id))

      const { data: objects, error: objectsError } = await manager.from('objects').select('*')
      assert.ifError(objectsError)

      const objectIds = new Set((objects ?? []).map((object) => object.id))
      assert.ok(objectIds.has(objectA.id))
      assert.ok(objectIds.has(objectB.id))

      const history = await getHistory(manager, taskA.id)
      assert.ok(history.length >= 1, 'manager must see task history')
    })

    test('direct task UPDATE cannot change status', async () => {
      const managerAttempt = await manager
        .from('tasks')
        .update({ status: 'in_progress' })
        .eq('id', taskA.id)

      expectSupabaseError(managerAttempt, 'manager direct status update must be denied')

      const executorAttempt = await executor
        .from('tasks')
        .update({ status: 'in_progress' })
        .eq('id', taskA.id)

      expectSupabaseError(executorAttempt, 'executor direct status update must be denied')

      const freshTask = await getTaskAs(manager, taskA.id)
      assert.equal(freshTask.status, 'new')
    })

    test('executor cannot update task fields directly', async () => {
      const { error } = await executor
        .from('tasks')
        .update({ title: 'Hacked title' })
        .eq('id', taskA.id)

      assert.equal(error, null, 'RLS silently ignores rows the executor cannot update')

      const freshTask = await getTaskAs(manager, taskA.id)
      assert.notEqual(freshTask.title, 'Hacked title')
    })

    test('executor cannot create objects or tasks', async () => {
      const objectAttempt = await executor
        .from('objects')
        .insert({ name: 'Forbidden object', address: 'Forbidden address' })
        .select('*')
        .single()

      expectSupabaseError(objectAttempt, 'executor object insert must be denied')

      const taskAttempt = await executor
        .from('tasks')
        .insert({
          title: 'Forbidden task',
          object_id: objectA.id,
          assignee_id: executorId,
        })
        .select('*')
        .single()

      expectSupabaseError(taskAttempt, 'executor task insert must be denied')
    })

    test('task author and created_by cannot be forged', async () => {
      const objectAttempt = await manager
        .from('objects')
        .insert({
          name: `Forged object ${Date.now()}`,
          address: 'Address',
          created_by: executorId,
        })
        .select('*')
        .single()

      expectSupabaseError(objectAttempt, 'client cannot set objects.created_by')

      const taskAttempt = await manager
        .from('tasks')
        .insert({
          title: `Forged task ${Date.now()}`,
          object_id: objectA.id,
          assignee_id: executorId,
          author_id: executor2Id,
        })
        .select('*')
        .single()

      expectSupabaseError(taskAttempt, 'client cannot set tasks.author_id')
    })

    test('assignee must be an executor', async () => {
      const attempt = await manager
        .from('tasks')
        .insert({
          title: `Manager assignee ${Date.now()}`,
          object_id: objectA.id,
          assignee_id: managerId,
        })
        .select('*')
        .single()

      expectSupabaseError(attempt, 'task assignee must have executor role')
    })

    test('task history is read-only for clients', async () => {
      const history = await getHistory(executor, taskA.id)
      assert.ok(history.length >= 1)
      const historyId = history[0].id

      const insertAttempt = await executor
        .from('task_status_history')
        .insert({
          task_id: taskA.id,
          changed_by: executorId,
          to_status: 'new',
          comment: 'forged',
        })
        .select('*')
        .single()

      expectSupabaseError(insertAttempt, 'executor history insert must be denied')

      const managerInsertAttempt = await manager
        .from('task_status_history')
        .insert({
          task_id: taskA.id,
          changed_by: managerId,
          to_status: 'new',
          comment: 'forged',
        })
        .select('*')
        .single()

      expectSupabaseError(managerInsertAttempt, 'manager history insert must be denied')

      const updateAttempt = await executor
        .from('task_status_history')
        .update({ comment: 'forged update' })
        .eq('id', historyId)

      expectSupabaseError(updateAttempt, 'executor history update must be denied')

      const deleteAttempt = await manager
        .from('task_status_history')
        .delete()
        .eq('id', historyId)

      expectSupabaseError(deleteAttempt, 'manager history delete must be denied')

      const afterAttempts = await getHistory(manager, taskA.id)
      assert.equal(afterAttempts.length, history.length, 'history row count must not change')
      assert.notEqual(afterAttempts[0].comment, 'forged update')
    })

    test('role escalation through profiles API is denied', async () => {
      const executorAttempt = await executor
        .from('profiles')
        .update({ role: 'manager' })
        .eq('id', executorId)

      expectSupabaseError(executorAttempt, 'executor role update must be denied')

      const managerAttempt = await manager
        .from('profiles')
        .update({ role: 'manager' })
        .eq('id', executorId)

      expectSupabaseError(managerAttempt, 'manager role update through API must be denied')

      const { data: profile, error } = await manager
        .from('profiles')
        .select('role')
        .eq('id', executorId)
        .single()

      assert.ifError(error)
      assert.equal(profile.role, 'executor')
    })

    test('all allowed transitions work and history is recorded', async () => {
      const task = await createTask(objectA.id, executorId)
      assert.equal(task.status, 'new')

      const initialHistory = await getHistory(executor, task.id)
      assert.equal(initialHistory.length, 1, 'initial history row must be created by trigger')
      assert.equal(initialHistory[0].from_status, null)
      assert.equal(initialHistory[0].to_status, 'new')

      let result = await transition(executor, task.id, 'in_progress')
      assert.ifError(result.error)
      assert.equal(result.data.status, 'in_progress')

      result = await transition(executor, task.id, 'on_review')
      assert.ifError(result.error)
      assert.equal(result.data.status, 'on_review')

      result = await transition(manager, task.id, 'needs_rework')
      expectSupabaseError(result, 'rework without comment must be denied')

      let freshTask = await getTaskAs(manager, task.id)
      assert.equal(freshTask.status, 'on_review')

      result = await transition(manager, task.id, 'needs_rework', 'Fix the wiring')
      assert.ifError(result.error)
      assert.equal(result.data.status, 'needs_rework')

      result = await transition(executor, task.id, 'in_progress')
      assert.ifError(result.error)
      assert.equal(result.data.status, 'in_progress')

      result = await transition(executor, task.id, 'on_review')
      assert.ifError(result.error)
      assert.equal(result.data.status, 'on_review')

      result = await transition(manager, task.id, 'accepted')
      assert.ifError(result.error)
      assert.equal(result.data.status, 'accepted')

      freshTask = await getTaskAs(manager, task.id)
      assert.equal(freshTask.status, 'accepted')

      const history = await getHistory(manager, task.id)
      assert.equal(history.length, 7, 'initial + six successful transitions')
      const reworkRow = history.find(
        (row) => row.from_status === 'on_review' && row.to_status === 'needs_rework',
      )
      assert.ok(reworkRow)
      assert.equal(reworkRow.comment, 'Fix the wiring')
      assert.equal(reworkRow.changed_by, managerId)
    })

    test('forbidden transitions are rejected', async () => {
      const task = await createTask(objectA.id, executorId)

      let result = await transition(executor, task.id, 'on_review')
      expectSupabaseError(result, 'executor cannot skip in_progress')

      result = await transition(executor, task.id, 'accepted')
      expectSupabaseError(result, 'executor cannot accept task')

      result = await transition(manager, task.id, 'in_progress')
      expectSupabaseError(result, 'manager cannot take task into work')

      result = await transition(manager, task.id, 'accepted')
      expectSupabaseError(result, 'manager cannot accept a new task')

      result = await transition(executor2, task.id, 'in_progress')
      expectSupabaseError(result, 'another executor cannot transition the task')

      result = await transition(executor, task.id, 'in_progress')
      assert.ifError(result.error)
      result = await transition(executor, task.id, 'on_review')
      assert.ifError(result.error)

      result = await transition(executor, task.id, 'accepted')
      expectSupabaseError(result, 'executor cannot accept own task')

      result = await transition(manager, task.id, 'in_progress')
      expectSupabaseError(result, 'manager cannot return on_review to in_progress')

      result = await transition(manager, task.id, 'needs_rework', 'Please redo')
      assert.ifError(result.error)

      result = await transition(manager, task.id, 'accepted')
      expectSupabaseError(result, 'manager cannot accept needs_rework directly')

      const freshTask = await getTaskAs(manager, task.id)
      assert.equal(freshTask.status, 'needs_rework')
    })

    test('soft-deleted task is hidden from executor but visible to manager', async () => {
      const task = await createTask(objectA.id, executorId)

      assert.ok(await getTaskAs(executor, task.id), 'executor sees task before delete')

      const { error: deleteError } = await manager
        .from('tasks')
        .update({ is_deleted: true })
        .eq('id', task.id)
      assert.ifError(deleteError)

      assert.equal(await getTaskAs(executor, task.id), null)
      assert.equal((await getHistory(executor, task.id)).length, 0)

      const managerTask = await getTaskAs(manager, task.id)
      assert.ok(managerTask)
      assert.equal(managerTask.is_deleted, true)
      assert.ok((await getHistory(manager, task.id)).length >= 1)

      const transitionAttempt = await transition(executor, task.id, 'in_progress')
      expectSupabaseError(transitionAttempt, 'transition on deleted task must be denied')
    })

    test('soft-deleted object hides tasks from executor and blocks transitions', async () => {
      const object = await createObject(`Soft delete object ${Date.now()}`)
      const task = await createTask(object.id, executorId)

      assert.ok(await getObjectAs(executor, object.id), 'executor must see object before delete')
      assert.ok(await getTaskAs(executor, task.id), 'executor must see task before delete')

      const { error: deleteError } = await manager
        .from('objects')
        .update({ is_deleted: true })
        .eq('id', object.id)
      assert.ifError(deleteError)

      assert.equal(await getObjectAs(executor, object.id), null)
      assert.equal(await getTaskAs(executor, task.id), null)
      assert.equal((await getHistory(executor, task.id)).length, 0)

      const transitionAttempt = await transition(executor, task.id, 'in_progress')
      expectSupabaseError(transitionAttempt, 'transition on deleted object must be denied')

      const managerTask = await getTaskAs(manager, task.id)
      assert.ok(managerTask, 'manager must still see historical task row')

      const managerTransition = await transition(manager, task.id, 'needs_rework', 'test')
      expectSupabaseError(managerTransition, 'manager transition on deleted object must be denied')

      const { error: restoreError } = await manager
        .from('objects')
        .update({ is_deleted: false })
        .eq('id', object.id)
      assert.ifError(restoreError)

      assert.ok(await getObjectAs(executor, object.id), 'executor sees object after restore')
    })

    test('anonymous users have no access', async () => {
      const selectAttempt = await guest.from('objects').select('*')
      if (selectAttempt.error) {
        assert.ok(selectAttempt.error, 'guest must not read objects')
      } else {
        assert.deepEqual(selectAttempt.data, [], 'guest must not read objects')
      }

      const rpcAttempt = await transition(guest, taskA.id, 'in_progress')
      expectSupabaseError(rpcAttempt, 'guest must not call transition RPC')
    })
  })
}
