import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {config} from '../../config';
import {C, FONT_EN, usd} from '../../theme';
import {Enter} from '../../components/ui';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Row: React.FC<{left: React.ReactNode; right: React.ReactNode; bold?: boolean; muted?: boolean}> = ({
  left,
  right,
  bold,
  muted,
}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      fontFamily: FONT_EN,
      fontWeight: bold ? 800 : 600,
      fontSize: 28,
      color: muted ? C.muted : C.navy,
      fontVariantNumeric: 'tabular-nums',
      padding: '7px 0',
    }}
  >
    <div>{left}</div>
    <div>{right}</div>
  </div>
);

export const Billing: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const b = config.build.billing;
  const subtotal = b.items.reduce((a, i) => a + i.qty * i.price, 0);
  const total = subtotal - b.discount;

  // Lines "print" one by one.
  const lines: React.ReactNode[] = [
    <div key="shop" style={{textAlign: 'center', paddingBottom: 6}}>
      <div style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: 38, color: C.navy, letterSpacing: 2}}>
        {config.build.shopName.toUpperCase()}
      </div>
    </div>,
    <Row key="meta" left={`Receipt ${b.receiptNo}`} right={b.date} muted />,
    <div key="d1" style={{borderTop: `3px dashed ${C.line}`, margin: '10px 0'}} />,
    ...b.items.map((it) => (
      <div key={it.name}>
        <Row left={it.name} right={usd(it.qty * it.price)} />
        <div style={{fontFamily: FONT_EN, fontWeight: 600, fontSize: 22, color: C.muted, marginTop: -6, paddingBottom: 4}}>
          {it.qty} × {usd(it.price)}
        </div>
      </div>
    )),
    <div key="d2" style={{borderTop: `3px dashed ${C.line}`, margin: '10px 0'}} />,
    <Row key="sub" left="Subtotal" right={usd(subtotal)} />,
    <Row key="disc" left="Discount" right={usd(b.discount)} muted />,
  ];

  const lineEvery = 12;
  const firstLine = 14;
  const totalAt = firstLine + lines.length * lineEvery + 6;
  const totalP = spring({frame: frame - totalAt, fps, config: {damping: 12}});
  const stampP = spring({frame: frame - totalAt - 26, fps, config: {damping: 10, stiffness: 140}});

  return (
    <Enter delay={4} style={{width: 720, position: 'relative'}}>
      {/* printer */}
      <div
        style={{
          height: 70,
          borderRadius: 22,
          background: C.navy,
          margin: '0 -30px',
          position: 'relative',
          zIndex: 2,
          boxShadow: '0 16px 30px rgba(20,36,107,0.25)',
        }}
      >
        <div style={{position: 'absolute', left: 40, right: 40, bottom: 18, height: 10, borderRadius: 5, background: '#0A1340'}} />
        <div style={{position: 'absolute', right: 40, top: 22, width: 14, height: 14, borderRadius: 99, background: C.lime}} />
      </div>
      <div style={{marginTop: -24, position: 'relative', zIndex: 1, padding: '0 10px'}}>
        <div
          style={{
            background: C.white,
            boxShadow: '0 20px 40px rgba(20,36,107,0.12)',
            padding: '48px 44px 30px',
            WebkitMaskImage:
              'linear-gradient(to bottom, #000 calc(100% - 20px), transparent calc(100% - 20px)), conic-gradient(from -45deg at bottom, #000 90deg, transparent 0) bottom / 40px 20px repeat-x',
          }}
        >
          {lines.map((l, i) => {
            const at = firstLine + i * lineEvery;
            const p = interpolate(frame, [at, at + 10], [0, 1], clamp);
            return (
              <div key={i} style={{opacity: p, transform: `translateY(${(1 - p) * -12}px)`, maxHeight: p * 200, overflow: 'hidden'}}>
                {l}
              </div>
            );
          })}
          <div
            style={{
              marginTop: 18 * totalP,
              maxHeight: 120 * totalP,
              overflow: 'hidden',
              opacity: totalP,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: C.navy,
                color: C.white,
                borderRadius: 14,
                padding: '24px 28px',
                fontFamily: FONT_EN,
                fontWeight: 800,
                fontSize: 40,
                transform: `scale(${0.9 + 0.1 * totalP})`,
              }}
            >
              <span style={{letterSpacing: 1}}>{b.totalLabel}</span>
              <span style={{color: C.lime}}>{usd(total)}</span>
            </div>
          </div>
          <div style={{textAlign: 'center', fontFamily: FONT_EN, fontWeight: 700, fontSize: 26, color: C.muted, marginTop: 18, opacity: totalP}}>
            {b.paymentNote} · {b.thanks}
          </div>
          <div style={{height: 26}} />
        </div>
      </div>
      {/* PAID stamp */}
      <div
        style={{
          position: 'absolute',
          right: -40,
          bottom: 6,
          zIndex: 3,
          border: `7px solid ${C.success}`,
          color: C.success,
          fontFamily: FONT_EN,
          fontWeight: 800,
          fontSize: 60,
          letterSpacing: 6,
          padding: '6px 26px',
          borderRadius: 16,
          transform: `rotate(-14deg) scale(${2 - stampP})`,
          opacity: stampP * 0.9,
          background: 'rgba(255,255,255,0.6)',
        }}
      >
        PAID
      </div>
    </Enter>
  );
};
