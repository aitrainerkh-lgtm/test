/* Phnom Penh 3D — MapLibre GL + OpenFreeMap vector tiles (OpenStreetMap data). */
(function () {
  'use strict';

  var STYLES = {
    day: 'https://tiles.openfreemap.org/styles/liberty',
    night: 'https://tiles.openfreemap.org/styles/dark'
  };

  // Height (m) -> colour. Low shophouses stay sandy, towers turn deep teal (day) or glow warm (night).
  var RAMPS = {
    day: [[0, '#e8ddc9'], [20, '#d6b98f'], [50, '#9fb8ae'], [100, '#4a8a8f'], [150, '#1f4d5a']],
    night: [[0, '#2b373c'], [20, '#3c5157'], [50, '#557c7d'], [100, '#c9854f'], [150, '#f2b563']]
  };

  var SKY = {
    day: { 'sky-color': '#8fc1e3', 'horizon-color': '#e9eef0', 'fog-color': '#e9eef0',
      'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.7, 'fog-ground-blend': 0.85 },
    night: { 'sky-color': '#0b1520', 'horizon-color': '#1d2c36', 'fog-color': '#141c20',
      'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.7, 'fog-ground-blend': 0.85 }
  };

  // Camera positions are approximate; edit the coordinates here to fine-tune.
  var LANDMARKS = [
    { name: 'Royal Palace', center: [104.9311, 11.5636], zoom: 16.8, bearing: -30 },
    { name: 'Independence Monument', center: [104.9282, 11.5563], zoom: 17, bearing: 20 },
    { name: 'Wat Phnom', center: [104.9231, 11.5763], zoom: 17, bearing: -60 },
    { name: 'Central Market (Phsar Thmei)', center: [104.9210, 11.5696], zoom: 17, bearing: 45 },
    { name: 'Vattanac Capital', center: [104.9193, 11.5728], zoom: 16.4, bearing: -20 },
    { name: 'Koh Pich (Diamond Island)', center: [104.9375, 11.5445], zoom: 15.8, bearing: 30 },
    { name: 'AEON Mall Phnom Penh', center: [104.9335, 11.5487], zoom: 16.8, bearing: -45 },
    { name: 'Olympic Stadium', center: [104.9114, 11.5585], zoom: 16.4, bearing: 10 },
    { name: 'National Museum', center: [104.9297, 11.5662], zoom: 17.2, bearing: 60 },
    { name: 'Russian Market', center: [104.9171, 11.5393], zoom: 17, bearing: -15 },
    { name: 'Tuol Sleng Museum', center: [104.9176, 11.5494], zoom: 17.2, bearing: 35 },
    { name: 'Sisowath Quay', center: [104.9300, 11.5690], zoom: 16.4, bearing: -80 }
  ];

  var HOME = { center: [104.9245, 11.5640], zoom: 15.4, pitch: 62, bearing: -25 };
  var PITCH_3D = 62;
  var LAYER_ID = 'pp-buildings';

  var state = {
    mode: 'day',
    heightScale: 1,
    orbiting: false,
    touring: false,
    tourToken: 0
  };

  var $ = function (id) { return document.getElementById(id); };

  var map = new maplibregl.Map({
    container: 'map',
    style: STYLES.day,
    center: HOME.center,
    zoom: HOME.zoom,
    pitch: HOME.pitch,
    bearing: HOME.bearing,
    maxPitch: 85,
    maxBounds: [[104.55, 11.30], [105.30, 11.85]],
    hash: true,
    antialias: true
  });

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
  map.addControl(new maplibregl.FullscreenControl(), 'top-right');

  /* ---------- 3D buildings ---------- */

  function colorExpression() {
    var expr = ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 0]];
    RAMPS[state.mode].forEach(function (stop) { expr.push(stop[0], stop[1]); });
    return expr;
  }

  function heightExpression(prop, fallback) {
    return ['*', state.heightScale, ['coalesce', ['get', prop], fallback]];
  }

  function addBuildings() {
    var style = map.getStyle();
    var sourceId = null;
    var firstSymbolId;

    // Remove the style's own building layers so ours is the only one drawn.
    style.layers.forEach(function (layer) {
      if (layer['source-layer'] === 'building') {
        sourceId = sourceId || layer.source;
        map.removeLayer(layer.id);
      }
    });
    if (!sourceId) {
      sourceId = Object.keys(style.sources).find(function (id) {
        return style.sources[id].type === 'vector';
      });
    }
    map.getStyle().layers.some(function (layer) {
      if (layer.type === 'symbol') { firstSymbolId = layer.id; return true; }
      return false;
    });

    map.addLayer({
      id: LAYER_ID,
      type: 'fill-extrusion',
      source: sourceId,
      'source-layer': 'building',
      minzoom: 13,
      filter: ['!=', ['get', 'hide_3d'], true],
      paint: {
        'fill-extrusion-color': colorExpression(),
        'fill-extrusion-height': heightExpression('render_height', 5),
        'fill-extrusion-base': heightExpression('render_min_height', 0),
        'fill-extrusion-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0, 14, 0.93],
        'fill-extrusion-vertical-gradient': true
      }
    }, firstSymbolId);

    map.setLight({
      anchor: 'viewport',
      color: state.mode === 'day' ? '#ffffff' : '#c8d6ff',
      intensity: state.mode === 'day' ? 0.35 : 0.45,
      position: [1.3, 210, 35]
    });
    if (typeof map.setSky === 'function') {
      try { map.setSky(SKY[state.mode]); } catch (e) { /* sky is optional */ }
    }
  }

  function refreshBuildingPaint() {
    if (!map.getLayer(LAYER_ID)) return;
    map.setPaintProperty(LAYER_ID, 'fill-extrusion-height', heightExpression('render_height', 5));
    map.setPaintProperty(LAYER_ID, 'fill-extrusion-base', heightExpression('render_min_height', 0));
  }

  map.on('style.load', addBuildings);

  /* ---------- Building popup ---------- */

  var popup = new maplibregl.Popup({ closeButton: true, maxWidth: '240px', offset: 8 });

  map.on('click', LAYER_ID, function (e) {
    var f = e.features && e.features[0];
    if (!f) return;
    var h = f.properties.render_height;
    var base = f.properties.render_min_height;
    var html = '<strong>' + (h != null ? Math.round(h) + ' m tall' : 'Height not mapped') + '</strong>';
    if (base) html += '<div>Starts ' + Math.round(base) + ' m above ground</div>';
    html += '<div class="mono">' + e.lngLat.lat.toFixed(5) + ', ' + e.lngLat.lng.toFixed(5) + '</div>';
    popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
  });
  map.on('mouseenter', LAYER_ID, function () { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', LAYER_ID, function () { map.getCanvas().style.cursor = ''; });

  /* ---------- Camera readout ---------- */

  function updateReadout() {
    var c = map.getCenter();
    $('readout').textContent =
      c.lat.toFixed(4) + '°N ' + c.lng.toFixed(4) + '°E · zoom ' + map.getZoom().toFixed(1) +
      ' · tilt ' + Math.round(map.getPitch()) + '° · heading ' + Math.round((map.getBearing() + 360) % 360) + '°';
  }
  map.on('move', updateReadout);
  map.on('load', updateReadout);

  /* ---------- Landmarks & tour ---------- */

  var landmarkButtons = [];

  function flyToLandmark(lm, opts) {
    landmarkButtons.forEach(function (b) { b.classList.toggle('active', b.dataset.name === lm.name); });
    map.flyTo(Object.assign({
      center: lm.center,
      zoom: lm.zoom,
      pitch: PITCH_3D,
      bearing: lm.bearing,
      duration: 3500,
      essential: true
    }, opts || {}));
  }

  LANDMARKS.forEach(function (lm) {
    var li = document.createElement('li');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = lm.name;
    btn.dataset.name = lm.name;
    btn.addEventListener('click', function () {
      stopTour();
      stopOrbit();
      flyToLandmark(lm);
    });
    li.appendChild(btn);
    $('landmarks').appendChild(li);
    landmarkButtons.push(btn);
  });

  function waitForMoveEnd() {
    return new Promise(function (resolve) { map.once('moveend', resolve); });
  }
  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  async function runTour() {
    var token = ++state.tourToken;
    state.touring = true;
    setPressed('tour', true);
    for (var i = 0; state.touring && token === state.tourToken; i = (i + 1) % LANDMARKS.length) {
      var lm = LANDMARKS[i];
      flyToLandmark(lm, { duration: 5000 });
      await waitForMoveEnd();
      if (!state.touring || token !== state.tourToken) break;
      // Slow half-turn around the landmark before moving on.
      map.easeTo({ bearing: lm.bearing + 90, duration: 6000, easing: function (t) { return t; } });
      await waitForMoveEnd();
      await wait(400);
    }
  }

  function stopTour() {
    if (!state.touring) return;
    state.touring = false;
    state.tourToken++;
    setPressed('tour', false);
    map.stop();
  }

  $('tour').addEventListener('click', function () {
    if (state.touring) { stopTour(); return; }
    stopOrbit();
    runTour();
  });

  /* ---------- Orbit ---------- */

  var orbitFrame = null;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function orbitStep() {
    if (!state.orbiting) return;
    map.setBearing(map.getBearing() + (reduceMotion ? 0.02 : 0.08));
    orbitFrame = requestAnimationFrame(orbitStep);
  }
  function startOrbit() {
    state.orbiting = true;
    setPressed('orbit', true);
    if (map.getPitch() < 30) map.easeTo({ pitch: PITCH_3D, duration: 800 });
    orbitFrame = requestAnimationFrame(orbitStep);
  }
  function stopOrbit() {
    state.orbiting = false;
    setPressed('orbit', false);
    if (orbitFrame) cancelAnimationFrame(orbitFrame);
    orbitFrame = null;
  }

  $('orbit').addEventListener('click', function () {
    if (state.orbiting) { stopOrbit(); return; }
    stopTour();
    startOrbit();
  });

  // Any hands-on interaction hands control back to the user.
  ['mousedown', 'touchstart', 'wheel'].forEach(function (ev) {
    map.on(ev, function () { stopOrbit(); stopTour(); });
  });

  /* ---------- 2D / 3D ---------- */

  $('flat').addEventListener('click', function () {
    stopOrbit();
    stopTour();
    var flat = map.getPitch() > 5;
    map.easeTo({ pitch: flat ? 0 : PITCH_3D, bearing: flat ? 0 : map.getBearing(), duration: 900 });
  });

  /* ---------- Day / Night ---------- */

  document.querySelectorAll('.seg').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var mode = btn.dataset.style;
      if (mode === state.mode) return;
      state.mode = mode;
      document.querySelectorAll('.seg').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      document.body.classList.toggle('night', mode === 'night');
      drawLegend();
      popup.remove();
      map.setStyle(STYLES[mode], { diff: false });
    });
  });

  /* ---------- Height scale ---------- */

  $('height-scale').addEventListener('input', function (e) {
    state.heightScale = parseFloat(e.target.value);
    $('height-out').textContent = state.heightScale.toFixed(1) + '×';
    refreshBuildingPaint();
  });

  /* ---------- Legend ---------- */

  var LEGEND_MAX = 150;
  function drawLegend() {
    var stops = RAMPS[state.mode].map(function (s) {
      return s[1] + ' ' + (s[0] / LEGEND_MAX * 100) + '%';
    });
    $('ramp').style.background = 'linear-gradient(90deg, ' + stops.join(', ') + ')';
  }
  (function placeLegendLabels() {
    var box = document.querySelector('.ramp-labels');
    box.innerHTML = '';
    box.style.position = 'relative';
    box.style.height = '16px';
    var ticks = [0, 50, 100, 150];
    ticks.forEach(function (v, i) {
      var span = document.createElement('span');
      span.textContent = i === ticks.length - 1 ? v + '+' : String(v);
      span.style.position = 'absolute';
      span.style.left = (v / LEGEND_MAX * 100) + '%';
      span.style.transform = i === 0 ? 'none' : (i === ticks.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)');
      box.appendChild(span);
    });
  })();
  drawLegend();

  /* ---------- Search (OpenStreetMap Nominatim, limited to Phnom Penh) ---------- */

  var results = $('results');

  function showResults(items) {
    results.innerHTML = '';
    if (!items.length) {
      results.innerHTML = '<li class="empty">No match in Phnom Penh. Try another spelling.</li>';
    }
    items.forEach(function (item) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = item.display_name.split(',').slice(0, 3).join(',');
      btn.addEventListener('click', function () {
        stopTour();
        stopOrbit();
        results.hidden = true;
        landmarkButtons.forEach(function (b) { b.classList.remove('active'); });
        map.flyTo({
          center: [parseFloat(item.lon), parseFloat(item.lat)],
          zoom: 17,
          pitch: PITCH_3D,
          bearing: map.getBearing(),
          duration: 3000,
          essential: true
        });
      });
      li.appendChild(btn);
      results.appendChild(li);
    });
    results.hidden = false;
  }

  $('search-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var q = $('search-input').value.trim();
    if (!q) { results.hidden = true; return; }
    var url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=kh' +
      '&viewbox=104.75,11.70,105.05,11.40&bounded=1&accept-language=en&q=' + encodeURIComponent(q);
    results.innerHTML = '<li class="empty">Searching…</li>';
    results.hidden = false;
    fetch(url, { headers: { 'Accept': 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(showResults)
      .catch(function () {
        results.innerHTML = '<li class="empty">Search is not available right now. Check your internet connection and try again.</li>';
      });
  });

  /* ---------- Panel ---------- */

  function setPressed(id, on) { $(id).setAttribute('aria-pressed', String(on)); }

  $('collapse').addEventListener('click', function () {
    var panel = $('panel');
    var collapsed = panel.classList.toggle('collapsed');
    this.setAttribute('aria-expanded', String(!collapsed));
    this.title = collapsed ? 'Show panel' : 'Hide panel';
  });

  // Start with the panel folded on small phones so the city is visible first.
  if (window.innerWidth <= 640) $('collapse').click();
})();
