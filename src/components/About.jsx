import React from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Award, Globe, Shield, Heart } from 'lucide-react'

function About() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const features = [
    {
      icon: Award,
      title: 'Excelencia',
      description: 'Propiedades seleccionadas rigurosamente para garantizar calidad excepcional'
    },
    {
      icon: Globe,
      title: 'Internacional',
      description: 'Presencia global con clientes de más de 50 países diferentes'
    },
    {
      icon: Shield,
      title: 'Confianza',
      description: 'Transacciones seguras y servicio transparente en todo momento'
    },
    {
      icon: Heart,
      title: 'Experiencia',
      description: 'Cada estancia diseñada para crear recuerdos inolvidables'
    }
  ]

  return (
    <section id="about" ref={ref} className="py-24 md:py-32 bg-surface relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="inline-block text-primary font-semibold tracking-wide uppercase text-sm mb-4"
            >
              Quiénes Somos
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight"
            >
              Tu Socio en
              <span className="text-gradient"> Experiencias de Lujo</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-muted text-lg leading-relaxed mb-8"
            >
              Somos una empresa líder en gestión de propiedades vacacionales de alto nivel en Playa del Carmen. Con años de experiencia y un compromiso inquebrantable con la excelencia, transformamos cada estancia en una experiencia memorable.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-muted text-lg leading-relaxed mb-10"
            >
              Nuestro equipo de profesionales se dedica a ofrecer un servicio personalizado que supera las expectativas, desde la reserva hasta el checkout, asegurando que cada momento de tu viaje sea perfecto.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.a
                href="#properties"
                className="bg-foreground hover:bg-foreground/90 text-white px-8 py-4 rounded-xl font-semibold transition-all text-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Explorar Propiedades
              </motion.a>
              <motion.a
                href="#contact"
                className="border-2 border-foreground hover:bg-foreground hover:text-white text-foreground px-8 py-4 rounded-xl font-semibold transition-all text-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Contactar
              </motion.a>
            </motion.div>
          </div>

          {/* Right - Features Grid */}
          <div className="grid grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                className="bg-beige rounded-2xl p-6 hover:shadow-xl transition-all duration-500 group"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">{feature.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Partners/Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-20 pt-12 border-t border-border"
        >
          <p className="text-center text-muted mb-8">Integraciones y Alianzas</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
            {['Airbnb', 'Booking.com', 'VRBO', 'Expedia', 'TripAdvisor'].map((partner) => (
              <span key={partner} className="text-xl font-semibold text-foreground/50">{partner}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default About
