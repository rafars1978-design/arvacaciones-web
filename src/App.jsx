import React from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Properties from './components/Properties'
import Services from './components/Services'
import Metrics from './components/Metrics'
import Testimonials from './components/Testimonials'
import BookingCTA from './components/BookingCTA'
import ContactForm from './components/ContactForm'
import Footer from './components/Footer'
import AdminPage from './pages/AdminPage'
import BookingSuccessPage from './pages/BookingSuccessPage'
import { MessageCircle } from 'lucide-react'
import { buildWhatsAppLink } from './lib/config'

function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <Properties />
      <Services />
      <Metrics />
      <Testimonials />
      <BookingCTA />
      <ContactForm />
    </>
  )
}

function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/booking/success" element={<BookingSuccessPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />

      <a
        href={buildWhatsAppLink('Hola, me interesa reservar una propiedad con AR Vacaciones')}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 group"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-foreground text-white text-sm px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          ¿Necesitas ayuda?
        </span>
      </a>
    </div>
  )
}

function App() {
  return (
    <HashRouter>
      <Layout />
    </HashRouter>
  )
}

export default App
