'use client';

import React, { useRef, useState, useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface Slide {
  id: string;
  text: string;
  backgroundColor: string;
  textColor: string;
}

interface CarouselRendererProps {
  slides: Slide[];
}

export default function CarouselRenderer({ slides }: CarouselRendererProps) {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [localSlides, setLocalSlides] = useState<Slide[]>(slides);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const CANVAS_WIDTH = 1080;
  const CANVAS_HEIGHT = 1350;

  const drawSlide = useCallback((canvas: HTMLCanvasElement, slide: Slide) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bg = theme === 'dark' ? '#111827' : '#ffffff';
    const fg = theme === 'dark' ? '#ffffff' : '#111827';

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = fg;
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';

    const words = slide.text.split(' ');
    let line = '';
    let y = CANVAS_HEIGHT / 2;
    const lineHeight = 80;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > CANVAS_WIDTH - 200 && n > 0) {
        ctx.fillText(line, CANVAS_WIDTH / 2, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, CANVAS_WIDTH / 2, y);
  }, [theme]);

  React.useEffect(() => {
    setLocalSlides(slides);
  }, [slides]);

  React.useEffect(() => {
    localSlides.forEach((slide, index) => {
      const canvas = canvasRefs.current[index];
      if (canvas) {
        drawSlide(canvas, slide);
      }
    });
  }, [localSlides, drawSlide]);

  const handleExportZip = async () => {
    setIsExporting(true);
    const zip = new JSZip();

    try {
      const imagePromises = localSlides.map((_, index) => {
        return new Promise<void>((resolve, reject) => {
          const canvas = canvasRefs.current[index];
          if (!canvas) {
            resolve();
            return;
          }

          canvas.toBlob((blob) => {
            if (blob) {
              zip.file(`slide_${index + 1}.png`, blob);
              resolve();
            } else {
              reject(new Error('Canvas to Blob failed'));
            }
          }, 'image/png');
        });
      });

      await Promise.all(imagePromises);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'carousel.zip');
    } catch (error) {
      console.error('Error exporting zip:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleTheme = () => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4 w-full">
      <div className="flex w-full justify-center">
        <button
          onClick={toggleTheme}
          className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 shadow-sm ${
            theme === 'light'
              ? 'bg-gray-900 text-white hover:bg-gray-800'
              : 'bg-white text-gray-900 hover:bg-gray-100'
          }`}
        >
          {theme === 'light' ? 'מצב כהה' : 'מצב בהיר'}
        </button>
      </div>

      <div 
        className="flex flex-row overflow-x-auto snap-x snap-mandatory pb-4 w-full max-w-full gap-4"
        style={{ direction: 'rtl' }}
      >
        {localSlides.map((slide, index) => (
          <div key={slide.id} className="shrink-0 snap-center border p-2 rounded-lg shadow-sm flex flex-col gap-2 w-[80vw] max-w-sm">
            <canvas
              ref={(el) => {
                canvasRefs.current[index] = el;
              }}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="w-full h-auto rounded"
              style={{ direction: 'rtl' }}
            />
            <textarea
              value={slide.text}
              onChange={(e) => {
                const newSlides = [...localSlides];
                newSlides[index] = { ...newSlides[index], text: e.target.value };
                setLocalSlides(newSlides);
              }}
              className="w-full p-2 border rounded resize-y"
              rows={3}
              dir="rtl"
            />
          </div>
        ))}
      </div>
      
      <button
        onClick={handleExportZip}
        disabled={isExporting}
        className="px-6 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isExporting ? 'מייצא...' : 'יצא ל-ZIP'}
      </button>
    </div>
  );
}
