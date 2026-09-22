'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Slide, TemplateId } from './CarouselRenderer';
import {
  COPILOT_QUICK_PROMPTS,
  type CopilotQuickPromptId,
  buildCopilotQuickCommand,
} from '@/lib/copilot/quick-prompts';

export interface CopilotActionHandlers {
  onUpdateSlideText: (index: number, text: string) => void;
  onChangeTemplate: (tpl: TemplateId, slideIndex?: number) => void;
  onChangeFont: (font: string) => void;
  onChangeColors: (color: string, theme: string) => void;
  onAddSlide?: (afterIndex: number, text?: string) => void;
  onRemoveSlide?: (index: number) => void;
  onReorderSlide?: (fromIndex: number, toIndex: number) => void;
  onApplyLayoutPreset?: (
    presetId: 'first-and-last' | 'first-only' | 'all-images' | 'no-images'
  ) => void;
  onSetActiveSlide?: (index: number) => void;
  onSetSlideTypography?: (
    index: number,
    patch: { fontSize?: number; textY?: number }
  ) => void;
}

interface CopilotWidgetProps extends CopilotActionHandlers {
  slides: Slide[];
  template: TemplateId;
  globalFont: string;
  brandColor: string;
  theme: string;
  activeSlideIndex?: number;
  /** dock = סיידבר/עמודה; panel = לשונית מובייל מלאה */
  variant?: 'dock' | 'panel';
}

type ChatMessage = { role: 'user' | 'assistant'; text: string };

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

export default function CopilotWidget({
  slides,
  template,
  globalFont,
  brandColor,
  theme,
  activeSlideIndex = 0,
  variant = 'dock',
  onUpdateSlideText,
  onChangeTemplate,
  onChangeFont,
  onChangeColors,
  onAddSlide,
  onRemoveSlide,
  onReorderSlide,
  onApplyLayoutPreset,
  onSetActiveSlide,
  onSetSlideTypography,
}: CopilotWidgetProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'היי! אני העוזר של הקרוסלה. אפשר לקצר טקסט, לשנות גופן/צבע/תבנית, להוסיף שקף או לעבור על כולם — לחצו על הצעה או כתבו חופשי.',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [showAllPrompts, setShowAllPrompts] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

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

  const visiblePrompts = useMemo(() => {
    const primary = COPILOT_QUICK_PROMPTS.slice(0, 6);
    return showAllPrompts ? COPILOT_QUICK_PROMPTS : primary;
  }, [showAllPrompts]);

  const applyActions = (
    actions: { name: string; args?: Record<string, unknown> }[]
  ) => {
    for (const action of actions) {
      const args = action.args || {};
      switch (action.name) {
        case 'update_slide_text': {
          const idx = asNumber(args.slideIndex);
          const text = asString(args.newText);
          if (idx != null && text) onUpdateSlideText(idx, text);
          break;
        }
        case 'update_many_slide_texts': {
          const updates = Array.isArray(args.updates) ? args.updates : [];
          for (const item of updates) {
            if (!item || typeof item !== 'object') continue;
            const row = item as Record<string, unknown>;
            const idx = asNumber(row.slideIndex);
            const text = asString(row.newText);
            if (idx != null && text) onUpdateSlideText(idx, text);
          }
          break;
        }
        case 'change_template': {
          const tpl = asString(args.templateId) as TemplateId | null;
          if (!tpl) break;
          const idx = asNumber(args.slideIndex);
          onChangeTemplate(tpl, idx ?? undefined);
          break;
        }
        case 'change_font': {
          const font = asString(args.fontFamily);
          if (font) onChangeFont(font);
          break;
        }
        case 'update_colors': {
          const color = asString(args.brandColor) || brandColor;
          const nextTheme = asString(args.theme) || theme;
          onChangeColors(color, nextTheme);
          break;
        }
        case 'set_layout_preset': {
          const preset = asString(args.presetId);
          if (
            preset === 'first-and-last' ||
            preset === 'first-only' ||
            preset === 'all-images' ||
            preset === 'no-images'
          ) {
            onApplyLayoutPreset?.(preset);
          }
          break;
        }
        case 'add_slide': {
          const after =
            asNumber(args.afterIndex) ??
            Math.max(0, slides.length - 1);
          onAddSlide?.(after, asString(args.text) ?? undefined);
          break;
        }
        case 'remove_slide': {
          const idx = asNumber(args.slideIndex);
          if (idx != null) onRemoveSlide?.(idx);
          break;
        }
        case 'reorder_slide': {
          const from = asNumber(args.fromIndex);
          const to = asNumber(args.toIndex);
          if (from != null && to != null) onReorderSlide?.(from, to);
          break;
        }
        case 'set_active_slide': {
          const idx = asNumber(args.slideIndex);
          if (idx != null) onSetActiveSlide?.(idx);
          break;
        }
        case 'set_slide_typography': {
          const idx = asNumber(args.slideIndex);
          if (idx == null) break;
          const fontSize = asNumber(args.fontSize) ?? undefined;
          const textY = asNumber(args.textY) ?? undefined;
          onSetSlideTypography?.(idx, { fontSize, textY });
          break;
        }
        default:
          break;
      }
    }
  };

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
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        });
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
    const trimmed = command.trim();
    if (!trimmed || isLoading) return;

    const newMessages: ChatMessage[] = [
      ...messagesRef.current,
      { role: 'user', text: trimmed },
    ];
    setMessages(newMessages);
    setIsLoading(true);
    setInputText('');

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: trimmed,
          currentState: {
            slides: slides.map((s) => ({
              id: s.id,
              text: s.text,
              template: s.template ?? 'minimal',
              hasImage: Boolean(s.imageUrl),
            })),
            activeSlideIndex,
            activeSlideTemplate: template,
            globalFont,
            brandColor,
            theme,
            slideCount: slides.length,
          },
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Copilot failed');
      }

      if (Array.isArray(data.actions) && data.actions.length) {
        applyActions(data.actions);
      }

      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          text:
            typeof data.text === 'string' && data.text.trim()
              ? data.text
              : 'ביצעתי את השינויים.',
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          text: 'סליחה, אירעה שגיאה בעיבוד הבקשה. נסו שוב בעוד רגע.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const runQuickPrompt = (id: CopilotQuickPromptId) => {
    const command = buildCopilotQuickCommand(id, activeSlideIndex);
    if (command) void executeCopilotCommand(command);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const busy = isLoading || isTranscribing;
  const isPanel = variant === 'panel';

  return (
    <div
      className={`w-full bg-white dark:bg-gray-900 rounded-2xl border border-indigo-200 dark:border-indigo-500/40 overflow-hidden flex flex-col shadow-md ${
        isPanel
          ? 'h-full min-h-0 rounded-none border-0 shadow-none'
          : 'h-full min-h-[22rem]'
      }`}
      dir="rtl"
    >
      <div className="bg-gradient-to-l from-indigo-600 to-violet-600 p-3 flex justify-between items-center text-white shrink-0">
        <div className="min-w-0">
          <p className="font-black text-sm md:text-base leading-tight">
            עוזר הקרוסלה
          </p>
          <p className="text-[11px] text-indigo-100/90 mt-0.5 truncate">
            שקף {activeSlideIndex + 1} מתוך {slides.length} · לחצו הצעה או כתבו
          </p>
        </div>
        {isRecording ? (
          <span className="text-xs font-bold bg-red-500/90 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-white" />
            מקליט {formatTimer(recordingSeconds)}
          </span>
        ) : (
          <span className="text-[10px] font-bold bg-white/15 px-2 py-1 rounded-full shrink-0">
            AI
          </span>
        )}
      </div>

      <div className="shrink-0 px-3 pt-3 pb-2 border-b border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/60 dark:bg-indigo-950/20">
        <p className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 mb-2">
          הצעות מהירות
        </p>
        <div className="flex flex-wrap gap-1.5">
          {visiblePrompts.map((prompt) => (
            <button
              key={prompt.id}
              type="button"
              disabled={busy || isRecording}
              onClick={() => runQuickPrompt(prompt.id)}
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-500/40 bg-white dark:bg-gray-900 text-indigo-800 dark:text-indigo-100 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition disabled:opacity-40"
            >
              {prompt.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowAllPrompts((v) => !v)}
            className="text-[11px] font-bold px-2.5 py-1.5 rounded-full text-indigo-600 dark:text-indigo-300 underline underline-offset-2"
          >
            {showAllPrompts ? 'פחות' : 'עוד הצעות'}
          </button>
        </div>
      </div>

      <div
        ref={listRef}
        className="flex-1 min-h-0 overflow-y-auto p-3 md:p-4 flex flex-col gap-3"
      >
        {messages.map((msg, i) => (
          <div
            key={`${msg.role}-${i}`}
            className={`p-2.5 rounded-xl text-sm leading-relaxed ${
              msg.role === 'assistant'
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100 self-start'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 self-end'
            } max-w-[90%]`}
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
            העוזר חושב…
          </div>
        ) : null}

        <div ref={bottomRef} className="h-px shrink-0" aria-hidden />
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2 items-center shrink-0 bg-white dark:bg-gray-900">
        <button
          type="button"
          onClick={toggleRecording}
          disabled={busy}
          aria-pressed={isRecording}
          aria-label={isRecording ? 'עצור הקלטה ושלח' : 'התחל הקלטה'}
          title={
            isRecording ? 'לחצו לעצירה ושליחה' : 'לחצו להתחלת הקלטה'
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
          onKeyDown={(e) => {
            if (
              e.key === 'Enter' &&
              inputText.trim() &&
              !isRecording &&
              !busy
            ) {
              void executeCopilotCommand(inputText);
            }
          }}
          disabled={isRecording}
          placeholder={
            isRecording
              ? 'מקליט… לחצו שוב על המיקרופון'
              : 'למשל: קצר את שקף 2 / צבע כחול / הוסף שקף…'
          }
          className="flex-1 bg-gray-50 dark:bg-gray-800 border-none text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-400/40 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => void executeCopilotCommand(inputText)}
          disabled={isRecording || busy || !inputText.trim()}
          className="bg-indigo-600 text-white px-3 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-40 font-bold text-sm"
        >
          שלח
        </button>
      </div>
    </div>
  );
}
