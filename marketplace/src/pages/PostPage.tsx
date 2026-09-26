import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { ListingCard } from '../components/ListingCard';
import { useApp } from '../context/AppContext';
import { CATEGORIES, categoryBySlug, fieldsFor } from '../data/categories';
import { PROVINCES, provinceBySlug } from '../data/locations';
import { formatPhone, isValidPhone } from '../lib/format';
import { listingImage } from '../lib/images';
import { resizeImage } from '../lib/photos';
import { specEntries } from '../lib/specs';
import { load, save, uid } from '../lib/storage';
import type { Condition, DealType, Listing, PriceUnit, SpecField } from '../types';

const MAX_PHOTOS = 8;

interface Draft {
  category: string;
  subcategory: string;
  title: string;
  dealType: DealType | '';
  specs: Record<string, string>;
  images: string[];
  price: string;
  priceMax: string;
  priceUnit: PriceUnit;
  negotiable: boolean;
  noPrice: boolean;
  condition: Condition | '';
  province: string;
  district: string;
  address: string;
  description: string;
  delivery: string;
  phone: string;
  telegram: string;
}

const STEPS = [
  'Category', 'Subcategory', 'Details', 'Photos', 'Price',
  'Condition', 'Location', 'Description', 'Contact', 'Preview',
] as const;

const UNIT_OPTIONS: { value: PriceUnit; label: string }[] = [
  { value: 'total', label: 'Total price' },
  { value: 'month', label: 'Per month' },
  { value: 'day', label: 'Per day' },
  { value: 'hour', label: 'Per hour' },
  { value: 'item', label: 'Per unit' },
  { value: 'kg', label: 'Per kg' },
];

function emptyDraft(phone: string, telegram: string, province: string, district: string): Draft {
  return {
    category: '', subcategory: '', title: '', dealType: '', specs: {}, images: [],
    price: '', priceMax: '', priceUnit: 'total', negotiable: false, noPrice: false, condition: '',
    province, district, address: '', description: '', delivery: '', phone, telegram,
  };
}

function draftFromListing(l: Listing, telegram: string): Draft {
  return {
    category: l.category, subcategory: l.subcategory, title: l.title, dealType: l.dealType ?? '',
    specs: { ...l.specs }, images: [...l.images],
    price: l.price === null ? '' : String(l.price), priceMax: l.priceMax ? String(l.priceMax) : '',
    priceUnit: l.priceUnit, negotiable: l.negotiable, noPrice: l.price === null, condition: l.condition ?? '',
    province: l.province, district: l.district, address: l.address ?? '', description: l.description,
    delivery: l.delivery ?? '', phone: l.phone, telegram,
  };
}

/** Ten-step post / edit workflow. Fields change with the chosen category. */
export function PostPage() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const { t, p, user, getListing, saveListing, getSeller, notify, updateProfile } = useApp();
  const existing = id ? getListing(id) : undefined;
  const seller = user ? getSeller(user.sellerId) : undefined;

  const [draft, setDraft] = useState<Draft>(() => {
    if (existing) return draftFromListing(existing, seller?.telegram ?? '');
    const saved = load<Draft | null>('draft', null);
    return saved ?? emptyDraft(user?.phone ?? '', user?.telegram ?? '', user?.province ?? '', user?.district ?? '');
  });
  const [step, setStep] = useState(editing ? 2 : 0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  // Keep an unfinished new ad so a refresh does not lose it.
  useEffect(() => { if (!editing) save('draft', draft); }, [draft, editing]);

  const cat = categoryBySlug(draft.category);
  const sub = cat?.subcategories.find((s) => s.slug === draft.subcategory);
  const fields = useMemo(() => fieldsFor(draft.category, draft.subcategory), [draft.category, draft.subcategory]);
  const province = provinceBySlug(draft.province);

  if (!user) return <Navigate to="/login?next=/post" replace />;
  if (editing && !existing) return <Navigate to="/account/listings" replace />;
  if (editing && existing && existing.sellerId !== user.sellerId) return <Navigate to={`/listing/${existing.id}`} replace />;

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const setSpec = (k: string, v: string) => setDraft((d) => ({ ...d, specs: { ...d.specs, [k]: v } }));

  const chooseCategory = (slug: string) => {
    const c = categoryBySlug(slug)!;
    setDraft((d) => ({
      ...d, category: slug, subcategory: '', specs: {},
      condition: c.hasCondition ? d.condition : '',
      dealType: c.hasDealType ? d.dealType || 'sale' : '',
      priceUnit: c.defaultPriceUnit ?? 'total',
    }));
    setErrors({});
    setStep(1);
  };

  const chooseSub = (slug: string) => {
    set('subcategory', slug);
    setErrors({});
    setStep(2);
  };

  // Validation per step. Returns error messages keyed by field.
  const validate = (s: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 0 && !draft.category) e.category = 'Choose a category.';
    if (s === 1 && !draft.subcategory) e.subcategory = 'Choose a subcategory.';
    if (s === 2) {
      if (draft.title.trim().length < 5) e.title = 'Title must have at least 5 characters.';
      if (draft.title.length > 90) e.title = 'Keep the title under 90 characters.';
      if (cat?.hasDealType && !draft.dealType) e.dealType = 'Choose sale or rent.';
      fields.forEach((f) => { if (f.required && !draft.specs[f.key]?.trim()) e[f.key] = `${f.label.en} is required.`; });
    }
    if (s === 3 && draft.images.length === 0) e.images = 'Add at least one photo.';
    if (s === 4 && !draft.noPrice) {
      const v = Number(draft.price);
      if (draft.price === '' || Number.isNaN(v) || v <= 0) e.price = 'Enter a price in USD, or choose "Contact for price".';
      if (draft.priceMax && Number(draft.priceMax) < v) e.priceMax = 'Maximum must be higher than minimum.';
    }
    if (s === 5 && cat?.hasCondition && !draft.condition) e.condition = 'Choose New or Used.';
    if (s === 6) {
      if (!draft.province) e.province = 'Choose a province.';
      if (!draft.district) e.district = 'Choose a district.';
    }
    if (s === 7 && draft.description.trim().length < 20) e.description = 'Write at least 20 characters so buyers understand what you offer.';
    if (s === 8 && !isValidPhone(draft.phone)) e.phone = 'Enter a Cambodian phone number, e.g. 012 345 678.';
    return e;
  };

  const next = () => {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo(0, 0);
  };
  const back = () => { setErrors({}); setStep((s) => Math.max(0, s - 1)); window.scrollTo(0, 0); };
  const goTo = (s: number) => {
    // Jump back freely; jump forward only if every step before is valid.
    for (let i = 0; i < s; i++) {
      const e = validate(i);
      if (Object.keys(e).length) { setStep(i); setErrors(e); return; }
    }
    setErrors({});
    setStep(s);
  };

  const onPhotos = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS - draft.images.length);
    e.target.value = '';
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map((f) => resizeImage(f)));
      setDraft((d) => ({ ...d, images: [...d.images, ...urls].slice(0, MAX_PHOTOS) }));
      setErrors({});
    } catch {
      setErrors({ images: 'One of the files is not a valid image.' });
    } finally {
      setUploading(false);
    }
  };
  const removePhoto = (i: number) => set('images', draft.images.filter((_, idx) => idx !== i));
  const makeMain = (i: number) => set('images', [draft.images[i], ...draft.images.filter((_, idx) => idx !== i)]);

  const buildListing = (): Listing => {
    const base = existing;
    const listingId = base?.id ?? uid('U');
    const cleanSpecs = Object.fromEntries(Object.entries(draft.specs).filter(([k, v]) => v.trim() && fields.some((f) => f.key === k)));
    return {
      id: listingId,
      ref: base?.ref ?? 'PS-' + String(Date.now()).slice(-6),
      title: draft.title.trim(),
      category: draft.category,
      subcategory: draft.subcategory,
      price: draft.noPrice ? null : Number(draft.price),
      ...(draft.priceMax && !draft.noPrice ? { priceMax: Number(draft.priceMax) } : {}),
      priceUnit: draft.priceUnit,
      negotiable: draft.negotiable,
      ...(cat?.hasCondition && draft.condition ? { condition: draft.condition } : {}),
      ...(cat?.hasDealType && draft.dealType ? { dealType: draft.dealType } : {}),
      description: draft.description.trim(),
      province: draft.province,
      district: draft.district,
      ...(draft.address.trim() ? { address: draft.address.trim() } : {}),
      sellerId: user.sellerId,
      phone: formatPhone(draft.phone),
      postedAt: base?.postedAt ?? new Date().toISOString(),
      images: draft.images,
      specs: cleanSpecs,
      ...(draft.delivery.trim() ? { delivery: draft.delivery.trim() } : {}),
      ...(base?.sku ? { sku: base.sku } : {}),
      ...(base?.discount ? { discount: base.discount } : {}),
      featured: base?.featured ?? false,
      views: base?.views ?? 0,
      status: base?.status ?? 'active',
      ...(base?.isSample ? { isSample: true } : {}),
    };
  };

  const publish = () => {
    for (let i = 0; i < STEPS.length - 1; i++) {
      const e = validate(i);
      if (Object.keys(e).length) { setStep(i); setErrors(e); return; }
    }
    const listing = buildListing();
    saveListing(listing);
    if (draft.telegram !== (seller?.telegram ?? '')) {
      updateProfile({ name: user.name, phone: user.phone, province: user.province, district: user.district, telegram: draft.telegram, bio: user.bio });
    }
    if (!editing) save('draft', null);
    notify(editing ? 'Your ad was updated.' : 'Your ad is live!');
    navigate(`/listing/${listing.id}`);
  };

  const err = (k: string) => errors[k] && <span className="field-error" role="alert">{errors[k]}</span>;

  const renderField = (f: SpecField) => {
    const value = draft.specs[f.key] ?? '';
    const label = `${p(f.label)}${f.unit ? ` (${f.unit})` : ''}${f.required ? ' *' : ''}`;
    return (
      <label key={f.key}>
        {label}
        {f.type === 'select' ? (
          <select value={value} onChange={(e) => setSpec(f.key, e.target.value)}>
            <option value="">—</option>
            {f.options!.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input type={f.type === 'number' ? 'number' : 'text'} min={f.type === 'number' ? 0 : undefined} inputMode={f.type === 'number' ? 'numeric' : undefined} value={value} onChange={(e) => setSpec(f.key, e.target.value)} />
        )}
        {err(f.key)}
      </label>
    );
  };

  let body: ReactNode;
  switch (step) {
    case 0:
      body = (
        <>
          <h2>Step 1 — Choose a category</h2>
          <div className="choice-grid">
            {CATEGORIES.map((c) => (
              <button key={c.slug} className={`choice ${draft.category === c.slug ? 'active' : ''}`} onClick={() => chooseCategory(c.slug)}>
                <span className="category-icon" style={{ color: c.color, background: `${c.color}14` }}><Icon name={c.icon} size={24} /></span>
                {p(c.name)}
              </button>
            ))}
          </div>
          {err('category')}
        </>
      );
      break;
    case 1:
      body = (
        <>
          <h2>Step 2 — Choose a subcategory</h2>
          <p className="muted">{cat ? p(cat.name) : ''}</p>
          <div className="choice-list">
            {cat?.subcategories.map((s) => (
              <button key={s.slug} className={`choice-row ${draft.subcategory === s.slug ? 'active' : ''}`} onClick={() => chooseSub(s.slug)}>
                {p(s.name)} <Icon name="chevronRight" size={18} />
              </button>
            ))}
          </div>
          {err('subcategory')}
        </>
      );
      break;
    case 2:
      body = (
        <>
          <h2>Step 3 — Ad details</h2>
          <div className="form">
            <label>Title *
              <input value={draft.title} maxLength={90} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Toyota Prius 2012, full option" />
              <span className="hint">{draft.title.length}/90</span>
              {err('title')}
            </label>
            {cat?.hasDealType && (
              <fieldset>
                <legend>{t('dealType')} *</legend>
                <div className="segmented">
                  <button type="button" className={draft.dealType === 'sale' ? 'active' : ''} onClick={() => set('dealType', 'sale')}>{t('forSale')}</button>
                  <button type="button" className={draft.dealType === 'rent' ? 'active' : ''} onClick={() => { set('dealType', 'rent'); if (draft.priceUnit === 'total') set('priceUnit', 'month'); }}>{t('forRent')}</button>
                </div>
                {err('dealType')}
              </fieldset>
            )}
            <div className="form-grid">{fields.map(renderField)}</div>
          </div>
        </>
      );
      break;
    case 3:
      body = (
        <>
          <h2>Step 4 — Photos</h2>
          <p className="muted">Add up to {MAX_PHOTOS} photos. The first photo is the main photo.</p>
          <div className="photo-grid">
            {draft.images.map((src, i) => (
              <div key={i} className={`photo ${i === 0 ? 'main' : ''}`}>
                <img src={src.startsWith('sample:') ? listingImage({ id: 'draft', category: draft.category, subcategory: draft.subcategory, images: draft.images }, i) : src} alt={`Photo ${i + 1}`} />
                {i === 0 ? <span className="photo-tag">Main</span> : <button className="photo-tag" onClick={() => makeMain(i)}>Make main</button>}
                <button className="photo-remove" onClick={() => removePhoto(i)} aria-label={`Remove photo ${i + 1}`}><Icon name="x" size={16} /></button>
              </div>
            ))}
            {draft.images.length < MAX_PHOTOS && (
              <label className="photo-add">
                <Icon name="camera" size={28} />
                <span>{uploading ? 'Uploading…' : 'Add photos'}</span>
                <input type="file" accept="image/*" multiple onChange={onPhotos} disabled={uploading} data-testid="photo-input" />
              </label>
            )}
          </div>
          {err('images')}
        </>
      );
      break;
    case 4:
      body = (
        <>
          <h2>Step 5 — {cat?.priceLabel ? p(cat.priceLabel) : t('price')}</h2>
          <div className="form">
            <label className="checkbox"><input type="checkbox" checked={draft.noPrice} onChange={(e) => set('noPrice', e.target.checked)} /> {t('contactForPrice')}</label>
            {!draft.noPrice && (
              <div className="form-grid">
                <label>{draft.category === 'jobs' ? 'Minimum (USD) *' : 'Price (USD) *'}
                  <div className="input-prefix"><span>$</span><input type="number" min="0" step="any" inputMode="decimal" value={draft.price} onChange={(e) => set('price', e.target.value)} /></div>
                  {err('price')}
                </label>
                {draft.category === 'jobs' && (
                  <label>Maximum (USD)
                    <div className="input-prefix"><span>$</span><input type="number" min="0" inputMode="decimal" value={draft.priceMax} onChange={(e) => set('priceMax', e.target.value)} /></div>
                    {err('priceMax')}
                  </label>
                )}
                <label>Price is
                  <select value={draft.priceUnit} onChange={(e) => set('priceUnit', e.target.value as PriceUnit)}>
                    {UNIT_OPTIONS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                </label>
              </div>
            )}
            <label className="checkbox"><input type="checkbox" checked={draft.negotiable} onChange={(e) => set('negotiable', e.target.checked)} /> {t('negotiable')}</label>
          </div>
        </>
      );
      break;
    case 5:
      body = (
        <>
          <h2>Step 6 — {t('condition')}</h2>
          {cat?.hasCondition ? (
            <>
              <div className="choice-grid two">
                {(['new', 'used'] as const).map((c) => (
                  <button key={c} className={`choice ${draft.condition === c ? 'active' : ''}`} onClick={() => set('condition', c)}>
                    <strong>{t(c)}</strong>
                    <span className="muted small">{c === 'new' ? 'Never used, in original packaging' : 'Has been used before'}</span>
                  </button>
                ))}
              </div>
              {err('condition')}
            </>
          ) : (
            <p className="muted">Condition does not apply to {cat ? p(cat.name) : 'this category'}. Continue to the next step.</p>
          )}
        </>
      );
      break;
    case 6:
      body = (
        <>
          <h2>Step 7 — {t('location')}</h2>
          <div className="form form-grid">
            <label>{t('province')} *
              <select value={draft.province} onChange={(e) => setDraft((d) => ({ ...d, province: e.target.value, district: '' }))}>
                <option value="">—</option>
                {PROVINCES.map((pr) => <option key={pr.slug} value={pr.slug}>{p(pr.name)}</option>)}
              </select>
              {err('province')}
            </label>
            <label>{t('district')} *
              <select value={draft.district} onChange={(e) => set('district', e.target.value)} disabled={!province}>
                <option value="">—</option>
                {province?.districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              {err('district')}
            </label>
            <label className="span-2">Address / landmark (optional)
              <input value={draft.address} onChange={(e) => set('address', e.target.value)} placeholder="e.g. Street 271, near Toul Tumpung market" />
            </label>
          </div>
        </>
      );
      break;
    case 7:
      body = (
        <>
          <h2>Step 8 — {t('description')}</h2>
          <div className="form">
            <label>{t('description')} *
              <textarea rows={8} value={draft.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe the item: condition, what is included, reason for selling…" />
              <span className="hint">{draft.description.length} characters</span>
              {err('description')}
            </label>
            {!['jobs', 'house-land'].includes(draft.category) && (
              <label>{t('delivery')} (optional)
                <input value={draft.delivery} onChange={(e) => set('delivery', e.target.value)} placeholder="e.g. Free delivery in Phnom Penh" />
              </label>
            )}
          </div>
        </>
      );
      break;
    case 8:
      body = (
        <>
          <h2>Step 9 — Contact information</h2>
          <div className="form form-grid">
            <label>Seller name<input value={user.name} disabled /></label>
            <label>Phone number *
              <input type="tel" inputMode="tel" value={draft.phone} onChange={(e) => set('phone', e.target.value)} onBlur={() => set('phone', formatPhone(draft.phone))} placeholder="012 345 678" />
              {err('phone')}
            </label>
            <label>Telegram username (optional)
              <input value={draft.telegram} onChange={(e) => set('telegram', e.target.value.replace(/^@/, ''))} placeholder="username" />
            </label>
          </div>
        </>
      );
      break;
    default: {
      const preview = buildListing();
      body = (
        <>
          <h2>Step 10 — Preview and publish</h2>
          <div className="preview">
            <div className="preview-card"><ListingCard listing={preview} /></div>
            <dl className="spec-table">
              <div><dt>{t('category')}</dt><dd>{cat ? p(cat.name) : ''} › {sub ? p(sub.name) : ''}</dd></div>
              {preview.dealType && <div><dt>{t('dealType')}</dt><dd>{t(preview.dealType === 'sale' ? 'forSale' : 'forRent')}</dd></div>}
              {preview.condition && <div><dt>{t('condition')}</dt><dd>{t(preview.condition)}</dd></div>}
              {specEntries(preview, 'en').map((s) => <div key={s.key}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}
              <div><dt>{t('location')}</dt><dd>{preview.district}, {province ? p(province.name) : ''}</dd></div>
              <div><dt>Phone</dt><dd>{preview.phone}</dd></div>
              {preview.delivery && <div><dt>{t('delivery')}</dt><dd>{preview.delivery}</dd></div>}
            </dl>
            <div className="description card-inset">{preview.description}</div>
          </div>
        </>
      );
    }
  }

  const isLast = step === STEPS.length - 1;
  const autoAdvance = step === 0 || step === 1;

  return (
    <div className="container page post-page">
      <h1>{editing ? 'Edit ad' : t('postAd')}</h1>
      <ol className="stepper" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s} className={i === step ? 'current' : i < step ? 'done' : ''}>
            <button onClick={() => goTo(i)} aria-current={i === step ? 'step' : undefined}>
              <span className="step-num">{i < step ? <Icon name="check" size={14} /> : i + 1}</span>
              <span className="step-label">{s}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className="step-mobile only-mobile">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>

      <section className="card post-card">{body}</section>

      <div className="post-nav">
        {step > 0 ? <button className="btn btn-ghost" onClick={back}><Icon name="chevronLeft" size={18} /> {t('back')}</button> : <span />}
        {isLast ? (
          <button className="btn btn-accent btn-lg" onClick={publish}>{editing ? t('saveChanges') : t('publish')}</button>
        ) : !autoAdvance || draft[step === 0 ? 'category' : 'subcategory'] ? (
          <button className="btn btn-primary btn-lg" onClick={next}>{t('next')} <Icon name="chevronRight" size={18} /></button>
        ) : <span />}
      </div>
    </div>
  );
}
