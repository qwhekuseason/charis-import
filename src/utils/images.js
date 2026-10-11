// Ask the image host for a copy close to the size it's displayed at, instead of the
// full-size original — product cards are ~250px wide but were downloading 800px photos.
export const sizedImage = (url, width) => {
  if (!url || typeof url !== 'string') return url;

  if (url.includes('images.unsplash.com')) {
    const u = new URL(url);
    u.searchParams.set('w', String(width));
    u.searchParams.set('q', '70');
    u.searchParams.set('auto', 'format');
    return u.toString();
  }

  if (url.includes('images.pexels.com')) {
    const u = new URL(url);
    u.searchParams.set('w', String(width));
    u.searchParams.set('auto', 'compress');
    u.searchParams.set('cs', 'tinysrgb');
    return u.toString();
  }

  if (url.includes('res.cloudinary.com')) {
    return /\bw_\d+/.test(url)
      ? url.replace(/\bw_\d+/, `w_${width}`)
      : url.replace('/upload/', `/upload/c_limit,f_auto,q_auto,w_${width}/`);
  }

  return url; // local /uploads files and anything else: leave as-is
};

// srcset string so phones and high-density screens each pick the right size.
export const imageSrcSet = (url, widths) => {
  const sized = widths.map((w) => [sizedImage(url, w), w]);
  return sized.some(([u]) => u !== url) ? sized.map(([u, w]) => `${u} ${w}w`).join(', ') : undefined;
};
