import Header from '../components/Header.jsx';
import QItem from '../components/QItem.jsx';
import { TYPE, OPEN, issues, priority, crewById } from '../lib/model.js';
import { CREW_CAPACITY } from '../lib/data.js';
import { useSession } from '../context/SessionContext.jsx';
import { useStore } from '../lib/useStore.js';
import { useTranslation } from 'react-i18next';

export default function MyWorkView() {
  useStore();
  const { t } = useTranslation();
  const { session } = useSession();
  const cm = session && crewById(session.crewId);

  if (!cm) {
    return (
      <>
        <Header crumb={[{ t: t('myWorkView.myWork') }]} title={t('myWorkView.myWork')} sub={t('myWorkView.noCrewRecord')} />
        <div className="content"><div className="card cb"><div className="hint" style={{ padding: 4 }}>{t('myWorkView.noCrewRecordHint')}</div></div></div>
      </>
    );
  }
  const mine = issues.filter(i => i.crew === cm.id);
  const open = mine.filter(i => OPEN.has(i.status)).sort((a, b) => priority(b) - priority(a));
  const done = mine.filter(i => !OPEN.has(i.status));
  const wardStr = cm.ward ? ' · ' + t('common.wardLabel', { ward: cm.ward }) : '';

  return (
    <>
      <Header crumb={[{ t: t('myWorkView.myWork') }]} title={t('myWorkView.myWork')}
        sub={t('myWorkView.sub', { name: cm.name, type: t(`issueTypes.${cm.type}`), ward: wardStr })} />
      <div className="content">
        <div className="card">
          <div className="ch"><h3>{cm.name}</h3><span className="r">{t('myWorkView.specialistSummary', { id: cm.id, type: t(`issueTypes.${cm.type}`), ward: wardStr })}</span></div>
          <div className="section-t" style={{ margin: '14px 16px 6px' }}>
            {t('myWorkView.assignedToYou', { open: open.length, capacity: CREW_CAPACITY })}
            {open.length >= CREW_CAPACITY && <span className="badge confirmed" style={{ textTransform: 'none', letterSpacing: 0 }}> {t('myWorkView.worklistFull')}</span>}
          </div>
          <div>{!open.length ? <div className="hint">{t('myWorkView.noIssueAssigned')}</div> : open.map(i => <QItem key={i.id} issue={i} opts={{ hideAssign: true }} />)}</div>
          {!!done.length && (
            <>
              <div className="section-t" style={{ margin: '18px 16px 6px' }}>{t('myWorkView.completed', { count: done.length })}</div>
              <div>{done.map(i => <QItem key={i.id} issue={i} opts={{ hideAssign: true }} />)}</div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
