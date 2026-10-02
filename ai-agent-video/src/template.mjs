import { icon } from "./icons.mjs";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const KM_DIGITS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
const km = (n) => String(n).split("").map((d) => KM_DIGITS[+d] ?? d).join("");

function core(id, x, y, s) {
  return `<div class="core" id="${id}" style="left:${x}px;top:${y}px;--s:${s}px">
    <div class="core-glow" id="${id}-glow"></div>
    <div class="core-rings"><svg viewBox="0 0 100 100">
      <g id="${id}-r1" style="transform-origin:50px 50px"><circle cx="50" cy="50" r="49" fill="none" stroke="rgba(58,230,160,.55)" stroke-width=".6" stroke-dasharray="1.2 3.2"/></g>
      <g id="${id}-r2" style="transform-origin:50px 50px"><path d="M50 3 A47 47 0 0 1 93.5 32" fill="none" stroke="rgba(142,247,201,.9)" stroke-width="1.1" stroke-linecap="round"/><path d="M50 97 A47 47 0 0 1 6.5 68" fill="none" stroke="rgba(142,247,201,.55)" stroke-width="1.1" stroke-linecap="round"/></g>
    </svg></div>
    <div class="core-orb" id="${id}-orb"></div>
    <div class="core-core"></div>
  </div>`;
}

// Splits narration into subtitle chunks of at most ~2 lines at Khmer phrase spaces.
function chunk(text, max = 58) {
  const words = text.split(/\s+/).filter(Boolean);
  const out = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if ([...next].length > max && cur) { out.push(cur); cur = w; } else cur = next;
  }
  if (cur) out.push(cur);
  // Merge a very short tail into the previous chunk.
  if (out.length > 1 && [...out[out.length - 1]].length < 14) out[out.length - 2] += ` ${out.pop()}`;
  return out;
}

const SCENE_CSS = `
/* s1 hook */
#s1-chat { left: 170px; top: 270px; width: 760px; height: 470px; }
#s1-chat .hd { position: absolute; left: 34px; top: 26px; display: flex; align-items: center; gap: 16px; font: 700 34px/1.2 var(--display); color: var(--text); }
#s1-chat .hd .hi { width: 44px; height: 44px; color: var(--amber); }
#s1-chat .rule { position: absolute; left: 0; right: 0; top: 100px; height: 1px; background: var(--line); }
#s1-q { position: absolute; right: 34px; top: 136px; padding: 14px 28px; border-radius: 26px 26px 6px 26px; font: 700 34px/1.7 var(--kh-body); color: #1b1203; background: linear-gradient(180deg, #ffc27a, #ffa53d); white-space: nowrap; }
#s1-a { position: absolute; left: 34px; top: 270px; width: 470px; padding: 26px 28px; border-radius: 26px 26px 26px 6px; background: rgba(150, 170, 210, 0.12); border: 1px solid var(--line); }
#s1-a i { display: block; height: 16px; border-radius: 8px; margin: 10px 0; background: linear-gradient(90deg, rgba(200,215,240,.22), rgba(200,215,240,.5), rgba(200,215,240,.22)); background-size: 300% 100%; }
#s1-chat-tag { left: 210px; top: 182px; }
#s1-agent-tag { left: 1260px; top: 150px; }
.s1-tool { position: absolute; width: 132px; height: 132px; margin: -66px 0 0 -66px; border-radius: 34px; padding: 34px; color: var(--text);
  background: linear-gradient(180deg, rgba(30,46,80,.92), rgba(12,20,38,.95)); border: 1px solid var(--line); box-shadow: 0 24px 50px rgba(0,0,0,.45); }
.s1-tool .badge { right: -16px; top: -16px; width: 50px; height: 50px; padding: 11px; }
#s1-beams { position: absolute; inset: 0; overflow: visible; }
.s1-pkt { position: absolute; width: 14px; height: 14px; margin: -7px 0 0 -7px; border-radius: 50%; background: #fff; box-shadow: 0 0 14px 5px rgba(58,230,160,.85); opacity: 0; }
#s1-title { position: absolute; left: 0; right: 0; top: 330px; text-align: center; }
#s1-title .big { font: 700 236px/1 var(--display); letter-spacing: -0.03em; display: inline-flex; }
#s1-title .big span { display: inline-block; background: linear-gradient(180deg, #ffffff 30%, #9ff8d2 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
#s1-title .big span.g { background: linear-gradient(180deg, #b9ffe0 10%, #3ae6a0 100%); -webkit-background-clip: text; background-clip: text; }
#s1-title .km { margin-top: 34px; font: 400 60px/1.6 var(--kh-head); color: var(--text); }
#s1-title .rl { position: absolute; top: 140px; width: 300px; height: 2px; }
#s1-title .rl.l { left: 150px; background: linear-gradient(90deg, transparent, var(--green)); transform-origin: 100% 50%; }
#s1-title .rl.r { right: 150px; background: linear-gradient(90deg, var(--green), transparent); transform-origin: 0% 50%; }

/* s2 anatomy */
#s2-label { left: 0; right: 0; top: 118px; display: flex; justify-content: center; }
#s2-label .pill { position: relative; font-family: var(--display); font-size: 34px; line-height: 1.5; }
#s2-lines { position: absolute; inset: 0; overflow: visible; }
.s2-flow { position: absolute; top: 410px; display: flex; flex-direction: column; align-items: center; gap: 18px; width: 300px; margin-left: -150px; }
.s2-flow .fi { width: 150px; height: 150px; border-radius: 40px; padding: 38px; background: linear-gradient(180deg, rgba(30,46,80,.92), rgba(12,20,38,.95)); border: 1px solid var(--line); box-shadow: 0 24px 50px rgba(0,0,0,.45); }
.s2-flow .ft { font: 700 44px/1.6 var(--kh-body); white-space: nowrap; }
#s2-goal .fi { color: var(--amber); } #s2-done .fi { color: #04140d; background: var(--green); border-color: transparent; box-shadow: 0 0 50px rgba(58,230,160,.5); }
.s2-dot { position: absolute; width: 22px; height: 22px; margin: -11px 0 0 -11px; border-radius: 50%; background: #fff; box-shadow: 0 0 18px 6px rgba(255,190,110,.75); }
#s2-dot2 { box-shadow: 0 0 18px 6px rgba(58,230,160,.85); }

/* s3 compare */
#s3-div { position: absolute; left: 959px; top: 170px; width: 2px; height: 700px; background: linear-gradient(180deg, transparent, rgba(150,180,255,.35), transparent); transform-origin: 50% 0; }
.s3-head { position: absolute; top: 190px; display: flex; flex-direction: column; align-items: center; width: 860px; gap: 22px; }
.s3-head .h { font: 700 92px/1 var(--display); letter-spacing: -0.02em; }
#s3-lh { left: 50px; } #s3-rh { left: 1010px; }
#s3-lh .h { color: #d3dbea; }
#s3-rh .h { background: linear-gradient(180deg, #c6ffe6, #3ae6a0); -webkit-background-clip: text; background-clip: text; color: transparent; }
.s3-head .pill { position: relative; }
.s3-flow { position: absolute; top: 500px; height: 240px; }
.s3-pan { position: absolute; top: 140px; width: 840px; height: 730px; border-radius: 36px; border: 1px solid rgba(150,180,255,.1); background: linear-gradient(180deg, rgba(20,32,58,.42), rgba(10,17,33,.2)); }
#s3-lpan { left: 60px; } #s3-rpan { left: 1020px; border-color: rgba(58,230,160,.22); background: linear-gradient(180deg, rgba(20,60,48,.32), rgba(10,17,33,.2)); }
#s3-lf { left: 150px; width: 660px; } #s3-rf { left: 1030px; width: 820px; }
.s3-chip { position: absolute; top: 40px; display: flex; flex-direction: column; align-items: center; gap: 12px; width: 200px; margin-left: -100px; }
.s3-chip .ci { width: 140px; height: 140px; border-radius: 38px; padding: 35px; background: linear-gradient(180deg, rgba(30,46,80,.92), rgba(12,20,38,.95)); border: 1px solid var(--line); }
.s3-chip .ct { font: 700 40px/1.6 var(--kh-body); white-space: nowrap; }
.s3-arrow { position: absolute; top: 109px; height: 3px; border-radius: 2px; background: rgba(150,180,255,.4); transform-origin: 0 50%; }
.s3-arrow::after { content: ""; position: absolute; right: -2px; top: -7px; border-left: 14px solid rgba(150,180,255,.6); border-top: 8.5px solid transparent; border-bottom: 8.5px solid transparent; }
.s3-step { position: absolute; top: 76px; width: 68px; height: 68px; margin-left: -34px; border-radius: 50%; display: grid; place-items: center;
  font: 700 30px/1 var(--kh-body); color: var(--muted); background: rgba(20,32,58,.95); border: 2px solid rgba(150,180,255,.3); }
.s3-step .sc { position: absolute; inset: 0; border-radius: 50%; padding: 15px; color: #04140d; background: var(--green); box-shadow: 0 0 26px rgba(58,230,160,.6); }
#s3-track { position: absolute; left: 160px; top: 109px; width: 500px; height: 3px; background: rgba(150,180,255,.25); }
#s3-fill { position: absolute; left: 160px; top: 109px; width: 500px; height: 3px; background: var(--green); box-shadow: 0 0 14px rgba(58,230,160,.8); transform-origin: 0 50%; }

/* s4 loop */
#s4-title { left: 0; right: 0; top: 92px; text-align: center; }
#s4-title .km { font: 400 70px/1.6 var(--kh-head); }
#s4-title .sb { margin-top: 2px; font: 700 36px/1.6 var(--kh-body); color: var(--green); }
#s4-ring { position: absolute; left: 640px; top: 290px; width: 640px; height: 640px; }
#s4-ring svg.ring { position: absolute; inset: 0; overflow: visible; }
.s4-node { position: absolute; width: 92px; height: 92px; margin: -46px 0 0 -46px; border-radius: 50%; display: grid; place-items: center;
  font: 700 40px/1 var(--kh-body); color: var(--text); background: radial-gradient(circle at 40% 35%, #233a66, #0f1b33); border: 2px solid rgba(150,180,255,.38); box-shadow: 0 16px 36px rgba(0,0,0,.5); }
.s4-node .on { position: absolute; inset: -2px; border-radius: 50%; display: grid; place-items: center; color: #04140d; background: radial-gradient(circle at 40% 35%, #b5ffdf, #3ae6a0 55%, #12b874); box-shadow: 0 0 40px rgba(58,230,160,.75); }
.s4-lab { position: absolute; font: 700 32px/1.6 var(--kh-body); white-space: nowrap; color: var(--text); }
#s4-comet { position: absolute; left: 320px; top: 320px; width: 0; height: 0; }
#s4-comet i { position: absolute; left: -13px; top: -253px; width: 26px; height: 26px; border-radius: 50%; background: #fff; box-shadow: 0 0 20px 8px rgba(58,230,160,.9), 0 0 60px 20px rgba(58,230,160,.35); }
#s4-comet b { position: absolute; left: 0; top: 0; width: 0; height: 0; }
#s4-comet b i { box-shadow: 0 0 16px 6px rgba(58,230,160,.6); }
#s4-comet b:nth-child(1) i { opacity: .18; transform: scale(.55); } #s4-comet b:nth-child(2) i { opacity: .32; transform: scale(.7); } #s4-comet b:nth-child(3) i { opacity: .55; transform: scale(.85); }
.s4-chev { position: absolute; width: 0; height: 0; border-left: 16px solid rgba(150,180,255,.55); border-top: 10px solid transparent; border-bottom: 10px solid transparent; margin: -10px 0 0 -8px; }
#s4-mini { left: 320px; top: 320px; }
.s4-panel { position: absolute; left: 1010px; top: 250px; width: 800px; height: 620px; }
.s4-panel .num { position: absolute; left: 0; top: -10px; font: 700 150px/1 var(--display); color: transparent; -webkit-text-stroke: 2px rgba(58,230,160,.55); }
.s4-panel .nm { position: absolute; left: 140px; top: 4px; font: 900 58px/1.6 var(--kh-body); white-space: nowrap; }
.s4-panel .ds { position: absolute; left: 142px; top: 102px; font: 400 34px/1.6 var(--kh-body); color: var(--muted); white-space: nowrap; }
.s4-panel .bar { position: absolute; left: 0; top: 196px; width: 780px; height: 2px; background: linear-gradient(90deg, var(--green), transparent); transform-origin: 0 50%; }
.s4-in { position: absolute; left: 30px; width: 520px; height: 104px; display: flex; align-items: center; gap: 24px; padding: 0 30px 0 18px; border-radius: 24px;
  background: linear-gradient(180deg, rgba(30,46,80,.86), rgba(12,20,38,.9)); border: 1px solid var(--line); }
.s4-in .ii { width: 70px; height: 70px; padding: 16px; border-radius: 18px; flex: none; }
.s4-in .it { font: 700 36px/1.6 var(--kh-body); white-space: nowrap; }
.s4-in .ar { margin-left: auto; width: 34px; height: 34px; color: var(--dim); }
.s4-plan { position: absolute; left: 30px; width: 640px; height: 100px; display: flex; align-items: center; gap: 26px; }
.s4-plan .pn { width: 64px; height: 64px; border-radius: 18px; display: grid; place-items: center; font: 700 30px/1 var(--kh-body); color: #04140d; background: var(--green); flex: none; box-shadow: 0 0 24px rgba(58,230,160,.45); }
.s4-plan .pt2 { font: 700 38px/1.6 var(--kh-body); white-space: nowrap; }
.s4-plan .pl { position: absolute; left: 31px; top: 82px; width: 2px; height: 36px; background: rgba(58,230,160,.45); transform-origin: 50% 0; }
.s4-tool { position: absolute; width: 360px; height: 150px; border-radius: 26px; display: flex; align-items: center; gap: 22px; padding: 0 26px;
  background: linear-gradient(180deg, rgba(30,46,80,.86), rgba(12,20,38,.9)); border: 1px solid var(--line); }
.s4-tool .ti { width: 82px; height: 82px; padding: 19px; border-radius: 22px; flex: none; color: var(--text); background: rgba(150,170,210,.1); border: 1px solid var(--line); }
.s4-tool .tt { font: 700 34px/1.2 var(--display); white-space: nowrap; }
.s4-tool .glow { position: absolute; inset: -2px; border-radius: 26px; border: 2px solid var(--green); box-shadow: 0 0 40px rgba(58,230,160,.45), inset 0 0 30px rgba(58,230,160,.15); }
#s4-gauge { position: absolute; left: 30px; top: 250px; width: 300px; height: 300px; }
#s4-gauge svg { width: 100%; height: 100%; overflow: visible; }
#s4-gauge .pc { position: absolute; inset: 0; display: grid; place-items: center; font: 700 70px/1 var(--display); }
#s4-gauge .ok { position: absolute; inset: 70px; border-radius: 50%; padding: 34px; color: #04140d; background: var(--green); box-shadow: 0 0 60px rgba(58,230,160,.7); }
#s4-q { position: absolute; left: 380px; top: 290px; font: 700 40px/1.6 var(--kh-body); white-space: nowrap; }
#s4-rep { left: 380px; top: 400px; }

/* s5 example */
#s5-tag { left: 150px; top: 112px; }
#s5-card { left: 150px; top: 210px; width: 1000px; height: 660px; }
#s5-prompt { position: absolute; left: 36px; top: 36px; right: 36px; display: flex; align-items: center; gap: 22px; }
#s5-prompt .av { width: 72px; height: 72px; border-radius: 50%; padding: 17px; color: #1b1203; background: linear-gradient(180deg, #ffc27a, #ffa53d); flex: none; }
#s5-prompt .bub { position: relative; padding: 12px 30px 14px; border-radius: 24px 24px 24px 6px; background: rgba(255,165,61,.1); border: 1px solid rgba(255,165,61,.35); }
#s5-prompt .bt { font: 700 36px/1.7 var(--kh-body); white-space: nowrap; color: #ffe2bf; }
#s5-caret { position: absolute; top: 18px; width: 3px; height: 52px; background: #ffc27a; }
#s5-agent { position: absolute; left: 36px; top: 160px; display: flex; align-items: center; gap: 18px; }
#s5-agent .mini { position: relative; width: 72px; height: 72px; }
#s5-agent .nm { font: 700 32px/1 var(--display); color: var(--green); }
#s5-agent .st { font: 400 32px/1.6 var(--kh-body); color: var(--muted); }
#s5-agent .dots i { display: inline-block; width: 8px; height: 8px; margin-left: 6px; border-radius: 50%; background: var(--muted); }
.s5-row { position: absolute; left: 36px; right: 36px; height: 104px; display: flex; align-items: center; gap: 24px; padding: 0 26px 0 18px; border-radius: 22px;
  background: rgba(150,170,210,.06); border: 1px solid rgba(150,180,255,.1); }
.s5-row .ri { width: 70px; height: 70px; padding: 16px; border-radius: 18px; flex: none; color: var(--blue); background: rgba(92,157,255,.12); }
.s5-row .rt { font: 700 36px/1.6 var(--kh-body); white-space: nowrap; }
.s5-row .rs { position: relative; margin-left: auto; width: 54px; height: 54px; flex: none; }
.s5-row .spin { position: absolute; inset: 0; }
.s5-row .ok { position: absolute; inset: 0; border-radius: 50%; padding: 12px; color: #04140d; background: var(--green); box-shadow: 0 0 22px rgba(58,230,160,.55); }
#s5-prog { position: absolute; left: 36px; right: 36px; bottom: 34px; height: 10px; border-radius: 5px; background: rgba(150,180,255,.14); overflow: hidden; }
#s5-prog i { position: absolute; inset: 0; border-radius: 5px; background: linear-gradient(90deg, var(--green-2), var(--green)); transform-origin: 0 50%; }
#s5-cal { left: 1210px; top: 210px; width: 560px; height: 420px; }
#s5-cal .ch { position: absolute; left: 30px; top: 26px; display: flex; align-items: center; gap: 14px; font: 700 30px/1.2 var(--display); }
#s5-cal .ch .ci { width: 38px; height: 38px; color: var(--blue); }
.s5-day { position: absolute; top: 96px; width: 88px; text-align: center; font: 500 22px/1 var(--mono); color: var(--dim); }
.s5-slot { position: absolute; width: 88px; height: 70px; border-radius: 14px; background: rgba(150,170,210,.1); }
.s5-slot.busy { background: repeating-linear-gradient(135deg, rgba(150,170,210,.16) 0 8px, rgba(150,170,210,.07) 8px 16px); }
#s5-free { position: absolute; width: 88px; height: 70px; border-radius: 14px; padding: 17px; color: #04140d; background: var(--green); box-shadow: 0 0 34px rgba(58,230,160,.6); }
#s5-mail { left: 1210px; top: 660px; width: 560px; height: 210px; display: flex; align-items: center; gap: 26px; padding: 0 36px; }
#s5-mail .mi { position: relative; width: 104px; height: 104px; padding: 24px; border-radius: 28px; color: var(--amber); background: rgba(255,165,61,.12); border: 1px solid rgba(255,165,61,.32); flex: none; }
#s5-mail .mt { font: 700 34px/1.2 var(--display); }
#s5-plane { position: absolute; left: 1290px; top: 720px; width: 64px; height: 64px; color: #ffd29a; }
#s5-done { left: 1210px; top: 660px; width: 560px; height: 210px; display: flex; align-items: center; justify-content: center; gap: 26px;
  border-radius: 30px; background: linear-gradient(180deg, rgba(58,230,160,.22), rgba(18,184,116,.14)); border: 1px solid rgba(58,230,160,.55); box-shadow: 0 0 80px rgba(58,230,160,.25); }
#s5-done .dk { width: 104px; height: 104px; border-radius: 50%; padding: 24px; color: #04140d; background: var(--green); box-shadow: 0 0 40px rgba(58,230,160,.7); flex: none; }
#s5-done .dt { font: 900 56px/1.6 var(--kh-body); color: #eafff5; white-space: nowrap; }
.s5-rw { position: absolute; left: 1294px; top: 765px; width: 0; height: 0; }
.s5-ray { position: absolute; left: -2px; top: -126px; width: 4px; height: 40px; border-radius: 2px; background: var(--green); transform-origin: 50% 100%; }

/* s6 close */
#s6-waves { position: absolute; left: 960px; top: 400px; }
#s6-waves i { position: absolute; left: -160px; top: -160px; width: 320px; height: 320px; border-radius: 50%; border: 2px solid rgba(58,230,160,.5); }
#s6-l1 { left: 0; right: 0; top: 618px; text-align: center; font: 400 74px/1.6 var(--kh-head); }
#s6-l2 { left: 0; right: 0; top: 760px; display: flex; justify-content: center; }
#s6-l2 span { font: 700 44px/1.6 var(--kh-body); color: var(--muted); }
#s6-brand { left: 0; right: 0; top: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 30px; }
#s6-brand .row { display: flex; align-items: center; gap: 34px; }
#s6-brand .mark { width: 150px; height: 150px; font-size: 64px; border-radius: 30%; }
#s6-brand .wm { font: 700 120px/1 var(--display); letter-spacing: -0.02em; }
#s6-brand .wm b { color: var(--green); font-weight: 700; }
#s6-brand .ul { width: 760px; height: 3px; background: linear-gradient(90deg, transparent, var(--green), transparent); transform-origin: 50% 50%; }
`;

export function renderHtml({ script, timing, css, audioSrc, cueMap, timelineJs }) {
  const Lb = Object.fromEntries(Object.entries(script.labels).map(([k, v]) => [k, esc(v)]));
  const T = timing;
  const sc = T.scenes;
  const clipAttr = (name) => `data-start="${sc[name].start}" data-duration="${sc[name].dur}"`;

  // Subtitles: each narration line split into chunks timed by character share.
  let subs = "";
  let subIdx = 0;
  for (const l of script.lines) {
    const lt = T.lines[l.id];
    const parts = chunk(l.text);
    const totalChars = parts.reduce((s, p) => s + [...p].length, 0);
    let t = lt.start - 0.08;
    parts.forEach((p, i) => {
      const share = (lt.dur + 0.08) * ([...p].length / totalChars);
      const d = i === parts.length - 1 ? lt.dur + 0.45 - (t - lt.start) : share;
      subs += `<div class="clip sub" id="sub-${subIdx}" data-start="${t.toFixed(3)}" data-duration="${d.toFixed(3)}" data-track-index="30"><span>${esc(p)}</span></div>\n`;
      t += share;
      subIdx++;
    });
  }

  // Seeded particles.
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let pts = "";
  const ptData = [];
  for (let i = 0; i < 46; i++) {
    const s = 2 + rnd() * 4;
    const d = { x: rnd() * 1920, y: rnd() * 1080, s, o: 0.12 + rnd() * 0.4, dy: 60 + rnd() * 160, dx: (rnd() - 0.5) * 80 };
    ptData.push(d);
    pts += `<i class="pt" id="pt-${i}" style="left:${d.x.toFixed(0)}px;top:${d.y.toFixed(0)}px;width:${s.toFixed(1)}px;height:${s.toFixed(1)}px;opacity:${d.o.toFixed(2)}"></i>`;
  }

  // s1 tools around the agent core.
  const s1c = { x: 1440, y: 540 };
  const s1Tools = [
    { n: "calendar", a: -140 }, { n: "mail", a: -40 }, { n: "sheet", a: 40 }, { n: "search", a: 140 },
  ].map((t, i) => {
    const r = 255;
    const x = s1c.x + r * Math.cos((t.a * Math.PI) / 180);
    const y = s1c.y + r * Math.sin((t.a * Math.PI) / 180);
    return { ...t, x, y, i };
  });

  const s2 = { cx: 960, cy: 500 };
  const s2Nodes = [
    { id: "brain", ic: "chip", kt: Lb.anat_brain, et: "AI Model", x: 250, y: 250, cls: "" },
    { id: "memory", ic: "database", kt: Lb.anat_memory, et: "Memory", x: 1290, y: 250, cls: "blue" },
    { id: "tools", ic: "wrench", kt: Lb.anat_tools, et: "Tools", x: 770, y: 760, cls: "amber" },
  ];

  // s4 ring geometry (ring box is 640px, centre 320,320, radius 250).
  const R = 250;
  const ringPts = [0, 1, 2, 3].map((i) => {
    const a = (-90 + i * 90) * (Math.PI / 180);
    return { x: 320 + R * Math.cos(a), y: 320 + R * Math.sin(a) };
  });
  const labPos = [
    `left:${ringPts[0].x + 66}px;top:${ringPts[0].y - 28}px`,
    `left:${ringPts[1].x + 66}px;top:${ringPts[1].y - 28}px`,
    `right:${640 - ringPts[2].x + 66}px;top:${ringPts[2].y - 28}px`,
    `right:${640 - ringPts[3].x + 66}px;top:${ringPts[3].y - 28}px`,
  ];
  const chevs = [45, 135, 225, 315].map((deg) => {
    const a = (deg - 90) * (Math.PI / 180);
    return `<i class="s4-chev" style="left:${320 + R * Math.cos(a)}px;top:${320 + R * Math.sin(a)}px;transform:rotate(${deg}deg)"></i>`;
  }).join("");

  const tools4 = [
    { ic: "search", t: "Web Search", x: 30, y: 250 }, { ic: "mail", t: "Email", x: 420, y: 250 },
    { ic: "calendar", t: "Calendar", x: 30, y: 430 }, { ic: "sheet", t: "Spreadsheet", x: 420, y: 430 },
  ];

  const days = ["12", "13", "14", "15", "16"];
  const slotRows = [150, 236, 322];
  const busy = new Set(["0-0", "1-1", "2-0", "3-2", "4-1", "0-2", "2-2", "4-0", "3-0"]);
  let calHtml = days.map((d, i) => `<div class="s5-day" style="left:${30 + i * 102}px">${d}</div>`).join("");
  days.forEach((_, i) => slotRows.forEach((y, j) => {
    if (i === 1 && j === 0) return; // the free slot
    calHtml += `<div class="s5-slot ${busy.has(`${i}-${j}`) ? "busy" : ""}" id="s5-sl-${i}-${j}" style="left:${30 + i * 102}px;top:${y - 20}px"></div>`;
  }));

  const rays = Array.from({ length: 12 }, (_, i) => `<div class="s5-rw" style="transform:rotate(${i * 30}deg)"><i class="s5-ray" id="s5-ray-${i}"></i></div>`).join("");

  const html = `<!doctype html>
<html lang="km">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1920, height=1080" />
<title>AI Agent ជាអ្វី</title>
<script src="assets/vendor/gsap.min.js"></script>
<script src="assets/vendor/DrawSVGPlugin.min.js"></script>
<style>
${css}
${SCENE_CSS}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${T.total}" data-width="1920" data-height="1080">

  <!-- atmosphere -->
  <div class="clip layer" id="atmo" data-start="0" data-duration="${T.total}" data-track-index="0">
    <div class="layer" id="bg-base"></div>
    <div class="aurora" id="au-a"></div><div class="aurora" id="au-b"></div><div class="aurora" id="au-c"></div>
    <div id="grid"></div>
    <div class="layer" id="parts">${pts}</div>
  </div>

  <!-- S1 hook -->
  <section class="clip scene" id="s1" ${clipAttr("hook")} data-track-index="1"><div class="cam" id="s1-cam"><div class="rig" id="s1-rig">
    <div class="pill amber" id="s1-chat-tag"><span class="pi">${icon("chat")}</span>${Lb.hook_chat_tag}</div>
    <div class="glass" id="s1-chat">
      <div class="hd"><span class="hi">${icon("chat")}</span>Chatbot</div>
      <div class="rule"></div>
      <div id="s1-q">${Lb.hook_user_q}</div>
      <div id="s1-a"><i style="width:92%"></i><i style="width:78%"></i><i style="width:56%"></i></div>
    </div>
    <svg id="s1-beams" viewBox="0 0 1920 1080">
      ${s1Tools.map((t) => `<line id="s1-beam-${t.i}" x1="${s1c.x}" y1="${s1c.y}" x2="${t.x.toFixed(1)}" y2="${t.y.toFixed(1)}" stroke="rgba(58,230,160,.7)" stroke-width="3" stroke-linecap="round"/>`).join("")}
    </svg>
    ${s1Tools.map((t) => `<i class="s1-pkt" id="s1-pkt-${t.i}" style="left:${s1c.x}px;top:${s1c.y}px"></i>`).join("")}
    ${core("s1-core", s1c.x, s1c.y, 210)}
    ${s1Tools.map((t) => `<div class="s1-tool" id="s1-tool-${t.i}" style="left:${t.x.toFixed(1)}px;top:${t.y.toFixed(1)}px">${icon(t.n)}<div class="badge" id="s1-ok-${t.i}">${icon("check")}</div></div>`).join("")}
    <div class="pill" id="s1-agent-tag"><span class="pi">${icon("bolt")}</span><span class="en" style="font-weight:700">AI Agent</span>&nbsp;·&nbsp;${Lb.hook_agent_tag}</div>
    <div id="s1-title">
      <i class="rl l" id="s1-rl"></i><i class="rl r" id="s1-rr"></i>
      <div class="big" id="s1-big">${"AI Agent".split("").map((c, i) => `<span class="${i < 2 ? "g" : ""}" id="s1-ch-${i}">${c === " " ? "&nbsp;" : c}</span>`).join("")}</div>
      <div class="km" id="s1-km">${Lb.title_sub}</div>
    </div>
  </div></div></section>

  <!-- S2 anatomy -->
  <section class="clip scene" id="s2" ${clipAttr("anatomy")} data-track-index="2"><div class="cam" id="s2-cam"><div class="rig" id="s2-rig">
    <div class="abs" id="s2-label"><div class="pill" id="s2-pill"><span class="pi">${icon("bolt")}</span>AI Agent</div></div>
    <svg id="s2-lines" viewBox="0 0 1920 1080">
      <line id="s2-in" x1="520" y1="500" x2="830" y2="500" stroke="rgba(255,165,61,.6)" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round"/>
      <line id="s2-out" x1="1090" y1="500" x2="1400" y2="500" stroke="rgba(58,230,160,.7)" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round"/>
      <path id="s2-c-brain" d="M860 430 C 760 360, 700 330, 590 330" fill="none" stroke="rgba(58,230,160,.55)" stroke-width="3"/>
      <path id="s2-c-memory" d="M1060 430 C 1160 360, 1220 330, 1300 330" fill="none" stroke="rgba(92,157,255,.6)" stroke-width="3"/>
      <path id="s2-c-tools" d="M960 630 C 960 680, 960 700, 960 752" fill="none" stroke="rgba(255,165,61,.6)" stroke-width="3"/>
    </svg>
    ${core("s2-core", s2.cx, s2.cy, 250)}
    <div class="s2-flow" id="s2-goal" style="left:400px"><div class="fi">${icon("target")}</div><div class="ft">${Lb.anat_goal}</div></div>
    <div class="s2-flow" id="s2-done" style="left:1520px"><div class="fi">${icon("check")}</div><div class="ft">${Lb.anat_done}</div></div>
    <i class="s2-dot" id="s2-dot1" style="left:560px;top:500px"></i>
    <i class="s2-dot" id="s2-dot2" style="left:1100px;top:500px"></i>
    ${s2Nodes.map((n) => `<div class="node ${n.cls}" id="s2-${n.id}" style="left:${n.x}px;top:${n.y}px"><div class="nic">${icon(n.ic)}</div><div><div class="kt">${n.kt}</div><div class="et">${n.et}</div></div></div>`).join("")}
  </div></div></section>

  <!-- S3 compare -->
  <section class="clip scene" id="s3" ${clipAttr("compare")} data-track-index="3"><div class="cam" id="s3-cam"><div class="rig" id="s3-rig">
    <div class="s3-pan" id="s3-lpan"></div><div class="s3-pan" id="s3-rpan"></div>
    <i id="s3-div"></i>
    <div class="s3-head" id="s3-lh"><div class="h">Chatbot</div><div class="pill muted" id="s3-lp"><span class="pi">${icon("chat")}</span>${Lb.cmp_one_step}</div></div>
    <div class="s3-head" id="s3-rh"><div class="h">AI Agent</div><div class="pill" id="s3-rp"><span class="pi">${icon("bolt")}</span>${Lb.cmp_many_steps}</div></div>
    <div class="s3-flow" id="s3-lf">
      <div class="s3-chip" id="s3-q" style="left:130px"><div class="ci" style="color:var(--amber)">${icon("chat")}</div><div class="ct">${Lb.cmp_question}</div></div>
      <i class="s3-arrow" id="s3-la" style="left:225px;width:200px"></i>
      <div class="s3-chip" id="s3-a" style="left:530px"><div class="ci" style="color:#d3dbea">${icon("doc")}</div><div class="ct">${Lb.cmp_answer}</div></div>
    </div>
    <div class="s3-flow" id="s3-rf">
      <i id="s3-track"></i><i id="s3-fill"></i>
      <div class="s3-chip" id="s3-g" style="left:90px"><div class="ci" style="color:var(--amber)">${icon("target")}</div><div class="ct">${Lb.cmp_goal}</div></div>
      ${[1, 2, 3].map((n, i) => `<div class="s3-step" id="s3-st-${i}" style="left:${280 + i * 130}px">${km(n)}<div class="sc" id="s3-sc-${i}">${icon("check")}</div></div>`).join("")}
      <div class="s3-chip" id="s3-r" style="left:730px"><div class="ci" style="color:#04140d;background:var(--green);border-color:transparent;box-shadow:0 0 40px rgba(58,230,160,.5)">${icon("check")}</div><div class="ct">${Lb.cmp_result}</div></div>
    </div>
  </div></div></section>

  <!-- S4 loop -->
  <section class="clip scene" id="s4" ${clipAttr("loop")} data-track-index="4"><div class="cam" id="s4-cam"><div class="rig" id="s4-rig">
    <div class="abs" id="s4-title"><div class="km" id="s4-tk">${Lb.loop_title}</div><div class="sb" id="s4-ts">${Lb.loop_sub}</div></div>
    <div id="s4-ring">
      <svg class="ring" viewBox="0 0 640 640">
        <circle id="s4-base" cx="320" cy="320" r="${R}" fill="none" stroke="rgba(150,180,255,.22)" stroke-width="3" transform="rotate(-90 320 320)"/>
        <circle id="s4-prog" cx="320" cy="320" r="${R}" fill="none" stroke="#3ae6a0" stroke-width="5" stroke-linecap="round" transform="rotate(-90 320 320)" style="filter:drop-shadow(0 0 10px rgba(58,230,160,.8))"/>
      </svg>
      ${chevs}
      ${core("s4-mini", 320, 320, 170)}
      <div id="s4-comet"><b style="transform:rotate(-15deg)"><i></i></b><b style="transform:rotate(-10deg)"><i></i></b><b style="transform:rotate(-5deg)"><i></i></b><i></i></div>
      ${ringPts.map((p, i) => `<div class="s4-node" id="s4-n-${i}" style="left:${p.x}px;top:${p.y}px">${km(i + 1)}<div class="on" id="s4-on-${i}">${km(i + 1)}</div></div>`).join("")}
      ${[1, 2, 3, 4].map((n, i) => `<div class="s4-lab" id="s4-lab-${i}" style="${labPos[i]}">${Lb[`step${n}_name`]}</div>`).join("")}
    </div>
    ${[1, 2, 3, 4].map((n, i) => `<div class="s4-panel" id="s4-p-${i}">
      <div class="num">${km(n)}</div><div class="nm" id="s4-nm-${i}">${Lb[`step${n}_name`]}</div><div class="ds" id="s4-ds-${i}">${Lb[`step${n}_desc`]}</div><i class="bar" id="s4-bar-${i}"></i>
      ${i === 0 ? [["target", Lb.in_goal, "var(--amber)", "rgba(255,165,61,.12)"], ["chart", Lb.in_data, "var(--blue)", "rgba(92,157,255,.12)"], ["doc", Lb.in_files, "#d3dbea", "rgba(150,170,210,.12)"]].map(([ic, t, c, b], k) =>
        `<div class="s4-in" id="s4-in-${k}" style="top:${250 + k * 124}px"><div class="ii" style="color:${c};background:${b}">${icon(ic)}</div><div class="it">${t}</div><div class="ar">${icon("send")}</div></div>`).join("") : ""}
      ${i === 1 ? [Lb.plan_1, Lb.plan_2, Lb.plan_3].map((t, k) =>
        `<div class="s4-plan" id="s4-pl-${k}" style="top:${250 + k * 122}px"><div class="pn">${km(k + 1)}</div><div class="pt2">${t}</div>${k < 2 ? `<i class="pl" id="s4-pll-${k}"></i>` : ""}</div>`).join("") : ""}
      ${i === 2 ? tools4.map((t, k) =>
        `<div class="s4-tool" id="s4-tl-${k}" style="left:${t.x}px;top:${t.y}px"><div class="ti">${icon(t.ic)}</div><div class="tt">${t.t}</div><div class="glow" id="s4-tg-${k}"></div></div>`).join("") : ""}
      ${i === 3 ? `<div id="s4-gauge"><svg viewBox="0 0 300 300"><circle cx="150" cy="150" r="128" fill="none" stroke="rgba(150,180,255,.18)" stroke-width="14"/><circle id="s4-garc" cx="150" cy="150" r="128" fill="none" stroke="#3ae6a0" stroke-width="14" stroke-linecap="round" transform="rotate(-90 150 150)" style="filter:drop-shadow(0 0 12px rgba(58,230,160,.7))"/></svg><div class="pc" id="s4-pct">0%</div><div class="ok" id="s4-gok">${icon("check")}</div></div>
        <div id="s4-q">${Lb.check_q}</div><div class="pill amber" id="s4-rep"><span class="pi" id="s4-repi">${icon("refresh")}</span>${Lb.check_repeat}</div>` : ""}
    </div>`).join("")}
  </div></div></section>

  <!-- S5 example -->
  <section class="clip scene" id="s5" ${clipAttr("example")} data-track-index="5"><div class="cam" id="s5-cam"><div class="rig" id="s5-rig">
    <div class="pill amber" id="s5-tag"><span class="pi">${icon("spark")}</span>${Lb.ex_tag}</div>
    <div class="glass" id="s5-card">
      <div id="s5-prompt"><div class="av">${icon("user")}</div><div class="bub"><div class="bt" id="s5-pt">${Lb.ex_prompt}</div></div></div>
      <div id="s5-agent"><div class="mini">${core("s5-core", 36, 36, 72)}</div><span class="nm">AI Agent</span><span class="st">${Lb.ex_status}</span><span class="dots"><i id="s5-d0"></i><i id="s5-d1"></i><i id="s5-d2"></i></span></div>
      ${[["calendar", Lb.ex_s1], ["clock", Lb.ex_s2], ["mail", Lb.ex_s3]].map(([ic, t], k) => `<div class="s5-row" id="s5-r-${k}" style="top:${262 + k * 118}px"><div class="ri">${icon(ic)}</div><div class="rt">${t}</div>
        <div class="rs"><svg class="spin" id="s5-sp-${k}" viewBox="0 0 54 54"><circle cx="27" cy="27" r="21" fill="none" stroke="rgba(150,180,255,.2)" stroke-width="5"/><path d="M27 6 A21 21 0 0 1 48 27" fill="none" stroke="#5c9dff" stroke-width="5" stroke-linecap="round"/></svg><div class="ok" id="s5-ok-${k}">${icon("check")}</div></div></div>`).join("")}
      <div id="s5-prog"><i id="s5-pf"></i></div>
    </div>
    <div class="glass" id="s5-cal"><div class="ch"><span class="ci">${icon("calendar")}</span>Calendar</div>${calHtml}<div id="s5-free" style="left:132px;top:130px">${icon("check")}</div></div>
    <div class="glass" id="s5-mail"><div class="mi">${icon("mail")}</div><div class="mt">Email</div></div>
    <div id="s5-plane">${icon("send")}</div>
    ${rays}
    <div class="abs" id="s5-done"><div class="dk">${icon("check")}</div><div class="dt">${Lb.ex_done}</div></div>
  </div></div></section>

  <!-- S6 close -->
  <section class="clip scene" id="s6" ${clipAttr("close")} data-track-index="6"><div class="cam" id="s6-cam"><div class="rig" id="s6-rig">
    <div id="s6-grp">
      <div id="s6-waves"><i id="s6-w0"></i><i id="s6-w1"></i><i id="s6-w2"></i></div>
      ${core("s6-core", 960, 400, 300)}
      <div class="abs" id="s6-l1">${Lb.close_line1}</div>
      <div class="abs" id="s6-l2"><span>${Lb.close_line2}</span></div>
    </div>
    <div class="abs" id="s6-brand"><div class="row"><div class="mark" id="s6-mark">AI</div><div class="wm" id="s6-wm">AI <b>For</b> Business</div></div><i class="ul" id="s6-ul"></i></div>
  </div></div></section>

  <!-- overlays -->
  <div class="clip layer" id="ovl" data-start="0" data-duration="${T.total}" data-track-index="20">
    <div id="bug"><div class="mark">AI</div><span>AI <b>For</b> Business</span></div>
    <div id="streak"></div>
  </div>
  ${subs}
  <div class="clip layer" id="fx" data-start="0" data-duration="${T.total}" data-track-index="40" style="pointer-events:none">
    <div class="layer" id="vignette"></div>
    <div id="grain"></div>
    <div class="layer" id="fade" style="background:#000"></div>
  </div>
  ${audioSrc ? `<audio id="mix" src="${audioSrc}" data-start="0" data-duration="${T.total}" data-track-index="50" data-volume="1"></audio>` : ""}
</div>
<script>
window.TIMING = ${JSON.stringify(T)};
window.PTS = ${JSON.stringify(ptData.map((d) => ({ dx: +d.dx.toFixed(1), dy: +d.dy.toFixed(1) })))};
window.CUES = ${JSON.stringify(cueMap)};
</script>
<script>
${timelineJs}
</script>
</body>
</html>
`;
  return html;
}
