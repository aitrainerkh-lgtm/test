# Phnom Penh Map — Motion Video

A 23-second animated map of Phnom Penh (1920×1080, 30 fps), built with [Remotion](https://www.remotion.dev/).

- **Video:** `phnom-penh-map.mp4`
- **Preview frame:** `preview.png`

## Storyboard

| Time | Scene |
|---|---|
| 0–4 s | Cambodia outline draws in, provinces and the Mekong / Tonle Sap appear, Phnom Penh pulses |
| 4–8 s | Camera flies into Phnom Penh; rivers and the city boundary draw in |
| 7–12 s | Road network reveals from the centre; title card in Khmer and English; legend |
| 12–20 s | Close-up of the city centre: Royal Palace, Wat Phnom, Central Market, Independence Monument, Tuol Sleng Genocide Museum, Koh Pich, plus the Tonle Sap, Mekong, Bassac and Chaktomuk |
| 20–23 s | Pull back to the full city; end card with "AI For Business" |

Fonts: Moul (Khmer headings), Battambang (Khmer body), Inter (Latin) — all in `public/fonts`.

## Map data

| Layer | Source | Licence |
|---|---|---|
| Roads, rivers, lakes, Phnom Penh boundary | OpenStreetMap via Overture Maps (release 2026-09-23.1) | ODbL — © OpenStreetMap contributors |
| Province outlines (country view) | geoBoundaries KHM ADM1 | CC BY 4.0 |
| Country-view rivers and Tonle Sap lake | Natural Earth 10m | Public domain |

## Rebuild

```bash
npm install
# 1. Download source data into a folder (DATA_DIR)
python3 scripts/fetch_overture.py base water DATA_DIR/water.parquet
python3 scripts/fetch_overture.py transportation segment DATA_DIR/segments.parquet
python3 scripts/fetch_overture.py divisions division_area DATA_DIR/divisions.parquet
#    plus geoBoundaries-KHM-ADM1.geojson, ne_10m_rivers_lake_centerlines.geojson, ne_10m_lakes.geojson
# 2. Build src/mapData.json
python3 scripts/build_map_data.py DATA_DIR
# 3. Preview or render
npm run studio
npm run render
```

Python packages: `pyarrow s3fs shapely`.
