import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServerSession } from 'next-auth';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as Blob;
    
    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const base64Audio = Buffer.from(buffer).toString('base64');
    const mimeType = file.type || 'audio/webm';

    // Using Gemini 1.5 Flash for fast audio transcription
    const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });
    
    const result = await model.generateContent([
      "תמלל במדויק את ההקלטה הבאה לעברית. החזר אך ורק את הטקסט המילולי בלי שום הקדמות או תוספות.",
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Audio
        }
      }
    ]);

    const text = result.response.text().trim();
    return NextResponse.json({ text });
  } catch (error) {
    console.error('Gemini Transcription error:', error);
    return NextResponse.json({ error: 'Failed to transcribe audio via Gemini' }, { status: 500 });
  }
}
