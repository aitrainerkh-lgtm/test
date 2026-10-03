"""Build src/mapData.json for the Phnom Penh map video.

Inputs (in DATA_DIR):
  water.parquet, segments.parquet, divisions.parquet  - from fetch_overture.py
  geoBoundaries-KHM-ADM1.geojson                        - geoBoundaries (provinces, country view)
  ne_10m_rivers_lake_centerlines.geojson, ne_10m_lakes.geojson - Natural Earth (country view)

All geometry is projected to Web Mercator "world pixels" centred on CENTER,
where 0.4 degrees of longitude = 1920 px (the city frame).
"""
import json, math, os, sys
import pyarrow.parquet as pq
import shapely
from shapely.geometry import box, shape
from shapely.ops import nearest_points, transform

DATA_DIR = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'mapData.json')
CENTER = (104.905, 11.565)
K = 1920 / 0.4  # px per degree of longitude
CITY_BBOX = box(104.70, 11.38, 105.10, 11.75)


def merc(lat):
    return math.degrees(math.log(math.tan(math.pi / 4 + math.radians(lat) / 2)))


Y0 = merc(CENTER[1])


def proj(x, y, z=None):
    if hasattr(x, '__len__'):
        return [proj(a, b) for a, b in zip(x, y)]
    return ((x - CENTER[0]) * K, -(merc(y) - Y0) * K)


def P(lon, lat):
    x, y = proj(lon, lat)
    return [round(x, 1), round(y, 1)]


def to_path(geom, tol):
    """Projected shapely geometry -> compact SVG path string."""
    g = shapely.simplify(geom, tol, preserve_topology=False)
    out = []

    def line(coords, close=False):
        pts = [(round(x, 1), round(y, 1)) for x, y in coords]
        if len(pts) < 2:
            return
        s = 'M%g %g' % pts[0] + ''.join('L%g %g' % p for p in pts[1:])
        out.append(s + ('Z' if close else ''))

    def walk(g):
        t = g.geom_type
        if t == 'LineString':
            line(g.coords)
        elif t == 'Polygon':
            line(g.exterior.coords, True)
            for r in g.interiors:
                line(r.coords, True)
        elif t in ('MultiLineString', 'MultiPolygon', 'GeometryCollection'):
            for p in g.geoms:
                walk(p)

    walk(g)
    return ''.join(out)


def projg(g):
    return transform(lambda x, y, z=None: tuple(zip(*[proj(a, b) for a, b in zip(x, y)])), g)


# ---------- City: water ----------
w = pq.read_table(f'{DATA_DIR}/water.parquet')
water_polys, water_lines = [], []
for sub, geom in zip(w['subtype'].to_pylist(), w['geometry'].to_pylist()):
    g = shapely.from_wkb(geom)
    if not g.intersects(CITY_BBOX):
        continue
    g = g.intersection(CITY_BBOX)
    if g.is_empty:
        continue
    if g.geom_type in ('Polygon', 'MultiPolygon'):
        if g.area > 2e-7:
            water_polys.append(g)
    elif sub in ('river', 'canal', 'stream'):
        water_lines.append(g)
water_area = shapely.union_all(water_polys)
water_path = to_path(projg(water_area), 0.6)
water_lines_path = to_path(projg(shapely.union_all(water_lines)), 0.8)

# ---------- City: roads ----------
s = pq.read_table(f'{DATA_DIR}/segments.parquet', columns=['subtype', 'class', 'geometry'])
tiers = {
    'major': {'motorway', 'trunk', 'primary'},
    'secondary': {'secondary'},
    'tertiary': {'tertiary'},
    'minor': {'residential', 'unclassified', 'living_street'},
}
buckets = {k: [] for k in tiers}
rail = []
for sub, cls, geom in zip(s['subtype'].to_pylist(), s['class'].to_pylist(), s['geometry'].to_pylist()):
    if sub == 'rail':
        rail.append(shapely.from_wkb(geom))
        continue
    for k, classes in tiers.items():
        if cls in classes:
            buckets[k].append(shapely.from_wkb(geom))
            break
roads = {}
for k, geoms in buckets.items():
    g = shapely.GeometryCollection(geoms).intersection(CITY_BBOX)
    roads[k] = to_path(projg(g), 0.5 if k == 'minor' else 0.35)
rail_path = to_path(projg(shapely.GeometryCollection(rail).intersection(CITY_BBOX)), 0.5)

# ---------- City boundary (OSM-based, from Overture divisions) ----------
d = pq.read_table(f'{DATA_DIR}/divisions.parquet')
pp = None
for row, geom in zip(d.select(['subtype', 'names']).to_pylist(), d['geometry'].to_pylist()):
    if row['subtype'] == 'region' and (row['names'] or {}).get('primary') == 'រាជធានីភ្នំពេញ':
        pp = shapely.from_wkb(geom)
assert pp is not None, 'Phnom Penh boundary not found'
pp_proj = projg(pp)
pp_path = to_path(pp_proj, 0.4)
pp_len = pp_proj.boundary.length if pp_proj.geom_type == 'Polygon' else sum(p.exterior.length for p in pp_proj.geoms)

# ---------- Country view ----------
adm1 = json.load(open(f'{DATA_DIR}/geoBoundaries-KHM-ADM1.geojson'))
provinces = [to_path(projg(shape(f['geometry'])), 6) for f in adm1['features']]
country = shapely.union_all([shape(f['geometry']).buffer(0.002) for f in adm1['features']])
country_proj = projg(country)
country_path = to_path(country_proj, 5)
country_len = sum(p.exterior.length for p in getattr(country_proj, 'geoms', [country_proj]))

region = box(102.0, 9.5, 108.2, 15.2)
ne_rivers = []
for f in json.load(open(f'{DATA_DIR}/ne_10m_rivers_lake_centerlines.geojson'))['features']:
    g = shape(f['geometry'])
    if g.intersects(region) and f['properties'].get('name') in ('Mekong', 'Tonle Sap', 'Bassac'):
        ne_rivers.append(g.intersection(region))
country_rivers = to_path(projg(shapely.union_all(ne_rivers)), 4)
lakes = []
for f in json.load(open(f'{DATA_DIR}/ne_10m_lakes.geojson'))['features']:
    g = shape(f['geometry'])
    if g.intersects(region):
        lakes.append(g.intersection(region))
country_lakes = to_path(projg(shapely.union_all(lakes)), 4) if lakes else ''

# ---------- Points ----------
landmarks = [
    {'en': 'Royal Palace', 'km': 'ព្រះបរមរាជវាំង', 'p': P(104.9310, 11.5639), 'side': 'right'},
    {'en': 'Wat Phnom', 'km': 'វត្តភ្នំ', 'p': P(104.9235, 11.5761), 'side': 'left'},
    {'en': 'Central Market', 'km': 'ផ្សារធំថ្មី', 'p': P(104.9210, 11.5694), 'side': 'left'},
    {'en': 'Independence Monument', 'km': 'វិមានឯករាជ្យ', 'p': P(104.9282, 11.5563), 'side': 'left'},
    {'en': 'Tuol Sleng Genocide Museum', 'km': 'សារមន្ទីរទួលស្លែង', 'p': P(104.9177, 11.5492), 'side': 'left'},
    {'en': 'Koh Pich', 'km': 'កោះពេជ្រ', 'p': P(104.9400, 11.5500), 'side': 'right'},
]


def label_point(name_km, near):
    """Point inside the named river polygon closest to `near` (lon, lat)."""
    target = shapely.Point(near)
    best = None
    for n, geom in zip(w['names'].to_pylist(), w['geometry'].to_pylist()):
        if (n or {}).get('primary') != name_km:
            continue
        g = shapely.from_wkb(geom).intersection(CITY_BBOX)
        if g.is_empty:
            continue
        pt = nearest_points(g.buffer(-0.0015) if not g.buffer(-0.0015).is_empty else g, target)[0]
        if best is None or pt.distance(target) < best.distance(target):
            best = pt
    return P(best.x, best.y)


RIVER_NAMES = {
    'Mekong': ('ទន្លេមេគង្គ', 'ទន្លេ មេគង្គ'),
    'Tonle Sap': ('ទន្លេសាប', 'ទន្លេ សាប'),
    'Bassac': ('ទន្លេបាសាក់', 'ទន្លេ បាសាក់'),
}


def river_labels(targets):
    return [{'en': en, 'km': RIVER_NAMES[en][0], 'p': label_point(RIVER_NAMES[en][1], t)} for en, t in targets]


rivers_overview = river_labels([('Mekong', (104.995, 11.53)), ('Tonle Sap', (104.875, 11.665)), ('Bassac', (104.955, 11.47))])
rivers_close = river_labels([('Mekong', (104.955, 11.582)), ('Tonle Sap', (104.926, 11.588)), ('Bassac', (104.950, 11.543))])

data = {
    'k': K,
    'cityBounds': [P(104.70, 11.75), P(105.10, 11.38)],
    'water': water_path,
    'waterLines': water_lines_path,
    'roads': roads,
    'rail': rail_path,
    'phnomPenh': pp_path,
    'phnomPenhLength': round(pp_len),
    'phnomPenhCentroid': [round(v, 1) for v in pp_proj.centroid.coords[0]],
    'country': country_path,
    'countryLength': round(country_len),
    'provinces': provinces,
    'countryRivers': country_rivers,
    'countryLakes': country_lakes,
    'chaktomuk': P(104.9345, 11.5700),
    'landmarks': landmarks,
    'riversOverview': rivers_overview,
    'riversClose': rivers_close,
    'center': CENTER,
}
json.dump(data, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('wrote', OUT, os.path.getsize(OUT) // 1024, 'KB')
for k, v in roads.items():
    print(' roads', k, len(v) // 1024, 'KB')
print(' water', len(water_path) // 1024, 'KB', 'labels', [r['p'] for r in rivers_overview + rivers_close])
