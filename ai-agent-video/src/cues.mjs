// Absolute cue times (seconds) shared by the animation timeline and the sound
// design, derived from the narration timing so picture and sound stay locked.
export function cues(T) {
  const at = (id, f = 0) => T.lines[id].start + f * T.lines[id].dur;
  const S = T.scenes;
  return {
    s1_chat: 0.3, s1_q: 0.8, s1_a: 1.3,
    s1_agent: Math.max(at("L01", 0.45), 2.2),
    s1_title: at("L02", 0) - 0.1,
    s2_in: S.anatomy.start,
    s2_goal: at("L03", 0.1), s2_dot1: at("L03", 0.28), s2_dot2: at("L03", 0.58), s2_done: at("L03", 0.7),
    s2_nodes: [at("L04", 0.04), at("L04", 0.4), at("L04", 0.7)],
    s3_in: S.compare.start,
    s3_left: at("L05", 0) - 0.15, s3_q: at("L05", 0.12), s3_a: at("L05", 0.5),
    s3_right: at("L06", 0) - 0.15, s3_goal: at("L06", 0.1), s3_f0: at("L06", 0.24), s3_f1: at("L06", 0.86),
    s4_in: S.loop.start,
    s4_ring: at("L07", 0.12), s4_nodes: at("L07", 0.32), s4_shift: at("L08", 0) - 0.45,
    s4_step: ["L08", "L09", "L10", "L11"].map((id) => at(id, 0) - 0.1),
    s4_items: ["L08", "L09", "L10"].map((id) => [0.3, 0.5, 0.7].map((f) => at(id, f))),
    s4_tools: [0.3, 0.45, 0.6, 0.75].map((f) => at("L10", f)),
    s4_gauge: at("L11", 0.18), s4_laps0: at("L11", 0.35), s4_laps1: at("L11", 0.78), s4_ok: at("L11", 0.86),
    s5_in: S.example.start,
    s5_type0: at("L12", 0.03), s5_type1: at("L12", 0.3), s5_rows: at("L12", 0.36),
    s5_ok: [at("L12", 0.55), at("L12", 0.69), at("L12", 0.84)],
    s5_free: at("L12", 0.66), s5_plane: at("L12", 0.84), s5_done: at("L12", 0.93),
    s6_in: S.close.start, s6_l1: at("L13", 0.06), s6_l2: at("L13", 0.42),
    end: T.endcard, total: T.total,
  };
}

// Sound-effect events for the mixer (tools/mix.py).
export function sfxEvents(T) {
  const C = cues(T);
  const S = T.scenes;
  const ev = [];
  const add = (t, type, gain = 1) => ev.push({ t: +t.toFixed(3), type, gain });
  // Scene transitions.
  [S.anatomy.start, S.compare.start, S.loop.start, S.example.start, S.close.start].forEach((t) => add(t - 0.12, "whoosh", 0.9));
  add(C.end - 0.1, "whoosh", 0.7);
  // Hook.
  add(C.s1_q, "pop", 0.6); add(C.s1_a, "blip", 0.45);
  add(C.s1_agent, "bloom", 0.9);
  [0, 1, 2, 3].forEach((i) => add(C.s1_agent + 0.4 + i * 0.12, "pop", 0.55));
  [0, 1, 2, 3].forEach((i) => add(C.s1_agent + 0.95 + i * 0.14, "tick", 0.5));
  add(C.s1_title - 1.3, "riser", 0.8); add(C.s1_title + 0.12, "impact", 1.0);
  // Anatomy.
  add(C.s2_goal, "pop", 0.55); add(C.s2_dot1, "zip", 0.5); add(C.s2_dot2, "zip", 0.5); add(C.s2_done, "chime", 0.45);
  C.s2_nodes.forEach((t) => add(t + 0.4, "pop", 0.6));
  // Compare.
  add(C.s3_q, "pop", 0.5); add(C.s3_a, "pop", 0.5); add(C.s3_goal, "pop", 0.5);
  [0.25, 0.5, 0.75].forEach((f) => add(C.s3_f0 + f * (C.s3_f1 - C.s3_f0), "tick", 0.55));
  add(C.s3_f1, "chime", 0.5);
  // Loop.
  add(C.s4_ring, "swell", 0.7);
  [0, 1, 2, 3].forEach((i) => add(C.s4_nodes + i * 0.15, "tick", 0.4));
  C.s4_step.forEach((t) => add(t, "blip", 0.65));
  C.s4_items.forEach((row) => row.forEach((t) => add(t, "pop", 0.4)));
  C.s4_tools.forEach((t) => add(t + 0.5, "tick", 0.5));
  add(C.s4_laps0, "zip", 0.55); add(C.s4_ok, "chime", 0.6);
  // Example.
  add(C.s5_type0, "type", 0.5);
  C.s5_ok.forEach((t) => add(t, "tick", 0.6));
  add(C.s5_free, "pop", 0.55); add(C.s5_plane, "zip", 0.6); add(C.s5_done, "success", 0.8);
  // Close.
  add(C.s6_in + 0.1, "bloom", 0.8);
  add(C.end + 0.3, "impact", 0.85); add(C.end + 0.45, "shimmer", 0.6);
  return ev.sort((a, b) => a.t - b.t);
}
