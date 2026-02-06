import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Delete Task", 
  message = "Are you sure you want to delete this task? This action cannot be undone." 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm mx-4 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-slate-100">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center space-y-4 pt-2">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2 ring-8 ring-red-50/50">
            <AlertTriangle size={32} />
          </div>
          
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed px-2">{message}</p>

          <div className="flex gap-3 w-full pt-6">
            <button 
              onClick={onClose}
              className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 py-3.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all active:scale-95"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};