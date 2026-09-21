/**
 * כללי העלאת תמונה משותפים לאשף ולעורך — מגבלות, סוגי MIME והודעות שגיאה.
 */

export const IMAGE_UPLOAD_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

/** גודל מקסימלי לקובץ לפני קריאה ל־data URL (4MB) */
export const IMAGE_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;

/** אורך מקסימלי סביר ל־data URL אחרי קידוד (כ־5.5MB מחרוזת) */
export const IMAGE_DATA_URL_MAX_CHARS = Math.ceil(IMAGE_UPLOAD_MAX_BYTES * 1.4) + 128;

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export type ImageUploadErrorCode =
  | 'missing_file'
  | 'invalid_type'
  | 'too_large'
  | 'read_failed'
  | 'invalid_data_url';

export class ImageUploadError extends Error {
  readonly code: ImageUploadErrorCode;

  constructor(code: ImageUploadErrorCode, message: string) {
    super(message);
    this.name = 'ImageUploadError';
    this.code = code;
  }
}

const ERROR_MESSAGES_HE: Record<ImageUploadErrorCode, string> = {
  missing_file: 'לא נבחר קובץ תמונה.',
  invalid_type: 'סוג הקובץ אינו נתמך. השתמשו ב־JPG, PNG, WebP או GIF.',
  too_large: 'התמונה גדולה מדי. הגודל המקסימלי הוא 4MB.',
  read_failed: 'לא הצלחנו לקרוא את התמונה. נסו קובץ אחר.',
  invalid_data_url: 'פורמט התמונה אינו תקין.',
};

/** הודעת שגיאה בעברית לפי קוד */
export function imageUploadErrorMessage(code: ImageUploadErrorCode): string {
  return ERROR_MESSAGES_HE[code];
}

/** בודק קובץ לפני קריאה ל־data URL */
export function assertValidImageFile(file: File | null | undefined): File {
  if (!file) {
    throw new ImageUploadError('missing_file', ERROR_MESSAGES_HE.missing_file);
  }
  if (!ALLOWED_MIME.has(file.type)) {
    throw new ImageUploadError('invalid_type', ERROR_MESSAGES_HE.invalid_type);
  }
  if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
    throw new ImageUploadError('too_large', ERROR_MESSAGES_HE.too_large);
  }
  return file;
}

/** בודק מחרוזת data URL של תמונה (לאחר קריאה או מהשרת) */
export function assertValidImageDataUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith('data:image/')) {
    throw new ImageUploadError(
      'invalid_data_url',
      ERROR_MESSAGES_HE.invalid_data_url
    );
  }
  if (trimmed.length > IMAGE_DATA_URL_MAX_CHARS) {
    throw new ImageUploadError('too_large', ERROR_MESSAGES_HE.too_large);
  }
  return trimmed;
}

/** קורא קובץ ל־data URL עם ולידציה מלאה */
export function readImageFileAsDataUrl(file: File): Promise<string> {
  const valid = assertValidImageFile(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (typeof reader.result !== 'string') {
          reject(
            new ImageUploadError('read_failed', ERROR_MESSAGES_HE.read_failed)
          );
          return;
        }
        resolve(assertValidImageDataUrl(reader.result));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => {
      reject(new ImageUploadError('read_failed', ERROR_MESSAGES_HE.read_failed));
    };
    reader.readAsDataURL(valid);
  });
}
