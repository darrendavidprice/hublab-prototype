/* ============================================================
   Client-side image preview helper (prototype).

   In the real build a chosen image uploads to storage (Supabase
   Storage / the WordPress media library) and we keep only its URL.
   The prototype has no backend, so this reads the file in the
   browser, downscales it on a canvas, and returns a data URL we can
   both preview and persist in the LocalStorage store — which has a
   tight (~5MB) quota, hence the downscale. Swappable: when the
   Supabase adapter is live, the form uploads and stores the URL
   instead, with no other UI change.
   ============================================================ */

/** Reject very large originals before we even decode them. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB

/** Read an image File, downscale so the longest edge is <= maxDim, and return
 *  a data URL. PNG/WebP keep their format (to preserve transparency on brand
 *  art); everything else is encoded as JPEG to keep the data URL small. */
export function fileToPreviewDataUrl(file: File, maxDim = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('That file isn’t an image.'));
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      reject(new Error('That image is over 8 MB — please choose a smaller one.'));
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const longest = Math.max(img.naturalWidth, img.naturalHeight) || 1;
      const scale = Math.min(1, maxDim / longest);
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Couldn’t process that image in this browser.')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      const keepFormat = file.type === 'image/png' || file.type === 'image/webp';
      const mime = keepFormat ? file.type : 'image/jpeg';
      try {
        resolve(canvas.toDataURL(mime, keepFormat ? undefined : 0.82));
      } catch {
        reject(new Error('Couldn’t process that image in this browser.'));
      }
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Couldn’t read that image.')); };
    img.src = objectUrl;
  });
}

/** True for the inline data URLs this helper produces (vs a path/URL the user
 *  typed). Used by the form to label the preview source honestly. */
export const isDataUrl = (s?: string): boolean => !!s && s.startsWith('data:');
