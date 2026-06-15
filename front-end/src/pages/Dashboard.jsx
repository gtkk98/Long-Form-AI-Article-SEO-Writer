// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { TrendingUp, Star, Globe, MessageSquare, BarChart3 } from 'lucide-react';

const ThreeDLoader = () => (
  <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
    <div className="relative w-28 h-28 transform-gpu">
      {/* Outer 3D Shell */}
      <div className="absolute inset-0 rounded-[2rem] border-2 border-blue-500/20 animate-[spin_4s_linear_infinite] rotate-45 transform-gpu shadow-[0_0_15px_rgba(59,130,246,0.1)]"></div>
      {/* Middle Fluid Ring */}
      <div className="absolute inset-3 rounded-full border-b-2 border-l-2 border-indigo-500/60 animate-[spin_2.5s_linear_infinite_reverse] transform-gpu"></div>
      {/* Inner Crystal */}
      <div className="absolute inset-6 rounded-lg border-2 border-cyan-400 animate-[spin_1.5s_linear_infinite] rotate-12 transform-gpu shadow-[0_0_20px_rgba(34,211,238,0.3)]"></div>
      
      {/* Neural Core */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_25px_#fff] animate-pulse"></div>
      </div>
    </div>
    <div className="mt-12 text-center space-y-3">
      <div className="flex flex-col items-center">
        <span className="text-blue-500 font-black text-[11px] uppercase tracking-[0.4em] mb-2">Neural Synthesis</span>
        <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse"></div>
      </div>
      <p className="text-slate-500 text-[10px] font-mono uppercase leading-relaxed">
        Allocating Background Nodes<br />
        <span className="opacity-50">Worker Protocol: Active</span>
      </p>
    </div>
  </div>
);

export default function Dashboard({ activeArticle, onClearActiveArticle }) {
  const [history, setHistory] = useState([]);
  
  // Use the prop directly to derive state or as the initial value.
  // To allow local overrides while respecting prop updates, we track the last seen prop.
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [prevActiveArticle, setPrevActiveArticle] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch("http://127.0.0.1:8001/api/v1/users/history", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
        
        // Keep the currently viewed article data completely synchronized with database changes
        if (selectedArticle) {
          const updatedSelected = data.find(a => a.id === selectedArticle.id);
          if (updatedSelected) setSelectedArticle(updatedSelected);
        }
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Sync with prop changes (e.g., when navigating from Saved page) 
  // by checking during render instead of inside an Effect to avoid cascading renders.
  if (activeArticle !== prevActiveArticle) {
    setPrevActiveArticle(activeArticle);
    setSelectedArticle(activeArticle);
  }


  useEffect(() => {
    fetchHistory();
  }, []);

  // 1. Handle Deleting an Article
  const handleDelete = async (articleId) => {
    if (!window.confirm("Are you sure you want to permanently delete this article?")) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8001/api/v1/articles/${articleId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        setSelectedArticle(null); // Boot reader back to home layout
        fetchHistory(); // Refresh sidebar list
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // 2. Handle Toggling Save/Bookmark
  const handleToggleSave = async (articleId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8001/api/v1/articles/${articleId}/toggle-save`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        fetchHistory(); // Triggers re-sync of selectedArticle and list indicators
      }
    } catch (err) {
      console.error("Toggle save failed:", err);
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white font-sans">
      
      {/* SIDEBAR: History list */}
      <div className="w-80 bg-slate-950 border-r border-slate-800 p-4 flex flex-col h-full">
        <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-4">
          Your Document Vault
        </h3>
        
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loadingHistory ? (
            <p className="text-xs text-slate-500 animate-pulse">Loading archive...</p>
          ) : history.length === 0 ? (
            <p className="text-xs text-slate-600 italic">No articles generated yet.</p>
          ) : (
            history.map((article) => (
              <button
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className={`w-full text-left p-3.5 rounded-xl transition-all border flex flex-col relative cursor-pointer ${
                  selectedArticle?.id === article.id
                    ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                    : 'bg-slate-900 border-slate-800 hover:bg-slate-800/50 text-slate-300'
                }`}
              >
                {/* Visual Bookmark tag inside sidebar items */}
                {article.is_saved && (
                  <span className="absolute top-3 right-3 text-amber-500 text-xs">★</span>
                )}
                
                <span className="text-xs font-mono opacity-40 mb-1">
                  ID: {article.id.slice(0, 8)}
                </span>
                <span className="text-sm font-semibold line-clamp-2 leading-tight pr-4">
                  {article.prompt}
                </span>
                <span className={`text-[10px] uppercase font-extrabold mt-2 ${
                  article.status === 'completed' ? 'text-emerald-500' : 'text-blue-400'
                }`}>
                  • {article.status}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* MAIN CONSOLE STAGE */}
      <div className="flex-1 overflow-y-auto p-8 bg-slate-900">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {selectedArticle ? (
            /* ARCHIVE READER MODE */
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-slate-950 border border-slate-200">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-6">
                <div>
                  <button 
                    onClick={() => {
                      setSelectedArticle(null);
                      if (onClearActiveArticle) onClearActiveArticle();
                    }}
                    className="text-xs font-bold text-blue-600 hover:underline mb-2 block cursor-pointer"
                  >
                    ← Back to Generation Studio
                  </button>
                  <h1 className="text-xl font-bold text-slate-900">
                    Prompt Archive: "{selectedArticle.prompt}"
                  </h1>
                </div>
                
                {/* TOOLBAR CONTROLS */}
                <div className="flex items-center space-x-2">
                  {/* Save Button */}
                  <button
                    onClick={() => handleToggleSave(selectedArticle.id)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      selectedArticle.is_saved
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {selectedArticle.is_saved ? "★ Saved" : "☆ Save"}
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(selectedArticle.id)}
                    className="bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-100 transition-all cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {selectedArticle.status === 'completed' ? (
                <article className="prose prose-slate max-w-none">
                  <ReactMarkdown>{selectedArticle.content}</ReactMarkdown>
                </article>
              ) : selectedArticle.status === 'failed' ? (
                <div className="p-16 text-center bg-rose-50/50 rounded-[2.5rem] border border-rose-100 text-rose-600 backdrop-blur-sm">
                  <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="font-black text-lg">!</span>
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest mb-1">Matrix Link Severed</h3>
                  <p className="text-xs opacity-70 italic">Logic core encountered an unrecoverable exception in the worker pipeline.</p>
                </div>
              ) : (
                <ThreeDLoader />
              )}
            </div>
          ) : (
            /* GENERATOR MODE */
            <div className="space-y-10 animate-fadeIn">
              {/* INSIGHTS HEADER */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-950/50 border border-slate-800 rounded-3xl p-8">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <BarChart3 className="text-blue-500" /> Neural Processing Matrix
                      </h2>
                      <p className="text-slate-500 text-sm">Live visualization of global content generation cycles.</p>
                    </div>
                    <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-full animate-pulse">
                      ● LIVE SYSTEM
                    </span>
                  </div>
                  
                  {/* LIVE CHART BOX (Mock implementation) */}
                  <div className="h-48 flex items-end gap-1 px-2">
                    {[40, 70, 45, 90, 65, 80, 30, 95, 50, 85, 60, 75, 40, 90, 100, 50, 70, 85].map((h, i) => (
                      <div 
                        key={i} 
                        className="flex-1 bg-blue-600/20 hover:bg-blue-500/40 transition-all rounded-t-sm relative group cursor-crosshair"
                        style={{ height: `${h}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-slate-950 text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {h}k Units
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-4 text-[10px] font-mono text-slate-600 uppercase tracking-tighter">
                    <span>00:00 MST</span>
                    <span>08:00 MST</span>
                    <span>16:00 MST</span>
                    <span>23:59 MST</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 shadow-xl shadow-blue-900/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-white/10 rounded-xl">
                        <Star className="text-white h-5 w-5 fill-white" />
                      </div>
                      <span className="text-white/80 text-xs font-bold uppercase tracking-wider">System Trust Rating</span>
                    </div>
                    <div className="text-4xl font-black text-white">4.92<span className="text-lg opacity-50">/5.0</span></div>
                    <p className="text-white/60 text-xs mt-2">Based on 12,400+ validated logic nodes.</p>
                  </div>

                  <div className="bg-slate-950/50 border border-slate-800 rounded-3xl p-6">
                    <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                      <TrendingUp className="h-3 w-3" /> Interesting Verticals
                    </h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Quantum Physics', val: 88, color: 'bg-blue-500' },
                        { label: 'SEO Marketing', val: 72, color: 'bg-emerald-500' },
                        { label: 'Web3 Ethics', val: 45, color: 'bg-amber-500' }
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex justify-between text-[10px] font-bold mb-1">
                            <span className="text-slate-300">{item.label}</span>
                            <span className="text-slate-500">{item.val}%</span>
                          </div>
                          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color}`} style={{ width: `${item.val}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* WORLD FAMOUS ARTICLES & REVIEWS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                {/* WORLD FAMOUS */}
                <section>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-400" /> World Famous Generations
                  </h3>
                  <div className="space-y-4">
                    {[
                      { title: "The Future of Synthetic Biology", likes: "24k", author: "Gen_Node_01" },
                      { title: "Sustainable Architecture in 2050", likes: "19k", author: "Arch_AI" },
                      { title: "Psychology of Neural Networks", likes: "15k", author: "MindFlow" }
                    ].map((art, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-blue-500/50 transition-colors group cursor-pointer">
                        <div className="h-10 w-10 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-500 font-black text-xs">#{idx+1}</div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-slate-200 group-hover:text-white">{art.title}</h4>
                          <p className="text-[10px] text-slate-500">Node: {art.author}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-emerald-400">↑ {art.likes}</div>
                          <div className="text-[9px] text-slate-600 uppercase">Impact</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* PEOPLE REVIEWS */}
                <section>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-purple-400" /> Community Review Stream
                  </h3>
                  <div className="grid grid-cols-1 gap-4 text-slate-400">
                    {[
                      "LexiFlow has completely revolutionized how we approach technical documentation.",
                      "The semantic accuracy of the generated drafts is frighteningly good.",
                      "Finally, an AI writer that understands actual structure, not just keywords."
                    ].map((quote, idx) => (
                      <div key={idx} className="p-5 bg-slate-950/40 rounded-3xl italic text-sm border-l-4 border-blue-600/30">
                        "{quote}"
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}
          
        </div>
      </div>

    </div>
  );
}