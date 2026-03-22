import { API_BASE_URL } from './config'

const TIMEOUT_MS = 65_000 // 65 seconds — enough for Render cold start (~30-60s)

async function request(path, options = {}) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response
    try {
          response = await fetch(`${API_BASE_URL}${path}`, {
                  signal: controller.signal,
                  headers: {
                            'Content-Type': 'application/json',
                            ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
                            ...(options.headers || {})
                  },
                  ...options
          })
    } catch (err) {
          if (err.name === 'AbortError') {
                  throw new Error('El servidor tardó demasiado en responder. Por favor intenta de nuevo en unos segundos.')
          }
          throw new Error('No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.')
    } finally {
          clearTimeout(timer)
    }

  const contentType = response.headers.get('content-type') || ''
    const payload = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
        const message = payload?.message || payload?.detail || 'Ocurrió un error al procesar la solicitud.'
        throw new Error(message)
  }

  return payload
}

export const api = {
    getProperties: () => request('/properties'),
    getAdminProperties: (token) => request('/properties/admin', { token }),
    searchAvailability: (body) => request('/search/availability', { method: 'POST', body: JSON.stringify(body) }),
    submitContact: (body) => request('/contact', { method: 'POST', body: JSON.stringify(body) }),
    getSmoobuStatus: () => request('/integration/smoobu/status'),
    login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    createProperty: (body, token) => request('/properties', { method: 'POST', body: JSON.stringify(body), token }),
    updateProperty: (id, body, token) => request(`/properties/${id}`, { method: 'PUT', body: JSON.stringify(body), token }),
    deleteProperty: (id, token) => request(`/properties/${id}`, { method: 'DELETE', token }),
    // Booking & Stripe
    createCheckout: (body) => request('/bookings/checkout', { method: 'POST', body: JSON.stringify(body) }),
    // Admin: Smoobu
    getSmoobuApartments: (token) => request('/smoobu/apartments', { token }),
    syncSmoobu: (token) => request('/smoobu/sync', { method: 'POST', token }),
}
