import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import Header from '../components/Header.jsx';
import { DATA } from '../lib/data.js';
import { TYPE, SEVC, fmtDate } from '../lib/model.js';
import { tripsForBus, addRouteOverlay } from '../lib/fleet.js';
import { tileLayer } from '../lib/maps.js';
import { useUI } from '../context/UIContext.jsx';
import { useStore } from '../lib/useStore.js';

// Ported from js/app.js viewTripReplay() — real detector output (video + timestamped
// detections) drives the replay when present; otherwise a simulated timeline built from
// this bus's actual stops. Kept intentionally imperative (refs + one effect) since the
// video/map/feed are tightly time-synced, exactly like the original.
export default function TripReplay() {
  useStore();
  const { t } = useTranslation();
  const { bus, trip: tripId } = useParams();
  const navigate = useNavigate();
  const { openIssue } = useUI();
  const trip = tripsForBus(bus).find(t => t.id === tripId);
  const [resetTick, setResetTick] = useState(0);

  const mapDivRef = useRef(null);
  const videoRef = useRef(null);
  const fallbackRef = useRef(null);
  const feedRef = useRef(null);
  const feednRef = useRef(null);
  const fillRef = useRef(null);
  const clockRef = useRef(null);
  const playBtnRef = useRef(null);
  const trackRef = useRef(null);

  const playHandlerRef = useRef(null);
  const resetHandlerRef = useRef(null);
  const trackClickRef = useRef(null);

  useEffect(() => {
    if (!trip) return;
    const fm = L.map(mapDivRef.current, { zoomControl: true, attributionControl: false });
    tileLayer(L, fm);
    const route = DATA.routes['A-71'];
    const poly = addRouteOverlay(L, fm);
    fm.fitBounds(poly.getBounds().pad(0.25));
    const busMarker = L.circleMarker(route[0], { radius: 8, fillColor: '#f57c00', color: '#fff', weight: 2, fillOpacity: 1 }).addTo(fm);
    requestAnimationFrame(() => fm.invalidateSize());

    const run = trip.run;
    const live = (run && run.feed) ? run.feed : [];
    const M = (run && run.motion) || null;
    const totalKm = (M && M.distance_km) ? M.distance_km : ((run && run.distance_km) || 8.6);
    const replay = { t: 0, df: 0, seen: new Set(), timer: null };

    function cumFrac(sec, dur) {
      if (!M || !M.cum || !M.cum.length) return dur ? Math.min(1, sec / dur) : 0;
      const c = M.cum;
      if (sec <= c[0][0]) return c[0][1];
      if (sec >= c[c.length - 1][0]) return c[c.length - 1][1];
      let lo = 0, hi = c.length - 1;
      while (lo < hi) { const md = (lo + hi) >> 1; if (c[md][0] < sec) lo = md + 1; else hi = md; }
      const a = c[Math.max(1, lo) - 1], b = c[Math.max(1, lo)];
      return b[0] <= a[0] ? a[1] : a[1] + (b[1] - a[1]) * (sec - a[0]) / (b[0] - a[0]);
    }
    function posAt(t) {
      const n = route.length - 1, x = t * n, idx = Math.min(n - 1, Math.floor(x)), f = x - idx;
      const a = route[idx], b = route[idx + 1];
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    }
    function fmtClock(sec) { const m = Math.floor(sec / 60), s = Math.floor(sec % 60); return `${m}:${String(s).padStart(2, '0')}`; }

    function markerForLive(i) {
      const km = (replay.df * totalKm).toFixed(1);
      return L.circleMarker(posAt(replay.df), { radius: 3 + i.severity * 1.4, fillColor: TYPE[i.type].c, color: '#fff', weight: 1.4, fillOpacity: .9 })
        .bindPopup(`<b>${t(`issueTypes.${i.type}`)}</b> · ${Math.round(i.confidence * 100)}% confidence<br>${t('tripReplay.intoClip', { time: fmtClock(i.t), km })}`);
    }
    function addFeedLive(i) {
      const feed = feedRef.current; if (!feed) return;
      if (replay.seen.size === 1) feed.innerHTML = '';
      const km = (replay.df * totalKm).toFixed(1);
      const el = document.createElement('div'); el.className = 'feeditem';
      const pct = Math.round(i.confidence * 100);
      el.innerHTML = `<span class="tdot" style="background:${TYPE[i.type].c}"></span>
        ${i.crop ? `<img src="/${i.crop}" style="width:36px;height:36px;object-fit:cover;border-radius:4px;flex:0 0 36px" onerror="this.remove()">` : ''}
        <div class="meta"><div class="t1">${t(`issueTypes.${i.type}`)} <span class="sev" style="background:${SEVC[i.severity]}">SEV ${i.severity}</span></div>
        <div class="t2">${t('tripReplay.intoClipShort', { time: fmtClock(i.t), km, pct, id: i.id })}</div></div>`;
      feed.prepend(el);
      if (feednRef.current) feednRef.current.textContent = String(replay.seen.size);
    }
    function markerAtPos(i, pos) {
      return L.circleMarker(pos, { radius: 3 + i.severity * 1.4, fillColor: TYPE[i.type].c, color: '#fff', weight: 1.4, fillOpacity: .9 })
        .on('click', () => openIssue(i.id));
    }
    function addFeed(i) {
      const feed = feedRef.current; if (!feed) return;
      if (replay.seen.size === 1) feed.innerHTML = '';
      const el = document.createElement('div'); el.className = 'feeditem';
      const km = (replay.t * totalKm).toFixed(1);
      const pct = Math.round(i.confidence * 100);
      el.innerHTML = `<span class="tdot" style="background:${TYPE[i.type].c}"></span>
        <div class="meta"><div class="t1">${t(`issueTypes.${i.type}`)} <span class="sev" style="background:${SEVC[i.severity]}">SEV ${i.severity}</span></div>
        <div class="t2">${t('tripReplay.kmShort', { km, pct, id: i.id })}</div></div>`;
      el.onclick = () => openIssue(i.id);
      feed.prepend(el);
      if (feednRef.current) feednRef.current.textContent = String(replay.seen.size);
    }

    function stopReplay() {
      if (replay.timer) { clearInterval(replay.timer); replay.timer = null; }
      const v = videoRef.current; if (v && !v.paused) v.pause();
      if (playBtnRef.current) playBtnRef.current.textContent = replay.t >= 1 ? t('tripReplay.replay') : t('tripReplay.play');
    }
    resetHandlerRef.current = () => { stopReplay(); setResetTick(k => k + 1); };

    const video = videoRef.current;
    if (video) {
      video.onerror = () => {
        video.style.display = 'none';
        if (fallbackRef.current) fallbackRef.current.style.display = '';
        wireSimulated();
      };
      video.onloadedmetadata = wireVideoDriven;
    } else {
      wireSimulated();
    }

    function wireVideoDriven() {
      video.ontimeupdate = () => {
        replay.t = video.duration ? video.currentTime / video.duration : 0;
        replay.df = cumFrac(video.currentTime, video.duration);
        busMarker.setLatLng(posAt(replay.df));
        if (fillRef.current) fillRef.current.style.width = (replay.t * 100) + '%';
        if (clockRef.current) clockRef.current.textContent = (replay.df * totalKm).toFixed(1) + ' km';
        live.forEach(i => {
          if (video.currentTime >= i.t && !replay.seen.has(i.id)) {
            replay.seen.add(i.id); markerForLive(i).addTo(fm); addFeedLive(i);
          }
        });
      };
      video.onended = stopReplay;
      trackClickRef.current = e => {
        const r = trackRef.current.getBoundingClientRect();
        video.currentTime = ((e.clientX - r.left) / r.width) * (video.duration || 0);
      };
      playHandlerRef.current = () => {
        if (video.paused) { video.play(); if (playBtnRef.current) playBtnRef.current.textContent = t('tripReplay.pause'); }
        else { video.pause(); if (playBtnRef.current) playBtnRef.current.textContent = t('tripReplay.play'); }
      };
    }
    function wireSimulated() {
      const routeIssues = trip.stops;
      function step() {
        replay.t = Math.min(1, replay.t + 0.006);
        const p = posAt(replay.t);
        busMarker.setLatLng(p);
        if (fillRef.current) fillRef.current.style.width = (replay.t * 100) + '%';
        if (clockRef.current) clockRef.current.textContent = (replay.t * totalKm).toFixed(1) + ' km';
        routeIssues.forEach((i, stopIdx) => {
          const at = (stopIdx + 1) / (routeIssues.length + 1);
          if (replay.t >= at && !replay.seen.has(i.id)) { replay.seen.add(i.id); markerAtPos(i, p).addTo(fm); addFeed(i); }
        });
        if (replay.t >= 1) stopReplay();
      }
      playHandlerRef.current = () => {
        if (replay.timer) { stopReplay(); }
        else { if (playBtnRef.current) playBtnRef.current.textContent = t('tripReplay.pause'); replay.timer = setInterval(step, 90); }
      };
      trackClickRef.current = null;
    }

    return () => {
      stopReplay();
      fm.remove();
      playHandlerRef.current = null;
      trackClickRef.current = null;
      resetHandlerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip && trip.id, resetTick]);

  useEffect(() => {
    if (!trip) navigate('/fleet', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip]);

  if (!trip) return null;
  const run = trip.run;

  return (
    <>
      <Header
        crumb={[
          { t: 'Mumbai', to: '/' },
          { t: t('tripReplay.fleet'), to: '/fleet' },
          { t: bus, to: '/fleet' },
          { t: fmtDate(trip.date) },
        ]}
        title={bus}
        sub={t('tripReplay.sub', { date: fmtDate(trip.date) })}
      />
      <div className="content">
        <div className="row map-side">
          <div className="card">
            <div className="ch"><h3>{t('tripReplay.tripReplay', { date: fmtDate(trip.date) })}</h3><span className="r">{t('tripReplay.bus', { bus })}</span></div>
            <div className="videoslot" key={trip.id + ':' + resetTick}>
              {run && run.video && (
                <video ref={videoRef} src={`/${run.video}`} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              )}
              <div className="rd"><span className="d" />{t('tripReplay.dashcam')}</div>
              <div ref={fallbackRef} style={{ display: (run && run.video) ? 'none' : '' }}>{t('tripReplay.noClip')}</div>
            </div>
            <div ref={mapDivRef} id="fleetmap" style={{ width: '100%', height: 220 }} />
            <div className="controls">
              <button className="btn primary sm" ref={playBtnRef} onClick={() => playHandlerRef.current && playHandlerRef.current()}>{t('tripReplay.play')}</button>
              <button className="btn sm" onClick={() => resetHandlerRef.current && resetHandlerRef.current()}>↺</button>
              <div className="track" ref={trackRef} onClick={e => trackClickRef.current && trackClickRef.current(e)}>
                <div className="fill" ref={fillRef} />
              </div>
              <span ref={clockRef} style={{ fontSize: 12, color: 'var(--faint)', fontWeight: 700, minWidth: 66, textAlign: 'right' }}>0.0 km</span>
            </div>
          </div>
          <div className="card">
            <div className="ch"><h3>{t('tripReplay.detectionsThisRun')}</h3><span className="r" ref={feednRef}>0</span></div>
            <div className="feed" ref={feedRef}><div className="hint">{t('tripReplay.pressPlay')}</div></div>
            <div className="ch" style={{ borderTop: '1px solid var(--line)' }}><h3>{t('tripReplay.tripStops')}</h3></div>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              <div className="tablewrap">
                <table>
                  <thead><tr><th>{t('tripReplay.issue')}</th><th>{t('tripReplay.street')}</th><th>{t('tripReplay.sev')}</th></tr></thead>
                  <tbody>
                    {trip.stops.map(i => (
                      <tr className="clk" key={i.id} onClick={() => openIssue(i.id)}>
                        <td><b>{i.id}</b></td>
                        <td>
                          <a style={{ color: 'var(--chalo-d)', textDecoration: 'underline', cursor: 'pointer' }}
                            onClick={e => { e.stopPropagation(); navigate(`/streets/${i.streetId}?ward=${i.ward}`); }}>
                            {i.street}
                          </a>
                        </td>
                        <td>{i.severity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
