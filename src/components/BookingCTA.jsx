import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Calendar, MessageCircle, Phone } from 'lucide-react'
import { buildWhatsAppLink } from '../lib/config'

function BookingCTA() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop)' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/95 to-foreground/80" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.span initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="inline-block text-primary font-semibold tracking-wide uppercase text-sm mb-4">
              Reserva tu próxima estancia
            </motion.span>
            <motion.h2 initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }} className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              El frente sigue siendo elegante.<br /><span className="text-primary">El sistema ya no es improvisado.</span>
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }} className="text-white/75 text-lg leading-relaxed mb-10 max-w-2xl">
              Conservamos la estética del proyecto original y por debajo dejamos preparado el flujo para disponibilidad, administración y sincronización con Smoobu.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-col sm:flex-row gap-4">
              <motion.a href="#contact" className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-xl font-semibold transition-all" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Calendar className="w-5 h-5" /> Reservar Ahora
              </motion.a>
              <motion.a href={buildWhatsAppLink('Hola, quiero ayuda para encontrar una propiedad en AR Vacaciones')} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-semibold transition-all" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <MessageCircle className="w-5 h-5" /> WhatsApp
              </motion.a>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, x: 50 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.8, delay: 0.3 }} className="glass rounded-3xl p-8 md:p-10">
            <h3 className="font-display text-2xl font-bold text-white mb-6">Contacto Rápido</h3>
            <div className="space-y-6 mb-8">
              <a href="tel:+529831304797" className="flex items-center gap-4 p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors group">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Phone className="w-6 h-6 text-white" /></div>
                <div><p className="text-white/60 text-sm">Llámanos</p><p className="text-white font-semibold">+52 983 130 4797</p></div>
              </a>
              <a href={buildWhatsAppLink('Hola, me interesa reservar una propiedad con AR Vacaciones')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors group">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><MessageCircle className="w-6 h-6 text-white" /></div>
                <div><p className="text-white/60 text-sm">WhatsApp</p><p className="text-white font-semibold">Respuesta inmediata</p></div>
              </a>
            </div>
            <div className="pt-6 border-t border-white/20">
              <p className="text-white/60 text-sm mb-2">Horario de atención</p>
              <p className="text-white font-medium">24/7 - Siempre disponibles</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default BookingCTA
