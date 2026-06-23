import { Navigate, Outlet } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'

/** Redirects to login when there's no active admin session. */
export function ProtectedRoute() {
  const { isAuthenticated } = useAdminAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}
