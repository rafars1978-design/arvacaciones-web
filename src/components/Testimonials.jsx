import React, { useRef, useState, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react'

function Testimonials() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [current, setCurrent] = useState(0)

  const testimonials = [
    {
      name: 'Sarah Mitchell',
      location: 'New York, USA',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
      rating: 5,
      text: 'Absolutely stunning property! The villa exceeded all our expectations. The concierge service was impeccable, and the location was perfect. We\'ll definitely be back!',
      property: 'Villa Oceanfront Paradise'
    },
    {
      name: 'Carlos Rodríguez',
      location: 'Madrid, España',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      rating: 5,
      text: 'Una experiencia inolvidable. El penthouse en Tulum fue perfecto para nuestra luna de miel. Atención al detalle increíble y vistas espectaculares.',
      property: 'Penthouse Tulum Beach'
    },
    {
      name: 'Emma Thompson',
      location: 'London, UK',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
      rating: 5,
      text: 'The most luxurious vacation rental we\'ve ever experienced. Everything was perfect from booking to checkout. The private beach access was incredible.',
      property: 'Casa del Mar Premium'
    },
    {
      name: 'James Wilson',
      location: 'Toronto, Canada',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
      rating: 5,
      text: 'World-class service and amenities. The property manager was incredibly responsive. The pool and rooftop views were breathtaking. Highly recommend!',
      property: 'Luxury Suite Caribbean'
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const next = () => setCurrent((prev) => (prev + 1) % testimonials.length)
  const prev = () => setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length)

  return (
    <section ref={ref} className="py-24 md:py-32 bg-beige overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-block text-primary font-semibold tracking-wide uppercase text-sm mb-4"
          >
            Testimonios
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6"
          >
            Lo que Dicen <span className="text-primary">Nuestros Huéspedes</span>
          </motion.h2>
        </div>

        {/* Testimonial Carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Quote Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="absolute -top-6 left-1/2 -translate-x-1/2 z-10"
          >
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-xl">
              <Quote className="w-8 h-8 text-white" />
            </div>
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-surface rounded-3xl p-8 md:p-12 pt-16 shadow-xl"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                {/* Stars */}
                <div className="flex justify-center gap-1 mb-6">
                  {[...Array(testimonials[current].rating)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Text */}
                <p className="text-xl md:text-2xl text-foreground leading-relaxed mb-8 font-light italic">
                  "{testimonials[current].text}"
                </p>

                {/* Author */}
                <div className="flex items-center justify-center gap-4">
                  <img
                    src={testimonials[current].avatar}
                    alt={testimonials[current].name}
                    className="w-16 h-16 rounded-full object-cover border-4 border-primary/20"
                  />
                  <div className="text-left">
                    <h4 className="font-semibold text-foreground text-lg">
                      {testimonials[current].name}
                    </h4>
                    <p className="text-muted text-sm">
                      {testimonials[current].location}
                    </p>
                    <p className="text-primary text-sm font-medium">
                      {testimonials[current].property}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-10">
              <button
                onClick={prev}
                className="w-12 h-12 rounded-full border-2 border-foreground/20 hover:border-primary hover:bg-primary hover:text-white flex items-center justify-center transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Dots */}
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrent(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${current === index
                        ? 'w-8 bg-primary'
                        : 'w-2 bg-foreground/20 hover:bg-foreground/40'
                      }`}
                  />
                ))}
              </div>

              <button
                onClick={next}
                className="w-12 h-12 rounded-full border-2 border-foreground/20 hover:border-primary hover:bg-primary hover:text-white flex items-center justify-center transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Additional Reviews */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 grid md:grid-cols-3 gap-6"
        >
          {[
            { platform: 'Airbnb', rating: '4.97', reviews: '234' },
            { platform: 'Google', rating: '4.9', reviews: '189' },
            { platform: 'Booking', rating: '9.4', reviews: '156' }
          ].map((item) => (
            <div key={item.platform} className="bg-surface rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
              <h4 className="font-semibold text-foreground mb-2">{item.platform}</h4>
              <div className="flex items-center justify-center gap-2">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="text-2xl font-bold text-foreground">{item.rating}</span>
              </div>
              <p className="text-muted text-sm mt-1">{item.reviews} reseñas</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default Testimonials
