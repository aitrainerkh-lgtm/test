import {AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {config} from '../config';
import {CLAMP, enter, prog} from '../lib/anim';
import {CARD_KEYS, CardKey, cardDurations, TRANSITION} from '../lib/timeline';
import {Rich} from '../components/Rich';
import {SectionLabel} from '../components/UI';
import {fonts, theme} from '../theme';
import {StockCard} from './build/StockCard';
import {BillingCard} from './build/BillingCard';
import {LeaveCard} from './build/LeaveCard';
import {AgentCard} from './build/AgentCard';

const B = config.scenes.build;

const CARDS: Record<CardKey, React.FC> = {
  stock: StockCard,
  billing: BillingCard,
  leave: LeaveCard,
  agent: AgentCard,
};

/** Card-to-card transition: slide in from the right, slide out to the left with blur. */
const CardShell: React.FC<{duration: number; first: boolean; last: boolean; children: React.ReactNode}> = ({
  duration,
  first,
  last,
  children,
}) => {
  const frame = useCurrentFrame();
  const inP = first ? 1 : interpolate(frame, [0, TRANSITION + 4], [0, 1], CLAMP);
  const outP = last ? 0 : interpolate(frame, [duration - TRANSITION, duration], [0, 1], CLAMP);
  const o = Math.min(inP, 1 - outP);
  const x = (1 - inP) * 120 - outP * 120;
  return (
    <AbsoluteFill style={{opacity: o, transform: `translateX(${x}px)`, filter: o < 0.99 ? `blur(${(1 - o) * 10}px)` : undefined}}>
      {children}
    </AbsoluteFill>
  );
};

const CardTitle: React.FC<{title: string; subtitle: string}> = ({title, subtitle}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 220,
          left: 40,
          right: 40,
          textAlign: 'center',
          fontFamily: fonts.en,
          fontWeight: 800,
          fontSize: 92,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          color: theme.navy,
          ...enter(frame, fps, 6, 40),
        }}
      >
        <Rich text={title} hl={prog(frame, 22, 18)} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 335,
          left: 40,
          right: 40,
          textAlign: 'center',
          fontFamily: fonts.khBody,
          fontWeight: 700,
          fontSize: 44,
          lineHeight: 1.6,
          color: theme.grey,
          ...enter(frame, fps, 12, 30),
        }}
      >
        {subtitle}
      </div>
    </>
  );
};

export const Build: React.FC = () => {
  const durations = cardDurations();
  let from = 0;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 130, left: 0, right: 0}}>
        <SectionLabel num={B.labelNumber} text={B.label} delay={4} />
      </div>
      {CARD_KEYS.map((key, i) => {
        const Comp = CARDS[key];
        const d = durations[i];
        const last = i === CARD_KEYS.length - 1;
        const seq = (
          <Sequence key={key} from={from} durationInFrames={last ? d : d + TRANSITION} name={`02 ${key}`}>
            <CardShell duration={last ? d : d + TRANSITION} first={i === 0} last={last}>
              <CardTitle title={B[key].title} subtitle={B[key].subtitle} />
              <Comp />
            </CardShell>
          </Sequence>
        );
        from += d;
        return seq;
      })}
    </AbsoluteFill>
  );
};
