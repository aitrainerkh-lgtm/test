import React from 'react';
import {interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {config} from '../../config';
import {CLAMP, enter, springAt, usd} from '../../lib/anim';
import {withSymbols} from '../../components/Rich';
import {BottleIcon, StoreIcon, TelegramIcon} from '../../components/Icons';
import {Card} from '../../components/UI';
import {fonts, theme} from '../../theme';

const C = config.scenes.build.agent;
const P = config.shop.products as Record<string, {name: string; price: number}>;
const KHQR_RED = '#E1232E';

const T = {
  ask: 18,
  typing1: [32, 60] as const,
  product: 60,
  order: 96,
  typing2: [108, 130] as const,
  khqr: 130,
  notify: 160,
  sticker: 182,
};

const Typing: React.FC<{frame: number}> = ({frame}) => (
  <div style={{display: 'flex', gap: 10, background: '#EEF1F6', borderRadius: '28px 28px 28px 8px', padding: '26px 30px', width: 'fit-content'}}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: theme.grey,
          transform: `translateY(${Math.sin((frame - i * 5) / 4) * 6}px)`,
          opacity: 0.7,
        }}
      />
    ))}
  </div>
);

/** Decorative QR-style pattern (not a real code). */
const FakeQR: React.FC<{size: number}> = ({size}) => {
  const n = 21;
  const cell = size / n;
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x * cell} y={y * cell} width={7 * cell} height={7 * cell} fill="#111" />
      <rect x={(x + 1) * cell} y={(y + 1) * cell} width={5 * cell} height={5 * cell} fill="#fff" />
      <rect x={(x + 2) * cell} y={(y + 2) * cell} width={3 * cell} height={3 * cell} fill="#111" />
    </g>
  );
  const inFinder = (x: number, y: number) => (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!inFinder(x, y) && random(`qr-${x}-${y}`) > 0.52) {
        cells.push(<rect key={`${x}_${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill="#111" />);
      }
    }
  }
  return (
    <svg width={size} height={size}>
      {cells}
      {finder(0, 0)}
      {finder(14, 0)}
      {finder(0, 14)}
    </svg>
  );
};

/** A chat row that grows from zero height so older messages scroll up. */
const Row: React.FC<{p: number; h: number; side: 'left' | 'right'; children: React.ReactNode}> = ({p, h, side, children}) => (
  <div style={{height: h * p, marginTop: 22 * p, flexShrink: 0, display: 'flex', justifyContent: side === 'right' ? 'flex-end' : 'flex-start', alignItems: 'flex-end'}}>
    <div style={{opacity: Math.min(1, p * 1.6), transform: `scale(${0.85 + 0.15 * p})`, transformOrigin: side === 'right' ? '100% 100%' : '0% 100%'}}>
      {children}
    </div>
  </div>
);

const bubbleCustomer: React.CSSProperties = {
  background: theme.navy,
  color: theme.white,
  borderRadius: '28px 28px 8px 28px',
  padding: '20px 30px',
  fontFamily: fonts.khBody,
  fontWeight: 700,
  fontSize: 36,
  lineHeight: 1.6,
  whiteSpace: 'nowrap',
};

export const AgentCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sp = (d: number) => springAt(frame, fps, d, {damping: 16, stiffness: 150});
  const window = (r: readonly [number, number]) =>
    Math.min(interpolate(frame, [r[0], r[0] + 6], [0, 1], CLAMP), interpolate(frame, [r[1] - 4, r[1]], [1, 0], CLAMP));

  const product = P[C.product];
  const total = product.price * C.orderQty;
  const notify = springAt(frame, fps, T.notify, {damping: 13, stiffness: 140});
  const sticker = springAt(frame, fps, T.sticker, {damping: 9, stiffness: 160});

  return (
    <>
      <Card style={{position: 'absolute', top: 470, left: 70, width: 940, height: 810, overflow: 'hidden', display: 'flex', flexDirection: 'column', ...enter(frame, fps, 8, 80)}}>
        {/* header */}
        <div style={{display: 'flex', alignItems: 'center', gap: 22, padding: '22px 32px', borderBottom: `2px solid ${theme.line}`}}>
          <div style={{width: 76, height: 76, borderRadius: '50%', background: theme.navy, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <StoreIcon size={42} color={theme.lime} />
          </div>
          <div style={{flex: 1, fontFamily: fonts.en, fontWeight: 800, fontSize: 32, color: theme.navy}}>{C.chatHeader}</div>
          <div style={{background: theme.lime, color: theme.navy, borderRadius: 999, padding: '6px 20px', fontFamily: fonts.en, fontWeight: 800, fontSize: 28}}>
            {C.aiTag}
          </div>
        </div>

        {/* messages */}
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 32px 32px', overflow: 'hidden'}}>
          <Row p={sp(T.ask)} h={100} side="right">
            <div style={bubbleCustomer}>{C.customerAsk}</div>
          </Row>
          <Row p={window(T.typing1)} h={68} side="left">
            <Typing frame={frame} />
          </Row>
          <Row p={sp(T.product)} h={236} side="left">
            <div style={{background: '#EEF1F6', borderRadius: '28px 28px 28px 8px', padding: 16}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 24, background: theme.white, borderRadius: theme.radius, padding: '18px 34px 18px 18px'}}>
                <div style={{width: 168, height: 168, borderRadius: 14, background: '#FFF6DA', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <BottleIcon size={130} />
                </div>
                <div style={{fontFamily: fonts.en}}>
                  <div style={{fontWeight: 700, fontSize: 34, color: theme.navy}}>{product.name}</div>
                  <div style={{fontWeight: 800, fontSize: 52, color: theme.navy, marginTop: 6}}>{usd(product.price, 2)}</div>
                </div>
              </div>
            </div>
          </Row>
          <Row p={sp(T.order)} h={100} side="right">
            <div style={bubbleCustomer}>{C.customerOrder}</div>
          </Row>
          <Row p={window(T.typing2)} h={68} side="left">
            <Typing frame={frame} />
          </Row>
          <Row p={sp(T.khqr)} h={262} side="left">
            <div style={{width: 470, borderRadius: theme.radius, overflow: 'hidden', background: theme.white, boxShadow: theme.shadowSoft, border: `2px solid ${theme.line}`}}>
              <div style={{background: KHQR_RED, color: theme.white, fontFamily: fonts.en, fontWeight: 800, fontSize: 32, padding: '12px 24px', letterSpacing: '0.06em'}}>
                {C.payBrand}
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 22, padding: 20}}>
                <FakeQR size={150} />
                <div style={{fontFamily: fonts.en, color: theme.navy}}>
                  <div style={{fontWeight: 600, fontSize: 24, color: theme.grey}}>{C.payTotalLabel}</div>
                  <div style={{fontWeight: 800, fontSize: 48}}>{usd(total, 2)}</div>
                  <div style={{fontWeight: 700, fontSize: 24, color: theme.grey, marginTop: 6}}>{C.payOrderLabel} {C.orderNo}</div>
                </div>
              </div>
            </div>
          </Row>
        </div>
      </Card>

      {/* Telegram notification */}
      <div
        style={{
          position: 'absolute',
          top: 418,
          right: 40,
          width: 640,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          background: theme.white,
          borderRadius: theme.radius,
          boxShadow: '0 26px 60px rgba(20,36,107,0.22)',
          padding: '20px 24px',
          opacity: Math.min(1, notify * 1.5),
          transform: `translateY(${(1 - notify) * -140}px)`,
        }}
      >
        <TelegramIcon size={70} />
        <div style={{fontFamily: fonts.en}}>
          <div style={{fontWeight: 600, fontSize: 22, color: theme.grey}}>{C.notifyApp}</div>
          <div style={{fontWeight: 800, fontSize: 30, color: theme.navy}}>{C.notifyTitle}</div>
          <div style={{fontWeight: 700, fontSize: 28, color: '#17784A'}}>{withSymbols(C.notifyText)}</div>
        </div>
      </div>

      {/* sticker */}
      <div
        style={{
          position: 'absolute',
          left: 46,
          top: 1300,
          background: theme.lime,
          color: theme.navy,
          borderRadius: theme.radius,
          padding: '18px 34px',
          fontFamily: fonts.khBody,
          fontWeight: 700,
          fontSize: 40,
          lineHeight: 1.55,
          boxShadow: '0 18px 40px rgba(20,36,107,0.25)',
          opacity: Math.min(1, sticker * 2),
          transform: `rotate(${-6 - (1 - sticker) * 14}deg) scale(${0.4 + 0.6 * sticker})`,
          transformOrigin: '30% 50%',
        }}
      >
        {C.sticker}
      </div>
    </>
  );
};
