import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Users, Loader2, CreditCard } from 'lucide-react'
import { api } from '../lib/api'

function BookingModal({ property, availability, onClose }) {
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const [form, setForm] = useState({
    arrivalDate: tomorrow,
    departureDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    guests: 1,
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const availabilityMatch = availability?.availableProperties?.find((a) => a.id === property.id)
  const pricePerNight = availabilityMatch?.price || property.price || 0
  const currency = availabilityMatch?.currency || 'USD'

  const nights = Math.max(1, Math.round(
    (new Date(form.departureDate) - new Date(form.arrivalDate)) / (1000 * 60 * 60 * 24)
  ))
  const totalPrice = pricePerNight * nights

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.firstName || !form.lastName || !form.email) {
      setError('Por favor completa todos los campos obligatorios.')
      return
    }
    if (new Date(form.departureDate) <= new Date(form.arrivalDate)) {
      setError('La fecha de salida debe ser posterior a la de llegada.')
      return
    }

    setLoading(true)
    try {
      const result = await api.createCheckout({
        propertyId: property.id,
        smoobuApartmentId: property.smoobuApartmentId || availabilityMatch?.smoobuApartmentId || '',
        propertyName: property.name,
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
        setError('No se pudo iniciar el pago. Intenta de nuevo.')
      }
    } catch (err) {
      setError(err.message || 'Error al procesar la reserva.')
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
                ${pricePerNight} {currency} / noche
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
                    <Calendar className="w-3 h-3 inline mr-1" />Llegada *
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
                    <Calendar className="w-3 h-3 inline mr-1" />Salida *
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
                  <Users className="w-3 h-3 inline mr-1" />Huéspedes *
                </label>
                <select
                  name="guests"
                  value={form.guests}
                  onChange={handleChange}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                >
                  {Array.from({ length: property.guests || 8 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n} huésped{n !== 1 ? 'es' : ''}</option>
                  ))}
                </select>
              </div>

              {/* Guest info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground/70 mb-1 uppercase tracking-wide">Nombre *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="Juan"
                    required
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/70 mb-1 uppercase tracking-wide">Apellido *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="García"
                    required
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1 uppercase tracking-wide">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                  required
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1 uppercase tracking-wide">Teléfono (opcional)</label>
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
                <div className="flex justify-between text-sm text-muted">
                  <span>${pricePerNight} × {nights} noche{nights !== 1 ? 's' : ''}</span>
                  <span>${totalPrice.toFixed(0)} {currency}</span>
                </div>
                <div className="flex justify-between font-bold text-foreground border-t border-border pt-2 mt-2">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(0)} {currency}</span>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Procesando…</>
                ) : (
                  <><CreditCard className="w-5 h-5" /> Continuar al pago</>
                )}
              </button>

              <p className="text-center text-xs text-muted">
                Pago seguro con Stripe · Tu tarjeta se carga al confirmar
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default BookingModal
