const fs = require('fs');

const serviceCode = `import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'dummy_key',
});

export interface GenerateOptions {
  prompt: string;
  provider?: string;
  model?: string;
  isJson?: boolean;
}

export async function generateText({ 
  prompt, 
  provider = process.env.DEFAULT_AI_PROVIDER || 'gemini', 
  model = process.env.DEFAULT_AI_MODEL || 'gemini-3.6-flash', 
  isJson = false 
}: GenerateOptions): Promise<string> {
  if (provider === 'openrouter') {
    if (!process.env.OPENROUTER_API_KEY) {
      console.warn('Missing OPENROUTER_API_KEY');
    }
    const params: any = {
      model,
      messages: [{ role: 'user', content: prompt }],
    };
    if (isJson) {
      params.response_format = { type: 'json_object' };
    }

    const completion = await openai.chat.completions.create(params);
    return completion.choices[0].message.content?.trim() || (isJson ? '{}' : '');
  } else {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Missing GEMINI_API_KEY');
    }
    const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const generationConfig: any = {};
    if (isJson) {
      generationConfig.responseMimeType = "application/json";
    }

    const modelsToTry = [model, 'gemini-3.6-flash', 'gemini-3.8-flash'];
    const uniqueModels = Array.from(new Set(modelsToTry));

    let lastError = null;
    for (const m of uniqueModels) {
      try {
        const generativeModel = client.getGenerativeModel({ 
          model: m,
          generationConfig 
        });
        const result = await generativeModel.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
      } catch (err: any) {
        console.warn(\`Gemini model \${m} failed: \${err?.message || err}. Trying next...\`);
        lastError = err;
      }
    }

    throw lastError || new Error('Failed to generate content with Gemini');
  }
}

export async function generateJson<T = any>(options: GenerateOptions): Promise<T> {
  let text = await generateText({ ...options, isJson: true });
  text = text.replace(/```json\\n?/g, '').replace(/```\\n?/g, '').trim();
  
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    console.error('Failed to parse AI response:', text);
    throw new Error('Invalid JSON format from AI');
  }
}
`;

fs.writeFileSync('src/lib/services/ai.service.ts', serviceCode);
