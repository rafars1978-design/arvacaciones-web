import { api } from './api'

const KEY = 'arv_broker'
const DAYS = 30

const read = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (!saved?.code) return null
    if (Date.now() - saved.at > DAYS * 86400000) {
      localStorage.removeItem(KEY)
      return null
    }
    return saved
  } catch {
    return null
  }
}

// Links look like https://www.arvacaciones.site/?b=CODE. A valid code is remembered for 30 days
// so the booking is credited to that broker even if the guest comes back later.
export const captureBroker = async () => {
  try {
    const code = new URLSearchParams(window.location.search).get('b')
    if (!code) return
    const result = await api.getBroker(code)
    if (result?.valid) {
      localStorage.setItem(KEY, JSON.stringify({ code: result.code, name: result.name, at: Date.now() }))
    }
  } catch {
    /* a bad link or no storage must never break the site */
  }
}

export const getBroker = () => read()
