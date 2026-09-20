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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-gray-700 font-bold mb-2">זהות המותג ותיאור חברה</label>
        <textarea 
          value={brandIdentity}
          onChange={(e) => setBrandIdentity(e.target.value)}
          rows={4}
          className="w-full border rounded p-2 focus:ring-2 focus:ring-indigo-500"
          placeholder="לדוגמה: מותג יוקרתי, פונה לאנשי עסקים, משתמש בשפה רשמית ומקצועית"
        />
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
            className="border rounded p-2 flex-grow max-w-xs text-left"
            dir="ltr"
          />
        </div>
      </div>

      <div className="pt-4 border-t">
        <h3 className="text-lg font-bold mb-4">הגדרות בינה מלאכותית</h3>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">ספק מודל (AI Provider)</label>
          <select 
            value={aiProvider}
            onChange={(e) => setAiProvider(e.target.value)}
            className="w-full border rounded p-2 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="gemini">Google Gemini</option>
            <option value="openrouter">OpenRouter</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">שם המודל (Model Name)</label>
          <input 
            type="text"
            value={aiModel}
            onChange={(e) => setAiModel(e.target.value)}
            className="w-full border rounded p-2 focus:ring-2 focus:ring-indigo-500"
            dir="ltr"
            placeholder="למשל: openai/gpt-4o"
          />
          <p className="text-sm text-gray-500 mt-1">
            הזן את השם המדויק של המודל כפי שהוא מופיע בספק (למשל: <code>gemini-1.5-flash</code> או <code>openai/gpt-4o</code>).
          </p>
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
