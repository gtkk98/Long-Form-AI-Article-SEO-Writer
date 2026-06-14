import React from 'react';
export default function History({ historyLogs }) {
  return (
    <div className="max-w-3xl mx-auto p-6 bg-slate-900/80 rounded-2xl border border-slate-800">
      <h2 className="text-xl font-bold mb-4">Chronological Prompt Execution History</h2>
      <div className="space-y-2">
        {historyLogs.length > 0 ? historyLogs.map((log, i) => (
          <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-sm text-slate-300 font-mono">{log}</div>
        )) : <p className="text-sm text-slate-500 italic">No localized operations recorded within this execution matrix.</p>}
      </div>
    </div>
  );
}