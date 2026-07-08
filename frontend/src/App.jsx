import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth.js'
import { AppLayout } from './components/AppLayout.jsx'
import { AuthShell } from './components/AuthShell.jsx'
import { ProtectedRoute, PublicOnlyRoute } from './components/RouteGuards.jsx'
import { LoginPage } from './pages/LoginPage.jsx'
import { RegisterPage } from './pages/RegisterPage.jsx'
import { DashboardPage } from './pages/DashboardPage.jsx'
import { ProfilePage } from './pages/ProfilePage.jsx'
import { PatientPage } from './pages/PatientPage.jsx'
import { AdminUsersPage } from './pages/AdminUsersPage.jsx'
import { AdminTestsPage } from './pages/AdminTestsPage.jsx'
import { ReceptionDashboardPage } from './pages/ReceptionDashboardPage.jsx'
import { TechnicianDashboardPage } from './pages/TechnicianDashboardPage.jsx'
import { VerifyReportPage } from './pages/VerifyReportPage.jsx'
import { NotFoundPage } from './pages/NotFoundPage.jsx'

function App() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Public Verification Route */}
      <Route path="/verify/:barcode" element={<VerifyReportPage />} />

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
          <Route path="/admin/dashboard" element={<DashboardPage role="ADMIN" />} />
          <Route path="/reception/dashboard" element={<ReceptionDashboardPage />} />
          <Route path="/lab/dashboard" element={<TechnicianDashboardPage />} />
          <Route path="/patient/dashboard" element={<PatientPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/tests" element={<AdminTestsPage />} />
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
