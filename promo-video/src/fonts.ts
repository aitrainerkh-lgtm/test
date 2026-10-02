import {continueRender, delayRender, getStaticFiles, staticFile} from 'remotion';

type FontDef = {family: string; file: string; weight?: string; optional?: boolean};

const FONTS: FontDef[] = [
  {family: 'Plus Jakarta Sans', file: 'fonts/PlusJakartaSans.ttf', weight: '200 800'},
  {family: 'Moul', file: 'fonts/Moul-Regular.ttf', weight: '400'},
  {family: 'Battambang', file: 'fonts/Battambang-Regular.ttf', weight: '400'},
  {family: 'Battambang', file: 'fonts/Battambang-Bold.ttf', weight: '700'},
  // Optional: drop the official Khmer OS fonts here to use them instead of Moul / Battambang.
  {family: 'Khmer OS Muol Light', file: 'fonts/KhmerOSMuolLight.ttf', weight: '400', optional: true},
  {family: 'Khmer OS Battambang', file: 'fonts/KhmerOSBattambang.ttf', weight: '400', optional: true},
];

let started = false;

export const loadFonts = () => {
  if (started || typeof document === 'undefined') {
    return;
  }
  started = true;
  const available = new Set(getStaticFiles().map((f) => f.name));
  const handle = delayRender('Loading fonts');
  const jobs = FONTS.filter((f) => !f.optional || available.has(f.file)).map(async (f) => {
    const face = new FontFace(f.family, `url('${staticFile(f.file)}') format('truetype')`, {
      weight: f.weight ?? '400',
    });
    await face.load();
    document.fonts.add(face);
  });
  Promise.all(jobs)
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
};

export const hasStaticFile = (name: string | null | undefined): boolean => {
  if (!name || typeof document === 'undefined') {
    return false;
  }
  return getStaticFiles().some((f) => f.name === name);
};
