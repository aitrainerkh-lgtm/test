// Renders index.html (the HyperFrames composition) from content/script.json,
// content/timing.json and the src/ templates. Also writes content/sfx.json,
// the sound-effect cue list the mixer consumes.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderHtml } from "../src/template.mjs";
import { cues, sfxEvents } from "../src/cues.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

const script = JSON.parse(read("content/script.json"));
const timing = JSON.parse(read("content/timing.json"));
const mix = "assets/audio/mix.wav";

const html = renderHtml({
  script,
  timing,
  css: read("src/styles.css"),
  timelineJs: read("src/timeline.js"),
  cueMap: cues(timing),
  audioSrc: existsSync(join(ROOT, mix)) ? mix : null,
});
writeFileSync(join(ROOT, "index.html"), html);
writeFileSync(join(ROOT, "content/sfx.json"), JSON.stringify(sfxEvents(timing), null, 1));
console.log(`build: index.html (${timing.total}s), ${script.lines.length} lines, audio ${existsSync(join(ROOT, mix)) ? "yes" : "no"}`);
