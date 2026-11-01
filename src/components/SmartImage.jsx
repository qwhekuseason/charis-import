import React, { useState, useEffect } from 'react';

// An <img> that shows a neutral placeholder instead of a broken-image icon
// when a photo can't load (slow mobile data, a deleted upload, a bad link).
export const SmartImage = ({ src, alt = '', className = '', style, fallbackLabel, ...rest }) => {
  const [failed, setFailed] = useState(!src);
  // A new photo gets a fresh try (e.g. a photo added in the admin editor after it opened empty).
  useEffect(() => { setFailed(!src); }, [src]);

  if (failed) {
    return (
      <div
        className={`img-fallback ${className}`}
        style={style}
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
      >
        {fallbackLabel && <span>{fallbackLabel}</span>}
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} style={style} onError={() => setFailed(true)} {...rest} />;
};
