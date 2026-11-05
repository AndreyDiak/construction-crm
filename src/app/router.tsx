import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { HomeRedirect, ProtectedRoute } from './guards'
import { LoginPage } from '@/pages/LoginPage'
import { MyTasksPage } from '@/pages/MyTasksPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ObjectDetailsPage } from '@/pages/ObjectDetailsPage'
import { ObjectsPage } from '@/pages/ObjectsPage'
import { TaskDetailsPage } from '@/pages/TaskDetailsPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<HomeRedirect />} />
            <Route path="/objects" element={<ObjectsPage />} />
            <Route path="/objects/:objectId" element={<ObjectDetailsPage />} />
            <Route path="/tasks/:taskId" element={<TaskDetailsPage />} />
            <Route path="/my-tasks" element={<MyTasksPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
