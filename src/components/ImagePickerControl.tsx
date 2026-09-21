'use client';

import { useId, useRef, useState } from 'react';
import {
  IMAGE_UPLOAD_ACCEPT,
  ImageUploadError,
  imageUploadErrorMessage,
  readImageFileAsDataUrl,
} from '@/lib/contracts/image-upload';

export type ImagePickerVariant = 'dropzone' | 'compact';

export interface ImagePickerControlProps {
  /** data URL נוכחי או null */
  value: string | null;
  onChange: (next: string | null) => void;
  variant?: ImagePickerVariant;
  disabled?: boolean;
  /** תווית לכפתור במצב compact */
  compactLabel?: string;
  className?: string;
}

/**
 * רכיב העלאת תמונה יחיד — dropzone או כפתור קומפקטי.
 * כל הוולידציה עוברת דרך `image-upload` (מגבלת גודל וסוג).
 */
export default function ImagePickerControl({
  value,
  onChange,
  variant = 'dropzone',
  disabled = false,
  compactLabel = 'העלאת תמונה',
  className = '',
}: ImagePickerControlProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      onChange(dataUrl);
    } catch (err) {
      const code =
        err instanceof ImageUploadError ? err.code : 'read_failed';
      setError(imageUploadErrorMessage(code));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const openPicker = () => {
    if (disabled || busy) return;
    inputRef.current?.click();
  };

  const sharedInput = (
    <input
      id={inputId}
      ref={inputRef}
      type="file"
      accept={IMAGE_UPLOAD_ACCEPT}
      className="sr-only"
      disabled={disabled || busy}
      onChange={(e) => {
        void handleFiles(e.target.files);
      }}
    />
  );

  if (variant === 'compact') {
    return (
      <div className={`flex flex-col gap-1 ${className}`} dir="rtl">
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor={inputId}
            className={`text-xs font-semibold px-2 py-1 rounded cursor-pointer transition-colors border flex-1 text-center ${
              disabled || busy
                ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
                : 'text-gray-600 bg-gray-100 hover:bg-gray-200 border-gray-200'
            }`}
          >
            {busy ? 'טוען…' : compactLabel}
          </label>
          {sharedInput}
          {value ? (
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => {
                setError(null);
                onChange(null);
              }}
              className="text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded border border-red-200 whitespace-nowrap disabled:opacity-50"
            >
              הסר תמונה
            </button>
          ) : null}
        </div>
        {error ? (
          <p className="text-[11px] text-red-600 font-medium" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`} dir="rtl">
      <button
        type="button"
        disabled={disabled || busy}
        onClick={openPicker}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={`w-full rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
          dragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/60'
        } ${disabled || busy ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'}`}
      >
        {sharedInput}
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL מקומי מהמשתמש
          <img
            src={value}
            alt="תצוגה מקדימה של התמונה שנבחרה"
            className="mx-auto mb-3 max-h-40 rounded-lg object-contain"
          />
        ) : null}
        <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
          {busy
            ? 'טוען תמונה…'
            : value
              ? 'לחצו או גררו להחלפה'
              : 'גררו תמונה לכאן או לחצו לבחירה'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          JPG / PNG / WebP / GIF · עד 4MB
        </p>
      </button>
      {value ? (
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => {
            setError(null);
            onChange(null);
          }}
          className="text-xs font-bold text-red-600 self-start disabled:opacity-50"
        >
          הסר תמונה
        </button>
      ) : null}
      {error ? (
        <p className="text-xs text-red-600 font-medium" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
