import React from 'react';
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from 'remotion';
import { Droplet, Package, Store, Wheat } from 'lucide-react';
import { config } from '../config';
import { clamp, countTo, ease, enter, fade, pop, sec, usd } from '../lib/anim';
import { CheckIcon, Rich } from '../lib/text';
import { Window } from '../lib/timing';
import { Card, SectionLabel } from '../components/ui';
import { C, FONT, RADIUS, SHADOW, SHADOW_SM } from '../theme';

const OVERLAP = 14;

/* ---------- shared header for each card ---------- */

const CardTitle: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', top: 228, left: 40, right: 40, textAlign: 'center' }}>
      <div
        style={{
          fontFamily: FONT.en,
          fontWeight: 800,
          fontSize: 84,
          letterSpacing: -2,
          lineHeight: 1.15,
          color: C.navy,
          ...enter(frame, 0),
        }}
      >
        <Rich text={title} markStart={sec(0.35)} />
      </div>
      <div
        style={{
          marginTop: 12,
          fontFamily: FONT.khmerBody,
          fontWeight: 700,
          fontSize: 44,
          color: C.navySoft,
          ...enter(frame, sec(0.12), { distance: 30 }),
        }}
      >
        {subtitle}
      </div>
    </div>
  );
};

const SubShell: React.FC<{ dur: number; last: boolean; children: React.ReactNode }> = ({ dur, last, children }) => {
  const frame = useCurrentFrame();
  const out = last ? 0 : interpolate(frame, [dur - 4, dur + OVERLAP - 2], [0, 1], clamp);
  return (
    <AbsoluteFill
      style={{
        opacity: 1 - out,
        transform: `translateY(${-out * 60}px)`,
        filter: out > 0.02 ? `blur(${out * 12}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/* ---------- a) Stock & Sales ---------- */

const SheetsIcon: React.FC<{ size?: number }> = ({ size = 34 }) => (
  <svg viewBox="0 0 24 32" width={size * 0.75} height={size}>
    <path d="M2 0h14l8 8v22a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z" fill="#0F9D58" />
    <path d="M16 0l8 8h-6a2 2 0 0 1-2-2z" fill="#87CEAC" />
    <rect x="5" y="13" width="14" height="12" rx="1" fill="#fff" />
    <path d="M5 17h14M5 21h14M11 13v12" stroke="#0F9D58" strokeWidth="1.6" />
  </svg>
);

const itemIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('oil')) return Droplet;
  if (n.includes('rice')) return Wheat;
  return Package;
};

const StockCard: React.FC = () => {
  const frame = useCurrentFrame();
  const s = config.stock;
  const ev = sec(1.4);
  const sales = countTo(frame, ev, sec(0.8), s.salesBefore, s.salesBefore + s.saleAmount);
  const stock = countTo(frame, ev, sec(0.8), s.stockBefore, s.stockBefore - s.saleAmount);
  const flash = interpolate(frame, [ev - 4, ev + 6, ev + sec(1.2), ev + sec(1.8)], [0, 1, 1, 0.35], clamp);

  return (
    <>
      <CardTitle title={s.title} subtitle={s.subtitle} />
      <div style={{ position: 'absolute', top: 470, left: 70, right: 70, ...enter(frame, sec(0.25)) }}>
        <Card style={{ padding: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: C.navy,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Store color={C.lime} size={36} strokeWidth={2.4} />
              </div>
              <div style={{ fontFamily: FONT.en, fontWeight: 800, fontSize: 32, color: C.navy, letterSpacing: 1 }}>
                {config.shopName}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 22px',
                borderRadius: 999,
                border: `2px solid ${C.line}`,
                fontFamily: FONT.en,
                fontWeight: 700,
                fontSize: 27,
                color: C.navy,
                ...enter(frame, sec(0.5), { distance: 20, scaleFrom: 0.8 }),
              }}
            >
              <SheetsIcon size={34} />
              {s.badge}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, marginTop: 34 }}>
            {[
              { label: s.salesLabel, value: usd(sales), chip: `+${usd(s.saleAmount)}`, up: true },
              { label: s.stockLabel, value: usd(stock), chip: null, up: false },
            ].map((b) => (
              <div key={b.label} style={{ flex: 1, background: C.panel, borderRadius: RADIUS, padding: '26px 28px' }}>
                <div style={{ fontFamily: FONT.en, fontWeight: 600, fontSize: 28, color: C.grey }}>{b.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
                  <div style={{ fontFamily: FONT.en, fontWeight: 800, fontSize: 70, color: C.navy, letterSpacing: -2 }}>
                    {b.value}
                  </div>
                  {b.chip ? (
                    <div
                      style={{
                        background: C.lime,
                        color: C.navy,
                        fontFamily: FONT.en,
                        fontWeight: 800,
                        fontSize: 28,
                        padding: '6px 14px',
                        borderRadius: 999,
                        ...enter(frame, ev + sec(0.25), { distance: 16, scaleFrom: 0.6 }),
                      }}
                    >
                      {b.chip}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 34,
              padding: '0 20px 12px',
              fontFamily: FONT.en,
              fontWeight: 700,
              fontSize: 24,
              letterSpacing: 3,
              color: C.greyLight,
            }}
          >
            <span>ITEM</span>
            <span>IN STOCK</span>
          </div>
          {s.items.map((it, i) => {
            const sold = i === s.soldItemIndex;
            const left = sold && frame >= ev + sec(0.3) ? it.left - 1 : it.left;
            const low = left <= 10;
            const Icon = itemIcon(it.name);
            const bump = sold ? pop(frame, ev + sec(0.3), { damping: 9, stiffness: 220 }) : 1;
            return (
              <div
                key={it.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '18px 20px',
                  borderTop: `2px solid ${C.line}`,
                  borderRadius: 14,
                  background: sold ? `rgba(139,224,60,${0.28 * flash})` : undefined,
                  ...enter(frame, sec(0.45) + i * 5, { distance: 24 }),
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 14,
                      background: C.limeSoft,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon color={C.navy} size={34} strokeWidth={2.2} />
                  </div>
                  <span style={{ fontFamily: FONT.en, fontWeight: 700, fontSize: 38, color: C.navy }}>{it.name}</span>
                </div>
                <span
                  style={{
                    fontFamily: FONT.en,
                    fontWeight: 800,
                    fontSize: 30,
                    padding: '10px 20px',
                    borderRadius: 999,
                    color: sold && flash > 0.5 ? C.navy : low ? '#9A5B00' : C.navy,
                    background: sold && flash > 0.5 ? C.lime : low ? '#FDEBCB' : C.panel,
                    display: 'inline-block',
                    transform: `scale(${sold && frame >= ev + sec(0.3) ? 0.85 + 0.15 * bump : 1})`,
                  }}
                >
                  {left} left
                </span>
              </div>
            );
          })}
        </Card>
      </div>

      <div style={{ position: 'absolute', top: 1290, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            background: C.lime,
            color: C.navy,
            fontFamily: FONT.en,
            fontWeight: 800,
            fontSize: 36,
            padding: '18px 36px',
            borderRadius: 999,
            boxShadow: '0 14px 30px rgba(78,154,18,0.30)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            ...enter(frame, ev + sec(0.6), { distance: 70 }),
          }}
        >
          <Rich text={s.toast} />
        </div>
      </div>
    </>
  );
};

/* ---------- b) Billing ---------- */

const ReceiptCard: React.FC = () => {
  const frame = useCurrentFrame();
  const b = config.billing;
  const total = b.lines.reduce((a, l) => a + l.qty * l.unitPrice, 0);
  const lineAt = (i: number) => sec(0.75) + i * sec(0.38);
  const totalAt = lineAt(b.lines.length) + sec(0.15);
  const totalP = pop(frame, totalAt, { damping: 16 });

  return (
    <>
      <CardTitle title={b.title} subtitle={b.subtitle} />
      <div style={{ position: 'absolute', top: 480, left: 140, right: 140, ...enter(frame, sec(0.25)) }}>
        <div
          style={{
            background: C.white,
            boxShadow: SHADOW,
            borderRadius: `${RADIUS}px ${RADIUS}px 0 0`,
            padding: '46px 46px 30px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: FONT.en, fontWeight: 800, fontSize: 50, letterSpacing: 4, color: C.navy }}>
              {config.shopName}
            </div>
            <div style={{ fontFamily: FONT.en, fontWeight: 700, fontSize: 24, letterSpacing: 5, color: C.grey, marginTop: 12 }}>
              {b.receiptLabel}
            </div>
            <div
              style={{
                display: 'inline-block',
                marginTop: 14,
                fontFamily: FONT.en,
                fontWeight: 700,
                fontSize: 28,
                color: C.navy,
                background: C.panel,
                padding: '8px 18px',
                borderRadius: 10,
              }}
            >
              {b.invoiceNo}
            </div>
          </div>
          <div style={{ borderTop: `3px dashed ${C.line}`, margin: '34px 0 14px' }} />
          {b.lines.map((l, i) => {
            const p = ease(frame, lineAt(i), sec(0.3));
            return (
              <div
                key={l.name}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 14,
                  padding: '18px 0',
                  fontFamily: FONT.en,
                  fontSize: 34,
                  color: C.navy,
                  opacity: p,
                  transform: `translateY(${(1 - p) * -18}px)`,
                  clipPath: `inset(0 0 ${(1 - p) * 100}% 0)`,
                }}
              >
                <span style={{ fontWeight: 700 }}>{l.name}</span>
                <span style={{ fontWeight: 600, color: C.grey }}>x{l.qty}</span>
                <span style={{ flex: 1, borderBottom: `3px dotted ${C.greyLight}`, transform: 'translateY(-8px)' }} />
                <span style={{ fontWeight: 800 }}>{usd(l.qty * l.unitPrice, 2)}</span>
              </div>
            );
          })}
          <div style={{ borderTop: `3px dashed ${C.line}`, margin: '16px 0 26px' }} />
          <div
            style={{
              background: C.navy,
              borderRadius: 14,
              padding: '26px 30px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              opacity: fade(frame, totalAt, 8),
              transform: `translateX(${(1 - totalP) * -120}px)`,
            }}
          >
            <span style={{ fontFamily: FONT.en, fontWeight: 800, fontSize: 30, letterSpacing: 4, color: C.lime }}>
              {b.totalLabel}
            </span>
            <span style={{ fontFamily: FONT.en, fontWeight: 800, fontSize: 54, color: C.white }}>{usd(total, 2)}</span>
          </div>
        </div>
        {/* torn paper edge */}
        <svg width="100%" height="26" viewBox="0 0 800 26" preserveAspectRatio="none" style={{ display: 'block', filter: 'drop-shadow(0 10px 10px rgba(20,36,107,0.08))' }}>
          <path
            d={`M0 0 H800 V6 ${Array.from({ length: 20 })
              .map((_, i) => `L${800 - i * 40 - 20} 26 L${800 - (i + 1) * 40} 6`)
              .join(' ')} Z`}
            fill="#fff"
          />
        </svg>
      </div>
    </>
  );
};

/* ---------- c) Leave Tracker ---------- */

const Cursor: React.FC<{ x: number; y: number; press: number }> = ({ x, y, press }) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: `scale(${1 - press * 0.15})`, transformOrigin: '0 0', zIndex: 50 }}>
    <svg width="74" height="84" viewBox="0 0 24 28" style={{ filter: 'drop-shadow(0 6px 8px rgba(20,36,107,0.30))' }}>
      <path d="M2 2l19 10-8.2 2.2L17 23l-3.6 1.8-4.2-8.7L3 21z" fill={C.navy} stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  </div>
);

const LeaveCard: React.FC = () => {
  const frame = useCurrentFrame();
  const l = config.leave;
  const moveFrom = sec(0.75);
  const clickAt = sec(1.6);
  const m = ease(frame, moveFrom, sec(0.75));
  // approve button centre (scene coords) ~ (300, 815)
  const cx = interpolate(m, [0, 1], [980, 300]);
  const cy = interpolate(m, [0, 1], [1320, 812]) - Math.sin(m * Math.PI) * 80;
  const press = interpolate(frame, [clickAt - 4, clickAt, clickAt + 6], [0, 1, 0], clamp);
  const approved = frame >= clickAt;
  const ap = pop(frame, clickAt, { damping: 10, stiffness: 200 });
  const ripple = interpolate(frame, [clickAt, clickAt + 22], [0, 1], clamp);
  const calAt = clickAt + sec(0.45);

  return (
    <>
      <CardTitle title={l.title} subtitle={l.subtitle} />
      <div style={{ position: 'absolute', top: 480, left: 70, right: 70, ...enter(frame, sec(0.25)) }}>
        <Card style={{ padding: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <div
              style={{
                width: 116,
                height: 116,
                borderRadius: '50%',
                background: C.navy,
                color: C.white,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONT.en,
                fontWeight: 800,
                fontSize: 44,
                boxShadow: `0 0 0 6px ${C.limeSoft}`,
              }}
            >
              {l.initials}
            </div>
            <div>
              <div style={{ fontFamily: FONT.en, fontWeight: 800, fontSize: 50, color: C.navy }}>{l.employee}</div>
              <div style={{ fontFamily: FONT.en, fontWeight: 600, fontSize: 31, color: C.grey, marginTop: 6 }}>{l.detail}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 22, marginTop: 40 }}>
            <div
              style={{
                flex: 1,
                height: 104,
                borderRadius: RADIUS,
                background: approved ? C.lime : C.navy,
                color: approved ? C.navy : C.white,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONT.en,
                fontWeight: 800,
                fontSize: 40,
                position: 'relative',
                overflow: 'hidden',
                transform: `scale(${approved ? 0.94 + 0.06 * ap : 1 - press * 0.04})`,
              }}
            >
              {approved ? (
                <span
                  style={{
                    position: 'absolute',
                    width: 600,
                    height: 600,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.5)',
                    transform: `scale(${ripple})`,
                    opacity: 1 - ripple,
                  }}
                />
              ) : null}
              <span style={{ position: 'relative' }}>{approved ? <Rich text={l.approved} /> : l.approve}</span>
            </div>
            <div
              style={{
                flex: 1,
                height: 104,
                borderRadius: RADIUS,
                background: C.white,
                border: `3px solid ${C.line}`,
                color: C.navy,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONT.en,
                fontWeight: 800,
                fontSize: 40,
                opacity: approved ? interpolate(frame, [clickAt, clickAt + 12], [1, 0.35], clamp) : 1,
              }}
            >
              {l.reject}
            </div>
          </div>
        </Card>
      </div>

      <div style={{ position: 'absolute', top: 1000, left: 70, right: 70, ...enter(frame, sec(0.45)) }}>
        <Card style={{ padding: '30px 26px', display: 'flex', justifyContent: 'space-between' }}>
          {l.week.map((d, i) => {
            const on = d.leave && frame >= calAt + i * 4;
            const p = d.leave ? pop(frame, calAt + i * 4, { damping: 10, stiffness: 200 }) : 1;
            return (
              <div
                key={d.day}
                style={{
                  width: 116,
                  borderRadius: 16,
                  padding: '18px 0',
                  textAlign: 'center',
                  background: on ? C.lime : C.panel,
                  transform: `scale(${on ? 0.9 + 0.1 * p : 1})`,
                }}
              >
                <div style={{ fontFamily: FONT.en, fontWeight: 700, fontSize: 23, letterSpacing: 2, color: on ? C.navy : C.grey }}>
                  {d.day}
                </div>
                <div style={{ fontFamily: FONT.en, fontWeight: 800, fontSize: 48, color: C.navy, marginTop: 4 }}>{d.date}</div>
              </div>
            );
          })}
        </Card>
      </div>

      <div style={{ opacity: fade(frame, moveFrom - 6, 10) * interpolate(frame, [clickAt + sec(0.9), clickAt + sec(1.2)], [1, 0], clamp) }}>
        <Cursor x={cx} y={cy} press={press} />
      </div>
    </>
  );
};

/* ---------- d) AI Sales Agent ---------- */

const TelegramIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="24" fill="#2AABEE" />
    <path d="M11 23.5l22.5-9c1-.4 1.9.3 1.6 1.8l-3.8 18c-.3 1.3-1.1 1.6-2.2 1l-6-4.4-2.9 2.8c-.3.3-.6.6-1.2.6l.4-6.1 11.1-10c.5-.4-.1-.7-.7-.3L16.1 26.6l-5.9-1.8c-1.3-.4-1.3-1.3.8-1.3z" fill="#fff" />
  </svg>
);

/** Decorative QR-style pattern (not scannable). */
const FakeQR: React.FC<{ size: number }> = ({ size }) => {
  const n = 21;
  const cell = size / n;
  const finder = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  const rects: React.ReactNode[] = [];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      if (finder(x, y)) continue;
      if (((x * 7 + y * 13 + x * y * 3) % 5) % 2 === 0) rects.push(<rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} />);
    }
  const F = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x * cell} ${y * cell})`}>
      <rect width={cell * 7} height={cell * 7} rx={cell} />
      <rect x={cell} y={cell} width={cell * 5} height={cell * 5} rx={cell * 0.6} fill="#fff" />
      <rect x={cell * 2} y={cell * 2} width={cell * 3} height={cell * 3} rx={cell * 0.4} />
    </g>
  );
  return (
    <svg width={size} height={size} fill="#1A1A1A">
      {rects}
      <F x={0} y={0} />
      <F x={n - 7} y={0} />
      <F x={0} y={n - 7} />
    </svg>
  );
};

const Bubble: React.FC<{ side: 'left' | 'right'; at: number; children: React.ReactNode; plain?: boolean }> = ({
  side,
  at,
  children,
  plain,
}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const p = pop(frame, at, { damping: 14, stiffness: 180 });
  return (
    <div style={{ display: 'flex', justifyContent: side === 'right' ? 'flex-end' : 'flex-start' }}>
      <div
        style={{
          maxWidth: '78%',
          transformOrigin: side === 'right' ? '100% 100%' : '0% 100%',
          transform: `scale(${0.6 + 0.4 * p})`,
          opacity: Math.min(1, p * 1.5),
          ...(plain
            ? {}
            : {
                background: side === 'right' ? C.navy : '#EEF1F6',
                color: side === 'right' ? C.white : C.navy,
                padding: '18px 28px',
                borderRadius: side === 'right' ? '30px 30px 8px 30px' : '30px 30px 30px 8px',
                fontFamily: FONT.body,
                fontWeight: 700,
                fontSize: 38,
                lineHeight: 1.5,
              }),
        }}
      >
        {children}
      </div>
    </div>
  );
};

const TypingDots: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= to) return null;
  return (
    <div style={{ display: 'flex' }}>
      <div style={{ background: '#EEF1F6', borderRadius: '30px 30px 30px 8px', padding: '26px 30px', display: 'flex', gap: 12 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: C.navySoft,
              opacity: 0.35 + 0.65 * ((Math.sin((frame - i * 6) / 4) + 1) / 2),
              transform: `translateY(${-6 * ((Math.sin((frame - i * 6) / 4) + 1) / 2)}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

const AgentCard: React.FC = () => {
  const frame = useCurrentFrame();
  const a = config.agent;
  const t1 = sec(0.35);
  const tTyping = sec(0.75);
  const t2 = sec(1.15);
  const t3 = sec(1.7);
  const t4 = sec(2.1);
  const tNotify = sec(2.65);
  const tSticker = sec(3.0);
  const total = a.product.price * a.orderQty;
  const np = pop(frame, tNotify, { damping: 14, stiffness: 150 });
  const sp = pop(frame, tSticker, { damping: 9, stiffness: 170 });

  return (
    <>
      <CardTitle title={a.title} subtitle={a.subtitle} />
      <div style={{ position: 'absolute', top: 460, left: 90, right: 90, ...enter(frame, sec(0.2)) }}>
        <Card style={{ overflow: 'hidden', height: 880 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '26px 32px', borderBottom: `2px solid ${C.line}` }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0A7CFF, #A033FF 60%, #FF5280)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24">
                <path d="M12 2C6.5 2 2 6.1 2 11.3c0 2.9 1.4 5.5 3.7 7.2V22l3.4-1.9c.9.3 1.9.4 2.9.4 5.5 0 10-4.1 10-9.2S17.5 2 12 2zm1 12.4l-2.6-2.7-5 2.7 5.5-5.8 2.6 2.7 4.9-2.7-5.4 5.8z" fill="#fff" />
              </svg>
            </div>
            <div style={{ fontFamily: FONT.en, fontWeight: 800, fontSize: 34, color: C.navy, flex: 1 }}>{a.chatHeader}</div>
            <div
              style={{
                background: C.lime,
                color: C.navy,
                fontFamily: FONT.en,
                fontWeight: 800,
                fontSize: 26,
                padding: '6px 18px',
                borderRadius: 999,
                letterSpacing: 2,
              }}
            >
              {a.aiTag}
            </div>
          </div>

          <div style={{ padding: '28px 30px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Bubble side="right" at={t1}>
              {a.customerAsk}
            </Bubble>
            <TypingDots from={tTyping} to={t2} />
            <Bubble side="left" at={t2} plain>
              <div
                style={{
                  background: '#EEF1F6',
                  borderRadius: '30px 30px 30px 8px',
                  padding: 14,
                }}
              >
                <div style={{ background: C.white, borderRadius: 20, padding: 16, display: 'flex', alignItems: 'center', gap: 20, boxShadow: SHADOW_SM }}>
                  <div
                    style={{
                      width: 104,
                      height: 104,
                      borderRadius: 16,
                      background: 'linear-gradient(160deg, #FFF3C4, #F6D36B)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Droplet size={54} color="#B7791F" fill="#F2B632" strokeWidth={1.8} />
                  </div>
                  <div style={{ paddingRight: 14 }}>
                    <div style={{ fontFamily: FONT.en, fontWeight: 700, fontSize: 34, color: C.navy }}>
                      {a.product.name} <span style={{ color: C.greyLight }}>—</span>
                    </div>
                    <div style={{ fontFamily: FONT.en, fontWeight: 800, fontSize: 46, color: C.navy, marginTop: 2 }}>
                      {usd(a.product.price, 2)}
                    </div>
                  </div>
                </div>
              </div>
            </Bubble>
            <Bubble side="right" at={t3}>
              {a.customerOrder}
            </Bubble>
            <Bubble side="left" at={t4} plain>
              <div style={{ width: 520, borderRadius: 22, overflow: 'hidden', boxShadow: SHADOW_SM, border: `2px solid ${C.line}` }}>
                <div
                  style={{
                    background: '#E1232E',
                    color: '#fff',
                    padding: '14px 24px',
                    fontFamily: FONT.en,
                    fontWeight: 800,
                    fontSize: 34,
                    letterSpacing: 3,
                  }}
                >
                  KHQR
                </div>
                <div style={{ background: '#fff', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 22 }}>
                  <FakeQR size={170} />
                  <div>
                    <div style={{ fontFamily: FONT.en, fontWeight: 600, fontSize: 26, color: C.grey }}>Total</div>
                    <div style={{ fontFamily: FONT.en, fontWeight: 800, fontSize: 52, color: C.navy, lineHeight: 1.1 }}>{usd(total, 2)}</div>
                    <div style={{ fontFamily: FONT.en, fontWeight: 700, fontSize: 28, color: C.navySoft, marginTop: 8 }}>
                      Order {a.orderNo}
                    </div>
                  </div>
                </div>
              </div>
            </Bubble>
          </div>
        </Card>
      </div>

      {/* Telegram notification */}
      <div
        style={{
          position: 'absolute',
          top: 22,
          right: 36,
          width: 600,
          opacity: frame >= tNotify ? Math.min(1, np * 1.4) : 0,
          transform: `translateY(${(1 - np) * -180}px)`,
          zIndex: 40,
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.97)',
            borderRadius: 26,
            boxShadow: '0 22px 50px rgba(20,36,107,0.22)',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <TelegramIcon size={74} />
          <div>
            <div style={{ fontFamily: FONT.en, fontWeight: 800, fontSize: 30, color: C.navy }}>{a.notifyTitle}</div>
            <div style={{ fontFamily: FONT.en, fontWeight: 600, fontSize: 29, color: C.navySoft, marginTop: 2 }}>
              <Rich text={a.notifyText} iconColor={C.limeDeep} />
            </div>
          </div>
        </div>
      </div>

      {/* sticker */}
      <div
        style={{
          position: 'absolute',
          top: 1300,
          right: 46,
          opacity: frame >= tSticker ? Math.min(1, sp * 2) : 0,
          transform: `rotate(${-6 + (1 - sp) * -14}deg) scale(${0.4 + 0.6 * sp})`,
          zIndex: 45,
        }}
      >
        <div
          style={{
            background: C.lime,
            color: C.navy,
            fontFamily: FONT.body,
            fontWeight: 700,
            fontSize: 40,
            padding: '16px 34px',
            borderRadius: 20,
            border: '5px solid #fff',
            boxShadow: '0 16px 34px rgba(20,36,107,0.22)',
          }}
        >
          {a.sticker}
        </div>
      </div>
    </>
  );
};

/* ---------- Scene ---------- */

const CARDS = [StockCard, ReceiptCard, LeaveCard, AgentCard];

export const Build: React.FC<{ subs: Window[] }> = ({ subs }) => {
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <SectionLabel number={config.course.buildLabel.number} text={config.course.buildLabel.text} />
      </div>
      {subs.map((w, i) => {
        const Comp = CARDS[i];
        const last = i === subs.length - 1;
        const dur = w.to - w.from;
        return (
          <Sequence key={i} from={w.from} durationInFrames={dur + (last ? 0 : OVERLAP)} layout="none">
            <SubShell dur={dur} last={last}>
              <Comp />
            </SubShell>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
