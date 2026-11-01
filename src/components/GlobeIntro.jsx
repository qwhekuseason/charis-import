import React, { useEffect, useRef, useState } from 'react';
import { LAND_MASK, PRODUCT_ICONS } from './globeData';
import './GlobeIntro.css';

// The opening scene: a globe whose continents are made of real product photos from the shop,
// a plane flying from supplier countries to Ghana, then a dive into Ghana close enough to see
// the products. Drawn on a canvas so hundreds of photos stay smooth. Shown once per visit;
// "Skip intro" ends it at any time.

const GOLD = '#d4af5a';
const CREAM = '#f3e2b0';
const DEG = Math.PI / 180;
// Each photo is cut twice: small for the globe (cheap to draw hundreds of times a frame)
// and large for the close-up at the end.
const TILE_SMALL = 56;
const TILE_LARGE = 192;

// Where the plane stops, in order. [longitude, latitude]
const STOPS = [
  { name: 'Guangzhou', country: 'China', at: [113.26, 23.13] },
  { name: 'Dubai', country: 'UAE', at: [55.27, 25.2] },
  { name: 'London', country: 'UK', at: [-0.13, 51.51] },
  { name: 'Kumasi', country: 'Ghana', at: [-1.62, 6.69] },
];

// Timeline (ms) — about 5.5 seconds in all
const FADE_IN = 650;
const LEG = 800;
const FLIGHT_END = FADE_IN + LEG * (STOPS.length - 1);
const ZOOM_TIME = 1350; // the dive into Ghana
const ZOOM_TO = 4.6; // how close it gets
const TITLE_AT = FLIGHT_END + 650;
const LEAVE_AT = FLIGHT_END + ZOOM_TIME + 450;
const DONE_AT = LEAVE_AT + 600;
// Each photo fades into its place on the globe as it arrives — nothing waits for them.
const PHOTO_FADE = 450;

const landBits = (() => {
  const bin = atob(LAND_MASK);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
})();
const isLand = (lon, lat) => {
  const x = Math.min(179, Math.max(0, Math.floor((lon + 180) / 2)));
  const y = Math.min(89, Math.max(0, Math.floor((90 - lat) / 2)));
  const i = y * 180 + x;
  return ((landBits[i >> 3] >> (i & 7)) & 1) === 1;
};

const toVec = ([lon, lat]) => [Math.cos(lat * DEG) * Math.cos(lon * DEG), Math.cos(lat * DEG) * Math.sin(lon * DEG), Math.sin(lat * DEG)];
const toLonLat = ([x, y, z]) => [Math.atan2(y, x) / DEG, Math.asin(Math.max(-1, Math.min(1, z))) / DEG];
// Point part-way along the great circle between two places.
const slerp = (a, b, t) => {
  const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(dot);
  if (omega < 1e-6) return a;
  const s = Math.sin(omega);
  const k1 = Math.sin((1 - t) * omega) / s;
  const k2 = Math.sin(t * omega) / s;
  return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2];
};
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t) => Math.max(0, Math.min(1, t));
const shortestLon = (from, to) => from + ((((to - from) % 360) + 540) % 360) - 180;

// Points spread evenly over the sphere; land ones become product tiles, a few sea ones faint dots.
const buildPoints = (count) => {
  const points = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const lat = Math.asin(y) / DEG;
    const lon = ((((i * golden) / DEG) % 360) + 360) % 360 - 180;
    const land = isLand(lon, lat);
    if (!land && i % 5 !== 0) continue;
    points.push({ lon, lat, land, pick: (i * 7919) % 9973, size: 0.85 + ((i * 37) % 10) / 33, phase: (i * 1.7) % 6.28 });
  }
  return points;
};

// A product photo cut into a round tile with a thin gold rim — like a little coin.
const cutTile = (img, px) => {
  const c = document.createElement('canvas');
  c.width = px; c.height = px;
  const g = c.getContext('2d');
  const r = px / 2;
  const rim = Math.max(1.5, px / 32);
  g.save();
  g.beginPath(); g.arc(r, r, r - rim, 0, Math.PI * 2); g.clip();
  g.fillStyle = '#fff'; g.fillRect(0, 0, px, px);
  const scale = Math.max(px / img.naturalWidth, px / img.naturalHeight);
  const w = img.naturalWidth * scale; const h = img.naturalHeight * scale;
  g.drawImage(img, (px - w) / 2, (px - h) / 2, w, h);
  g.restore();
  g.lineWidth = rim * 1.5; g.strokeStyle = GOLD;
  g.beginPath(); g.arc(r, r, r - rim, 0, Math.PI * 2); g.stroke();
  return c;
};
const makePhotoTile = (img) => ({ small: cutTile(img, TILE_SMALL), large: cutTile(img, TILE_LARGE), readyAt: performance.now() });
const loadPhoto = (url) => new Promise((resolve) => {
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => { try { resolve(img.naturalWidth ? makePhotoTile(img) : null); } catch { resolve(null); } };
  img.onerror = () => resolve(null);
  img.src = url;
});

// Fallback tiles (gold outlines) if photos can't load — e.g. offline.
const makeIconTiles = () => PRODUCT_ICONS.map((inner) => {
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`)}`;
  return img;
});

const PLANE = new Path2D('M14 0 L-6 -3.2 L-10 -12 L-14 -12 L-10 -2.6 L-16 -2 L-19 -6 L-21 -6 L-19.5 0 L-21 6 L-19 6 L-16 2 L-10 2.6 L-14 12 L-10 12 L-6 3.2 Z');

export const GlobeIntro = ({ onDone, photos = [] }) => {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState('flying'); // flying → title → leaving
  const doneRef = useRef(false);
  const finish = useRef(() => {});
  // The shop's products may still be arriving when the intro starts — always read the latest list.
  const photosRef = useRef(photos);
  photosRef.current = photos;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const isPhone = window.innerWidth < 640;
    const points = buildPoints(isPhone ? 2400 : 3800);
    const iconTiles = makeIconTiles();
    let cancelled = false;
    // address → tile once loaded; null while loading; false if it failed
    const tilesByUrl = new Map();
    let urls = [];
    const syncPhotos = () => {
      urls = [...new Set(photosRef.current)].slice(0, 36);
      urls.forEach((url) => {
        if (tilesByUrl.has(url)) return;
        tilesByUrl.set(url, null);
        loadPhoto(url).then((tile) => { if (!cancelled) tilesByUrl.set(url, tile || false); });
      });
    };
    // Each spot on the globe keeps one photo, so pictures don't reshuffle as more products arrive;
    // a spot whose photo failed moves on to the next one that works.
    const photoFor = (p) => {
      if (!urls.length) return null;
      if (!p.url || tilesByUrl.get(p.url) === false) {
        for (let k = 0; k < urls.length; k++) {
          const candidate = urls[(p.pick + k) % urls.length];
          if (tilesByUrl.get(candidate) !== false) { p.url = candidate; break; }
        }
      }
      return p.url ? tilesByUrl.get(p.url) : null;
    };
    syncPhotos();
    const photoTimer = setInterval(syncPhotos, 300); // products can arrive a moment after the intro starts
    const stops = STOPS.map((s) => ({ ...s, vec: toVec(s.at) }));
    let width = 0; let height = 0; let dpr = 1;
    const resize = () => {
      // Sharp enough on high-resolution phones without drawing 3x the pixels.
      dpr = Math.min(window.devicePixelRatio || 1, isPhone ? 1.5 : 2);
      width = window.innerWidth; height = window.innerHeight;
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    };
    resize();
    window.addEventListener('resize', resize);

    const cam = { lon: STOPS[0].at[0] + 70, lat: 18 };
    let start = 0; let prev = 0; let raf = 0; let titled = false; let leaving = false;

    const end = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      cancelAnimationFrame(raf);
      onDone();
    };
    finish.current = () => { setPhase('leaving'); setTimeout(end, 450); };

    const frame = (now) => {
      if (!start) start = now;
      const t = now - start;

      // Where the plane is.
      const legFloat = clamp01((t - FADE_IN) / (FLIGHT_END - FADE_IN)) * (stops.length - 1);
      const leg = Math.min(stops.length - 2, Math.floor(legFloat));
      const legT = ease(clamp01(legFloat - leg));
      const [planeLon, planeLat] = toLonLat(slerp(stops[leg].vec, stops[leg + 1].vec, legT));

      // Camera: spins in, follows the plane, then settles right on Kumasi for the dive.
      const diving = t >= FLIGHT_END;
      const targetLon = t < FADE_IN ? STOPS[0].at[0] + 70 * (1 - ease(t / FADE_IN)) : planeLon;
      const targetLat = t < FADE_IN ? 18 : diving ? planeLat : planeLat * 0.65;
      const dt = Math.min(250, prev ? now - prev : 16);
      prev = now;
      // During the dive the camera locks onto Kumasi, so it always lands dead centre.
      const diveLock = ease(clamp01((t - FLIGHT_END) / (ZOOM_TIME * 0.6)));
      const follow = Math.max(1 - Math.pow(0.86, dt / 16.7), diveLock);
      cam.lon += (shortestLon(cam.lon, targetLon) - cam.lon) * follow;
      cam.lat += (targetLat - cam.lat) * follow;

      // Size: grows in, then dives towards Ghana.
      const base = Math.min(width, height) * (isPhone ? 0.4 : 0.34);
      const intro = ease(clamp01(t / FADE_IN));
      const dive = ease(clamp01((t - FLIGHT_END) / ZOOM_TIME));
      const R = base * (0.82 + 0.18 * intro) * (1 + (ZOOM_TO - 1) * dive);
      const cx = width / 2;
      // Ghana sits a little above the middle at the end, leaving room for the name below.
      const cy = height / 2 - (isPhone ? 40 : 10) - dive * height * 0.08;

      const lam0 = cam.lon * DEG; const phi0 = cam.lat * DEG;
      const sinP0 = Math.sin(phi0); const cosP0 = Math.cos(phi0);
      const project = (lon, lat, lift = 1) => {
        const lam = lon * DEG - lam0; const phi = lat * DEG;
        const cosPhi = Math.cos(phi);
        const x = cosPhi * Math.sin(lam);
        const y = cosP0 * Math.sin(phi) - sinP0 * cosPhi * Math.cos(lam);
        const z = sinP0 * Math.sin(phi) + cosP0 * cosPhi * Math.cos(lam);
        return { x: cx + R * lift * x, y: cy - R * lift * y, z };
      };

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = intro;

      // Glow and the dark sphere behind the tiles.
      const glow = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.35);
      glow.addColorStop(0, 'rgba(212,175,90,0.16)');
      glow.addColorStop(1, 'rgba(212,175,90,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.35, 0, Math.PI * 2); ctx.fill();
      const sphere = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      sphere.addColorStop(0, '#2a241a');
      sphere.addColorStop(1, '#0e0c09');
      ctx.fillStyle = sphere;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(212,175,90,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // The products: collect what's visible, draw far ones first so near ones sit on top.
      const tileBase = R * (isPhone ? 0.085 : 0.072);
      const visible = [];
      for (const p of points) {
        const s = project(p.lon, p.lat);
        if (s.z <= 0.02) continue;
        const size = p.land ? tileBase * p.size * (0.45 + 0.55 * s.z) : 1.6;
        if (s.x < -size || s.x > width + size || s.y < -size || s.y > height + size) continue;
        visible.push({ p, s, size });
      }
      visible.sort((a, b) => a.s.z - b.s.z);
      for (const { p, s, size } of visible) {
        if (!p.land) {
          ctx.globalAlpha = intro * s.z * 0.35;
          ctx.fillStyle = GOLD;
          ctx.fillRect(s.x - 0.75, s.y - 0.75, 1.5, 1.5);
          continue;
        }
        const twinkle = dive > 0.3 ? 1 : 0.86 + 0.14 * Math.sin(t * 0.003 + p.phase);
        ctx.globalAlpha = intro * Math.min(1, 0.12 + s.z * 1.1) * twinkle;
        const tile = photoFor(p);
        const shown = tile ? clamp01((now - tile.readyAt) / PHOTO_FADE) : 0;
        if (shown < 1) {
          // A gold dot holds the place until the photo arrives (or an outline if there are no photos at all).
          const icon = urls.length ? null : iconTiles[p.pick % iconTiles.length];
          if (icon && icon.complete && icon.naturalWidth) ctx.drawImage(icon, s.x - size / 2, s.y - size / 2, size, size);
          else { ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(s.x, s.y, Math.max(1, size * 0.18), 0, Math.PI * 2); ctx.fill(); }
        }
        if (shown > 0) {
          if (shown < 1) ctx.globalAlpha *= shown;
          ctx.drawImage(size > TILE_SMALL * 0.9 ? tile.large : tile.small, s.x - size / 2, s.y - size / 2, size, size);
        }
      }
      ctx.globalAlpha = 1;

      if (t > FADE_IN - 100) {
        // Trail along the finished legs and the current one, lifted above the surface.
        const trailFade = 1 - dive;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        for (let l = 0; l <= leg && trailFade > 0.02; l++) {
          const upto = l < leg ? 1 : legT;
          ctx.beginPath();
          let started = false;
          for (let k = 0; k <= 40; k++) {
            const u = (k / 40) * upto;
            const [lon, lat] = toLonLat(slerp(stops[l].vec, stops[l + 1].vec, u));
            const s = project(lon, lat, 1 + 0.08 * Math.sin(Math.PI * (k / 40)));
            if (s.z < -0.05) { started = false; continue; }
            if (!started) { ctx.moveTo(s.x, s.y); started = true; } else ctx.lineTo(s.x, s.y);
          }
          ctx.globalAlpha = trailFade;
          ctx.strokeStyle = l < leg ? 'rgba(243,226,176,0.7)' : CREAM;
          ctx.setLineDash(l < leg ? [3, 6] : []);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        // Stops the plane has reached: a ring that pulses out, and the place name.
        stops.forEach((stop, i) => {
          const reachedAt = FADE_IN + LEG * i;
          if (t < reachedAt - 60) return;
          const last = i === stops.length - 1;
          if (!last && dive > 0.6) return;
          const s = project(stop.at[0], stop.at[1]);
          if (s.z <= 0.05) return;
          const age = (t - reachedAt) / 1000;
          ctx.fillStyle = last ? CREAM : GOLD;
          ctx.beginPath(); ctx.arc(s.x, s.y, last ? 6 : 4, 0, Math.PI * 2); ctx.fill();
          const ring = (age % 1.4) / 1.4;
          ctx.strokeStyle = `rgba(243,226,176,${(1 - ring) * 0.85})`;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(s.x, s.y, 5 + ring * (last ? 46 : 22), 0, Math.PI * 2); ctx.stroke();
          const nextAt = reachedAt + LEG;
          const showing = last || t < nextAt + 200;
          if (!showing) return;
          const alpha = clamp01(age * 4) * (last ? 1 : clamp01((nextAt + 200 - t) / 300));
          ctx.globalAlpha = alpha;
          ctx.font = `600 ${last ? 15 : 12}px Inter, system-ui, sans-serif`;
          ctx.textBaseline = 'middle';
          const label = `${stop.name} · ${stop.country}`;
          const w = ctx.measureText(label).width;
          const lx = s.x + 14; const ly = s.y - 18;
          ctx.fillStyle = 'rgba(14,12,9,0.85)';
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(lx - 8, ly - 12, w + 16, 24, 12); else ctx.rect(lx - 8, ly - 12, w + 16, 24);
          ctx.fill();
          ctx.strokeStyle = 'rgba(212,175,90,0.6)'; ctx.lineWidth = 1; ctx.stroke();
          ctx.fillStyle = last ? CREAM : '#e9e2d4';
          ctx.fillText(label, lx, ly + 0.5);
          ctx.globalAlpha = 1;
        });

        // The plane, pointing along its route.
        if (t < FLIGHT_END + 150) {
          const lift = 1 + 0.08 * Math.sin(Math.PI * legT);
          const here = project(planeLon, planeLat, lift);
          const [aLon, aLat] = toLonLat(slerp(stops[leg].vec, stops[leg + 1].vec, Math.min(1, legT + 0.02)));
          const ahead = project(aLon, aLat, lift);
          const angle = Math.atan2(ahead.y - here.y, ahead.x - here.x);
          ctx.save();
          ctx.translate(here.x, here.y);
          ctx.rotate(Number.isFinite(angle) ? angle : 0);
          const scale = (isPhone ? 0.8 : 1) * (0.8 + 0.2 * here.z);
          ctx.scale(scale, scale);
          ctx.shadowColor = 'rgba(212,175,90,0.95)';
          ctx.shadowBlur = 16;
          ctx.fillStyle = CREAM;
          ctx.fill(PLANE);
          ctx.restore();
        }
      }

      if (!titled && t >= TITLE_AT) { titled = true; setPhase('title'); }
      if (!leaving && t >= LEAVE_AT) { leaving = true; setPhase('leaving'); }
      if (t >= DONE_AT) { end(); return; }
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    const onKey = (e) => { if (e.key === 'Escape') finish.current(); };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelled = true;
      clearInterval(photoTimer);
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKey);
    };
  }, [onDone]);

  return (
    <div className={`gi is-${phase}`} role="dialog" aria-modal="true" aria-label="CHARI intro">
      <canvas ref={canvasRef} className="gi-canvas" aria-hidden="true" />
      <p className="gi-caption" aria-hidden="true">Sourcing from suppliers around the world…</p>
      <div className="gi-title">
        <img src="/chari-mark.jpg" alt="" width="64" height="64" />
        <h2>CHARI</h2>
        <p>Sourced worldwide. <em>Delivered to Ghana.</em></p>
      </div>
      <button type="button" className="gi-skip" onClick={() => finish.current()} autoFocus>
        Skip intro
      </button>
    </div>
  );
};
