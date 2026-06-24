import { Link } from 'react-router-dom';
import type { HubRecord } from '../data/types';
import { VideoEmbed } from './VideoEmbed';
import { parseVideoUrl } from '../lib/video';

/** A small "see what was submitted" panel for the admin screens (queue + tables).
 *  Shows the uploaded thumbnail (and whether it has alt text), the summary/body,
 *  and one-click access to the actual content — a file download, the video, an
 *  external link, a research paper, or a booking page — so a moderator can review
 *  a submission without leaving the admin or guessing what's attached. */
export function RecordPreview({ record: r }: { record: HubRecord }) {
  const video = parseVideoUrl(r.resource?.externalUrl);
  const isVideoType = r.type === 'video';
  // An external link worth surfacing as a generic out-link (not a video, since
  // that gets its own embed/watch treatment).
  const plainExternal = r.resource?.externalUrl && !video ? r.resource.externalUrl : undefined;

  return (
    <div className="recprev">
      <div className="recprev__grid">
        <div className="recprev__thumb">
          {r.promoImage
            ? <img src={r.promoImage} alt={r.promoImageAlt ?? ''} />
            : <span className="recprev__noimg">No thumbnail</span>}
        </div>
        <div className="recprev__body">
          <p className="recprev__imgmeta atable__meta">
            {r.promoImage
              ? (r.promoImageAlt ? `Image description: “${r.promoImageAlt}”` : '⚠ Image has no description (alt text)')
              : 'No thumbnail uploaded'}
          </p>
          {r.summary && <p className="recprev__summary">{r.summary}</p>}
          {r.body && <p className="recprev__bodytext atable__meta">{r.body.length > 280 ? `${r.body.slice(0, 280)}…` : r.body}</p>}
        </div>
      </div>

      <div className="recprev__access">
        <span className="atable__meta">Submitted content:</span>
        <Link className="abtn" to={`/record/${r.id}`}>Open record page</Link>

        {r.resource?.fileUrl && (
          <a className="abtn" href={r.resource.fileUrl} download={r.resource.fileName ?? ''}>
            Download file{r.resource.fileLabel ? ` (${r.resource.fileLabel})` : ''}
          </a>
        )}

        {video && (
          <a className="abtn" href={r.resource!.externalUrl!} target="_blank" rel="noopener noreferrer">
            Watch on {video.provider === 'youtube' ? 'YouTube' : 'Vimeo'} ↗<span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
        {isVideoType && !video && r.resource?.externalUrl && (
          <a className="abtn" href={r.resource.externalUrl} target="_blank" rel="noopener noreferrer">
            Watch the video ↗<span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}

        {plainExternal && (
          <a className="abtn" href={plainExternal} target="_blank" rel="noopener noreferrer">
            Open link ↗<span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
        {r.research?.paperUrl && (
          <a className="abtn" href={r.research.paperUrl} target="_blank" rel="noopener noreferrer">
            Read paper ↗<span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
        {r.event?.bookingUrl && (
          <a className="abtn" href={r.event.bookingUrl} target="_blank" rel="noopener noreferrer">
            Booking page ↗<span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
      </div>

      {video && (
        <div className="recprev__video">
          <VideoEmbed url={r.resource!.externalUrl!} title={r.title} />
        </div>
      )}
    </div>
  );
}
