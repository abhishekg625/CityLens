import { useTranslation } from 'react-i18next';
import { useUI } from '../context/UIContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { SUPPORTED_LANGUAGES, setLanguage } from '../i18n/index.js';

export default function SettingsDrawer() {
  const { t, i18n } = useTranslation();
  const { settingsOpen, closeSettings } = useUI();
  const { theme, setTheme } = useTheme();

  return (
    <>
      <div className={`scrim ${settingsOpen ? 'on' : ''}`} onClick={closeSettings} />
      <div className={`drawer ${settingsOpen ? 'on' : ''}`}>
        <div className="dh">
          <b style={{ fontSize: 15 }}>{t('settings.title')}</b>
          <button className="x" onClick={closeSettings}>×</button>
        </div>
        <div className="db">
          <div className="field">
            <label>{t('settings.appearance')}</label>
            <select value={theme} onChange={e => setTheme(e.target.value)}>
              <option value="light">{t('settings.theme.light')}</option>
              <option value="dark">{t('settings.theme.dark')}</option>
            </select>
          </div>
          <div className="field">
            <label>{t('settings.language')}</label>
            <select value={i18n.language} onChange={e => setLanguage(e.target.value)}>
              {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
        </div>
      </div>
    </>
  );
}
