
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../constants';
import { ModerationItem } from '../types';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ModerationItem[]>([
    { id: '1', author: 'João Silva', school: 'Escola Mun. Lourdina Souto', date: 'Hoje, 09:45', contentPreview: '"Gostaria de compartilhar o projeto de ciências que fizemos sobre o Rio Paraíba..."', status: 'PENDENTE' },
    { id: '2', author: 'Maria Oliveira', school: 'Escola Mun. Tiradentes', date: 'Hoje, 08:30', contentPreview: '"Alguém tem o material da aula de ontem? Esqueci de anotar..."', status: 'PENDENTE' },
    { id: '3', author: 'Ricardo Lima', school: 'Colégio Mun. Dr. Elpídio de Almeida', date: 'Ontem, 21:15', contentPreview: '"Vejam esse vídeo incrível da feira de tecnologia que aconteceu em CG!"', status: 'PENDENTE' },
  ]);

  const handleAction = (id: string, newStatus: 'APROVADO' | 'REPROVADO') => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
  };

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#f6f6f8] text-[#0d121b]">
      {/* Sidebar */}
      <aside className="w-72 bg-navy-sidebar text-white flex flex-col fixed h-full z-10 shadow-2xl">
        <div className="p-8 flex items-center gap-3">
          <div className="bg-primary size-10 rounded-xl flex items-center justify-center cursor-pointer" onClick={() => navigate('/')}>
            <span className="material-symbols-outlined text-white font-fill-1">school</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-white text-base font-bold leading-none">EduConnect CG</h1>
            <p className="text-gray-500 text-[10px] mt-1 uppercase tracking-widest font-bold">Painel Admin</p>
          </div>
        </div>

        <nav className="flex-1 px-4 mt-4 space-y-1">
          <SidebarItem icon="dashboard" label="Dashboard" active />
          <SidebarItem icon="verified_user" label="Moderação" />
          <SidebarItem icon="group" label="Usuários" />
          <SidebarItem icon="assessment" label="Relatórios" />
          <SidebarItem icon="settings" label="Configurações" />
        </nav>

        <div className="p-6 border-t border-white/5 space-y-2">
          <button className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors text-sm font-medium w-full px-4 py-3 rounded-xl hover:bg-white/5">
            <span className="material-symbols-outlined text-xl">help_center</span>
            Suporte
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-red-400 hover:text-red-300 transition-colors text-sm font-bold w-full px-4 py-3 rounded-xl hover:bg-red-500/10"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            Sair do Painel
          </button>

          <div className="mt-4 flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="size-10 rounded-full bg-cover bg-center border border-white/10" style={{ backgroundImage: `url(${IMAGES.AVATAR_ADMIN})` }} />
            <div>
              <p className="text-xs font-bold">Admin Regional</p>
              <p className="text-[10px] text-gray-500 uppercase">SME Campina Grande</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-72 p-10">
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
          <StatCard label="Usuários Ativos" value="12.240" trend="+12%" icon="groups" color="primary" />
          <StatCard label="Novas Postagens" value="342" trend="+5.4%" icon="post_add" color="primary" />
          <StatCard label="Pendentes" value={items.filter(i => i.status === 'PENDENTE').length.toString()} trend="-8%" icon="pending_actions" color="orange" />
        </section>

        {/* Moderation Table */}
        <section className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-6 border-b flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold">Moderação de Conteúdo</h2>
            <div className="relative w-full md:w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-10 text-sm focus:ring-2 focus:ring-primary/20" placeholder="Buscar por autor ou conteúdo..." />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/80 text-gray-500 text-[10px] uppercase tracking-widest font-black">
                <tr>
                  <th className="px-6 py-4">Autor</th>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Conteúdo (Preview)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.filter(i => i.status === 'PENDENTE').map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-[10px]">
                          {item.author.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{item.author}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{item.school}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">{item.date}</td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-sm italic line-clamp-1 opacity-70">{item.contentPreview}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-wider">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleAction(item.id, 'APROVADO')}
                          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
                        >
                          <span className="material-symbols-outlined text-sm">check</span> Aprovar
                        </button>
                        <button 
                          onClick={() => handleAction(item.id, 'REPROVADO')}
                          className="flex items-center gap-1.5 border-2 border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95"
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
          
          <div className="p-4 bg-gray-50/50 border-t flex justify-between items-center text-xs font-bold text-gray-400">
            <p>Mostrando {items.filter(i => i.status === 'PENDENTE').length} postagens pendentes de aprovação.</p>
          </div>
        </section>

        {/* Feedback Area */}
        <section className="mt-10 p-8 bg-white rounded-2xl border shadow-sm">
          <h3 className="text-sm font-black flex items-center gap-2 mb-6 uppercase tracking-wider text-primary">
            <span className="material-symbols-outlined text-xl">feedback</span>
            Adicionar Comentário de Moderação
          </h3>
          <div className="flex gap-6 items-start">
            <textarea 
              className="flex-1 bg-gray-50 border-gray-100 rounded-2xl p-5 text-sm focus:ring-primary min-h-[120px] outline-none transition-all focus:bg-white border-2 focus:border-primary/20"
              placeholder="Informe o motivo da reprovação ou envie um feedback construtivo para o autor..."
            />
            <div className="flex flex-col gap-3 min-w-[200px]">
              <button className="bg-primary text-white font-black py-4 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95">
                Enviar Feedback
              </button>
              <button className="text-gray-400 font-bold py-3 rounded-xl hover:bg-gray-50 transition-all">
                Limpar Texto
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const SidebarItem: React.FC<{icon: string, label: string, active?: boolean}> = ({ icon, label, active }) => (
  <a href="#" className={`flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all ${active ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
    <span className={`material-symbols-outlined ${active ? 'font-fill-1' : ''}`}>{icon}</span>
    <span className="text-sm font-bold">{label}</span>
  </a>
);

const StatCard: React.FC<{label: string, value: string, trend: string, icon: string, color: string}> = ({ label, value, trend, icon, color }) => (
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
