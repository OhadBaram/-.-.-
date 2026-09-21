import { describe, expect, it } from 'vitest';
import {
  IMAGE_UPLOAD_MAX_BYTES,
  ImageUploadError,
  assertValidImageDataUrl,
  assertValidImageFile,
  imageUploadErrorMessage,
} from '@/lib/contracts/image-upload';

describe('image-upload', () => {
  it('accepts a valid jpeg file under the size limit', () => {
    const file = new File([new Uint8Array(100)], 'a.jpg', {
      type: 'image/jpeg',
    });
    expect(assertValidImageFile(file)).toBe(file);
  });

  it('rejects missing file', () => {
    expect(() => assertValidImageFile(null)).toThrow(ImageUploadError);
    try {
      assertValidImageFile(undefined);
    } catch (err) {
      expect(err).toBeInstanceOf(ImageUploadError);
      expect((err as ImageUploadError).code).toBe('missing_file');
    }
  });

  it('rejects invalid mime', () => {
    const file = new File([new Uint8Array(10)], 'a.txt', {
      type: 'text/plain',
    });
    expect(() => assertValidImageFile(file)).toThrow(/נתמך/);
  });

  it('rejects oversized file', () => {
    const file = new File(
      [new Uint8Array(IMAGE_UPLOAD_MAX_BYTES + 1)],
      'big.jpg',
      { type: 'image/jpeg' }
    );
    expect(() => assertValidImageFile(file)).toThrow(/גדולה מדי/);
  });

  it('validates data urls', () => {
    expect(assertValidImageDataUrl('data:image/png;base64,aaa')).toContain(
      'data:image/png'
    );
    expect(() => assertValidImageDataUrl('http://x')).toThrow(ImageUploadError);
  });

  it('maps error codes to hebrew messages', () => {
    expect(imageUploadErrorMessage('too_large')).toMatch(/4MB/);
  });
});
