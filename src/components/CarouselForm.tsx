'use client';

import React, { useState } from 'react';

interface CarouselFormProps {
  onSubmit: (data: { topic: string; audience: string; goal: string; brand: string }) => void;
  isLoading: boolean;
}

export default function CarouselForm({ onSubmit, isLoading }: CarouselFormProps) {
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [goal, setGoal] = useState('');
  const [brand, setBrand] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ topic, audience, goal, brand });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-lg mx-auto bg-white/70 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/40">
      <div>
        <label className="block text-gray-800 font-bold mb-2">נושא הפוסט</label>
        <input 
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
          className="w-full text-gray-900 bg-white/60 border border-white/50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
          placeholder="לדוגמה: 5 טיפים לניהול זמן"
        />
      </div>

      <div>
        <label className="block text-gray-800 font-bold mb-2">קהל יעד</label>
        <input 
          type="text"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          required
          className="w-full text-gray-900 bg-white/60 border border-white/50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
          placeholder="לדוגמה: עצמאיים ובעלי עסקים"
        />
      </div>

      <div>
        <label className="block text-gray-800 font-bold mb-2">מטרת הפוסט</label>
        <input 
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          required
          className="w-full text-gray-900 bg-white/60 border border-white/50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
          placeholder="לדוגמה: יצירת מעורבות ומכירות"
        />
      </div>

      <div>
        <label className="block text-gray-800 font-bold mb-2">זהות המותג</label>
        <input 
          type="text"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          required
          className="w-full text-gray-900 bg-white/60 border border-white/50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
          placeholder="לדוגמה: מקצועי, חדשני, ישיר"
        />
      </div>

      <button 
        type="submit" 
        disabled={isLoading}
        className="mt-8 w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:shadow-none transition-all duration-200"
      >
        {isLoading ? 'מייצר קרוסלה...' : 'צור קרוסלה'}
      </button>
    </form>
  );
}
