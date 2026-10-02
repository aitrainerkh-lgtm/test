import {Composition} from 'remotion';
import {Main} from './Main';
import {FPS, totalFrames} from './lib/timeline';

export const RemotionRoot: React.FC = () => (
  <Composition id="PromoVideo" component={Main} durationInFrames={totalFrames()} fps={FPS} width={1080} height={1920} />
);
