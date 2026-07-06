import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TYPE, OPEN, issues, crewById, crewOpenCount, priority,
  setIssueCrew, addCrewMember, assignWardToCrew, SCORES,
} from '../lib/model.js';
import { CREW, CREW_CAPACITY, WARD_CREW } from '../lib/data.js';
import { useUI } from '../context/UIContext.jsx';
import { useStore } from '../lib/useStore.js';
import QItem from './QItem.jsx';

function CrewQueueModal({ crewId }) {
  const { t } = useTranslation();
  const { closeModal } = useUI();
  const cm = crewById(crewId);
  if (!cm) return null;
  const mine = issues.filter(i => i.crew === crewId);
  const open = mine.filter(i => OPEN.has(i.status)).sort((a, b) => priority(b) - priority(a));
  const done = mine.filter(i => !OPEN.has(i.status));
  const typeLabel = t(`issueTypes.${cm.type}`);
  return (
    <>
      <div className="mh">
        <span className="tdot" style={{ background: TYPE[cm.type].c, width: 14, height: 14 }} />
        <div>
          <b style={{ fontSize: 15 }}>{cm.name}</b>
          <div style={{ fontSize: 12, color: 'var(--faint)' }}>{cm.id} · {t('crewModal.specialist', { type: typeLabel })}</div>
        </div>
        <button className="x" style={{ marginLeft: 'auto' }} onClick={closeModal}>×</button>
      </div>
      <div className="mb">
        <div className="section-t" style={{ margin: '14px 16px 6px' }}>
          {t('crewModal.assignedOpen', { open: open.length, capacity: CREW_CAPACITY })}
          {open.length >= CREW_CAPACITY && <span className="badge confirmed" style={{ textTransform: 'none', letterSpacing: 0 }}> {t('common.worklistFull')}</span>}
        </div>
        <div>{!open.length ? <div className="hint">{t('crewModal.noIssueAssigned')}</div> : open.map(i => <QItem key={i.id} issue={i} opts={{ hideAssign: true }} />)}</div>
        {!!done.length && (
          <>
            <div className="section-t" style={{ margin: '18px 16px 6px' }}>{t('crewModal.completed', { count: done.length })}</div>
            <div>{done.map(i => <QItem key={i.id} issue={i} opts={{ hideAssign: true }} />)}</div>
          </>
        )}
      </div>
    </>
  );
}

function AssignCrewModal({ issueId }) {
  const { t } = useTranslation();
  const { closeModal } = useUI();
  const i = issues.find(x => x.id === issueId);
  if (!i) return null;
  const pool = CREW.filter(c => c.type === i.type && (i.crew === c.id || crewOpenCount(c.id) < CREW_CAPACITY));
  const typeLabel = t(`issueTypes.${i.type}`);
  return (
    <>
      <div className="mh">
        <span className="tdot" style={{ background: TYPE[i.type].c, width: 14, height: 14 }} />
        <div>
          <b style={{ fontSize: 15 }}>{t('crewModal.assignCrew')}</b>
          <div style={{ fontSize: 12, color: 'var(--faint)' }}>{t('crewModal.specialistsAt', { type: typeLabel, id: i.id })}</div>
        </div>
        <button className="x" onClick={closeModal}>×</button>
      </div>
      <div className="mb" style={{ padding: '6px 0' }}>
        {pool.length ? (
          <div className="tablewrap">
            <table>
              <thead><tr><th>{t('crewModal.crewId')}</th><th>{t('crewModal.name')}</th><th>{t('crewModal.load')}</th><th></th></tr></thead>
              <tbody>
                {pool.map(cm => {
                  const open = crewOpenCount(cm.id);
                  const current = i.crew === cm.id;
                  return (
                    <tr key={cm.id}>
                      <td>{cm.id}</td><td>{cm.name}</td>
                      <td><span className="scorepill" style={{ background: open >= CREW_CAPACITY ? '#d32f2f' : open ? '#e56a00' : '#2e7d32' }}>{open}/{CREW_CAPACITY}</span></td>
                      <td><button className={`btn ${current ? 'good' : 'primary'} sm`} onClick={() => { setIssueCrew(i, cm.id); closeModal(); }}>{current ? t('common.assigned') : t('common.assign')}</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="hint">{t('crewModal.allAtCapacity', { type: typeLabel.toLowerCase() })}</div>
        )}
      </div>
    </>
  );
}

function AddCrewModal() {
  const { t } = useTranslation();
  const { closeModal } = useUI();
  const [name, setName] = useState('');
  const [type, setType] = useState('pothole');
  const [err, setErr] = useState('');
  return (
    <>
      <div className="mh">
        <div><b style={{ fontSize: 15 }}>{t('crewModal.addCrewMember')}</b></div>
        <button className="x" onClick={closeModal}>×</button>
      </div>
      <div className="mb" style={{ padding: '16px 20px' }}>
        <div className="field"><label>{t('crewModal.name')}</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('crewModal.namePlaceholder')} /></div>
        <div className="field">
          <label>{t('crewModal.specialism')}</label>
          <select value={type} onChange={e => setType(e.target.value)}>
            {Object.keys(TYPE).filter(k => k !== 'waterlogging').map(k => <option key={k} value={k}>{t(`issueTypes.${k}`)}</option>)}
          </select>
        </div>
        <div style={{ color: 'var(--pothole)', fontSize: 12, minHeight: 16 }}>{err}</div>
      </div>
      <div className="mf">
        <button className="btn primary" onClick={() => {
          if (!name.trim()) { setErr(t('crewModal.enterName')); return; }
          addCrewMember(name.trim(), type);
          closeModal();
        }}>{t('crewModal.addCrewMember')}</button>
        <button className="btn" onClick={closeModal}>{t('common.cancel')}</button>
      </div>
    </>
  );
}

function AssignWardCrewModal({ ward }) {
  const { t } = useTranslation();
  const { closeModal } = useUI();
  const w = SCORES[ward];
  return (
    <>
      <div className="mh">
        <div>
          <b style={{ fontSize: 15 }}>{t('crewModal.assignWardContractor')}</b>
          <div style={{ fontSize: 12, color: 'var(--faint)' }}>{t('crewModal.wardContractorHint', { ward, area: w.area })}</div>
        </div>
        <button className="x" onClick={closeModal}>×</button>
      </div>
      <div className="mb" style={{ padding: '6px 0' }}>
        <div className="tablewrap">
          <table>
            <thead><tr><th>{t('crewModal.crewId')}</th><th>{t('crewModal.name')}</th><th>{t('crewModal.specialism')}</th><th>{t('crewModal.openLoad')}</th><th></th></tr></thead>
            <tbody>
              {CREW.map(cm => {
                const open = crewOpenCount(cm.id);
                const current = WARD_CREW[ward] === cm.id;
                return (
                  <tr key={cm.id}>
                    <td>{cm.id}</td><td>{cm.name}</td><td>{t(`issueTypes.${cm.type}`)}</td>
                    <td><span className="scorepill" style={{ background: open >= CREW_CAPACITY ? '#d32f2f' : open ? '#e56a00' : '#2e7d32' }}>{open}/{CREW_CAPACITY}</span></td>
                    <td><button className={`btn ${current ? 'good' : 'primary'} sm`} onClick={() => { assignWardToCrew(ward, cm.id); closeModal(); }}>{current ? t('common.assigned') : t('common.assign')}</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function CrewModal() {
  useStore();
  const { modal, closeModal } = useUI();
  const isOpen = !!modal;
  return (
    <>
      <div className={`scrim ${isOpen ? 'on' : ''}`} onClick={closeModal} />
      <div className={`cmodal ${isOpen ? 'on' : ''}`}>
        {modal?.type === 'crew' && <CrewQueueModal crewId={modal.payload.crewId} />}
        {modal?.type === 'assignCrew' && <AssignCrewModal issueId={modal.payload.issueId} />}
        {modal?.type === 'addCrew' && <AddCrewModal />}
        {modal?.type === 'assignWardCrew' && <AssignWardCrewModal ward={modal.payload.ward} />}
      </div>
    </>
  );
}
