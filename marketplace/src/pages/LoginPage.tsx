import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DEMO_PASSWORD, DEMO_USER } from '../data/users';

/** Only allow redirects inside this site. */
export function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/account';
}

export function LoginPage() {
  const { t, login, user, notify } = useApp();
  const [qs] = useSearchParams();
  const navigate = useNavigate();
  const next = safeNext(qs.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={next} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const ok = await login(email, password);
    setBusy(false);
    if (!ok) { setError('Wrong email or password.'); return; }
    notify('Welcome back!');
    navigate(next, { replace: true });
  };

  return (
    <div className="container page auth-page">
      <div className="card auth-card">
        <h1>{t('login')}</h1>
        <form className="form" onSubmit={submit} noValidate>
          <label>Email<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn btn-primary btn-block btn-lg" disabled={busy || !email || !password}>{t('login')}</button>
        </form>
        <div className="demo-box">
          <strong>Demo account</strong>
          <span>{DEMO_USER.email} / {DEMO_PASSWORD}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEmail(DEMO_USER.email); setPassword(DEMO_PASSWORD); }}>Fill in</button>
        </div>
        <p className="center">No account? <Link to={`/register${qs.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`}>{t('register')}</Link></p>
      </div>
    </div>
  );
}
