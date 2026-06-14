import React from 'react';
import { TrendingUp } from 'lucide-react';
export default function Dashboard() {
  return (
    <div className="max-w-5xl mx-auto p-6 bg-slate-900/80 rounded-2xl border border-slate-800">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><TrendingUp className="text-blue-500" /> Analytics Summary</h2>
      <p className="text-slate-400 text-sm">System optimization stable. Historical generation efficiency at 98.4%.</p>
    </div>
  );
}