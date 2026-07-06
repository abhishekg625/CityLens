import { useTranslation } from 'react-i18next';
import { OPEN } from '../lib/model.js';

export default function KpiStrip({ list }) {
  const { t } = useTranslation();
  const open = list.filter(i => OPEN.has(i.status));
  const conf = list.filter(i => i.status === 'confirmed').length;
  const sev45 = open.filter(i => i.severity >= 4).length;
  const fixed = list.filter(i => i.status === 'verified_fixed').length;
  const mttrN = list.filter(i => i.status === 'verified_fixed' || i.status === 'resolved');
  let mt = 0, mn = 0;
  mttrN.forEach(i => { const d = (new Date(i.last_seen) - new Date(i.first_seen)) / 864e5; if (d > 0) { mt += d; mn++; } });
  const mttr = mn ? (mt / mn).toFixed(1) : '—';
  return (
    <div className="kpis">
      <div className="kpi"><div className="k">{t('kpiStrip.openIssues')}</div><div className="v">{open.length}</div><div className="d">{t('kpiStrip.confirmedPending', { confirmed: conf, pending: open.length - conf })}</div></div>
      <div className="kpi"><div className="k">{t('kpiStrip.highSeverity')}</div><div className="v" style={{ color: 'var(--pothole)' }}>{sev45}</div><div className="d down">{t('kpiStrip.needsPriority')}</div></div>
      <div className="kpi"><div className="k">{t('kpiStrip.verifiedFixed')}</div><div className="v" style={{ color: 'var(--good)' }}>{fixed}</div><div className="d up">{t('kpiStrip.recheckedLater')}</div></div>
      <div className="kpi"><div className="k">{t('kpiStrip.avgResolution')}</div><div className="v">{mttr}<span style={{ fontSize: 15, color: 'var(--faint)' }}> d</span></div><div className="d">{t('kpiStrip.firstSeenToCleared')}</div></div>
    </div>
  );
}
