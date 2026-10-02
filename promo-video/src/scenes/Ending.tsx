import React, { useMemo } from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import {
  CalendarCheck,
  CalendarClock,
  ChartColumn,
  Fingerprint,
  LucideIcon,
  MessagesSquare,
  Package,
  Plus,
  ReceiptText,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import QRCode from 'qrcode';
import { config } from '../config';
import assets from '../generated/assets.json';
import { clamp, ease, enter, pop, sec } from '../lib/anim';
import { Highlight, Rich } from '../lib/text';
import { Card, Logo, Pill } from '../components/ui';
import { C, FONT, HEADING, SHADOW, SHADOW_SM } from '../theme';

/* ---------- 5) More tools ---------- */

const ICONS: Record<string, LucideIcon> = {
  attendance: Fingerprint,
  stock: Package,
  purchasing: ShoppingCart,
  agent: MessagesSquare,
  billing: ReceiptText,
  suppliers: Truck,
  leave: CalendarCheck,
  reports: ChartColumn,
  expenses: Wallet,
  booking: CalendarClock,
  crm: Users,
  more: Plus,
};

export const MoreTools: React.FC = () => {
  const frame = useCurrentFrame();
  const m = config.moreTools;
  const gridStart = sec(0.45);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          top: 130,
          left: 40,
          right: 40,
          textAlign: 'center',
          ...HEADING,
          fontSize: 62,
          lineHeight: 1.6,
          color: C.navy,
          ...enter(frame, 0),
        }}
      >
        <Rich text={m.headline} markStart={sec(0.35)} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 375,
          left: 40,
          right: 40,
          textAlign: 'center',
          fontFamily: FONT.khmerBody,
          fontWeight: 700,
          fontSize: 42,
          color: C.navySoft,
          ...enter(frame, sec(0.15), { distance: 30 }),
        }}
      >
        {m.subline}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 500,
          left: 90,
          right: 90,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 26,
        }}
      >
        {m.tiles.map((t, i) => {
          const Icon = ICONS[t.icon] ?? Plus;
          const isMore = t.icon === 'more';
          return (
            <div
              key={t.label}
              style={{
                height: 190,
                borderRadius: 16,
                background: isMore ? C.navy : C.white,
                boxShadow: SHADOW_SM,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                position: 'relative',
                ...enter(frame, gridStart + i * 5, { distance: 40, scaleFrom: 0.6 }),
              }}
            >
              {t.dot ? (
                <span
                  style={{
                    position: 'absolute',
                    top: 18,
                    right: 18,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: C.lime,
                    boxShadow: `0 0 0 5px ${C.limeSoft}`,
                  }}
                />
              ) : null}
              <div
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 22,
                  background: isMore ? C.lime : C.limeSoft,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={46} color={C.navy} strokeWidth={2.3} />
              </div>
              <div style={{ fontFamily: FONT.en, fontWeight: 800, fontSize: 29, color: isMore ? C.white : C.navy }}>{t.label}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 6) Offer ---------- */

export const Offer: React.FC = () => {
  const frame = useCurrentFrame();
  const o = config.offer;
  const badgeP = pop(frame, sec(1.3), { damping: 11, stiffness: 120 });
  const spin = interpolate(frame, [0, sec(6)], [0, 40]);
  const btnPulse = 1 + 0.025 * Math.sin(Math.max(0, frame - sec(2.2)) / 9);

  return (
    <AbsoluteFill style={{ alignItems: 'center' }}>
      <div style={{ marginTop: 160, ...enter(frame, 0) }}>
        <Logo height={84} />
      </div>
      <div
        style={{
          marginTop: 64,
          fontFamily: FONT.body,
          fontWeight: 700,
          fontSize: 54,
          color: C.navy,
          textAlign: 'center',
          ...enter(frame, sec(0.15)),
        }}
      >
        {o.line1}
      </div>
      <div
        style={{
          marginTop: 10,
          fontFamily: FONT.body,
          fontWeight: 400,
          fontSize: 36,
          color: C.grey,
          textAlign: 'center',
          ...enter(frame, sec(0.28), { distance: 30 }),
        }}
      >
        {o.line2}
      </div>

      <div style={{ position: 'relative', marginTop: 100, width: 900, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 38, color: C.grey, ...enter(frame, sec(0.45), { distance: 30 }) }}>
          {o.priceLabel}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28, ...enter(frame, sec(0.6), { distance: 80, scaleFrom: 0.7 }) }}>
          <div style={{ fontFamily: FONT.en, fontWeight: 800, fontSize: 290, lineHeight: 1.05, letterSpacing: -10, color: C.navy }}>
            <Highlight start={sec(0.95)} height="0.2em" bottom="0.12em">
              {o.price}
            </Highlight>
          </div>
          <div style={{ position: 'relative', fontFamily: FONT.en, fontWeight: 700, fontSize: 92, color: C.greyLight, marginBottom: 58 }}>
            {o.oldPrice}
            <span
              style={{
                position: 'absolute',
                left: -8,
                right: -8,
                top: '52%',
                height: 8,
                borderRadius: 4,
                background: C.red,
                opacity: 0.85,
                transform: `rotate(-12deg) scaleX(${ease(frame, sec(1.05), sec(0.3))})`,
                transformOrigin: 'left',
              }}
            />
          </div>
        </div>

        {/* bonus badge */}
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -30,
            width: 250,
            height: 250,
            transform: `scale(${badgeP}) rotate(${(1 - badgeP) * -120 + spin * 0.1 - 10}deg)`,
            opacity: frame >= sec(1.3) ? 1 : 0,
          }}
        >
          <svg width="250" height="250" viewBox="0 0 250 250" style={{ position: 'absolute', inset: 0, transform: `rotate(${spin}deg)` }}>
            <path
              d={Array.from({ length: 48 })
                .map((_, i) => {
                  const a = (i / 48) * Math.PI * 2;
                  const r = i % 2 ? 112 : 124;
                  return `${i ? 'L' : 'M'}${125 + r * Math.cos(a)} ${125 + r * Math.sin(a)}`;
                })
                .join(' ') + 'Z'}
              fill={C.lime}
              style={{ filter: 'drop-shadow(0 10px 18px rgba(78,154,18,0.35))' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              color: C.navy,
              fontFamily: FONT.en,
              padding: 34,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: 4 }}>{o.bonusTop}</div>
            <div style={{ fontWeight: 800, fontSize: 50, lineHeight: 1.05 }}>{o.bonusMain}</div>
            <div style={{ fontWeight: 700, fontSize: 21, lineHeight: 1.2, marginTop: 4 }}>{o.bonusText}</div>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 40,
          fontFamily: FONT.body,
          fontWeight: 700,
          fontSize: 36,
          color: C.navySoft,
          textAlign: 'center',
          padding: '0 50px',
          ...enter(frame, sec(1.6), { distance: 30 }),
        }}
      >
        <Rich text={o.proof} iconColor={C.limeDeep} />
      </div>

      <div style={{ marginTop: 90, ...enter(frame, sec(1.85)) }}>
        <Pill
          style={{
            background: C.navy,
            color: C.white,
            fontSize: 46,
            fontWeight: 700,
            padding: '30px 64px',
            boxShadow: '0 18px 40px rgba(20,36,107,0.35)',
            transform: `scale(${btnPulse})`,
          }}
        >
          <Rich text={o.button} />
        </Pill>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 7) Close ---------- */

const QR: React.FC<{ size: number }> = ({ size }) => {
  const qr = useMemo(() => QRCode.create(config.course.telegramLink, { errorCorrectionLevel: 'M' }), []);
  const n = qr.modules.size;
  const cell = size / n;
  const rects: React.ReactNode[] = [];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      if (qr.modules.get(x, y)) rects.push(<rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell + 0.4} height={cell + 0.4} />);
  return (
    <svg width={size} height={size} fill={C.navy} shapeRendering="crispEdges">
      {rects}
    </svg>
  );
};

export const Close: React.FC = () => {
  const frame = useCurrentFrame();
  const scan = interpolate(frame, [sec(0.9), sec(2.1)], [0, 1], clamp);
  const QR_SIZE = 500;
  const corner = (rot: number, pos: React.CSSProperties) => (
    <div
      style={{
        position: 'absolute',
        width: 90,
        height: 90,
        borderTop: `10px solid ${C.lime}`,
        borderLeft: `10px solid ${C.lime}`,
        borderTopLeftRadius: 26,
        transform: `rotate(${rot}deg)`,
        ...pos,
      }}
    />
  );
  const cp = pop(frame, sec(0.5), { damping: 12 });

  return (
    <AbsoluteFill style={{ alignItems: 'center' }}>
      <div style={{ marginTop: 150, ...enter(frame, 0) }}>
        <Logo height={84} />
      </div>
      <div
        style={{
          marginTop: 60,
          ...HEADING,
          fontSize: 70,
          lineHeight: 1.6,
          color: C.navy,
          ...enter(frame, sec(0.15)),
        }}
      >
        <Rich text={config.close.heading} />
      </div>

      <div style={{ marginTop: 40, position: 'relative', ...enter(frame, sec(0.3), { distance: 80, scaleFrom: 0.85 }) }}>
        <Card style={{ padding: 40, position: 'relative' }}>
          <div style={{ width: QR_SIZE, height: QR_SIZE, position: 'relative', overflow: 'hidden' }}>
            {assets.files.qr ? (
              <Img src={staticFile('qr.png')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <QR size={QR_SIZE} />
            )}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: scan * QR_SIZE - 40,
                height: 40,
                background: 'linear-gradient(180deg, rgba(139,224,60,0), rgba(139,224,60,0.55))',
                borderBottom: `5px solid ${C.lime}`,
                opacity: scan > 0 && scan < 1 ? 1 : 0,
              }}
            />
          </div>
        </Card>
        <div style={{ position: 'absolute', inset: -34, opacity: cp, transform: `scale(${1.15 - 0.15 * cp})` }}>
          {corner(0, { left: 0, top: 0 })}
          {corner(90, { right: 0, top: 0 })}
          {corner(180, { right: 0, bottom: 0 })}
          {corner(270, { left: 0, bottom: 0 })}
        </div>
      </div>

      <div
        style={{
          marginTop: 70,
          display: 'flex',
          alignItems: 'center',
          gap: 22,
          background: C.white,
          boxShadow: SHADOW,
          borderRadius: 999,
          padding: '18px 40px 18px 20px',
          ...enter(frame, sec(0.7)),
        }}
      >
        <svg width={76} height={76} viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="24" fill="#2AABEE" />
          <path d="M11 23.5l22.5-9c1-.4 1.9.3 1.6 1.8l-3.8 18c-.3 1.3-1.1 1.6-2.2 1l-6-4.4-2.9 2.8c-.3.3-.6.6-1.2.6l.4-6.1 11.1-10c.5-.4-.1-.7-.7-.3L16.1 26.6l-5.9-1.8c-1.3-.4-1.3-1.3.8-1.3z" fill="#fff" />
        </svg>
        <span style={{ fontFamily: FONT.en, fontWeight: 800, fontSize: 52, color: C.navy }}>{config.course.telegramHandle}</span>
      </div>
    </AbsoluteFill>
  );
};
