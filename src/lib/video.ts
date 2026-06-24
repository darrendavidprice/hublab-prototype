// lib/video.ts — turn a pasted "watch" URL into an embeddable player (E5).
//
// Decision (locked): video is NEVER self-hosted. A record stores a URL; the page
// embeds the platform's own player (just an iframe, so it works on GitHub Pages
// today). Unlisted YouTube is the primary route; Vimeo works through the same
// component. Anything we don't recognise falls back to a plain "Watch" out-link.
//
// We only parse — we never fetch anything here. The component decides how to
// render. For YouTube we use the privacy-friendly youtube-nocookie.com domain so
// no tracking cookies are set until the viewer actually plays.

export type VideoProvider = 'youtube' | 'vimeo';

export interface ParsedVideo {
  provider: VideoProvider;
  /** The platform's video id (YouTube 11-char id, or Vimeo numeric id). */
  id: string;
  /** The privacy-friendly iframe src for this video. */
  embedUrl: string;
}

/** YouTube ids are 11 chars of [A-Za-z0-9_-]. */
const YT_ID = /^[A-Za-z0-9_-]{11}$/;

/** Build the YouTube embed URL on the no-cookie domain. */
function youtubeEmbed(id: string): string {
  // rel=0 keeps "related" videos limited to the same channel; modestbranding is
  // ignored by modern YouTube but harmless. No autoplay (accessibility).
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
}

/** Build the Vimeo embed URL. dnt=1 asks Vimeo not to track the session. */
function vimeoEmbed(id: string): string {
  return `https://player.vimeo.com/video/${id}?dnt=1`;
}

/**
 * Parse a YouTube or Vimeo URL into { provider, id, embedUrl }.
 * Returns null for anything we don't recognise (caller falls back to an out-link).
 *
 * Recognised YouTube shapes:
 *   https://www.youtube.com/watch?v=ID   (with any extra params)
 *   https://youtube.com/watch?v=ID
 *   https://youtu.be/ID
 *   https://www.youtube.com/embed/ID
 *   https://www.youtube.com/shorts/ID
 *   https://www.youtube-nocookie.com/embed/ID
 *   (with or without scheme; m. and other subdomains tolerated)
 *
 * Recognised Vimeo shapes:
 *   https://vimeo.com/123456789
 *   https://vimeo.com/channels/<name>/123456789
 *   https://vimeo.com/123456789/abcdef0123   (unlisted hash — id is the number)
 *   https://player.vimeo.com/video/123456789
 */
export function parseVideoUrl(raw: string | undefined | null): ParsedVideo | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Be forgiving about a missing scheme so a pasted "youtu.be/…" still parses.
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const segments = url.pathname.split('/').filter(Boolean);

  // ---- YouTube ----
  if (host === 'youtu.be') {
    const id = segments[0];
    if (id && YT_ID.test(id)) return { provider: 'youtube', id, embedUrl: youtubeEmbed(id) };
    return null;
  }
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    // watch?v=ID
    const v = url.searchParams.get('v');
    if (v && YT_ID.test(v)) return { provider: 'youtube', id: v, embedUrl: youtubeEmbed(v) };
    // /embed/ID, /shorts/ID, /v/ID, /live/ID
    if (['embed', 'shorts', 'v', 'live'].includes(segments[0]) && segments[1] && YT_ID.test(segments[1])) {
      return { provider: 'youtube', id: segments[1], embedUrl: youtubeEmbed(segments[1]) };
    }
    return null;
  }

  // ---- Vimeo ----
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    // The numeric id is the first all-digits path segment (handles /channels/x/ID,
    // /video/ID, /ID/hash). The optional second segment on vimeo.com/ID/HASH is the
    // unlisted privacy hash, which the standard player embed doesn't require.
    const id = segments.find(s => /^\d+$/.test(s));
    if (id) return { provider: 'vimeo', id, embedUrl: vimeoEmbed(id) };
    return null;
  }

  return null;
}

/** Convenience: is this URL an embeddable video we recognise? */
export function isEmbeddableVideo(raw: string | undefined | null): boolean {
  return parseVideoUrl(raw) !== null;
}
