import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Card, clamp, Heading, Icon, Kicker, ramp, SceneProps, Sfx, useAppear} from './components';
import {C, F} from './theme';

// ================================================================== 1. HOOK
export const Intro: React.FC<SceneProps> = ({lines}) => {
  const frame = useCurrentFrame();
  const [l0, l1, l2] = lines.map((l) => l.at);
  // winding road drawn across the screen, a dot travels to the flag
  const road = 'M 80 860 C 400 860 380 600 700 620 S 1000 900 1260 700 S 1500 380 1780 360';
  const draw = interpolate(frame, [0, l1 + 10], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
  const q = useAppear(l0 + 4);
  const title = useAppear(l1, 12, 120);
  const go = useAppear(l2, 9, 200);
  const shake = frame >= l1 && frame < l1 + 10 ? Math.sin(frame * 3) * (l1 + 10 - frame) * 1.2 : 0;
  return (
    <AbsoluteFill style={{transform: `translateX(${shake}px)`}}>
      <Sfx name="riser" at={Math.max(0, l1 - 66)} volume={0.35} />
      <Sfx name="impact" at={l1} volume={0.7} />
      <Sfx name="pop" at={l0 + 4} volume={0.4} />
      <Sfx name="chime" at={l2} volume={0.45} />
      <svg width={1920} height={1080} style={{position: 'absolute', opacity: 0.9}}>
        <path d={road} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={46} strokeLinecap="round" />
        <path
          d={road}
          fill="none"
          stroke={C.gold}
          strokeWidth={6}
          strokeDasharray="24 22"
          pathLength={1}
          style={{strokeDasharray: `${draw} 1`}}
          strokeLinecap="round"
        />
      </svg>
      <div style={{position: 'absolute', left: 1720, top: 220, opacity: ramp(frame, l1, 10), transform: `scale(${ramp(frame, l1, 10)})`}}>
        <Icon name="flag" size={150} color={C.green} stroke={4.5} />
      </div>
      <div style={{position: 'absolute', left: 40, top: 760, opacity: 1 - ramp(frame, l1 - 10, 10)}}>
        <Icon name="map" size={120} color={C.soft} progress={ramp(frame, 0, 25)} />
      </div>

      {/* line 0: question */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: 1 - ramp(frame, l1 - 4, 6)}}>
        <div style={{transform: `scale(${0.7 + 0.3 * q})`, opacity: q, textAlign: 'center'}}>
          <div style={{fontSize: 150, lineHeight: 1}}>
            <span style={{fontFamily: F.en, fontWeight: 800, color: C.orange}}>?</span>
          </div>
          <div style={{fontFamily: F.kh, fontWeight: 700, fontSize: 64, lineHeight: 1.7, color: C.white, maxWidth: 1300}}>
            {lines[0].text}
          </div>
        </div>
      </AbsoluteFill>

      {/* line 1: title */}
      {frame >= l1 - 2 && (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', paddingBottom: 60}}>
          <div style={{textAlign: 'center', transform: `scale(${0.6 + 0.4 * title})`, opacity: title}}>
            <div style={{fontFamily: F.en, fontWeight: 800, fontSize: 40, letterSpacing: 10, color: C.gold}}>
              WHY BUSINESS OWNERS NEED A
            </div>
            <div
              style={{
                fontFamily: F.en,
                fontWeight: 800,
                fontSize: 170,
                lineHeight: 1.05,
                background: `linear-gradient(90deg, ${C.green}, ${C.gold}, ${C.orange})`,
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              BUSINESS PLAN
            </div>
            <div style={{fontFamily: F.head, fontSize: 60, lineHeight: 1.7, color: C.white, marginTop: 10}}>
              ហេតុអ្វីត្រូវការផែនការអាជីវកម្ម?
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* line 2: let's go badge */}
      {frame >= l2 && (
        <div
          style={{
            position: 'absolute',
            left: 960 - 230,
            top: 800,
            width: 460,
            padding: '14px 0',
            textAlign: 'center',
            borderRadius: 60,
            background: C.orange,
            fontFamily: F.kh,
            fontWeight: 700,
            fontSize: 42,
            lineHeight: 1.6,
            color: C.white,
            transform: `scale(${go}) rotate(${(1 - go) * -8}deg)`,
            boxShadow: `0 10px 40px ${C.orange}88`,
          }}
        >
          តោះ! ស្វែងយល់ →
        </div>
      )}
    </AbsoluteFill>
  );
};

// ================================================================== 2. WHAT IS
const WHAT_CHIPS = [
  {en: 'WHAT', kh: 'លក់អ្វី?', icon: 'box', color: C.green},
  {en: 'WHO', kh: 'លក់ឲ្យអ្នកណា?', icon: 'users', color: C.gold},
  {en: 'HOW', kh: 'ធ្វើដូចម្តេច?', icon: 'gear', color: '#5AA9F0'},
  {en: 'PROFIT', kh: 'រកប្រាក់ចំណេញ?', icon: 'coins', color: C.orange},
] as const;

export const What: React.FC<SceneProps> = ({lines}) => {
  const frame = useCurrentFrame();
  const at = lines.map((l) => l.at);
  const doc = useAppear(4, 14, 120);
  const banner = useAppear(at[5]);
  return (
    <AbsoluteFill>
      <Sfx name="pop" at={6} volume={0.35} />
      {[1, 2, 3, 4].map((i) => (
        <Sfx key={i} name="pop" at={at[i]} volume={0.45} />
      ))}
      <Sfx name="ding" at={at[5]} volume={0.3} />

      {/* animated document */}
      <div
        style={{
          position: 'absolute',
          left: 150,
          top: 170,
          width: 560,
          height: 700,
          borderRadius: 26,
          background: '#F7FAFC',
          boxShadow: '0 40px 80px rgba(0,0,0,0.45)',
          transform: `perspective(1400px) rotateY(${(1 - doc) * -50 + 8}deg) translateY(${(1 - doc) * 80}px)`,
          opacity: doc,
          padding: 44,
          overflow: 'hidden',
        }}
      >
        <div style={{height: 70, borderRadius: 14, background: `linear-gradient(90deg, ${C.greenDark}, ${C.green})`, display: 'flex', alignItems: 'center', paddingLeft: 26}}>
          <div style={{fontFamily: F.en, fontWeight: 800, fontSize: 30, color: C.white}}>BUSINESS PLAN</div>
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: 16,
              marginTop: i === 0 ? 34 : 18,
              borderRadius: 8,
              background: '#CBD5E0',
              width: `${interpolate(frame, [10 + i * 5, 26 + i * 5], [0, [100, 86, 94, 70, 80][i]], clamp)}%`,
            }}
          />
        ))}
        <div style={{display: 'flex', alignItems: 'flex-end', gap: 22, height: 200, marginTop: 40}}>
          {[0.35, 0.55, 0.5, 0.75, 0.95].map((h, i) => (
            <div
              key={i}
              style={{
                width: 52,
                height: `${h * 100 * ramp(frame, 30 + i * 4, 14)}%`,
                borderRadius: 10,
                background: i === 4 ? C.orange : C.green,
              }}
            />
          ))}
          <svg width={150} height={150} viewBox="0 0 42 42" style={{marginLeft: 18}}>
            <circle cx="21" cy="21" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth={6} />
            <circle
              cx="21"
              cy="21"
              r="15.9"
              fill="none"
              stroke={C.orange}
              strokeWidth={6}
              strokeDasharray={`${65 * ramp(frame, 40, 20)} 100`}
              transform="rotate(-90 21 21)"
            />
          </svg>
        </div>
      </div>

      <div style={{position: 'absolute', left: 820, top: 150, width: 1000}}>
        <Kicker text="What is a business plan?" />
        <div style={{height: 10}} />
        <Heading text="Business Plan ជាអ្វី?" size={70} />
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26, marginTop: 30}}>
          {WHAT_CHIPS.map((c, i) => {
            const p = interpolate(frame - at[i + 1], [0, 9], [0, 1], {...clamp, easing: Easing.out(Easing.back(2))});
            return (
              <Card key={c.en} glow={frame >= at[i + 1] ? c.color : undefined} style={{padding: '22px 28px', display: 'flex', alignItems: 'center', gap: 22, opacity: Math.min(1, p * 1.5), transform: `scale(${0.5 + 0.5 * p})`}}>
                <div style={{width: 84, height: 84, borderRadius: 22, background: `${c.color}26`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <Icon name={c.icon} size={58} color={c.color} progress={ramp(frame, at[i + 1], 14)} />
                </div>
                <div>
                  <div style={{fontFamily: F.en, fontWeight: 800, fontSize: 26, letterSpacing: 3, color: c.color}}>{c.en}</div>
                  <div style={{fontFamily: F.kh, fontWeight: 700, fontSize: 36, lineHeight: 1.6, color: C.white}}>{c.kh}</div>
                </div>
              </Card>
            );
          })}
        </div>
        {frame >= at[5] && (
          <div
            style={{
              marginTop: 34,
              display: 'flex',
              gap: 20,
              alignItems: 'center',
              opacity: banner,
              transform: `translateX(${(1 - banner) * 60}px)`,
            }}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: 14, background: `${C.green}30`, border: `2px solid ${C.green}`, borderRadius: 20, padding: '12px 24px'}}>
              <Icon name="check" size={46} color={C.green} stroke={6} progress={ramp(frame, at[5] + 4, 10)} />
              <span style={{fontFamily: F.kh, fontWeight: 700, fontSize: 32, lineHeight: 1.6, color: C.white}}>ឧបករណ៍គ្រប់គ្រងអាជីវកម្ម</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 14, borderRadius: 20, padding: '12px 24px', border: `2px dashed ${C.muted}`, opacity: 0.85}}>
              <span style={{fontFamily: F.kh, fontSize: 30, lineHeight: 1.6, color: C.muted, textDecoration: frame > at[5] + 30 ? 'line-through' : 'none'}}>
                សម្រាប់ខ្ចីប្រាក់តែប៉ុណ្ណោះ
              </span>
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ================================================================== 3. MAIN SECTIONS
const SECTIONS = [
  {en: 'Executive Summary', kh: 'សេចក្តីសង្ខេបប្រតិបត្តិ', icon: 'star'},
  {en: 'Company Description', kh: 'ព័ត៌មានក្រុមហ៊ុន', icon: 'building'},
  {en: 'Market Analysis', kh: 'ការវិភាគទីផ្សារ', icon: 'search'},
  {en: 'Marketing & Sales', kh: 'ទីផ្សារ និងការលក់', icon: 'megaphone'},
  {en: 'Operations Plan', kh: 'ផែនការប្រតិបត្តិការ', icon: 'gear'},
  {en: 'Management & HR', kh: 'ការគ្រប់គ្រង និង HR', icon: 'users'},
  {en: 'Financial Plan', kh: 'ផែនការហិរញ្ញវត្ថុ', icon: 'pie'},
  {en: 'Risk Analysis', kh: 'ការវិភាគហានិភ័យ', icon: 'shield'},
] as const;

export const Sections: React.FC<SceneProps> = ({lines}) => {
  const frame = useCurrentFrame();
  const at = lines.map((l) => l.at);
  return (
    <AbsoluteFill style={{padding: '110px 120px 0'}}>
      {SECTIONS.map((_, i) => (
        <Sfx key={i} name="pop" at={at[i + 1]} volume={0.4} />
      ))}
      <Kicker text="Main sections" />
      <div style={{display: 'flex', alignItems: 'baseline', gap: 30}}>
        <Heading text="ផ្នែកសំខាន់ៗរបស់ Business Plan" size={58} />
        <div style={{fontFamily: F.en, fontWeight: 800, fontSize: 90, color: C.orange, opacity: ramp(frame, 6, 10)}}>8</div>
      </div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 28, marginTop: 24}}>
        {SECTIONS.map((s, i) => {
          const t = at[i + 1];
          const p = interpolate(frame - t, [0, 10], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.8))});
          const active = frame >= t && (i === SECTIONS.length - 1 ? true : frame < at[i + 2]);
          const color = i % 2 === 0 ? C.green : C.orange;
          return (
            <Card
              key={s.en}
              glow={active ? color : undefined}
              style={{
                height: 270,
                padding: '26px 26px',
                opacity: Math.min(1, p * 1.4),
                transform: `perspective(900px) rotateX(${(1 - p) * 70}deg) scale(${active ? 1.04 : 1})`,
                background: active ? `${color}22` : C.card,
              }}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Icon name={s.icon} size={66} color={color} progress={ramp(frame, t, 16)} />
                <div style={{fontFamily: F.en, fontWeight: 800, fontSize: 54, color: 'rgba(255,255,255,0.18)'}}>0{i + 1}</div>
              </div>
              <div style={{fontFamily: F.en, fontWeight: 700, fontSize: 27, color: C.white, marginTop: 18}}>{s.en}</div>
              <div style={{fontFamily: F.kh, fontSize: 28, lineHeight: 1.7, color: C.soft}}>{s.kh}</div>
            </Card>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ================================================================== 4. WHY OWNERS NEED IT
const WHY = [
  {kh: 'ទិសដៅច្បាស់លាស់', en: 'Clear direction', icon: 'compass', color: C.green},
  {kh: 'សម្រេចចិត្តត្រឹមត្រូវ', en: 'Better decisions', icon: 'bulb', color: C.gold},
  {kh: 'គ្រប់គ្រងសាច់ប្រាក់', en: 'Cash control', icon: 'coins', color: C.orange},
  {kh: 'វាស់វែងលទ្ធផល', en: 'Measure results', icon: 'target', color: '#5AA9F0'},
] as const;

export const Why: React.FC<SceneProps> = ({lines}) => {
  const frame = useCurrentFrame();
  const at = lines.map((l) => l.at);
  return (
    <AbsoluteFill style={{alignItems: 'center', paddingTop: 120}}>
      {WHY.map((_, i) => (
        <Sfx key={i} name="whoosh" at={at[i + 1] - 4} volume={0.25} />
      ))}
      {WHY.map((_, i) => (
        <Sfx key={`p${i}`} name="pop" at={at[i + 1] + 2} volume={0.35} />
      ))}
      <Kicker text="Why business owners need it" />
      <div style={{height: 6}} />
      <Heading text="ហេតុអ្វីម្ចាស់អាជីវកម្មត្រូវការ?" size={62} align="center" />
      <div style={{display: 'flex', gap: 34, marginTop: 50}}>
        {WHY.map((w, i) => {
          const t = at[i + 1];
          const p = interpolate(frame - t, [0, 12], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.6))});
          const float = Math.sin((frame - t) / 14) * 6;
          return (
            <Card
              key={w.en}
              glow={frame >= t ? w.color : undefined}
              style={{
                width: 380,
                height: 430,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '40px 20px',
                opacity: Math.min(1, p * 1.5),
                transform: `translateY(${(1 - p) * 160 + (p > 0.99 ? float : 0)}px)`,
              }}
            >
              <div style={{fontFamily: F.en, fontWeight: 800, fontSize: 30, color: w.color}}>0{i + 1}</div>
              <div
                style={{
                  width: 170,
                  height: 170,
                  borderRadius: 85,
                  marginTop: 14,
                  background: `${w.color}22`,
                  border: `3px solid ${w.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={w.icon} size={104} color={w.color} progress={ramp(frame, t + 2, 18)} />
              </div>
              <div style={{fontFamily: F.kh, fontWeight: 700, fontSize: 38, lineHeight: 1.7, color: C.white, marginTop: 26, textAlign: 'center'}}>{w.kh}</div>
              <div style={{fontFamily: F.en, fontWeight: 500, fontSize: 24, color: C.muted}}>{w.en}</div>
            </Card>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
