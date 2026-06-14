import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onLoginSuccess(username);
    }
  };

  return (
    <div className="min-h-screen w-full relative bg-slate-950 flex items-center justify-center p-6 overflow-hidden">
      
      {/* BULLETPROOF CSS ANIMATED BACKGROUND (Replaces Spline) */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-purple-600/20 blur-[100px] animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/10 text-white animate-fadeIn z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-blue-500/20 text-blue-400 rounded-xl mb-3 border border-blue-500/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">LexiFlow AI</h1>
          <p className="text-sm text-slate-400 mt-1">Sign in to access your dashboard</p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">Username</label>
            <input 
              type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter any name..."
              className="w-full border border-slate-700 rounded-xl px-4 py-3 bg-slate-900/50 text-sm outline-none text-white font-medium focus:border-blue-500 transition-colors placeholder:text-slate-600"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">Password</label>
            <input 
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-slate-700 rounded-xl px-4 py-3 bg-slate-900/50 text-sm outline-none text-white font-medium focus:border-blue-500 transition-colors placeholder:text-slate-600"
            />
          </div>
        </div>

        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all cursor-pointer shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]">
          Sign In
        </button>
      </form>
    </div>
  );
}