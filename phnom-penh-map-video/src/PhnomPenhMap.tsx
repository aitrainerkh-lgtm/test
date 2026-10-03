import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import data from './mapData.json';
import {FONT_KHMER_BODY, FONT_KHMER_HEADING, FONT_LATIN} from './fonts';

export const FPS = 30;
export const DURATION = 690;

const W = 1920;
const H = 1080;

const C = {
	bg: '#070D1A',
	land: '#0B1426',
	province: '#1A2A47',
	country: '#5B7BA8',
	water: '#123A5E',
	waterEdge: '#1E5A8A',
	waterLabel: '#7FB4E0',
	minor: '#1C2944',
	tertiary: '#2A3B5E',
	secondary: '#45608E',
	major: '#E8731A',
	boundary: '#3CB54A',
	text: '#F4F6FA',
	muted: '#A9B6CC',
	card: 'rgba(8, 15, 30, 0.86)',
};

// Same Web Mercator "world pixel" projection as scripts/build_map_data.py.
const [LON0, LAT0] = data.center as [number, number];
const merc = (lat: number) => (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const project = (lon: number, lat: number): [number, number] => [
	(lon - LON0) * data.k,
	-(merc(lat) - merc(LAT0)) * data.k,
];

type Cam = {x: number; y: number; s: number};
const COUNTRY_VIEW = (() => {
	const [x, y] = project(104.95, 12.6);
	const s = 0.046;
	return {x: x - 230 / s, y, s};
})();
const CITY_VIEW: Cam = {x: 0, y: -10, s: 0.62};
const CLOSE_VIEW: Cam = (() => {
	const [x, y] = project(104.9285, 11.5625);
	return {x, y, s: 4.2};
})();
const END_VIEW: Cam = {x: 40, y: -10, s: 0.78};

const ease = Easing.bezier(0.65, 0, 0.35, 1);

const camBetween = (a: Cam, b: Cam, t: number): Cam => {
	const e = ease(Math.min(1, Math.max(0, t)));
	// Interpolate zoom in log space; move the centre with the zoom so the target stays steady.
	const s = Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * e);
	const w = a.s === b.s ? e : (1 / a.s - 1 / s) / (1 / a.s - 1 / b.s);
	return {x: a.x + (b.x - a.x) * w, y: a.y + (b.y - a.y) * w, s};
};

const cameraAt = (f: number): Cam => {
	if (f < 120) {
		const drift = interpolate(f, [0, 120], [0, 1]);
		return {...COUNTRY_VIEW, s: COUNTRY_VIEW.s * (1 + 0.08 * drift)};
	}
	if (f < 235) return camBetween({...COUNTRY_VIEW, s: COUNTRY_VIEW.s * 1.08}, CITY_VIEW, (f - 120) / 115);
	if (f < 380) return {...CITY_VIEW, s: CITY_VIEW.s * (1 + 0.06 * ((f - 235) / 145))};
	if (f < 450) return camBetween({...CITY_VIEW, s: CITY_VIEW.s * 1.06}, CLOSE_VIEW, (f - 380) / 70);
	if (f < 590) return {...CLOSE_VIEW, s: CLOSE_VIEW.s * (1 + 0.05 * ((f - 450) / 140))};
	return camBetween({...CLOSE_VIEW, s: CLOSE_VIEW.s * 1.05}, END_VIEW, (f - 590) / 65);
};

const toScreen = (cam: Cam, p: number[]): [number, number] => [
	(p[0] - cam.x) * cam.s + W / 2,
	(p[1] - cam.y) * cam.s + H / 2,
];

const fade = (f: number, a: number, b: number, c?: number, d?: number) =>
	c === undefined
		? interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
		: interpolate(f, [a, b, c, d as number], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

// ---------------------------------------------------------------- map layers

const MapLayers: React.FC<{cam: Cam; frame: number}> = ({cam, frame}) => {
	const {s} = cam;
	const countryOpacity = interpolate(s, [0.09, 0.2], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const cityOpacity = interpolate(s, [0.1, 0.3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const outline = fade(frame, 5, 85);
	const provinces = fade(frame, 35, 95);
	const countryRivers = fade(frame, 45, 110);
	const roadReveal = interpolate(frame, [215, 345], [0, 1300], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.cubic),
	});
	const boundaryDraw = fade(frame, 185, 285);
	const widen = interpolate(s, [0.6, 4.4], [1, 1.9], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const stroke = (w: number) => w * widen;

	const [bx0, by0] = data.cityBounds[0];
	const [bx1, by1] = data.cityBounds[1];
	const cx = (bx0 + bx1) / 2;
	const cy = (by0 + by1) / 2;

	return (
		<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
			<defs>
				<radialGradient id="cityFade" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={(bx1 - bx0) / 2}>
					<stop offset="0.72" stopColor="#fff" />
					<stop offset="1" stopColor="#000" />
				</radialGradient>
				<mask id="cityMask" maskUnits="userSpaceOnUse" x={bx0} y={by0} width={bx1 - bx0} height={by1 - by0}>
					<rect x={bx0} y={by0} width={bx1 - bx0} height={by1 - by0} fill="url(#cityFade)" />
				</mask>
				<clipPath id="roadReveal">
					<circle cx={0} cy={0} r={roadReveal} />
				</clipPath>
				<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation={3 / s} result="b" />
					<feMerge>
						<feMergeNode in="b" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>
			<g transform={`translate(${W / 2} ${H / 2}) scale(${s}) translate(${-cam.x} ${-cam.y})`}>
				{/* Country view */}
				<g opacity={countryOpacity}>
					<path d={data.country} fill={C.land} opacity={outline} />
					<g opacity={provinces}>
						{data.provinces.map((d, i) => (
							<path key={i} d={d} fill="none" stroke={C.province} strokeWidth={1} vectorEffect="non-scaling-stroke" />
						))}
					</g>
					<path d={data.countryLakes} fill="#1B4F7D" opacity={countryRivers} />
					<path
						d={data.countryRivers}
						fill="none"
						stroke="#2C6FA6"
						strokeWidth={2.6}
						strokeLinecap="round"
						vectorEffect="non-scaling-stroke"
						opacity={countryRivers}
					/>
					<path
						d={data.country}
						fill="none"
						stroke={C.country}
						strokeWidth={2 / s}
						strokeDasharray={`${data.countryLength * outline} ${data.countryLength}`}
					/>
				</g>

				{/* City view */}
				<g opacity={cityOpacity} mask="url(#cityMask)">
					<rect x={bx0} y={by0} width={bx1 - bx0} height={by1 - by0} fill={C.land} />
					<path d={data.water} fill={C.water} stroke={C.waterEdge} strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
					<path d={data.waterLines} fill="none" stroke={C.water} strokeWidth={stroke(1)} vectorEffect="non-scaling-stroke" />
					<g clipPath="url(#roadReveal)" fill="none" strokeLinecap="round" strokeLinejoin="round">
						<path d={data.roads.minor} stroke={C.minor} strokeWidth={stroke(0.7)} vectorEffect="non-scaling-stroke" />
						<path d={data.roads.tertiary} stroke={C.tertiary} strokeWidth={stroke(1)} vectorEffect="non-scaling-stroke" />
						<path d={data.roads.secondary} stroke={C.secondary} strokeWidth={stroke(1.4)} vectorEffect="non-scaling-stroke" />
						<path d={data.rail} stroke={C.muted} strokeWidth={1} strokeDasharray="4 4" opacity={0.5} vectorEffect="non-scaling-stroke" />
						<path
							d={data.roads.major}
							stroke={C.major}
							strokeWidth={stroke(1.9)}
							vectorEffect="non-scaling-stroke"
							filter="url(#glow)"
							opacity={0.95}
						/>
					</g>
					<path
						d={data.phnomPenh}
						fill="none"
						stroke={C.boundary}
						strokeWidth={2.4 / s}
						strokeDasharray={`${data.phnomPenhLength * boundaryDraw} ${data.phnomPenhLength}`}
						filter="url(#glow)"
					/>
				</g>
			</g>
		</svg>
	);
};

// ---------------------------------------------------------------- overlays

const Pulse: React.FC<{x: number; y: number; frame: number; opacity: number}> = ({x, y, frame, opacity}) => {
	const rings = [0, 20, 40].map((o) => ((frame + o) % 60) / 60);
	return (
		<div style={{position: 'absolute', left: x, top: y, opacity}}>
			{rings.map((r, i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						width: 16 + r * 90,
						height: 16 + r * 90,
						left: -(8 + r * 45),
						top: -(8 + r * 45),
						borderRadius: '50%',
						border: `2px solid ${C.major}`,
						opacity: 1 - r,
					}}
				/>
			))}
			<div
				style={{
					position: 'absolute',
					width: 16,
					height: 16,
					left: -8,
					top: -8,
					borderRadius: '50%',
					background: C.major,
					boxShadow: `0 0 18px ${C.major}`,
				}}
			/>
		</div>
	);
};

type Landmark = (typeof data.landmarks)[number];

const Pin: React.FC<{lm: Landmark; x: number; y: number; delay: number; frame: number; labelOut: number}> = ({
	lm,
	x,
	y,
	delay,
	frame,
	labelOut,
}) => {
	const {fps} = useVideoConfig();
	const pop = spring({frame: frame - delay, fps, config: {damping: 13, stiffness: 140}});
	const card = spring({frame: frame - delay - 6, fps, config: {damping: 18, stiffness: 120}});
	if (pop <= 0.001) return null;
	const right = lm.side === 'right';
	const lineLen = 34;
	return (
		<div style={{position: 'absolute', left: x, top: y}}>
			<div
				style={{
					position: 'absolute',
					width: 18,
					height: 18,
					left: -9,
					top: -9,
					borderRadius: '50%',
					background: C.major,
					border: '3px solid #fff',
					transform: `scale(${pop})`,
					boxShadow: `0 0 0 ${6 * pop}px rgba(232,115,26,0.25), 0 0 20px rgba(232,115,26,0.7)`,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: -1,
					height: 2,
					width: lineLen * card,
					background: C.major,
					left: right ? 10 : undefined,
					right: right ? undefined : 10,
					opacity: labelOut,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: 0,
					left: right ? 10 + lineLen : undefined,
					right: right ? undefined : 10 + lineLen,
					transform: `translateY(-50%) translateX(${(1 - card) * (right ? -16 : 16)}px)`,
					opacity: card * labelOut,
					background: C.card,
					borderLeft: right ? `3px solid ${C.major}` : undefined,
					borderRight: right ? undefined : `3px solid ${C.major}`,
					padding: '8px 16px 6px',
					borderRadius: 6,
					whiteSpace: 'nowrap',
					textAlign: right ? 'left' : 'right',
					boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
				}}
			>
				<div style={{fontFamily: FONT_LATIN, fontWeight: 650, fontSize: 24, color: C.text, lineHeight: 1.25}}>{lm.en}</div>
				<div style={{fontFamily: FONT_KHMER_BODY, fontSize: 19, color: C.muted, lineHeight: 1.75}}>{lm.km}</div>
			</div>
		</div>
	);
};

const RiverLabel: React.FC<{en: string; km: string; x: number; y: number; opacity: number; size?: number}> = ({
	en,
	km,
	x,
	y,
	opacity,
	size = 1,
}) => (
	<div
		style={{
			position: 'absolute',
			left: x,
			top: y,
			transform: 'translate(-50%, -50%)',
			opacity,
			textAlign: 'center',
			color: C.waterLabel,
			textShadow: '0 2px 10px rgba(0,0,0,0.8)',
			whiteSpace: 'nowrap',
		}}
	>
		<div style={{fontFamily: FONT_LATIN, fontStyle: 'italic', fontWeight: 500, fontSize: 20 * size, letterSpacing: 4 * size, textTransform: 'uppercase'}}>
			{en}
		</div>
		<div style={{fontFamily: FONT_KHMER_BODY, fontSize: 17 * size, lineHeight: 1.7}}>{km}</div>
	</div>
);

const TitleBlock: React.FC<{frame: number; start: number; end?: number}> = ({frame, start, end}) => {
	const {fps} = useVideoConfig();
	const inn = spring({frame: frame - start, fps, config: {damping: 20, stiffness: 90}});
	const out = end === undefined ? 1 : 1 - fade(frame, end, end + 18);
	const o = inn * out;
	return (
		<div style={{position: 'absolute', left: 110, top: 300, opacity: o, transform: `translateY(${(1 - inn) * 30}px)`}}>
			<div style={{width: 90 * inn, height: 5, background: C.major, marginBottom: 26, borderRadius: 3}} />
			<div style={{fontFamily: FONT_KHMER_HEADING, fontSize: 64, color: C.text, lineHeight: 1.55}}>ភ្នំពេញ</div>
			<div style={{fontFamily: FONT_LATIN, fontWeight: 800, fontSize: 104, color: C.text, letterSpacing: 6, lineHeight: 1.05}}>
				PHNOM PENH
			</div>
			<div style={{fontFamily: FONT_LATIN, fontWeight: 400, fontSize: 30, color: C.muted, marginTop: 18, letterSpacing: 1}}>
				Capital of the Kingdom of Cambodia
			</div>
			<div style={{fontFamily: FONT_KHMER_BODY, fontSize: 25, color: C.muted, lineHeight: 1.8}}>រាជធានីនៃព្រះរាជាណាចក្រកម្ពុជា</div>
		</div>
	);
};

const Legend: React.FC<{opacity: number}> = ({opacity}) => {
	const row = (swatch: React.ReactNode, en: string) => (
		<div style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 10}}>
			<div style={{width: 34, display: 'flex', justifyContent: 'center'}}>{swatch}</div>
			<div style={{fontFamily: FONT_LATIN, fontSize: 19, color: C.muted}}>{en}</div>
		</div>
	);
	return (
		<div style={{position: 'absolute', left: 110, bottom: 120, opacity}}>
			{row(<div style={{width: 34, height: 0, borderTop: `3px solid ${C.boundary}`, boxShadow: `0 0 8px ${C.boundary}`}} />, 'Phnom Penh boundary')}
			{row(<div style={{width: 34, height: 4, background: C.major, borderRadius: 2, boxShadow: `0 0 8px ${C.major}`}} />, 'Main roads')}
			{row(<div style={{width: 30, height: 16, background: C.water, border: `1px solid ${C.waterEdge}`, borderRadius: 3}} />, 'Rivers & lakes')}
		</div>
	);
};

// ---------------------------------------------------------------- composition

export const PhnomPenhMap: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const cam = cameraAt(frame);

	const [ppx, ppy] = toScreen(cam, project(104.9282, 11.5563));
	const pulseOpacity = fade(frame, 70, 85, 175, 200);

	const countryTitle = fade(frame, 18, 40, 110, 128);
	const countryIn = spring({frame: frame - 18, fps, config: {damping: 20, stiffness: 90}});

	const riversOverview = fade(frame, 300, 330, 378, 395);
	const riversClose = fade(frame, 455, 480, 585, 600);
	const chaktomuk = fade(frame, 520, 540, 585, 600);
	const labelOut = 1 - fade(frame, 585, 600);
	const pinsOut = 1 - fade(frame, 600, 625);
	const legend = fade(frame, 330, 355, 378, 392) + fade(frame, 650, 672);

	const [chx, chy] = toScreen(cam, data.chaktomuk);
	const credit = fade(frame, 10, 30);
	const brand = fade(frame, 640, 665);

	return (
		<AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
			<MapLayers cam={cam} frame={frame} />

			{/* soft vignette */}
			<AbsoluteFill
				style={{background: 'radial-gradient(ellipse at 55% 50%, rgba(7,13,26,0) 45%, rgba(7,13,26,0.85) 100%)'}}
			/>

			{/* Left panel behind titles */}
			<AbsoluteFill
				style={{
					opacity: Math.max(countryTitle, fade(frame, 245, 275, 378, 396), fade(frame, 620, 650)),
					background: 'linear-gradient(90deg, rgba(7,13,26,0.92) 0%, rgba(7,13,26,0.75) 28%, rgba(7,13,26,0) 52%)',
				}}
			/>

			{/* Country chapter */}
			<Pulse x={ppx} y={ppy} frame={frame} opacity={pulseOpacity} />
			<div
				style={{
					position: 'absolute',
					left: 110,
					top: 380,
					opacity: countryTitle,
					transform: `translateY(${(1 - countryIn) * 24}px)`,
				}}
			>
				<div style={{fontFamily: FONT_LATIN, fontSize: 26, letterSpacing: 10, color: C.muted, fontWeight: 600}}>KINGDOM OF</div>
				<div style={{fontFamily: FONT_LATIN, fontSize: 96, fontWeight: 800, color: C.text, letterSpacing: 4, lineHeight: 1.05}}>
					CAMBODIA
				</div>
				<div style={{fontFamily: FONT_KHMER_HEADING, fontSize: 46, color: C.text, lineHeight: 1.6, marginTop: 10}}>
					ព្រះរាជាណាចក្រកម្ពុជា
				</div>
			</div>
			<div
				style={{
					position: 'absolute',
					left: ppx + 26,
					top: ppy - 18,
					opacity: fade(frame, 80, 100, 150, 170),
					fontFamily: FONT_LATIN,
					fontWeight: 650,
					fontSize: 24,
					color: C.text,
					textShadow: '0 2px 8px #000',
				}}
			>
				Phnom Penh
			</div>

			{/* City chapter */}
			{data.riversOverview.map((r) => {
				const [x, y] = toScreen(cam, r.p);
				return <RiverLabel key={r.en} en={r.en} km={r.km} x={x} y={y} opacity={riversOverview} size={0.9} />;
			})}
			<TitleBlock frame={frame} start={250} end={378} />
			<Legend opacity={Math.min(1, legend)} />

			{/* Close-up chapter */}
			{data.riversClose.map((r) => {
				const [x, y] = toScreen(cam, r.p);
				return <RiverLabel key={r.en} en={r.en} km={r.km} x={x} y={y} opacity={riversClose} />;
			})}
			<div
				style={{
					position: 'absolute',
					left: chx,
					top: chy,
					transform: 'translate(-50%, -50%)',
					opacity: chaktomuk,
					textAlign: 'center',
					whiteSpace: 'nowrap',
				}}
			>
				<div style={{fontFamily: FONT_LATIN, fontWeight: 700, fontSize: 22, color: '#BFE3FF', letterSpacing: 3}}>CHAKTOMUK</div>
				<div style={{fontFamily: FONT_KHMER_BODY, fontSize: 18, color: '#BFE3FF', lineHeight: 1.7}}>ចតុមុខ</div>
				<div style={{fontFamily: FONT_LATIN, fontSize: 16, color: C.muted, marginTop: 2}}>Where four river arms meet</div>
			</div>
			<div style={{opacity: pinsOut}}>
				{data.landmarks.map((lm, i) => {
					const [x, y] = toScreen(cam, lm.p);
					return <Pin key={lm.en} lm={lm} x={x} y={y} delay={445 + i * 14} frame={frame} labelOut={labelOut} />;
				})}
			</div>

			{/* End card */}
			<TitleBlock frame={frame} start={628} />

			<div
				style={{
					position: 'absolute',
					right: 60,
					top: 52,
					opacity: brand,
					fontFamily: FONT_LATIN,
					fontWeight: 700,
					fontSize: 26,
					letterSpacing: 2,
					color: C.text,
					display: 'flex',
					alignItems: 'center',
					gap: 12,
				}}
			>
				<div style={{width: 12, height: 12, borderRadius: 3, background: C.major}} />
				AI For Business
			</div>
			<div
				style={{
					position: 'absolute',
					right: 40,
					bottom: 26,
					opacity: 0.55 * credit,
					fontFamily: FONT_LATIN,
					fontSize: 14,
					color: C.muted,
				}}
			>
				Map data © OpenStreetMap contributors (ODbL) via Overture Maps · geoBoundaries · Natural Earth
			</div>
		</AbsoluteFill>
	);
};
