// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';

export default function Saved({ onSelectArticle }) {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSavedArticles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch("http://127.0.0.1:8001/api/v1/users/history", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Show only articles where is_saved is true
        setArticles(data.filter(a => a.is_saved));
      }
    } catch (err) {
      console.error("Failed to fetch saved articles:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedArticles();
  }, []);

  const handleToggleSave = async (articleId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://127.0.0.1:8001/api/v1/articles/${articleId}/toggle-save`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (response.ok) fetchSavedArticles(); // Refresh list to remove the unsaved item
  };

  const handleDelete = async (articleId) => {
    if (!window.confirm("Permanently delete this saved draft?")) return;
    const token = localStorage.getItem('token');
    const response = await fetch(`http://127.0.0.1:8001/api/v1/articles/${articleId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (response.ok) fetchSavedArticles();
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Scanning the vault...</div>;
  }

  // If the user hasn't saved anything yet, show your placeholder design
  if (!articles || articles.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center bg-slate-900/80 rounded-2xl border border-slate-800 py-16">
        <p className="text-slate-500 text-sm italic">
          Bookmark specific outputs inside workspace nodes to map content records dynamically here.
        </p>
      </div>
    );
  }

  // If there are articles, dynamically map them into a grid layout
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-black text-white tracking-tight">Saved Articles</h1>
        <p className="text-xs text-slate-400 mt-1">Access or modify high-priority content copy drafts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.map((article) => (
          <div 
            key={article.id} 
            className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-all"
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-mono text-slate-500">
                  ID: {article.id.slice(0, 8)}
                </span>
                <span className="bg-amber-500/10 text-amber-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  ★ Saved
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-200 line-clamp-2 leading-snug">
                {article.prompt}
              </h3>
            </div>

            {/* CARD ACTIONS */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-900">
              <button 
                onClick={() => onSelectArticle(article)}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                Open Draft →
              </button>
              
              <div className="flex space-x-3 text-xs">
                <button 
                  onClick={() => handleToggleSave(article.id)}
                  className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  ★ Unsave
                </button>
                <button 
                  onClick={() => handleDelete(article.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}