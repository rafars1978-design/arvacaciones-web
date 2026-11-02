import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Users, Loader2, CreditCard } from 'lucide-react'
import { api } from '../lib/api'
import { getBroker } from '../lib/broker'
import { useI18n } from '../lib/i18n'

// Quote errors come from the server in Spanish; show them in the visitor's language
const quoteMessage = (q, t) => {
  if (q.reason === 'unavailable') return t('Esas fechas no están disponibles.')
  if (q.reason === 'min_stay') return t('La estancia mínima para esas fechas es de {n} noches.', { n: q.minNights })
  if (q.reason === 'smoobu') return t('No pudimos confirmar la disponibilidad. Intenta de nuevo.')
  if (q.reason === 'dates') return t('La fecha de salida debe ser posterior a la de llegada.')
  return q.message
}

function BookingModal({ property, availability, onClose }) {
  const { t } = useI18n()
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const searched = availability?.search
  const [form, setForm] = useState({
    arrivalDate: searched?.arrivalDate || tomorrow,
    departureDate: searched?.departureDate || new Date(Date.now() + (1 + Math.max(1, property.minNights || 1)) * 86400000).toISOString().split("T")[0],
    guests: Math.min(Number(searched?.guests) || 1, property.guests || 8),
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const availabilityMatch = availability?.availableProperties?.find((a) => a.id === property.id)
  const pricePerNight = availabilityMatch?.price || property.price || 0
  const currency = availabilityMatch?.currency || property.currency || 'USD'

  const nights = Math.max(1, Math.round(
    (new Date(form.departureDate) - new Date(form.arrivalDate)) / (1000 * 60 * 60 * 24)
  ))

  // Live quote from Smoobu: season rates, cleaning fee, 16% IVA, minimum stay
  const [quote, setQuote] = useState(null)
  const [quoting, setQuoting] = useState(false)

  useEffect(() => {
    if (!property.smoobuApartmentId || !form.arrivalDate || !form.departureDate) return undefined
    if (new Date(form.departureDate) <= new Date(form.arrivalDate)) {
      setQuote({ ok: false, message: t('La fecha de salida debe ser posterior a la de llegada.') })
      return undefined
    }
    let cancelled = false
    setQuoting(true)
    const timer = setTimeout(async () => {
      try {
        const q = await api.getQuote({
          smoobuApartmentId: property.smoobuApartmentId,
          arrivalDate: form.arrivalDate,
          departureDate: form.departureDate
        })
        if (!cancelled) setQuote(q)
      } catch (err) {
        if (!cancelled) setQuote({ ok: false, message: err.message })
      } finally {
        if (!cancelled) setQuoting(false)
      }
    }, 400)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [property.smoobuApartmentId, form.arrivalDate, form.departureDate])

  const hasQuote = Boolean(quote?.ok)
  const totalPrice = hasQuote ? quote.total : pricePerNight * nights
  const canPay = !property.smoobuApartmentId || (hasQuote && !quoting)
  const fmt = (n) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.firstName || !form.lastName || !form.email) {
      setError(t('Por favor completa todos los campos obligatorios.'))
      return
    }
    if (new Date(form.departureDate) <= new Date(form.arrivalDate)) {
      setError(t('La fecha de salida debe ser posterior a la de llegada.'))
      return
    }

    setLoading(true)
    try {
      const result = await api.createCheckout({
        propertyId: property.id,
        smoobuApartmentId: property.smoobuApartmentId || availabilityMatch?.smoobuApartmentId || '',
        propertyName: property.name,
        brokerCode: getBroker()?.code || '',
        arrivalDate: form.arrivalDate,
        departureDate: form.departureDate,
        guests: Number(form.guests),
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        totalPrice,
        currency
      })

      if (result.url) {
        window.location.href = result.url
      } else {
        setError(t('No se pudo iniciar el pago. Intenta de nuevo.'))
      }
    } catch (err) {
      setError(err.message || t('Error al procesar la reserva.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with property image */}
          <div className="relative h-40 shrink-0">
            <img
              src={property.image}
              alt={property.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-5 right-12">
              <h2 className="text-white font-display text-xl font-bold leading-tight">{property.name}</h2>
              <p className="text-white/80 text-sm mt-0.5">
                {t('desde')} ${Math.round(pricePerNight)} {currency}{t(' / noche')} {t('+ IVA 16%')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-5">
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground/70 mb-1 uppercase tracking-wide">
                    <Calendar className="w-3 h-3 inline mr-1" />{t('Llegada *')}
                  </label>
                  <input
                    type="date"
                    name="arrivalDate"
                    value={form.arrivalDate}
                    min={today}
                    onChange={handleChange}
                    required
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/70 mb-1 uppercase tracking-wide">
                    <Calendar className="w-3 h-3 inline mr-1" />{t('Salida *')}
                  </label>
                  <input
                    type="date"
                    name="departureDate"
                    value={form.departureDate}
                    min={form.arrivalDate || today}
                    onChange={handleChange}
                    required
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>
              </div>

              {/* Guests */}
              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1 uppercase tracking-wide">
                  <Users className="w-3 h-3 inline mr-1" />{t('Huéspedes *')}
                </label>
                <select
                  name="guests"
                  value={form.guests}
                  onChange={handleChange}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                >
                  {Array.from({ length: property.guests || 8 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? t('huésped') : t('huéspedes')}</option>
                  ))}
                </select>
              </div>

              {/* Guest info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground/70 mb-1 uppercase tracking-wide">{t('Nombre *')}</label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder={t('Juan')}
                    required
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/70 mb-1 uppercase tracking-wide">{t('Apellido *')}</label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder={t('García')}
                    required
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1 uppercase tracking-wide">{t('Email *')}</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={t('correo@ejemplo.com')}
                  required
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1 uppercase tracking-wide">{t('Teléfono (opcional)')}</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+52 983 123 4567"
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>

              {/* Price summary */}
              <div className="rounded-2xl bg-beige p-4 space-y-2">
                {quoting && <p className="text-xs text-muted">{t('Calculando precio…')}</p>}
                {!quoting && quote && !quote.ok && (
                  <p className="text-sm text-red-600">{quoteMessage(quote, t)}</p>
                )}
                {hasQuote && !quoting && (
                  <>
                    <div className="flex justify-between text-sm text-muted">
                      <span>{quote.nights} {quote.nights === 1 ? t('noche') : t('noches')}{quote.discountRate > 0 ? '' : ` (${t('prom.')} $${fmt(quote.nightlyAvg)}${t(' / noche')})`}</span>
                      <span>${fmt(quote.lodgingGross ?? quote.lodging)}</span>
                    </div>
                    {quote.discountRate > 0 && (
                      <div className="flex justify-between text-sm text-primary font-medium">
                        <span>{quote.discountRate >= 0.2 ? t('Descuento por estancia de 1 mes (20%)') : t('Descuento por estancia de 1 semana (10%)')}</span>
                        <span>-${fmt(quote.discountAmount)}</span>
                      </div>
                    )}
                    {quote.cleaning > 0 && (
                      <div className="flex justify-between text-sm text-muted">
                        <span>{t('Limpieza')}</span>
                        <span>${fmt(quote.cleaning)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-muted">
                      <span>{t('IVA {n}%', { n: Math.round(quote.ivaRate * 100) })}</span>
                      <span>${fmt(quote.iva)}</span>
                    </div>
                    {quote.minNights > 1 && (
                      <p className="text-xs text-muted">{t('Estancia mínima en estas fechas: {n} noches.', { n: quote.minNights })}</p>
                    )}
                  </>
                )}
                {!property.smoobuApartmentId && (
                  <div className="flex justify-between text-sm text-muted">
                    <span>${pricePerNight} × {nights} noche{nights !== 1 ? 's' : ''}</span>
                    <span>${totalPrice.toFixed(0)} {currency}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-foreground border-t border-border pt-2 mt-2">
                  <span>{t('Total')} {hasQuote ? t('(IVA incluido)') : ''}</span>
                  <span>{hasQuote || !property.smoobuApartmentId ? `$${fmt(totalPrice)} ${currency}` : '—'}</span>
                </div>
                {hasQuote && quote.totalMxn > 0 && (
                  <p className="text-xs text-muted text-right">
                    {t('Se cobra en pesos: ≈ ${amt} MXN (tipo de cambio {rate})', { amt: fmt(quote.totalMxn), rate: fmt(quote.fxRate) })}
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !canPay}
                className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> {t('Procesando…')}</>
                ) : (
                  <><CreditCard className="w-5 h-5" /> {t('Continuar al pago')}</>
                )}
              </button>

              <p className="text-center text-xs text-muted">
                {t('Pago seguro con Clip · Tarjeta de crédito o débito')}
              </p>
              {getBroker() && (
                <p className="text-center text-xs text-primary font-medium">{t('Reserva realizada a través de {name}', { name: getBroker().name })}</p>
              )}
              <p className="text-center text-xs text-muted">
                <strong>{t('Tarifa no reembolsable.')}</strong> {t('Al continuar aceptas los')}{' '}
                <a href="#/terminos" target="_blank" rel="noopener noreferrer" className="underline">{t('Términos')}</a> {t('y la')}{' '}
                <a href="#/cancelacion" target="_blank" rel="noopener noreferrer" className="underline">{t('Política de Cancelación')}</a>.
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default BookingModal
