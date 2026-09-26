interface Props { name: string; color: string; size?: number; }

/** Initials avatar. Replace with a profile photo when available. */
export function Avatar({ name, color, size = 48 }: Props) {
  const initials = name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span className="avatar" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }} aria-hidden="true">
      {initials}
    </span>
  );
}
