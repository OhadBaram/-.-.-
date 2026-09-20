'use client';

import React, { useRef, useState } from 'react';
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

  const CANVAS_WIDTH = 1080;
  const CANVAS_HEIGHT = 1350;

  const drawSlide = (canvas: HTMLCanvasElement, slide: Slide) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = slide.backgroundColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = slide.textColor;
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
  };

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
  }, [localSlides]);

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

  return (
    <div className="flex flex-col items-center gap-6 p-4 w-full">
      <div className="flex flex-row overflow-x-auto snap-x gap-4 w-full pb-4">
        {localSlides.map((slide, index) => (
          <div key={slide.id} className="border p-2 rounded-lg shadow-sm flex-none snap-center w-[80vw] max-w-sm flex flex-col gap-2">
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
