/**
 * מנרמל כתובת אתר: אם חסר פרוטוקול — מוסיף אותו.
 * דומיינים כמו
 *
 * www.example.com
 *
 * או
 *
 * example.com
 *
 * הופכים לכתובת מלאה תקינה לוולידציית שדה מסוג
 *
 * url
 */
export function ensureHttps(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  // כבר יש פרוטוקול
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}
