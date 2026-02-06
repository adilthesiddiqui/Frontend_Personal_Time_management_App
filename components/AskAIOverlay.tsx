import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, X, MessageSquare, Loader2, Volume2, Square } from 'lucide-react';
import { askAboutTasks } from '../services/geminiService';
import { Task } from '../types';

interface AskAIOverlayProps {
  tasks: Task[];
  onClose: () => void;
}

export const AskAIOverlay: React.FC<AskAIOverlayProps> = ({ tasks, onClose }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleAsk = async (text: string) => {
    if (!text.trim()) return;
    setIsLoading(true);
    setResponse(null);
    try {
      const answer = await askAboutTasks(text, tasks);
      setResponse(answer);
      playResponse(answer);
    } catch (e) {
      setResponse("Sorry, something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const playResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any previous speech
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        // Since we don't have STT in this specific component without calling another API,
        // We will assume for this "Ask" feature we might need STT. 
        // However, for simplicity and speed, let's use the browser's native SpeechRecognition if available,
        // or just fallback to the Gemini Audio Model if we reused the parser.
        // Given the constraints, let's try to just capture text for now or mock it? 
        // Actually, the prompt implies "Ask...". Let's use the Gemini Audio Parser we already have but adapt it for simple query?
        // No, let's stick to text for the input unless we reuse the heavy audio parser.
        // BUT: The user specifically asked for "Audio message auto-played" and "When user asks...".
        // Let's implement a simple SpeechRecognition for the input if supported (Chrome/Safari), 
        // otherwise rely on typing.
        
        // For this demo, let's stick to text input primarily to ensure reliability, 
        // but since I added a Mic button, I should probably handle it.
        // I will reuse the `parseAudioInput` from geminiService but prompt it to transcribe.
        // Or simpler: Just use Web Speech API for recognition.
      };
      
      // Using Web Speech API for faster interaction for queries
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.start();
        setIsRecording(true);
        
        recognition.onresult = (event: any) => {
           const transcript = event.results[0][0].transcript;
           setQuery(transcript);
           handleAsk(transcript);
           setIsRecording(false);
        };
        
        recognition.onerror = () => {
           setIsRecording(false);
        };
        
        recognition.onend = () => {
           setIsRecording(false);
        };
      } else {
        alert("Voice input not supported in this browser. Please type.");
      }

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg mx-4 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xl">
             <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center">?</div>
             Ask Assistant
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="p-6 min-h-[200px] max-h-[40vh] overflow-y-auto flex flex-col gap-4 bg-white">
           {response ? (
             <div className="flex gap-3">
               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex-shrink-0 flex items-center justify-center text-white">
                 <Volume2 size={16} />
               </div>
               <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none text-slate-700 leading-relaxed text-lg">
                 {response}
               </div>
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center h-full text-slate-400 py-8">
               <MessageSquare size={48} className="mb-4 opacity-20" />
               <p>Ask "When is my Ejari renewal?"</p>
               <p>or "When did I pay DEWA?"</p>
             </div>
           )}
           
           {isLoading && (
              <div className="flex justify-center py-4">
                 <Loader2 className="animate-spin text-teal-500" size={32} />
              </div>
           )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
           <div className="flex gap-2">
             <button
               onClick={startRecording}
               disabled={isLoading}
               className={`p-3 rounded-xl transition-all flex-shrink-0
                 ${isRecording 
                   ? 'bg-red-500 text-white animate-pulse' 
                   : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'}
               `}
             >
               {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
             </button>
             <form 
               className="flex-1 flex gap-2"
               onSubmit={(e) => { e.preventDefault(); handleAsk(query); }}
             >
               <input
                 ref={inputRef}
                 type="text"
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 placeholder="Type your question..."
                 className="flex-1 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-700"
               />
               <button 
                 type="submit"
                 disabled={isLoading || !query.trim()}
                 className="p-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors"
               >
                 <Send size={20} />
               </button>
             </form>
           </div>
        </div>

      </div>
    </div>
  );
};