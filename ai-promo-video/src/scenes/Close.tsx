import React from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame} from 'remotion';
import {config} from '../config';
import {hasFile, src} from '../assets';
import {C, FONT_EN, FONT_KH_BODY} from '../theme';
import {Card, Enter, RichText} from '../components/ui';
import {TelegramIcon} from '../components/icons';
import {QR} from '../components/QR';
import {Logo} from '../components/Logo';

export const Close: React.FC = () => {
  const frame = useCurrentFrame();
  const c = config.close;
  const qrSize = 560;
  // Lime corner brackets draw in around the QR.
  const corner = interpolate(frame, [26, 46], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const bracket = (pos: 'tl' | 'tr' | 'bl' | 'br') => {
    const len = 90 * corner;
    const s: React.CSSProperties = {position: 'absolute', width: len, height: len, borderColor: C.lime, borderStyle: 'solid', borderWidth: 0};
    const off = -22;
    if (pos === 'tl') Object.assign(s, {left: off, top: off, borderLeftWidth: 12, borderTopWidth: 12, borderTopLeftRadius: 26});
    if (pos === 'tr') Object.assign(s, {right: off, top: off, borderRightWidth: 12, borderTopWidth: 12, borderTopRightRadius: 26});
    if (pos === 'bl') Object.assign(s, {left: off, bottom: off, borderLeftWidth: 12, borderBottomWidth: 12, borderBottomLeftRadius: 26});
    if (pos === 'br') Object.assign(s, {right: off, bottom: off, borderRightWidth: 12, borderBottomWidth: 12, borderBottomRightRadius: 26});
    return <div key={pos} style={s} />;
  };

  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <Enter delay={0} style={{marginTop: 150, textAlign: 'center'}}>
        <div style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: 92, color: C.navy}}>
          <RichText text={c.headline} hlDelay={18} />
        </div>
      </Enter>
      <Enter delay={6} style={{marginTop: 8}}>
        <div style={{fontFamily: FONT_KH_BODY, fontWeight: 700, fontSize: 44, color: C.navySoft, lineHeight: 1.6}}>{c.headlineKh}</div>
      </Enter>

      <Enter delay={12} scaleFrom={0.8} style={{marginTop: 60}}>
        <div style={{position: 'relative'}}>
          {(['tl', 'tr', 'bl', 'br'] as const).map(bracket)}
          <Card style={{padding: 36}}>
            {hasFile(config.assets.qr) ? (
              <Img src={src(config.assets.qr)} style={{width: qrSize, height: qrSize, objectFit: 'contain', display: 'block'}} />
            ) : (
              <QR value={c.qrFallbackUrl} size={qrSize} color={C.navy} />
            )}
          </Card>
        </div>
      </Enter>

      <Enter delay={24} style={{marginTop: 64}}>
        <div style={{fontFamily: FONT_EN, fontWeight: 600, fontSize: 30, color: C.muted, textAlign: 'center'}}>{c.telegramLabel}</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 20, marginTop: 14}}>
          <TelegramIcon size={84} />
          <div style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: 64, color: C.navy}}>{c.telegramHandle}</div>
        </div>
      </Enter>

      <Enter delay={34} style={{marginTop: 50}}>
        <Logo height={72} />
      </Enter>
    </AbsoluteFill>
  );
};
