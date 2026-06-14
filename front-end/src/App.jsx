import { useState } from 'react'
import ReactMarkdown from 'react-markdown';

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
    setArticleStatus(null); // Reset on new request

    try {
      const response = await fetch("http://127.0.0.1:8001/api/v1/articles/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: prompt}),
      });

      const data = await response.json();
      setResponseMsg(`Success! Task ID: ${data.task_id} | Backend says: ${data.message}`);
      setCurrentTaskId(data.task_id); // Save the ID for later
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      setResponseMsg("Error: Failed to reach backend.");
    } finally {
      setIsLoading(false);
    }
  }

  const checkStatus = async () => {
    if(!currentTaskId) return;

    try{
      const response = await fetch(`http://127.0.0.1:8001/api/v1/articles/${currentTaskId}`);
      if (response.ok) {
        const data = await response.json();
        setArticleStatus(data)
      } else {
        setResponseMsg("Error: Article not found.");
      }
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      setResponseMsg("Error checking status.");
    }
  }

  return (
    <div className="min-h-screen bg-teal-900 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-teal-950 rounded-xl shadow-lg p-8">
        
        <h1 className="text-3xl font-bold text-white mb-2">LexiFlow AI</h1>
        <p className="text-gray-500 mb-6">Enter a topic to generate a 2,000-word SEO article.</p>
        
        <textarea 
          className="text-white placeholder-white w-full border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-lime-500 outline-none resize-none mb-4"
          rows="4"
          placeholder="e.g., The ultimate guide to beginner rock climbing..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        ></textarea>

        <button 
          onClick={handleGenerate}
          disabled={isLoading || !prompt}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:bg-teal-300"
        >
          {isLoading ? "Sending..." : "Generate Article"}
        </button>

        {responseMsg && (
          <div className="mt-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg">
            {responseMsg}
          </div>
        )}

        {/* NEW UI: Check Status Section */}
        {currentTaskId && (
          <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Task ID: {currentTaskId}</h3>
            <button 
              onClick={checkStatus}
              className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              Check Database Status
            </button>
            
            {articleStatus && (
              <div className="mt-4 text-sm text-gray-700">
                <p><strong>Status:</strong> <span className={`uppercase font-bold ${articleStatus.status === 'completed' ? 'text-green-600' : 'text-blue-600'}`}>{articleStatus.status}</span></p>
                <p><strong>Prompt Saved:</strong> {articleStatus.prompt}</p>
              </div>
            )}
          </div>
        )}

        {/* NEW UI: The Rendered Article */}
        {articleStatus && articleStatus.status === 'completed' && articleStatus.content && (
          <div className="mt-8 p-8 bg-white border border-gray-200 rounded-xl shadow-sm">
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