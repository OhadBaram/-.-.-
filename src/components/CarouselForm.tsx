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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-lg mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div>
        <label className="block text-gray-700 font-bold mb-2">נושא הפוסט</label>
        <input 
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
          className="w-full text-gray-900 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="לדוגמה: 5 טיפים לניהול זמן"
        />
      </div>

      <div>
        <label className="block text-gray-700 font-bold mb-2">קהל יעד</label>
        <input 
          type="text"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          required
          className="w-full text-gray-900 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="לדוגמה: עצמאיים ובעלי עסקים"
        />
      </div>

      <div>
        <label className="block text-gray-700 font-bold mb-2">מטרת הפוסט</label>
        <input 
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          required
          className="w-full text-gray-900 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="לדוגמה: יצירת מעורבות ומכירות"
        />
      </div>

      <div>
        <label className="block text-gray-700 font-bold mb-2">זהות המותג</label>
        <input 
          type="text"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          required
          className="w-full text-gray-900 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="לדוגמה: מקצועי, חדשני, ישיר"
        />
      </div>

      <button 
        type="submit" 
        disabled={isLoading}
        className="mt-6 w-full px-6 py-4 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {isLoading ? 'מייצר קרוסלה...' : 'צור קרוסלה'}
      </button>
    </form>
  );
}
