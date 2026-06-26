import { LoaderCircle } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { getDashboardPath } from '../lib/authStorage.js'

export function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950/95 text-white">
        <LoaderCircle className="h-8 w-8 animate-spin text-sky-300" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to={getDashboardPath(user?.role)} replace />
  }

  return <Outlet />
}

export function PublicOnlyRoute() {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950/95 text-white">
        <LoaderCircle className="h-8 w-8 animate-spin text-sky-300" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={getDashboardPath(user?.role)} replace />
  }

  return <Outlet />
}