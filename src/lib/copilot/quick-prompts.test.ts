import { describe, expect, it } from 'vitest';
import {
  buildCopilotQuickCommand,
  COPILOT_QUICK_PROMPTS,
} from '@/lib/copilot/quick-prompts';

describe('copilot quick prompts', () => {
  it('builds slide-aware commands', () => {
    const cmd = buildCopilotQuickCommand('shorten-current', 2);
    expect(cmd).toContain('שקף 3');
    expect(cmd.length).toBeGreaterThan(10);
  });

  it('exposes a useful set of prompts', () => {
    expect(COPILOT_QUICK_PROMPTS.length).toBeGreaterThanOrEqual(8);
    expect(COPILOT_QUICK_PROMPTS.some((p) => p.id === 'add-slide')).toBe(true);
  });
});
