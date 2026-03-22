import React from 'react'
import { motion } from 'framer-motion'
import { Instagram, Facebook, MapPin, Phone, ExternalLink, ShieldCheck } from 'lucide-react'
import { buildWhatsAppLink } from '../lib/config'

function Footer() {
  const currentYear = new Date().getFullYear()

  const quickLinks = [
    { name: 'Inicio', href: '#hero' },
    { name: 'Propiedades', href: '#properties' },
    { name: 'Servicios', href: '#services' },
    { name: 'Contacto', href: '#contact' },
    { name: 'Admin', href: '#/admin' }
  ]

  const legal = [
    { name: 'Términos y Condiciones', href: '#' },
    { name: 'Política de Privacidad', href: '#' },
    { name: 'Política de Cancelación', href: '#' },
    { name: 'Aviso Legal', href: '#' }
  ]

  return (
    <footer className="bg-foreground text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center"><span className="font-display text-2xl font-bold text-white">AR</span></div>
              <div><span className="font-display text-xl font-semibold block">AR Vacaciones</span><span className="text-xs tracking-[0.2em] uppercase text-white/60">Playa del Carmen</span></div>
            </div>
            <p className="text-white/70 leading-relaxed mb-6">Tu socio confiable en experiencias de hospedaje bien presentadas y con operación lista para crecer.</p>
            <div className="flex gap-3">
              {[
                { href: 'https://instagram.com', icon: <Instagram className="w-5 h-5" />, hover: 'hover:bg-primary' },
                { href: 'https://facebook.com', icon: <Facebook className="w-5 h-5" />, hover: 'hover:bg-primary' },
                { href: buildWhatsAppLink('Hola, quiero información de AR Vacaciones'), icon: <Phone className="w-5 h-5" />, hover: 'hover:bg-green-500' },
              ].map((item) => (
                <motion.a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className={`w-10 h-10 bg-white/10 ${item.hover} rounded-lg flex items-center justify-center transition-all`} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  {item.icon}
                </motion.a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-6">Enlaces Rápidos</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}><a href={link.href} className="text-white/70 hover:text-primary transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-primary rounded-full" />{link.name}</a></li>
              ))}
            </ul>
            <div className="mt-8">
              <h5 className="font-medium text-sm text-white/60 mb-3">También en:</h5>
              <div className="flex flex-wrap gap-2">
                {['Airbnb', 'Booking', 'VRBO', 'Sitio Directo'].map((platform) => (
                  <a key={platform} href="#" className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors flex items-center gap-1">
                    {platform}<ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-6">Ubicación</h4>
            <ul className="space-y-3">
              <li><a href="#properties" className="text-white/70 hover:text-primary transition-colors flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />Playa del Carmen</a></li>
              <li><a href="#/admin" className="text-white/70 hover:text-primary transition-colors flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" />Panel administrador</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-6">Contacto</h4>
            <ul className="space-y-4">
              <li><a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 text-white/70 hover:text-white transition-colors"><MapPin className="w-5 h-5 text-primary mt-0.5" /><span>Playa del Carmen<br />Quintana Roo, México</span></a></li>
              <li><a href="tel:+529831304797" className="flex items-center gap-3 text-white/70 hover:text-white transition-colors"><Phone className="w-5 h-5 text-primary" />+52 983 130 4797</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/60 text-sm">© {currentYear} AR Vacaciones. Todos los derechos reservados.</p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {legal.map((item) => <a key={item.name} href={item.href} className="text-white/60 hover:text-white text-sm transition-colors">{item.name}</a>)}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
