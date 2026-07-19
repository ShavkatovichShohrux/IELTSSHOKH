import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

// APK server.url orqali live saytdan yuklanadi — nisbiy /api URL lar ishlaydi.
// Veb-saytda ham nginx bir xil origin'dan proxy qiladi.
export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || ''

// audio_url, /uploads/..., /api/... kabi nisbiy yo'llarni to'liq manzilga aylantiradi.
// Manzil allaqachon http(s):// bilan boshlangan bo'lsa o'zgarishsiz qaytadi.
export const absUrl = (path) => {
  if (!path) return path
  if (/^https?:\/\//i.test(path)) return path
  return `${API_ORIGIN}${path}`
}

const client = axios.create({ baseURL: `${API_ORIGIN}/api`, timeout: 30000 })

client.interceptors.request.use(cfg => {
  const token = useAuthStore.getState().token
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

client.interceptors.response.use(
  res => res,
  err => {
    const url = err.config?.url || ''
    const detail = err.response?.data?.detail || ''

    // Boshqa qurilmadan kirilganida sessiya yaroqsiz bo'ladi
    if (detail === 'SESSION_INVALID') {
      useAuthStore.getState().logout()
      toast.error('Boshqa qurilmadan kirildi. Qaytadan kiring.', { id: 'session-invalid', duration: 5000 })
      return Promise.reject(err)
    }

    // Faqat auth endpointlarida 401 → avtomatik chiqish
    const isAuthEndpoint = url.includes('/users/me') || url.includes('/users/auth')
    if (err.response?.status === 401 && isAuthEndpoint) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(err)
  }
)

export default client

export const api = {
  // Auth
  login: d => client.post('/users/auth/login', d),
  register: d => client.post('/users/auth/register', d),
  me: () => client.get('/users/me'),
  logout: () => client.post('/users/auth/logout'),
  mySessions: () => client.get('/users/me/sessions'),
  userSessions: (id) => client.get(`/users/${id}/sessions`),

  // Tests
  getTests: p => client.get('/tests/', { params: p }),
  getTest: id => client.get(`/tests/${id}`),
  createTest: d => client.post('/tests/', d),
  updateTest: (id, d) => client.put(`/tests/${id}`, d),
  deleteTest: id => client.delete(`/tests/${id}`),

  // Users
  getUsers: () => client.get('/users/'),
  adminCreateUser: d => client.post('/users/', d),
  updateUser: (id, d) => client.put(`/users/${id}`, d),
  updateUserPlan: (id, plan) => client.put(`/users/${id}`, { plan }),
  deleteUser: id => client.delete(`/users/${id}`),

  // Results
  submitResult: d => client.post('/results/', d),
  myResults: () => client.get('/results/my'),
  allResults: p => client.get('/results/', { params: p }),
  globalStats: () => client.get('/results/stats/global'),
  testStats: () => client.get('/results/stats/tests'),

  // Audio
  uploadAudio: fd => client.post('/audio/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAudio: () => client.get('/audio/'),
  deleteAudio: id => client.delete(`/audio/${id}`),

  // Topics
  getTopics: () => client.get('/topics/'),
  createTopic: d => client.post('/topics/', d),
  updateTopic: (id, d) => client.put(`/topics/${id}`, d),
  deleteTopic: id => client.delete(`/topics/${id}`),
  uploadTopicFile: (id, fd) => client.post(`/topics/${id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),

  // Speaking — public
  getSpeakingDossiers: () => client.get('/speaking/dossiers'),

  // Speaking — admin
  getSpeakingDossiersAll: () => client.get('/speaking/dossiers/all'),
  createSpeakingDossier: fd => client.post('/speaking/dossiers', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  toggleSpeakingPublish: id => client.put(`/speaking/dossiers/${id}/publish`),
  deleteSpeakingDossier: id => client.delete(`/speaking/dossiers/${id}`),
  getSpeakingTokens: () => client.get('/speaking/tokens'),
  createSpeakingToken: d => client.post('/speaking/tokens', d),
  revokeSpeakingToken: token => client.delete(`/speaking/tokens/${token}`),
  uploadSpeakingDossierFile: (id, fd) => client.post(`/speaking/dossiers/${id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),

  // Question Types
  getQuestionTypes: () => client.get('/question-types/'),
  getQuestionTypesAll: () => client.get('/question-types/all'),
  createQuestionType: (name, name_uz, order) => client.post(`/question-types/?name=${encodeURIComponent(name)}&name_uz=${encodeURIComponent(name_uz)}&order=${order}`),
  uploadQuestionTypeFile: (id, fd) => client.post(`/question-types/${id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateQuestionType: (id, params) => client.put(`/question-types/${id}`, null, { params }),
  toggleQuestionTypePublish: (id) => client.put(`/question-types/${id}/publish`),
  deleteQuestionType: (id) => client.delete(`/question-types/${id}`),

  // Settings
  getSettings: () => client.get('/settings/'),
  updateSettings: d => client.put('/settings/', d),

  // Vocabulary
  getVocabTopics: () => client.get('/vocab/'),
  createVocabTopic: d => client.post('/vocab/', d),
  updateVocabTopic: (id, d) => client.put(`/vocab/${id}`, d),
  deleteVocabTopic: id => client.delete(`/vocab/${id}`),
  uploadVocabPdf: (id, fd) => client.post(`/vocab/${id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
}
