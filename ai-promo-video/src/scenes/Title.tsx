import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Check} from 'lucide-react';
import {config} from '../config';
import {C, FONT_EN, FONT_KH_BODY} from '../theme';
import {Enter, Pill, RichText} from '../components/ui';
import {Logo} from '../components/Logo';

export const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const t = config.title;
  const pulse = 0.55 + 0.45 * Math.abs(Math.sin(frame / 14));
  const aiGlow = interpolate(frame, [20, 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{alignItems: 'center', paddingTop: 210}}>
      <Enter delay={2}>
        <Logo height={120} />
      </Enter>
      <Enter delay={10} style={{marginTop: 70}}>
        <Pill size={30} style={{boxShadow: '0 10px 24px rgba(20,36,107,0.2)'}}>
          <span style={{width: 16, height: 16, borderRadius: 99, background: C.lime, opacity: pulse}} />
          {t.livePill}
        </Pill>
      </Enter>
      <Enter delay={16} y={90} scaleFrom={0.8} style={{marginTop: 10}}>
        <div
          style={{
            fontFamily: FONT_EN,
            fontWeight: 800,
            fontSize: 430,
            lineHeight: 1.05,
            letterSpacing: -14,
            color: C.navy,
            textShadow: `0 ${24 * aiGlow}px ${60 * aiGlow}px rgba(20,36,107,0.18)`,
          }}
        >
          {t.bigWord}
        </div>
      </Enter>
      <Enter delay={26} style={{marginTop: -10, textAlign: 'center', padding: '0 70px'}}>
        <div style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: 78, lineHeight: 1.2, color: C.navy}}>
          <RichText text={t.courseTitle} hlDelay={44} />
        </div>
      </Enter>
      <Enter delay={34} style={{marginTop: 26}}>
        <div style={{fontFamily: FONT_KH_BODY, fontWeight: 700, fontSize: 44, color: C.navySoft, lineHeight: 1.6}}>
          {t.courseTitleKh}
        </div>
      </Enter>
      <Enter delay={46} style={{marginTop: 46}}>
        <Pill bg={C.lime} color={C.navy} size={42} style={{boxShadow: '0 12px 30px rgba(139,224,60,0.45)'}}>
          <Check size={42} strokeWidth={4} />
          {t.noCodePill}
        </Pill>
      </Enter>
    </AbsoluteFill>
  );
};
