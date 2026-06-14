import { useState, useEffect } from 'react' // 1. Imported useEffect
import ReactMarkdown from 'react-markdown'

function App() {
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
        body: JSON.stringify({ prompt: prompt }),
      });
      
      const data = await response.json();
      setResponseMsg(`Successfully queued! Generating article...`);
      setCurrentTaskId(data.task_id);
    } catch (error) {
      setResponseMsg("Error: Failed to reach backend.");
    } finally {
      setIsLoading(false);
    }
  }

  // Separated fetch logic so both the button and the auto-poller can use it
  const checkStatus = async () => {
    if (!currentTaskId) return;
    try {
      const response = await fetch(`http://127.0.0.1:8001/api/v1/articles/${currentTaskId}`);
      if (response.ok) {
        const data = await response.json();
        setArticleStatus(data);
        return data.status; // Return status so the poller knows when to stop
      }
    } catch (error) {
      console.error("Error checking status:", error);
    }
    return null;
  }

  // NEW: The Auto-Polling Engine
  useEffect(() => {
    if (!currentTaskId) return;

    // Don't poll if it's already done or failed
    if (articleStatus?.status === 'completed' || articleStatus?.status === 'failed') {
      return;
    }

    // Set up a timer to check the database every 3 seconds
    const interval = setInterval(async () => {
      const currentStatus = await checkStatus();
      
      // Stop polling instantly if the background worker finishes
      if (currentStatus === 'completed' || currentStatus === 'failed') {
        clearInterval(interval);
      }
    }, 3000);

    // Clean up the timer if the component unmounts
    return () => clearInterval(interval);
  }, [currentTaskId, articleStatus?.status]);

  return (
    <div className="min-h-screen bg-teal-950 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-emerald-900 rounded-xl shadow-lg p-8">
        
        <h1 className="text-3xl font-bold text-emerald-300 mb-2">LexiFlow AI</h1>
        <p className="text-gray-100 mb-6">Enter a topic to generate an SEO optimized article.</p>
        
        <textarea 
          className="placeholder-amber-50 w-full border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-green-500 outline-none resize-none mb-4 text-white"
          rows="4"
          placeholder="e.g., The ultimate guide to beginner rock climbing..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        ></textarea>

        <button 
          onClick={handleGenerate}
          disabled={isLoading || !prompt}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-gray-800 font-semibold py-3 rounded-lg transition-colors disabled:bg-emerald-500 mb-4 cursor-pointer"
        >
          {isLoading ? "Sending..." : "Generate Article"}
        </button>

        {responseMsg && (
          <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg mb-4">
            {responseMsg}
          </div>
        )}

        {currentTaskId && (
          <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Task ID: {currentTaskId}</h3>
              {/* Added a pulsing visual loading indicator for a premium feel */}
              {(!articleStatus || articleStatus.status !== 'completed') && (
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
              )}
            </div>
            
            {articleStatus && (
              <div className="text-sm text-gray-700">
                <p><strong>Status:</strong> <span className={`uppercase font-bold ${articleStatus.status === 'completed' ? 'text-green-600' : 'text-blue-600'}`}>{articleStatus.status}</span></p>
              </div>
            )}
          </div>
        )}

        {articleStatus && articleStatus.status === 'completed' && articleStatus.content && (
          <div className="mt-4 p-8 bg-white border border-gray-200 rounded-xl shadow-sm animate-fadeIn">
            <article className="prose prose-blue max-w-none">
              <ReactMarkdown>{articleStatus.content}</ReactMarkdown>
            </article>
          </div>
        )}

      </div>
    </div>
  )
}

export default App