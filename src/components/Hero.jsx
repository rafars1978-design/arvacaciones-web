import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Calendar, Users, Loader2 } from 'lucide-react'
import { api } from '../lib/api'

function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [search, setSearch] = useState({ arrivalDate: '', departureDate: '', guests: 1 })
  const [feedback, setFeedback] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)

  const slides = useMemo(() => ([
    {
      image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1920&h=1080&fit=crop',
      title: 'Vive el Lujo',
      subtitle: 'Frente al Mar'
    },
    {
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1920&h=1080&fit=crop',
      title: 'Experiencias',
      subtitle: 'Inolvidables'
    },
    {
      image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1920&h=1080&fit=crop',
      title: 'Tu Hogar',
      subtitle: 'En el Caribe'
    }
  ]), [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [slides.length])

  const handleSearch = async () => {
    if (!search.arrivalDate || !search.departureDate) {
      setFeedback({ type: 'error', text: 'Selecciona fechas de llegada y salida.' })
      return
    }

    try {
      setLoading(true)
      setFeedback({ type: '', text: '' })
      const result = await api.searchAvailability(search)
      const availableCount = result.availableProperties?.length || 0
      
      setFeedback({
        type: 'success',
        text: availableCount > 0
          ? `${availableCount} opciones disponibles para esas fechas. Mira las propiedades abajo.`
          : 'No encontramos disponibilidad para esas fechas. Prueba con otras fechas o escríbenos por WhatsApp.'
      })

      window.dispatchEvent(new CustomEvent('arv:availability-results', { detail: { ...result, search: { ...search } } }))
      document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' })
    } catch (error) {
      setFeedback({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="hero" className="relative min-h-screen overflow-hidden">
      {slides.map((slide, index) => (
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{
            opacity: currentSlide === index ? 1 : 0,
            scale: currentSlide === index ? 1 : 1.1
          }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        >
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${slide.image})` }} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        </motion.div>
      ))}

      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4 md:px-8 pt-28 pb-8">
          <div className="text-center max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-white text-sm font-medium">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Playa del Carmen · Tulum · Mahahual
              </span>
            </motion.div>

            <motion.h1
              key={currentSlide}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-display text-5xl md:text-7xl lg:text-8xl text-white font-bold mb-6 leading-tight"
            >
              {slides[currentSlide].title}
              <span className="block text-primary">{slides[currentSlide].subtitle}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-10"
            >
              Departamentos y estudios vacacionales en Playa del Carmen, Tulum y Mahahual.
              Reserva directo, con disponibilidad y precios en tiempo real.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.a
                href="#properties"
                className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-2xl hover:shadow-primary/30 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Reservar Ahora
              </motion.a>
              <motion.a
                href="#properties"
                className="w-full sm:w-auto glass hover:bg-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="w-5 h-5" />
                Ver Propiedades
              </motion.a>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-5 py-2 text-sm text-white"
            >
              <span className="w-2 h-2 bg-primary rounded-full" />
              Precio más bajo garantizado reservando en nuestra página
            </motion.p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="px-4 md:px-8 pb-10"
        >
          <div className="max-w-4xl mx-auto glass-dark rounded-2xl p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-white/60 text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Llegada
                </label>
                <input
                  type="date"
                  value={search.arrivalDate}
                  onChange={(e) => setSearch({ ...search, arrivalDate: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-white/60 text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Salida
                </label>
                <input
                  type="date"
                  value={search.departureDate}
                  onChange={(e) => setSearch({ ...search, departureDate: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-white/60 text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" /> Huéspedes
                </label>
                <div className="flex gap-2">
                  <select
                    value={search.guests}
                    onChange={(e) => setSearch({ ...search, guests: Number(e.target.value) })}
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n} className="text-foreground">{n}</option>
                    ))}
                  </select>
                  <motion.button
                    onClick={handleSearch}
                    disabled={loading}
                    className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-70 flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Buscar
                  </motion.button>
                </div>
              </div>
            </div>

            {feedback.text && (
              <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${feedback.type === 'error' ? 'bg-red-500/15 text-red-100 border border-red-400/30' : 'bg-emerald-500/15 text-emerald-50 border border-emerald-400/30'}`}>
                {feedback.text}
              </div>
            )}
          </div>
        </motion.div>


      </div>
    </section>
  )
}

export default Hero
