import React from 'react';
import { PenTool, LayoutDashboard, Layers, History, Bookmark, LogOut, Sparkles } from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, onLogout }) {
  const menuItems = [
    { id: 'generate', name: 'Generate Article', icon: PenTool },
    { id: 'dashboard', name: 'Dashboard Insights', icon: LayoutDashboard },
    { id: 'categories', name: 'Article Categories', icon: Layers },
    { id: 'history', name: 'User History', icon: History },
    { id: 'saved', name: 'Saved Articles', icon: Bookmark },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between z-20 shrink-0">
      <div>
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <span className="font-black text-lg tracking-tight text-white">LexiFlow Suite</span>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button 
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${currentView === item.id ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"}`}
              >
                <Icon className="h-4 w-4" /> {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-all cursor-pointer">
          <LogOut className="h-4 w-4" /> Log Out
        </button>
      </div>
    </aside>
  );
}