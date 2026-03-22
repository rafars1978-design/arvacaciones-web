import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Phone, ShieldCheck } from 'lucide-react'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Inicio', href: '#hero' },
    { name: 'Nosotros', href: '#about' },
    { name: 'Propiedades', href: '#properties' },
    { name: 'Servicios', href: '#services' },
    { name: 'Contacto', href: '#contact' }
  ]

  return (
    <>
      <div className="hidden md:block bg-foreground text-white py-2">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center text-sm">
          <div className="flex items-center gap-6">
            <a href="tel:+529831304797" className="flex items-center gap-2 hover:text-primary transition-colors">
              <Phone className="w-4 h-4" /> +52 983 130 4797
            </a>
          </div>
          <div className="flex items-center gap-5">
            <a href="#/admin" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <ShieldCheck className="w-4 h-4" /> Admin
            </a>
            <div className="flex items-center gap-4">
              <span className="text-white/60">EN</span>
              <span className="text-white font-medium">ES</span>
            </div>
          </div>
        </div>
      </div>

      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 md:top-10 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-xl shadow-xl' : 'bg-transparent'}`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-20">
            <motion.a href="#hero" className="flex items-center gap-3" whileHover={{ scale: 1.02 }}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${scrolled ? 'bg-primary' : 'bg-white/20 backdrop-blur-md'}`}>
                <span className="font-display text-2xl font-bold text-white">AR</span>
              </div>
              <div className={scrolled ? 'text-foreground' : 'text-white'}>
                <span className="font-display text-xl font-semibold block leading-tight">AR Vacaciones</span>
                <span className="text-xs tracking-[0.2em] uppercase opacity-70">Playa del Carmen</span>
              </div>
            </motion.a>

            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-medium tracking-wide transition-colors relative group ${scrolled ? 'text-foreground hover:text-primary' : 'text-white/90 hover:text-white'}`}
                  whileHover={{ y: -2 }}
                >
                  {link.name}
                  <span className={`absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300 ${scrolled ? 'bg-primary' : 'bg-white'}`} />
                </motion.a>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <motion.a
                href="#/admin"
                className={`px-4 py-3 rounded-xl font-medium text-sm transition-all border ${scrolled ? 'border-border text-foreground hover:border-primary' : 'border-white/20 text-white hover:bg-white/10'}`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
              >
                Admin
              </motion.a>
              <motion.a
                href="#contact"
                className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-medium text-sm transition-all shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Reservar Ahora
              </motion.a>
            </div>

            <button onClick={() => setIsOpen(!isOpen)} className={`lg:hidden p-3 rounded-xl transition-colors ${scrolled ? 'text-foreground hover:bg-gray-100' : 'text-white hover:bg-white/10'}`}>
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="lg:hidden bg-white border-t border-border">
              <div className="px-4 py-6 space-y-4">
                {navLinks.map((link, index) => (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    onClick={() => setIsOpen(false)}
                    className="block text-foreground hover:text-primary py-2 font-medium"
                  >
                    {link.name}
                  </motion.a>
                ))}
                <a href="#/admin" onClick={() => setIsOpen(false)} className="block text-foreground hover:text-primary py-2 font-medium">Admin</a>
                <motion.a href="#contact" className="block bg-primary text-white px-6 py-3 rounded-xl text-center font-medium" whileTap={{ scale: 0.95 }}>
                  Reservar Ahora
                </motion.a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  )
}

export default Navbar
