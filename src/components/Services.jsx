import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Sparkles, Key, Phone, Waves, Sun, Wifi, Shield, Utensils } from 'lucide-react'

function Services() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const services = [
    {
      icon: Sparkles,
      title: 'Limpieza Premium',
      description: 'Servicio de limpieza profesional con productos de alta gama y atención al detalle'
    },
    {
      icon: Key,
      title: 'Check-in Automático',
      description: 'Acceso sin contacto las 24 horas con cerraduras inteligentes y códigos personalizados'
    },
    {
      icon: Phone,
      title: 'Concierge 24/7',
      description: 'Asistencia personal para reservaciones, tours y cualquier necesidad durante tu estancia'
    },
    {
      icon: Waves,
      title: 'Alberca Privada',
      description: 'Propiedades con piscinas exclusivas y acceso a clubes de playa premium'
    },
    {
      icon: Sun,
      title: 'Rooftop & Terraza',
      description: 'Espacios al aire libre con vistas espectaculares y áreas de descanso'
    },
    {
      icon: Wifi,
      title: 'WiFi Premium',
      description: 'Conexión de alta velocidad ideal para trabajo remoto y streaming'
    },
    {
      icon: Shield,
      title: 'Seguridad Total',
      description: 'Vigilancia 24/7, acceso controlado y seguros de protección incluidos'
    },
    {
      icon: Utensils,
      title: 'Chef Privado',
      description: 'Servicio opcional de chef personal con menús personalizados'
    }
  ]

  return (
    <section id="services" ref={ref} className="py-24 md:py-32 bg-surface relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-5">
          <div className="w-full h-full bg-gradient-to-l from-primary to-transparent" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-block text-primary font-semibold tracking-wide uppercase text-sm mb-4"
          >
            Experiencia Premium
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
          >
            Servicios de <span className="text-primary">Clase Mundial</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted text-lg"
          >
            Cada detalle está cuidadosamente diseñado para ofrecerte una experiencia
            de hospedaje excepcional, combinando comodidad, lujo y tranquilidad.
          </motion.p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.05 }}
              className="group relative bg-white rounded-2xl p-8 border border-border hover:border-primary/30 hover:shadow-xl transition-all duration-500"
            >
              {/* Icon */}
              <div className="w-16 h-16 bg-beige rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                <service.icon className="w-8 h-8 text-primary group-hover:text-white transition-colors" />
              </div>

              {/* Content */}
              <h3 className="font-semibold text-xl text-foreground mb-3 group-hover:text-primary transition-colors">
                {service.title}
              </h3>
              <p className="text-muted leading-relaxed">
                {service.description}
              </p>

              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 bg-foreground rounded-3xl p-8 md:p-12 text-center"
        >
          <h3 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">
            ¿Necesitas algo especial?
          </h3>
          <p className="text-white/70 mb-8 max-w-2xl mx-auto">
            Nuestro equipo de concierge está disponible para organizar cualquier servicio adicional:
            transporte privado, excursiones, spa en suite, celebraciones especiales y más.
          </p>
          <motion.a
            href="#contact"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-xl font-semibold transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Contactar Concierge
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}

export default Services
