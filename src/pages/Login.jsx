import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { login, signUp, requestReset, resetPassword, WARD_CODES } from '../lib/auth.js';
import { useSession } from '../context/SessionContext.jsx';

export default function Login() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('login'); // 'login' | 'signup' | 'forgot'
  const navigate = useNavigate();
  const { refresh } = useSession();

  const goToDashboard = () => { refresh(); navigate('/', { replace: true }); };

  return (
    <div className="authwrap">
      <div className="authcard">
        <div className="brand" style={{ borderBottom: 'none', padding: '0 0 18px' }}>
          <div className="mark" />
          <div><b>CityLens</b><span>{t('login.tagline')}</span></div>
        </div>
        <div className="tabs">
          <button type="button" className={`tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>{t('login.logIn')}</button>
          <button type="button" className={`tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => setTab('signup')}>{t('login.createAccount')}</button>
        </div>
        {tab === 'login' && <LoginForm onSuccess={goToDashboard} onForgot={() => setTab('forgot')} />}
        {tab === 'signup' && <SignupForm onSuccess={goToDashboard} />}
        {tab === 'forgot' && <ForgotForm onBack={() => setTab('login')} />}
      </div>
    </div>
  );
}

function LoginForm({ onSuccess, onForgot }) {
  const { t } = useTranslation();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const submit = async e => {
    e.preventDefault(); setErr('');
    try { await login(user, pass); onSuccess(); } catch (ex) { setErr(ex.message); }
  };
  return (
    <form className="authform" onSubmit={submit}>
      <div className="field"><label>{t('login.usernameOrMobile')}</label><input type="text" autoComplete="username" required value={user} onChange={e => setUser(e.target.value)} /></div>
      <div className="field"><label>{t('login.password')}</label><input type="password" autoComplete="current-password" required value={pass} onChange={e => setPass(e.target.value)} /></div>
      <div className="autherr">{err}</div>
      <button className="btn primary" type="submit" style={{ width: '100%' }}>{t('login.logIn')}</button>
      <a className="authlink" onClick={onForgot}>{t('login.forgotPassword')}</a>
    </form>
  );
}

function SignupForm({ onSuccess }) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [role, setRole] = useState('admin');
  const [ward, setWard] = useState(WARD_CODES[0] || '');
  const [specialism, setSpecialism] = useState('pothole');
  const [err, setErr] = useState('');
  const submit = async e => {
    e.preventDefault(); setErr('');
    if (pass !== pass2) { setErr(t('login.passwordsDontMatch')); return; }
    try {
      await signUp({ username, mobile, password: pass, role, ward, specialism });
      await login(username, pass);
      onSuccess();
    } catch (ex) { setErr(ex.message); }
  };
  return (
    <form className="authform" onSubmit={submit}>
      <div className="field"><label>{t('login.username')}</label><input type="text" autoComplete="username" required minLength={3} maxLength={24} value={username} onChange={e => setUsername(e.target.value)} /></div>
      <div className="field"><label>{t('login.mobileNumber')}</label><input type="tel" autoComplete="tel" inputMode="numeric" pattern="[0-9]{10}" required placeholder={t('login.mobilePlaceholder')} value={mobile} onChange={e => setMobile(e.target.value)} /></div>
      <div className="field"><label>{t('login.password')}</label><input type="password" autoComplete="new-password" required minLength={6} value={pass} onChange={e => setPass(e.target.value)} /></div>
      <div className="field"><label>{t('login.confirmPassword')}</label><input type="password" autoComplete="new-password" required minLength={6} value={pass2} onChange={e => setPass2(e.target.value)} /></div>
      <div className="field">
        <label>{t('login.logInAs')}</label>
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="admin">{t('login.roleAdmin')}</option>
          <option value="ward_officer">{t('login.roleWardOfficer')}</option>
          <option value="user">{t('login.roleUser')}</option>
          <option value="crew">{t('login.roleCrew')}</option>
        </select>
      </div>
      {(role === 'ward_officer' || role === 'crew') && (
        <div className="field">
          <label>{t('login.ward')}</label>
          <select value={ward} onChange={e => setWard(e.target.value)}>
            {WARD_CODES.map(w => <option key={w} value={w}>{t('login.wardOption', { code: w })}</option>)}
          </select>
        </div>
      )}
      {role === 'crew' && (
        <div className="field">
          <label>{t('login.specialism')}</label>
          <select value={specialism} onChange={e => setSpecialism(e.target.value)}>
            <option value="pothole">{t('login.specialismPothole')}</option>
            <option value="garbage_pile">{t('login.specialismGarbage')}</option>
            <option value="street_obstruction">{t('login.specialismObstruction')}</option>
          </select>
        </div>
      )}
      <div className="autherr">{err}</div>
      <button className="btn primary" type="submit" style={{ width: '100%' }}>{t('login.createAccount')}</button>
    </form>
  );
}

function ForgotForm({ onBack }) {
  const { t } = useTranslation();
  const [user, setUser] = useState('');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [newPass, setNewPass] = useState('');
  const [err, setErr] = useState('');
  const [errColor, setErrColor] = useState('');
  const [done, setDone] = useState(false);

  const send = () => {
    setErrColor('');
    try {
      const generated = requestReset(user);
      setSent(true);
      setErrColor('var(--good)');
      setErr(t('login.demoResetCode', { code: generated }));
    } catch (ex) { setErrColor(''); setErr(ex.message); }
  };
  const submit = async e => {
    e.preventDefault();
    try {
      await resetPassword(code, newPass);
      setErrColor('var(--good)'); setErr(t('login.passwordResetDone'));
      setDone(true);
      setTimeout(onBack, 1200);
    } catch (ex) { setErrColor(''); setErr(ex.message); }
  };
  return (
    <form className="authform" onSubmit={submit}>
      <div className="authhint">{t('login.resetHint')}</div>
      <div className="field"><label>{t('login.usernameOrMobile')}</label><input type="text" required value={user} onChange={e => setUser(e.target.value)} disabled={done} /></div>
      {!sent && <button className="btn" type="button" style={{ width: '100%' }} onClick={send}>{t('login.sendResetCode')}</button>}
      {sent && (
        <div>
          <div className="field"><label>{t('login.resetCode')}</label><input type="text" inputMode="numeric" required value={code} onChange={e => setCode(e.target.value)} disabled={done} /></div>
          <div className="field"><label>{t('login.newPassword')}</label><input type="password" autoComplete="new-password" required minLength={6} value={newPass} onChange={e => setNewPass(e.target.value)} disabled={done} /></div>
          <button className="btn primary" type="submit" style={{ width: '100%' }} disabled={done}>{t('login.resetPassword')}</button>
        </div>
      )}
      <div className="autherr" style={{ color: errColor || undefined }}>{err}</div>
      <a className="authlink" onClick={onBack}>{t('login.backToLogIn')}</a>
    </form>
  );
}
