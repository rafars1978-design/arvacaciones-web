import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import en from '../i18n/en'
import fr from '../i18n/fr'
import de from '../i18n/de'

// The site text is written in Spanish. Every other language is a dictionary keyed by the Spanish
// sentence, so a missing translation simply shows the Spanish text instead of breaking the page.
const DICTIONARIES = { en, fr, de }

export const LANGUAGES = [
  { code: 'es', label: 'Español', short: 'ES' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'de', label: 'Deutsch', short: 'DE' }
]

const KEY = 'arv_lang'
const isLang = (code) => LANGUAGES.some((l) => l.code === code)

export const getLang = () => {
  try {
    const saved = localStorage.getItem(KEY)
    return isLang(saved) ? saved : 'es'
  } catch {
    return 'es'
  }
}

const I18nContext = createContext({ lang: 'es', setLang: () => {}, t: (s) => s })

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(getLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((code) => {
    if (!isLang(code)) return
    setLangState(code)
    try { localStorage.setItem(KEY, code) } catch { /* storage blocked */ }
  }, [])

  const t = useCallback((text, params) => {
    let out = lang === 'es' ? text : (DICTIONARIES[lang]?.[text] ?? text)
    if (params) {
      Object.entries(params).forEach(([k, v]) => { out = out.split(`{${k}}`).join(String(v)) })
    }
    return out
  }, [lang])

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = () => useContext(I18nContext)
