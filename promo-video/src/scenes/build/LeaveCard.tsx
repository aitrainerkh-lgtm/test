import {Easing, interpolate, interpolateColors, useCurrentFrame, useVideoConfig} from 'remotion';
import {config} from '../../config';
import {CLAMP, enter, mixPoint} from '../../lib/anim';
import {withSymbols} from '../../components/Rich';
import {CursorIcon} from '../../components/Icons';
import {Card} from '../../components/UI';
import {fonts, theme} from '../../theme';

const C = config.scenes.build.leave;

const CLICK = 104;

export const LeaveCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // cursor path (absolute frame coordinates)
  const move = interpolate(frame, [52, CLICK - 6], [0, 1], {...CLAMP, easing: Easing.inOut(Easing.cubic)});
  const cur = mixPoint({x: 880, y: 1240}, {x: 321, y: 718}, move);
  const press = interpolate(frame, [CLICK - 4, CLICK, CLICK + 6], [1, 0.92, 1], CLAMP);
  const done = interpolate(frame, [CLICK + 2, CLICK + 10], [0, 1], CLAMP);
  const ripple = interpolate(frame, [CLICK, CLICK + 22], [0, 1], CLAMP);
  const cursorO = interpolate(frame, [44, 54, CLICK + 30, CLICK + 44], [0, 1, 1, 0], CLAMP);

  return (
    <>
      {/* employee card */}
      <Card style={{position: 'absolute', top: 470, left: 70, width: 940, padding: '40px 44px', ...enter(frame, fps, 8, 80)}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 30}}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: theme.navy,
              color: theme.lime,
              fontFamily: fonts.en,
              fontWeight: 800,
              fontSize: 46,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {C.initials}
          </div>
          <div>
            <div style={{fontFamily: fonts.en, fontWeight: 800, fontSize: 48, color: theme.navy}}>{C.employee}</div>
            <div style={{fontFamily: fonts.en, fontWeight: 600, fontSize: 31, color: theme.grey, marginTop: 4}}>{C.detail}</div>
          </div>
        </div>
        <div style={{display: 'flex', gap: 24, marginTop: 36}}>
          <div
            style={{
              flex: 1,
              height: 104,
              borderRadius: theme.radius,
              background: interpolateColors(done, [0, 1], [theme.navy, theme.lime]),
              color: interpolateColors(done, [0, 1], [theme.white, theme.navy]),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: fonts.en,
              fontWeight: 800,
              fontSize: 38,
              transform: `scale(${press})`,
              boxShadow: done > 0.5 ? '0 14px 30px rgba(139,224,60,0.45)' : 'none',
            }}
          >
            {done > 0.5 ? withSymbols(C.approved) : C.approve}
          </div>
          <div
            style={{
              flex: 1,
              height: 104,
              borderRadius: theme.radius,
              background: theme.white,
              border: `3px solid ${theme.line}`,
              color: theme.navy,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: fonts.en,
              fontWeight: 800,
              fontSize: 38,
              opacity: 1 - done * 0.55,
            }}
          >
            {C.reject}
          </div>
        </div>
      </Card>

      {/* week calendar */}
      <Card style={{position: 'absolute', top: 850, left: 70, width: 940, padding: '30px 30px 34px', ...enter(frame, fps, 20, 80)}}>
        <div style={{fontFamily: fonts.en, fontWeight: 800, fontSize: 30, color: theme.navy, marginBottom: 20, paddingLeft: 6}}>{C.calendarTitle}</div>
        <div style={{display: 'flex', gap: 12}}>
          {(C.week as {day: string; date: number; leave: boolean}[]).map((d, i) => {
            const order = (C.week as {leave: boolean}[]).slice(0, i).filter((w) => w.leave).length;
            const g = d.leave ? interpolate(frame, [CLICK + 16 + order * 10, CLICK + 26 + order * 10], [0, 1], CLAMP) : 0;
            return (
              <div
                key={d.day}
                style={{
                  flex: 1,
                  borderRadius: 14,
                  padding: '16px 0',
                  textAlign: 'center',
                  background: interpolateColors(g, [0, 1], [theme.panel, theme.lime]),
                  transform: `scale(${1 + Math.sin(g * Math.PI) * 0.12})`,
                }}
              >
                <div style={{fontFamily: fonts.en, fontWeight: 700, fontSize: 22, color: g > 0.5 ? theme.navy : theme.grey, letterSpacing: '0.08em'}}>{d.day}</div>
                <div style={{fontFamily: fonts.en, fontWeight: 800, fontSize: 44, color: theme.navy}}>{d.date}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* click ripple + cursor */}
      <div
        style={{
          position: 'absolute',
          left: 321 - 60,
          top: 718 - 60,
          width: 120,
          height: 120,
          borderRadius: '50%',
          border: `5px solid ${theme.lime}`,
          opacity: ripple > 0 ? 1 - ripple : 0,
          transform: `scale(${0.3 + ripple})`,
        }}
      />
      <div style={{position: 'absolute', left: cur.x - 8, top: cur.y - 6, opacity: cursorO, transform: `scale(${press})`, transformOrigin: 'top left'}}>
        <CursorIcon size={84} />
      </div>
    </>
  );
};
