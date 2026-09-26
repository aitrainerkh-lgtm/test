import { useEffect, useState } from 'react';
import { imageCaption, listingImage } from '../lib/images';
import type { Listing } from '../types';
import { Icon } from './Icon';

export function Gallery({ listing }: { listing: Listing }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const count = Math.max(1, listing.images.length);
  const go = (d: number) => setIndex((i) => (i + d + count) % count);

  useEffect(() => setIndex(0), [listing.id]);
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoom(false);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const main = (
    <div className="gallery-main">
      <img src={listingImage(listing, index)} alt={`${listing.title} — ${imageCaption(listing.images[index])}`} onClick={() => setZoom(true)} />
      {count > 1 && (
        <>
          <button className="gallery-nav prev" onClick={() => go(-1)} aria-label="Previous photo"><Icon name="chevronLeft" /></button>
          <button className="gallery-nav next" onClick={() => go(1)} aria-label="Next photo"><Icon name="chevronRight" /></button>
        </>
      )}
      <span className="gallery-count">{index + 1} / {count}</span>
    </div>
  );

  return (
    <div className="gallery">
      {main}
      {count > 1 && (
        <div className="gallery-thumbs">
          {listing.images.map((token, i) => (
            <button key={i} className={i === index ? 'active' : ''} onClick={() => setIndex(i)} aria-label={`Photo ${i + 1}`}>
              <img src={listingImage(listing, i)} alt={imageCaption(token)} loading="lazy" />
            </button>
          ))}
        </div>
      )}
      {zoom && (
        <div className="lightbox" onClick={() => setZoom(false)} role="dialog" aria-label="Photo viewer">
          <img src={listingImage(listing, index)} alt={imageCaption(listing.images[index])} onClick={(e) => e.stopPropagation()} />
          <button className="lightbox-close" aria-label="Close"><Icon name="x" size={28} /></button>
          {count > 1 && (
            <>
              <button className="gallery-nav prev" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous photo"><Icon name="chevronLeft" /></button>
              <button className="gallery-nav next" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next photo"><Icon name="chevronRight" /></button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
