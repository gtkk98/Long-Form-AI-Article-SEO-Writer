// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';

export default function History({ onSelectArticle }) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch("http://127.0.0.1:8001/api/v1/users/history", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setHistory(data);
        }
      } catch (err) {
        console.error("Failed to fetch history archive:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-white tracking-tight">Execution History</h2>
        <p className="text-slate-400 text-sm mt-1">A chronological record of all AI generations and prompt triggers.</p>
      </div>

      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/50 border-b border-slate-800 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              <th className="px-6 py-4">Article Reference</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {history.map((item) => (
              <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-200 line-clamp-1 group-hover:text-white transition-colors">
                      {item.prompt}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 mt-0.5">UUID: {item.id}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-tighter ${
                    item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 
                    item.status === 'failed' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400 animate-pulse'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => onSelectArticle(item)}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 cursor-pointer transition-colors"
                  >
                    View Draft →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {!isLoading && history.length === 0 && (
          <div className="p-12 text-center text-slate-500 italic text-sm">
            No localized operations recorded within this execution matrix.
          </div>
        )}
        
        {isLoading && <div className="p-12 text-center text-slate-500 animate-pulse text-sm">Decrypting archives...</div>}
      </div>
    </div>
  );
}