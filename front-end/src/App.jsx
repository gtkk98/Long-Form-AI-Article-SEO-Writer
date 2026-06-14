import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Generator from './pages/Generator';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import History from './pages/History';
import Saved from './pages/Saved';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [currentView, setCurrentView] = useState("generate");
  const [historyLogs, setHistoryLogs] = useState([]);

  const handleLoginSuccess = (user) => {
    setUsername(user);
    setIsLoggedIn(true);
  };

  const handleNewGeneration = (newPrompt) => {
    setHistoryLogs((prev) => [newPrompt, ...prev]);
  };

  // If session is unauthenticated, switch compilation context exclusively to login
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex overflow-hidden font-sans">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        onLogout={() => setIsLoggedIn(false)} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar username={username} />
        
        <main className="flex-1 p-8">
          {currentView === "generate" && <Generator onNewGeneration={handleNewGeneration} />}
          {currentView === "dashboard" && <Dashboard />}
          {currentView === "categories" && <Categories />}
          {currentView === "history" && <History historyLogs={historyLogs} />}
          {currentView === "saved" && <Saved />}
        </main>
      </div>
    </div>
  );
}