import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {CalendarDays, Check, User} from 'lucide-react';
import {config} from '../../config';
import {C, FONT_EN} from '../../theme';
import {Card, Enter} from '../../components/ui';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Cursor: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.3))'}}>
    <path d="M6 3 L6 33 L14 25 L20 38 L26 35 L20 23 L31 23 Z" fill={C.navy} stroke="#fff" strokeWidth={2.5} strokeLinejoin="round" />
  </svg>
);

export const LeaveTracker: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const l = config.build.leave;

  const moveStart = 40;
  const clickAt = 96;
  const move = interpolate(frame, [moveStart, clickAt - 6], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  // Cursor travels from lower right to the Approve button.
  const cx = interpolate(move, [0, 1], [880, 680]);
  const cy = interpolate(move, [0, 1], [760, 400]);
  const press = interpolate(frame, [clickAt - 4, clickAt, clickAt + 6], [1, 0.82, 1], clamp);
  const approved = frame >= clickAt + 2;
  const approveP = spring({frame: frame - clickAt, fps, config: {damping: 12}});
  const ripple = interpolate(frame, [clickAt, clickAt + 24], [0, 1], clamp);
  const cursorOut = interpolate(frame, [clickAt + 30, clickAt + 50], [1, 0], clamp);

  return (
    <div style={{width: 940, position: 'relative'}}>
      <Enter delay={4}>
        <Card style={{padding: 36}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: 38, color: C.navy}}>Leave Request</div>
            <div
              style={{
                fontFamily: FONT_EN,
                fontWeight: 800,
                fontSize: 26,
                padding: '8px 20px',
                borderRadius: 999,
                background: approved ? C.limeSoft : '#FFF3D6',
                color: approved ? '#0B7A43' : '#B7791F',
              }}
            >
              {approved ? 'Approved' : 'Pending'}
            </div>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 22, marginTop: 28}}>
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: 99,
                background: C.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={48} color={C.navy} />
            </div>
            <div style={{fontFamily: FONT_EN}}>
              <div style={{fontWeight: 800, fontSize: 34, color: C.navy}}>{l.staffId}</div>
              <div style={{fontWeight: 600, fontSize: 28, color: C.muted, marginTop: 4}}>{l.team}</div>
            </div>
          </div>
          <div style={{display: 'flex', gap: 16, marginTop: 28}}>
            {[
              ['Type', l.leaveType],
              ['Dates', l.datesText],
              ['Days', String(l.days)],
            ].map(([k, v], i) => (
              <div key={k} style={{flex: i === 1 ? 1.7 : 1, background: C.bg, borderRadius: 14, padding: '18px 20px', fontFamily: FONT_EN}}>
                <div style={{fontWeight: 700, fontSize: 22, color: C.muted, letterSpacing: 1}}>{k.toUpperCase()}</div>
                <div style={{fontWeight: 800, fontSize: 28, color: C.navy, marginTop: 6}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{display: 'flex', gap: 20, marginTop: 30}}>
            <div
              style={{
                flex: 1,
                border: `3px solid ${C.line}`,
                borderRadius: 14,
                padding: '22px 0',
                textAlign: 'center',
                fontFamily: FONT_EN,
                fontWeight: 800,
                fontSize: 32,
                color: C.muted,
                opacity: approved ? 0.4 : 1,
              }}
            >
              Reject
            </div>
            <div
              style={{
                flex: 1,
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 14,
                padding: '22px 0',
                textAlign: 'center',
                fontFamily: FONT_EN,
                fontWeight: 800,
                fontSize: 32,
                color: C.white,
                background: approved ? C.success : C.navy,
                transform: `scale(${approved ? 0.96 + 0.04 * approveP : press})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: 600,
                  height: 600,
                  marginLeft: -300,
                  marginTop: -300,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.35)',
                  transform: `scale(${ripple})`,
                  opacity: 1 - ripple,
                }}
              />
              {approved ? <Check size={36} strokeWidth={4} /> : null}
              {approved ? 'Approved' : 'Approve'}
            </div>
          </div>
        </Card>
      </Enter>

      <Enter delay={14} style={{marginTop: 30}}>
        <Card style={{padding: 32}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, fontFamily: FONT_EN, fontWeight: 800, fontSize: 30, color: C.navy}}>
            <CalendarDays size={34} color={C.navy} />
            {l.calendarTitle}
          </div>
          <div style={{display: 'flex', gap: 12, marginTop: 24}}>
            {l.week.map((d, i) => {
              const k = l.leaveDates.indexOf(d.date);
              const on = k >= 0 ? spring({frame: frame - (clickAt + 14 + k * 10), fps, config: {damping: 12}}) : 0;
              return (
                <div
                  key={d.date}
                  style={{
                    flex: 1,
                    borderRadius: 14,
                    padding: '16px 0',
                    textAlign: 'center',
                    fontFamily: FONT_EN,
                    background: on > 0.01 ? `rgba(139,224,60,${on})` : C.bg,
                    transform: `scale(${1 + 0.08 * Math.sin(on * Math.PI)})`,
                    color: C.navy,
                    opacity: i > 4 ? 0.55 : 1,
                  }}
                >
                  <div style={{fontWeight: 700, fontSize: 22}}>{d.day}</div>
                  <div style={{fontWeight: 800, fontSize: 38, marginTop: 4}}>{d.date}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </Enter>

      <div
        style={{
          position: 'absolute',
          left: cx,
          top: cy,
          opacity: interpolate(frame, [moveStart - 10, moveStart], [0, 1], clamp) * cursorOut,
          transform: `scale(${press})`,
          transformOrigin: 'top left',
        }}
      >
        <Cursor size={78} />
      </div>
    </div>
  );
};
