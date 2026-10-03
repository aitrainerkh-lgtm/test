import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Card, clamp, Heading, Icon, Kicker, Logo, ramp, SceneProps, Sfx, useAppear} from './components';
import {C, F} from './theme';

// ================================================================== 5-7. STAGES
const STAGES = [
  {en: 'Startup', kh: 'ចាប់ផ្តើម', icon: 'seed', color: C.green},
  {en: 'Operating', kh: 'ដំណើរការ', icon: 'gear', color: C.gold},
  {en: 'Growth', kh: 'ពង្រីក', icon: 'rocket', color: C.orange},
] as const;

const StageTrack: React.FC<{active: number}> = ({active}) => {
  const frame = useCurrentFrame();
  const fill = interpolate(frame, [4, 22], [active === 0 ? 0 : (active - 1) / 2, active / 2], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <div style={{position: 'absolute', left: 260, right: 260, top: 120, height: 120}}>
      <div style={{position: 'absolute', left: 40, right: 40, top: 36, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.15)'}} />
      <div style={{position: 'absolute', left: 40, top: 36, height: 8, borderRadius: 4, width: `calc((100% - 80px) * ${fill})`, background: `linear-gradient(90deg, ${C.green}, ${C.orange})`}} />
      {STAGES.map((s, i) => {
        const on = i <= active;
        const isActive = i === active;
        const pulse = isActive ? 1 + Math.sin(frame / 6) * 0.06 : 1;
        return (
          <div key={s.en} style={{position: 'absolute', left: `calc(${i * 50}% - ${i * 80 / 2}px)`, top: 0, width: 80, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                background: on ? s.color : C.bg2,
                border: `4px solid ${on ? s.color : 'rgba(255,255,255,0.25)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${pulse})`,
                boxShadow: isActive ? `0 0 40px ${s.color}` : 'none',
              }}
            >
              {i < active ? <Icon name="check" size={44} color={C.white} stroke={6} /> : <span style={{fontFamily: F.en, fontWeight: 800, fontSize: 34, color: C.white}}>{i + 1}</span>}
            </div>
            <div style={{whiteSpace: 'nowrap', marginTop: 8, textAlign: 'center', fontFamily: F.kh, fontWeight: 700, fontSize: 26, lineHeight: 1.5, color: on ? C.white : C.muted}}>
              {s.en} · {s.kh}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const StageArt: React.FC<{stage: number}> = ({stage}) => {
  const frame = useCurrentFrame();
  const s = STAGES[stage];
  const grow = useAppear(6, 12, 90);
  let art: React.ReactNode;
  if (stage === 0) {
    art = (
      <div style={{transform: `scale(${0.3 + 0.7 * grow})`, transformOrigin: 'bottom center'}}>
        <Icon name="seed" size={330} color={s.color} stroke={3} progress={ramp(frame, 4, 30)} />
      </div>
    );
  } else if (stage === 1) {
    art = (
      <div style={{position: 'relative', width: 380, height: 380}}>
        <div style={{position: 'absolute', left: 0, top: 40, transform: `rotate(${frame * 3}deg)`}}>
          <Icon name="gear" size={250} color={s.color} stroke={3.5} />
        </div>
        <div style={{position: 'absolute', left: 205, top: 200, transform: `rotate(${-frame * 4.5}deg)`}}>
          <Icon name="gear" size={170} color={C.green} stroke={4} />
        </div>
      </div>
    );
  } else {
    const lift = interpolate(frame, [10, 200], [80, -60], {...clamp, easing: Easing.in(Easing.quad)});
    art = (
      <div style={{position: 'relative', transform: `translateY(${lift}px) rotate(${Math.sin(frame / 3) * 1.5}deg)`}}>
        <Icon name="rocket" size={330} color={s.color} stroke={3} progress={ramp(frame, 2, 22)} />
        <div
          style={{
            position: 'absolute',
            left: 135,
            top: 300,
            width: 60,
            height: 90 + Math.sin(frame) * 20,
            borderRadius: '50% 50% 50% 50% / 30% 30% 70% 70%',
            background: `linear-gradient(${C.gold}, ${C.orange}00)`,
            opacity: ramp(frame, 10, 8),
          }}
        />
      </div>
    );
  }
  return (
    <div style={{position: 'absolute', left: 170, top: 330, width: 520, height: 520, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'absolute', width: 480, height: 480, borderRadius: 240, background: `radial-gradient(circle, ${s.color}33 0%, transparent 70%)`}} />
      {art}
    </div>
  );
};

const StageScene: React.FC<SceneProps & {stage: number; icons: string[]}> = ({lines, stage, icons}) => {
  const frame = useCurrentFrame();
  const at = lines.map((l) => l.at);
  const s = STAGES[stage];
  const bullets = lines.slice(1);
  return (
    <AbsoluteFill>
      <Sfx name="ding" at={at[0]} volume={0.25} />
      {bullets.map((b, i) => (
        <Sfx key={i} name="click" at={b.at} volume={0.5} />
      ))}
      <StageTrack active={stage} />
      <StageArt stage={stage} />
      <div style={{position: 'absolute', left: 760, top: 300, width: 1050}}>
        <Kicker text={`Stage ${stage + 1} · ${s.en}`} color={s.color} at={at[0]} />
        <Heading text={`ដំណាក់កាល${s.kh}`} size={56} at={at[0]} />
        <div style={{display: 'flex', flexDirection: 'column', gap: 18, marginTop: 14}}>
          {bullets.map((b, i) => {
            const p = interpolate(frame - b.at, [0, 10], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 22,
                  opacity: p,
                  transform: `translateX(${(1 - p) * 80}px)`,
                }}
              >
                <div style={{flex: 'none', width: 66, height: 66, borderRadius: 18, background: `${s.color}2A`, border: `2px solid ${s.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <Icon name={icons[i] as 'check'} size={42} color={s.color} progress={ramp(frame, b.at + 2, 12)} />
                </div>
                <div style={{fontFamily: F.kh, fontWeight: 700, fontSize: 34, lineHeight: 1.65, color: C.white}}>{shortBullet(b.text)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// on-screen bullet text: drop the leading "និង" and the end mark
const shortBullet = (t: string) => t.replace(/^និង/, '').replace(/។$/, '');

export const Startup: React.FC<SceneProps> = (p) => <StageScene {...p} stage={0} icons={['bulb', 'target', 'coins', 'shield']} />;
export const Operating: React.FC<SceneProps> = (p) => <StageScene {...p} stage={1} icons={['gear', 'users', 'coins', 'kpi']} />;
export const Growth: React.FC<SceneProps> = (p) => <StageScene {...p} stage={2} icons={['store', 'globe', 'chart']} />;

// ================================================================== 8. WHO NEEDS IT
const WHO = [
  {kh: 'ស្ថាបនិក និងម្ចាស់', en: 'Founders & Owners', icon: 'user'},
  {kh: 'វិនិយោគិន', en: 'Investors', icon: 'investor'},
  {kh: 'ធនាគារ និង MFI', en: 'Bankers', icon: 'bank'},
  {kh: 'ដៃគូអាជីវកម្ម', en: 'Partners', icon: 'handshake'},
  {kh: 'ក្រុមគ្រប់គ្រង និងបុគ្គលិក', en: 'Management & Staff', icon: 'users'},
  {kh: 'ម្ចាស់ជំនួយ និងអង្គការ', en: 'Donors & NGOs', icon: 'heart'},
] as const;

export const Who: React.FC<SceneProps> = ({lines}) => {
  const frame = useCurrentFrame();
  const at = lines.map((l) => l.at);
  const cx = 960;
  const cy = 548;
  const center = useAppear(2, 12, 120);
  return (
    <AbsoluteFill>
      {WHO.map((_, i) => (
        <Sfx key={i} name="pop" at={at[i + 1]} volume={0.4} />
      ))}
      <div style={{position: 'absolute', top: 100, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <Kicker text="Who needs a business plan?" />
      </div>
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <circle cx={cx} cy={cy} r={300} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={2} strokeDasharray="8 10" />
        {WHO.map((_, i) => {
          const ang = (-90 + i * 60) * (Math.PI / 180);
          const x = cx + Math.cos(ang) * 600;
          const y = cy + Math.sin(ang) * 300;
          const p = ramp(frame, at[i + 1], 10);
          return <line key={i} x1={cx} y1={cy} x2={cx + (x - cx) * p} y2={cy + (y - cy) * p} stroke={i % 2 ? C.orange : C.green} strokeWidth={4} strokeDasharray="10 8" />;
        })}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: cx - 150,
          top: cy - 150,
          width: 300,
          height: 300,
          borderRadius: 150,
          background: `linear-gradient(135deg, ${C.greenDark}, ${C.green})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${center * (1 + Math.sin(frame / 8) * 0.025)})`,
          boxShadow: `0 0 80px ${C.green}88`,
        }}
      >
        <Icon name="doc" size={110} color={C.white} />
        <div style={{fontFamily: F.en, fontWeight: 800, fontSize: 32, color: C.white, marginTop: 6}}>Business Plan</div>
      </div>
      {WHO.map((w, i) => {
        const ang = (-90 + i * 60) * (Math.PI / 180);
        const x = cx + Math.cos(ang) * 600;
        const y = cy + Math.sin(ang) * 300;
        const p = interpolate(frame - at[i + 1], [0, 10], [0, 1], {...clamp, easing: Easing.out(Easing.back(2))});
        const color = i % 2 ? C.orange : C.green;
        return (
          <Card
            key={w.en}
            glow={color}
            style={{
              position: 'absolute',
              left: x - 210,
              top: y - 62,
              width: 420,
              height: 124,
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              padding: '0 22px',
              background: '#0B2036EE',
              opacity: Math.min(1, p * 1.5),
              transform: `scale(${p})`,
            }}
          >
            <div style={{flex: 'none', width: 80, height: 80, borderRadius: 40, background: `${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Icon name={w.icon} size={52} color={color} progress={ramp(frame, at[i + 1], 14)} />
            </div>
            <div>
              <div style={{fontFamily: F.kh, fontWeight: 700, fontSize: i === 4 ? 25 : 29, lineHeight: 1.6, color: C.white}}>{w.kh}</div>
              <div style={{fontFamily: F.en, fontWeight: 500, fontSize: 21, color: C.muted}}>{w.en}</div>
            </div>
          </Card>
        );
      })}
    </AbsoluteFill>
  );
};

// ================================================================== 9. WITHOUT vs WITH
export const Compare: React.FC<SceneProps> = ({lines}) => {
  const frame = useCurrentFrame();
  const [a, b] = lines.map((l) => l.at);
  const left = useAppear(a);
  const right = useAppear(b);
  const messy = 'M 60 360 C 160 100 260 420 330 200 S 120 60 210 300 S 420 380 300 120 S 520 260 560 330';
  const clean = 'M 60 360 L 200 300 L 330 250 L 450 160 L 560 70';
  const drop = interpolate(frame, [a + 10, a + 60], [0, 1], clamp);
  return (
    <AbsoluteFill style={{flexDirection: 'row', padding: '150px 110px 150px', gap: 60}}>
      <Sfx name="buzz" at={a + 8} volume={0.35} />
      <Sfx name="whoosh" at={b - 4} volume={0.3} />
      <Sfx name="chime" at={b + 6} volume={0.45} />
      {[
        {
          title: 'គ្មានផែនការ',
          en: 'WITHOUT A PLAN',
          color: C.red,
          p: left,
          path: messy,
          pts: ['ខ្វះសាច់ប្រាក់', 'ចំណាយហួសថវិកា', 'បាត់បង់ទិសដៅ'],
          icon: 'warning' as const,
          start: a,
        },
        {
          title: 'មានផែនការ',
          en: 'WITH A PLAN',
          color: C.green,
          p: right,
          path: clean,
          pts: ['មើលឃើញបញ្ហាមុន', 'ត្រៀមដំណោះស្រាយ', 'រីកចម្រើនជាប់លាប់'],
          icon: 'check' as const,
          start: b,
        },
      ].map((side, k) => (
        <Card
          key={side.en}
          glow={side.color}
          style={{
            flex: 1,
            padding: '34px 44px',
            opacity: side.p,
            transform: `translateY(${(1 - side.p) * 120}px) ${k === 0 ? `rotate(${Math.sin(frame / 2) * drop * (frame < a + 60 ? 0.6 : 0)}deg)` : ''}`,
            background: `${side.color}14`,
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
            <Icon name={side.icon} size={70} color={side.color} stroke={5} progress={ramp(frame, side.start + 4, 12)} />
            <div>
              <div style={{fontFamily: F.en, fontWeight: 800, fontSize: 26, letterSpacing: 4, color: side.color}}>{side.en}</div>
              <div style={{fontFamily: F.head, fontSize: 44, lineHeight: 1.6, color: C.white}}>{side.title}</div>
            </div>
          </div>
          <svg width={620} height={400} viewBox="0 0 620 400" style={{marginTop: 4}}>
            <path d={side.path} fill="none" stroke={side.color} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ramp(frame, side.start + 4, 34)} />
            <circle cx={60} cy={360} r={14} fill={C.white} />
            {k === 1 ? (
              <g transform="translate(530 10)" opacity={ramp(frame, side.start + 30, 8)}>
                <Icon name="flag" size={70} color={C.gold} stroke={5} />
              </g>
            ) : (
              <text x={500} y={390} fontSize={80} fill={C.red} opacity={ramp(frame, side.start + 30, 8)} fontFamily="Poppins" fontWeight={800}>
                ?
              </text>
            )}
          </svg>
          <div style={{display: 'flex', gap: 14, flexWrap: 'wrap'}}>
            {side.pts.map((t, i) => {
              const pp = ramp(frame, side.start + 14 + i * 9, 8);
              return (
                <div key={t} style={{fontFamily: F.kh, fontWeight: 700, fontSize: 28, lineHeight: 1.6, color: C.white, padding: '6px 20px', borderRadius: 30, background: `${side.color}40`, opacity: pp, transform: `scale(${0.7 + 0.3 * pp})`}}>
                  {t}
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </AbsoluteFill>
  );
};

// ================================================================== 10. USE AI
const TOOLS = [
  {name: 'ChatGPT', color: '#10A37F'},
  {name: 'Claude', color: '#D97757'},
  {name: 'Gemini', color: '#4C8DF6'},
  {name: 'Copilot', color: '#A86CF0'},
];
const TASKS = [
  {kh: 'ស្រាវជ្រាវទីផ្សារ', en: 'Market research', icon: 'search'},
  {kh: 'តារាងហិរញ្ញវត្ថុ', en: 'Financial tables', icon: 'table'},
  {kh: 'សេចក្តីព្រាង Business Plan', en: 'Business plan draft', icon: 'pen'},
] as const;

export const AiTools: React.FC<SceneProps> = ({lines}) => {
  const frame = useCurrentFrame();
  const [a, b] = lines.map((l) => l.at);
  const span = Math.max(40, b - a);
  return (
    <AbsoluteFill style={{alignItems: 'center', paddingTop: 110}}>
      {TOOLS.map((_, i) => (
        <Sfx key={i} name="pop" at={a + span * (0.42 + i * 0.13)} volume={0.4} />
      ))}
      {TASKS.map((_, i) => (
        <Sfx key={`t${i}`} name="whoosh" at={b + i * 14} volume={0.22} />
      ))}
      <Kicker text="Work faster with AI" />
      <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
        <Icon name="sparkle" size={80} color={C.gold} progress={ramp(frame, a, 20)} style={{transform: `rotate(${frame}deg)`}} />
        <Heading text="ប្រើ AI ជួយរៀបចំ Business Plan" size={56} align="center" />
      </div>
      <div style={{display: 'flex', gap: 30, marginTop: 30}}>
        {TOOLS.map((t, i) => {
          const at = a + span * (0.42 + i * 0.13);
          const p = interpolate(frame - at, [0, 10], [0, 1], {...clamp, easing: Easing.out(Easing.back(2.2))});
          return (
            <div
              key={t.name}
              style={{
                fontFamily: F.en,
                fontWeight: 700,
                fontSize: 44,
                color: C.white,
                padding: '18px 44px',
                borderRadius: 50,
                background: t.color,
                boxShadow: `0 12px 40px ${t.color}66`,
                opacity: Math.min(1, p * 1.5),
                transform: `translateY(${(1 - p) * -120}px) scale(${p})`,
              }}
            >
              {t.name}
            </div>
          );
        })}
      </div>
      <div style={{display: 'flex', gap: 34, marginTop: 70}}>
        {TASKS.map((t, i) => {
          const at = b + i * 14;
          const p = interpolate(frame - at, [0, 12], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
          return (
            <Card key={t.en} glow={frame >= at ? C.green : undefined} style={{width: 470, padding: '30px 30px', display: 'flex', alignItems: 'center', gap: 22, opacity: p, transform: `translateX(${(1 - p) * 300}px) skewX(${(1 - p) * -12}deg)`}}>
              <div style={{flex: 'none', width: 90, height: 90, borderRadius: 24, background: `${C.green}2A`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Icon name={t.icon} size={60} color={C.green} progress={ramp(frame, at + 2, 14)} />
              </div>
              <div>
                <div style={{fontFamily: F.kh, fontWeight: 700, fontSize: 31, lineHeight: 1.6, color: C.white}}>{t.kh}</div>
                <div style={{fontFamily: F.en, fontWeight: 500, fontSize: 22, color: C.muted}}>{t.en}</div>
              </div>
            </Card>
          );
        })}
      </div>
      {frame >= b + 40 && (
        <div style={{marginTop: 46, fontFamily: F.kh, fontWeight: 700, fontSize: 40, lineHeight: 1.6, color: C.gold, opacity: ramp(frame, b + 40, 10), display: 'flex', alignItems: 'center', gap: 16}}>
          <Icon name="rocket" size={52} color={C.gold} /> លឿនជាងមុន
        </div>
      )}
    </AbsoluteFill>
  );
};

// ================================================================== 11. TIP
export const Tip: React.FC<SceneProps> = ({lines}) => {
  const frame = useCurrentFrame();
  const [a, b] = lines.map((l) => l.at);
  const cross = ramp(frame, a + 24, 10);
  const cal = useAppear(b);
  return (
    <AbsoluteFill style={{alignItems: 'center', paddingTop: 120}}>
      <Sfx name="ding" at={a} volume={0.3} />
      <Sfx name="buzz" at={a + 24} volume={0.2} />
      <Sfx name="whoosh" at={b - 4} volume={0.3} />
      <Sfx name="chime" at={b + 12} volume={0.35} />
      <Kicker text="Pro tip" color={C.gold} />
      <Heading text="គន្លឹះសំខាន់" size={66} align="center" color={C.gold} />
      <div style={{display: 'flex', gap: 80, marginTop: 40, alignItems: 'center'}}>
        <Card style={{width: 560, height: 470, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: ramp(frame, a, 10)}}>
          <div style={{position: 'relative'}}>
            <Icon name="folder" size={220} color={C.muted} progress={ramp(frame, a, 18)} />
            <div style={{position: 'absolute', left: 0, top: 0, opacity: cross}}>
              <Icon name="cross" size={220} color={C.red} stroke={6} progress={cross} />
            </div>
          </div>
          <div style={{fontFamily: F.kh, fontWeight: 700, fontSize: 36, lineHeight: 1.6, color: C.white, marginTop: 10, textAlign: 'center'}}>
            កុំទុកចោលក្នុងថត
          </div>
        </Card>
        <Card glow={frame >= b ? C.green : undefined} style={{width: 560, height: 470, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: cal, transform: `scale(${0.8 + 0.2 * cal})`}}>
          <div style={{position: 'relative', width: 240, height: 240}}>
            <div style={{position: 'absolute', left: 30, top: 30}}>
              <Icon name="calendar" size={180} color={C.green} progress={ramp(frame, b, 18)} />
            </div>
            <div style={{position: 'absolute', left: 0, top: 0, transform: `rotate(${(frame - b) * 4}deg)`, opacity: 0.9}}>
              <Icon name="refresh" size={240} color={C.orange} stroke={2.5} />
            </div>
          </div>
          <div style={{fontFamily: F.kh, fontWeight: 700, fontSize: 34, lineHeight: 1.6, color: C.white, marginTop: 10, textAlign: 'center'}}>
            ពិនិត្យឡើងវិញយ៉ាងហោចណាស់
            <br />
            <span style={{color: C.gold}}>១ ដង / ឆ្នាំ</span>
          </div>
        </Card>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================== 12. OUTRO
export const Outro: React.FC<SceneProps> = ({lines, duration}) => {
  const frame = useCurrentFrame();
  const [a, b] = lines.map((l) => l.at);
  const msg = useAppear(a);
  const logo = useAppear(b + 4, 10, 110);
  const fadeOut = interpolate(frame, [duration - 20, duration], [1, 0], clamp);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: fadeOut}}>
      <Sfx name="whoosh" at={b} volume={0.3} />
      <Sfx name="impact" at={b + 4} volume={0.55} />
      <Sfx name="chime" at={b + 10} volume={0.45} />
      <div style={{position: 'absolute', top: 150, width: 1500, textAlign: 'center', opacity: msg * (1 - ramp(frame, b, 10) * 0.35), transform: `translateY(${(1 - msg) * 40}px)`}}>
        <div style={{fontFamily: F.head, fontSize: 52, lineHeight: 1.7, color: C.white}}>Business Plan មិនមែនជាជម្រើសទេ</div>
        <div style={{fontFamily: F.kh, fontWeight: 700, fontSize: 44, lineHeight: 1.7, color: C.gold}}>គឺជាឧបករណ៍ចាំបាច់សម្រាប់ម្ចាស់អាជីវកម្មគ្រប់រូប</div>
      </div>
      {frame >= b && (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 260, transform: `scale(${logo})`}}>
          <div style={{position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div style={{position: 'absolute', width: 230, height: 230, borderRadius: 115, border: `4px solid ${C.green}`, opacity: 0.6, transform: `scale(${1 + ((frame - b) % 40) / 60})`}} />
            <Logo size={150} />
          </div>
          <div style={{fontFamily: F.en, fontWeight: 800, fontSize: 84, color: C.white, marginTop: 34}}>
            AI For <span style={{color: C.orange}}>Business</span>
          </div>
          <div style={{fontFamily: F.kh, fontWeight: 700, fontSize: 38, lineHeight: 1.7, color: C.soft, marginTop: 4}}>ចាប់ផ្តើមរៀបចំផែនការរបស់អ្នកថ្ងៃនេះ</div>
        </div>
      )}
    </AbsoluteFill>
  );
};
