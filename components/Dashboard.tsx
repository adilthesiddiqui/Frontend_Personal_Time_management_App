import React, { useState } from 'react';
import { Task, Category } from '../types';
import { Calendar, CheckCircle2, Clock, Home, Briefcase, CreditCard, User, Sparkles, ChevronRight, History, CalendarDays, Sun, Trash2 } from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onToggleTaskStatus: (id: string) => void;
}

type TimelineTab = 'today' | 'future' | 'past';

export const Dashboard: React.FC<DashboardProps> = ({ tasks, onTaskClick, onDeleteTask, onToggleTaskStatus }) => {
  const [timelineTab, setTimelineTab] = useState<TimelineTab>('today');

  // Helper to get comparable Date object
  const getTaskDate = (task: Task) => {
    return new Date(`${task.dueDate}T${task.dueTime || '00:00'}`);
  };

  // Sort tasks: Overdue first, then by date+time
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    return getTaskDate(a).getTime() - getTaskDate(b).getTime();
  });

  const getCategoryIcon = (cat: Category) => {
    switch (cat) {
      case Category.HOME: return <Home size={18} />;
      case Category.WORK: return <Briefcase size={18} />;
      case Category.PERSONAL: return <User size={18} />;
      case Category.FINANCE: return <CreditCard size={18} />;
      default: return <Sparkles size={18} />;
    }
  };

  const getCategoryStyle = (cat: Category) => {
     switch (cat) {
      case Category.HOME: return 'bg-orange-50 text-orange-600';
      case Category.WORK: return 'bg-blue-50 text-blue-600';
      case Category.PERSONAL: return 'bg-emerald-50 text-emerald-600';
      case Category.FINANCE: return 'bg-purple-50 text-purple-600';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  // Improved date diff to handle local time strictly
  const getDaysDiff = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse YYYY-MM-DD manually to ensure local time construction
    const [y, m, d] = dateStr.split('-').map(Number);
    const taskDate = new Date(y, m - 1, d);
    
    const diff = taskDate.getTime() - today.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const filteredTasks = sortedTasks.filter(task => {
    const days = getDaysDiff(task.dueDate);
    if (timelineTab === 'today') return days === 0;
    if (timelineTab === 'future') return days > 0;
    if (timelineTab === 'past') return days < 0;
    return true;
  });

  const pendingCount = tasks.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold text-slate-800 tracking-tight">{getGreeting()}, User.</h2>
          <p className="text-slate-500 mt-2 text-lg">
            You have <span className="text-teal-600 font-bold">{pendingCount}</span> tasks on your schedule.
          </p>
        </div>
        <div className="flex gap-2 text-sm font-medium">
          <div className="glass-panel px-4 py-2 rounded-xl text-slate-600 shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </header>

      {/* Stats Strip */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <StatCard 
          label="Pending" 
          value={pendingCount} 
          color="text-slate-800"
          bg="bg-white"
        />
        <StatCard 
          label="Overdue" 
          value={tasks.filter(t => {
            const days = getDaysDiff(t.dueDate);
            return days < 0 && t.status !== 'completed';
          }).length} 
          color="text-red-500"
          bg="bg-red-50"
        />
         <StatCard 
          label="This Week" 
          value={tasks.filter(t => {
             const days = getDaysDiff(t.dueDate);
             return days >= 0 && days <= 7 && t.status !== 'completed';
           }).length}
          color="text-amber-500"
          bg="bg-amber-50"
        />
      </div>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-slate-800">Your Timeline</h3>
            
            {/* Timeline Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-xl self-start md:self-auto">
              <TabButton 
                active={timelineTab === 'today'} 
                onClick={() => setTimelineTab('today')} 
                label="Today"
                icon={<Sun size={14} />}
              />
              <TabButton 
                active={timelineTab === 'future'} 
                onClick={() => setTimelineTab('future')} 
                label="Future" 
                icon={<CalendarDays size={14} />}
              />
              <TabButton 
                active={timelineTab === 'past'} 
                onClick={() => setTimelineTab('past')} 
                label="Past" 
                icon={<History size={14} />}
              />
            </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-24 glass-panel rounded-3xl border border-dashed border-slate-300">
            <div className="mx-auto bg-white shadow-lg w-20 h-20 rounded-full flex items-center justify-center mb-4">
              {timelineTab === 'past' ? (
                <History className="text-slate-300" size={32} />
              ) : timelineTab === 'today' ? (
                <Sun className="text-amber-400" size={32} />
              ) : (
                <Sparkles className="text-teal-400" size={32} />
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-700">
              {timelineTab === 'today' ? "No tasks for today" : timelineTab === 'past' ? "No past tasks" : "No upcoming tasks"}
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              {timelineTab === 'today' ? "Enjoy your day!" : timelineTab === 'past' ? "Clean history." : "You're all caught up."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
          {filteredTasks.map((task) => {
            const daysLeft = getDaysDiff(task.dueDate);
            const isLate = daysLeft < 0 && task.status !== 'completed';
            const isCompleted = task.status === 'completed';
            const dateObj = new Date(task.dueDate);

            return (
              <div 
                key={task.id}
                onClick={() => onTaskClick(task)}
                className={`group relative bg-white p-4 md:p-5 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer border
                  ${isCompleted ? 'opacity-60 border-slate-100 bg-slate-50/50' : 'border-slate-100'}
                  ${isLate ? 'border-red-200 ring-1 ring-red-100' : ''}
                `}
              >
                <div className="flex items-center gap-4 md:gap-6">
                  {/* Date Badge */}
                  <div className={`flex flex-col items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl flex-shrink-0 border transition-colors
                    ${isCompleted 
                      ? 'bg-slate-100 border-slate-200 text-slate-400' 
                      : isLate 
                        ? 'bg-red-50 border-red-100 text-red-500' 
                        : 'bg-slate-50 border-slate-100 text-slate-700 group-hover:bg-teal-50 group-hover:text-teal-600 group-hover:border-teal-100'}
                  `}>
                    <span className="text-[10px] uppercase font-bold tracking-wider">{dateObj.toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-xl md:text-2xl font-bold leading-none mt-0.5">{dateObj.getDate()}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                       <span className={`p-1.5 rounded-lg ${getCategoryStyle(task.category)}`}>
                          {getCategoryIcon(task.category)}
                       </span>
                       <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide truncate">
                         {task.category.split(' ')[0]}
                       </span>
                       {isLate && (
                          <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
                            LATE
                          </span>
                       )}
                       {task.dueTime && (
                         <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                           <Clock size={10} /> {task.dueTime}
                         </span>
                       )}
                    </div>
                    <h3 className={`text-base md:text-lg font-bold truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-medium">
                      {task.recurrence && task.recurrence !== 'none' && (
                        <span className="flex items-center gap-1">
                          <History size={12} /> {task.recurrence}
                        </span>
                      )}
                      <span>•</span>
                      <span>{task.checklist.filter(i => i.isCompleted).length}/{task.checklist.length} steps</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 relative z-20">
                     <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDeleteTask(task.id);
                      }}
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-500 transition-colors z-30"
                      title="Delete Task"
                    >
                      <Trash2 size={18} />
                    </button>
                     <button 
                      onClick={(e) => {
                         e.preventDefault();
                         e.stopPropagation();
                         onToggleTaskStatus(task.id);
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 z-30
                        ${isCompleted 
                          ? 'bg-emerald-500 text-white shadow-emerald-200 shadow-md' 
                          : 'bg-slate-100 text-slate-300 hover:bg-emerald-100 hover:text-emerald-500'}
                      `}
                    >
                      <CheckCircle2 size={20} />
                    </button>
                    <div className="hidden md:flex text-slate-300 group-hover:text-teal-500 transition-colors">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color, bg }: { label: string, value: number, color: string, bg: string }) => (
  <div className={`p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center ${bg}`}>
    <span className={`text-3xl md:text-4xl font-bold mb-1 ${color}`}>{value}</span>
    <span className="text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
  </div>
);

const TabButton = ({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2
      ${active 
        ? 'bg-white text-teal-600 shadow-sm ring-1 ring-black/5' 
        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}
    `}
  >
    {icon}
    {label}
  </button>
);