// eslint-disable-next-line no-unused-vars
import React from 'react';
import Generator from './Generator';
import { Zap, Sparkles } from 'lucide-react';

export default function Generate({ onArticleGenerated }) {
  /**
   * This page is the dedicated "Generation Studio".
   * It allows the user to focus entirely on triggering new AI workflows.
   */
  
  return (
    <div className="max-w-5xl mx-auto space-y-10 py-4 animate-fadeIn">
      {/* HEADER SECTION */}
      <div className="border-b border-slate-800 pb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-600/20 rounded-xl">
            <Zap className="text-blue-500 h-6 w-6 fill-blue-500/20" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Generation Studio</h1>
        </div>
        <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
          Harness high-density neural models to synthesize expert-grade content. 
          Enter your prompt below to initialize a new generation cycle.
        </p>
      </div>

      {/* GENERATOR CORE */}
      <div className="bg-slate-950/30 border border-slate-800/60 rounded-[2rem] p-10 shadow-2xl shadow-blue-900/5 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-8 text-blue-400 font-mono text-xs uppercase tracking-[0.2em]">
          <Sparkles className="h-3 w-3" />
          Neural Interface Active
        </div>
        <Generator onNewGeneration={onArticleGenerated} />
      </div>

      {/* FOOTER TIPS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-500 text-sm italic">
        <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/40">
          💡 Tip: Use descriptive prompts for better semantic structure and SEO results.
        </div>
        <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/40">
          🚀 Resulting drafts are automatically indexed in your Document Vault for later editing.
        </div>
      </div>
    </div>
  );
}