import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
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
  provider = process.env.DEFAULT_AI_PROVIDER || 'openrouter', 
  model = process.env.DEFAULT_AI_MODEL || 'google/gemini-2.5-flash', 
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
    const generationConfig: any = {};
    if (isJson) {
      generationConfig.responseMimeType = "application/json";
    }

    const generativeModel = genAI.getGenerativeModel({ 
      model,
      generationConfig 
    });
    const result = await generativeModel.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  }
}

export async function generateJson<T = any>(options: GenerateOptions): Promise<T> {
  let text = await generateText({ ...options, isJson: true });
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    console.error('Failed to parse AI response:', text);
    throw new Error('Invalid JSON format from AI');
  }
}
