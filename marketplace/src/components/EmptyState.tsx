import type { ReactNode } from 'react';
import { Icon } from './Icon';

interface Props { icon?: string; title: string; text?: string; action?: ReactNode; }

export function EmptyState({ icon = 'search', title, text, action }: Props) {
  return (
    <div className="empty">
      <span className="empty-icon"><Icon name={icon} size={32} /></span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}
