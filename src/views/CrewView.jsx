import Header from '../components/Header.jsx';
import { TYPE, crewLoad, removeCrew } from '../lib/model.js';
import { CREW, CREW_CAPACITY } from '../lib/data.js';
import { useSession } from '../context/SessionContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { useStore } from '../lib/useStore.js';
import { useTranslation } from 'react-i18next';

export default function CrewView() {
  useStore();
  const { t } = useTranslation();
  const { session } = useSession();
  const { openModal } = useUI();
  const rows = crewLoad().sort((a, b) => b.open - a.open);
  const canManage = session && (session.role === 'admin' || session.role === 'ward_officer');

  return (
    <>
      <Header crumb={[{ t: 'Mumbai', to: '/' }, { t: t('crewView.crewInfo') }]} title={t('crewView.crewInfo')}
        sub={t('crewView.sub')} />
      <div className="content">
        <div className="card">
          <div className="ch">
            <h3>{t('crewView.crewRoster')}</h3><span className="r">{t('crewView.rosterHint', { count: CREW.length })}</span>
            {canManage && <button className="btn primary sm" onClick={() => openModal('addCrew')}>{t('crewView.addCrewMember')}</button>}
          </div>
          <div className="tablewrap">
            <table>
              <thead><tr><th></th><th>{t('crewView.crewId')}</th><th>{t('crewView.name')}</th><th>{t('crewView.specialism')}</th><th>{t('crewView.ward')}</th><th>{t('crewView.assigned')}</th><th>{t('crewView.completed')}</th><th></th></tr></thead>
              <tbody>
                {rows.map((cm, i) => (
                  <tr className="clk" key={cm.id} onClick={() => openModal('crew', { crewId: cm.id })}>
                    <td className="rank">{i + 1}</td>
                    <td><b>{cm.id}</b></td><td>{cm.name}</td>
                    <td><span className="tdot" style={{ background: TYPE[cm.type].c, display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} />{t(`issueTypes.${cm.type}`)}</td>
                    <td>{cm.ward ? t('common.wardLabel', { ward: cm.ward }) : '—'}</td>
                    <td>
                      <span className="scorepill" style={{ background: cm.open >= CREW_CAPACITY ? '#d32f2f' : cm.open ? '#e56a00' : '#2e7d32' }}>{cm.open}/{CREW_CAPACITY}</span>
                      {cm.open >= CREW_CAPACITY && <span className="badge confirmed" style={{ marginLeft: 6 }}>{t('crewView.full')}</span>}
                    </td>
                    <td>{cm.total - cm.open}</td>
                    <td>
                      {canManage && (
                        <button className="btn sm danger" onClick={e => {
                          e.stopPropagation();
                          if (confirm(t('crewView.removeConfirm', { name: cm.name, id: cm.id, type: t(`issueTypes.${cm.type}`).toLowerCase() }))) {
                            removeCrew(cm.id);
                          }
                        }}>{t('common.remove')}</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
