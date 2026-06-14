import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function Generator({ onNewGeneration }) {
  const [prompt, setPrompt] = useState("");
  const [responseMsg, setResponseMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [articleStatus, setArticleStatus] = useState(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    setResponseMsg("");
    setArticleStatus(null);
    setCurrentTaskId(null);

    try {
      const response = await fetch("http://127.0.0.1:8001/api/v1/articles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await response.json();
      setResponseMsg(`Successfully queued! Generating article...`);
      setCurrentTaskId(data.task_id);
      onNewGeneration(prompt);
    } catch (error) {
      setResponseMsg("Error: Failed to reach backend.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentTaskId) return;
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8001/api/v1/articles/${currentTaskId}`);
        if (response.ok) {
          const data = await response.json();
          setArticleStatus(data);
          if (data.status === 'completed' || data.status === 'failed') {
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [currentTaskId]);

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-8 text-slate-950 border border-white/20">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Production Pipeline</h2>
        <p className="text-xs text-slate-500 mt-1">Generate long-form structured copies instantly.</p>
      </div>
      
      <textarea 
        className="w-full border border-slate-200 rounded-xl p-4 outline-none resize-none mb-4 text-black bg-slate-50/50 text-sm"
        rows="4" placeholder="What should your article be about?..."
        value={prompt} onChange={(e) => setPrompt(e.target.value)}
      />

      <button onClick={handleGenerate} disabled={isLoading || !prompt} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all cursor-pointer disabled:bg-blue-300">
        {isLoading ? "Enqueuing task..." : "Generate Article"}
      </button>

      {responseMsg && <div className="mt-4 p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-sm font-medium">✓ {responseMsg}</div>}

      {currentTaskId && (
        <div className="mt-4 p-5 border border-slate-100 rounded-xl bg-slate-50/80">
          <p className="text-xs font-mono text-slate-400">Stream: {currentTaskId.slice(0,8)}...</p>
          {articleStatus && (
            <p className="text-xs text-slate-700 mt-1 font-bold">
              Worker Status: <span className="uppercase text-blue-600">{articleStatus.status}</span>
            </p>
          )}
        </div>
      )}

      {articleStatus?.status === 'completed' && articleStatus.content && (
        <div className="mt-6 p-6 bg-white border border-slate-100 rounded-xl max-h-[400px] overflow-y-auto">
          <article className="prose prose-slate prose-sm max-w-none">
            <ReactMarkdown>{articleStatus.content}</ReactMarkdown>
          </article>
        </div>
      )}
    </div>
  );
}