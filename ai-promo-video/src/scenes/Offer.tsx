import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ArrowRight, CalendarDays, Clock, Video} from 'lucide-react';
import {config} from '../config';
import {C, FONT_EN, SHADOW} from '../theme';
import {Card, Enter, HL, Pill} from '../components/ui';
import {Logo} from '../components/Logo';

const InfoCard: React.FC<{icon: React.ReactNode; title: string; sub?: string | null}> = ({icon, title, sub}) => (
  <Card style={{flex: 1, padding: '28px 30px', display: 'flex', alignItems: 'center', gap: 22}}>
    <div style={{width: 84, height: 84, borderRadius: 22, background: C.limeSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
      {icon}
    </div>
    <div style={{fontFamily: FONT_EN}}>
      <div style={{fontWeight: 800, fontSize: 44, color: C.navy, lineHeight: 1.1}}>{title}</div>
      {sub ? <div style={{fontWeight: 600, fontSize: 25, color: C.muted, marginTop: 6}}>{sub}</div> : null}
    </div>
  </Card>
);

export const Offer: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const o = config.offer;
  const priceP = spring({frame: frame - 40, fps, config: {damping: 10, stiffness: 120}});
  const badgeP = spring({frame: frame - 70, fps, config: {damping: 9, stiffness: 140}});
  // A trailing "→" or "->" in the CTA is drawn as an arrow icon.
  const ctaArrow = /\s*(→|->)\s*$/.test(o.cta);
  const ctaText = o.cta.replace(/\s*(→|->)\s*$/, '');
  const ctaPulse = 1 + 0.035 * Math.max(0, Math.sin((frame - 90) / 9));

  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <Enter delay={0} style={{marginTop: 150}}>
        <Logo height={100} />
      </Enter>

      <div style={{display: 'flex', flexDirection: 'column', gap: 20, width: 900, marginTop: 60}}>
        <Enter delay={8} style={{display: 'flex'}}>
          <InfoCard icon={<CalendarDays size={46} color={C.navy} />} title={o.duration} sub={o.dates} />
        </Enter>
        <Enter delay={14} style={{display: 'flex'}}>
          <InfoCard icon={<Clock size={46} color={C.navy} />} title={o.time} />
        </Enter>
      </div>

      <Enter delay={20} style={{marginTop: 36}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: FONT_EN, fontWeight: 700, fontSize: 36, color: C.navySoft}}>
          <Video size={40} color={C.navySoft} />
          {o.delivery}
        </div>
      </Enter>

      <Enter delay={30} style={{marginTop: 60}}>
        <div style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: 34, letterSpacing: 6, color: C.muted, textAlign: 'center'}}>
          {o.priceLabel.toUpperCase()}
        </div>
      </Enter>

      <div style={{position: 'relative', marginTop: 0}}>
        <div
          style={{
            fontFamily: FONT_EN,
            fontWeight: 800,
            fontSize: 300,
            lineHeight: 1.05,
            letterSpacing: -8,
            color: C.navy,
            opacity: Math.min(1, priceP * 1.4),
            transform: `scale(${0.6 + 0.4 * priceP})`,
          }}
        >
          <HL delay={62} thickness={0.16}>${o.price}</HL>
        </div>
        {o.bonus ? (
          <div
            style={{
              position: 'absolute',
              right: -190,
              top: -10,
              width: 210,
              height: 210,
              borderRadius: 999,
              background: C.lime,
              color: C.navy,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              fontFamily: FONT_EN,
              fontWeight: 800,
              fontSize: 32,
              lineHeight: 1.15,
              padding: 24,
              boxShadow: '0 16px 34px rgba(139,224,60,0.5)',
              transform: `rotate(${-12 + 12 * badgeP}deg) scale(${badgeP})`,
            }}
          >
            {o.bonus}
          </div>
        ) : null}
      </div>

      <Enter delay={80} style={{marginTop: 50}}>
        <div style={{transform: `scale(${ctaPulse})`}}>
          <Pill size={52} style={{padding: '30px 70px', boxShadow: SHADOW}}>
            {ctaText}
            {ctaArrow ? <ArrowRight size={56} strokeWidth={3.2} color={C.lime} /> : null}
          </Pill>
        </div>
      </Enter>
    </AbsoluteFill>
  );
};
