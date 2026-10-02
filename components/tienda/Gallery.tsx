'use client';

import { useState } from 'react';
import { tnImgClient } from './img';

export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  if (!images.length) return <div className="aspect-[3/4] w-full rounded-[var(--t-radius)] bg-gray-100" />;
  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row">
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto lg:max-h-[640px] lg:w-20 lg:flex-col lg:overflow-y-auto">
          {images.slice(0, 10).map((src, k) => (
            <button key={src} type="button" onClick={() => setI(k)} aria-label={`Ver foto ${k + 1}`}
              className={`shrink-0 overflow-hidden rounded-[var(--t-radius)] border ${k === i ? 'border-gray-900' : 'border-transparent opacity-70'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tnImgClient(src, 240)} alt="" className="h-20 w-16 object-cover lg:h-24 lg:w-20" />
            </button>
          ))}
        </div>
      )}
      <div className="flex-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={tnImgClient(images[i], 1024)} alt={alt} className="aspect-[3/4] w-full rounded-[var(--t-radius)] bg-gray-50 object-cover" />
      </div>
    </div>
  );
}
