import {
  DEFAULT_PUBLISH_TARGET,
  type PublishTarget,
} from '@/lib/contracts/publish-target';

/** טיוטה משותפת בין מסלול מהיר למסלול מלא — כדי שלא יאבד נושא במעבר */
export interface WizardSharedDraft {
  topic: string;
  publishTarget: PublishTarget;
  coverImageDataUrl: string | null;
}

export const EMPTY_WIZARD_DRAFT: WizardSharedDraft = {
  topic: '',
  publishTarget: DEFAULT_PUBLISH_TARGET,
  coverImageDataUrl: null,
};

export function normalizeWizardDraft(
  partial: Partial<WizardSharedDraft> | null | undefined,
  base: WizardSharedDraft = EMPTY_WIZARD_DRAFT
): WizardSharedDraft {
  return {
    topic: (partial?.topic ?? base.topic).trim(),
    publishTarget: partial?.publishTarget ?? base.publishTarget,
    coverImageDataUrl:
      partial?.coverImageDataUrl === undefined
        ? base.coverImageDataUrl
        : partial.coverImageDataUrl,
  };
}
