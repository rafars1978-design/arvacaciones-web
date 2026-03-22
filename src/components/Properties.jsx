import React, { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { MapPin, Users, Bed, Bath, Star, Heart, ChevronLeft, ChevronRight, WifiOff } from 'lucide-react'
import { api } from '../lib/api'
import { buildWhatsAppLink } from '../lib/config'
import BookingModal from './BookingModal'

function Properties() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [favorites, setFavorites] = useState([])
  const [properties, setProperties] = useState([])
  const [availability, setAvailability] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookingProperty, setBookingProperty] = useState(null)

  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true)
        const response = await api.getProperties()
        setProperties(response.properties || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadProperties()

    const handleResults = (event) => {
      setAvailability(event.detail)
    }

    window.addEventListener('arv:availability-results', handleResults)
    return () => window.removeEventListener('arv:availability-results', handleResults)
  }, [])

  const toggleFavorite = (id) => {
    setFavorites((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])
  }

  const visibleProperties = availability?.availableProperties?.length
    ? properties.filter((property) => availability.availableProperties.some((item) => item.id === property.id))
    : properties

  return (
    <section id="properties" ref={ref} className="py-24 md:py-32 bg-beige">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="inline-block text-primary font-semibold tracking-wide uppercase text-sm mb-4"
            >
              Nuestra Colección
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-4xl md:text-5xl font-bold text-foreground"
            >
              Propiedades en <span className="text-primary">Playa del Carmen</span>
            </motion.h2>

            <p className="text-muted mt-4 max-w-2xl">
              Elige tu alojamiento ideal. Consulta disponibilidad y reserva directamente con pago seguro.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex gap-3"
          >
            <button className="w-12 h-12 rounded-xl border-2 border-foreground/20 hover:border-primary hover:text-primary flex items-center justify-center transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 rounded-xl border-2 border-foreground/20 hover:border-primary hover:text-primary flex items-center justify-center transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>

        {availability && (
          <div className="rounded-2xl border border-border bg-white p-4 md:p-5 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="font-semibold text-foreground">Resultado de búsqueda</p>
              <p className="text-sm text-muted">
                Fuente: {availability.source === 'smoobu' ? 'Smoobu' : 'demo'} · {availability.availableProperties?.length || 0} opciones disponibles.
              </p>
            </div>
            <button onClick={() => setAvailability(null)} className="self-start md:self-auto text-sm font-medium text-primary hover:underline">
              Limpiar filtro
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-red-50 text-red-600 px-4 py-3 mb-8 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-2xl overflow-hidden bg-white shadow-sm">
                <div className="h-64 bg-beige animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-beige rounded animate-pulse" />
                  <div className="h-8 bg-beige rounded animate-pulse" />
                  <div className="h-20 bg-beige rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : visibleProperties.length === 0 ? (
          <div className="rounded-3xl border border-border bg-white p-10 text-center">
            <WifiOff className="w-8 h-8 text-primary mx-auto mb-4" />
            <h3 className="font-display text-3xl font-bold text-foreground mb-3">No hay propiedades para esas fechas</h3>
            <p className="text-muted">Prueba con otras fechas o escríbenos por WhatsApp y te ayudamos manualmente.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleProperties.map((property, index) => {
              const availabilityMatch = availability?.availableProperties?.find((item) => item.id === property.id)
              const displayPrice = availabilityMatch?.price || property.price

              return (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.1 + index * 0.08 }}
                  className="bg-surface rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 group"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={property.image}
                      alt={property.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&h=900&fit=crop'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <button
                      onClick={() => toggleFavorite(property.id)}
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all shadow-lg"
                    >
                      <Heart className={`w-5 h-5 transition-colors ${favorites.includes(property.id) ? 'fill-red-500 text-red-500' : 'text-foreground/60'}`} />
                    </button>

                    {property.featured && (
                      <div className="absolute top-4 left-4 bg-foreground/75 text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
                        Destacada
                      </div>
                    )}

                    {displayPrice > 0 && (
                      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl">
                        <span className="text-2xl font-bold text-foreground">${displayPrice}</span>
                        <span className="text-muted text-sm"> / noche</span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3 gap-3">
                      {property.rating > 0 && (
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="font-semibold">{property.rating}</span>
                          {property.reviews > 0 && <span className="text-muted">({property.reviews})</span>}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-muted text-sm min-w-0 ml-auto">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="truncate">{property.location}</span>
                      </div>
                    </div>

                    <h3 className="font-display text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {property.name}
                    </h3>
                    <p className="text-muted text-sm leading-relaxed mb-4 line-clamp-2">{property.summary}</p>

                    {(property.amenities || []).length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(property.amenities || []).slice(0, 3).map((amenity) => (
                          <span key={amenity} className="px-3 py-1 bg-beige rounded-full text-xs font-medium text-muted">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-1 text-muted text-sm"><Users className="w-4 h-4" /> {property.guests}</div>
                      <div className="flex items-center gap-1 text-muted text-sm"><Bed className="w-4 h-4" /> {property.bedrooms}</div>
                      <div className="flex items-center gap-1 text-muted text-sm"><Bath className="w-4 h-4" /> {property.bathrooms}</div>
                      <motion.button
                        onClick={() => setBookingProperty(property)}
                        className="ml-auto bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Reservar
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12"
        >
          <motion.a
            href="#contact"
            className="inline-flex border-2 border-foreground hover:bg-foreground hover:text-white text-foreground px-8 py-4 rounded-xl font-semibold transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Solicitar más opciones
          </motion.a>
        </motion.div>
      </div>

      {/* Booking Modal */}
      {bookingProperty && (
        <BookingModal
          property={bookingProperty}
          availability={availability}
          onClose={() => setBookingProperty(null)}
        />
      )}
    </section>
  )
}

export default Properties
