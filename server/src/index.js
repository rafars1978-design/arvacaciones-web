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

// Lowest nightly rate over the next 60 days, per apartment id
const fetchSmoobuRates = async (ids) => {
  const start = new Date()
  const end = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
  const out = {}
  for (let i = 0; i < ids.length; i += 10) {
    const chunk = ids.slice(i, i + 10)
    const qs = chunk.map((id) => `apartments[]=${id}`).join('&')
    try {
      const res = await fetch(`https://login.smoobu.com/api/rates?${qs}&start_date=${isoDay(start)}&end_date=${isoDay(end)}`, { headers: smoobuHeaders() })
      if (!res.ok) continue
      const body = await res.json()
      for (const id of chunk) {
        const days = Object.values(body?.data?.[id] || {}).map((d) => Number(d?.price)).filter((n) => n > 0)
        if (days.length) out[id] = Math.min(...days)
      }
    } catch (err) {
      console.error('Smoobu rates error:', err.message)
    }
  }
  return out
}

const equipmentLabels = (equipments) => (Array.isArray(equipments) ? equipments : [])
  .map((e) => (typeof e === 'string' ? e : e?.name || e?.label || ''))
  .filter(Boolean)
  .slice(0, 6)

let liveCache = { at: 0, list: null }
const LIVE_TTL_MS = 10 * 60 * 1000

const buildLiveProperties = async () => {
  if (liveCache.list && Date.now() - liveCache.at < LIVE_TTL_MS) return liveCache.list

  const [apartments, local] = await Promise.all([fetchSmoobuApartments(), readProperties()])
  const photos = JSON.parse(await fs.readFile(photosPath, 'utf-8').catch(() => '{}'))
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
    const price = rates[id] || Number(detail.price?.minimal) || 0
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
      rating: override?.rating || 0,
      reviews: override?.reviews || 0,
      guests,
      bedrooms,
      bathrooms,
      image: hasCustomImage ? override.image : (curated?.image || images[0] || override?.image || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&h=900&fit=crop'),
      gallery: override?.gallery?.length ? override.gallery : (curated?.gallery || images.slice(1)),
      amenities: override?.amenities?.length ? override.amenities : equipmentLabels(detail.equipments),
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

// ─── ROUTES ────────────────────────────────────────────────────────────────────

app.get('/api/health', (_, res) => {
  res.json({
    ok: true,
    service: 'AR Vacaciones API',
    smoobu: useMock ? 'mock' : 'live',
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

// Availability search
app.post('/api/search/availability', async (req, res) => {
  try {
    const { arrivalDate, departureDate, guests } = req.body || {}
    if (!arrivalDate || !departureDate) {
      return res.status(400).json({ message: 'arrivalDate y departureDate son obligatorios.' })
    }

    const properties = useMock
      ? (await readProperties()).filter((p) => p.active)
      : await buildLiveProperties()

    if (useMock) {
      const availableProperties = properties
        .filter((_, index) => index % 4 !== 3)
        .map((p) => ({ id: p.id, price: p.price + Number(guests || 1) * 10 }))
      return res.json({ source: 'demo', availableProperties })
    }

    const mapped = properties.filter((p) => p.smoobuApartmentId)
    if (!mapped.length) return res.json({ source: 'smoobu', availableProperties: [] })

    const availability = await fetchSmoobuAvailability({
      arrivalDate,
      departureDate,
      guests,
      apartments: mapped.map((p) => Number(p.smoobuApartmentId))
    })

    const availableProperties = mapped
      .filter((p) => availability.availableApartments?.includes(Number(p.smoobuApartmentId)))
      .map((p) => ({
        id: p.id,
        smoobuApartmentId: p.smoobuApartmentId,
        price: availability.prices?.[p.smoobuApartmentId]?.price || p.price,
        currency: availability.prices?.[p.smoobuApartmentId]?.currency || 'USD'
      }))

    res.json({ source: 'smoobu', availableProperties })
  } catch (err) {
    console.error(err)
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
            unit_amount: Math.round((totalPrice || 100) * 100) // totalPrice is the total in dollars
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
        totalPrice: String(totalPrice || 0),
        currency: currency || 'USD'
      }
    })

    res.json({ url: session.url, sessionId: session.id })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    res.status(500).json({ message: err.message })
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
