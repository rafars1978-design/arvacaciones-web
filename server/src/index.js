import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import Stripe from 'stripe'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataPath = path.join(__dirname, 'data', 'properties.json')
const photosPath = path.join(__dirname, 'data', 'photos.json')
const feesPath = path.join(__dirname, 'data', 'fees.json')
const pendingPath = path.join(__dirname, 'data', 'pending-bookings.json')

const app = express()
const PORT = process.env.PORT || 4000
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@arvacaciones.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!'
const SMOOBU_API_KEY = process.env.SMOOBU_API_KEY || ''
const SMOOBU_CUSTOMER_ID = process.env.SMOOBU_CUSTOMER_ID || ''
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

const CLIP_API_KEY = process.env.CLIP_API_KEY || ''
const CLIP_SECRET_KEY = process.env.CLIP_SECRET_KEY || ''
const SITE_URL = (process.env.SITE_URL || 'https://www.arvacaciones.site').replace(/\/$/, '')
const API_PUBLIC_URL = (process.env.API_PUBLIC_URL || 'https://ar-vacaciones-api.onrender.com').replace(/\/$/, '')
const clipEnabled = Boolean(CLIP_API_KEY && CLIP_SECRET_KEY)

const useMock = !SMOOBU_API_KEY || !SMOOBU_CUSTOMER_ID

// Stripe instance (null if not configured)
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null

// ─── CORS & JSON ───────────────────────────────────────────────────────────────
// Stripe webhooks need raw body — mount raw parser BEFORE json middleware
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }))

app.use(cors({
  origin: (origin, cb) => {
    // Allow same-origin, Netlify previews, and the configured client
    if (!origin || origin === CLIENT_ORIGIN || origin.endsWith('.netlify.app') || origin.endsWith('.arvacaciones.com')) {
      cb(null, true)
    } else {
      cb(null, true) // During development allow all — tighten in production if needed
    }
  },
  credentials: true
}))
app.use(express.json({ limit: '2mb' }))

// ─── HELPERS ───────────────────────────────────────────────────────────────────
const readProperties = async () => {
  try {
    const content = await fs.readFile(dataPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
}

const writeProperties = async (properties) => {
  await fs.writeFile(dataPath, JSON.stringify(properties, null, 2), 'utf-8')
}

const normalizeProperty = (payload, existingId) => ({
  id: existingId || `prop_${Date.now()}`,
  name: payload.name?.trim() || 'Nueva propiedad',
  location: payload.location?.trim() || 'Playa del Carmen',
  price: Number(payload.price || 0),
  rating: Number(payload.rating || 0),
  reviews: Number(payload.reviews || 0),
  guests: Number(payload.guests || 1),
  bedrooms: Number(payload.bedrooms || 1),
  bathrooms: Number(payload.bathrooms || 1),
  image: payload.image?.trim() || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&h=900&fit=crop',
  gallery: Array.isArray(payload.gallery)
    ? payload.gallery
    : String(payload.gallery || '').split(',').map((s) => s.trim()).filter(Boolean),
  amenities: Array.isArray(payload.amenities)
    ? payload.amenities
    : String(payload.amenities || '').split(',').map((s) => s.trim()).filter(Boolean),
  summary: payload.summary?.trim() || 'Propiedad administrable desde el panel interno.',
  smoobuApartmentId: String(payload.smoobuApartmentId || '').trim(),
  active: payload.active !== undefined ? Boolean(payload.active) : true,
  featured: Boolean(payload.featured)
})

const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ message: 'Autenticación requerida.' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado.' })
  }
}

// ─── SMOOBU API HELPERS ────────────────────────────────────────────────────────
const smoobuHeaders = () => ({
  'Api-Key': SMOOBU_API_KEY,
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache'
})

/**
 * Fetch all apartments from Smoobu API including photos
 */
const fetchSmoobuApartments = async () => {
  const res = await fetch('https://login.smoobu.com/api/apartments', {
    headers: smoobuHeaders()
  })
  if (!res.ok) throw new Error(`Smoobu apartments error: ${res.status}`)
  const data = await res.json()
  // Smoobu returns { apartments: [...] } or an array directly
  return Array.isArray(data) ? data : (data.apartments || data._embedded?.apartments || [])
}

// ── Live catalogue built from Smoobu (source of truth for price, capacity, rooms) ──
// Apartments that must never be published on the public site.
const EXCLUDED_NAME_PATTERNS = [/piedra del caribe/i, /ceren[\s_-]*106/i, /muyal/i]
const isExcluded = (name = '') => EXCLUDED_NAME_PATTERNS.some((re) => re.test(name))

const fetchSmoobuDetail = async (id) => {
  const res = await fetch(`https://login.smoobu.com/api/apartments/${id}`, { headers: smoobuHeaders() })
  if (!res.ok) throw new Error(`Smoobu apartment ${id} error: ${res.status}`)
  return res.json()
}

const isoDay = (d) => d.toISOString().slice(0, 10)

const IVA_RATE = 0.16

// Daily rates {price, min_length_of_stay, available} per apartment id for a date range
const fetchSmoobuRatesRange = async (ids, startDate, endDate) => {
  const out = {}
  for (let i = 0; i < ids.length; i += 10) {
    const chunk = ids.slice(i, i + 10)
    const qs = chunk.map((id) => `apartments[]=${id}`).join('&')
    try {
      const res = await fetch(`https://login.smoobu.com/api/rates?${qs}&start_date=${startDate}&end_date=${endDate}`, { headers: smoobuHeaders() })
      if (!res.ok) throw new Error(`rates ${res.status}`)
      const body = await res.json()
      for (const id of chunk) out[id] = body?.data?.[id] || {}
    } catch (err) {
      console.error('Smoobu rates error:', err.message)
      for (const id of chunk) out[id] = null
    }
  }
  return out
}

const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

// Summary for the catalogue: lowest nightly rate and shortest minimum stay over the next 60 days
const fetchSmoobuRates = async (ids) => {
  const today = new Date().toISOString().slice(0, 10)
  const range = await fetchSmoobuRatesRange(ids, today, addDays(today, 60))
  const out = {}
  for (const id of ids) {
    const days = Object.values(range[id] || {})
    const prices = days.map((d) => Number(d?.price)).filter((n) => n > 0)
    const stays = days.map((d) => Number(d?.min_length_of_stay)).filter((n) => n > 0)
    if (prices.length) out[id] = { price: Math.min(...prices), minNights: stays.length ? Math.min(...stays) : 1 }
  }
  return out
}

// Real bookings and owner blocks ("Blocked channel") for a date range. The daily rates endpoint
// reports "available" even for blocked dates, so every stay is also checked against these.
const fetchSmoobuBookings = async ({ from, to, apartmentId }) => {
  const all = []
  for (let page = 1; page <= 10; page++) {
    const qs = new URLSearchParams({ from, to, showCancellation: 'false', pageSize: '100', page: String(page) })
    if (apartmentId) qs.set('apartmentId', String(apartmentId))
    const res = await fetch(`https://login.smoobu.com/api/reservations?${qs}`, { headers: smoobuHeaders() })
    if (!res.ok) throw new Error(`Smoobu reservations error: ${res.status}`)
    const body = await res.json()
    all.push(...(body.bookings || []))
    if (page >= (Number(body.page_count) || 1)) break
  }
  return all.filter((b) => b.type !== 'cancellation')
}

const overlapsStay = (b, arrivalDate, departureDate) => b.arrival < departureDate && b.departure > arrivalDate

const readFees = async () => JSON.parse(await fs.readFile(feesPath, 'utf-8').catch(() => '{}'))

// Price a stay from Smoobu rates: nightly total + cleaning fee + 16% IVA
const computeQuote = async ({ smoobuApartmentId, arrivalDate, departureDate, bookings }) => {
  const nights = Math.round((new Date(departureDate) - new Date(arrivalDate)) / 86400000)
  if (!(nights >= 1)) return { ok: false, reason: 'dates', message: 'La fecha de salida debe ser posterior a la de llegada.' }
  const id = String(smoobuApartmentId)
  let busy
  try {
    busy = bookings || await fetchSmoobuBookings({ from: arrivalDate, to: departureDate, apartmentId: id })
  } catch (err) {
    console.error('Bookings check failed:', err.message)
    return { ok: false, reason: 'smoobu', message: 'No pudimos confirmar la disponibilidad. Intenta de nuevo.' }
  }
  if (busy.some((b) => overlapsStay(b, arrivalDate, departureDate))) {
    return { ok: false, reason: 'unavailable', message: 'Esas fechas no están disponibles.' }
  }

  const [range, fees] = await Promise.all([
    fetchSmoobuRatesRange([id], arrivalDate, addDays(departureDate, -1)),
    readFees()
  ])
  const days = range[id]
  if (!days) return { ok: false, reason: 'smoobu', message: 'No pudimos consultar Smoobu. Intenta de nuevo.' }

  const nightly = []
  for (let n = 0; n < nights; n++) {
    const day = days[addDays(arrivalDate, n)]
    if (!day || !(Number(day.price) > 0) || day.available === 0 || day.available === false) {
      return { ok: false, reason: 'unavailable', message: 'Esas fechas no están disponibles.' }
    }
    nightly.push(Number(day.price))
  }
  const minNights = Number(days[arrivalDate]?.min_length_of_stay) || 1
  if (nights < minNights) {
    return { ok: false, reason: 'min_stay', minNights, message: `La estancia mínima para esas fechas es de ${minNights} noches.` }
  }
  const lodging = nightly.reduce((a, b) => a + b, 0)
  const cleaning = Number(fees[id]) || 0
  const subtotal = lodging + cleaning
  const iva = Math.round(subtotal * IVA_RATE * 100) / 100
  const total = Math.round((subtotal + iva) * 100) / 100
  return {
    ok: true,
    nights,
    minNights,
    nightlyAvg: Math.round((lodging / nights) * 100) / 100,
    lodging,
    cleaning,
    subtotal,
    ivaRate: IVA_RATE,
    iva,
    total
  }
}

// Smoobu amenity names (English) -> label shown on the site, in display priority order
const AMENITY_LABELS = [
  ['Pool', 'Alberca'],
  ['WiFi', 'WiFi'],
  ['Air conditioning', 'Aire acondicionado'],
  ['Kitchen', 'Cocina equipada'],
  ['Free parking on premises', 'Estacionamiento'],
  ['Fitness Center', 'Gimnasio'],
  ['Balcony', 'Balcón'],
  ['Smart TV', 'Smart TV'],
  ['Washing machine', 'Lavadora'],
  ['Work space', 'Espacio de trabajo'],
  ['Coffee maker', 'Cafetera'],
  ['Beach', 'Cerca de la playa']
]

const equipmentLabels = (amenities) => {
  const names = new Set((Array.isArray(amenities) ? amenities : []).map((e) => (typeof e === 'string' ? e : e?.name || e?.label || '')))
  return AMENITY_LABELS.filter(([en]) => names.has(en)).map(([, es]) => es).slice(0, 8)
}

let liveCache = { at: 0, list: null }
const LIVE_TTL_MS = 10 * 60 * 1000

const buildLiveProperties = async () => {
  if (liveCache.list && Date.now() - liveCache.at < LIVE_TTL_MS) return liveCache.list

  const [apartments, local] = await Promise.all([fetchSmoobuApartments(), readProperties()])
  const photos = JSON.parse(await fs.readFile(photosPath, 'utf-8').catch(() => '{}'))
  const fees = await readFees()
  const wanted = apartments.filter((a) => !isExcluded(a.name || a.title))
  const ids = wanted.map((a) => String(a.id))

  const detailResults = await Promise.allSettled(ids.map((id) => fetchSmoobuDetail(id)))
  const rates = await fetchSmoobuRates(ids)

  const list = []
  wanted.forEach((apt, i) => {
    const id = ids[i]
    const detail = detailResults[i].status === 'fulfilled' ? detailResults[i].value : {}
    const override = local.find((p) => p.smoobuApartmentId === id)
    if (override && override.active === false) return

    const rooms = detail.rooms || {}
    const guests = Number(rooms.maxOccupancy) || 2
    const bedrooms = Number(rooms.bedrooms) || 1
    const bathrooms = Number(rooms.bathrooms) || 1
    const price = rates[id]?.price || Number(detail.price?.minimal) || 0
    const minNights = rates[id]?.minNights || 1
    const images = (apt.images || detail.images || []).map((img) => img.url || img).filter(Boolean)
    const hasCustomImage = override?.image && !override.image.includes('unsplash')
    const curated = photos[id]

    list.push({
      id: `smoobu_${id}`,
      smoobuApartmentId: id,
      name: override?.name && override.name !== 'Nueva propiedad' ? override.name : (apt.name || detail.name || 'Propiedad'),
      location: (detail.location?.city || override?.location || 'Playa del Carmen').toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase()),
      price,
      currency: detail.currency || 'MXN',
      minNights,
      cleaningFee: Number(fees[id]) || 0,
      ivaRate: IVA_RATE,
      rating: override?.rating || 0,
      reviews: override?.reviews || 0,
      guests,
      bedrooms,
      bathrooms,
      image: hasCustomImage ? override.image : (curated?.image || images[0] || override?.image || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&h=900&fit=crop'),
      gallery: override?.gallery?.length ? override.gallery : (curated?.gallery || images.slice(1)),
      amenities: override?.amenities?.length ? override.amenities : equipmentLabels(detail.amenities || detail.equipments),
      summary: override?.summary && !override.summary.startsWith('Propiedad administrable')
        ? override.summary
        : `${bedrooms} recámara${bedrooms === 1 ? '' : 's'}, ${bathrooms} baño${bathrooms === 1 ? '' : 's'}, hasta ${guests} huéspedes.`,
      active: true,
      featured: Boolean(override?.featured)
    })
  })

  // Without a Smoobu rate there is nothing to sell: keep it off the public site
  const sellable = list.filter((p) => p.price > 0)
  liveCache = { at: Date.now(), list: sellable }
  return sellable
}

/**
 * Check availability in Smoobu
 */
const fetchSmoobuAvailability = async ({ arrivalDate, departureDate, guests, apartments = [] }) => {
  const response = await fetch('https://login.smoobu.com/booking/checkApartmentAvailability', {
    method: 'POST',
    headers: smoobuHeaders(),
    body: JSON.stringify({
      arrivalDate,
      departureDate,
      apartments,
      customerId: Number(SMOOBU_CUSTOMER_ID),
      guests: Number(guests || 1)
    })
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload?.detail || 'No fue posible consultar disponibilidad en Smoobu.')
  return payload
}

/**
 * Create a reservation in Smoobu after successful payment
 */
const createSmoobuReservation = async ({ apartmentId, arrivalDate, departureDate, firstName, lastName, email, phone, adults, price, currency, note }) => {
  const body = {
    apartmentId: Number(apartmentId),
    arrivalDate,
    departureDate,
    firstName,
    lastName,
    email,
    phone: phone || '',
    adults: Number(adults || 1),
    channelId: 1, // 1 = direct booking
    price: Number(price),
    currency: currency || 'USD',
    notice: note || 'Reserva realizada en arvacaciones.com'
  }

  const response = await fetch('https://login.smoobu.com/api/reservations', {
    method: 'POST',
    headers: smoobuHeaders(),
    body: JSON.stringify(body)
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data?.detail || JSON.stringify(data))
  return data
}

// ─── CLIP PAYMENTS (MXN) ───────────────────────────────────────────────────────
const clipHeaders = () => ({
  Authorization: `Basic ${Buffer.from(`${CLIP_API_KEY}:${CLIP_SECRET_KEY}`).toString('base64')}`,
  'Content-Type': 'application/json'
})

// USD -> MXN: live rate cached for 6h, env fallback. Clip only charges in MXN.
let fxCache = { at: 0, rate: 0 }
const getUsdMxn = async () => {
  if (fxCache.rate && Date.now() - fxCache.at < 6 * 60 * 60 * 1000) return fxCache.rate
  const margin = Number(process.env.FX_MARGIN || 0) // e.g. 0.02 = +2%
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    const body = await res.json()
    const live = Number(body?.rates?.MXN)
    if (live > 5 && live < 60) {
      fxCache = { at: Date.now(), rate: Math.round(live * (1 + margin) * 10000) / 10000 }
      return fxCache.rate
    }
  } catch (err) {
    console.error('FX error:', err.message)
  }
  const fallback = Number(process.env.USD_MXN_RATE || 0)
  if (fallback > 0) return fallback
  throw new Error('No se pudo obtener el tipo de cambio USD/MXN.')
}

const toMxn = async (amount, currency) => {
  if (String(currency || 'USD').toUpperCase() === 'MXN') return { amountMxn: Math.round(amount * 100) / 100, rate: 1 }
  const rate = await getUsdMxn()
  return { amountMxn: Math.round(amount * rate * 100) / 100, rate }
}

// Pending bookings wait here until Clip confirms the payment (also mirrored to disk, best effort)
const pendingBookings = new Map()
const loadPending = async () => {
  try {
    const raw = JSON.parse(await fs.readFile(pendingPath, 'utf-8'))
    Object.entries(raw).forEach(([k, v]) => pendingBookings.set(k, v))
  } catch { /* first run */ }
}
const savePending = async () => {
  try { await fs.writeFile(pendingPath, JSON.stringify(Object.fromEntries(pendingBookings)), 'utf-8') } catch { /* ephemeral disk */ }
}
loadPending()

// ─── ROUTES ────────────────────────────────────────────────────────────────────

app.get('/api/health', (_, res) => {
  res.json({
    ok: true,
    service: 'AR Vacaciones API',
    smoobu: useMock ? 'mock' : 'live',
    clip: clipEnabled ? 'configured' : 'not configured',
    stripe: stripe ? 'configured' : 'not configured'
  })
})

// Auth
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {}
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Credenciales inválidas.' })
  }
  const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '12h' })
  res.json({ token })
})

// ── Public: list active properties (merged with Smoobu data if available) ──────
app.get('/api/properties', async (_, res) => {
  try {
    const local = await readProperties()
    const active = local.filter((p) => p.active)

    if (useMock) {
      return res.json({ properties: active, source: 'local' })
    }

    try {
      const properties = await buildLiveProperties()
      return res.json({ properties, source: 'smoobu' })
    } catch (smoobuErr) {
      console.error('Smoobu fetch error, falling back to local:', smoobuErr.message)
      const fallback = active.filter((p) => p.smoobuApartmentId && p.price > 0 && !isExcluded(p.name))
      return res.json({ properties: fallback, source: 'local_fallback' })
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Error al cargar propiedades.' })
  }
})

// Admin: all properties
app.get('/api/properties/admin', requireAuth, async (_, res) => {
  const properties = await readProperties()
  res.json({ properties })
})

// Admin: sync Smoobu apartments (import / update from Smoobu)
app.post('/api/smoobu/sync', requireAuth, async (_, res) => {
  if (useMock) return res.json({ ok: true, message: 'Modo demo — no hay Smoobu configurado.', added: 0, updated: 0 })

  try {
    const smoobuApts = await fetchSmoobuApartments()
    const local = await readProperties()

    let added = 0
    let updated = 0

    for (const apt of smoobuApts) {
      if (isExcluded(apt.name || apt.title)) continue
      const smoobuId = String(apt.id)
      const existing = local.find((p) => p.smoobuApartmentId === smoobuId)

      const smoobuImages = (apt.images || []).map((img) => img.url || img).filter(Boolean)

      if (existing) {
        // Update Smoobu-sourced fields only (don't overwrite admin overrides)
        if (!existing.image || existing.image.includes('unsplash')) {
          existing.image = smoobuImages[0] || existing.image
        }
        if (!existing.gallery?.length) {
          existing.gallery = smoobuImages.slice(1)
        }
        updated++
      } else {
        // Create new property from Smoobu
        local.push({
          id: `smoobu_${smoobuId}`,
          smoobuApartmentId: smoobuId,
          name: apt.name || apt.title || 'Propiedad',
          location: apt.location || apt.city || 'Playa del Carmen',
          price: apt.price || apt.defaultPrice || 0,
          rating: 0,
          reviews: 0,
          guests: apt.maxPersons || apt.persons || 1,
          bedrooms: apt.bedrooms || 1,
          bathrooms: apt.bathrooms || 1,
          image: smoobuImages[0] || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&h=900&fit=crop',
          gallery: smoobuImages.slice(1),
          amenities: [],
          summary: apt.description || '',
          active: true,
          featured: false
        })
        added++
      }
    }

    await writeProperties(local)
    res.json({ ok: true, added, updated, total: smoobuApts.length })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: err.message })
  }
})

// Admin: list Smoobu apartments (for mapping in admin panel)
app.get('/api/smoobu/apartments', requireAuth, async (_, res) => {
  if (useMock) {
    return res.json({ apartments: [{ id: '999001', name: 'Demo Apartment (Smoobu Mock)' }] })
  }
  try {
    const apts = await fetchSmoobuApartments()
    res.json({ apartments: apts.filter((a) => !isExcluded(a.name || a.title)).map((a) => ({ id: String(a.id), name: a.name || a.title || String(a.id) })) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// CRUD properties
app.post('/api/properties', requireAuth, async (req, res) => {
  const properties = await readProperties()
  const newProperty = normalizeProperty(req.body)
  properties.unshift(newProperty)
  await writeProperties(properties)
  res.status(201).json({ property: newProperty })
})

app.put('/api/properties/:id', requireAuth, async (req, res) => {
  const properties = await readProperties()
  const index = properties.findIndex((item) => item.id === req.params.id)
  if (index === -1) return res.status(404).json({ message: 'Propiedad no encontrada.' })
  const updated = normalizeProperty(req.body, properties[index].id)
  properties[index] = updated
  await writeProperties(properties)
  res.json({ property: updated })
})

app.delete('/api/properties/:id', requireAuth, async (req, res) => {
  const properties = await readProperties()
  const next = properties.filter((item) => item.id !== req.params.id)
  if (next.length === properties.length) return res.status(404).json({ message: 'Propiedad no encontrada.' })
  await writeProperties(next)
  res.json({ ok: true })
})

// Integration status
app.get('/api/integration/smoobu/status', (_, res) => {
  res.json({
    connected: !useMock,
    mode: useMock ? 'mock' : 'live',
    message: useMock
      ? 'Modo demo. El sitio funciona y la integración queda lista para activar credenciales.'
      : 'Conexión activa con Smoobu.'
  })
})

// Availability search (Smoobu daily rates: availability + minimum stay per season)
app.post('/api/search/availability', async (req, res) => {
  try {
    const { arrivalDate, departureDate, guests } = req.body || {}
    if (!arrivalDate || !departureDate) {
      return res.status(400).json({ message: 'arrivalDate y departureDate son obligatorios.' })
    }

    if (useMock) {
      const properties = (await readProperties()).filter((p) => p.active)
      const availableProperties = properties
        .filter((_, index) => index % 4 !== 3)
        .map((p) => ({ id: p.id, price: p.price + Number(guests || 1) * 10 }))
      return res.json({ source: 'demo', availableProperties })
    }

    const properties = (await buildLiveProperties()).filter((p) => p.guests >= Number(guests || 1))
    let allBookings
    try {
      allBookings = await fetchSmoobuBookings({ from: arrivalDate, to: departureDate })
    } catch (err) {
      console.error('Bookings check failed:', err.message)
      return res.status(502).json({ message: 'No pudimos confirmar la disponibilidad. Intenta de nuevo.' })
    }
    const quotes = await Promise.all(properties.map(async (p) => {
      const mine = allBookings.filter((b) => String(b.apartment?.id) === p.smoobuApartmentId)
      try { return [p, await computeQuote({ smoobuApartmentId: p.smoobuApartmentId, arrivalDate, departureDate, bookings: mine })] } catch { return [p, { ok: false }] }
    }))
    const availableProperties = quotes
      .filter(([, q]) => q.ok)
      .map(([p, q]) => ({
        id: p.id,
        smoobuApartmentId: p.smoobuApartmentId,
        price: q.nightlyAvg,
        currency: p.currency,
        minNights: q.minNights,
        total: q.total
      }))
    res.json({ source: 'smoobu', availableProperties })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: err.message })
  }
})

// Price quote for one stay (nightly rates + cleaning + 16% IVA)
app.post('/api/quote', async (req, res) => {
  try {
    const { smoobuApartmentId, arrivalDate, departureDate } = req.body || {}
    if (!smoobuApartmentId || !arrivalDate || !departureDate) {
      return res.status(400).json({ ok: false, message: 'Faltan datos para cotizar.' })
    }
    const known = (await buildLiveProperties()).find((p) => p.smoobuApartmentId === String(smoobuApartmentId))
    if (!known) return res.status(404).json({ ok: false, message: 'Propiedad no encontrada.' })
    const quote = await computeQuote({ smoobuApartmentId, arrivalDate, departureDate })
    const out = { ...quote, currency: known.currency }
    if (quote.ok && clipEnabled) {
      try {
        const { amountMxn, rate } = await toMxn(quote.total, known.currency)
        out.totalMxn = amountMxn
        out.fxRate = rate
      } catch { /* quote still valid without the MXN preview */ }
    }
    res.json(out)
  } catch (err) {
    console.error(err)
    res.status(500).json({ ok: false, message: 'No pudimos calcular la cotización.' })
  }
})

// Admin: raw Smoobu data for one apartment (rates + bookings) to compare against the Smoobu calendar
app.get('/api/smoobu/debug/:id', requireAuth, async (req, res) => {
  try {
    const id = String(req.params.id)
    const today = new Date().toISOString().slice(0, 10)
    const from = String(req.query.from || today)
    const to = String(req.query.to || addDays(from, 5))
    const [detail, range, resv] = await Promise.all([
      fetchSmoobuDetail(id),
      fetchSmoobuRatesRange([id], from, to),
      fetch(`https://login.smoobu.com/api/reservations?apartmentId=${id}&from=${from}&to=${to}&showCancellation=false&pageSize=100`, { headers: smoobuHeaders() }).then((r) => r.json()).catch((e) => ({ error: e.message }))
    ])
    const bookings = (resv.bookings || []).map((b) => ({ id: b.id, type: b.type, arrival: b.arrival, departure: b.departure, channel: b.channel?.name, apt: b.apartment?.id }))
    res.json({ detailName: detail.name, rates: range[id], bookings, bookingsRaw: resv.error ? resv : undefined })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── Stripe: create checkout session ───────────────────────────────────────────
app.post('/api/bookings/checkout', async (req, res) => {
  try {
    const {
      propertyId,
      smoobuApartmentId,
      arrivalDate,
      departureDate,
      guests,
      firstName,
      lastName,
      email,
      phone,
      totalPrice,
      currency,
      propertyName
    } = req.body || {}

    if (!propertyId || !arrivalDate || !departureDate || !email) {
      return res.status(400).json({ message: 'Faltan campos requeridos para la reserva.' })
    }

    // Never trust the browser's total: re-price the stay from Smoobu rates
    const known = !useMock && smoobuApartmentId
      ? await computeQuote({ smoobuApartmentId, arrivalDate, departureDate })
      : null
    if (known && !known.ok) return res.status(409).json({ message: known.message })
    const chargeTotal = known?.ok ? known.total : totalPrice

    // Clip: redirected checkout in MXN, booking is confirmed by the webhook
    if (clipEnabled) {
      const bookingRef = `ARV-${Date.now().toString(36).toUpperCase()}`
      const currencyCode = (known?.ok ? (await buildLiveProperties()).find((p) => p.smoobuApartmentId === String(smoobuApartmentId))?.currency : null) || currency || 'USD'
      const { amountMxn, rate } = await toMxn(chargeTotal, currencyCode)
      const successParams = new URLSearchParams({ ref: bookingRef, property: propertyName || '', arrival: arrivalDate, departure: departureDate })

      const clipResp = await fetch('https://api.payclip.com/v2/checkout', {
        method: 'POST',
        headers: clipHeaders(),
        body: JSON.stringify({
          amount: amountMxn,
          currency: 'MXN',
          purchase_description: `${propertyName || 'Reserva'} · ${arrivalDate} a ${departureDate}`.slice(0, 250),
          redirection_url: {
            success: `${SITE_URL}/#/booking/success?${successParams.toString()}`,
            error: `${SITE_URL}/#/?pago=error`,
            default: `${SITE_URL}/#/`
          },
          webhook_url: `${API_PUBLIC_URL}/api/clip/webhook`,
          metadata: { me_reference_id: bookingRef }
        })
      })
      const clipData = await clipResp.json().catch(() => ({}))
      if (!clipResp.ok || !clipData.payment_request_url) {
        console.error('[Clip] checkout error:', clipResp.status, JSON.stringify(clipData).slice(0, 400))
        return res.status(502).json({ message: 'No pudimos iniciar el pago con Clip. Intenta de nuevo.' })
      }

      const pending = {
        bookingRef,
        paymentRequestId: clipData.payment_request_id,
        smoobuApartmentId: String(smoobuApartmentId || ''),
        propertyName,
        arrivalDate,
        departureDate,
        guests,
        firstName,
        lastName,
        email,
        phone,
        totalUsd: chargeTotal,
        currency: currencyCode,
        amountMxn,
        fxRate: rate,
        paid: false,
        createdAt: new Date().toISOString()
      }
      pendingBookings.set(bookingRef, pending)
      if (clipData.payment_request_id) pendingBookings.set(String(clipData.payment_request_id), pending)
      await savePending()
      console.log(`[Clip] Pago creado ${bookingRef} — ${propertyName} ${arrivalDate}→${departureDate} $${amountMxn} MXN`)
      return res.json({ url: clipData.payment_request_url, bookingRef, mode: 'clip' })
    }

    // Mock mode: return a fake session URL for testing
    if (!stripe) {
      const mockUrl = `${CLIENT_ORIGIN}/#/booking/success?mock=1&property=${encodeURIComponent(propertyName || propertyId)}&arrival=${arrivalDate}&departure=${departureDate}&email=${encodeURIComponent(email)}`
      return res.json({ url: mockUrl, mode: 'mock' })
    }

    const nights = Math.round((new Date(departureDate) - new Date(arrivalDate)) / (1000 * 60 * 60 * 24))
    const pricePerNight = Math.round((totalPrice || 100) * 100) // cents
    const totalCents = pricePerNight * nights || pricePerNight // if totalPrice is total already

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: (currency || 'usd').toLowerCase(),
            product_data: {
              name: `${propertyName || 'Propiedad'} — ${nights} noche${nights !== 1 ? 's' : ''}`,
              description: `Llegada: ${arrivalDate} | Salida: ${departureDate} | Huéspedes: ${guests || 1}`
            },
            unit_amount: Math.round((chargeTotal || 100) * 100) // total in dollars incl. cleaning and IVA
          },
          quantity: 1
        }
      ],
      success_url: `${CLIENT_ORIGIN}/#/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_ORIGIN}/#/`,
      metadata: {
        propertyId,
        smoobuApartmentId: String(smoobuApartmentId || ''),
        arrivalDate,
        departureDate,
        firstName: firstName || '',
        lastName: lastName || '',
        email,
        phone: phone || '',
        adults: String(guests || 1),
        totalPrice: String(chargeTotal || 0),
        currency: currency || 'USD'
      }
    })

    res.json({ url: session.url, sessionId: session.id })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    res.status(500).json({ message: err.message })
  }
})

// ── Clip: webhook (payment confirmed → create Smoobu reservation) ─────────────
app.post('/api/clip/webhook', async (req, res) => {
  // Always answer fast; Clip retries on non-2xx
  res.json({ received: true })
  try {
    if (!clipEnabled) return
    const body = req.body || {}
    const paymentRequestId = body.payment_request_id || body.resource_id || body.id
    if (!paymentRequestId) return

    // Never trust the body: ask Clip for the real status of this payment request
    const statusResp = await fetch(`https://api.payclip.com/v2/checkout/${paymentRequestId}`, { headers: clipHeaders() })
    const status = await statusResp.json().catch(() => ({}))
    const state = String(status.resource_status || status.status || status.payment_request_status || '').toUpperCase()
    console.log(`[Clip] webhook ${paymentRequestId} -> ${state}`)
    if (!['COMPLETED', 'PAID', 'APPROVED'].includes(state)) return

    const ref = status?.metadata?.me_reference_id || body.me_reference_id
    const pending = pendingBookings.get(String(paymentRequestId)) || (ref ? pendingBookings.get(ref) : null)
    if (!pending) {
      console.error(`[Clip] Pago confirmado sin reserva pendiente: ${paymentRequestId} (${ref || 'sin ref'}). Revisar en Clip y crear manualmente.`)
      return
    }
    if (pending.paid) return
    pending.paid = true
    await savePending()

    if (!useMock && pending.smoobuApartmentId) {
      try {
        const reservation = await createSmoobuReservation({
          apartmentId: pending.smoobuApartmentId,
          arrivalDate: pending.arrivalDate,
          departureDate: pending.departureDate,
          firstName: pending.firstName || 'Guest',
          lastName: pending.lastName || '',
          email: pending.email,
          phone: pending.phone,
          adults: pending.guests,
          price: pending.totalUsd,
          currency: pending.currency,
          note: `Reserva web arvacaciones.site · Pago Clip ${pending.bookingRef} · $${pending.amountMxn} MXN (TC ${pending.fxRate})`
        })
        console.log(`[Clip] Smoobu reservation created: ${reservation.id} (${pending.bookingRef})`)
      } catch (err) {
        console.error(`[Clip] PAGADO pero falló la reserva en Smoobu (${pending.bookingRef}):`, err.message)
      }
    }
  } catch (err) {
    console.error('[Clip] webhook error:', err.message)
  }
})

// ── Stripe: webhook (payment confirmed → create Smoobu reservation) ────────────
app.post('/api/stripe/webhook', async (req, res) => {
  let event

  if (STRIPE_WEBHOOK_SECRET && stripe) {
    const sig = req.headers['stripe-signature']
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      console.error('Webhook signature error:', err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }
  } else {
    // No webhook secret configured — parse body directly (development only)
    try {
      event = JSON.parse(req.body)
    } catch {
      return res.status(400).send('Invalid JSON')
    }
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const meta = session.metadata || {}

    console.log(`[Stripe] Payment confirmed — session ${session.id}`)

    if (!useMock && meta.smoobuApartmentId && meta.arrivalDate) {
      try {
        const reservation = await createSmoobuReservation({
          apartmentId: meta.smoobuApartmentId,
          arrivalDate: meta.arrivalDate,
          departureDate: meta.departureDate,
          firstName: meta.firstName || 'Guest',
          lastName: meta.lastName || '',
          email: meta.email,
          phone: meta.phone,
          adults: meta.adults,
          price: meta.totalPrice,
          currency: meta.currency
        })
        console.log(`[Stripe] Smoobu reservation created: ${reservation.id}`)
      } catch (err) {
        console.error('[Stripe] Failed to create Smoobu reservation:', err.message)
      }
    }
  }

  res.json({ received: true })
})

// Contact
app.post('/api/contact', async (req, res) => {
  try {
    const payload = req.body || {}
    const inquiryDir = path.join(__dirname, 'data')
    const inquiryPath = path.join(inquiryDir, 'inquiries.json')
    let inquiries = []
    try {
      const existing = await fs.readFile(inquiryPath, 'utf-8')
      inquiries = JSON.parse(existing)
    } catch {}
    inquiries.unshift({ id: `inq_${Date.now()}`, createdAt: new Date().toISOString(), ...payload })
    await fs.writeFile(inquiryPath, JSON.stringify(inquiries, null, 2), 'utf-8')
    res.status(201).json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Global error handler
app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ message: error.message || 'Error interno del servidor.' })
})

app.listen(PORT, () => {
  console.log(`AR Vacaciones API corriendo en http://localhost:${PORT}`)
  console.log(`  Smoobu: ${useMock ? 'MODO DEMO' : 'LIVE'}`)
  console.log(`  Stripe: ${stripe ? 'CONFIGURADO' : 'NO CONFIGURADO (modo demo)'}`)
})
