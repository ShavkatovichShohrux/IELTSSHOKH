import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const client = axios.create({ baseURL: '/api', timeout: 30000 })

client.interceptors.request.use(cfg => {
  const token = useAuthStore.getState().token
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

client.interceptors.response.use(
  res => res,
  err => {
    // Only auto-logout on 401 from auth/identity endpoints.
    // Admin-only endpoints returning 401 (e.g., is_active=false) should NOT
    // silently clear the session — let the component handle the error.
    const url = err.config?.url || ''
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

  // Vocabulary
  getVocabTopics: () => client.get('/vocab/'),
  createVocabTopic: d => client.post('/vocab/', d),
  updateVocabTopic: (id, d) => client.put(`/vocab/${id}`, d),
  deleteVocabTopic: id => client.delete(`/vocab/${id}`),
  uploadVocabPdf: (id, fd) => client.post(`/vocab/${id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
}
