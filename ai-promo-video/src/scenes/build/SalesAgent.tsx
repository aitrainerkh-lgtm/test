import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Coffee, Store} from 'lucide-react';
import {config} from '../../config';
import {C, FONT_EN, FONT_KH_BODY, usd} from '../../theme';
import {Enter} from '../../components/ui';
import {MessengerIcon, TelegramIcon} from '../../components/icons';
import {QR} from '../../components/QR';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const MSG_BLUE = '#0A7CFF';
const KHQR_RED = '#E1232E';

/** Message that grows in height, slides up and fades in. */
const Msg: React.FC<{at: number; maxH: number; align: 'left' | 'right'; children: React.ReactNode}> = ({at, maxH, align, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: frame - at, fps, config: {damping: 15, stiffness: 120}});
  if (frame < at) return null;
  return (
    <div
      style={{
        maxHeight: maxH * p,
        opacity: p,
        transform: `translateY(${(1 - p) * 30}px)`,
        display: 'flex',
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        marginTop: 16 * p,
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
};

const Typing: React.FC<{from: number; to: number}> = ({from, to}) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= to) return null;
  return (
    <div style={{display: 'flex', marginTop: 16}}>
      <div style={{background: '#EEF0F4', borderRadius: 28, padding: '22px 28px', display: 'flex', gap: 10}}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 16,
              height: 16,
              borderRadius: 99,
              background: C.muted,
              opacity: 0.35 + 0.65 * Math.abs(Math.sin((frame - from) / 7 - i * 0.6)),
              transform: `translateY(${-5 * Math.abs(Math.sin((frame - from) / 7 - i * 0.6))}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export const SalesAgent: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const a = config.build.agent;
  const total = a.product.price * a.product.qty;

  const tCustomer = 8;
  const tTypingEnd = 52;
  const tReply = 52;
  const tProduct = 70;
  const tKhqr = 112;
  const tTelegram = 160;
  const tgP = spring({frame: frame - tTelegram, fps, config: {damping: 14}});

  return (
    <Enter delay={2} style={{width: 800, position: 'relative'}}>
      <div
        style={{
          height: 960,
          borderRadius: 48,
          background: C.white,
          boxShadow: '0 30px 60px rgba(20,36,107,0.16)',
          border: `10px solid ${C.navy}`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* header */}
        <div style={{display: 'flex', alignItems: 'center', gap: 18, padding: '24px 28px', borderBottom: `2px solid ${C.line}`}}>
          <div style={{position: 'relative'}}>
            <div style={{width: 72, height: 72, borderRadius: 99, background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Store size={38} color={C.lime} />
            </div>
            <div style={{position: 'absolute', right: 0, bottom: 2, width: 20, height: 20, borderRadius: 99, background: C.success, border: '3px solid #fff'}} />
          </div>
          <div style={{flex: 1, fontFamily: FONT_EN}}>
            <div style={{fontWeight: 800, fontSize: 32, color: C.navy}}>{config.build.shopName}</div>
            <div style={{fontWeight: 600, fontSize: 24, color: C.muted}}>{a.channelStatus}</div>
          </div>
          <MessengerIcon size={56} />
        </div>

        {/* messages, anchored to the bottom so new ones push older ones up */}
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 28px 28px', overflow: 'hidden', background: '#FAFBFD'}}>
          <Msg at={tCustomer} maxH={160} align="right">
            <div style={{maxWidth: 560, background: MSG_BLUE, color: C.white, borderRadius: 30, padding: '18px 28px', fontFamily: FONT_KH_BODY, fontSize: 32, lineHeight: 1.6}}>
              {a.customerMessage}
            </div>
          </Msg>
          <Typing from={tCustomer + 14} to={tTypingEnd} />
          <Msg at={tReply} maxH={220} align="left">
            <div style={{maxWidth: 600, background: '#EEF0F4', color: C.navy, borderRadius: 30, padding: '18px 28px', fontFamily: FONT_KH_BODY, fontSize: 30, lineHeight: 1.6}}>
              {a.aiReply}
            </div>
          </Msg>
          <Msg at={tProduct} maxH={200} align="left">
            <div style={{width: 520, background: C.white, borderRadius: 24, boxShadow: '0 8px 20px rgba(20,36,107,0.1)', border: `2px solid ${C.line}`, display: 'flex', overflow: 'hidden'}}>
              <div style={{width: 150, background: 'linear-gradient(145deg, #C98A55, #7B4A26)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Coffee size={70} color="#fff" />
              </div>
              <div style={{padding: '18px 22px', fontFamily: FONT_EN, flex: 1}}>
                <div style={{fontWeight: 800, fontSize: 28, color: C.navy}}>{a.product.name}</div>
                <div style={{fontWeight: 700, fontSize: 24, color: C.muted, marginTop: 4}}>
                  {usd(a.product.price)} × {a.product.qty}
                </div>
                <div style={{marginTop: 10, background: MSG_BLUE, color: '#fff', fontWeight: 800, fontSize: 24, borderRadius: 12, padding: '8px 0', textAlign: 'center'}}>
                  Order now
                </div>
              </div>
            </div>
          </Msg>
          <Msg at={tKhqr} maxH={320} align="left">
            <div style={{width: 420, borderRadius: 24, overflow: 'hidden', background: C.white, boxShadow: '0 12px 28px rgba(225,35,46,0.22)'}}>
              <div style={{background: KHQR_RED, padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <span style={{fontFamily: FONT_EN, fontWeight: 800, fontSize: 32, color: '#fff', letterSpacing: 2}}>KHQR</span>
                <span style={{fontFamily: FONT_EN, fontWeight: 700, fontSize: 20, color: '#FFD6D8'}}>{a.paymentTitle}</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 20, padding: '18px 22px', borderTop: `4px dashed #F3C6C9`}}>
                <QR value={`DEMO ${a.orderNo} ${usd(total)}`} size={150} />
                <div style={{fontFamily: FONT_EN}}>
                  <div style={{fontWeight: 700, fontSize: 22, color: C.muted}}>{config.build.shopName}</div>
                  <div style={{fontWeight: 800, fontSize: 52, color: C.navy, marginTop: 4}}>{usd(total)}</div>
                  <div style={{fontWeight: 700, fontSize: 22, color: C.muted}}>Order {a.orderNo}</div>
                </div>
              </div>
            </div>
          </Msg>
        </div>
      </div>

      {/* Telegram notification */}
      <div
        style={{
          position: 'absolute',
          left: 30,
          right: 30,
          top: 20,
          opacity: interpolate(tgP, [0, 0.3], [0, 1], clamp),
          transform: `translateY(${(1 - tgP) * -140}px)`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            background: 'rgba(255,255,255,0.97)',
            borderRadius: 26,
            padding: '22px 26px',
            boxShadow: '0 22px 50px rgba(20,36,107,0.25)',
            fontFamily: FONT_EN,
          }}
        >
          <TelegramIcon size={74} />
          <div style={{flex: 1}}>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <span style={{fontWeight: 800, fontSize: 30, color: C.navy}}>{a.telegramGroup}</span>
              <span style={{fontWeight: 600, fontSize: 22, color: C.muted}}>now</span>
            </div>
            <div style={{fontWeight: 700, fontSize: 28, color: C.navy, marginTop: 4}}>
              {a.telegramMessage} · {usd(total)}
            </div>
          </div>
        </div>
      </div>
    </Enter>
  );
};
