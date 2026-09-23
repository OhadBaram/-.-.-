import { describe, expect, it } from 'vitest';
import {
  classifyReferenceLink,
  extractInstagramUsername,
  extractUrlsFromText,
  extractYouTubeVideoId,
  hostFromUrl,
  isFacebookUrl,
  isInstagramUrl,
  isTikTokUrl,
  isTwitterUrl,
  isYouTubeUrl,
} from '@/lib/reference-links';

describe('reference-links', () => {
  it('detects Instagram hosts', () => {
    expect(isInstagramUrl('https://www.instagram.com/p/abc')).toBe(true);
    expect(isInstagramUrl('https://instagr.am/p/abc')).toBe(true);
    expect(isInstagramUrl('https://example.com/p/abc')).toBe(false);
  });

  it('detects YouTube, TikTok, Twitter, Facebook hosts', () => {
    expect(isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    expect(isYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
    expect(isTikTokUrl('https://www.tiktok.com/@user/video/123')).toBe(true);
    expect(isTwitterUrl('https://twitter.com/user/status/123')).toBe(true);
    expect(isTwitterUrl('https://x.com/user/status/123')).toBe(true);
    expect(isFacebookUrl('https://www.facebook.com/page/post/123')).toBe(true);
    expect(isFacebookUrl('https://fb.watch/xyz/')).toBe(true);
  });

  it('extracts YouTube video ID from various formats', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts URLs from mixed prompt text', () => {
    const text = 'תכין לי קרוסלה על הסרטון הזה https://www.youtube.com/watch?v=abc12345678 וגם על האתר https://example.com/tips';
    const urls = extractUrlsFromText(text);
    expect(urls).toEqual([
      'https://www.youtube.com/watch?v=abc12345678',
      'https://example.com/tips',
    ]);
  });

  it('extracts username from profile and stories URLs', () => {
    expect(
      extractInstagramUsername('https://instagram.com/acme_studio/')
    ).toBe('acme_studio');
    expect(
      extractInstagramUsername('https://www.instagram.com/stories/acme/123')
    ).toBe('acme');
  });

  it('does not invent username from post-only URLs', () => {
    expect(extractInstagramUsername('https://instagram.com/p/AbCdEf')).toBeNull();
    expect(
      extractInstagramUsername('https://instagram.com/reel/AbCdEf')
    ).toBeNull();
  });

  it('classifies link kinds', () => {
    expect(classifyReferenceLink('https://instagram.com/x')).toBe('instagram');
    expect(classifyReferenceLink('https://youtube.com/watch?v=123')).toBe('youtube');
    expect(classifyReferenceLink('https://tiktok.com/@u/video/123')).toBe('tiktok');
    expect(classifyReferenceLink('https://x.com/u/status/123')).toBe('twitter');
    expect(classifyReferenceLink('https://facebook.com/u/posts/123')).toBe('facebook');
    expect(classifyReferenceLink('https://brand.co/about')).toBe('website');
  });

  it('normalizes hostname', () => {
    expect(hostFromUrl('https://www.example.com/path')).toBe('example.com');
  });
});

