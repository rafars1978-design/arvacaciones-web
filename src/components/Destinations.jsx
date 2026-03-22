import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { MapPin, ArrowRight } from 'lucide-react'

function Destinations() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const destinations = [
    {
      name: 'Playa del Carmen',
      country: 'México',
      properties: 18,
      image: 'https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=800&h=1000&fit=crop',
      description: 'El corazón de la Riviera Maya'
    },
    {
      name: 'Tulum',
      country: 'México',
      properties: 15,
      image: 'https://images.unsplash.com/photo-1548283465-d0db8a21e9ba?w=800&h=1000&fit=crop',
      description: 'Donde el lujo encuentra la naturaleza'
    },
    {
      name: 'Puerto Morelos',
      country: 'México',
      properties: 8,
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=1000&fit=crop',
      description: 'Joya oculta del Caribe'
    },
    {
      name: 'Punta Cana',
      country: 'República Dominicana',
      properties: 12,
      image: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&h=1000&fit=crop',
      description: 'Paraíso caribeño por excelencia'
    }
  ]

  return (
    <section id="destinations" ref={ref} className="py-24 md:py-32 bg-foreground relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-block text-primary font-semibold tracking-wide uppercase text-sm mb-4"
          >
            Destinos Exclusivos
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
          >
            Elige tu <span className="text-primary">Paraíso</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/60 text-lg max-w-2xl mx-auto"
          >
            Descubre nuestras propiedades en los destinos más codiciados del Caribe,
            cada uno con su encanto único y servicios excepcionales.
          </motion.p>
        </div>

        {/* Destinations Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {destinations.map((destination, index) => (
            <motion.div
              key={destination.name}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              className="group relative rounded-2xl overflow-hidden h-[450px] cursor-pointer"
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${destination.image})` }}
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              {/* Content */}
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
                  <MapPin className="w-4 h-4" />
                  {destination.country}
                </div>

                <h3 className="font-display text-2xl font-bold text-white mb-2">
                  {destination.name}
                </h3>

                <p className="text-white/70 text-sm mb-4">
                  {destination.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">
                    {destination.properties} propiedades
                  </span>

                  <motion.div
                    className="flex items-center gap-2 text-primary font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    whileHover={{ x: 5 }}
                  >
                    Explorar <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </div>

                {/* Hover Border Effect */}
                <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/50 rounded-2xl transition-all duration-500" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-12"
        >
          <motion.a
            href="#properties"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-xl font-semibold transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Ver Todas las Propiedades
            <ArrowRight className="w-5 h-5" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}

export default Destinations
