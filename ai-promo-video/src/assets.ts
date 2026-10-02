import {getStaticFiles, staticFile} from 'remotion';

/** True if the file exists in /public. */
export const hasFile = (name?: string | null): boolean => {
  if (!name) return false;
  try {
    return getStaticFiles().some((f) => f.name === name);
  } catch {
    return false;
  }
};

export const src = (name: string) => staticFile(name);
