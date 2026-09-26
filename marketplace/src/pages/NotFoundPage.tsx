import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';

export function NotFoundPage({ title = 'Page not found', text = 'The page you are looking for does not exist or was removed.' }: { title?: string; text?: string }) {
  return (
    <div className="container page">
      <EmptyState icon="flag" title={title} text={text} action={<Link to="/" className="btn btn-primary">Go to home page</Link>} />
    </div>
  );
}
