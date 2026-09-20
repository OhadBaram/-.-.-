import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { getServerSession } from 'next-auth';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { command, currentState } = body;

    if (!command || !currentState) {
      return NextResponse.json({ error: 'Missing command or state' }, { status: 400 });
    }

    const updateSlideTextDeclaration: FunctionDeclaration = {
      name: 'update_slide_text',
      description: 'Update the text content of a specific slide.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          slideIndex: { type: SchemaType.NUMBER, description: 'The 0-based index of the slide to update.' },
          newText: { type: SchemaType.STRING, description: 'The new text for the slide (in Hebrew).' }
        },
        required: ['slideIndex', 'newText']
      }
    };

    const changeTemplateDeclaration: FunctionDeclaration = {
      name: 'change_template',
      description:
        'Change the visual design template of one slide (pass slideIndex) or of every slide (omit slideIndex). Each slide has its own template.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          templateId: { type: SchemaType.STRING, description: 'The ID of the new template.' },
          slideIndex: {
            type: SchemaType.NUMBER,
            description: 'Optional 0-based slide index. If omitted, apply to all slides.',
          },
        },
        required: ['templateId']
      }
    };

    const changeFontDeclaration: FunctionDeclaration = {
      name: 'change_font',
      description: 'Change the global font family.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          fontFamily: { type: SchemaType.STRING, description: 'The new font family name (Heebo, Assistant, Rubik, Varela Round).' }
        },
        required: ['fontFamily']
      }
    };

    const updateColorsDeclaration: FunctionDeclaration = {
      name: 'update_colors',
      description: 'Update the global brand color and theme.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          brandColor: { type: SchemaType.STRING, description: 'Hex color code.' },
          theme: { type: SchemaType.STRING, description: "Theme, either 'light' or 'dark'" }
        },
        required: ['brandColor', 'theme']
      }
    };

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.8-flash',
      tools: [{
        functionDeclarations: [
          updateSlideTextDeclaration,
          changeTemplateDeclaration,
          changeFontDeclaration,
          updateColorsDeclaration
        ]
      }],
      systemInstruction: `You are Carousel Copilot, an AI assistant built into an Instagram Carousel generator SaaS.
Your job is to understand the user's request IN HEBREW ONLY and modify the carousel state by calling tools.
Return a friendly text response IN HEBREW ONLY explaining what you did, AND execute the tools.
Current State: ${JSON.stringify(currentState)}`
    });

    const result = await model.generateContent(command);
    const response = result.response;
    
    // Parse tool calls
    const actions: any[] = [];
    const calls = response.functionCalls();
    
    if (calls) {
      for (const call of calls) {
        actions.push({
          name: call.name,
          args: call.args
        });
      }
    }

    // Get the text response
    let text = 'ביצעתי את השינויים.';
    try {
      const respText = response.text();
      if (respText) text = respText;
    } catch (e) {
      // Gemini throws if response only contains function calls without text
    }

    return NextResponse.json({ 
      text,
      actions 
    });

  } catch (error) {
    console.error('Copilot error:', error);
    return NextResponse.json({ error: 'Failed to process copilot command' }, { status: 500 });
  }
}
