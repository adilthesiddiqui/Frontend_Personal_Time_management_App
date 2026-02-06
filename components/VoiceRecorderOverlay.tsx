import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, X, AlertCircle } from 'lucide-react';
import { parseMessyInput, generateChecklistForTask } from '../services/geminiService';
import { Task, Category } from '../types';

interface VoiceRecorderOverlayProps {
  onClose: () => void;
  onTasksGenerated: (tasks: Task[]) => void;
}

export const VoiceRecorderOverlay: React.FC<VoiceRecorderOverlayProps> = ({ onClose, onTasksGenerated }) => {
  const [status, setStatus] = useState<'requesting' | 'recording' | 'processing' | 'error'>('requesting');
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    startRecording();
    return () => {
       if (recognitionRef.current) {
          recognitionRef.current.stop();
       }
    };
  }, []);

  const startRecording = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition not supported.");
      setStatus('error');
      return;
    }

    try {
      setStatus('requesting');
      
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setStatus('recording');
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        // 'no-speech' happens if user is silent for a while in some browsers
        if (event.error === 'no-speech') return; 

        console.error("Microphone error:", event.error);
        if (event.error === 'not-allowed') {
           setError("Permission denied.");
        } else {
           setError("Recognition error.");
        }
        setStatus('error');
      };

      recognition.onend = () => {
         // If we are still 'recording' state, it stopped unexpectedly (or silence).
         // We'll handle manual stop separately.
      };

      recognitionRef.current = recognition;
      recognition.start();

    } catch (err) {
      console.error("Microphone error:", err);
      setError("Could not access microphone.");
      setStatus('error');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      processText(transcript);
    }
  };

  const processText = async (text: string) => {
    if (!text.trim()) {
      setStatus('error');
      setError("No speech detected. Try again.");
      return;
    }

    setStatus('processing');
    
    try {
      // 1. Parse Text Tasks
      const rawTasks = await parseMessyInput(text);
      
      // 2. Enhance tasks
      const enhancedTasks: Task[] = await Promise.all(rawTasks.map(async (t) => {
        const checklist = await generateChecklistForTask(t.title, t.category);
        return {
          id: crypto.randomUUID(),
          title: t.title,
          description: t.description,
          dueDate: t.dueDate,
          dueTime: t.dueTime,
          category: t.category as Category,
          priority: t.priority as 'high' | 'medium' | 'low',
          status: 'pending',
          checklist: checklist,
          recurrence: (t.recurrence as any) || 'none',
          documents: []
        };
      }));
      
      onTasksGenerated(enhancedTasks);
      onClose();
    } catch (err) {
       console.error(err);
       setError("Failed to understand. Try again?");
       setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl relative flex flex-col items-center text-center">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-6 relative">
          {status === 'recording' && (
             <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
          )}
          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white shadow-xl transition-colors
            ${status === 'recording' ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30' : 
              status === 'processing' ? 'bg-slate-800' : 'bg-slate-200 text-slate-400'}
          `}>
             {status === 'processing' ? (
               <Loader2 size={40} className="animate-spin" />
             ) : (
               <Mic size={40} />
             )}
          </div>
        </div>

        <h3 className="text-2xl font-bold text-slate-800 mb-2">
          {status === 'requesting' && "Accessing Mic..."}
          {status === 'recording' && "Listening..."}
          {status === 'processing' && "Thinking..."}
          {status === 'error' && "Oops!"}
        </h3>
        
        <div className="text-slate-500 mb-8 h-20 overflow-y-auto px-2 w-full flex items-center justify-center">
           <p className="text-sm leading-relaxed">
            {status === 'recording' 
              ? (transcript || "Say your task naturally...") 
              : status === 'processing' 
                 ? "Analyzing your request..." 
                 : error || "Ready when you are."}
           </p>
        </div>

        {status === 'recording' && (
          <button 
            onClick={stopRecording}
            className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95"
          >
            <Square size={16} fill="currentColor" /> Stop & Create
          </button>
        )}

        {status === 'error' && (
          <button 
            onClick={() => { setError(null); startRecording(); }}
            className="w-full py-3.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};