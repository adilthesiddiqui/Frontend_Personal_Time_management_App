import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowRight, Loader2, Quote, Mic, Square } from 'lucide-react';
import { parseMessyInput, generateChecklistForTask } from '../services/geminiService';
import { Task, Category } from '../types';

interface MagicParserProps {
  onTasksGenerated: (tasks: Task[]) => void;
}

export const MagicParser: React.FC<MagicParserProps> = ({ onTasksGenerated }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const enhanceAndAddTasks = async (rawTasks: any[]) => {
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
  };

  const handleProcessText = async () => {
    if (!input.trim()) return;
    setIsProcessing(true);
    setError(null);
    try {
      const parsedTasks = await parseMessyInput(input);
      await enhanceAndAddTasks(parsedTasks);
      setInput('');
    } catch (err) {
      setError("We couldn't quite catch that. Try rephrasing?");
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Please type your tasks.");
      return;
    }

    setError(null);
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript;
          setInput(prev => {
            const needsSpace = prev.length > 0 && !prev.endsWith(' ');
            return prev + (needsSpace ? ' ' : '') + transcript;
          });
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      if (event.error === 'not-allowed') {
        setError("Microphone permission denied.");
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
       <header className="text-center space-y-3">
        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent pb-1">
          Magic Parser
        </h2>
        <p className="text-slate-500 text-lg max-w-md mx-auto">
          Turn your messy thoughts into an organized plan. Type or just say it.
        </p>
      </header>

      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-teal-400 via-purple-400 to-orange-400 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-white rounded-3xl p-2 shadow-2xl ring-1 ring-black/5 overflow-hidden">
          
          {/* Text Input Area */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isRecording && false} /* Allow editing even while recording */
            placeholder={isRecording ? "Listening..." : "e.g. 'I need to finish the quarterly presentation by Friday 3pm and buy groceries for dinner tonight.'"}
            className="w-full h-48 p-6 rounded-2xl resize-none outline-none text-slate-700 placeholder:text-slate-300 text-xl md:text-2xl font-light leading-relaxed bg-transparent"
          />

          {/* Recording Overlay */}
          {isRecording && (
            <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end animate-in fade-in duration-300">
              <div className="flex items-center gap-2 bg-red-50 text-red-500 px-4 py-2 rounded-full mb-2 shadow-sm animate-pulse border border-red-100">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="text-xs font-bold uppercase tracking-wider">Live Recording</span>
              </div>
            </div>
          )}
          
          {/* Controls */}
          <div className="flex justify-between items-center px-4 pb-4 mt-2">
            <div className="flex items-center gap-2">
               {/* Mic Button */}
               {isRecording ? (
                 <button
                   onClick={stopRecording}
                   className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500 text-white hover:bg-red-600 hover:scale-110 transition-all active:scale-95 shadow-lg shadow-red-500/30 animate-pulse"
                   title="Stop Recording"
                 >
                   <Square size={18} fill="currentColor" />
                 </button>
               ) : (
                 <button
                   onClick={startRecording}
                   disabled={isProcessing}
                   className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-500 hover:scale-110 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group/mic"
                   title="Record Audio"
                 >
                   <Mic size={22} />
                 </button>
               )}
              
              <div className="hidden md:flex text-xs text-slate-400 font-medium bg-slate-100 px-3 py-1.5 rounded-full items-center gap-2">
                <Sparkles size={12} className="text-purple-500" />
                Powered by Gemini
              </div>
            </div>
            
            <button
              onClick={handleProcessText}
              disabled={isProcessing || !input.trim() || isRecording}
              className="ml-auto bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-xl font-semibold transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Create Tasks</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center font-medium animate-pulse border border-red-100">
          {error}
        </div>
      )}

      {/* Examples Grid */}
      <div className="pt-8">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-6">Try these examples</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ExampleCard 
            text="Finish the project proposal by Wednesday afternoon and email it to the team." 
            onClick={setInput} 
          />
          <ExampleCard 
            text="Schedule a dentist appointment for next week and pay the electricity bill before the 25th." 
            onClick={setInput} 
          />
        </div>
      </div>
    </div>
  );
};

const ExampleCard = ({ text, onClick }: { text: string, onClick: (s: string) => void }) => (
  <button 
    onClick={() => onClick(text)}
    className="text-left p-5 rounded-2xl bg-white border border-slate-100 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-500/10 transition-all group relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
      <Quote size={40} className="text-teal-500 transform rotate-12" />
    </div>
    <p className="text-slate-600 font-medium leading-relaxed group-hover:text-slate-800 relative z-10">
      "{text}"
    </p>
  </button>
);