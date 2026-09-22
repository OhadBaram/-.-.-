/** חוזה פעולות העוזר — משותף ל־API וללקוח */

export const COPILOT_QUICK_PROMPTS = [
  {
    id: 'shorten-current',
    label: 'קצר את השקף',
    command: (slideIndex: number) =>
      `קצר את הטקסט בשקף ${slideIndex + 1} — שמור על המסר, פחות מילים, חזק יותר`,
  },
  {
    id: 'punchy-current',
    label: 'ניסוח שיווקי',
    command: (slideIndex: number) =>
      `שכתב את שקף ${slideIndex + 1} בנימה שיווקית חדה וברורה בעברית`,
  },
  {
    id: 'shorten-all',
    label: 'קצר את כולם',
    command: () =>
      'עבור על כל השקפים וקצר כל טקסט — שמור על הסדר והמשמעות, פחות מילים',
  },
  {
    id: 'pro-tone',
    label: 'טון מקצועי',
    command: () =>
      'שכתב את כל השקפים בנימה מקצועית ורגועה, מתאימה ללינקדאין',
  },
  {
    id: 'dark-mode',
    label: 'מצב כהה',
    command: () => 'עבור למצב כהה עם צבע מותג כחול עמוק',
  },
  {
    id: 'light-warm',
    label: 'רקע חם',
    command: () => 'עבור למצב בהיר עם צבע מותג כתום חם (#ea580c)',
  },
  {
    id: 'font-heebo',
    label: 'גופן Heebo',
    command: () => 'שנה את הגופן לכל השקפים ל־Heebo',
  },
  {
    id: 'font-rubik',
    label: 'גופן Rubik',
    command: () => 'שנה את הגופן לכל השקפים ל־Rubik',
  },
  {
    id: 'bold-template',
    label: 'תבנית נועזת',
    command: () => 'החל תבנית bold על כל השקפים',
  },
  {
    id: 'minimal-template',
    label: 'תבנית מינימלית',
    command: () => 'החל תבנית minimal על כל השקפים',
  },
  {
    id: 'layout-first-last',
    label: 'תמונה ראשון+אחרון',
    command: () =>
      'החל פריסת קרוסלה first-and-last — תמונה בשקף הראשון והאחרון בלבד',
  },
  {
    id: 'add-slide',
    label: 'הוסף שקף',
    command: (slideIndex: number) =>
      `הוסף שקף חדש אחרי שקף ${slideIndex + 1} עם טקסט קצר שממשיך את הרעיון`,
  },
] as const;

export type CopilotQuickPromptId = (typeof COPILOT_QUICK_PROMPTS)[number]['id'];

export function buildCopilotQuickCommand(
  id: CopilotQuickPromptId,
  activeSlideIndex: number
): string {
  const item = COPILOT_QUICK_PROMPTS.find((p) => p.id === id);
  if (!item) return '';
  return item.command(activeSlideIndex);
}
