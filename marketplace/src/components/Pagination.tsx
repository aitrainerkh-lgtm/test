import { Icon } from './Icon';

interface Props { page: number; pages: number; onChange: (page: number) => void; }

export function Pagination({ page, pages, onChange }: Props) {
  if (pages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pagination">
      <button className="btn btn-ghost" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <Icon name="chevronLeft" size={18} />
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <button key={n} className={`btn ${n === page ? 'btn-primary' : 'btn-ghost'}`} onClick={() => onChange(n)} aria-current={n === page ? 'page' : undefined}>
          {n}
        </button>
      ))}
      <button className="btn btn-ghost" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">
        <Icon name="chevronRight" size={18} />
      </button>
    </nav>
  );
}
