import { useTranslation } from 'react-i18next';
import { TYPE, SEVC, fmtDT, daysOpen, resolutionDays, crewById, contractorName, issues, setIssueStatus, setIssueCrew } from '../lib/model.js';
import { tripBusesFor } from '../lib/fleet.js';
import { useSession } from '../context/SessionContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { useStore } from '../lib/useStore.js';
import Evidence from './Evidence.jsx';

function CrewPerformanceNote({ i }) {
  const { t } = useTranslation();
  if (i.type === 'waterlogging') return null;
  if (i.status === 'resolved' || i.status === 'verified_fixed') {
    const days = resolutionDays(i);
    if (days <= 3) {
      return (
        <div className="hint" style={{ background: 'var(--good-bg)', color: 'var(--good)', borderRadius: 10, padding: '10px 14px', margin: '14px 0', fontWeight: 700 }}>
          {t('issueDrawer.fastTurnaround', { time: days <= 0 ? t('issueDrawer.underADay') : days + 'd', contractor: contractorName(i) })}
        </div>
      );
    }
    return null;
  }
  if ((i.status === 'confirmed' || i.status === 'reported' || i.status === 'candidate') && daysOpen(i) > 7) {
    return (
      <div className="hint" style={{ background: 'var(--bad-bg)', color: 'var(--pothole)', borderRadius: 10, padding: '10px 14px', margin: '14px 0', fontWeight: 700 }}>
        {t('issueDrawer.openMiss', { days: daysOpen(i), contractor: contractorName(i) })}
      </div>
    );
  }
  return null;
}

function DrawerActions({ i, opts }) {
  const { t } = useTranslation();
  const { session } = useSession();
  const { closeDrawer, openModal } = useUI();
  if (i.type === 'waterlogging') {
    return <div className="hint" style={{ padding: 4 }}>{t('issueDrawer.waterloggingNote')}</div>;
  }
  const canEdit = session && (session.role === 'admin' || session.role === 'ward_officer');
  if (!canEdit) return <div className="hint" style={{ padding: 4 }}>{t('issueDrawer.readOnly')}</div>;
  if (i.status === 'verified_fixed') return <div style={{ color: 'var(--good)', fontWeight: 700, padding: 4 }}>{t('issueDrawer.verifiedFixedNote')}</div>;
  if (i.status === 'resolved') {
    return (
      <>
        <button className="btn good" onClick={() => setIssueStatus(i, 'verified_fixed')}>{t('common.confirmFixed')}</button>
        <button className="btn" onClick={() => setIssueStatus(i, 'confirmed')}>{t('common.reopen')}</button>
      </>
    );
  }
  return (
    <>
      <button className="btn primary" onClick={() => setIssueStatus(i, 'resolved')}>{t('common.markResolved')}</button>
      {opts.hideAssign
        ? (i.crew && (
          <button className="btn danger" onClick={() => {
            const cid = i.crew;
            setIssueCrew(i, null);
            closeDrawer();
            openModal('crew', { crewId: cid });
          }}>{t('common.unassign')}</button>
        ))
        : (
          <button className={`btn ${i.crew ? 'good' : ''}`} onClick={() => openModal('assignCrew', { issueId: i.id })}>
            {i.crew ? t('common.assigned') : t('crewModal.assignCrew')}
          </button>
        )}
    </>
  );
}

export default function IssueDrawer() {
  useStore();
  const { t } = useTranslation();
  const { drawer, closeDrawer } = useUI();
  const isOpen = !!drawer;
  const i = drawer ? issues.find(x => x.id === drawer.issueId) : null;

  if (!i) {
    return (
      <>
        <div className={`scrim ${isOpen ? 'on' : ''}`} onClick={closeDrawer} />
        <div className="drawer" />
      </>
    );
  }
  const hist = (i.history && i.history.length) ? i.history : [{ t: i.first_seen, bus: i.bus, detected: true }, { t: i.last_seen, bus: i.bus, detected: i.status !== 'verified_fixed' }];
  const buses = tripBusesFor(i);
  return (
    <>
      <div className={`scrim ${isOpen ? 'on' : ''}`} onClick={closeDrawer} />
      <div className={`drawer ${isOpen ? 'on' : ''}`}>
        <div className="dh">
          <span className="tdot" style={{ background: TYPE[i.type].c, width: 14, height: 14 }} />
          <div>
            <b style={{ fontSize: 15 }}>{t(`issueTypes.${i.type}`)}</b>
            <div style={{ fontSize: 12, color: 'var(--faint)' }}>{i.id} · {t('common.wardLabel', { ward: i.ward })}</div>
          </div>
          <button className="x" onClick={closeDrawer}>×</button>
        </div>
        <div className="db">
          <div className="evidence"><Evidence issue={i} /></div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <span className="sev" style={{ background: SEVC[i.severity], padding: '4px 9px' }}>{t('issueDrawer.severity', { severity: i.severity })}</span>
            <span className={`badge ${i.status}`} style={{ padding: '4px 11px' }}>{i.status.replace('_', ' ')}</span>
            <span className="badge" style={{ background: 'var(--chip)', color: 'var(--muted)', padding: '4px 11px' }}>{t('issueDrawer.confidence', { pct: Math.round(i.confidence * 100) })}</span>
          </div>
          <dl className="dl">
            <dt>{t('issueDrawer.location')}</dt><dd>{i.street}, {t('common.wardLabel', { ward: i.ward })}</dd>
            <dt>{t('issueDrawer.gps')}</dt><dd>{i.lat.toFixed(5)}, {i.lon.toFixed(5)}</dd>
            <dt>{buses.length > 1 ? t('issueDrawer.routeBuses') : t('issueDrawer.routeBus')}</dt><dd>{i.route} · {buses.length > 1 ? buses.join(', ') : i.bus}</dd>
            <dt>{t('issueDrawer.firstSeen')}</dt><dd>{fmtDT(i.first_seen)}</dd>
            <dt>{t('issueDrawer.independentPasses')}</dt>
            <dd>{i.passes}{buses.length > 1 ? ` · ${buses.length} trips (${buses.map(b => b.replace(/^.*-/, '')).join(', ')})` : ''} {i.passes >= 3 ? `✓ ${t('issueDrawer.confirmed')}` : (i.passes === 2 ? `· ${t('issueDrawer.reported')}` : `· ${t('issueDrawer.awaitingGate')}`)}</dd>
            {i.type !== 'waterlogging' && (<><dt>{t('issueDrawer.assignedCrew')}</dt><dd>{i.crew ? crewById(i.crew).name + ' · ' + i.crew : t('issueDrawer.unassignedBacklog')}</dd></>)}
          </dl>
          <CrewPerformanceNote i={i} />
          <div className="section-t" style={{ marginTop: 4 }}>{t('issueDrawer.passHistory')}</div>
          <ul className="tl">
            {hist.map((h, idx) => (
              <li key={idx} className={h.detected ? '' : 'miss'}>
                <b>{h.detected ? t('issueDrawer.detected') : t('issueDrawer.notDetected')}</b>
                <span className="w"> · {fmtDT(h.t)} · {h.bus}</span>
              </li>
            ))}
          </ul>
          <div className="hint" style={{ padding: '8px 0' }}>{t('issueDrawer.severityHint')}</div>
        </div>
        <div className="df">
          <DrawerActions i={i} opts={drawer.opts || {}} />
        </div>
      </div>
    </>
  );
}
