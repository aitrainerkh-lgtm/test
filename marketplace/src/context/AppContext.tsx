// App-wide state: language, accounts, favorites and listings.
// The "backend" is localStorage (lib/storage.ts); replace the functions in this
// file with API calls to connect a real server.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { SAMPLE_LISTINGS } from '../data/listings';
import { DEMO_USER, SELLERS } from '../data/users';
import { translate, pick, type StringKey } from '../lib/i18n';
import { hashPassword, load, save, uid } from '../lib/storage';
import type { Bilingual, Lang, Listing, Seller, User } from '../types';

interface Report { listingId: string; reason: string; details: string; at: string; }
interface Message { listingId: string; fromUserId: string | null; name: string; phone: string; text: string; at: string; }

export type RegisterInput = Pick<User, 'name' | 'email' | 'phone' | 'province'> & { password: string };
export type ProfileInput = Pick<User, 'name' | 'phone' | 'province' | 'district' | 'telegram' | 'bio'>;

interface AppState {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StringKey) => string;
  p: (value: Bilingual) => string;

  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (input: RegisterInput) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (input: ProfileInput) => void;
  changePassword: (current: string, next: string) => Promise<boolean>;

  listings: Listing[];
  getListing: (id: string) => Listing | undefined;
  saveListing: (listing: Listing) => void;
  deleteListing: (id: string) => void;
  markViewed: (id: string) => void;

  sellers: Seller[];
  getSeller: (id: string) => Seller | undefined;

  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => boolean; // false when login is required

  reportListing: (r: Omit<Report, 'at'>) => void;
  sendMessage: (m: Omit<Message, 'at'>) => void;

  toast: string | null;
  notify: (msg: string) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => load<Lang>('lang', 'en'));
  const [users, setUsers] = useState<User[]>(() => load<User[]>('users', []));
  const [sessionId, setSessionId] = useState<string | null>(() => load<string | null>('session', null));
  const [userSellers, setUserSellers] = useState<Seller[]>(() => load<Seller[]>('sellers', []));
  // Listings created or edited by users, keyed by id. Overrides sample data.
  const [custom, setCustom] = useState<Record<string, Listing>>(() => load('listings', {}));
  const [deleted, setDeleted] = useState<string[]>(() => load<string[]>('deleted', []));
  const [viewBumps, setViewBumps] = useState<Record<string, number>>(() => load('views', {}));
  const [favMap, setFavMap] = useState<Record<string, string[]>>(() => load('favorites', {}));
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => save('lang', lang), [lang]);
  useEffect(() => save('users', users), [users]);
  useEffect(() => save('session', sessionId), [sessionId]);
  useEffect(() => save('sellers', userSellers), [userSellers]);
  useEffect(() => save('listings', custom), [custom]);
  useEffect(() => save('deleted', deleted), [deleted]);
  useEffect(() => save('views', viewBumps), [viewBumps]);
  useEffect(() => save('favorites', favMap), [favMap]);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const allUsers = useMemo(() => {
    const demoEdit = users.find((u) => u.id === DEMO_USER.id);
    return [demoEdit ?? DEMO_USER, ...users.filter((u) => u.id !== DEMO_USER.id)];
  }, [users]);
  const user = allUsers.find((u) => u.id === sessionId) ?? null;

  const sellers = useMemo(() => {
    const merged = SELLERS.map((s) => userSellers.find((u) => u.id === s.id) ?? s);
    return [...merged, ...userSellers.filter((u) => !SELLERS.some((s) => s.id === u.id))];
  }, [userSellers]);

  const listings = useMemo(() => {
    const base = SAMPLE_LISTINGS.map((l) => custom[l.id] ?? l);
    const created = Object.values(custom).filter((l) => !SAMPLE_LISTINGS.some((s) => s.id === l.id));
    return [...created, ...base]
      .filter((l) => !deleted.includes(l.id))
      .map((l) => (viewBumps[l.id] ? { ...l, views: l.views + viewBumps[l.id] } : l));
  }, [custom, deleted, viewBumps]);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 2800);
  }, []);

  const upsertUser = (u: User) => setUsers((list) => [...list.filter((x) => x.id !== u.id), u]);

  const syncSeller = (u: User) => {
    const existing = sellers.find((s) => s.id === u.sellerId);
    const seller: Seller = {
      id: u.sellerId, type: 'individual', joinedAt: u.joinedAt, verified: false, status: 'active', avatarColor: '#0a5c8c',
      ...existing,
      name: u.name, phone: u.phone, province: u.province, district: u.district, telegram: u.telegram, bio: u.bio, email: u.email,
    };
    setUserSellers((list) => [...list.filter((s) => s.id !== seller.id), seller]);
  };

  const value: AppState = {
    lang,
    setLang: setLangState,
    t: (key) => translate(lang, key),
    p: (v) => pick(lang, v),

    user,
    async login(email, password) {
      const hash = await hashPassword(password);
      const found = allUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.passwordHash === hash);
      if (found) setSessionId(found.id);
      return !!found;
    },
    async register(input) {
      const email = input.email.trim().toLowerCase();
      if (allUsers.some((u) => u.email.toLowerCase() === email)) {
        return { ok: false, error: 'An account with this email already exists.' };
      }
      const id = uid('u');
      const u: User = {
        id, name: input.name.trim(), email, phone: input.phone, province: input.province,
        passwordHash: await hashPassword(input.password),
        joinedAt: new Date().toISOString().slice(0, 10), sellerId: 'seller-' + id,
      };
      upsertUser(u);
      syncSeller(u);
      setSessionId(u.id);
      return { ok: true };
    },
    logout: () => setSessionId(null),
    updateProfile(input) {
      if (!user) return;
      const u = { ...user, ...input };
      upsertUser(u);
      syncSeller(u);
    },
    async changePassword(current, next) {
      if (!user || user.passwordHash !== (await hashPassword(current))) return false;
      upsertUser({ ...user, passwordHash: await hashPassword(next) });
      return true;
    },

    listings,
    getListing: (id) => listings.find((l) => l.id === id),
    saveListing: (l) => setCustom((c) => ({ ...c, [l.id]: l })),
    deleteListing(id) {
      setDeleted((d) => [...d, id]);
      setCustom((c) => { const { [id]: _removed, ...rest } = c; return rest; });
    },
    markViewed: (id) => setViewBumps((v) => ({ ...v, [id]: (v[id] ?? 0) + 1 })),

    sellers,
    getSeller: (id) => sellers.find((s) => s.id === id),

    favorites: user ? favMap[user.id] ?? [] : [],
    isFavorite: (id) => !!user && (favMap[user.id] ?? []).includes(id),
    toggleFavorite(id) {
      if (!user) return false;
      setFavMap((m) => {
        const cur = m[user.id] ?? [];
        return { ...m, [user.id]: cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur] };
      });
      return true;
    },

    reportListing: (r) => save('reports', [...load<Report[]>('reports', []), { ...r, at: new Date().toISOString() }]),
    sendMessage: (m) => save('messages', [...load<Message[]>('messages', []), { ...m, at: new Date().toISOString() }]),

    toast,
    notify,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
