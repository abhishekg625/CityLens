import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Header from '../components/Header.jsx';
import QItem from '../components/QItem.jsx';
import LeafletMap from '../components/LeafletMap.jsx';
import { TYPE, OPEN, SEVW, issues, priority, fmtDate, wardsFC } from '../lib/model.js';
import { DATA } from '../lib/data.js';
import { tileLayer, plot } from '../lib/maps.js';
import { tripsForStreet } from '../lib/fleet.js';
import { wardPath } from '../lib/routes.js';
import { useUI } from '../context/UIContext.jsx';
import { useStore } from '../lib/useStore.js';

export default function StreetView() {
  const { t } = useTranslation();
  useStore();
  const { streetId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { openIssue } = useUI();
  const scopedWard = searchParams.get('ward');

  const allStreets = scopedWard ? DATA.streets.filter(s => s.wardId === scopedWard) : DATA.streets;
  const streets = allStreets.map(s => {
    const li = issues.filter(i => i.streetId === s.id);
    const open = li.filter(i => OPEN.has(i.status));
    return { ...s, total: li.length, open: open.length, load: open.reduce((a, i) => a + SEVW[i.severity], 0) };
  }).sort((a, b) => b.load - a.load);
  const sel = streets.find(s => s.id === streetId) || streets[0];
  const list = sel ? issues.filter(i => i.streetId === sel.id) : [];
  const trips = sel ? tripsForStreet(sel.id) : [];

  const crumb = scopedWard
    ? [{ t: 'Mumbai', to: '/' }, { t: t('common.wardLabel', { ward: scopedWard }), to: wardPath(scopedWard) }, { t: t('streetView.streets') }]
    : [{ t: 'Mumbai', to: '/' }, { t: t('streetView.streets') }];

  const gotoStreet = id => navigate(`/streets/${id}${scopedWard ? `?ward=${scopedWard}` : ''}`);

  if (!sel) {
    return (
      <>
        <Header crumb={crumb} title={t('streetView.streetsAndCorridors')} sub={t('streetView.noCorridorsFound')} />
        <div className="content"><div className="card cb"><div className="hint">{t('streetView.noCorridorsInScope')}</div></div></div>
      </>
    );
  }

  return (
    <>
      <Header
        crumb={crumb}
        title={t('streetView.streetsAndCorridors')}
        sub={scopedWard
          ? t('streetView.subScoped', { count: allStreets.length, ward: scopedWard })
          : t('streetView.subAll', { count: allStreets.length, wards: wardsFC.features.length })}
      />
      <div className="content">
        <div className="row map-side">
          <div className="card">
            <div className="ch"><h3>{sel.name} <span style={{ fontWeight: 600, color: 'var(--muted)', fontSize: 15 }}>· Ward {sel.wardId}</span></h3><span className="r">{t('streetView.detectionsAlongCorridor', { count: list.length })}</span></div>
            <LeafletMap
              mountKey={'street-' + sel.id}
              onMount={(L, m) => {
                tileLayer(L, m);
                plot(L, m, list, id => openIssue(id));
                if (list.length) {
                  const g = L.featureGroup(list.map(i => L.marker([i.lat, i.lon])));
                  m.fitBounds(g.getBounds().pad(0.3));
                } else {
                  m.setView([19.09, 72.87], 12);
                }
              }}
            />
            <div className="legend">{Object.entries(TYPE).map(([k, v]) => <span className="it" key={k}><span className="sw" style={{ background: v.c }} />{t(`issueTypes.${k}`)}</span>)}</div>
          </div>
          <div className="card">
            <div className="ch"><h3>{t('streetView.corridorsByLoad')}</h3><span className="r">{t('streetView.worstFirst')}</span></div>
            <div style={{ maxHeight: 512, overflowY: 'auto' }}>
              <div className="tablewrap">
                <table>
                  <thead><tr><th>{t('streetView.street')}</th><th>{t('streetView.ward')}</th><th>{t('streetView.open')}</th><th>{t('streetView.load')}</th></tr></thead>
                  <tbody>
                    {streets.map(x => (
                      <tr className={`clk ${x.id === sel.id ? 'sel' : ''}`} key={x.id} onClick={() => gotoStreet(x.id)}>
                        <td><b>{x.name}</b></td><td>{x.wardId}</td><td>{x.open}</td>
                        <td><span className="scorepill" style={{ background: x.load > 18 ? '#d32f2f' : x.load > 10 ? '#e56a00' : '#c98a12' }}>{x.load.toFixed(0)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="ch"><h3>{t('streetView.allIssuesOn', { street: sel.name })}</h3><span className="r">{t('streetView.totalEveryStatus', { count: list.length })}</span></div>
          <div style={{ maxHeight: 452, overflowY: 'auto' }}>
            {!list.length
              ? <div className="hint">{t('streetView.noIssuesYet')}</div>
              : list.slice().sort((a, b) => priority(b) - priority(a)).map(i => <QItem key={i.id} issue={i} />)}
          </div>
        </div>

        <div className="card">
          <div className="ch"><h3>{t('streetView.fleetCoverage')}</h3><span className="r">{t('streetView.fleetCoverageHint')}</span></div>
          {trips.length ? (
            <div className="tablewrap">
              <table>
                <thead><tr><th>{t('streetView.bus')}</th><th>{t('streetView.tripDate')}</th><th>{t('streetView.detectionsHere')}</th></tr></thead>
                <tbody>
                  {trips.map(tr => (
                    <tr className="clk" key={tr.id} onClick={() => navigate(`/fleet/${tr.bus}/${tr.id}`)}>
                      <td><b>{tr.bus}</b></td><td>{fmtDate(tr.date)}</td><td>{tr.detections}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="hint" style={{ padding: '12px 16px' }}>{t('streetView.noFleetPasses')}</div>}
        </div>
      </div>
    </>
  );
}
