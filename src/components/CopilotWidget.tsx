import React, { useState, useRef } from 'react';
import { Slide, TemplateId } from './CarouselRenderer';

interface CopilotWidgetProps {
  slides: Slide[];
  template: TemplateId;
  globalFont: string;
  brandColor: string;
  theme: string;
  onUpdateSlideText: (index: number, text: string) => void;
  onChangeTemplate: (tpl: TemplateId) => void;
  onChangeFont: (font: string) => void;
  onChangeColors: (color: string, theme: string) => void;
}

export default function CopilotWidget({
  slides,
  template,
  globalFont,
  brandColor,
  theme,
  onUpdateSlideText,
  onChangeTemplate,
  onChangeFont,
  onChangeColors
}: CopilotWidgetProps) {
  
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'assistant', text: string}[]>([
    { role: 'assistant', text: 'היי! אני סוכן ה-AI שלך. רוצה שאשנה פונט? אחליף תבנית? או אערוך משפט בשקף 3? פשוט תגיד לי!' }
  ]);
  const [inputText, setInputText] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioUpload(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('אין גישה למיקרופון');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioUpload = async (blob: Blob) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');
    
    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      if (data.text) {
        await executeCopilotCommand(data.text);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const executeCopilotCommand = async (command: string) => {
    const newMessages = [...messages, { role: 'user' as const, text: command }];
    setMessages(newMessages);
    setIsLoading(true);
    setInputText('');

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command,
          currentState: { slides, template, globalFont, brandColor, theme }
        })
      });
      const data = await res.json();
      
      if (data.text) {
        setMessages([...newMessages, { role: 'assistant', text: data.text }]);
      }

      if (data.actions) {
        data.actions.forEach((action: any) => {
          if (action.name === 'update_slide_text') {
            onUpdateSlideText(action.args.slideIndex, action.args.newText);
          } else if (action.name === 'change_template') {
            onChangeTemplate(action.args.templateId);
          } else if (action.name === 'change_font') {
            onChangeFont(action.args.fontFamily);
          } else if (action.name === 'update_colors') {
            onChangeColors(action.args.brandColor, action.args.theme);
          }
        });
      }

    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: 'assistant', text: 'סליחה, אירעה שגיאה בעיבוד הבקשה.' }]);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-80 shadow-inner">
      <div className="bg-indigo-600 p-3 flex justify-between items-center text-white">
        <span className="font-bold flex items-center gap-2">✨ AI Copilot</span>
        
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div key={i} className={`p-2 rounded-lg text-sm ${msg.role === 'assistant' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-200 self-start' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 self-end'} max-w-[85%]`}>
            {msg.text}
          </div>
        ))}
        {isLoading && (
          <div className="text-xs text-gray-400 self-start animate-pulse">הבוט חושב...</div>
        )}
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        <button 
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'}`}
        >
          🎤
        </button>
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && inputText && executeCopilotCommand(inputText)}
          placeholder="הקלד פקודה או החזק ת'רמקול..."
          className="flex-1 bg-gray-50 dark:bg-gray-800 border-none text-sm rounded-lg px-3 focus:ring-0"
        />
        <button 
          onClick={() => inputText && executeCopilotCommand(inputText)}
          className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
