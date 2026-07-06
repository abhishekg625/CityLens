import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { OPEN, SCORES, scoreColor, issues, wardsFC, crewById } from '../lib/model.js';
import { WARD_CREW } from '../lib/data.js';
import { wardPath } from '../lib/routes.js';
import { useStore } from '../lib/useStore.js';

export default function WardsView() {
  const { t } = useTranslation();
  useStore();
  const navigate = useNavigate();
  const board = Object.values(SCORES).sort((a, b) => a.score - b.score);

  return (
    <>
      <Header
        crumb={[{ t: 'Mumbai', to: '/' }, { t: t('wardsView.wards') }]}
        title={t('wardsView.wards')}
        sub={t('wardsView.sub', { count: wardsFC.features.length })}
      />
      <div className="content">
        <div className="card">
          <div className="ch"><h3>{t('wardsView.allWards')}</h3><span className="r">{t('wardsView.clickToOpen')}</span></div>
          <div className="tablewrap">
            <table>
              <thead><tr><th></th><th>{t('wardsView.ward')}</th><th>{t('wardsView.area')}</th><th>{t('wardsView.health')}</th><th>{t('wardsView.open')}</th><th>{t('wardsView.highSev')}</th><th>{t('wardsView.fixed')}</th><th>{t('wardsView.contractor')}</th></tr></thead>
              <tbody>
                {board.map((w, i) => {
                  const wi = issues.filter(x => x.ward === w.ward);
                  const hs = wi.filter(x => OPEN.has(x.status) && x.severity >= 4).length;
                  const fx = wi.filter(x => x.status === 'verified_fixed').length;
                  const contractor = WARD_CREW[w.ward] && crewById(WARD_CREW[w.ward]);
                  return (
                    <tr className="clk" key={w.ward} onClick={() => navigate(wardPath(w.ward))}>
                      <td className="rank">{i + 1}</td>
                      <td><b>{w.ward}</b></td>
                      <td>{w.area}</td>
                      <td><span className="scorepill" style={{ background: scoreColor(w.score) }}>{w.score}</span></td>
                      <td>{w.open}</td>
                      <td style={{ color: 'var(--pothole)', fontWeight: 700 }}>{hs}</td>
                      <td style={{ color: 'var(--good)', fontWeight: 700 }}>{fx}</td>
                      <td>{contractor ? contractor.name : <span style={{ color: 'var(--faint)' }}>—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
