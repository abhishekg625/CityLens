import Header from '../components/Header.jsx';
import { TYPE, OPEN, issues, daysOpen, resolutionDays, contractorName } from '../lib/model.js';
import { useUI } from '../context/UIContext.jsx';
import { useStore } from '../lib/useStore.js';
import { useTranslation } from 'react-i18next';

export default function PerformanceView() {
  useStore();
  const { t } = useTranslation();
  const { openIssue } = useUI();
  const repairable = issues.filter(i => i.type !== 'waterlogging');
  const praise = repairable.filter(i => (i.status === 'resolved' || i.status === 'verified_fixed') && resolutionDays(i) <= 3)
    .sort((a, b) => resolutionDays(a) - resolutionDays(b));
  const misses = repairable.filter(i => OPEN.has(i.status) && daysOpen(i) > 7)
    .sort((a, b) => daysOpen(b) - daysOpen(a));

  return (
    <>
      <Header crumb={[{ t: 'Mumbai', to: '/' }, { t: t('performanceView.performance') }]} title={t('performanceView.performance')}
        sub={t('performanceView.sub')} />
      <div className="content">
        <div className="row cols-2">
          <div className="card">
            <div className="ch"><h3>{t('performanceView.praise')}</h3><span className="r">{t('performanceView.praiseSummary', { count: praise.length })}</span></div>
            {praise.length ? (
              <>
                <div className="tablewrap"><table>
                  <thead><tr><th>{t('performanceView.location')}</th><th>{t('performanceView.ward')}</th><th>{t('performanceView.fixedIn')}</th><th>{t('performanceView.contractor')}</th></tr></thead>
                  <tbody>
                    {praise.slice(0, 25).map(i => (
                      <tr className="clk" key={i.id} onClick={() => openIssue(i.id)}>
                        <td><span className="tdot" style={{ background: TYPE[i.type].c, marginRight: 6 }} />{i.street} · {i.id}</td>
                        <td>{i.ward}</td><td>{resolutionDays(i) <= 0 ? t('performanceView.underADay') : resolutionDays(i) + 'd'}</td>
                        <td><span className="badge assigned">{contractorName(i)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
                {praise.length > 25 && <div className="hint">{t('performanceView.moreFastFixes', { count: praise.length - 25 })}</div>}
              </>
            ) : <div className="cb"><div className="hint" style={{ padding: 4 }}>{t('performanceView.noFastFixes')}</div></div>}
          </div>
          <div className="card">
            <div className="ch"><h3>{t('performanceView.misses')}</h3><span className="r">{t('performanceView.missesSummary', { count: misses.length })}</span></div>
            {misses.length ? (
              <>
                <div className="tablewrap"><table>
                  <thead><tr><th>{t('performanceView.location')}</th><th>{t('performanceView.ward')}</th><th>{t('performanceView.daysOpen')}</th><th>{t('performanceView.contractor')}</th></tr></thead>
                  <tbody>
                    {misses.slice(0, 25).map(i => (
                      <tr className="clk" key={i.id} onClick={() => openIssue(i.id)}>
                        <td><span className="tdot" style={{ background: TYPE[i.type].c, marginRight: 6 }} />{i.street} · {i.id}</td>
                        <td>{i.ward}</td><td>{daysOpen(i)}d</td>
                        <td><span className="badge shame">{contractorName(i)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
                {misses.length > 25 && <div className="hint">{t('performanceView.moreOverdue', { count: misses.length - 25 })}</div>}
              </>
            ) : <div className="cb"><div className="hint" style={{ padding: 4 }}>{t('performanceView.noMisses')}</div></div>}
          </div>
        </div>
      </div>
    </>
  );
}
