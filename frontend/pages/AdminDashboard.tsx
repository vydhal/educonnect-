
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../constants';
import { ModerationItem } from '../types';
import { adminAPI, moderationAPI, getMediaUrl } from '../api';
import { useModal } from '../contexts/ModalContext';

interface DashboardStats {
  users: { total: number; trend: string };
  posts: { total: number; trend: string };
  moderation: { pending: number; trend: string };
  badges?: {
    total: number;
    topUsers: Array<{
      id: string;
      name: string;
      avatar?: string;
      school: string;
      badgesCount: number;
    }>;
  };
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showModal } = useModal();
  const [stats, setStats] = useState<DashboardStats>({
    users: { total: 0, trend: '0%' },
    posts: { total: 0, trend: '0%' },
    moderation: { pending: 0, trend: '0%' }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsData = await adminAPI.getStats();
        setStats(statsData);
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="animate-fade-in relative">
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2 uppercase italic dark:text-gray-100">Painel Principal</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Gestão centralizada da Rede EduConnect.</p>
        </div>
        <button className="bg-white dark:bg-gray-800 border dark:border-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <span className="material-symbols-outlined text-sm">calendar_today</span>
          Hoje, {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
        </button>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard label="Usuários Ativos" value={stats.users.total.toString()} trend={stats.users.trend} icon="groups" color="primary" />
        <StatCard label="Postagens" value={stats.posts.total.toString()} trend={stats.posts.trend} icon="post_add" color="primary" />
        <div onClick={() => navigate('/admin/moderation')} className="cursor-pointer group">
          <StatCard label="Pendentes" value={stats.moderation.pending.toString()} trend={stats.moderation.trend} icon="pending_actions" color="orange" />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Badge Engagement Widget */}
          <section className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-3xl border dark:border-gray-800 shadow-sm p-8 overflow-hidden relative">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <span className="material-symbols-outlined text-[120px] dark:text-white">workspace_premium</span>
             </div>
             
             <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight dark:text-gray-100">Selos de Engajamento</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest mt-1">Ranking de Reconhecimento</p>
                </div>
                <button 
                  onClick={() => navigate('/admin/badges')}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all"
                >
                  Gerenciar Selos →
                </button>
             </div>

             <div className="space-y-4 relative z-10">
                {loading ? (
                  <div className="py-20 text-center animate-pulse text-gray-400 font-black uppercase tracking-widest text-xs">Carregando ranking...</div>
                ) : !stats.badges?.topUsers || stats.badges.topUsers.length === 0 ? (
                  <div className="py-20 text-center text-gray-400 font-black uppercase tracking-widest text-xs border border-dashed rounded-2xl">Ainda não há selos na rede.</div>
                ) : (
                  stats.badges.topUsers.map((user, idx) => (
                    <div key={user.id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30 border border-transparent hover:border-primary/20 transition-all hover:bg-white dark:hover:bg-gray-800 group">
                       <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center font-black text-primary text-xs shrink-0">
                          #{idx + 1}
                       </div>
                       <div className="size-10 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${getMediaUrl(user.avatar) || IMAGES.DEFAULT_AVATAR})` }} />
                       <div className="flex-1 overflow-hidden">
                          <p className="font-black text-sm uppercase tracking-tight truncate dark:text-white group-hover:text-primary transition-colors">{user.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase truncate">{user.school}</p>
                       </div>
                       <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm shrink-0">
                          <span className="material-symbols-outlined text-orange-500 text-sm font-fill-1">workspace_premium</span>
                          <span className="font-black text-xs">{user.badgesCount}</span>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </section>

          {/* Quick Stats Sidebar */}
          <aside className="space-y-6">
             <div className="bg-primary rounded-3xl p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 translate-x-4 -translate-y-4 rotate-12 opacity-20 scale-150 transition-transform group-hover:scale-110 group-hover:rotate-0">
                   <span className="material-symbols-outlined text-8xl">military_tech</span>
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Total de Selos</h3>
                <p className="text-5xl font-black mb-1 tracking-tighter">{stats.badges?.total || 0}</p>
                <p className="text-xs font-bold opacity-70">Exibidos em toda a plataforma</p>
                
                <button 
                  onClick={() => navigate('/admin/reports')}
                  className="mt-8 w-full bg-white text-primary py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg"
                >
                  Ver Relatórios Completos
                </button>
             </div>

             <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-3xl p-8 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Ações Rápidas</h3>
                <div className="grid grid-cols-2 gap-3">
                   <QuickAction icon="person_add" label="Usuário" onClick={() => navigate('/admin/users')} />
                   <QuickAction icon="school" label="Escola" onClick={() => navigate('/admin/schools')} />
                   <QuickAction icon="event" label="Evento" onClick={() => navigate('/admin/events')} />
                   <QuickAction icon="settings" label="Ajustes" onClick={() => navigate('/admin/settings')} />
                </div>
             </div>
          </aside>
      </div>
    </div>
  );
};

const QuickAction: React.FC<{ icon: string, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-primary/5 dark:hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all group active:scale-95"
  >
    <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">{icon}</span>
    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-primary transition-colors">{label}</span>
  </button>
);

const StatCard: React.FC<{ label: string, value: string, trend: string, icon: string, color: string }> = ({ label, value, trend, icon, color }) => (
  <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border dark:border-gray-800 shadow-sm hover:shadow-md transition-all group">
    <div className="flex justify-between items-start mb-4">
      <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest">{label}</p>
      <div className={`size-10 rounded-xl flex items-center justify-center transition-colors ${color === 'orange' ? 'bg-orange-50 dark:bg-orange-900/10 text-orange-500' : 'bg-primary/5 dark:bg-primary/10 text-primary'}`}>
        <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">{icon}</span>
      </div>
    </div>
    <div className="flex items-baseline gap-3">
      <p className="text-3xl font-black dark:text-white tracking-tighter">{value}</p>
      <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-tight ${trend.startsWith('+') || !trend.includes('-') ? 'text-green-500' : 'text-orange-500'}`}>
        <span className="material-symbols-outlined text-xs">{trend.includes('-') ? 'trending_down' : 'trending_up'}</span>
        {trend}
      </div>
    </div>
  </div>
);

export default AdminDashboard;
