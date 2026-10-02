/* AF — shared building blocks for the "What Is an AI Agent?" film.
   Pure markup helpers + deterministic randomness. No clocks, no network. */
(function () {
  const ICONS = {
    mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7.5l8.5 6 8.5-6"/>',
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M8.5 13h7M8.5 17h5"/>',
    sheet: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M3 9h18M3 15h18M9 3v18"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.7 3.8 5.7 3.8 9s-1.2 6.3-3.8 9c-2.6-2.7-3.8-5.7-3.8-9S9.4 5.7 12 3z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    chat: '<path d="M20.5 11.5a8 8 0 0 1-11.7 7.1L4 20l1.3-4.3A8 8 0 1 1 20.5 11.5z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5l-4.5-4.5"/>',
    chart: '<path d="M4 20V11M10 20V5M16 20v-6M21 20H3"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20.5c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/><circle cx="17.5" cy="9" r="2.6"/><path d="M16.5 14.3c2.9.4 5 2.8 5 6"/>',
    dollar: '<path d="M12 2.5v19"/><path d="M16.8 7.3c0-2-2.2-3.2-4.8-3.2S7.2 5.3 7.2 7.3s2.2 2.8 4.8 3.2 4.8 1.4 4.8 3.4-2.2 3.4-4.8 3.4-4.8-1.2-4.8-3.2"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.8 2H4.2z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
    folder: '<path d="M3 7.5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    send: '<path d="M12 19V5M5.5 11.5L12 5l6.5 6.5"/>',
    report: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 18v-3M12 18v-5M15 18v-2"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z"/>',
    list: '<path d="M9.5 6h11M9.5 12h11M9.5 18h11"/><circle cx="4.5" cy="6" r="1.3"/><circle cx="4.5" cy="12" r="1.3"/><circle cx="4.5" cy="18" r="1.3"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    shield: '<path d="M12 3l8 3v6c0 4.6-3.4 8.3-8 9.2-4.6-.9-8-4.6-8-9.2V6z"/><path d="M8.5 12.2l2.5 2.5 4.6-4.6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    bolt: '<path d="M13 2.5L4.5 13.5H11l-1 8 8.5-11H12z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
    arrowRight: '<path d="M4 12h15M13 6l6 6-6 6"/>',
    inbox: '<path d="M3 13l2.5-7.5A2 2 0 0 1 7.4 4h9.2a2 2 0 0 1 1.9 1.5L21 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 13h5l1.5 2.5h5L16 13h5"/>'
  };

  function icon(name, size, color, stroke, extraStyle) {
    const s = size || 24, c = color || 'currentColor', w = stroke || 2;
    return '<svg class="ic" viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="' + c +
      '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round" style="display:block;' + (extraStyle || '') + '">' +
      (ICONS[name] || '') + '</svg>';
  }

  /* The AI Agent: a glass orb core with two soft "eyes", orbit rings and a halo.
     Everything inside is sized in %, so one markup scales to any size. */
  function agent(id, size, opts) {
    const o = opts || {};
    const tone = o.tone || 'green';
    return '<div class="agent agent-' + tone + '" id="' + id + '" style="width:' + size + 'px;height:' + size + 'px;">' +
      '<div class="agent-halo" id="' + id + '-halo"></div>' +
      '<div class="agent-orbit agent-o1 agent-back"><div class="agent-ring agent-r1"></div></div>' +
      '<div class="agent-orbit agent-o2 agent-back"><div class="agent-ring agent-ring-alt agent-r2"></div></div>' +
      '<div class="agent-orb" id="' + id + '-orb">' +
      '<div class="agent-core-glow"></div><div class="agent-shine"></div>' +
      '<div class="agent-eyes" id="' + id + '-eyes"><i></i><i></i></div>' +
      '</div>' +
      '<div class="agent-orbit agent-o1 agent-front"><div class="agent-ring agent-r1"></div></div>' +
      '<div class="agent-orbit agent-o2 agent-front"><div class="agent-ring agent-ring-alt agent-r2"></div></div>' +
      '</div>';
  }

  function cursor(id, color, label) {
    const c = color || '#1D2125';
    return '<div class="af-cursor" id="' + id + '">' +
      '<svg viewBox="0 0 24 24" width="34" height="34" style="display:block;filter:drop-shadow(0 4px 6px rgba(0,0,0,.25))">' +
      '<path d="M4 2.5v17.2l4.6-4.4 3.1 7.1 3.2-1.4-3.1-6.9h6.6z" fill="' + c + '" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>' +
      (label ? '<span class="af-cursor-label" style="background:' + c + '">' + label + '</span>' : '') + '</div>';
  }

  // mulberry32 — seeded, deterministic
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // split text into per-character spans (spaces preserved)
  function chars(text, cls) {
    return text.split('').map(function (ch) {
      return '<span class="' + (cls || 'ch') + '">' + (ch === ' ' ? '&nbsp;' : ch) + '</span>';
    }).join('');
  }
  function words(text, cls) {
    return text.split(' ').map(function (w) {
      return '<span class="wmask"><span class="' + (cls || 'w') + '">' + w + '</span></span>';
    }).join('<span class="wsp"> </span>');
  }

  // typewriter onto an element's textContent, deterministic with the timeline
  function type(tl, el, text, start, dur) {
    const n = text.length; const o = { v: 0 };
    tl.fromTo(o, { v: 0 }, {
      v: n, duration: dur, ease: 'none', onUpdate: function () { el.textContent = text.slice(0, Math.round(o.v)); }
    }, start);
  }
  // numeric count-up with formatter
  function count(tl, el, from, to, start, dur, fmt, ease) {
    const o = { v: from };
    tl.fromTo(o, { v: from }, {
      v: to, duration: dur, ease: ease || 'power2.out',
      onUpdate: function () { el.textContent = fmt ? fmt(o.v) : Math.round(o.v); }
    }, start);
  }
  function usd(v) { return '$' + Math.round(v).toLocaleString('en-US'); }

  /* Standard idle life for an agent core: ring spin, halo breathing, a blink. Finite, seek-safe. */
  function agentLife(tl, id, start, dur, speed) {
    const sp = speed || 1;
    tl.fromTo('#' + id + ' .agent-r1', { rotation: 0 }, { rotation: 360 * sp * dur / 4, duration: dur, ease: 'none' }, start);
    tl.fromTo('#' + id + ' .agent-r2', { rotation: 40 }, { rotation: 40 - 360 * sp * dur / 6, duration: dur, ease: 'none' }, start);
    const breaths = Math.max(1, Math.floor(dur / 1.6));
    for (let i = 0; i < breaths; i++) {
      tl.to('#' + id + '-halo', { scale: 1.12, opacity: 0.95, duration: 0.8, ease: 'sine.inOut' }, start + i * 1.6);
      tl.to('#' + id + '-halo', { scale: 1.0, opacity: 0.75, duration: 0.8, ease: 'sine.inOut' }, start + i * 1.6 + 0.8);
    }
  }
  function blink(tl, id, at) {
    tl.to('#' + id + '-eyes i', { scaleY: 0.12, duration: 0.07, ease: 'power2.in' }, at);
    tl.to('#' + id + '-eyes i', { scaleY: 1, duration: 0.12, ease: 'power2.out' }, at + 0.08);
  }

  // layout-free measuring: canvas text width (fonts must be loaded) and inline-style boxes
  let _cv = null;
  function measure(text, font, letterSpacingPx) {
    if (!_cv) _cv = document.createElement('canvas').getContext('2d');
    _cv.font = font;
    try { _cv.letterSpacing = (letterSpacingPx || 0) + 'px'; } catch (e) {}
    let w = _cv.measureText(text).width;
    if (!('letterSpacing' in _cv) && letterSpacingPx) w += letterSpacingPx * text.length;
    return w;
  }
  function box(el) {
    const st = el.style;
    return { l: parseFloat(st.left) || 0, t: parseFloat(st.top) || 0, w: parseFloat(st.width) || el.offsetWidth || 0, h: parseFloat(st.height) || el.offsetHeight || 0 };
  }

  /* The human-review panel (final, approved layout). Scene 7 animates into it; scene 8 opens on it. */
  function reviewCard(id) {
    const row = function (k, t) {
      return '<div class="rv-row" id="' + id + '-row' + k + '" style="top:' + (262 + k * 58) + 'px;"><div class="rv-ck" id="' + id + '-ck' + k + '">' + icon('check', 16, '#fff', 3.2) + '</div><span>' + t + '</span></div>';
    };
    return '<div class="rv-card" id="' + id + '">' +
      '<div class="rv-eb" id="' + id + '-eb">' + icon('shield', 18, '#1E9E58', 2.2) + '<span>Human review</span></div>' +
      '<div class="rv-title">Daily Business Report</div>' +
      '<div class="rv-pill" id="' + id + '-pill"><span id="' + id + '-pilltxt">APPROVED</span></div>' +
      '<div class="rv-kpis" id="' + id + '-kpis"><div><i>Revenue</i><b>$48,920</b></div><div><i>Orders</i><b>376</b></div><div><i>Growth</i><b style="color:#1E9E58">+9%</b></div></div>' +
      '<div class="rv-lab" id="' + id + '-lab">Checklist</div>' +
      row(0, 'Data sources verified') + row(1, 'Numbers checked') + row(2, 'Recommendations reviewed') +
      '<div class="rv-btn" id="' + id + '-btn"><span class="rv-btn-fill" id="' + id + '-btnfill"></span><span class="rv-btn-txt" id="' + id + '-btntxt">' + icon('check', 22, '#fff', 3) + 'Approved</span></div>' +
      '<div class="rv-btn2" id="' + id + '-btn2">Request changes</div>' +
      '<div class="rv-foot" id="' + id + '-foot">' + icon('user', 18, '#59616A', 2.2) + '<span>Final decision: Manager</span></div>' +
      '<div class="rv-stamp" id="' + id + '-stamp">' + icon('check', 34, '#1E9E58', 3.4) + 'APPROVED</div>' +
      '</div>';
  }

  // mark intentional layering for the layout auditor (the attribute is not inherited, so tag each node)
  function allow(sel, kind) { document.querySelectorAll(sel).forEach(function (el) { el.setAttribute('data-layout-' + (kind || 'allow-overlap'), ''); }); }

  window.AF = { allow: allow, reviewCard: reviewCard, measure: measure, box: box, icon: icon, agent: agent, cursor: cursor, rng: rng, chars: chars, words: words, type: type, count: count, usd: usd, agentLife: agentLife, blink: blink };
})();
