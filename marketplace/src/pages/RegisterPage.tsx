import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PROVINCES } from '../data/locations';
import { formatPhone, isValidPhone } from '../lib/format';
import { safeNext } from './LoginPage';

export function RegisterPage() {
  const { t, p, register, user, notify } = useApp();
  const [qs] = useSearchParams();
  const navigate = useNavigate();
  const next = safeNext(qs.get('next'));
  const [form, setForm] = useState({ name: '', email: '', phone: '', province: 'phnom-penh', password: '', confirm: '', agree: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={next} replace />;

  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = 'Enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email.';
    if (!isValidPhone(form.phone)) errs.phone = 'Enter a Cambodian phone number, e.g. 012 345 678.';
    if (form.password.length < 6) errs.password = 'Use at least 6 characters.';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match.';
    if (!form.agree) errs.agree = 'Please accept the terms.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    const res = await register({ name: form.name, email: form.email, phone: formatPhone(form.phone), province: form.province, password: form.password });
    setBusy(false);
    if (!res.ok) { setErrors({ email: res.error ?? 'Could not register.' }); return; }
    notify('Your account is ready.');
    navigate(next, { replace: true });
  };

  const err = (k: string) => errors[k] && <span className="field-error">{errors[k]}</span>;

  return (
    <div className="container page auth-page">
      <div className="card auth-card">
        <h1>{t('register')}</h1>
        <form className="form" onSubmit={submit} noValidate>
          <label>Full name<input value={form.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" />{err('name')}</label>
          <label>Email<input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />{err('email')}</label>
          <label>Phone number<input type="tel" inputMode="tel" placeholder="012 345 678" value={form.phone} onChange={(e) => set('phone', e.target.value)} onBlur={() => set('phone', formatPhone(form.phone))} />{err('phone')}</label>
          <label>{t('province')}
            <select value={form.province} onChange={(e) => set('province', e.target.value)}>
              {PROVINCES.map((pr) => <option key={pr.slug} value={pr.slug}>{p(pr.name)}</option>)}
            </select>
          </label>
          <label>Password<input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} autoComplete="new-password" />{err('password')}</label>
          <label>Confirm password<input type="password" value={form.confirm} onChange={(e) => set('confirm', e.target.value)} autoComplete="new-password" />{err('confirm')}</label>
          <label className="checkbox"><input type="checkbox" checked={form.agree} onChange={(e) => set('agree', e.target.checked)} /> I agree to the terms of use and posting rules.</label>
          {err('agree')}
          <button className="btn btn-primary btn-block btn-lg" disabled={busy}>{t('register')}</button>
        </form>
        <p className="center">Already have an account? <Link to="/login">{t('login')}</Link></p>
      </div>
    </div>
  );
}
