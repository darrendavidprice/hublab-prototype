/* ============================================================
   Client-side document-attachment helper (prototype).

   Mirrors lib/image.ts but for downloadable resources (PDF, Word,
   PowerPoint, etc). The prototype has no backend, so a chosen file
   is read into a data URL we can persist in the LocalStorage store
   and hand straight back as a download. LocalStorage has a tight
   (~5 MB) quota, so attachments are capped small here — this cap is
   a DEMO limit only; the live build uploads to Supabase Storage (or
   the WordPress media library) and keeps just the resulting URL, so
   the same form field works unchanged with no size ceiling.
   ============================================================ */

/** Demo-only cap. Kept small because inline data URLs live in LocalStorage. */
export const MAX_ATTACH_BYTES = 1.5 * 1024 * 1024; // 1.5 MB

export function humanSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

/** A short type label from the extension, e.g. "report.docx" → "DOCX". */
export function extLabel(name: string): string {
  const ext = name.includes('.') ? name.split('.').pop()! : '';
  return ext ? ext.toUpperCase() : 'File';
}

export interface PickedFile { dataUrl: string; name: string; label: string }

/** Read a chosen file into a data URL with an auto label. Rejects oversized
 *  files with a message that names the demo cap (and notes the live site lifts it). */
export function fileToDataUrl(file: File): Promise<PickedFile> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_ATTACH_BYTES) {
      reject(new Error(
        `That file is ${humanSize(file.size)} — over the ${humanSize(MAX_ATTACH_BYTES)} demo limit. ` +
        `Attachments are kept in your browser here; the live site uploads to storage with no such cap.`,
      ));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve({
      dataUrl: String(reader.result),
      name: file.name,
      label: `${extLabel(file.name)} · ${humanSize(file.size)}`,
    });
    reader.onerror = () => reject(new Error('Couldn’t read that file.'));
    reader.readAsDataURL(file);
  });
}
