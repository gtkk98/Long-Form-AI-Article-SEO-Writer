// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';

export default function Categories({ onSelectArticle }) {
  const [articles, setArticles] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch("http://127.0.0.1:8001/api/v1/users/history", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setArticles(data);
        }
      } catch (err) {
        console.error("Failed to fetch articles for categories:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const categories = [
    { id: 'all', name: 'All Modules' },
    { id: 'completed', name: 'Final Drafts' },
    { id: 'processing', name: 'Active Tasks' },
    { id: 'failed', name: 'Failed Nodes' },
  ];

  const filteredArticles = filter === 'all' 
    ? articles 
    : articles.filter(a => a.status === filter);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Structural Taxonomy Matrix</h2>
        <p className="text-slate-400 text-sm mt-1">Organize and filter your generated intelligence assets by state.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl w-fit">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === cat.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredArticles.map((article) => (
          <div key={article.id} className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-all flex flex-col justify-between h-48 group">
            <div>
              <span className="text-[10px] font-mono text-slate-500 block mb-2">NODE_ID: {article.id.slice(0, 8)}</span>
              <h3 className="text-sm font-bold text-slate-200 line-clamp-3 leading-snug group-hover:text-white">{article.prompt}</h3>
            </div>
            <button 
              onClick={() => onSelectArticle(article)}
              className="mt-4 text-xs font-bold text-blue-500 hover:text-blue-400 text-left cursor-pointer transition-colors"
            >
              Open Document →
            </button>
          </div>
        ))}
      </div>

      {!isLoading && filteredArticles.length === 0 && (
        <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
          <p className="text-slate-600 italic text-sm">No articles match the current filter criteria.</p>
        </div>
      )}
      
      {isLoading && <div className="text-center text-slate-500 animate-pulse py-10">Reconstructing matrix...</div>}
    </div>
  );
}