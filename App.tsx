
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { MagicParser } from './components/MagicParser';
import { QuickAdd } from './components/QuickAdd';
import { TaskDetail } from './components/TaskDetail';
import { VoiceRecorderOverlay } from './components/VoiceRecorderOverlay';
import { AskAIOverlay } from './components/AskAIOverlay';
import { ConfirmationModal } from './components/ConfirmationModal';
import { Auth } from './components/Auth';
import { Task, Category } from './types';
import { api, getAuthToken } from './services/api';
import { HelpCircle, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAuthToken());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'ai'>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isVoiceOverlayOpen, setIsVoiceOverlayOpen] = useState(false);
  const [isAskOverlayOpen, setIsAskOverlayOpen] = useState(false);
  const [alertedTaskIds, setAlertedTaskIds] = useState<Set<string>>(new Set());

  const fetchTasks = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const data = await api.getTasks();
      const mappedTasks = data.map((t: any) => {
        let meta = { checklist: [], priority: 'medium', category: Category.OTHER, dueDate: '', recurrence: 'none', descriptionText: '' };
        try {
          // Unpacking JSON from the description field
          const parsedDesc = JSON.parse(t.description);
          meta = { ...meta, ...parsedDesc };
        } catch (e) {
          meta.descriptionText = t.description;
          meta.dueDate = new Date(t.created_at).toISOString().split('T')[0];
        }
        
        return {
          id: t.id.toString(),
          title: t.title,
          description: meta.descriptionText || undefined,
          status: t.is_completed ? 'completed' : 'pending',
          ...meta
        };
      });
      setTasks(mappedTasks);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchTasks();
  }, [isAuthenticated]);

  const handleAddTask = async (task: Task) => {
    try {
      const payload = {
        title: task.title,
        description: JSON.stringify({
          checklist: task.checklist,
          priority: task.priority,
          category: task.category,
          dueDate: task.dueDate,
          dueTime: task.dueTime,
          recurrence: task.recurrence,
          descriptionText: task.description
        }),
        is_completed: task.status === 'completed' ? 1 : 0
      };
      await api.createTask(payload);
      return true;
    } catch (err) {
      console.error("Failed to add task", err);
      return false;
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      const payload = {
        title: updatedTask.title,
        description: JSON.stringify({
          checklist: updatedTask.checklist,
          priority: updatedTask.priority,
          category: updatedTask.category,
          dueDate: updatedTask.dueDate,
          dueTime: updatedTask.dueTime,
          recurrence: updatedTask.recurrence,
          descriptionText: updatedTask.description
        }),
        is_completed: updatedTask.status === 'completed' ? 1 : 0
      };
      await api.updateTask(updatedTask.id, payload);
      fetchTasks();
      setSelectedTask(updatedTask);
    } catch (err) {
      console.error("Failed to update task", err);
    }
  };

  const handleDeleteTask = (id: string) => setTaskToDelete(id);

  const confirmDeleteTask = async () => {
    if (taskToDelete) {
      try {
        await api.deleteTask(taskToDelete);
        fetchTasks();
        if (selectedTask?.id === taskToDelete) setSelectedTask(null);
        setTaskToDelete(null);
      } catch (err) {
        console.error("Failed to delete task", err);
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      handleUpdateTask({ ...task, status: newStatus });
    }
  };

  const handleMagicTasksGenerated = async (newTasks: Task[]) => {
    setLoading(true);
    for (const t of newTasks) {
      await handleAddTask(t);
    }
    await fetchTasks();
    setActiveTab('dashboard');
    setLoading(false);
  };

  if (!isAuthenticated) {
    return <Auth onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      onQuickVoice={() => setIsVoiceOverlayOpen(true)}
      onAskAI={() => setIsAskOverlayOpen(true)}
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={48} className="animate-spin text-teal-500" />
          <p className="text-slate-500 font-medium">Syncing with backend...</p>
        </div>
      ) : activeTab === 'dashboard' ? (
        <Dashboard 
          tasks={tasks} 
          onTaskClick={setSelectedTask} 
          onDeleteTask={handleDeleteTask}
          onToggleTaskStatus={handleToggleStatus}
        />
      ) : activeTab === 'add' ? (
        <QuickAdd onAdd={async (t) => { await handleAddTask(t); fetchTasks(); setActiveTab('dashboard'); }} onCancel={() => setActiveTab('dashboard')} />
      ) : (
        <MagicParser onTasksGenerated={handleMagicTasksGenerated} />
      )}

      {selectedTask && (
        <TaskDetail 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}

      {isVoiceOverlayOpen && (
        <VoiceRecorderOverlay 
          onClose={() => setIsVoiceOverlayOpen(false)}
          onTasksGenerated={handleMagicTasksGenerated}
        />
      )}

      {isAskOverlayOpen && (
        <AskAIOverlay 
          tasks={tasks}
          onClose={() => setIsAskOverlayOpen(false)}
        />
      )}
      
      <ConfirmationModal 
        isOpen={!!taskToDelete} 
        onClose={() => setTaskToDelete(null)} 
        onConfirm={confirmDeleteTask} 
      />

      <button 
        onClick={() => setIsAskOverlayOpen(true)}
        className="hidden md:flex fixed bottom-6 right-6 md:right-8 w-14 h-14 bg-white text-teal-600 rounded-full shadow-2xl items-center justify-center hover:scale-110 transition-transform z-40 border border-teal-100 hover:border-teal-300 group"
      >
        <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-800 text-white text-xs py-1 px-2 rounded-lg whitespace-nowrap">
          Ask AI
        </span>
        <HelpCircle size={28} />
      </button>
    </Layout>
  );
};

export default App;
