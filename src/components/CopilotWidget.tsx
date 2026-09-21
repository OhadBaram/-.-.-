'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Slide, TemplateId } from './CarouselRenderer';

interface CopilotWidgetProps {
  slides: Slide[];
  template: TemplateId;
  globalFont: string;
  brandColor: string;
  theme: string;
  onUpdateSlideText: (index: number, text: string) => void;
  onChangeTemplate: (tpl: TemplateId, slideIndex?: number) => void;
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
  onChangeColors,
}: CopilotWidgetProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant'; text: string }[]
  >([
    {
      role: 'assistant',
      text: 'היי! אני סוכן ה-AI שלך. רוצה שאשנה פונט? אחליף תבנית? או אערוך משפט בשקף 3? פשוט תגיד לי!',
    },
  ]);
  const [inputText, setInputText] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollChatToBottom = () => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    });
  };

  useEffect(() => {
    scrollChatToBottom();
  }, [messages, isLoading, isRecording, isTranscribing]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecordingTimer = () => {
    setRecordingSeconds(0);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
  };

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setRecordingSeconds(0);
  };

  const startRecording = async () => {
    if (isLoading || isTranscribing || isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
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
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        await handleAudioUpload(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      startRecordingTimer();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('אין גישה למיקרופון');
      setIsRecording(false);
      stopRecordingTimer();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopRecordingTimer();
    }
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else void startRecording();
  };

  const handleAudioUpload = async (blob: Blob) => {
    setIsTranscribing(true);
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
        setIsTranscribing(false);
        await executeCopilotCommand(data.text);
        return;
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'לא הצלחתי לתמלל את ההקלטה. נסו שוב.' },
      ]);
    } finally {
      setIsTranscribing(false);
    }
  };

  const executeCopilotCommand = async (command: string) => {
    const newMessages = [
      ...messages,
      { role: 'user' as const, text: command },
    ];
    setMessages(newMessages);
    setIsLoading(true);
    setInputText('');

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command,
          currentState: {
            slides: slides.map((s) => ({
              id: s.id,
              text: s.text,
              template: s.template ?? 'minimal',
              hasImage: Boolean(s.imageUrl),
            })),
            activeSlideTemplate: template,
            globalFont,
            brandColor,
            theme,
          },
        }),
      });
      const data = await res.json();

      if (data.text) {
        setMessages([
          ...newMessages,
          { role: 'assistant', text: data.text },
        ]);
      }

      if (data.actions) {
        data.actions.forEach((action: any) => {
          if (action.name === 'update_slide_text') {
            onUpdateSlideText(action.args.slideIndex, action.args.newText);
          } else if (action.name === 'change_template') {
            onChangeTemplate(action.args.templateId, action.args.slideIndex);
          } else if (action.name === 'change_font') {
            onChangeFont(action.args.fontFamily);
          } else if (action.name === 'update_colors') {
            onChangeColors(action.args.brandColor, action.args.theme);
          }
        });
      }
    } catch (err) {
      console.error(err);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          text: 'סליחה, אירעה שגיאה בעיבוד הבקשה.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-64 md:h-72 shadow-inner">
      <div className="bg-indigo-600 p-3 flex justify-between items-center text-white">
        <span className="font-bold flex items-center gap-2">✨ AI Copilot</span>
        {isRecording ? (
          <span className="text-xs font-bold bg-red-500/90 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white" />
            מקליט {formatTimer(recordingSeconds)}
          </span>
        ) : null}
      </div>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg text-sm ${
              msg.role === 'assistant'
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-200 self-start'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 self-end'
            } max-w-[85%]`}
          >
            {msg.text}
          </div>
        ))}

        {isRecording ? (
          <div className="self-stretch rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-700 px-3 py-2 text-sm text-red-800 dark:text-red-100 flex items-center gap-2 animate-pulse">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            <span className="font-bold">מקליט עכשיו</span>
            <span className="tabular-nums font-mono text-xs opacity-80">
              {formatTimer(recordingSeconds)}
            </span>
            <span className="text-xs opacity-80 mr-auto">
              לחצו שוב על המיקרופון כדי לשלוח
            </span>
          </div>
        ) : null}

        {isTranscribing ? (
          <div className="text-xs text-amber-600 dark:text-amber-300 self-start animate-pulse font-medium">
            מתמלל את ההקלטה…
          </div>
        ) : null}

        {isLoading ? (
          <div className="text-xs text-indigo-500 dark:text-indigo-300 self-start animate-pulse font-medium">
            הבוט חושב…
          </div>
        ) : null}

        <div ref={bottomRef} className="h-px shrink-0" aria-hidden />
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2 items-center">
        <button
          type="button"
          onClick={toggleRecording}
          disabled={isLoading || isTranscribing}
          aria-pressed={isRecording}
          aria-label={isRecording ? 'עצור הקלטה ושלח' : 'התחל הקלטה'}
          title={
            isRecording
              ? 'לחצו לעצירה ושליחה'
              : 'לחצו להתחלת הקלטה'
          }
          className={`relative p-2.5 rounded-full transition-all disabled:opacity-40 ${
            isRecording
              ? 'bg-red-500 text-white ring-4 ring-red-300/70 scale-110'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {isRecording ? (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white border-2 border-red-500 animate-ping" />
          ) : null}
          🎤
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) =>
            e.key === 'Enter' &&
            inputText &&
            !isRecording &&
            executeCopilotCommand(inputText)
          }
          disabled={isRecording}
          placeholder={
            isRecording
              ? 'מקליט… לחצו שוב על המיקרופון'
              : 'הקלידו פקודה או לחצו על המיקרופון…'
          }
          className="flex-1 bg-gray-50 dark:bg-gray-800 border-none text-sm rounded-lg px-3 focus:ring-0 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => inputText && executeCopilotCommand(inputText)}
          disabled={isRecording || isLoading || !inputText.trim()}
          className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-40"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
