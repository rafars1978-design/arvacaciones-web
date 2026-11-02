import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X, Phone } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { buildWhatsAppLink } from '../lib/config'

const navLinks = [
  { name: 'Inicio', id: 'hero' },
  { name: 'Nosotros', id: 'about' },
  { name: 'Propiedades', id: 'properties' },
  { name: 'Servicios', id: 'services' },
  { name: 'Contacto', id: 'contact' }
]

// Slim header: transparent over the hero, compact white bar after scrolling,
// hides while reading downwards and comes back as soon as you scroll up.
function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 40)
      if (y > 200 && y > lastY.current + 6) setHidden(true)
      else if (y < lastY.current - 6 || y <= 200) setHidden(false)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // The site uses a hash router, so plain "#section" links would be read as routes.
  // Scroll to the section ourselves (going back home first when on another page).
  const goTo = (id) => (e) => {
    e.preventDefault()
    setIsOpen(false)
    const scroll = () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(scroll, 150)
    } else {
      scroll()
    }
  }

  // Same behaviour for any "#section" link elsewhere on the page (hero, footer, cards...)
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest?.('a[href^="#"]')
      const href = a?.getAttribute('href') || ''
      if (!/^#[a-z]/i.test(href)) return
      const el = document.getElementById(href.slice(1))
      if (!el) return
      e.preventDefault()
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const solid = scrolled || location.pathname !== '/' || isOpen

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: hidden && !isOpen ? -90 : 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${solid ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-transparent'}`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className={`flex items-center justify-between transition-all duration-300 ${solid ? 'h-14' : 'h-[4.5rem]'}`}>
          <a href="#hero" onClick={goTo('hero')} className="flex items-center gap-2.5">
            <div className={`rounded-lg flex items-center justify-center transition-all duration-300 ${solid ? 'w-9 h-9 bg-primary' : 'w-11 h-11 bg-white/20 backdrop-blur-md'}`}>
              <span className="font-display text-lg font-bold text-white">AR</span>
            </div>
            <div className={`leading-tight ${solid ? 'text-foreground' : 'text-white'}`}>
              <span className="font-display text-lg font-semibold block">AR Vacaciones</span>
              {!solid && <span className="text-[10px] tracking-[0.2em] uppercase opacity-70">Playa del Carmen</span>}
            </div>
          </a>

          <div className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={goTo(link.id)}
                className={`text-sm font-medium transition-colors ${solid ? 'text-foreground hover:text-primary' : 'text-white/90 hover:text-white'}`}
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <a
              href="tel:+529831304797"
              className={`flex items-center gap-1.5 text-sm transition-colors ${solid ? 'text-foreground/70 hover:text-primary' : 'text-white/80 hover:text-white'}`}
            >
              <Phone className="w-4 h-4" /> +52 983 130 4797
            </a>
            <a
              href="#properties"
              onClick={goTo('properties')}
              className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg font-medium text-sm transition-all"
            >
              Reservar
            </a>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Menú"
            className={`lg:hidden p-2 rounded-lg transition-colors ${solid ? 'text-foreground hover:bg-gray-100' : 'text-white hover:bg-white/10'}`}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-border overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={goTo(link.id)}
                  className="block text-foreground hover:text-primary py-2.5 font-medium"
                >
                  {link.name}
                </a>
              ))}
              <a
                href={buildWhatsAppLink('Hola, me interesa reservar una propiedad con AR Vacaciones')}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-foreground hover:text-primary py-2.5 font-medium"
              >
                WhatsApp +52 983 130 4797
              </a>
              <a
                href="#properties"
                onClick={goTo('properties')}
                className="block bg-primary text-white px-6 py-3 rounded-lg text-center font-medium mt-2"
              >
                Reservar
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

export default Navbar
