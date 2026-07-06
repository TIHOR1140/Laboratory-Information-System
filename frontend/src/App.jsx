import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth.js'
import { AppLayout } from './components/AppLayout.jsx'
import { AuthShell } from './components/AuthShell.jsx'
import { ProtectedRoute, PublicOnlyRoute } from './components/RouteGuards.jsx'
import { LoginPage } from './pages/LoginPage.jsx'
import { RegisterPage } from './pages/RegisterPage.jsx'
import { DashboardPage } from './pages/DashboardPage.jsx'
import { ProfilePage } from './pages/ProfilePage.jsx'
import { AdminUsersPage } from './pages/AdminUsersPage.jsx'
import { AdminDashboardPage } from './pages/AdminDashboardPage.jsx'
import { AdminTestsPage } from './pages/AdminTestsPage.jsx'
import { AdminTemplatesPage } from './pages/AdminTemplatesPage.jsx'
import { NotFoundPage } from './pages/NotFoundPage.jsx'

function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/register"
          element={
            <AuthShell
              eyebrow="Patient onboarding"
              title="Create your patient account"
              subtitle="Register once to access future patient services and your clinical profile"
            >
              <RegisterPage />
            </AuthShell>
          }
        />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to={getDashboardPath(user?.role)} replace />} />
          <Route path="/reception/dashboard" element={<DashboardPage role="RECEPTIONIST" />} />
          <Route path="/lab/dashboard" element={<DashboardPage role="TECHNICIAN" />} />
          <Route path="/patient/dashboard" element={<DashboardPage role="PATIENT" />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/tests" element={<AdminTestsPage />} />
          <Route path="/admin/templates" element={<AdminTemplatesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App

function getDashboardPath(role) {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard'
    case 'RECEPTIONIST':
      return '/reception/dashboard'
    case 'TECHNICIAN':
      return '/lab/dashboard'
    default:
      return '/patient/dashboard'
  }
}
