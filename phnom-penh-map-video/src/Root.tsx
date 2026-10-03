import React from 'react';
import {Composition} from 'remotion';
import {PhnomPenhMap, DURATION, FPS} from './PhnomPenhMap';

export const RemotionRoot: React.FC = () => (
	<Composition
		id="PhnomPenhMap"
		component={PhnomPenhMap}
		durationInFrames={DURATION}
		fps={FPS}
		width={1920}
		height={1080}
	/>
);
