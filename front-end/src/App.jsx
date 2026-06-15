import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Sidebar from './components/SideBar';
import Navbar from './components/NavBar';
import Dashboard from './pages/Dashboard';
import Saved from './pages/Saved';
import History from './pages/History';
import Categories from './pages/Categories';
import Generate from './pages/Generate';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [currentView, setCurrentView] = useState('dashboard'); // Default view
  const [articleToOpen, setArticleToOpen] = useState(null); // State to hold article selected from Saved

  useEffect(() => {
    // Check for token on initial load
    const token = localStorage.getItem('token');
    if (token) {
      // In a real app, you'd validate the token with the backend
      // For now, we'll assume a token means logged in and try to get username
      // This is a simplified approach. A more robust solution would involve decoding JWT or a /me endpoint.
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        setUsername(payload.sub); // 'sub' is typically the subject, often username
        setIsLoggedIn(true);
      } catch (e) {
        console.error("Invalid token:", e);
        localStorage.removeItem('token');
        setIsLoggedIn(false);
      }
    }
  }, []);

  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true);
    setUsername(user);
    setCurrentView('dashboard'); // Redirect to dashboard after login
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUsername('');
    setCurrentView('dashboard'); // Reset view on logout
    setArticleToOpen(null); // Clear any selected article
  };

  const handleSelectArticleFromSaved = (article) => {
    setArticleToOpen(article); // Set the article to be opened in Dashboard
    setCurrentView('dashboard'); // Switch to Dashboard view
  };

  const handleClearActiveArticle = () => {
    setArticleToOpen(null); // Clear the active article when user goes back to generator
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col">
        <Navbar username={username} />
        <main className="flex-1 overflow-y-auto p-8">
          {currentView === 'dashboard' && (
            <Dashboard activeArticle={articleToOpen} onClearActiveArticle={handleClearActiveArticle} />
          )}
          {currentView === 'saved' && (
            <Saved onSelectArticle={handleSelectArticleFromSaved} />
          )}
          {currentView === 'history' && (
            <History onSelectArticle={handleSelectArticleFromSaved} />
          )}
          {currentView === 'categories' && (
            <Categories onSelectArticle={handleSelectArticleFromSaved} />
          )}
          {/* The 'generate' view can also point to the Dashboard without an active article */}
          {currentView === 'generate' && (
            <Generate onArticleGenerated={handleSelectArticleFromSaved} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;