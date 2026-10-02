(function () {
  const T = window.TIMING;
  const C = window.CUES;
  const S = T.scenes;
  const at = (id, f = 0) => T.lines[id].start + f * T.lines[id].dur;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  gsap.registerPlugin(DrawSVGPlugin);

  function build() {
    // Measure layout before any tween writes transforms.
    const rootR = $("#root").getBoundingClientRect();
    const dk = $("#s5-done .dk").getBoundingClientRect();
    $$(".s5-rw").forEach((w) => { w.style.left = dk.left - rootR.left + dk.width / 2 + "px"; w.style.top = dk.top - rootR.top + dk.height / 2 + "px"; });
    const tw = $("#s5-pt").offsetWidth;
    const tl = gsap.timeline({ paused: true });

    // ---------- atmosphere ----------
    tl.fromTo("#au-a", { x: 0, y: 0 }, { x: 300, y: 160, duration: T.total, ease: "sine.inOut" }, 0);
    tl.fromTo("#au-b", { x: 0, y: 0 }, { x: -260, y: -140, duration: T.total, ease: "sine.inOut" }, 0);
    tl.fromTo("#au-c", { x: 0, y: 0, scale: 1 }, { x: -620, y: -320, scale: 1.35, duration: T.total, ease: "sine.inOut" }, 0);
    tl.fromTo("#grid", { y: 0 }, { y: -92, duration: T.total, ease: "none" }, 0);
    window.PTS.forEach((p, i) => {
      tl.fromTo(`#pt-${i}`, { x: 0, y: 0 }, { x: p.dx, y: -p.dy, duration: T.total, ease: "none" }, 0);
    });
    // Film grain re-seeded 12x per second (seeded, deterministic).
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let t = 0; t < T.total; t += 1 / 12) tl.set("#grain", { x: Math.round(rnd() * 200 - 100), y: Math.round(rnd() * 200 - 100) }, t);
    // Fade from and to black.
    tl.fromTo("#fade", { opacity: 1 }, { opacity: 0, duration: 0.9, ease: "power1.out" }, 0.05);
    tl.to("#fade", { opacity: 1, duration: 0.85, ease: "power1.in" }, T.total - 0.9);
    // Brand bug: visible through the body of the film.
    tl.set("#bug", { opacity: 0 }, 0);
    tl.to("#bug", { opacity: 1, duration: 0.8, ease: "power1.out" }, S.anatomy.start + 0.8);
    tl.to("#bug", { opacity: 0, duration: 0.4, ease: "power1.in" }, C.end - 0.2);
    // Light streak used on the big cuts.
    tl.set("#streak", { rotation: 16, opacity: 0.85 }, 0);
    const streak = (t) => tl.fromTo("#streak", { x: 0 }, { x: 3200, duration: 0.85, ease: "power2.inOut" }, t);

    // ---------- scene transitions (cam layer) ----------
    const camIn = (id, t, from) => tl.fromTo(`#${id}-cam`, { opacity: 0, filter: "blur(14px)", ...from }, { opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)", duration: 0.8, ease: "power3.out" }, t);
    const camOut = (id, t, to) => tl.to(`#${id}-cam`, { opacity: 0, filter: "blur(14px)", duration: 0.55, ease: "power2.in", ...to }, t);

    tl.fromTo("#s1-cam", { opacity: 1 }, { opacity: 1, duration: 0.01 }, 0);
    camOut("s1", S.anatomy.start, { scale: 1.18 });
    camIn("s2", S.anatomy.start, { scale: 0.9 });
    camOut("s2", S.compare.start, { x: -220 });
    camIn("s3", S.compare.start, { x: 220 });
    camOut("s3", S.loop.start, { scale: 0.88 });
    camIn("s4", S.loop.start, { scale: 1.12 });
    camOut("s4", S.example.start, { y: -140 });
    camIn("s5", S.example.start, { y: 140 });
    camOut("s5", S.close.start, { scale: 1.2 });
    camIn("s6", S.close.start, { scale: 0.86 });
    streak(C.s1_title - 0.05);
    streak(S.loop.start - 0.2);
    streak(S.close.start - 0.2);

    // Ambient camera drift, a different move per scene.
    tl.fromTo("#s1-rig", { scale: 1 }, { scale: 1.045, duration: S.hook.dur, ease: "none" }, 0);
    tl.fromTo("#s2-rig", { scale: 1.03, rotation: 0.6 }, { scale: 1, rotation: -0.4, duration: S.anatomy.dur, ease: "none" }, S.anatomy.start);
    tl.fromTo("#s3-rig", { x: 24 }, { x: -24, duration: S.compare.dur, ease: "none" }, S.compare.start);
    tl.fromTo("#s4-rig", { scale: 1 }, { scale: 1.03, duration: S.loop.dur, ease: "none" }, S.loop.start);
    tl.fromTo("#s5-rig", { x: -10, y: 10 }, { x: 10, y: -12, duration: S.example.dur, ease: "none" }, S.example.start);
    tl.fromTo("#s6-rig", { scale: 1 }, { scale: 1.06, duration: S.close.dur, ease: "none" }, S.close.start);

    // Core rings spin wherever a core is on screen.
    const spin = (id, t0, d) => {
      tl.fromTo(`#${id}-r1`, { rotation: 0 }, { rotation: d * 22, duration: d, ease: "none" }, t0);
      tl.fromTo(`#${id}-r2`, { rotation: 0 }, { rotation: -d * 48, duration: d, ease: "none" }, t0);
    };
    spin("s1-core", 0, S.hook.dur);
    spin("s2-core", S.anatomy.start, S.anatomy.dur);
    spin("s4-mini", S.loop.start, S.loop.dur);
    spin("s5-core", S.example.start, S.example.dur);
    spin("s6-core", S.close.start, S.close.dur);

    // ---------- S1 hook ----------
    tl.fromTo("#s1-chat", { opacity: 0, y: 46, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 1.0, ease: "expo.out" }, C.s1_chat);
    tl.fromTo("#s1-chat-tag", { opacity: 0, x: -34 }, { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" }, C.s1_chat + 0.25);
    tl.fromTo("#s1-q", { opacity: 0, scale: 0.6, transformOrigin: "100% 100%" }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.8)" }, C.s1_q);
    tl.fromTo("#s1-a", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, C.s1_a);
    tl.fromTo("#s1-a i", { backgroundPosition: "100% 0" }, { backgroundPosition: "-200% 0", duration: 1.1, repeat: 3, ease: "none" }, C.s1_a + 0.1);
    const A = C.s1_agent;
    tl.to("#s1-chat", { opacity: 0.32, scale: 0.95, duration: 0.8, ease: "power2.inOut" }, A);
    tl.to("#s1-chat-tag", { opacity: 0.32, duration: 0.8, ease: "power2.inOut" }, A);
    tl.fromTo("#s1-core", { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 1.0, ease: "expo.out" }, A);
    tl.fromTo("#s1-core-glow", { scale: 0.85 }, { scale: 1.12, duration: 0.6, yoyo: true, repeat: 3, ease: "sine.inOut" }, A + 0.9);
    for (let i = 0; i < 4; i++) {
      tl.fromTo(`#s1-beam-${i}`, { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.45, ease: "power2.out" }, A + 0.22 + i * 0.12);
      tl.fromTo(`#s1-tool-${i}`, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(2)" }, A + 0.4 + i * 0.12);
      tl.fromTo(`#s1-ok-${i}`, { scale: 0 }, { scale: 1, duration: 0.35, ease: "back.out(3)" }, A + 0.95 + i * 0.14);
    }
    // Data packets stream from the core out to each tool.
    const toolPos = $$(".s1-tool").map((el) => ({ x: parseFloat(el.style.left) - 1440, y: parseFloat(el.style.top) - 540 }));
    toolPos.forEach((p, i) => {
      tl.fromTo(`#s1-pkt-${i}`, { x: 0, y: 0, opacity: 1 }, { x: p.x, y: p.y, duration: 0.5, ease: "power1.in", repeat: 3, repeatDelay: 0.22 }, A + 0.75 + i * 0.13);
    });
    tl.to($$(".s1-pkt"), { opacity: 0, duration: 0.2 }, C.s1_title - 0.4);
    tl.fromTo("#s1-agent-tag", { opacity: 0, y: -24 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, A + 0.3);
    // Title beat.
    const B = C.s1_title;
    tl.to(["#s1-chat", "#s1-chat-tag"], { opacity: 0, x: -140, duration: 0.5, ease: "power2.in" }, B - 0.35);
    tl.to("#s1-agent-tag", { opacity: 0, y: -30, duration: 0.4, ease: "power2.in" }, B - 0.35);
    tl.to("#s1-beams", { opacity: 0, duration: 0.3, ease: "power1.in" }, B - 0.3);
    tl.to($$(".s1-tool"), { opacity: 0, scale: 0.5, duration: 0.4, ease: "power2.in", stagger: 0.04 }, B - 0.35);
    tl.to("#s1-core", { x: 960 - 1440, y: 470 - 540, scale: 3.4, opacity: 0.28, duration: 1.1, ease: "power3.inOut" }, B - 0.3);
    $$("#s1-big span").forEach((el, i) => {
      tl.fromTo(el, { opacity: 0, y: 110, filter: "blur(16px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.85, ease: "expo.out" }, B + 0.12 + i * 0.045);
    });
    tl.fromTo("#s1-rl", { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "power3.out" }, B + 0.5);
    tl.fromTo("#s1-rr", { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "power3.out" }, B + 0.5);
    tl.fromTo("#s1-km", { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, B + 0.6);

    // ---------- S2 anatomy ----------
    tl.fromTo("#s2-core", { opacity: 0.3, scale: 1.7 }, { opacity: 1, scale: 1, duration: 1.1, ease: "expo.out" }, C.s2_in + 0.05);
    tl.fromTo("#s2-pill", { opacity: 0, y: -22 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, C.s2_in + 0.45);
    tl.fromTo("#s2-goal", { opacity: 0, x: -70 }, { opacity: 1, x: 0, duration: 0.75, ease: "expo.out" }, C.s2_goal);
    tl.fromTo("#s2-in", { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.5, ease: "power2.out" }, C.s2_dot1 - 0.15);
    tl.fromTo("#s2-dot1", { x: 0, opacity: 0 }, { x: 270, opacity: 1, duration: 0.7, ease: "power2.in" }, C.s2_dot1);
    tl.to("#s2-dot1", { opacity: 0, duration: 0.15 }, C.s2_dot1 + 0.7);
    tl.fromTo("#s2-core-orb", { scale: 1 }, { scale: 1.1, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" }, C.s2_dot1 + 0.68);
    tl.fromTo("#s2-out", { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.5, ease: "power2.out" }, C.s2_dot2 - 0.1);
    tl.fromTo("#s2-dot2", { x: 0, opacity: 0 }, { x: 300, opacity: 1, duration: 0.6, ease: "power2.out" }, C.s2_dot2);
    tl.to("#s2-dot2", { opacity: 0, duration: 0.15 }, C.s2_dot2 + 0.6);
    tl.fromTo("#s2-done", { opacity: 0, scale: 0.55 }, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(2.2)" }, C.s2_done);
    const N0 = C.s2_nodes[0];
    tl.to("#s2-goal", { opacity: 0, x: -60, duration: 0.4, ease: "power2.in" }, N0 - 0.3);
    tl.to("#s2-done", { opacity: 0, x: 60, duration: 0.4, ease: "power2.in" }, N0 - 0.3);
    tl.to(["#s2-in", "#s2-out"], { opacity: 0, duration: 0.3 }, N0 - 0.3);
    const nodeFrom = [{ x: -50 }, { x: 50 }, { y: 50 }];
    ["brain", "memory", "tools"].forEach((n, i) => {
      const t = C.s2_nodes[i];
      tl.fromTo(`#s2-c-${n}`, { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.5, ease: "power2.inOut" }, t);
      tl.fromTo(`#s2-${n}`, { opacity: 0, scale: 0.88, ...nodeFrom[i] }, { opacity: 1, scale: 1, x: 0, y: 0, duration: 0.7, ease: "back.out(1.5)" }, t + 0.35);
    });

    // ---------- S3 compare ----------
    tl.fromTo("#s3-lpan", { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.9, ease: "power3.out" }, C.s3_in + 0.1);
    tl.fromTo("#s3-rpan", { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.9, ease: "power3.out" }, C.s3_right - 0.2);
    tl.to("#s3-lpan", { opacity: 0.45, duration: 0.6, ease: "power2.inOut" }, C.s3_right);
    tl.fromTo("#s3-div", { scaleY: 0 }, { scaleY: 1, duration: 1.0, ease: "power3.inOut" }, C.s3_in + 0.2);
    tl.fromTo("#s3-lh", { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, C.s3_left);
    tl.fromTo("#s3-q", { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.55, ease: "back.out(2)" }, C.s3_q);
    tl.fromTo("#s3-la", { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: "power2.inOut" }, (C.s3_q + C.s3_a) / 2 - 0.1);
    tl.fromTo("#s3-a", { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.55, ease: "back.out(2)" }, C.s3_a);
    tl.to(["#s3-lh", "#s3-lf"], { opacity: 0.3, duration: 0.6, ease: "power2.inOut" }, C.s3_right);
    tl.fromTo("#s3-rh", { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, C.s3_right);
    tl.fromTo("#s3-g", { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.55, ease: "back.out(2)" }, C.s3_goal);
    tl.fromTo("#s3-track", { scaleX: 0, transformOrigin: "0 50%" }, { scaleX: 1, duration: 0.5, ease: "power2.out" }, C.s3_goal + 0.1);
    for (let i = 0; i < 3; i++) tl.fromTo(`#s3-st-${i}`, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.5)" }, C.s3_goal + 0.15 + i * 0.07);
    tl.fromTo("#s3-fill", { scaleX: 0 }, { scaleX: 1, duration: C.s3_f1 - C.s3_f0, ease: "power1.inOut" }, C.s3_f0);
    [0.25, 0.5, 0.75].forEach((f, i) => {
      tl.fromTo(`#s3-sc-${i}`, { scale: 0 }, { scale: 1, duration: 0.35, ease: "back.out(3)" }, C.s3_f0 + f * (C.s3_f1 - C.s3_f0));
    });
    tl.set($$(".s3-step .sc"), { scale: 0 }, 0);
    tl.fromTo("#s3-r", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(2.4)" }, C.s3_f1);

    // ---------- S4 loop ----------
    tl.fromTo("#s4-tk", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, C.s4_in + 0.25);
    tl.fromTo("#s4-ts", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, C.s4_in + 0.6);
    tl.fromTo("#s4-base", { drawSVG: "0%" }, { drawSVG: "100%", duration: 1.3, ease: "power2.inOut" }, C.s4_ring);
    tl.set("#s4-prog", { drawSVG: "0% 0%" }, 0);
    tl.fromTo($$(".s4-chev"), { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.08 }, C.s4_ring + 0.9);
    tl.fromTo("#s4-mini", { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.9, ease: "expo.out" }, C.s4_ring + 0.2);
    const labFrom = [{ x: -20 }, { x: -20 }, { x: 20 }, { x: 20 }];
    for (let i = 0; i < 4; i++) {
      tl.fromTo(`#s4-n-${i}`, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2.4)" }, C.s4_nodes + i * 0.15);
      tl.fromTo(`#s4-lab-${i}`, { opacity: 0, ...labFrom[i] }, { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }, C.s4_nodes + 0.12 + i * 0.15);
      tl.set(`#s4-on-${i}`, { opacity: 0 }, 0);
    }
    tl.set("#s4-comet", { opacity: 0 }, 0);
    // Shift ring left; detail panel takes the right side.
    const X = C.s4_shift;
    tl.to("#s4-title", { opacity: 0, y: -40, duration: 0.5, ease: "power2.in" }, X);
    tl.to($$(".s4-lab"), { opacity: 0, duration: 0.35, ease: "power1.in" }, X);
    tl.to("#s4-ring", { x: -430, y: 20, scale: 0.86, duration: 1.0, ease: "power3.inOut" }, X);
    tl.to("#s4-comet", { opacity: 1, duration: 0.3 }, X + 0.5);
    const steps = C.s4_step;
    for (let i = 0; i < 4; i++) {
      const t = steps[i];
      const p = `#s4-p-${i}`;
      if (i > 0) {
        tl.to(`#s4-p-${i - 1}`, { opacity: 0, x: -50, duration: 0.35, ease: "power2.in" }, t - 0.3);
        tl.to(`#s4-n-${i - 1}`, { scale: 1, duration: 0.4, ease: "power2.out" }, t - 0.1);
        tl.fromTo("#s4-comet", { rotation: (i - 1) * 90 }, { rotation: i * 90, duration: 0.7, ease: "power2.inOut" }, t - 0.3);
        tl.to("#s4-prog", { drawSVG: `0% ${i * 25}%`, duration: 0.7, ease: "power2.inOut" }, t - 0.3);
      }
      tl.to(`#s4-on-${i}`, { opacity: 1, duration: 0.3 }, t + 0.25);
      tl.to(`#s4-n-${i}`, { scale: 1.22, duration: 0.5, ease: "back.out(2.5)" }, t + 0.2);
      tl.fromTo(p, { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.7, ease: "expo.out" }, t);
      tl.fromTo(`#s4-bar-${i}`, { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: "power3.out" }, t + 0.2);
    }
    // Step 1: inputs stream in.
    C.s4_items[0].forEach((t, k) => tl.fromTo(`#s4-in-${k}`, { opacity: 0, x: 140 }, { opacity: 1, x: 0, duration: 0.65, ease: "expo.out" }, t - 0.25));
    // Step 2: plan builds top-down.
    C.s4_items[1].forEach((t, k) => {
      tl.fromTo(`#s4-pl-${k}`, { opacity: 0, x: -36 }, { opacity: 1, x: 0, duration: 0.55, ease: "power3.out" }, t - 0.25);
      if (k < 2) tl.fromTo(`#s4-pll-${k}`, { scaleY: 0 }, { scaleY: 1, duration: 0.35, ease: "power1.out" }, t + 0.15);
    });
    // Step 3: tools light up in turn.
    for (let k = 0; k < 4; k++) {
      tl.fromTo(`#s4-tl-${k}`, { opacity: 0, scale: 0.86 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.8)" }, steps[2] + 0.3 + k * 0.08);
      tl.fromTo(`#s4-tg-${k}`, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" }, C.s4_tools[k] + 0.4);
      tl.to(`#s4-tg-${k}`, { opacity: 0.3, duration: 0.6, ease: "power1.out" }, C.s4_tools[k] + 0.7);
    }
    // Step 4: check, loop again, complete.
    const pct = { v: 0 };
    const pctEl = $("#s4-pct");
    tl.set("#s4-garc", { drawSVG: "0% 0%" }, 0);
    tl.set("#s4-gok", { scale: 0 }, 0);
    tl.to("#s4-garc", { drawSVG: "0% 72%", duration: 1.0, ease: "power2.out" }, C.s4_gauge);
    tl.fromTo(pct, { v: 0 }, { v: 72, duration: 1.0, ease: "power2.out", onUpdate: () => (pctEl.textContent = Math.round(pct.v) + "%") }, C.s4_gauge);
    tl.fromTo("#s4-q", { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" }, C.s4_gauge + 0.3);
    tl.fromTo("#s4-rep", { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }, C.s4_laps0);
    tl.fromTo("#s4-repi", { rotation: 0 }, { rotation: 720, duration: C.s4_laps1 - C.s4_laps0, ease: "power1.inOut" }, C.s4_laps0);
    tl.fromTo("#s4-comet", { rotation: 270 }, { rotation: 270 + 720, duration: C.s4_laps1 - C.s4_laps0, ease: "power1.inOut" }, C.s4_laps0);
    tl.to("#s4-prog", { drawSVG: "0% 100%", duration: 0.6, ease: "power2.inOut" }, C.s4_laps0);
    tl.to("#s4-garc", { drawSVG: "0% 100%", duration: 0.7, ease: "power2.inOut" }, C.s4_laps1 - 0.2);
    tl.to(pct, { v: 100, duration: 0.7, ease: "power2.inOut", onUpdate: () => (pctEl.textContent = Math.round(pct.v) + "%") }, C.s4_laps1 - 0.2);
    tl.to("#s4-pct", { opacity: 0, duration: 0.2 }, C.s4_ok - 0.1);
    tl.to("#s4-gok", { scale: 1, duration: 0.5, ease: "back.out(2.6)" }, C.s4_ok);
    tl.fromTo("#s4-mini-glow", { scale: 1 }, { scale: 1.3, duration: 0.3, yoyo: true, repeat: 1, ease: "power2.out" }, C.s4_ok);

    // ---------- S5 example ----------
    const E0 = C.s5_in;
    tl.fromTo("#s5-tag", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" }, E0 + 0.35);
    tl.fromTo("#s5-card", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.95, ease: "expo.out" }, E0 + 0.2);
    tl.fromTo("#s5-cal", { opacity: 0, x: 80 }, { opacity: 1, x: 0, duration: 0.9, ease: "expo.out" }, E0 + 0.45);
    tl.fromTo("#s5-mail", { opacity: 0, x: 80 }, { opacity: 1, x: 0, duration: 0.9, ease: "expo.out" }, E0 + 0.6);
    // Typing: a stepped wipe keeps Khmer clusters intact while it reveals.
    const typeDur = C.s5_type1 - C.s5_type0;
    const ptEl = $("#s5-pt");
    const caret = document.createElement("i");
    caret.id = "s5-caret";
    caret.style.left = "28px";
    ptEl.parentNode.appendChild(caret);
    tl.fromTo("#s5-pt", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: typeDur, ease: "steps(26)" }, C.s5_type0);
    tl.fromTo("#s5-caret", { x: 0 }, { x: tw + 4, duration: typeDur, ease: "steps(26)" }, C.s5_type0);
    tl.fromTo("#s5-caret", { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "steps(1)", repeat: Math.max(0, Math.floor((S.example.dur - 1) / 0.3) - 1), yoyo: true }, E0 + 0.5);
    tl.fromTo("#s5-agent", { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" }, C.s5_rows - 0.1);
    [0, 1, 2].forEach((k) => {
      tl.fromTo(`#s5-d${k}`, { y: 0 }, { y: -9, duration: 0.3, yoyo: true, repeat: 9, ease: "sine.inOut" }, C.s5_rows + k * 0.1);
      const ok = C.s5_ok[k];
      const start = C.s5_rows + 0.15 + k * 0.12;
      tl.fromTo(`#s5-r-${k}`, { opacity: 0, x: -34 }, { opacity: 1, x: 0, duration: 0.55, ease: "power3.out" }, start);
      tl.fromTo(`#s5-sp-${k}`, { rotation: 0 }, { rotation: 360 * Math.max(1, Math.round((ok - start) / 0.8)), duration: ok - start, ease: "none" }, start);
      tl.to(`#s5-sp-${k}`, { opacity: 0, duration: 0.15 }, ok);
      tl.set(`#s5-ok-${k}`, { scale: 0 }, 0);
      tl.to(`#s5-ok-${k}`, { scale: 1, duration: 0.4, ease: "back.out(3)" }, ok);
    });
    tl.fromTo("#s5-pf", { scaleX: 0 }, { scaleX: 1, duration: C.s5_done - C.s5_rows, ease: "power1.inOut" }, C.s5_rows);
    tl.fromTo("#s5-free", { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2.6)" }, C.s5_free);
    tl.fromTo("#s5-plane", { x: 0, y: 0, opacity: 0, rotation: 0 }, { x: 460, y: -230, opacity: 1, rotation: 8, duration: 0.85, ease: "power2.in" }, C.s5_plane);
    tl.to("#s5-plane", { opacity: 0, duration: 0.2 }, C.s5_plane + 0.7);
    tl.to("#s5-mail", { opacity: 0, scale: 0.94, duration: 0.3, ease: "power2.in" }, C.s5_done - 0.25);
    tl.fromTo("#s5-done", { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(2)" }, C.s5_done);
    tl.fromTo($$(".s5-ray"), { opacity: 0, y: 30, scaleY: 0.2 }, { opacity: 1, y: -10, scaleY: 1, duration: 0.35, ease: "power2.out" }, C.s5_done + 0.1);
    tl.to($$(".s5-ray"), { opacity: 0, y: -40, scaleY: 0.3, duration: 0.4, ease: "power2.in" }, C.s5_done + 0.45);

    // ---------- S6 close ----------
    const F = C.s6_in;
    tl.fromTo("#s6-core", { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 1.1, ease: "expo.out" }, F + 0.1);
    [0, 1, 2].forEach((k) => {
      tl.fromTo(`#s6-w${k}`, { scale: 0.7, opacity: 0.85 }, { scale: 2.8, opacity: 0, duration: 2.4, ease: "power1.out", repeat: 1 }, F + 0.4 + k * 0.8);
    });
    tl.fromTo("#s6-l1", { opacity: 0, y: 34, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, ease: "power3.out" }, C.s6_l1);
    tl.fromTo("#s6-l2", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, C.s6_l2);
    const G = C.end;
    tl.to("#s6-grp", { opacity: 0, scale: 0.95, filter: "blur(10px)", duration: 0.6, ease: "power2.in" }, G - 0.1);
    tl.set("#s6-brand", { opacity: 0 }, 0);
    tl.set("#s6-brand", { opacity: 1 }, G + 0.2);
    tl.fromTo("#s6-mark", { opacity: 0, scale: 0, rotation: -120 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.9, ease: "back.out(1.7)" }, G + 0.3);
    tl.fromTo("#s6-wm", { opacity: 0, x: -40, clipPath: "inset(0 100% 0 0)" }, { opacity: 1, x: 0, clipPath: "inset(0 0% 0 0)", duration: 0.9, ease: "expo.out" }, G + 0.5);
    tl.fromTo("#s6-ul", { scaleX: 0, opacity: 1 }, { scaleX: 1, opacity: 1, duration: 1.0, ease: "power3.out" }, G + 0.75);

    // Subtitles: gentle rise on each chunk.
    $$(".sub span").forEach((el) => {
      const host = el.parentNode;
      const s = parseFloat(host.dataset.start);
      tl.fromTo(el, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.28, ease: "power2.out" }, s);
    });

    window.__timelines["main"] = tl;
    if (window.__hfForceTimelineRebind) window.__hfForceTimelineRebind();
  }

  document.fonts.ready.then(build);
})();
