import { generateJson } from './src/lib/services/ai.service.ts';

async function main() {
  const prompt = `
אתה קופירייטר לאינסטגרם.
צור קרוסלה בת 3 שקפים בנושא: אופניים חשמליים.
החזר JSON בפורמט:
{
  "explanation": "הסבר קצר",
  "slides": [
    { "id": "1", "text": "כותרת", "backgroundColor": "#ffffff", "textColor": "#000000" }
  ]
}
`;
  console.log("Calling generateJson with gemini-3.8-flash...");
  const res = await generateJson({ prompt, provider: 'gemini', model: 'gemini-3.8-flash' });
  console.log("SUCCESS:", JSON.stringify(res, null, 2));
}

main().catch(console.error);
