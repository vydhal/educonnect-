
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../constants';
import { ModerationItem } from '../types';
import { adminAPI, moderationAPI } from '../api';
import { useModal } from '../contexts/ModalContext';

interface DashboardStats {
  users: { total: number; trend: string };
  posts: { total: number; trend: string };
  moderation: { pending: number; trend: string };
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showModal } = useModal();
  const [stats, setStats] = useState<DashboardStats>({
    users: { total: 0, trend: '0%' },
    posts: { total: 0, trend: '0%' },
    moderation: { pending: 0, trend: '0%' }
  });
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, itemsData] = await Promise.all([
          adminAPI.getStats(),
          moderationAPI.getItems()
        ]);
        setStats(statsData);
        // Transform API data to match ModerationItem interface if needed
        // Assuming API returns compatible structure based on moderation.routes.ts
        const formattedItems = itemsData.map((item: any) => ({
          id: item.id,
          author: item.post?.author?.name || 'Desconhecido',
          school: item.post?.author?.school || 'Escola não informada',
          date: new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
          contentPreview: item.post?.content || 'Conteúdo indisponível',
          status: item.status
        }));
        setItems(formattedItems);
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAction = async (id: string, newStatus: 'APROVADO' | 'REPROVADO') => {
    try {
      if (newStatus === 'APROVADO') {
        await moderationAPI.approveItem(id);
      } else {
        await moderationAPI.rejectItem(id, {});
      }
      // Update local state
      setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    } catch (error) {
      console.error('Error updating item status:', error);
      showModal({ 
        title: 'Erro na Moderação', 
        message: 'Não foi possível atualizar o status do item. Por favor, tente novamente.', 
        type: 'error' 
      });
    }
  };

  return (
    <div className="animate-fade-in">
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Monitoramento da Rede</h1>
          <p className="text-gray-500 font-medium">Gestão centralizada da Secretaria de Educação de Campina Grande.</p>
        </div>
        <button className="bg-white border px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-gray-50 transition-colors">
          <span className="material-symbols-outlined text-sm">calendar_today</span>
          Hoje, {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
        </button>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard label="Usuários Ativos" value={stats.users.total.toString()} trend={stats.users.trend} icon="groups" color="primary" />
        <StatCard label="Novas Postagens" value={stats.posts.total.toString()} trend={stats.posts.trend} icon="post_add" color="primary" />
        <div onClick={() => navigate('/admin/moderation')} className="cursor-pointer group">
          <StatCard label="Pendentes" value={stats.moderation.pending.toString()} trend={stats.moderation.trend} icon="pending_actions" color="orange" />
        </div>
      </section>

      {/* Moderation Table */}
      <section className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-black">Moderação de Conteúdo</h2>
          <div className="relative w-full md:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input className="w-full h-12 bg-gray-50 dark:bg-gray-800 border-none rounded-xl py-2.5 pl-10 text-sm focus:ring-2 focus:ring-primary/20 font-medium" placeholder="Buscar por autor ou conteúdo..." />
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-50/80 dark:bg-gray-800/50 text-gray-500 text-[10px] uppercase tracking-widest font-black">
              <tr>
                <th className="px-6 py-4">Autor</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Conteúdo (Preview)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {items.filter(i => i.status === 'PENDENTE').map(item => (
                <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-[10px] border border-primary/5">
                        {item.author.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-black dark:text-white uppercase tracking-tight">{item.author}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.school}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[11px] text-gray-500 font-bold uppercase tracking-tight">{item.date}</td>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="text-sm italic line-clamp-1 opacity-70 dark:text-gray-400">"{item.contentPreview}"</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 text-[10px] font-black uppercase tracking-widest border border-orange-200 dark:border-orange-500/20">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 transform lg:translate-x-2 lg:group-hover:translate-x-0">
                      <button
                        onClick={() => handleAction(item.id, 'APROVADO')}
                        className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-green-500/20 active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm">check</span> Aprovar
                      </button>
                      <button
                        onClick={() => handleAction(item.id, 'REPROVADO')}
                        className="flex items-center gap-1.5 border-2 border-red-100 dark:border-red-900/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm">close</span> Reprovar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-gray-50/50 dark:bg-gray-800/50 border-t dark:border-gray-800 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
          <p>Mostrando {items.filter(i => i.status === 'PENDENTE').length} postagens pendentes.</p>
        </div>
      </section>

      {/* Feedback Area */}
      <section className="mt-8 p-8 bg-white dark:bg-gray-900 rounded-3xl border dark:border-gray-800 shadow-sm">
        <h3 className="text-xs font-black flex items-center gap-2 mb-6 uppercase tracking-[0.2em] text-primary">
          <span className="material-symbols-outlined text-xl font-fill-1">feedback</span>
          Moderação Assistida
        </h3>
        <div className="flex flex-col md:flex-row gap-6 items-stretch">
          <textarea
            className="flex-1 bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-800 rounded-3xl p-6 text-sm focus:ring-primary/20 min-h-[140px] outline-none transition-all focus:bg-white dark:focus:bg-gray-800 border-2 focus:border-primary/20 dark:text-white font-medium"
            placeholder="Informe o motivo da reprovação ou envie um feedback para o autor..."
          />
          <div className="flex flex-row md:flex-col gap-3 md:min-w-[220px]">
            <button className="flex-1 bg-primary text-white font-black text-[11px] uppercase tracking-widest py-4 px-6 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
              Enviar Feedback
            </button>
            <button className="flex items-center justify-center gap-2 text-gray-400 font-black text-[11px] uppercase tracking-widest py-4 px-6 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
              Limpar
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

const StatCard: React.FC<{ label: string, value: string, trend: string, icon: string, color: string }> = ({ label, value, trend, icon, color }) => (
  <div className="bg-white p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{label}</p>
      <span className={`material-symbols-outlined ${color === 'orange' ? 'text-orange-500' : 'text-primary'}`}>{icon}</span>
    </div>
    <div className="flex items-baseline gap-3">
      <p className="text-3xl font-black">{value}</p>
      <p className={`text-xs font-black ${trend.startsWith('+') ? 'text-green-600' : 'text-orange-500'}`}>{trend}</p>
    </div>
  </div>
);

export default AdminDashboard;
