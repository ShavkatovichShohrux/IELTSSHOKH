import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from './store/authStore'
import { useCopyProtection } from './hooks/useCopyProtection'
import { api } from './api/client'

import Navbar from './components/Layout/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

import Landing from './pages/Landing'
import Home from './pages/Home'
import StudentHub from './pages/StudentHub'
import Vocabulary from './pages/Vocabulary'
import PdfReader from './pages/PdfReader'
import AuthGate from './pages/AuthGate'
import Register from './pages/Register'
import ListeningTest from './pages/ListeningTest'
import ReadingTest from './pages/ReadingTest'
import MyResults from './pages/MyResults'

import SpeakingQuestionTypes from './pages/SpeakingQuestionTypes'
import Challenge from './pages/Challenge'

import AdminLayout from './pages/admin/AdminLayout'
import QuestionTypeManager from './pages/admin/QuestionTypeManager'
import Dashboard from './pages/admin/Dashboard'
import TestList from './pages/admin/TestList'
import TestEditor from './pages/admin/TestEditor'
import UserList from './pages/admin/UserList'
import Statistics from './pages/admin/Statistics'
import AudioManager from './pages/admin/AudioManager'
import TopicManager from './pages/admin/TopicManager'
import SpeakingManager from './pages/admin/SpeakingManager'
import VocabManager from './pages/admin/VocabManager'
import AdminSettings from './pages/admin/AdminSettings'

export default function App() {
  const { theme, user, token, setAuth } = useAuthStore()
  const location = useLocation()
  const [windowBlurred, setWindowBlurred] = useState(false)

  // On app startup, refresh user data from server to ensure token is still valid.
  // If /me returns 401, the interceptor clears session → ProtectedRoute redirects to login.
  useEffect(() => {
    if (!token) return
    api.me().then(res => setAuth(res.data, token)).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Admin va login sahifalarida himoya shart emas
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isPublicRoute = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/' || location.pathname === '/speaking'
  const isProtectedRoute = !isPublicRoute   // admin + student — barchasi himoyalangan

  useCopyProtection(isAdminRoute)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // Blur overlay — desktop: window blur; mobile: visibilitychange
  useEffect(() => {
    if (!isProtectedRoute) { setWindowBlurred(false); return }
    const onBlur = () => setWindowBlurred(true)
    const onFocus = () => setWindowBlurred(false)
    const onVisibility = () => {
      if (document.hidden) setWindowBlurred(true)
      else setWindowBlurred(false)
    }
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [isProtectedRoute])

  return (
    <div className="min-h-screen">
      <Routes>
        {/* Public */}
        <Route path="/" element={<AuthGate />} />
        <Route path="/login" element={<AuthGate />} />
        <Route path="/speaking" element={<Landing />} />
        <Route path="/register" element={<Register />} />

        {/* Protected user pages */}
        <Route path="/tests" element={
          <ProtectedRoute>
            <StudentHub />
          </ProtectedRoute>
        } />
        <Route path="/tests/speaking" element={
          <ProtectedRoute>
            <Navbar /><Home />
          </ProtectedRoute>
        } />
        <Route path="/tests/question-types" element={
          <ProtectedRoute>
            <Navbar /><SpeakingQuestionTypes />
          </ProtectedRoute>
        } />
        <Route path="/tests/challenge" element={
          <ProtectedRoute>
            <Challenge />
          </ProtectedRoute>
        } />
        <Route path="/vocabulary" element={
          <ProtectedRoute>
            <Vocabulary />
          </ProtectedRoute>
        } />
        <Route path="/vocabulary/:id" element={
          <ProtectedRoute>
            <PdfReader />
          </ProtectedRoute>
        } />
        <Route path="/listening/:id" element={
          <ProtectedRoute>
            <ListeningTest />
          </ProtectedRoute>
        } />
        <Route path="/reading/:id" element={
          <ProtectedRoute>
            <ReadingTest />
          </ProtectedRoute>
        } />
        <Route path="/my-results" element={
          <ProtectedRoute>
            <Navbar /><MyResults />
          </ProtectedRoute>
        } />

        {/* Admin */}
        <Route path="/admin" element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="tests" element={<TestList />} />
          <Route path="tests/new" element={<TestEditor />} />
          <Route path="tests/:id/edit" element={<TestEditor />} />
          <Route path="users" element={<UserList />} />
          <Route path="speaking" element={<SpeakingManager />} />
          <Route path="vocabulary" element={<VocabManager />} />
          <Route path="topics" element={<TopicManager />} />
          <Route path="stats" element={<Statistics />} />
          <Route path="audio" element={<AudioManager />} />
          <Route path="question-types" element={<QuestionTypeManager />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Blur overlay — desktop blur + mobile visibilitychange */}
      {windowBlurred && isProtectedRoute && (
        <div
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center select-none gap-3"
          style={{ backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', background: 'rgba(6,6,12,0.72)' }}
        >
          <p className="text-white/80 text-base font-semibold tracking-wide">
            Davom etish uchun oynaga qayting
          </p>
          <p className="text-white/25 text-xs tracking-widest uppercase">IELTSSHOKH · Protected Content</p>
        </div>
      )}
    </div>
  )
}
