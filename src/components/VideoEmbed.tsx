import { parseVideoUrl } from '../lib/video';

/** Responsive, privacy-friendly video embed (E5).
 *
 *  Parses the record's URL → YouTube (no-cookie) or Vimeo and renders a
 *  lazy-loaded 16:9 iframe. Video is never self-hosted: this is just the
 *  platform's own player. If the URL isn't a recognised provider we render the
 *  `fallback` (a plain "Watch the video" out-link) instead.
 *
 *  Accessibility (WCAG 2.2 AA): the iframe carries a descriptive `title`, the
 *  player is keyboard-operable, nothing autoplays, and we surface a captions /
 *  transcript note (1.2.2 captions + 1.2.3 audio description / transcript). */
export function VideoEmbed({
  url,
  title,
  fallback = null,
}: {
  url: string | undefined | null;
  title: string;
  fallback?: React.ReactNode;
}) {
  const parsed = parseVideoUrl(url);
  if (!parsed) return <>{fallback}</>;

  const providerName = parsed.provider === 'youtube' ? 'YouTube' : 'Vimeo';

  return (
    <div className="video-embed">
      <div className="video-embed__frame">
        <iframe
          src={parsed.embedUrl}
          title={`${title} — video`}
          loading="lazy"
          frameBorder={0}
          allow="encrypted-media; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <p className="video-embed__note">
        Plays on {providerName}. Turn on captions in the player; if you need a
        transcript, <a className="relative-link" href="/#/about">get in touch</a> and
        we’ll provide one.
      </p>
    </div>
  );
}
