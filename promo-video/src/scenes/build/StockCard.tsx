import {interpolate, interpolateColors, useCurrentFrame, useVideoConfig} from 'remotion';
import {config} from '../../config';
import {CLAMP, enter, prog, springAt, usd} from '../../lib/anim';
import {withSymbols} from '../../components/Rich';
import {LineIcon, SheetsIcon} from '../../components/Icons';
import {Card} from '../../components/UI';
import {fonts, theme} from '../../theme';

const C = config.scenes.build.stock;
const SALE = 95;

export const StockCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const countP = prog(frame, SALE, 40);
  const sales = interpolate(countP, [0, 1], [C.todaySalesFrom, C.todaySalesTo]);
  const stock = interpolate(countP, [0, 1], [C.stockValueFrom, C.stockValueTo]);
  const delta = C.todaySalesTo - C.todaySalesFrom;
  const chip = springAt(frame, fps, SALE + 14, {damping: 11, stiffness: 160});
  const toast = springAt(frame, fps, SALE + 24, {damping: 14, stiffness: 130});
  const flash = interpolate(frame, [SALE, SALE + 8, SALE + 40, SALE + 70], [0, 1, 1, 0], CLAMP);
  const roll = prog(frame, SALE + 10, 14);

  return (
    <Card style={{position: 'absolute', top: 470, left: 70, width: 940, padding: '36px 40px 130px', ...enter(frame, fps, 8, 80)}}>
      {/* header */}
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{fontFamily: fonts.en, fontWeight: 800, fontSize: 34, color: theme.navy}}>{C.sheetTitle}</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#E7F6EC',
            color: '#17784A',
            borderRadius: 999,
            padding: '8px 18px 8px 12px',
            fontFamily: fonts.en,
            fontWeight: 700,
            fontSize: 26,
          }}
        >
          <SheetsIcon size={34} />
          {C.badge}
        </div>
      </div>
      <div style={{height: 2, background: theme.line, margin: '26px 0'}} />

      {/* stats */}
      <div style={{display: 'flex', gap: 24, ...enter(frame, fps, 16, 40)}}>
        {[
          {label: C.todaySalesLabel, value: usd(sales), withChip: true},
          {label: C.stockValueLabel, value: usd(stock), withChip: false},
        ].map((b) => (
          <div key={b.label} style={{flex: 1, background: theme.panel, borderRadius: theme.radius, padding: '22px 28px'}}>
            <div style={{fontFamily: fonts.en, fontWeight: 600, fontSize: 28, color: theme.grey}}>{b.label}</div>
            <div style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 4}}>
              <div style={{fontFamily: fonts.en, fontWeight: 800, fontSize: 64, color: theme.navy, fontVariantNumeric: 'tabular-nums'}}>
                {b.value}
              </div>
              {b.withChip ? (
                <div
                  style={{
                    background: theme.lime,
                    color: theme.navy,
                    borderRadius: 999,
                    padding: '4px 14px',
                    fontFamily: fonts.en,
                    fontWeight: 800,
                    fontSize: 26,
                    opacity: Math.min(1, chip * 1.5),
                    transform: `scale(${chip})`,
                  }}
                >
                  +{usd(delta)}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* item rows */}
      <div style={{marginTop: 20}}>
        {C.items.map((item: {name: string; left: number}, i: number) => {
          const sold = i === C.soldItemIndex;
          const bg = sold ? interpolateColors(flash, [0, 1], ['rgba(139,224,60,0)', 'rgba(139,224,60,0.32)']) : 'transparent';
          const low = item.left < 10;
          return (
            <div
              key={item.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 22,
                padding: '18px 16px',
                borderBottom: i < C.items.length - 1 ? `2px solid ${theme.line}` : 'none',
                background: bg,
                borderRadius: 12,
                ...enter(frame, fps, 24 + i * 6, 30),
              }}
            >
              <div style={{width: 64, height: 64, borderRadius: 14, background: theme.limeSoft, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <LineIcon name="box" size={36} />
              </div>
              <div style={{flex: 1, fontFamily: fonts.en, fontWeight: 700, fontSize: 36, color: theme.navy}}>{item.name}</div>
              <div
                style={{
                  background: low ? '#FDF1DE' : theme.panel,
                  color: low ? '#B06A00' : theme.navy,
                  borderRadius: 999,
                  padding: '8px 20px',
                  fontFamily: fonts.en,
                  fontWeight: 700,
                  fontSize: 28,
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <span style={{position: 'relative', display: 'inline-block', height: 36, overflow: 'hidden', fontVariantNumeric: 'tabular-nums'}}>
                  {sold ? (
                    <span style={{display: 'flex', flexDirection: 'column', transform: `translateY(${-roll * 36}px)`, lineHeight: '36px'}}>
                      <span>{item.left}</span>
                      <span>{item.left - 1}</span>
                    </span>
                  ) : (
                    <span style={{lineHeight: '36px'}}>{item.left}</span>
                  )}
                </span>
                {C.leftSuffix}
              </div>
            </div>
          );
        })}
      </div>

      {/* toast */}
      <div
        style={{
          position: 'absolute',
          bottom: 34,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: Math.min(1, toast * 1.4),
          transform: `translateY(${(1 - toast) * 60}px)`,
        }}
      >
        <div
          style={{
            background: theme.lime,
            color: theme.navy,
            borderRadius: 999,
            padding: '16px 40px',
            fontFamily: fonts.en,
            fontWeight: 800,
            fontSize: 34,
            boxShadow: '0 14px 30px rgba(139,224,60,0.45)',
          }}
        >
          {withSymbols(C.toast)}
        </div>
      </div>
    </Card>
  );
};
