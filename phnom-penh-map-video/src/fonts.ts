import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

export const FONT_KHMER_HEADING = "'Moul', 'Khmer OS Muol Light', serif";
export const FONT_KHMER_BODY = "'Battambang', 'Khmer OS Battambang', sans-serif";
export const FONT_LATIN = "'Inter', system-ui, sans-serif";

loadFont({family: 'Moul', url: staticFile('fonts/Moul-Regular.ttf'), weight: '400'});
loadFont({family: 'Battambang', url: staticFile('fonts/Battambang-Regular.ttf'), weight: '400'});
loadFont({family: 'Battambang', url: staticFile('fonts/Battambang-Bold.ttf'), weight: '700'});
loadFont({family: 'Inter', url: staticFile('fonts/Inter-Variable.ttf'), weight: '100 900'});
