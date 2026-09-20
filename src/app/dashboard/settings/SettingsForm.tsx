'use client';

import { useState } from 'react';
import BrandPalettePicker from '@/components/BrandPalettePicker';
import {
  clampPalette,
  parseBrandPalette,
  primaryBrandColor,
  serializeBrandPalette,
  type BrandPalette,
} from '@/lib/brand-palette';

export default function SettingsForm({
  workspaceId,
  initialBrandIdentity,
  initialBrandColor,
  initialWebsiteUrl,
  initialReferenceLink1,
  initialReferenceLink2,
  initialReferenceLink3,
  initialAiProvider,
  initialAiModel,
}: {
  workspaceId: string;
  initialBrandIdentity: string;
  initialBrandColor: string;
  initialWebsiteUrl?: string;
  initialReferenceLink1?: string;
  initialReferenceLink2?: string;
  initialReferenceLink3?: string;
  initialAiProvider: string;
  initialAiModel: string;
}) {
  const [brandIdentity, setBrandIdentity] = useState(initialBrandIdentity);
  const [brandPalette, setBrandPalette] = useState<BrandPalette>(() =>
    parseBrandPalette(initialBrandColor)
  );
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsiteUrl || '');
  const [referenceLink1, setReferenceLink1] = useState(
    initialReferenceLink1 || ''
  );
  const [referenceLink2, setReferenceLink2] = useState(
    initialReferenceLink2 || ''
  );
  const [referenceLink3, setReferenceLink3] = useState(
    initialReferenceLink3 || ''
  );
  const [aiProvider, setAiProvider] = useState(initialAiProvider);
  const [aiModel, setAiModel] = useState(initialAiModel);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const palette = clampPalette(brandPalette);
      const res = await fetch('/api/workspace', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          brandIdentity,
          brandColor: serializeBrandPalette(palette),
          websiteUrl,
          referenceLink1,
          referenceLink2,
          referenceLink3,
          aiProvider,
          aiModel,
        }),
      });

      if (!res.ok) throw new Error('Failed to save settings');
      alert('ההגדרות נשמרו בהצלחה!');
    } catch {
      alert('אירעה שגיאה בשמירת ההגדרות.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <label className="block text-gray-700 font-bold mb-2">
          זהות המותג ותיאור חברה
        </label>
        <textarea
          value={brandIdentity}
          onChange={(e) => setBrandIdentity(e.target.value)}
          rows={4}
          className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
          placeholder="לדוגמה: בינה לתעשייה, יוצרת ai..."
        />
        <p className="text-sm text-gray-500 mt-2">
          💡 <strong className="font-medium">למה זה חשוב?</strong> המידע
          שתרשום כאן יישלח לבינה המלאכותית בכל פעם שתיצור קרוסלה, וישפיע ישירות
          על סגנון הכתיבה, השפה, הדוגמאות והאווירה של התוכן שייווצר.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <BrandPalettePicker
          value={brandPalette}
          onChange={setBrandPalette}
          variant="default"
        />
        <p className="text-sm text-gray-500 mt-3">
          💡 עד 3 צבעים. הצבע הראשי (
          <span className="font-mono" dir="ltr">
            {primaryBrandColor(brandPalette)}
          </span>
          ) ישמש כברירת מחדל ביצירה — ותמיד אפשר לשנות גם באשף וגם בעורך.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-700 font-bold mb-2">
            כתובת אתר (Website URL)
          </label>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-left text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            dir="ltr"
            placeholder="https://example.com"
            title="הזן את כתובת האתר הראשי של המותג"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-2">
            קישור ייחוס 1
          </label>
          <input
            type="url"
            value={referenceLink1}
            onChange={(e) => setReferenceLink1(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-left text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            dir="ltr"
            placeholder="https://..."
            title="קישור למאמר, עמוד נחיתה, או מקור השראה 1"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-2">
            קישור ייחוס 2
          </label>
          <input
            type="url"
            value={referenceLink2}
            onChange={(e) => setReferenceLink2(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-left text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            dir="ltr"
            placeholder="https://..."
            title="קישור למאמר, עמוד נחיתה, או מקור השראה 2"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-2">
            קישור ייחוס 3
          </label>
          <input
            type="url"
            value={referenceLink3}
            onChange={(e) => setReferenceLink3(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-left text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            dir="ltr"
            placeholder="https://..."
            title="קישור למאמר, עמוד נחיתה, או מקור השראה 3"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="mt-4 px-6 py-2 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700 disabled:opacity-50 w-full md:w-auto self-start"
      >
        {isSaving ? 'שומר...' : 'שמור הגדרות'}
      </button>
    </form>
  );
}
