import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PUBLISH_TARGET,
  getPublishTargetProfile,
  isPublishTarget,
  parsePublishTarget,
} from '@/lib/contracts/publish-target';

describe('publish-target', () => {
  it('parses valid targets and falls back safely', () => {
    expect(parsePublishTarget('instagram')).toBe('instagram');
    expect(parsePublishTarget('linkedin')).toBe('linkedin');
    expect(parsePublishTarget('nope')).toBe(DEFAULT_PUBLISH_TARGET);
    expect(parsePublishTarget(undefined)).toBe(DEFAULT_PUBLISH_TARGET);
  });

  it('exposes primary export by target', () => {
    expect(getPublishTargetProfile('instagram').primaryExport).toBe('zip');
    expect(getPublishTargetProfile('linkedin').primaryExport).toBe('pdf');
  });

  it('keeps canvas size centralized', () => {
    const ig = getPublishTargetProfile('instagram');
    const li = getPublishTargetProfile('linkedin');
    expect(ig.canvasWidth).toBe(1080);
    expect(ig.canvasHeight).toBe(1350);
    expect(li.canvasWidth).toBe(ig.canvasWidth);
    expect(li.canvasHeight).toBe(ig.canvasHeight);
  });

  it('type guard works', () => {
    expect(isPublishTarget('instagram')).toBe(true);
    expect(isPublishTarget('x')).toBe(false);
  });
});
