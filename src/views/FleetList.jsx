import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header.jsx';
import { DATA } from '../lib/data.js';
import { OPEN, issues, fmtDate } from '../lib/model.js';
import { tripsForBus, liveRuns } from '../lib/fleet.js';
import { useStore } from '../lib/useStore.js';

export default function FleetList() {
  useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(null);
  const perBus = DATA.buses.map(b => {
    const li = issues.filter(i => i.bus === b);
    return { b, total: li.length, open: li.filter(i => OPEN.has(i.status)).length, trips: tripsForBus(b) };
  }).sort((a, b) => b.total - a.total);

  return (
    <>
      <Header crumb={[{ t: 'Mumbai', to: '/' }, { t: t('fleetList.fleet') }]} title={t('fleetList.title')}
        sub={liveRuns().length
          ? t('fleetList.subLive')
          : t('fleetList.subLogged')} />
      <div className="content">
        <div className="card">
          <div className="ch"><h3>{t('fleetList.fleetContribution')}</h3><span className="r">{t('fleetList.contributionHint', { count: DATA.buses.length })}</span></div>
          <div className="tablewrap">
            <table>
              <thead><tr><th></th><th>{t('fleetList.bus')}</th><th>{t('fleetList.detections')}</th><th>{t('fleetList.open')}</th><th>{t('fleetList.trips')}</th></tr></thead>
              {perBus.map(x => (
                <tbody key={x.b}>
                  <tr className="clk" onClick={() => setExpanded(e => e === x.b ? null : x.b)}>
                    <td className="chev">{expanded === x.b ? '▾' : '▸'}</td><td><b>{x.b}</b></td><td>{x.total}</td><td>{x.open}</td><td>{x.trips.length}</td>
                  </tr>
                  {expanded === x.b && (
                    <tr>
                      <td colSpan={5} style={{ padding: '10px 0', background: '#f0f1f4' }}>
                        {x.trips.length ? (
                          <div className="tablewrap">
                            <table>
                              <thead><tr><th>{t('fleetList.date')}</th><th>{t('fleetList.ward')}</th><th>{t('fleetList.detections')}</th><th>{t('fleetList.stops')}</th></tr></thead>
                              <tbody>
                                {x.trips.map(t => (
                                  <tr className="clk" key={t.id} onClick={e => { e.stopPropagation(); navigate(`/fleet/${x.b}/${t.id}`); }}>
                                    <td><b>{fmtDate(t.date)}</b></td><td>{t.wards.join(', ')}</td><td>{t.detections}</td><td>{t.stops.length}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : <div className="hint" style={{ padding: '12px 16px' }}>{t('fleetList.noLoggedTrips')}</div>}
                      </td>
                    </tr>
                  )}
                </tbody>
              ))}
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
