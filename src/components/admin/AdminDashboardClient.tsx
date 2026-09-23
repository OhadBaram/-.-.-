'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export interface CustomerData {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  daysSinceRegistration: number;
  workspaceId: string;
  workspaceName: string;
  plan: string;
  carouselsCount: number;
  isTrialActive: boolean;
  trialExpiredNoUpgrade: boolean;
  isInactive30Days: boolean;
  aiImageGenEnabled: boolean;
}

export interface AdminDashboardProps {
  adminEmail: string;
  customers: CustomerData[];
  totalCarousels: number;
}

export default function AdminDashboardClient({ adminEmail, customers: initialCustomers, totalCarousels }: AdminDashboardProps) {
  const [customers, setCustomers] = useState<CustomerData[]>(initialCustomers);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Metrics calculations
  const totalCustomers = customers.length;
  
  // Plans breakdown
  const freemiumCount = customers.filter(c => c.plan === 'freemium' || c.plan === 'free').length;
  const proCount = customers.filter(c => c.plan === 'pro').length;
  const premiumCount = customers.filter(c => c.plan === 'premium').length;
  const unlimitedCount = customers.filter(c => c.plan === 'unlimited').length;
  const payingCount = proCount + premiumCount + unlimitedCount;

  // Projected Monthly Revenue (MRR) in ILS
  // Pro: ₪89, Premium: ₪149, Unlimited: ₪299 (or custom)
  const mrr = (proCount * 89) + (premiumCount * 149) + (unlimitedCount * 299);

  // Trial expired without upgrade (registered > 7 days ago and still on free plan)
  const trialExpiredCount = customers.filter(c => c.trialExpiredNoUpgrade).length;

  // Inactive / Churn (registered > 30 days and 0 carousels in last 30 days)
  const inactiveCount = customers.filter(c => c.isInactive30Days).length;

  // Filter customers
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search));
    
    if (!matchesSearch) return false;
    if (planFilter === 'all') return true;
    if (planFilter === 'paying') return c.plan === 'pro' || c.plan === 'premium' || c.plan === 'unlimited';
    if (planFilter === 'trialExpired') return c.trialExpiredNoUpgrade;
    return c.plan === planFilter;
  });

  const handleUpdatePlan = async (workspaceId: string, newPlan: string, customerId: string) => {
    setUpdatingId(customerId);
    try {
      const res = await fetch('/api/admin/update-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, plan: newPlan })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update plan');

      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, plan: newPlan } : c));
      showToast('המנוי עודכן בהצלחה!');
    } catch (err: any) {
      alert('שגיאה בעדכון מנוי: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleImageGen = async (workspaceId: string, enabled: boolean, customerId: string) => {
    setUpdatingId(customerId);
    try {
      const res = await fetch('/api/admin/toggle-image-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, enabled })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle AI image gen');

      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, aiImageGenEnabled: enabled } : c));
      showToast(enabled ? 'יצירת תמונות AI הופעלה בהצלחה!' : 'יצירת תמונות AI נוטרלה.');
    } catch (err: any) {
      alert('שגיאה בעדכון הרשאת תמונות AI: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-10 text-gray-900 dark:text-gray-100" dir="rtl">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl font-bold text-sm animate-bounce">
          ✓ {toastMessage}
        </div>
      )}

      {/* Header & View Switcher */}
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">👑</span>
            <h1 className="text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400">
              דאשבורד ניהול לקוחות ומערכת
            </h1>
            <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full">
              מנהל מערכת
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            מחובר כ-<strong>{adminEmail}</strong> • ניטור לקוחות, ביצועי הכנסות ומנויים
          </p>
        </div>

        {/* Mode Switcher Button */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            href="/dashboard"
            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-bold rounded-xl border border-indigo-200 dark:border-indigo-700 transition-all shadow-sm"
          >
            <span>👤 מעבר לתצוגת משתמש רגיל</span>
          </Link>
        </div>
      </header>

      {/* Primary KPI Metrics Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Total Customers */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 text-sm font-semibold">
            <span>סך כל הלקוחות</span>
            <span className="text-xl">👥</span>
          </div>
          <div className="mt-4">
            <div className="text-4xl font-black text-gray-900 dark:text-white">{totalCustomers}</div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
              {payingCount} מנויים בתשלום ({totalCustomers > 0 ? Math.round((payingCount / totalCustomers) * 100) : 0}%)
            </div>
          </div>
        </div>

        {/* Projected Monthly Revenue (MRR) */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-6 rounded-2xl shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-center text-indigo-100 text-sm font-semibold">
            <span>צפי הכנסות חודשי (MRR)</span>
            <span className="text-xl">💳</span>
          </div>
          <div className="mt-4">
            <div className="text-4xl font-black">₪{mrr.toLocaleString()}</div>
            <div className="text-xs text-indigo-200 mt-1 font-medium">
              מחושב לפי מנויי פרו (₪89) ופרימיום (₪149)
            </div>
          </div>
        </div>

        {/* Trial Expired without Upgrade */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 text-sm font-semibold">
            <span>אי רישום לאחר שבוע ניסיון</span>
            <span className="text-xl">⏳</span>
          </div>
          <div className="mt-4">
            <div className="text-4xl font-black text-amber-600 dark:text-amber-400">{trialExpiredCount}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              מעל 7 ימים מההרשמה ללא שדרוג בתשלום
            </div>
          </div>
        </div>

        {/* Inactive / Churn Risk */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 text-sm font-semibold">
            <span>נטישות / לא פעילים (30 יום)</span>
            <span className="text-xl">📉</span>
          </div>
          <div className="mt-4">
            <div className="text-4xl font-black text-red-500 dark:text-red-400">{inactiveCount}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              סך קרוסלות במערכת: <strong>{totalCarousels}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Breakdown Cards */}
      <section className="mb-10 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">
          פילוח מנויים פעילים במערכת
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">חינמי (Freemium)</div>
            <div className="text-2xl font-black mt-2 text-gray-800 dark:text-gray-100">{freemiumCount}</div>
            <div className="text-xs text-gray-500 mt-1">
              {totalCustomers > 0 ? Math.round((freemiumCount / totalCustomers) * 100) : 0}% מכלל הלקוחות
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">פרו (₪89 / חודש)</div>
            <div className="text-2xl font-black mt-2 text-blue-800 dark:text-blue-200">{proCount}</div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              ₪{(proCount * 89).toLocaleString()} צפי חודשי
            </div>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="text-sm text-purple-700 dark:text-purple-300 font-medium">פרימיום (₪149 / חודש)</div>
            <div className="text-2xl font-black mt-2 text-purple-800 dark:text-purple-200">{premiumCount}</div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              ₪{(premiumCount * 149).toLocaleString()} צפי חודשי
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <div className="text-sm text-amber-700 dark:text-amber-300 font-medium">ללא הגבלה (Unlimited)</div>
            <div className="text-2xl font-black mt-2 text-amber-800 dark:text-amber-200">{unlimitedCount}</div>
            <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              משתמשי VIP והנהלה
            </div>
          </div>
        </div>
      </section>

      {/* Customer Management Table */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Table Controls */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">רשימת לקוחות וניהול הרשאות</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              הצגת כל הלקוחות הרשומים ואפשרות לשדרוג חבילה מיידי
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לפי שם, אימייל או טלפון..."
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
            />

            {/* Filter */}
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">כל המנויים</option>
              <option value="paying">מנויים בתשלום בלבד</option>
              <option value="trialExpired">אי שדרוג לאחר שבוע</option>
              <option value="freemium">חינמי בלבד</option>
              <option value="pro">פרו (₪89)</option>
              <option value="premium">פרימיום (₪149)</option>
              <option value="unlimited">ללא הגבלה</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="py-3 px-4">שם ופרטי לקוח</th>
                <th className="py-3 px-4">טלפון</th>
                <th className="py-3 px-4">תאריך הרשמה</th>
                <th className="py-3 px-4">סטטוס שבוע ניסיון</th>
                <th className="py-3 px-4">קרוסלות שנוצרו</th>
                <th className="py-3 px-4">סוג מנוי נוכחי</th>
                <th className="py-3 px-4">תמונות AI</th>
                <th className="py-3 px-4">פעולה מהירה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    לא נמצאו לקוחות התואמים את החיפוש
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors">
                    {/* Name & Email */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {customer.name || 'ללא שם'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400" dir="ltr">
                        {customer.email}
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                      {customer.phone ? (
                        <span dir="ltr">{customer.phone}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">לא הוזן</span>
                      )}
                    </td>

                    {/* Registration Date */}
                    <td className="py-4 px-4 text-gray-600 dark:text-gray-300">
                      <div>{new Date(customer.createdAt).toLocaleDateString('he-IL')}</div>
                      <div className="text-xs text-gray-400">לפני {customer.daysSinceRegistration} ימים</div>
                    </td>

                    {/* Trial Status */}
                    <td className="py-4 px-4">
                      {customer.plan !== 'freemium' && customer.plan !== 'free' ? (
                        <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-bold px-2.5 py-1 rounded-full">
                          מנוי בתשלום
                        </span>
                      ) : customer.isTrialActive ? (
                        <span className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs font-bold px-2.5 py-1 rounded-full">
                          שבוע ניסיון פעיל (5 בונוס)
                        </span>
                      ) : (
                        <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full">
                          הסתיים שבוע ללא שדרוג
                        </span>
                      )}
                    </td>

                    {/* Carousels Count */}
                    <td className="py-4 px-4 font-bold text-gray-900 dark:text-white">
                      {customer.carouselsCount}
                    </td>

                    {/* Plan Selector */}
                    <td className="py-4 px-4">
                      <select
                        disabled={updatingId === customer.id}
                        value={customer.plan}
                        onChange={(e) => handleUpdatePlan(customer.workspaceId, e.target.value, customer.id)}
                        className="text-xs font-bold py-1.5 px-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="freemium">חינמי (Freemium)</option>
                        <option value="pro">פרו (₪89)</option>
                        <option value="premium">פרימיום (₪149)</option>
                        <option value="unlimited">ללא הגבלה (Unlimited)</option>
                      </select>
                    </td>

                    {/* AI Images Toggle */}
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        disabled={updatingId === customer.id}
                        onClick={() => handleToggleImageGen(customer.workspaceId, !customer.aiImageGenEnabled, customer.id)}
                        className={`text-xs px-2.5 py-1 font-bold rounded-full transition-colors flex items-center gap-1 ${
                          customer.aiImageGenEnabled || customer.plan === 'premium' || customer.plan === 'unlimited'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200'
                        }`}
                        title={customer.plan === 'premium' || customer.plan === 'unlimited' ? 'זכאי מובנה לפי מנוי' : 'הפעל/בטל ידנית'}
                      >
                        {customer.aiImageGenEnabled || customer.plan === 'premium' || customer.plan === 'unlimited'
                          ? '✨ פעיל'
                          : 'מנוטרל'}
                      </button>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4">
                      {customer.plan === 'freemium' || customer.plan === 'free' ? (
                        <button
                          disabled={updatingId === customer.id}
                          onClick={() => handleUpdatePlan(customer.workspaceId, 'pro', customer.id)}
                          className="text-xs px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 font-bold rounded transition-colors disabled:opacity-50"
                        >
                          {updatingId === customer.id ? 'מעדכן...' : 'שדרג לפרו'}
                        </button>
                      ) : (
                        <span className="text-xs text-green-600 font-bold">פעיל ✓</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
