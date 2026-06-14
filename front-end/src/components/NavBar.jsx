import React from 'react';
import { Search, User } from 'lucide-react';

export default function Navbar({ username }) {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md px-8 flex items-center justify-between z-20 shrink-0">
      <div className="flex items-center gap-4 w-96">
        <Search className="h-4 w-4 text-slate-500" />
        <input type="text" placeholder="Global search..." className="bg-transparent border-none text-sm outline-none w-full text-slate-300 placeholder-slate-500" />
      </div>
      
      <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
        <div className="text-right">
          <p className="text-xs font-bold text-slate-200">{username}</p>
          <p className="text-[10px] text-emerald-400 font-mono uppercase">Pro User</p>
        </div>
        <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 font-bold text-sm">
          <User className="h-4 w-4" />
        </div>
      </div>
    </header>
  );
}