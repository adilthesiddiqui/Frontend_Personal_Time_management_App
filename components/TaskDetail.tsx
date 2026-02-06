import React, { useState } from 'react';
import { Task, AttachedDocument, Category } from '../types';
import { X, Calendar, CheckSquare, FileText, Wand2, Loader2, Upload, Trash2, Download, ExternalLink, Repeat, Clock, Pencil, Save } from 'lucide-react';
import { generateChecklistForTask } from '../services/geminiService';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
  onUpdate: (updatedTask: Task) => void;
  onDelete: (id: string) => void;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({ task, onClose, onUpdate, onDelete }) => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit State
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description || '');
  const [editDate, setEditDate] = useState(task.dueDate);
  const [editTime, setEditTime] = useState(task.dueTime || '');
  const [editCategory, setEditCategory] = useState(task.category);
  const [editPriority, setEditPriority] = useState(task.priority);

  const toggleCheckItem = (itemId: string) => {
    const updatedChecklist = task.checklist.map(item => 
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    );
    onUpdate({ ...task, checklist: updatedChecklist });
  };

  const handleRegenerateChecklist = async () => {
    setIsRegenerating(true);
    try {
      const newItems = await generateChecklistForTask(task.title, task.category);
      onUpdate({ ...task, checklist: newItems });
    } catch (e) {
      console.error(e);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSaveEdit = () => {
    onUpdate({
      ...task,
      title: editTitle,
      description: editDesc,
      dueDate: editDate,
      dueTime: editTime || undefined,
      category: editCategory,
      priority: editPriority
    });
    setIsEditing(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(task.id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      alert("File too large for local demo storage (max 500KB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const newDoc: AttachedDocument = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        dataUrl: event.target?.result as string
      };
      const updatedDocs = [...(task.documents || []), newDoc];
      onUpdate({ ...task, documents: updatedDocs });
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteDoc = (docId: string) => {
    if(window.confirm("Remove this document?")) {
      const updatedDocs = (task.documents || []).filter(d => d.id !== docId);
      onUpdate({ ...task, documents: updatedDocs });
    }
  };

  const addToGoogleCalendar = () => {
    const dateStr = task.dueDate.replace(/-/g, '');
    const timeStr = task.dueTime ? `T${task.dueTime.replace(':', '')}00` : '';
    const dates = timeStr ? `${dateStr}${timeStr}/${dateStr}${timeStr}` : `${dateStr}/${dateStr}`;
    const details = `${task.description || ''} \n\nChecklist:\n${task.checklist.map(i => `- ${i.text}`).join('\n')}`;
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(task.title)}&dates=${dates}&details=${encodeURIComponent(details)}`;
    window.open(url, '_blank');
  };

  const downloadICS = () => {
    const dateStr = task.dueDate.replace(/-/g, '');
    const timeStr = task.dueTime ? `T${task.dueTime.replace(':', '')}00` : '';
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART;VALUE=DATE${timeStr ? '-TIME' : ''}:${dateStr}${timeStr}
SUMMARY:${task.title}
DESCRIPTION:${task.description || ''}
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${task.title.replace(/\s+/g, '_')}.ics`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const completedCount = task.checklist.filter(i => i.isCompleted).length;
  const progress = task.checklist.length > 0 ? (completedCount / task.checklist.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="bg-white w-full md:max-w-3xl h-[85vh] md:h-auto md:max-h-[90vh] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col relative overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
        
        {/* Header */}
        <div className="bg-white p-6 md:p-8 border-b border-slate-100 sticky top-0 z-10">
          <div className="flex justify-between items-start mb-4">
             {isEditing ? (
               <div className="flex gap-2 w-full pr-10">
                  <select 
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as Category)}
                    className="px-2 py-1 rounded-lg text-xs font-bold uppercase bg-slate-50 border border-slate-200 text-slate-700 tracking-wide outline-none"
                  >
                    {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as any)}
                    className="px-2 py-1 rounded-lg text-xs font-bold uppercase bg-slate-50 border border-slate-200 text-slate-700 tracking-wide outline-none"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
               </div>
             ) : (
               <div className="flex gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-600 tracking-wide">
                    {task.category.split(' ')[0]}
                  </span>
                  {task.priority === 'high' && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-red-50 text-red-600 tracking-wide">
                      High Priority
                    </span>
                  )}
               </div>
             )}
             
             <div className="flex items-center gap-2 -mr-2 -mt-2">
               {!isEditing && (
                 <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-teal-600 transition-colors" title="Edit Task">
                   <Pencil size={20} />
                 </button>
               )}
               <button onClick={handleDelete} className="p-2 hover:bg-red-50 rounded-full text-slate-400 hover:text-red-500 transition-colors" title="Delete Task">
                 <Trash2 size={20} />
               </button>
               <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
             </div>
          </div>

          {isEditing ? (
            <div className="space-y-3 mt-2">
              <input 
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-2xl font-bold text-slate-800 border-b border-slate-200 focus:border-teal-500 outline-none pb-1"
                placeholder="Task Title"
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full text-sm text-slate-500 border rounded-lg p-2 focus:border-teal-500 outline-none resize-none h-20"
                placeholder="Description..."
              />
            </div>
          ) : (
            <>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight mb-2">{task.title}</h2>
              {task.description && <p className="text-slate-500 text-sm md:text-base leading-relaxed">{task.description}</p>}
            </>
          )}
          
          <div className="flex flex-wrap items-center gap-4 mt-6">
              {isEditing ? (
                <>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-teal-500" />
                    <input 
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-teal-500" />
                    <input 
                      type="time"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg">
                    <Calendar size={16} className="text-teal-500" />
                    {new Date(task.dueDate).toLocaleDateString('en-AE', { weekday: 'short', day: 'numeric', month: 'long' })}
                  </div>
                  
                  {task.dueTime && (
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg">
                      <Clock size={16} className="text-teal-500" />
                      {task.dueTime}
                    </div>
                  )}
                  
                  {task.recurrence && task.recurrence !== 'none' && (
                    <div className="flex items-center gap-2 text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg">
                      <Repeat size={16} />
                      <span className="capitalize">{task.recurrence}</span>
                    </div>
                  )}
                </>
              )}

              {!isEditing && (
                <div className="flex items-center gap-2 ml-auto">
                   <button onClick={addToGoogleCalendar} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Add to Google Calendar">
                     <ExternalLink size={18} />
                   </button>
                   <button onClick={downloadICS} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Download ICS">
                     <Download size={18} />
                   </button>
                </div>
              )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6 md:p-8 space-y-8 bg-slate-50/50">
          
          {/* Checklist */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CheckSquare className="text-teal-500" size={20} />
                Action Items
              </h3>
              {!isEditing && (
                <button 
                  onClick={handleRegenerateChecklist}
                  disabled={isRegenerating}
                  className="text-xs font-semibold flex items-center gap-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {isRegenerating ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12} />}
                  AI Assist
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-slate-200 rounded-full mb-6 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="space-y-3">
              {task.checklist.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm italic bg-white rounded-xl border border-slate-100">
                  No items yet. Use AI Assist to generate a plan.
                </div>
              ) : (
                task.checklist.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => !isEditing && toggleCheckItem(item.id)}
                    className={`group flex items-start gap-4 p-4 rounded-xl border transition-all select-none
                      ${isEditing ? 'bg-white border-slate-200' : 'cursor-pointer'}
                      ${item.isCompleted ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-white border-slate-200 hover:border-teal-300 hover:shadow-md'}
                    `}
                  >
                    <div className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0
                      ${item.isCompleted ? 'bg-teal-500 border-teal-500' : 'border-slate-300 group-hover:border-teal-400 bg-white'}
                    `}>
                      {item.isCompleted && <CheckSquare size={14} className="text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm md:text-base font-medium ${item.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {item.text}
                      </p>
                      {item.type === 'document' && (
                        <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] uppercase font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          <FileText size={10} /> Document Required
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Documents */}
          <section className="pt-6 border-t border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <FileText className="text-blue-500" size={20} />
              Attachments
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {task.documents && task.documents.map(doc => (
                <div key={doc.id} className="group flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all">
                  <div className="bg-blue-50 p-2.5 rounded-lg">
                    <FileText size={20} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{doc.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{doc.type.split('/')[1] || 'FILE'}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <a href={doc.dataUrl} download={doc.name} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                      <Download size={16} />
                    </a>
                    <button onClick={() => handleDeleteDoc(doc.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <label className="flex flex-col items-center justify-center gap-2 w-full p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-teal-400 hover:bg-teal-50/30 cursor-pointer transition-all group bg-slate-50/50">
              <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf" />
              <div className="bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                <Upload size={20} className="text-slate-400 group-hover:text-teal-500" />
              </div>
              <div className="text-center">
                <span className="text-sm font-semibold text-slate-600 group-hover:text-teal-700">Click to upload</span>
                <span className="text-xs text-slate-400 block mt-0.5">PDF or Images (Max 500KB)</span>
              </div>
            </label>
          </section>

        </div>

        {/* Footer Actions */}
        <div className="bg-white p-4 md:p-6 border-t border-slate-100 flex gap-4 sticky bottom-0 z-10">
           {isEditing ? (
             <>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3.5 rounded-xl font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveEdit}
                  className="flex-1 py-3.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-black transition-all shadow-lg active:scale-95 flex justify-center items-center gap-2"
                >
                  <Save size={18} /> Save Changes
                </button>
             </>
           ) : (
             <button 
               onClick={() => {
                 onUpdate({ ...task, status: 'completed' });
                 onClose();
               }}
               className="flex-1 py-3.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-black transition-all shadow-lg active:scale-95"
            >
              Mark Complete
            </button>
           )}
        </div>
      </div>
    </div>
  );
};