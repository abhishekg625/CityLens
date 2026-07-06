import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header.jsx';
import KpiStrip from '../components/KpiStrip.jsx';
import QItem from '../components/QItem.jsx';
import LeafletMap from '../components/LeafletMap.jsx';
import { TYPE, OPEN, issues, priority, SCORES, wardsFC } from '../lib/model.js';
import { tileLayer, drawWards, plot } from '../lib/maps.js';
import { useUI } from '../context/UIContext.jsx';
import { useStore } from '../lib/useStore.js';

export default function CatView() {
  useStore();
  const { t } = useTranslation();
  const { type: catType } = useParams();
  const { openIssue } = useUI();
  const meta = TYPE[catType];

  if (!meta) {
    return (
      <>
        <Header crumb={[{ t: 'Mumbai', to: '/' }, { t: t('catView.notFound') }]} title={t('catView.unknownCategory')} sub="" />
        <div className="content"><div className="card cb"><div className="hint">{t('catView.noSuchCategory')}</div></div></div>
      </>
    );
  }

  const categoryLabel = t(`issueTypes.${catType}`);
  const list = issues.filter(i => i.type === catType);
  const open = list.filter(i => OPEN.has(i.status)).sort((a, b) => priority(b) - priority(a));

  return (
    <>
      <Header
        crumb={[{ t: 'Mumbai', to: '/' }, { t: categoryLabel }]}
        title={t('catView.cityWide', { category: categoryLabel })}
        sub={t('catView.sub')}
      />
      <div className="content">
        <KpiStrip list={list} />
        <div className="row map-side">
          <div className="card">
            <div className="ch"><h3>{t('catView.categoryMap', { category: categoryLabel })}</h3><span className="r">{t('catView.openCount', { count: open.length })}</span></div>
            <LeafletMap
              mountKey={'cat-' + catType}
              onMount={(L, m) => {
                m.setView([19.09, 72.87], 11);
                tileLayer(L, m);
                drawWards(L, m, wardsFC, SCORES, { fillByScore: false });
                plot(L, m, open, id => openIssue(id));
              }}
            />
          </div>
          <div className="card">
            <div className="ch"><h3>{t('catView.priorityList')}</h3><span className="r">{t('catView.severityPersistence')}</span></div>
            <div style={{ maxHeight: 512, overflowY: 'auto' }}>
              {open.slice(0, 60).map(i => <QItem key={i.id} issue={i} />)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
