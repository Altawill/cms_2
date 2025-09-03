import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enTranslations from './en.json'
import arTranslations from './ar.json'

const resources = {
  en: {
    translation: enTranslations,
  },
  ar: {
    translation: arTranslations,
  },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })

// Update document direction and language
i18n.on('languageChanged', (lng) => {
  const isRTL = lng === 'ar'
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
  document.documentElement.lang = lng
  localStorage.setItem('language', lng)
})

// Set initial direction
const currentLang = i18n.language
const isRTL = currentLang === 'ar'
document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
document.documentElement.lang = currentLang

export default i18n
