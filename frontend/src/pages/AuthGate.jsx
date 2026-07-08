import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import LoginPage from './LoginPage'

export default function AuthGate() {
  const { token, user, _hydrated } = useAuthStore()

  if (!_hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (token && user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/tests'} replace />
  }

  return <LoginPage />
}
