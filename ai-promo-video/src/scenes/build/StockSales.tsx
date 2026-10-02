import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CheckCircle2, TrendingDown, TrendingUp} from 'lucide-react';
import {config} from '../../config';
import {C, FONT_EN, usd} from '../../theme';
import {Card, Enter, useCount} from '../../components/ui';
import {SheetsIcon} from '../../components/icons';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Kpi: React.FC<{
  label: string;
  value: string;
  chip: string | null;
  chipColor: string;
  chipBg: string;
  icon: React.ReactNode;
  chipP: number;
}> = ({label, value, chip, chipColor, chipBg, icon, chipP}) => (
  <div style={{flex: 1, background: C.bg, borderRadius: 16, padding: '26px 28px', position: 'relative'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT_EN, fontWeight: 700, fontSize: 28, color: C.muted}}>
      {icon}
      {label}
    </div>
    <div style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: 72, color: C.navy, marginTop: 6, fontVariantNumeric: 'tabular-nums'}}>
      {value}
    </div>
    {chip ? (
      <div
        style={{
          position: 'absolute',
          top: 22,
          right: 20,
          background: chipBg,
          color: chipColor,
          fontFamily: FONT_EN,
          fontWeight: 800,
          fontSize: 28,
          padding: '6px 16px',
          borderRadius: 999,
          opacity: chipP,
          transform: `scale(${0.6 + 0.4 * chipP})`,
        }}
      >
        {chip}
      </div>
    ) : null}
  </div>
);

export const StockSales: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = config.build.stock;

  const rowIn = spring({frame: frame - 40, fps, config: {damping: 15}});
  const sales = useCount(s.salesBefore, s.salesAfter, 62, 50);
  const stock = useCount(s.stockBefore, s.stockAfter, 62, 50);
  const chipP = spring({frame: frame - 112, fps, config: {damping: 11}});
  const toastP = spring({frame: frame - 125, fps, config: {damping: 14}});
  const rowFlash = interpolate(frame, [40, 60, 130], [1, 1, 0], clamp);

  const cell = (w: number, align: 'left' | 'right' = 'left'): React.CSSProperties => ({
    width: w,
    textAlign: align,
    fontVariantNumeric: 'tabular-nums',
  });

  return (
    <Enter delay={6} style={{width: 940}}>
      <Card style={{padding: 36, position: 'relative', overflow: 'hidden'}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: 36, color: C.navy}}>
            {config.build.shopName}
            <div style={{fontWeight: 600, fontSize: 26, color: C.muted, marginTop: 4}}>Sales & Stock · Today</div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: '#E7F6EE',
              borderRadius: 999,
              padding: '10px 22px 10px 16px',
              fontFamily: FONT_EN,
              fontWeight: 800,
              fontSize: 26,
              color: '#0B7A43',
            }}
          >
            <SheetsIcon size={40} />
            Google Sheets
          </div>
        </div>

        <div style={{display: 'flex', gap: 20, marginTop: 30}}>
          <Kpi
            label="Today's Sales"
            value={usd(Math.round(sales), 0)}
            chip={`+${usd(s.salesAfter - s.salesBefore, 0)}`}
            chipColor="#0B7A43"
            chipBg={C.limeSoft}
            icon={<TrendingUp size={28} color={C.success} />}
            chipP={chipP}
          />
          <Kpi
            label="Stock Value"
            value={usd(Math.round(stock), 0)}
            chip={`−${usd(s.stockBefore - s.stockAfter, 0)}`}
            chipColor={C.muted}
            chipBg={C.line}
            icon={<TrendingDown size={28} color={C.muted} />}
            chipP={chipP}
          />
        </div>

        <div style={{marginTop: 30, border: `2px solid ${C.line}`, borderRadius: 14, overflow: 'hidden', fontFamily: FONT_EN, fontSize: 28, color: C.navy}}>
          <div style={{display: 'flex', gap: 10, padding: '16px 22px', background: C.bg, fontWeight: 800, color: C.muted, fontSize: 24, letterSpacing: 1}}>
            <div style={cell(110)}>TIME</div>
            <div style={{...cell(380)}}>ITEM</div>
            <div style={cell(110, 'right')}>QTY</div>
            <div style={{...cell(200, 'right')}}>AMOUNT</div>
          </div>
          {s.rows.map((r) => (
            <div key={r.time} style={{display: 'flex', gap: 10, padding: '15px 22px', borderTop: `2px solid ${C.line}`, fontWeight: 600}}>
              <div style={{...cell(110), color: C.muted}}>{r.time}</div>
              <div style={cell(380)}>{r.item}</div>
              <div style={cell(110, 'right')}>{r.qty}</div>
              <div style={cell(200, 'right')}>{usd(r.amount)}</div>
            </div>
          ))}
          <div
            style={{
              display: 'flex',
              gap: 10,
              padding: `${15 * rowIn}px 22px`,
              maxHeight: 70 * rowIn,
              overflow: 'hidden',
              borderTop: `2px solid ${C.line}`,
              fontWeight: 800,
              background: `rgba(139,224,60,${0.35 * rowFlash})`,
              opacity: rowIn,
            }}
          >
            <div style={{...cell(110), color: C.muted}}>{s.newRow.time}</div>
            <div style={cell(380)}>{s.newRow.item}</div>
            <div style={cell(110, 'right')}>{s.newRow.qty}</div>
            <div style={cell(200, 'right')}>{usd(s.newRow.amount)}</div>
          </div>
        </div>

        <div style={{height: 110}} />
        <div
          style={{
            position: 'absolute',
            left: 36,
            right: 36,
            bottom: 30,
            display: 'flex',
            justifyContent: 'center',
            transform: `translateY(${(1 - toastP) * 120}px)`,
            opacity: toastP,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              background: C.success,
              color: C.white,
              borderRadius: 16,
              padding: '18px 32px',
              fontFamily: FONT_EN,
              fontWeight: 800,
              fontSize: 32,
              boxShadow: '0 14px 30px rgba(47,179,68,0.35)',
            }}
          >
            <CheckCircle2 size={36} strokeWidth={3} />
            {s.toast} · {s.newRow.item} × {s.newRow.qty}
          </div>
        </div>
      </Card>
    </Enter>
  );
};
