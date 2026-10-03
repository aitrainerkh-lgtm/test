"""Download Overture Maps features (OpenStreetMap-derived, ODbL) inside a bbox.
Reads only the parquet row groups whose bbox statistics overlap the area."""
import sys, s3fs, pyarrow.parquet as pq, pyarrow as pa, pyarrow.compute as pc
RELEASE = '2026-09-23.1'
BBOX = (104.70, 11.38, 105.10, 11.75)  # xmin, ymin, xmax, ymax
theme, typ, out = sys.argv[1], sys.argv[2], sys.argv[3]
fs = s3fs.S3FileSystem(anon=True, client_kwargs={'region_name': 'us-west-2'})
files = fs.ls(f'overturemaps-us-west-2/release/{RELEASE}/theme={theme}/type={typ}/')
tables = []
for path in files:
    with fs.open(path, 'rb', block_size=2**20) as fh:
        pf = pq.ParquetFile(fh)
        md = pf.metadata
        names = [md.schema.column(i).path for i in range(md.num_columns)]
        ix = {k: names.index(f'bbox.{k}') for k in ('xmin', 'xmax', 'ymin', 'ymax')}
        keep = []
        for g in range(md.num_row_groups):
            s = {k: md.row_group(g).column(i).statistics for k, i in ix.items()}
            if s['xmin'].min < BBOX[2] and s['xmax'].max > BBOX[0] and s['ymin'].min < BBOX[3] and s['ymax'].max > BBOX[1]:
                keep.append(g)
        if not keep: continue
        cols = [c for c in ('id', 'subtype', 'class', 'names', 'geometry', 'bbox', 'admin_level', 'categories') if c in pf.schema_arrow.names]
        t = pf.read_row_groups(keep, columns=cols)
        b = t['bbox']
        m = pc.and_(pc.and_(pc.less(pc.struct_field(b, 'xmin'), BBOX[2]), pc.greater(pc.struct_field(b, 'xmax'), BBOX[0])),
                    pc.and_(pc.less(pc.struct_field(b, 'ymin'), BBOX[3]), pc.greater(pc.struct_field(b, 'ymax'), BBOX[1])))
        t = t.filter(m)
        print(path.split('/')[-1], len(keep), 'row groups ->', t.num_rows, flush=True)
        if t.num_rows: tables.append(t)
pq.write_table(pa.concat_tables(tables), out)
