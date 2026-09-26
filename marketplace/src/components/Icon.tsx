import { ICONS } from './icons';

interface Props {
  name: string;
  size?: number;
  className?: string;
  filled?: boolean;
  title?: string;
}

export function Icon({ name, size = 20, className, filled, title }: Props) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      aria-label={title}
      dangerouslySetInnerHTML={{ __html: ICONS[name] ?? ICONS.image }}
    />
  );
}
