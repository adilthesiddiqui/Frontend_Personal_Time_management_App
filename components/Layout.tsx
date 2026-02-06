import React from 'react';
import { LayoutDashboard, Plus, Sparkles, Menu, Mic, HelpCircle } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'add' | 'ai';
  onTabChange: (tab: 'dashboard' | 'add' | 'ai') => void;
  onQuickVoice: () => void;
  onAskAI: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onQuickVoice, onAskAI }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-teal-100/40 rounded-full blur-3xl -z-10 pointer-events-none mix-blend-multiply"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-orange-100/40 rounded-full blur-3xl -z-10 pointer-events-none mix-blend-multiply"></div>

      {/* Desktop Sidebar */}
      <nav className="hidden md:flex w-24 lg:w-64 flex-col justify-between h-screen sticky top-0 z-20 glass-panel border-r border-white/50 transition-all duration-300">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-400 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-teal-500/20">
              T
            </div>
            <div className="hidden lg:block">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Time Flow</h1>
              <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Personal Manager</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 space-y-2 mt-8">
          <NavButton 
            icon={<LayoutDashboard size={20} />} 
            label="Overview" 
            isActive={activeTab === 'dashboard'} 
            onClick={() => onTabChange('dashboard')} 
          />
          <NavButton 
            icon={<Sparkles size={20} />} 
            label="AI Parser" 
            isActive={activeTab === 'ai'} 
            onClick={() => onTabChange('ai')} 
          />
          <NavButton 
            icon={<Plus size={20} />} 
            label="New Task" 
            isActive={activeTab === 'add'} 
            onClick={() => onTabChange('add')} 
          />
           <button
            onClick={onQuickVoice}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-300 text-slate-500 hover:bg-red-50 hover:text-red-500 group"
          >
            <span className="transition-transform duration-300 group-hover:scale-110"><Mic size={20} /></span>
            <span className="hidden lg:block">Voice Task</span>
          </button>
        </div>
        
        <div className="p-6 hidden lg:block">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl">
            <p className="text-xs font-medium text-slate-300 mb-1">Focus Tip</p>
            <p className="text-xs leading-relaxed text-slate-400">Review your schedule every morning to stay aligned with your goals.</p>
          </div>
        </div>
      </nav>

      {/* Mobile Floating Nav */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
        <div className="glass-panel rounded-full p-2 shadow-2xl shadow-slate-200/50 flex justify-between items-center px-4">
          
          {/* Left: Dashboard */}
          <MobileNavButton 
            icon={<LayoutDashboard size={20} />} 
            isActive={activeTab === 'dashboard'} 
            onClick={() => onTabChange('dashboard')} 
          />
          
          {/* Center Group: Actions */}
          <div className="flex gap-3 px-2">
             {/* Text Add */}
            <button
              onClick={() => onTabChange('add')}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-transform active:scale-95
                ${activeTab === 'add' ? 'bg-slate-800' : 'bg-gradient-to-tr from-teal-500 to-emerald-400'}
              `}
            >
              <Plus size={20} />
            </button>
             {/* Voice Add */}
             <button
              onClick={onQuickVoice}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-gradient-to-tr from-rose-500 to-pink-500 shadow-md shadow-rose-500/30 transition-transform active:scale-95"
            >
              <Mic size={20} />
            </button>
          </div>

          {/* Right Group: AI & Ask */}
          <div className="flex gap-1">
             <MobileNavButton 
              icon={<Sparkles size={20} />} 
              isActive={activeTab === 'ai'} 
              onClick={() => onTabChange('ai')} 
            />
            <MobileNavButton 
              icon={<HelpCircle size={20} />} 
              isActive={false} 
              onClick={onAskAI} 
            />
          </div>

        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden pb-24 md:pb-0">
        <div className="max-w-5xl mx-auto p-4 md:p-8 lg:p-12">
          <div className="md:hidden mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-400 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-teal-500/20">
                TF
              </div>
              <span className="font-bold text-slate-800">Time Flow</span>
            </div>
            <button className="p-2 bg-white rounded-full shadow-sm text-slate-400">
              <Menu size={20} />
            </button>
          </div>
          
          {children}
        </div>
      </main>
    </div>
  );
};

const NavButton = ({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-300 group
      ${isActive 
        ? 'bg-white shadow-md shadow-slate-200/50 text-teal-600 font-semibold' 
        : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}
    `}
  >
    <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
    <span className="hidden lg:block">{label}</span>
  </button>
);

const MobileNavButton = ({ icon, isActive, onClick }: { icon: React.ReactNode, isActive: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-full transition-colors flex items-center justify-center
      ${isActive ? 'text-teal-600 bg-teal-50' : 'text-slate-400 hover:bg-slate-100'}
    `}
  >
    {icon}
  </button>
);