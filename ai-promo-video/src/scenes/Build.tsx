import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {config} from '../config';
import {C, FONT_EN, FONT_KH_BODY} from '../theme';
import {Enter, RichText, SectionLabel} from '../components/ui';
import {Scene} from '../components/Scene';
import {StockSales} from './build/StockSales';
import {Billing} from './build/Billing';
import {LeaveTracker} from './build/LeaveTracker';
import {SalesAgent} from './build/SalesAgent';

const SubCard: React.FC<{titleEn: string; titleKh: string; children: React.ReactNode}> = ({titleEn, titleKh, children}) => (
  <AbsoluteFill style={{alignItems: 'center'}}>
    <div style={{position: 'absolute', top: 240, left: 60, right: 60, textAlign: 'center'}}>
      <Enter delay={0}>
        <div style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: 76, color: C.navy, lineHeight: 1.15}}>
          <RichText text={titleEn} hlDelay={16} />
        </div>
      </Enter>
      <Enter delay={6} style={{marginTop: 10}}>
        <div style={{fontFamily: FONT_KH_BODY, fontWeight: 700, fontSize: 40, color: C.navySoft, lineHeight: 1.6}}>{titleKh}</div>
      </Enter>
    </div>
    <div style={{position: 'absolute', top: 470, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>{children}</div>
  </AbsoluteFill>
);

export const Build: React.FC = () => {
  const {fps} = useVideoConfig();
  const b = config.build;
  const total = Math.round((config.scenes.build.end - config.scenes.build.start) * fps);
  const each = Math.round(total / 4);

  const cards = [
    {key: 'stock', titleEn: b.stock.titleEn, titleKh: b.stock.titleKh, node: <StockSales />},
    {key: 'billing', titleEn: b.billing.titleEn, titleKh: b.billing.titleKh, node: <Billing />},
    {key: 'leave', titleEn: b.leave.titleEn, titleKh: b.leave.titleKh, node: <LeaveTracker />},
    {key: 'agent', titleEn: b.agent.titleEn, titleKh: b.agent.titleKh, node: <SalesAgent />},
  ];

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 140, left: 0, right: 0, textAlign: 'center'}}>
        <Enter delay={0}>
          <SectionLabel number={b.labelNumber} text={b.labelText} />
        </Enter>
      </div>
      {cards.map((c, i) => (
        <Scene
          key={c.key}
          name={c.key}
          from={i * each}
          dur={i === cards.length - 1 ? total - i * each : each}
          fadeIn={i > 0}
          fadeOut={i < cards.length - 1}
        >
          <SubCard titleEn={c.titleEn} titleKh={c.titleKh}>
            {c.node}
          </SubCard>
        </Scene>
      ))}
    </AbsoluteFill>
  );
};
