import React, { useState } from 'react';
import { Category, Task, Recurrence } from '../types';
import { generateChecklistForTask } from '../services/geminiService';
import { Loader2, Save, Repeat, Calendar, Tag, AlertCircle, Clock } from 'lucide-react';

interface QuickAddProps {
  onAdd: (task: Task) => void;
  onCancel: () => void;
}

export const QuickAdd: React.FC<QuickAddProps> = ({ onAdd, onCancel }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<Category>(Category.OTHER);
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    setIsSaving(true);

    try {
      const checklist = await generateChecklistForTask(title, category);
      const newTask: Task = {
        id: crypto.randomUUID(),
        title,
        dueDate: date,
        dueTime: time || undefined,
        category,
        priority,
        recurrence,
        status: 'pending',
        checklist,
        documents: []
      };

      onAdd(newTask);
    } catch (error) {
       console.error("Error creating task", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 md:p-8 border border-white/50">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800">New Task</h2>
          <p className="text-slate-400 text-sm">Fill in the details below.</p>
        </header>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">What needs doing?</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Vehicle Registration Renewal"
              className="w-full p-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-teal-500/20 text-lg font-medium text-slate-800 placeholder:text-slate-300 transition-all outline-none"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                <Calendar size={12} /> Due Date
              </label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-teal-500/20 text-slate-700 outline-none"
                required
              />
            </div>
             <div className="space-y-2">
              <label className="flex items-center gap-1 text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                <Clock size={12} /> Time (Optional)
              </label>
              <input 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-teal-500/20 text-slate-700 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                <Tag size={12} /> Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-teal-500/20 text-slate-700 outline-none appearance-none"
              >
                {Object.values(Category).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
             <div className="space-y-2">
              <label className="flex items-center gap-1 text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                <AlertCircle size={12} /> Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-teal-500/20 text-slate-700 outline-none appearance-none"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-1 text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
              <Repeat size={12} /> Repeat
            </label>
             <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as Recurrence)}
              className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-teal-500/20 text-slate-700 outline-none appearance-none"
            >
              <option value="none">No Repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="pt-6 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-4 rounded-xl font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-slate-900 text-white rounded-xl hover:bg-black transition-all font-semibold flex justify-center items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {isSaving ? 'Creating...' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};