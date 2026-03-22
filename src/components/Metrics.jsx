import React, { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { Users, Home, MapPin, TrendingUp } from 'lucide-react'

function AnimatedCounter({ end, duration = 2, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      let startTime
      const step = (timestamp) => {
        if (!startTime) startTime = timestamp
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
        setCount(Math.floor(progress * end))
        if (progress < 1) {
          requestAnimationFrame(step)
        }
      }
      requestAnimationFrame(step)
    }
  }, [isInView, end, duration])

  return <span ref={ref}>{count}{suffix}</span>
}

function Metrics() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const metrics = [
    {
      icon: Users,
      value: 500,
      suffix: '+',
      label: 'Huéspedes Felices',
      description: 'Viajeros satisfechos de todo el mundo'
    },
    {
      icon: Home,
      value: 50,
      suffix: '+',
      label: 'Propiedades Premium',
      description: 'Curadas para experiencias únicas'
    },
    {
      icon: MapPin,
      value: 5,
      suffix: '+',
      label: 'Destinos Exclusivos',
      description: 'En el Caribe y más allá'
    },
    {
      icon: TrendingUp,
      value: 98,
      suffix: '%',
      label: 'Ocupación Promedio',
      description: 'Propiedades altamente demandadas'
    }
  ]

  return (
    <section ref={ref} className="py-24 md:py-32 relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop)'
          }}
        />
        <div className="absolute inset-0 bg-foreground/90" />
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
            Nuestros Logros
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Números que <span className="text-primary">Hablan</span>
          </motion.h2>
        </div>

        {/* Metrics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              className="text-center group"
            >
              {/* Icon */}
              <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                <metric.icon className="w-10 h-10 text-primary group-hover:text-white transition-colors" />
              </div>

              {/* Number */}
              <div className="font-display text-5xl md:text-6xl font-bold text-white mb-2">
                <AnimatedCounter end={metric.value} suffix={metric.suffix} />
              </div>

              {/* Label */}
              <h3 className="text-white font-semibold text-lg mb-2">
                {metric.label}
              </h3>

              {/* Description */}
              <p className="text-white/60 text-sm">
                {metric.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-20 pt-12 border-t border-white/10"
        >
          <div className="flex flex-wrap justify-center items-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">4.9★</div>
              <p className="text-white/60 text-sm">Google Reviews</p>
            </div>
            <div className="w-px h-12 bg-white/20 hidden md:block" />
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">Superhost</div>
              <p className="text-white/60 text-sm">Airbnb Status</p>
            </div>
            <div className="w-px h-12 bg-white/20 hidden md:block" />
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">Premier</div>
              <p className="text-white/60 text-sm">Booking.com Partner</p>
            </div>
            <div className="w-px h-12 bg-white/20 hidden md:block" />
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">Elite</div>
              <p className="text-white/60 text-sm">VRBO Recognition</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Metrics
