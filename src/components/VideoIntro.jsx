import React, { useCallback, useEffect, useRef, useState } from 'react';
import './VideoIntro.css';

// Opening video: the product globe, the flight to Ghana, then the CHARIS IMPORT logo.
// Plays once per visit (the home page decides when). It never holds people up:
//  - "Skip intro" (or Esc) ends it at any time,
//  - if the video can't start within a few seconds (slow data), the shop opens instead,
//  - if the browser blocks autoplay or the file fails, the shop opens straight away.
const START_TIMEOUT_MS = 3500;
const SAFETY_MS = 15000; // never longer than this, whatever happens

export const VideoIntro = ({ onDone }) => {
  const videoRef = useRef(null);
  const doneRef = useRef(false);
  const [leaving, setLeaving] = useState(false);
  const [playing, setPlaying] = useState(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setLeaving(true);
    setTimeout(onDone, 500); // let it fade out
  }, [onDone]);

  useEffect(() => {
    const video = videoRef.current;
    const tooSlow = setTimeout(() => { if (!video || video.paused) finish(); }, START_TIMEOUT_MS);
    const safety = setTimeout(finish, SAFETY_MS);
    const onKey = (e) => { if (e.key === 'Escape') finish(); };
    window.addEventListener('keydown', onKey);
    if (video) {
      video.muted = true; // browsers only autoplay muted video
      const attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') attempt.catch(finish);
    }
    return () => {
      clearTimeout(tooSlow);
      clearTimeout(safety);
      window.removeEventListener('keydown', onKey);
    };
  }, [finish]);

  return (
    <div className={`vi ${leaving ? 'is-leaving' : ''} ${playing ? 'is-playing' : ''}`} role="dialog" aria-modal="true" aria-label="CHARIS IMPORT intro">
      <video
        ref={videoRef}
        className="vi-video"
        src="/intro/chari-intro.mp4"
        poster="/intro/chari-intro-poster.jpg"
        muted
        playsInline
        autoPlay
        preload="auto"
        aria-hidden="true"
        onPlaying={() => setPlaying(true)}
        onEnded={finish}
        onError={finish}
      />
      <button type="button" className="vi-skip" onClick={finish} autoFocus>
        Skip intro
      </button>
    </div>
  );
};
