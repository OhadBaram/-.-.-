import { describe, expect, it } from 'vitest';
import {
  EMPTY_WIZARD_DRAFT,
  normalizeWizardDraft,
} from '@/lib/creation-flow/wizard-draft';

describe('wizard-draft', () => {
  it('trims topic and keeps other fields', () => {
    const next = normalizeWizardDraft({
      topic: '  נושא לדוגמה  ',
      publishTarget: 'linkedin',
      coverImageDataUrl: 'data:image/png;base64,x',
    });
    expect(next.topic).toBe('נושא לדוגמה');
    expect(next.publishTarget).toBe('linkedin');
    expect(next.coverImageDataUrl).toBe('data:image/png;base64,x');
  });

  it('falls back to base draft', () => {
    const base = normalizeWizardDraft(
      { topic: 'בסיס', publishTarget: 'instagram' },
      EMPTY_WIZARD_DRAFT
    );
    const next = normalizeWizardDraft({ topic: '  ' }, base);
    expect(next.topic).toBe('');
    expect(next.publishTarget).toBe('instagram');
  });
});
