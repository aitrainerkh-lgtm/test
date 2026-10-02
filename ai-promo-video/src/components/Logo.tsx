import React from 'react';
import {Img} from 'remotion';
import {config} from '../config';
import {hasFile, src} from '../assets';
import {C, FONT_EN} from '../theme';

/** Uses public/logo.png if present, otherwise a built-in wordmark. */
export const Logo: React.FC<{height?: number}> = ({height = 110}) => {
  if (hasFile(config.assets.logo)) {
    return <Img src={src(config.assets.logo)} style={{height, width: 'auto', objectFit: 'contain'}} />;
  }
  const s = height;
  return (
    <div style={{display: 'inline-flex', alignItems: 'center', gap: s * 0.22}}>
      <div
        style={{
          width: s,
          height: s,
          borderRadius: s * 0.26,
          background: C.navy,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: '0 10px 24px rgba(20,36,107,0.25)',
        }}
      >
        <span style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: s * 0.46, color: C.white, letterSpacing: -1}}>
          AI
        </span>
        <span
          style={{
            position: 'absolute',
            right: s * 0.16,
            top: s * 0.16,
            width: s * 0.14,
            height: s * 0.14,
            borderRadius: 99,
            background: C.lime,
          }}
        />
      </div>
      <div style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: s * 0.36, color: C.navy, lineHeight: 1.05}}>
        {config.brand.name}
      </div>
    </div>
  );
};
