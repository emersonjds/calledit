import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync } from 'node:fs';

const SCREENS = 'media/screens';
const OUT = '.github/demo.gif';
const SECONDS_PER_FRAME = 2.5;

const frames = readdirSync(SCREENS).filter((name) => name.endsWith('.png'));
if (frames.length === 0) throw new Error(`no PNGs in ${SCREENS} — run \`pnpm e2e\` first`);

mkdirSync('.github', { recursive: true });
execFileSync(
  'ffmpeg',
  [
    '-y',
    '-framerate', `1/${SECONDS_PER_FRAME}`,
    '-pattern_type', 'glob',
    '-i', `${SCREENS}/*.png`,
    '-vf', 'fps=12,scale=360:-2:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
    OUT,
  ],
  { stdio: 'inherit' },
);

console.log(`built ${OUT} from ${frames.length} frames`);
