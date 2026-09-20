'use client';

import { useState } from 'react';

export default function SettingsForm({ 
  workspaceId, 
  initialBrandIdentity, 
  initialBrandColor, 
  initialAiProvider, 
  initialAiModel 
}: { 
  workspaceId: string; 
  initialBrandIdentity: string; 
  initialBrandColor: string;
  initialAiProvider: string;
  initialAiModel: string;
}) {
  const [brandIdentity, setBrandIdentity] = useState(initialBrandIdentity);
  const [brandColor, setBrandColor] = useState(initialBrandColor);
  const [aiProvider, setAiProvider] = useState(initialAiProvider);
  const [aiModel, setAiModel] = useState(initialAiModel);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const res = await fetch('/api/workspace', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, brandIdentity, brandColor, aiProvider, aiModel })
      });
      
      if (!res.ok) throw new Error('Failed to save settings');
      alert('ההגדרות נשמרו בהצלחה!');
    } catch (error) {
      alert('אירעה שגיאה בשמירת ההגדרות.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <label className="block text-gray-700 font-bold mb-2">זהות המותג ותיאור חברה</label>
        <textarea 
          value={brandIdentity}
          onChange={(e) => setBrandIdentity(e.target.value)}
          rows={4}
          className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
          placeholder="לדוגמה: בינה לתעשייה, יוצרת ai..."
        />
        <p className="text-sm text-gray-500 mt-2">
          💡 <strong className="font-medium">למה זה חשוב?</strong> המידע שתרשום כאן יישלח לבינה המלאכותית בכל פעם שתיצור קרוסלה, וישפיע ישירות על סגנון הכתיבה, השפה, הדוגמאות והאווירה של התוכן שייווצר.
        </p>
      </div>

      <div>
        <label className="block text-gray-700 font-bold mb-2">צבע מותג ראשי</label>
        <div className="flex items-center gap-3">
          <input 
            type="color"
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            className="w-12 h-12 border-0 rounded cursor-pointer p-0"
          />
          <input 
            type="text"
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 flex-grow max-w-xs text-left text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            dir="ltr"
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          💡 <strong className="font-medium">מה זה עושה?</strong> הצבע הזה ישמש באופן אוטומטי את מחולל התמונות כדי להדגיש מילות מפתח חשובות וטקסטים מרכזיים בתוך הקרוסלות שלך.
        </p>
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
