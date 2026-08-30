const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const TOKEN_KEY = 'titan_token'

// Server origin without the trailing /api - e.g. 'http://localhost:5000'.
// Used to turn a relative upload path like '/uploads/xyz.jpg' (returned by
// POST /upload, see uploadController.js) into a real, loadable image URL,
// without ever hardcoding a host/port that could go stale.
export const API_ORIGIN = BASE_URL.replace(/\/api\/?$/, '')

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token)
  else sessionStorage.removeItem(TOKEN_KEY)
}

async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (!isForm && body !== undefined) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
  })

  const contentType = res.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await res.json().catch(() => null) : null

  if (!res.ok) {
    const error = new Error(data?.message || `Request failed (${res.status})`)
    error.status = res.status
    error.code = data?.code
    error.idLabel = data?.idLabel
    error.accountsFound = data?.accountsFound
    throw error
  }

  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path, body) => request(path, { method: 'DELETE', body }),

  // Uploads a single image file, returns { url }
  uploadImage: async (file) => {
    const form = new FormData()
    form.append('image', file)
    return request('/upload', { method: 'POST', body: form, isForm: true })
  },

  // Triggers a browser download for binary endpoints (PDF / Excel export)
  // that don't return JSON.
  download: async (path, filename) => {
    const token = getToken()
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data?.message || 'Download failed.')
    }
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  },
}
