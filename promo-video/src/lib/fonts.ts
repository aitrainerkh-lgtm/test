import { continueRender, delayRender, staticFile } from 'remotion';

const faces: Array<[string, string, string]> = [
  ['Plus Jakarta Sans', 'PlusJakartaSans-400.ttf', '400'],
  ['Plus Jakarta Sans', 'PlusJakartaSans-500.ttf', '500'],
  ['Plus Jakarta Sans', 'PlusJakartaSans-600.ttf', '600'],
  ['Plus Jakarta Sans', 'PlusJakartaSans-700.ttf', '700'],
  ['Plus Jakarta Sans', 'PlusJakartaSans-800.ttf', '800'],
  ['Battambang', 'Battambang-400.ttf', '400'],
  ['Battambang', 'Battambang-700.ttf', '700'],
  ['Moul', 'Moul-400.ttf', '400'],
];

let started = false;

/** Loads the bundled fonts once and holds the render until they are ready. */
export const loadFonts = () => {
  if (started || typeof document === 'undefined') return;
  started = true;
  const handle = delayRender('Loading fonts');
  Promise.all(
    faces.map(([family, file, weight]) => {
      const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format('truetype')`, { weight });
      document.fonts.add(face);
      return face.load();
    }),
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
};
