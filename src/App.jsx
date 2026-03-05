import React, { useState } from 'react';
import { 
  Send, 
  Sparkles, 
  Copy, 
  Loader2, 
  History, 
  Check,
  CheckCircle2,
  PenLine,
  Trash2,
  AlertCircle
} from 'lucide-react';

// This function checks Vite's environment variables for the API Key
const getApiKey = () => {
  try {
    // Standard Vite environment variable lookup
    return import.meta.env.VITE_GEMINI_API_KEY || "";
  } catch (e) {
    return "";
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('write');
  const [tone, setTone] = useState('Professional');
  const [promptInput, setPromptInput] = useState('');
  const [proofreadInput, setProofreadInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [history, setHistory] = useState([]);
  const [copyStatus, setCopyStatus] = useState(null);

  const tones = [
    { name: 'Professional', emoji: '💼' },
    { name: 'Friendly', emoji: '😊' },
    { name: 'Formal', emoji: '🎩' },
    { name: 'Casual', emoji: '✌️' }
  ];

  const handleAction = async (mode) => {
    const apiKey = getApiKey();
    const input = mode === 'write' ? promptInput : proofreadInput;
    
    if (!input) return;
    
    setLoading(true);
    setResult(null);
    setErrorDetails(null);

    // 1. Check if Key is present
    if (!apiKey || apiKey.trim().length < 5) {
      setErrorDetails("Missing API Key: The 'VITE_GEMINI_API_KEY' variable is not found. Ensure it is added to Vercel Settings -> Environment Variables and you have Redeployed.");
      setLoading(false);
      return;
    }

    const systemPrompt = mode === 'write' 
      ? `You are EmailMate AI. Write a high-quality email in a ${tone} tone about: ${input}. Plain text only.` 
      : `You are EmailMate AI. Proofread and improve the following text for grammar, clarity, and impact: ${input}. Plain text only.`;

    try {
      // Using the latest supported Gemini Flash model
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }]
        })
      });

      const data = await response.json();

      // 2. Handle Google API Specific Errors
      if (!response.ok) {
        const msg = data.error?.message || response.statusText;
        setErrorDetails(`Google API Error (${response.status}): ${msg}`);
        setLoading(false);
        return;
      }
      
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        setErrorDetails("Empty Response: The AI did not return any text. Try rephrasing your request.");
        setLoading(false);
        return;
      }
      
      setResult(text);
      setHistory([{ 
        id: Date.now(), 
        mode: mode === 'write' ? 'Draft' : 'Proofread', 
        title: input.substring(0, 30) + "...", 
        text 
      }, ...history]);
    } catch (err) {
      setErrorDetails(`Connection Error: ${err.message}. This might be a temporary network issue.`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const currentApiKey = getApiKey();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-12 font-sans text-slate-800">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header with Debug Status */}
        <div className="bg-indigo-600 p-8 text-white text-center">
          <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <Send size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">EmailMate AI</h1>
          <div className="mt-2 flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${currentApiKey ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">
              {currentApiKey ? "API Key Connected" : "API Key Not Found"}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          {[
            { id: 'write', label: 'Write', icon: <PenLine size={16} /> },
            { id: 'proofread', label: 'Proofread', icon: <CheckCircle2 size={16} /> },
            { id: 'history', label: 'History', icon: <History size={16} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setResult(null); setErrorDetails(null); }}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${activeTab === tab.id ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="p-6 md:p-10">
          
          {/* Detailed Error Box */}
          {errorDetails && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 text-red-700 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="shrink-0 text-red-500" size={20} />
              <div>
                <p className="font-bold">Generation Failed</p>
                <p className="opacity-90">{errorDetails}</p>
              </div>
            </div>
          )}

          {activeTab === 'write' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Tone</label>
                <div className="flex flex-wrap gap-2">
                  {tones.map(t => (
                    <button
                      key={t.name}
                      onClick={() => setTone(t.name)}
                      className={`px-4 py-2 rounded-xl border text-sm flex items-center gap-2 transition-all ${tone === t.name ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {t.emoji} {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700">Instructions</label>
                <textarea 
                  rows={4}
                  className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 text-sm"
                  placeholder="e.g. Ask for a progress update on the project..."
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                />
              </div>

              <button 
                onClick={() => handleAction('write')}
                disabled={loading || !promptInput}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-100"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                Generate Email
              </button>
            </div>
          )}

          {activeTab === 'proofread' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700">Text to Improve</label>
                <textarea 
                  rows={6}
                  className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 text-sm"
                  placeholder="Paste your rough draft here..."
                  value={proofreadInput}
                  onChange={(e) => setProofreadInput(e.target.value)}
                />
              </div>

              <button 
                onClick={() => handleAction('proofread')}
                disabled={loading || !proofreadInput}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-100"
              >
                {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />}
                Polish & Fix
              </button>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
               {history.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
                  <p className="text-slate-400 text-sm">No activity recorded yet.</p>
                </div>
              ) : (
                history.map(item => (
                  <div key={item.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50 relative group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">
                        {item.mode}
                      </span>
                      <button onClick={() => copyToClipboard(item.text, item.id)} className="text-slate-400 hover:text-indigo-600">
                        {copyStatus === item.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{item.text}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* AI Output Result Card */}
          {result && activeTab !== 'history' && (
            <div className="mt-8 p-6 bg-slate-900 rounded-2xl text-slate-100 relative animate-in zoom-in-95 duration-300">
               <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
                 <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">AI Output</span>
                 <button onClick={() => copyToClipboard(result, 'current')} className="flex items-center gap-2 text-xs font-bold hover:text-indigo-400 transition-all">
                  {copyStatus === 'current' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  Copy to Clipboard
                </button>
               </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed pr-2">
                {result}
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="mt-8 text-slate-400 text-[10px] tracking-widest uppercase text-center">
        EmailMate AI v2.6 • Google Gemini API Integration
      </p>
    </div>
  );
}
