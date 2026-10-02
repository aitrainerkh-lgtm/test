import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {config} from '../config';
import {C, FONT_EN, FONT_KH_BODY, RADIUS, SHADOW_CARD, SHADOW_SOFT} from '../theme';
import {Card, SceneFade, SectionLabel} from '../components/UI';
import {RichText} from '../components/RichText';
import {BottleIcon, CheckIcon, CursorIcon, MessengerIcon, SheetsIcon, TelegramIcon} from '../components/Icons';
import {clamp, countTo, ease, enterStyle, prog, springAt, usd} from '../anim';
import {OVERLAP, Slot} from '../timeline';
import {Sfx, popFor} from '../components/Sfx';

const B = config.build;
const CARD_TOP = 480;

/** Title (English, last word highlighted) + Khmer subtitle. */
const PartHeader: React.FC<{title: string; subtitle: string}> = ({title, subtitle}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 238,
          width: '100%',
          textAlign: 'center',
          fontFamily: FONT_EN,
          fontWeight: 800,
          fontSize: 96,
          letterSpacing: -2.5,
          lineHeight: 1.1,
          color: C.navy,
          ...enterStyle(frame, fps, 0),
        }}
      >
        <RichText text={title} autoLast highlight={prog(frame, 14, 20)} barBottom="0.04em" barHeight="0.3em" />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 358,
          width: '100%',
          textAlign: 'center',
          fontFamily: FONT_KH_BODY,
          fontWeight: 700,
          fontSize: 46,
          color: C.grey,
          ...enterStyle(frame, fps, 6),
        }}
      >
        <RichText text={subtitle} />
      </div>
    </>
  );
};

const scaleTime = (duration: number) => {
  const k = Math.min(1, duration / 240);
  return (f: number) => Math.round(f * k);
};

// a) Stock & Sales -------------------------------------------------
const StockCard: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = B.stock;
  const t = scaleTime(duration);
  const sale = t(108);

  const sales = countTo(frame, sale, t(40), s.salesFrom, s.salesTo);
  const stock = countTo(frame, sale, t(40), s.stockFrom, s.stockTo);
  const flash = interpolate(frame, [sale, sale + 8, sale + 50, sale + 80], [0, 1, 1, 0.35], clamp);
  const diff = s.salesTo - s.salesFrom;

  return (
    <Card style={{position: 'absolute', top: CARD_TOP, left: 64, right: 64, padding: 40, ...enterStyle(frame, fps, 8, {y: 80})}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: 32, color: C.navy}}>{s.cardTitle}</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: '#E6F4EA',
            padding: '10px 20px',
            borderRadius: 999,
            fontFamily: FONT_EN,
            fontWeight: 700,
            fontSize: 26,
            color: '#137333',
            ...enterStyle(frame, fps, 18, {scale: 0.3, y: 0}),
          }}
        >
          <SheetsIcon size={30} />
          {s.badge}
        </div>
      </div>

      <div style={{display: 'flex', gap: 24, marginTop: 34}}>
        {[
          {label: s.salesLabel, value: usd(sales), chip: diff > 0 ? `+${usd(diff)}` : null},
          {label: s.stockLabel, value: usd(stock), chip: null},
        ].map((box, i) => (
          <div
            key={box.label}
            style={{
              flex: 1,
              background: C.background,
              borderRadius: RADIUS,
              padding: '26px 28px',
              position: 'relative',
              ...enterStyle(frame, fps, 16 + i * 5, {y: 30}),
            }}
          >
            <div style={{fontFamily: FONT_EN, fontWeight: 600, fontSize: 28, color: C.grey}}>{box.label}</div>
            <div style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: 70, color: C.navy, letterSpacing: -1.5, marginTop: 4}}>
              {box.value}
            </div>
            {box.chip && (
              <div
                style={{
                  position: 'absolute',
                  right: 20,
                  top: 20,
                  background: C.lime,
                  color: C.navy,
                  fontFamily: FONT_EN,
                  fontWeight: 800,
                  fontSize: 26,
                  padding: '6px 16px',
                  borderRadius: 999,
                  ...enterStyle(frame, fps, sale + t(30), {scale: 0.6, y: 10}),
                }}
              >
                {box.chip}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{marginTop: 30, display: 'flex', flexDirection: 'column', gap: 16}}>
        {s.items.map((item, i) => {
          const sold = 'soldTo' in item && item.soldTo !== undefined;
          const left = sold && frame >= sale + t(14) ? (item as {soldTo: number}).soldTo : item.left;
          const bump = sold ? springAt(frame, fps, sale + t(14), 300, 12) : 0;
          const f = sold ? flash : 0;
          return (
            <div
              key={item.name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '24px 28px',
                borderRadius: RADIUS,
                border: `3px solid ${f > 0.05 ? `rgba(95,179,28,${f})` : '#EDF0F5'}`,
                background: `rgba(139,224,60,${0.22 * f})`,
                ...enterStyle(frame, fps, 26 + i * 6, {y: 30}),
              }}
            >
              <div style={{fontFamily: FONT_EN, fontWeight: 700, fontSize: 36, color: C.navy}}>{item.name}</div>
              <div
                style={{
                  fontFamily: FONT_EN,
                  fontWeight: 800,
                  fontSize: 30,
                  color: f > 0.5 ? C.navy : C.grey,
                  background: f > 0.5 ? C.lime : C.background,
                  padding: '8px 20px',
                  borderRadius: 999,
                  transform: `scale(${1 + 0.15 * Math.sin(bump * Math.PI)})`,
                }}
              >
                {left} {s.leftSuffix}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{display: 'flex', justifyContent: 'center', marginTop: 30, height: 84}}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: C.successGreen,
            color: '#fff',
            fontFamily: FONT_EN,
            fontWeight: 800,
            fontSize: 32,
            padding: '18px 36px',
            borderRadius: 999,
            boxShadow: '0 12px 26px rgba(34,164,93,0.35)',
            ...enterStyle(frame, fps, sale + t(40), {y: 60}),
          }}
        >
          <RichText text={s.toast} symbolColor="#fff" />
        </div>
      </div>
      <Sfx name="pop1" at={18} volume={0.4} />
      {s.items.map((item, i) => (
        <Sfx key={item.name} name={popFor(i)} at={26 + i * 6} volume={0.3} />
      ))}
      <Sfx name="click" at={sale - 2} volume={0.6} />
      <Sfx name="coin" at={sale + t(4)} volume={0.85} />
      <Sfx name="pop4" at={sale + t(30)} volume={0.5} />
      <Sfx name="success" at={sale + t(40)} volume={0.55} />
    </Card>
  );
};

// b) Billing -------------------------------------------------------
const BillingCard: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const b = B.billing;
  const t = scaleTime(duration);
  const total = b.lines.reduce((a, l) => a + l.qty * l.price, 0);
  const lineAt = (i: number) => t(40 + i * 22);
  const totalAt = t(40 + b.lines.length * 22 + 10);
  const totalP = springAt(frame, fps, totalAt, 120, 16);

  return (
    <div style={{position: 'absolute', top: CARD_TOP + 10, left: 110, right: 110, ...enterStyle(frame, fps, 8, {y: 90})}}>
      <div
        style={{
          background: C.white,
          borderRadius: `${RADIUS}px ${RADIUS}px 0 0`,
          boxShadow: SHADOW_CARD,
          padding: '56px 52px 48px',
        }}
      >
        <div style={{textAlign: 'center', fontFamily: FONT_EN, fontWeight: 800, fontSize: 52, letterSpacing: 6, color: C.navy}}>
          {b.shop}
        </div>
        <div style={{textAlign: 'center', fontFamily: FONT_EN, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: C.grey, marginTop: 12}}>
          {b.receiptLabel}
        </div>
        <div style={{textAlign: 'center', fontFamily: FONT_EN, fontWeight: 800, fontSize: 28, letterSpacing: 2, color: C.navy, marginTop: 6}}>
          {b.invoiceNo}
        </div>
        <div style={{borderTop: '3px dashed #D5DBE6', margin: '34px 0 26px'}} />
        {b.lines.map((l, i) => {
          const p = prog(frame, lineAt(i), 14);
          return (
            <div
              key={l.item}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 12,
                fontFamily: FONT_EN,
                fontSize: 36,
                color: C.navy,
                padding: '20px 0',
                opacity: p,
                clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
              }}
            >
              <span style={{fontWeight: 700}}>{l.item}</span>
              <span style={{fontWeight: 600, color: C.grey}}>x{l.qty}</span>
              <span style={{flex: 1, borderBottom: '4px dotted #C9D0DD', transform: 'translateY(-6px)'}} />
              <span style={{fontWeight: 800}}>{usd(l.qty * l.price, 2)}</span>
            </div>
          );
        })}
        <div style={{borderTop: '3px dashed #D5DBE6', margin: '26px 0 30px'}} />
        <div style={{overflow: 'hidden', borderRadius: RADIUS}}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: C.navy,
              color: '#fff',
              fontFamily: FONT_EN,
              borderRadius: RADIUS,
              padding: '28px 34px',
              transform: `translateX(${(1 - totalP) * -110}%)`,
            }}
          >
            <span style={{fontWeight: 800, fontSize: 32, letterSpacing: 3}}>{b.totalLabel}</span>
            <span style={{fontWeight: 800, fontSize: 52, color: C.lime}}>{usd(total, 2)}</span>
          </div>
        </div>
      </div>
      {/* torn paper edge */}
      <svg width="100%" height="28" viewBox="0 0 800 28" preserveAspectRatio="none" style={{display: 'block'}}>
        <path
          d={`M0 0 H800 V8 ${Array.from({length: 20})
            .map((_, i) => `L${800 - i * 40 - 20} 28 L${800 - (i + 1) * 40} 8`)
            .join(' ')} Z`}
          fill="#fff"
        />
      </svg>
      {b.lines.map((l, i) => (
        <Sfx key={l.item} name="print" at={lineAt(i)} volume={0.8} />
      ))}
      <Sfx name="swipe" at={totalAt - 2} volume={0.6} />
      <Sfx name="coin" at={totalAt + 6} volume={0.85} />
    </div>
  );
};

// c) Leave Tracker -------------------------------------------------
const LeaveCard: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const l = B.leave;
  const t = scaleTime(duration);
  const clickAt = t(100);
  const approved = frame >= clickAt + 3;

  // Cursor path: from the lower right to the Approve button.
  const move = prog(frame, t(50), clickAt - t(50) - 4, ease);
  const cx = interpolate(move, [0, 1], [880, 300]);
  const cy = interpolate(move, [0, 1], [1140, 898]);
  const press = interpolate(frame, [clickAt - 2, clickAt + 2, clickAt + 8], [1, 0.9, 1], clamp);
  const cursorOpacity = interpolate(frame, [t(46), t(54), clickAt + 30, clickAt + 42], [0, 1, 1, 0], clamp);
  const ripple = prog(frame, clickAt, 20);

  return (
    <>
      <Card style={{position: 'absolute', top: CARD_TOP + 60, left: 64, right: 64, padding: 40, ...enterStyle(frame, fps, 8, {y: 80})}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 30}}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: C.navy,
              color: '#fff',
              fontFamily: FONT_EN,
              fontWeight: 800,
              fontSize: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {l.initials}
          </div>
          <div>
            <div style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: 48, color: C.navy}}>{l.name}</div>
            <div style={{fontFamily: FONT_EN, fontWeight: 600, fontSize: 30, color: C.grey, marginTop: 6}}>{l.detail}</div>
          </div>
        </div>
        <div style={{display: 'flex', gap: 22, marginTop: 40}}>
          <div
            style={{
              flex: 1,
              height: 100,
              borderRadius: RADIUS,
              background: approved ? C.successGreen : C.navy,
              color: '#fff',
              fontFamily: FONT_EN,
              fontWeight: 800,
              fontSize: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              transform: `scale(${press})`,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: approved ? '0 12px 26px rgba(34,164,93,0.35)' : 'none',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 600,
                height: 600,
                marginLeft: -300,
                marginTop: -300,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.35)',
                transform: `scale(${ripple})`,
                opacity: frame >= clickAt ? 1 - ripple : 0,
              }}
            />
            {approved ? <RichText text={l.approved} symbolColor="#fff" /> : l.approve}
          </div>
          <div
            style={{
              flex: 1,
              height: 100,
              borderRadius: RADIUS,
              background: '#fff',
              border: '3px solid #DCE1EA',
              boxSizing: 'border-box',
              color: C.navy,
              fontFamily: FONT_EN,
              fontWeight: 800,
              fontSize: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: approved ? 0.35 : 1,
            }}
          >
            {l.reject}
          </div>
        </div>
      </Card>

      <Card style={{position: 'absolute', top: 960, left: 64, right: 64, padding: '34px 30px', ...enterStyle(frame, fps, 20, {y: 80})}}>
        <div style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: 30, color: C.navy, marginLeft: 10}}>{l.weekLabel}</div>
        <div style={{display: 'flex', gap: 12, marginTop: 24}}>
          {l.week.map((d, i) => {
            const isLeave = 'leave' in d && d.leave;
            const at = clickAt + t(16) + (isLeave ? l.week.filter((w, j) => j < i && 'leave' in w).length * t(10) : 0);
            const on = isLeave ? springAt(frame, fps, at, 200, 14) : 0;
            return (
              <div
                key={d.day}
                style={{
                  flex: 1,
                  borderRadius: RADIUS,
                  padding: '20px 0',
                  textAlign: 'center',
                  background: on > 0.02 ? `rgba(139,224,60,${on})` : C.background,
                  transform: `scale(${1 + 0.08 * Math.sin(on * Math.PI)})`,
                }}
              >
                <div style={{fontFamily: FONT_EN, fontWeight: 700, fontSize: 22, color: on > 0.5 ? C.navy : C.grey, letterSpacing: 1}}>
                  {d.day}
                </div>
                <div style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: 44, color: C.navy, marginTop: 4}}>{d.date}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <div
        style={{
          position: 'absolute',
          left: cx,
          top: cy,
          opacity: cursorOpacity,
          transform: `scale(${press})`,
          filter: 'drop-shadow(0 6px 10px rgba(20,36,107,0.3))',
        }}
      >
        <CursorIcon size={80} />
      </div>
      <Sfx name="click" at={clickAt} volume={1} />
      <Sfx name="success" at={clickAt + 4} volume={0.6} />
      {l.week.map((d, i) =>
        'leave' in d && d.leave ? (
          <Sfx key={d.day} name={popFor(i)} at={clickAt + t(16) + l.week.filter((w, j) => j < i && 'leave' in w).length * t(10)} volume={0.45} />
        ) : null,
      )}
    </>
  );
};

// d) AI Sales Agent ------------------------------------------------
const QrPattern: React.FC<{size: number; seed?: number; color?: string}> = ({size, seed = 7, color = '#111'}) => {
  const n = 25;
  const cell = size / n;
  let x = seed;
  const rand = () => {
    x = (x * 16807) % 2147483647;
    return x / 2147483647;
  };
  const finder = (r: number, c: number) => {
    const inBox = (r0: number, c0: number) => r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7;
    return inBox(0, 0) || inBox(0, n - 7) || inBox(n - 7, 0);
  };
  const rects: React.ReactNode[] = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      const v = rand();
      if (finder(r, c) || (r < 8 && c < 8) || (r < 8 && c >= n - 8) || (r >= n - 8 && c < 8)) continue;
      if (v > 0.52) rects.push(<rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell + 0.3} height={cell + 0.3} fill={color} />);
    }
  const Finder = ({r, c}: {r: number; c: number}) => (
    <g>
      <rect x={c * cell} y={r * cell} width={cell * 7} height={cell * 7} fill={color} />
      <rect x={(c + 1) * cell} y={(r + 1) * cell} width={cell * 5} height={cell * 5} fill="#fff" />
      <rect x={(c + 2) * cell} y={(r + 2) * cell} width={cell * 3} height={cell * 3} fill={color} />
    </g>
  );
  return (
    <svg width={size} height={size}>
      {rects}
      <Finder r={0} c={0} />
      <Finder r={0} c={n - 7} />
      <Finder r={n - 7} c={0} />
    </svg>
  );
};

const AiAvatar = () => (
  <div
    style={{
      width: 56,
      height: 56,
      borderRadius: '50%',
      background: C.navy,
      color: C.lime,
      fontFamily: FONT_EN,
      fontWeight: 800,
      fontSize: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    AI
  </div>
);

const Typing: React.FC<{from: number; to: number}> = ({from, to}) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= to) return null;
  return (
    <div style={{display: 'flex', alignItems: 'flex-end', gap: 14, opacity: prog(frame, from, 6)}}>
      <AiAvatar />
      <div style={{background: '#EEF1F6', borderRadius: 28, padding: '24px 30px', display: 'flex', gap: 10}}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: C.grey,
              transform: `translateY(${Math.sin((frame - from) / 5 - i * 0.9) * -6}px)`,
              opacity: 0.5 + 0.5 * Math.max(0, Math.sin((frame - from) / 5 - i * 0.9)),
            }}
          />
        ))}
      </div>
    </div>
  );
};

const AgentCard: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const a = B.agent;
  const t = scaleTime(duration);
  const m1 = t(16);
  const m2 = t(56);
  const m3 = t(92);
  const m4 = t(122);
  const notifyAt = t(156);
  const stickerAt = t(176);
  const scroll = springAt(frame, fps, m4, 120, 18) * 210;

  const show = (at: number) => (frame >= at ? enterStyle(frame, fps, at, {y: 40, scale: 0.12}) : {display: 'none'});

  return (
    <>
      <Card style={{position: 'absolute', top: CARD_TOP - 10, left: 64, right: 64, height: 1000, overflow: 'hidden', ...enterStyle(frame, fps, 6, {y: 80})}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 20, padding: '26px 34px', borderBottom: '2px solid #EDF0F5'}}>
          <MessengerIcon size={64} />
          <div style={{flex: 1}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
              <span style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: 32, color: C.navy}}>{a.chatName}</span>
              <span
                style={{background: C.lime, color: C.navy, fontFamily: FONT_EN, fontWeight: 800, fontSize: 22, padding: '4px 12px', borderRadius: 8}}
              >
                AI
              </span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT_EN, fontWeight: 600, fontSize: 24, color: C.grey, marginTop: 4}}>
              <span style={{width: 12, height: 12, borderRadius: '50%', background: C.successGreen}} />
              {a.chatStatus}
            </div>
          </div>
        </div>

        <div style={{position: 'relative', height: 880, overflow: 'hidden'}}>
          <div style={{padding: '30px 34px', display: 'flex', flexDirection: 'column', gap: 24, transform: `translateY(${-scroll}px)`}}>
            <div style={{alignSelf: 'flex-end', ...show(m1)}}>
              <div style={{background: C.navy, color: '#fff', fontFamily: FONT_KH_BODY, fontSize: 36, padding: '18px 30px', borderRadius: '28px 28px 8px 28px'}}>
                {a.customerAsk}
              </div>
            </div>

            <Typing from={m1 + t(14)} to={m2} />

            <div style={{display: 'flex', alignItems: 'flex-end', gap: 14, ...show(m2)}}>
              <AiAvatar />
              <div style={{background: '#EEF1F6', borderRadius: '28px 28px 28px 8px', padding: 16}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 22, background: '#fff', borderRadius: RADIUS, padding: '16px 28px 16px 16px', boxShadow: SHADOW_SOFT}}>
                  <div style={{width: 120, height: 120, borderRadius: RADIUS, background: '#FFF4D6', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <BottleIcon size={96} />
                  </div>
                  <div>
                    <div style={{fontFamily: FONT_EN, fontWeight: 700, fontSize: 32, color: C.navy}}>{a.productName}</div>
                    <div style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: 44, color: C.navy, marginTop: 4}}>{a.productPrice}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{alignSelf: 'flex-end', ...show(m3)}}>
              <div style={{background: C.navy, color: '#fff', fontFamily: FONT_KH_BODY, fontSize: 36, padding: '18px 30px', borderRadius: '28px 28px 8px 28px'}}>
                {a.customerOrder}
              </div>
            </div>

            <Typing from={m3 + t(10)} to={m4} />

            <div style={{display: 'flex', alignItems: 'flex-end', gap: 14, ...show(m4)}}>
              <AiAvatar />
              <div style={{width: 470, borderRadius: RADIUS, overflow: 'hidden', boxShadow: SHADOW_CARD, background: '#fff'}}>
                <div style={{background: '#E1232E', color: '#fff', fontFamily: FONT_EN, fontWeight: 800, fontSize: 34, letterSpacing: 2, padding: '16px 0', textAlign: 'center'}}>
                  KHQR
                </div>
                <div style={{display: 'flex', justifyContent: 'center', padding: '26px 0 10px'}}>
                  <QrPattern size={230} />
                </div>
                <div style={{textAlign: 'center', fontFamily: FONT_EN, fontWeight: 800, fontSize: 28, color: C.navy, padding: '8px 0 24px', whiteSpace: 'nowrap'}}>
                  {a.khqrTotal} <span style={{color: C.grey}}>·</span> {a.orderNo}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Telegram notification */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 24,
          width: 600,
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 24,
          boxShadow: '0 24px 50px rgba(20,36,107,0.22)',
          padding: '16px 22px',
          display: 'flex',
          gap: 20,
          alignItems: 'center',
          zIndex: 5,
          opacity: interpolate(frame, [notifyAt, notifyAt + 6], [0, 1], clamp),
          transform: `translateY(${(1 - springAt(frame, fps, notifyAt, 160, 15)) * -240}px)`,
        }}
      >
        <TelegramIcon size={64} />
        <div style={{flex: 1}}>
          <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONT_EN, fontSize: 22, color: C.grey, fontWeight: 600}}>
            <span>{a.notifyApp}</span>
            <span>now</span>
          </div>
          <div style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: 28, color: C.navy, marginTop: 0}}>{a.notifyTitle}</div>
          <div style={{fontFamily: FONT_EN, fontWeight: 700, fontSize: 27, color: C.navy, marginTop: 0}}>
            <RichText text={a.notifyText} symbolColor={C.successGreen} />
          </div>
        </div>
      </div>

      {/* Lime sticker */}
      <div
        style={{
          position: 'absolute',
          left: 40,
          top: 1372,
          zIndex: 6,
          opacity: interpolate(frame, [stickerAt, stickerAt + 4], [0, 1], clamp),
          transform: `rotate(-7deg) scale(${springAt(frame, fps, stickerAt, 220, 11)})`,
          transformOrigin: '30% 50%',
        }}
      >
        <div
          style={{
            background: C.lime,
            color: C.navy,
            fontFamily: FONT_KH_BODY,
            fontWeight: 700,
            fontSize: 40,
            padding: '20px 36px',
            borderRadius: RADIUS,
            border: '5px solid #fff',
            boxShadow: '0 18px 36px rgba(20,36,107,0.25)',
            whiteSpace: 'nowrap',
          }}
        >
          <RichText text={a.sticker} />
        </div>
      </div>
      {[m1, m3].map((m) => (
        <Sfx key={m} name="message" at={m} volume={0.7} />
      ))}
      {[m2, m4].map((m) => (
        <Sfx key={m} name="message" at={m} volume={0.55} />
      ))}
      <Sfx name="notify" at={notifyAt} volume={0.7} />
      <Sfx name="pop4" at={stickerAt} volume={0.6} />
    </>
  );
};

// Section wrapper ---------------------------------------------------
const PARTS = [
  {key: 'stock', Comp: StockCard, title: B.stock.title, subtitle: B.stock.subtitle},
  {key: 'billing', Comp: BillingCard, title: B.billing.title, subtitle: B.billing.subtitle},
  {key: 'leave', Comp: LeaveCard, title: B.leave.title, subtitle: B.leave.subtitle},
  {key: 'agent', Comp: AgentCard, title: B.agent.title, subtitle: B.agent.subtitle},
] as const;

/** 02 BUILD WITH AI: the section label stays while the four cards change. */
export const Build: React.FC<{slots: Slot[]; duration: number}> = ({slots, duration}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const base = slots[0].from;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center', ...enterStyle(frame, fps, 0)}}>
        <SectionLabel num={B.labelNumber} label={B.label} />
      </div>
      {PARTS.map(({key, Comp, title, subtitle}, i) => {
        const slot = slots.find((s) => s.key === key)!;
        const from = slot.from - base;
        const last = i === PARTS.length - 1;
        const len = last ? duration - from : slot.duration + OVERLAP;
        return (
          <React.Fragment key={key}>
          {i > 0 && <Sfx name="whoosh" at={from - 10} volume={0.6} />}
          <Sequence from={from} durationInFrames={len} layout="none">
            <SceneFade duration={len} overlap={OVERLAP} fadeIn={i > 0} fadeOut={!last}>
              <PartHeader title={title} subtitle={subtitle} />
              <Comp duration={slot.duration} />
            </SceneFade>
          </Sequence>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
