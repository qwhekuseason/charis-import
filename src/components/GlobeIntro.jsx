import React, { useEffect, useRef, useState } from 'react';
import { LAND_MASK, PRODUCT_ICONS } from './globeData';
import './GlobeIntro.css';

// The opening scene: a globe made of tiny products, and a plane flying from supplier countries to Ghana.
// Drawn on a canvas so hundreds of icons stay smooth. Shown once per visit; "Skip intro" ends it at any time.

const GOLD = '#d4af5a';
const CREAM = '#f3e2b0';
const DEG = Math.PI / 180;

// Where the plane stops, in order. [longitude, latitude]
const STOPS = [
  { name: 'Guangzhou', country: 'China', at: [113.26, 23.13] },
  { name: 'Dubai', country: 'UAE', at: [55.27, 25.2] },
  { name: 'Istanbul', country: 'Türkiye', at: [28.98, 41.01] },
  { name: 'London', country: 'UK', at: [-0.13, 51.51] },
  { name: 'Kumasi', country: 'Ghana', at: [-1.62, 6.69] },
];

// Timeline (ms)
const FADE_IN = 900;
const LEG = 1050;
const FLIGHT_END = FADE_IN + LEG * (STOPS.length - 1);
const TITLE_AT = FLIGHT_END + 250;
const LEAVE_AT = FLIGHT_END + 1900;
const DONE_AT = LEAVE_AT + 750;

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

// Points spread evenly over the sphere; land ones become product icons, a few sea ones become faint dots.
const buildPoints = (count) => {
  const points = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const lat = Math.asin(y) / DEG;
    const lon = ((((i * golden) / DEG) % 360) + 360) % 360 - 180;
    const land = isLand(lon, lat);
    if (!land && i % 5 !== 0) continue;
    points.push({ lon, lat, land, icon: (i * 7) % PRODUCT_ICONS.length, cream: i % 6 === 0, size: 0.8 + ((i * 37) % 10) / 25, phase: (i * 1.7) % 6.28 });
  }
  return points;
};

const makeSprites = (color) => PRODUCT_ICONS.map((inner) => {
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`)}`;
  return img;
});

const PLANE = new Path2D('M14 0 L-6 -3.2 L-10 -12 L-14 -12 L-10 -2.6 L-16 -2 L-19 -6 L-21 -6 L-19.5 0 L-21 6 L-19 6 L-16 2 L-10 2.6 L-14 12 L-10 12 L-6 3.2 Z');

export const GlobeIntro = ({ onDone }) => {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState('flying'); // flying → title → leaving
  const doneRef = useRef(false);
  const finish = useRef(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const isPhone = window.innerWidth < 640;
    const points = buildPoints(isPhone ? 2600 : 4200);
    const sprites = [makeSprites(GOLD), makeSprites(CREAM)];
    const stops = STOPS.map((s) => ({ ...s, vec: toVec(s.at) }));
    let width = 0; let height = 0; let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth; height = window.innerHeight;
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    };
    resize();
    window.addEventListener('resize', resize);

    // Camera starts east of China and turns towards each stop.
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
      const planeVec = slerp(stops[leg].vec, stops[leg + 1].vec, legT);
      const [planeLon, planeLat] = toLonLat(planeVec);

      // Camera follows the plane (gently), and spins in during the fade.
      const targetLon = t < FADE_IN ? STOPS[0].at[0] + 70 * (1 - ease(t / FADE_IN)) : planeLon;
      const targetLat = t < FADE_IN ? 18 : planeLat * 0.65;
      // Time-based easing, so the camera keeps up the same on slow phones (fewer frames) and fast screens.
      const dt = Math.min(250, prev ? now - prev : 16);
      prev = now;
      const follow = 1 - Math.pow(0.86, dt / 16.7);
      cam.lon += (shortestLon(cam.lon, targetLon) - cam.lon) * follow; // turn the short way round
      cam.lat += (targetLat - cam.lat) * follow;

      // Size: the globe grows in, then leans in on Ghana at the end.
      const base = Math.min(width, height) * (isPhone ? 0.4 : 0.34);
      const intro = ease(clamp01(t / FADE_IN));
      const zoom = 1 + 0.35 * ease(clamp01((t - FLIGHT_END) / 1200));
      const R = base * (0.82 + 0.18 * intro) * zoom;
      const cx = width / 2;
      const cy = height / 2 - (isPhone ? 40 : 10);

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

      // Glow and the dark sphere behind the icons.
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

      // The products.
      const iconSize = R * (isPhone ? 0.072 : 0.062);
      for (const p of points) {
        const s = project(p.lon, p.lat);
        if (s.z <= 0.02) continue;
        const twinkle = 0.82 + 0.18 * Math.sin(t * 0.003 + p.phase);
        if (!p.land) {
          ctx.globalAlpha = intro * s.z * 0.35;
          ctx.fillStyle = GOLD;
          ctx.fillRect(s.x - 0.75, s.y - 0.75, 1.5, 1.5);
          continue;
        }
        const size = iconSize * p.size * (0.45 + 0.55 * s.z);
        ctx.globalAlpha = intro * Math.min(1, 0.15 + s.z) * twinkle;
        const sprite = sprites[p.cream ? 1 : 0][p.icon];
        if (sprite.complete && sprite.naturalWidth) ctx.drawImage(sprite, s.x - size / 2, s.y - size / 2, size, size);
        else { ctx.fillStyle = GOLD; ctx.fillRect(s.x - 1, s.y - 1, 2, 2); }
      }
      ctx.globalAlpha = 1;

      if (t > FADE_IN - 100) {
        // Trail along the finished legs and the current one, lifted above the surface.
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (let l = 0; l <= leg; l++) {
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
          ctx.strokeStyle = l < leg ? 'rgba(212,175,90,0.55)' : GOLD;
          ctx.setLineDash(l < leg ? [3, 6] : []);
          ctx.stroke();
        }
        ctx.setLineDash([]);

        // Stops the plane has reached: a ring that pulses out, and the place name.
        stops.forEach((stop, i) => {
          const reachedAt = FADE_IN + LEG * i;
          if (t < reachedAt - 60) return;
          const s = project(stop.at[0], stop.at[1]);
          if (s.z <= 0.05) return;
          const age = (t - reachedAt) / 1000;
          const last = i === stops.length - 1;
          ctx.fillStyle = last ? CREAM : GOLD;
          ctx.beginPath(); ctx.arc(s.x, s.y, last ? 5 : 3.5, 0, Math.PI * 2); ctx.fill();
          const ring = (age % 1.4) / 1.4;
          ctx.strokeStyle = `rgba(243,226,176,${(1 - ring) * 0.8})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(s.x, s.y, 4 + ring * (last ? 34 : 20), 0, Math.PI * 2); ctx.stroke();
          // Name shows while it's the latest stop (Ghana stays).
          const nextAt = reachedAt + LEG;
          const showing = last || t < nextAt + 200;
          if (!showing) return;
          const alpha = clamp01(age * 4) * (last ? 1 : clamp01((nextAt + 200 - t) / 300));
          ctx.globalAlpha = alpha;
          ctx.font = `600 ${last ? 15 : 12}px Inter, system-ui, sans-serif`;
          ctx.textBaseline = 'middle';
          const label = `${stop.name} · ${stop.country}`;
          const w = ctx.measureText(label).width;
          const lx = s.x + 12; const ly = s.y - 16;
          ctx.fillStyle = 'rgba(14,12,9,0.78)';
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(lx - 7, ly - 11, w + 14, 22, 11); else ctx.rect(lx - 7, ly - 11, w + 14, 22);
          ctx.fill();
          ctx.strokeStyle = 'rgba(212,175,90,0.5)'; ctx.lineWidth = 1; ctx.stroke();
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
          const scale = (isPhone ? 0.75 : 0.95) * (0.8 + 0.2 * here.z);
          ctx.scale(scale, scale);
          ctx.shadowColor = 'rgba(212,175,90,0.9)';
          ctx.shadowBlur = 14;
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
