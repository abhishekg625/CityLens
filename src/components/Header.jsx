import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cityScore, scoreColor } from '../lib/model.js';
import { useSession } from '../context/SessionContext.jsx';
import { useLayout } from '../context/LayoutContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { useStore } from '../lib/useStore.js';

export default function Header({ crumb, title, sub }) {
  useStore();
  const { t } = useTranslation();
  const { session, logout } = useSession();
  const { toggleSidebar } = useLayout();
  const { openSettings } = useUI();
  const cs = cityScore();
  return (
    <div className="header">
      <button className="menubtn" aria-label="Toggle menu" onClick={toggleSidebar}>☰</button>
      <div className="headertext">
        <div className="crumb">
          {crumb.map((p, idx) => (
            <span key={idx} style={{ display: 'contents' }}>
              {idx > 0 && <span className="sep">/</span>}
              {p.to ? <Link to={p.to}>{p.t}</Link> : <span>{p.t}</span>}
            </span>
          ))}
        </div>
        <div className="h-title" dangerouslySetInnerHTML={{ __html: title }} />
        <div className="h-sub">{sub}</div>
      </div>
      <div className="header-actions">
        <div className="live"><span className="dot" /> {t('header.live')}</div>
        <div className="scorechip">{t('header.cityHealth')} <span className="v" style={{ background: scoreColor(cs) }}>{cs}</span></div>
        {session && (
          <div className="userchip">
            <button className="rolebadge-btn" onClick={openSettings} aria-label={t('settings.title')} style={{ display: 'flex', alignItems: 'center', gap: 9, border: 'none', background: 'none', cursor: 'pointer', font: 'inherit', color: 'inherit', padding: 0 }}>
              <span className={`rolebadge role-${session.role}`}>{session.role.replace('_', ' ')}</span>
              <b>{session.username}</b>
              <span aria-hidden="true">⚙</span>
            </button>
            <button className="btn sm" onClick={logout}>{t('header.logOut')}</button>
          </div>
        )}
      </div>
    </div>
  );
}
