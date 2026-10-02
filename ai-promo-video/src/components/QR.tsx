import React, {useMemo} from 'react';
import QRCode from 'qrcode';

/** Renders a real QR code as SVG from any text. */
export const QR: React.FC<{value: string; size: number; color?: string; bg?: string}> = ({
  value,
  size,
  color = '#000',
  bg = '#fff',
}) => {
  const {n, cells} = useMemo(() => {
    const qr = QRCode.create(value, {errorCorrectionLevel: 'M'});
    const count = qr.modules.size;
    const list: [number, number][] = [];
    for (let y = 0; y < count; y++) {
      for (let x = 0; x < count; x++) {
        if (qr.modules.get(x, y)) list.push([x, y]);
      }
    }
    return {n: count, cells: list};
  }, [value]);
  const pad = 2;
  const total = n + pad * 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${total} ${total}`} shapeRendering="crispEdges">
      <rect width={total} height={total} fill={bg} />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x + pad} y={y + pad} width={1.02} height={1.02} fill={color} />
      ))}
    </svg>
  );
};
