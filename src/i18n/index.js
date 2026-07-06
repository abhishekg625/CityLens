import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';

// Adding a language later is just another locales/<code>.json + one more entry here.
const resources = {
  en: { translation: en },
};

i18next.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('citylens-lang') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
];

export function setLanguage(code) {
  localStorage.setItem('citylens-lang', code);
  i18next.changeLanguage(code);
}

export default i18next;
