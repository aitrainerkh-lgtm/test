import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {config} from '../../config';
import {CLAMP, enter, prog, springAt, usd} from '../../lib/anim';
import {StoreIcon} from '../../components/Icons';
import {fonts, theme} from '../../theme';

const C = config.scenes.build.billing;
const P = config.shop.products as Record<string, {name: string; price: number}>;

const LINE_START = 44;
const LINE_GAP = 20;

export const BillingCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lines = (C.lines as {product: string; qty: number}[]).map((l) => ({
    label: `${P[l.product].name} x${l.qty}`,
    amount: P[l.product].price * l.qty,
  }));
  const total = lines.reduce((a, l) => a + l.amount, 0);
  const totalAt = LINE_START + lines.length * LINE_GAP + 12;
  const totalP = springAt(frame, fps, totalAt, {damping: 16, stiffness: 120});

  // receipt "prints" out of the slot
  const printed = interpolate(frame, [10, 36], [0, 1], CLAMP);

  return (
    <div style={{position: 'absolute', top: 470, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      {/* printer slot */}
      <div style={{width: 820, height: 30, borderRadius: 15, background: theme.navy, boxShadow: theme.shadowSoft, zIndex: 2, ...enter(frame, fps, 0, 30)}} />
      <div style={{width: 760, marginTop: -14, overflow: 'hidden', paddingBottom: 40}}>
        <div
          style={{
            transform: `translateY(${(printed - 1) * 100}%)`,
            background: theme.white,
            borderRadius: `0 0 ${theme.radius}px ${theme.radius}px`,
            boxShadow: theme.shadow,
            padding: '54px 50px 46px',
          }}
        >
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
            <div style={{width: 74, height: 74, borderRadius: 18, background: theme.navy, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <StoreIcon size={44} color={theme.lime} />
            </div>
            <div style={{fontFamily: fonts.en, fontWeight: 800, fontSize: 46, color: theme.navy, letterSpacing: '0.08em', marginTop: 6}}>
              {config.shop.name}
            </div>
            <div style={{fontFamily: fonts.en, fontWeight: 700, fontSize: 24, color: theme.grey, letterSpacing: '0.2em'}}>{C.receiptLabel}</div>
            <div
              style={{
                fontFamily: fonts.en,
                fontWeight: 700,
                fontSize: 26,
                color: theme.navy,
                background: theme.limeSoft,
                borderRadius: 999,
                padding: '4px 18px',
              }}
            >
              {C.invoiceNo}
            </div>
          </div>

          <div style={{borderTop: `3px dashed ${theme.line}`, margin: '30px 0 18px'}} />

          {lines.map((l, i) => {
            const t = LINE_START + i * LINE_GAP;
            const o = interpolate(frame, [t, t + 8], [0, 1], CLAMP);
            return (
              <div
                key={l.label}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 12,
                  padding: '14px 0',
                  fontFamily: fonts.en,
                  fontSize: 34,
                  color: theme.navy,
                  opacity: o,
                  transform: `translateY(${(1 - o) * -16}px)`,
                }}
              >
                <span style={{fontWeight: 700}}>{l.label}</span>
                <span style={{flex: 1, borderBottom: `3px dotted ${theme.greyLight}`, transform: 'translateY(-8px)'}} />
                <span style={{fontWeight: 800, fontVariantNumeric: 'tabular-nums'}}>{usd(l.amount, 2)}</span>
              </div>
            );
          })}

          <div style={{marginTop: 24, overflow: 'hidden', borderRadius: 14}}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: theme.navy,
                color: theme.white,
                borderRadius: 14,
                padding: '24px 30px',
                fontFamily: fonts.en,
                transform: `translateX(${(1 - totalP) * -105}%)`,
              }}
            >
              <span style={{fontWeight: 800, fontSize: 32, letterSpacing: '0.1em'}}>{C.totalLabel}</span>
              <span style={{fontWeight: 800, fontSize: 48, color: theme.lime, opacity: prog(frame, totalAt + 8, 10)}}>{usd(total, 2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
