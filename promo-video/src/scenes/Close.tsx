import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {config} from '../config';
import {hasStaticFile} from '../fonts';
import {enter, springAt} from '../lib/anim';
import {TelegramIcon} from '../components/Icons';
import {Card, Center, Logo} from '../components/UI';
import {fonts, theme} from '../theme';

const S = config.scenes.close;

const QRPlaceholder: React.FC = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      border: `6px dashed ${theme.greyLight}`,
      borderRadius: theme.radius,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: fonts.en,
      fontWeight: 800,
      fontSize: 64,
      color: theme.greyLight,
    }}
  >
    QR
  </div>
);

export const Close: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const qr = springAt(frame, fps, 22, {damping: 13, stiffness: 120});
  const qrFile = config.files.qr;
  return (
    <AbsoluteFill>
      <Center top={130}>
        <div style={enter(frame, fps, 2, 30)}>
          <Logo size={150} />
        </div>
        <div style={{marginTop: 30, fontFamily: fonts.khHead, fontWeight: 800, fontSize: 68, lineHeight: 1.6, color: theme.navy, ...enter(frame, fps, 10, 40)}}>
          {S.heading}
        </div>
        <Card
          style={{
            marginTop: 26,
            width: 620,
            height: 620,
            padding: 40,
            opacity: Math.min(1, qr * 1.5),
            transform: `scale(${0.7 + 0.3 * qr})`,
          }}
        >
          {hasStaticFile(qrFile) ? (
            <Img src={staticFile(qrFile)} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
          ) : (
            <QRPlaceholder />
          )}
        </Card>
        <div
          style={{
            marginTop: 44,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            background: theme.white,
            borderRadius: 999,
            boxShadow: theme.shadowSoft,
            padding: '14px 36px 14px 16px',
            ...enter(frame, fps, 40, 30),
          }}
        >
          <TelegramIcon size={72} />
          <div style={{fontFamily: fonts.en, fontWeight: 800, fontSize: 46, color: theme.navy}}>{config.course.telegram}</div>
        </div>
      </Center>
    </AbsoluteFill>
  );
};
