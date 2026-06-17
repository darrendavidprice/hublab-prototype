import { useEffect, useRef, useState } from 'react';
import { useMotion } from '../a11y/MotionContext';

interface VideoHeroProps {
  videoSrc: string;
  posterSrc: string;
  children: React.ReactNode;   // the overlaid headline / actions (the real content)
}

/** Brand video hero.
 *  - The montage is decorative and silent, so the <video> is aria-hidden and
 *    the headline children carry the page's actual heading and content.
 *  - Honours reduced motion: when motion is reduced we never autoplay; the
 *    poster image stands in and a clearly-labelled control lets the visitor
 *    start it themselves. When motion is on it autoplays muted and loops, and
 *    the same control can pause it. (WCAG 2.2 — motion is user-controllable.) */
export function VideoHero({ videoSrc, posterSrc, children }: VideoHeroProps) {
  const { reduced } = useMotion();
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(!reduced);

  // Keep playback in step with the motion preference if it changes live.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (reduced) { v.pause(); setPlaying(false); }
    else { v.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
  }, [reduced]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { v.play().then(() => setPlaying(true)).catch(() => {}); }
    else { v.pause(); setPlaying(false); }
  };

  return (
    <section className="hero" aria-label="Welcome to HubLab" data-lab="hublab">
      <div className="hero__media" aria-hidden="true">
        <video
          ref={ref}
          src={videoSrc}
          poster={posterSrc}
          muted
          loop
          playsInline
          autoPlay={!reduced}
          tabIndex={-1}
        />
      </div>
      <div className="hero__scrim" aria-hidden="true" />
      <div className="container hero__inner">{children}</div>
      <button type="button" className="hero__motionbtn" onClick={toggle}>
        {playing ? '⏸ Pause background video' : '▶ Play background video'}
      </button>
    </section>
  );
}
