import {continueRender, delayRender, staticFile} from 'remotion';
import assets from './generated/assets.json';

type Face = {family: string; file: string; weight: string};

const faces: Face[] = [
  {family: 'Jakarta', file: 'fonts/plus-jakarta-sans-latin-500-normal.woff2', weight: '100 550'},
  {family: 'Jakarta', file: 'fonts/plus-jakarta-sans-latin-600-normal.woff2', weight: '551 650'},
  {family: 'Jakarta', file: 'fonts/plus-jakarta-sans-latin-700-normal.woff2', weight: '651 750'},
  {family: 'Jakarta', file: 'fonts/plus-jakarta-sans-latin-800-normal.woff2', weight: '751 900'},
  // Khmer OS Muol Light if provided in public/fonts, otherwise Moul (Google Fonts).
  {
    family: 'KhHead',
    file: assets.fonts.khmerHeading ?? 'fonts/moul-khmer-400-normal.woff2',
    weight: '100 900',
  },
  // Khmer OS Battambang if provided in public/fonts, otherwise Battambang (Google Fonts).
  ...(assets.fonts.khmerBody
    ? [{family: 'KhBody', file: assets.fonts.khmerBody, weight: '100 900'}]
    : [
        {family: 'KhBody', file: 'fonts/battambang-khmer-400-normal.woff2', weight: '100 600'},
        {family: 'KhBody', file: 'fonts/battambang-khmer-700-normal.woff2', weight: '601 900'},
      ]),
];

const handle = delayRender('Loading fonts');

Promise.all(
  faces.map(async (f) => {
    const face = new FontFace(f.family, `url('${staticFile(f.file)}')`, {weight: f.weight});
    await face.load();
    document.fonts.add(face);
  }),
)
  .then(() => document.fonts.ready)
  .then(() => continueRender(handle))
  .catch((err) => {
    console.error('Font loading failed', err);
    continueRender(handle);
  });
