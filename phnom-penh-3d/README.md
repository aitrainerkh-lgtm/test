# Phnom Penh 3D

A 3D map of Phnom Penh, Cambodia. Every building in the map data is raised to its height, and you can tilt, turn and fly around the city.

## Open it

- **Online:** after this folder is on the default branch, the Pages workflow publishes it at `https://<owner>.github.io/<repo>/phnom-penh-3d/`.
- **On your computer:** open `index.html` in Chrome or Edge. It needs an internet connection for the map tiles.

## What it does

- 3D buildings, coloured by height (low shophouses sandy, towers deep teal).
- 12 landmark buttons that fly the camera to each place.
- City tour (flies landmark to landmark) and Orbit (slow turn around the current spot).
- Day and Night map styles, a 2D / 3D switch, and a building height slider.
- Search for any place in Phnom Penh.
- Click a building to see its height.
- The address bar keeps the camera position, so you can copy the link to share a view.

## Data and limits

- Map data: © OpenStreetMap contributors, served free by OpenFreeMap (no API key needed). Search uses OpenStreetMap Nominatim.
- Building heights come from OpenStreetMap. Where a building has no height mapped, it shows at about 5 m.
- This is not Google Maps. Google's photorealistic 3D city view needs a paid Google Maps Platform API key.
- Landmark camera positions in `app.js` (`LANDMARKS`) are approximate. Edit the coordinates there to fine-tune.

## Files

- `index.html`, `styles.css`, `app.js` — the app.
- `vendor/` — MapLibre GL JS 4.7.1 (BSD-3-Clause), bundled so no CDN is needed.
