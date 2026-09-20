import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getServerSession } from 'next-auth';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'dummy_key',
});

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

    const systemPrompt = `
You are Carousel Copilot, an AI assistant built into an Instagram Carousel generator SaaS.
Your job is to understand the user's request (in Hebrew) and modify the carousel state by calling tools.

Current State:
${JSON.stringify(currentState, null, 2)}

Instructions:
1. Understand the user's command. They might ask to change text on a specific slide, change the template, change colors, or fonts.
2. If they want to change text on a slide, use the update_slide_text tool. (Slide index is 0-based).
3. If they want to change the visual layout, use the change_template tool. Available templates: minimal, bold, gradient, dark-luxury, frame, split, story, quote, numbered, magazine, waves, neon, image-split, image-full-dark, image-circle-profile, image-split-bottom, image-polaroid, image-side, image-magazine, image-overlay, image-arch.
4. If they want to change font, use change_font (Heebo, Assistant, Rubik, Varela Round).
5. If they want to change colors, use update_colors.
6. Return a friendly text response in Hebrew explaining what you did, AND execute the tools.
`;

    const completion = await openai.chat.completions.create({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: command }
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'update_slide_text',
            description: 'Update the text content of a specific slide.',
            parameters: {
              type: 'object',
              properties: {
                slideIndex: { type: 'number', description: 'The 0-based index of the slide to update.' },
                newText: { type: 'string', description: 'The new text for the slide (in Hebrew).' }
              },
              required: ['slideIndex', 'newText']
            }
          }
        },
        {
          type: 'function',
          function: {
            name: 'change_template',
            description: 'Change the global template of the carousel.',
            parameters: {
              type: 'object',
              properties: {
                templateId: { type: 'string', description: 'The ID of the new template.' }
              },
              required: ['templateId']
            }
          }
        },
        {
          type: 'function',
          function: {
            name: 'change_font',
            description: 'Change the global font family.',
            parameters: {
              type: 'object',
              properties: {
                fontFamily: { type: 'string', description: 'The new font family name.' }
              },
              required: ['fontFamily']
            }
          }
        },
        {
          type: 'function',
          function: {
            name: 'update_colors',
            description: 'Update the global brand color and theme.',
            parameters: {
              type: 'object',
              properties: {
                brandColor: { type: 'string', description: 'Hex color code.' },
                theme: { type: 'string', enum: ['light', 'dark'] }
              },
              required: ['brandColor', 'theme']
            }
          }
        }
      ],
      tool_choice: 'auto',
    });

    const responseMessage = completion.choices[0].message;
    
    // Parse tool calls
    const actions = [];
    if (responseMessage.tool_calls) {
      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.type === 'function') {
          actions.push({
            name: toolCall.function.name,
            args: JSON.parse(toolCall.function.arguments)
          });
        }
      }
    }

    return NextResponse.json({ 
      text: responseMessage.content || 'ביצעתי את השינויים.',
      actions 
    });

  } catch (error) {
    console.error('Copilot error:', error);
    return NextResponse.json({ error: 'Failed to process copilot command' }, { status: 500 });
  }
}
