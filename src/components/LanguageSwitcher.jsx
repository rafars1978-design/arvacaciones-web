import React, { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { LANGUAGES, useI18n } from '../lib/i18n'

// Language menu: Español / English / Français / Deutsch. `solid` follows the navbar background.
function LanguageSwitcher({ solid, align = 'right' }) {
  const { lang, setLang, t } = useI18n()
  const [open, setOpen] = useState(false)
  const box = useRef(null)
  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0]

  useEffect(() => {
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false) }
    const esc = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [])

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('Idioma')}
        aria-expanded={open}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${solid ? 'text-foreground hover:bg-gray-100' : 'text-white hover:bg-white/10'}`}
      >
        <Globe className="w-4 h-4" />
        {current.short}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-40 rounded-xl bg-white shadow-xl border border-border py-1 z-[60]`}>
          {LANGUAGES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                onClick={() => { setLang(l.code); setOpen(false) }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-beige"
              >
                <span>{l.label}</span>
                {l.code === lang && <Check className="w-4 h-4 text-primary" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default LanguageSwitcher
