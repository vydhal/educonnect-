import React, { useState, useEffect } from 'react';
import { badgeTypesAPI } from '../api';
import { useModal } from '../contexts/ModalContext';

interface BadgeType {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  color: string;
  isActive: boolean;
  _count?: {
    badges: number;
  };
}

export const AdminBadgesPage: React.FC = () => {
  const { showModal } = useModal();
  const [badgeTypes, setBadgeTypes] = useState<BadgeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    icon: '✨',
    description: '',
    color: '#7C3AED'
  });

  const fetchBadgeTypes = async () => {
    try {
      setLoading(true);
      const data = await badgeTypesAPI.getBadgeTypes();
      setBadgeTypes(data);
    } catch (error) {
      console.error('Failed to fetch badge types:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBadgeTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.icon) return;

    try {
      setIsSubmitting(true);
      await badgeTypesAPI.createBadgeType(formData);
      showModal({
        title: 'Sucesso!',
        message: 'Novo selo criado com sucesso.',
        type: 'success'
      });
      setShowForm(false);
      setFormData({ name: '', icon: '✨', description: '', color: '#7C3AED' });
      fetchBadgeTypes();
    } catch (error: any) {
      showModal({
        title: 'Erro',
        message: error.message || 'Falha ao criar selo.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (badge: BadgeType) => {
    try {
      await badgeTypesAPI.updateBadgeType(badge.id, { isActive: !badge.isActive });
      fetchBadgeTypes();
    } catch (error) {
      showModal({ title: 'Erro', message: 'Falha ao atualizar status.', type: 'error' });
    }
  };

  return (
    <div className="animate-fade-in">
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Gerenciamento de Selos</h1>
          <p className="text-gray-500 font-medium">Crie e gerencie os selos de reconhecimento da rede.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Fechar Form' : 'Novo Selo'}
        </button>
      </header>

      {showForm && (
        <section className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-8 mb-10 shadow-sm animate-in slide-in-from-top-4 duration-300">
          <h2 className="text-xl font-black mb-6">Cadastrar Novo Selo</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nome do Selo</label>
              <input 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full h-12 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                placeholder="Ex: Inovador"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Emoji / Ícone</label>
              <input 
                value={formData.icon}
                onChange={e => setFormData({...formData, icon: e.target.value})}
                className="w-full h-12 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-bold text-center"
                placeholder="Ex: 🚀"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cor Principal</label>
              <div className="flex gap-2">
                <input 
                  type="color"
                  value={formData.color}
                  onChange={e => setFormData({...formData, color: e.target.value})}
                  className="h-12 w-12 rounded-xl border-none p-1 cursor-pointer bg-gray-50 dark:bg-gray-800"
                />
                <input 
                  value={formData.color}
                  onChange={e => setFormData({...formData, color: e.target.value})}
                  className="flex-1 h-12 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-mono"
                />
              </div>
            </div>
            <div className="md:col-span-2 lg:col-span-4 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Descrição</label>
              <textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full h-24 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-medium resize-none"
                placeholder="Descreva o significado deste selo..."
              />
            </div>
            <div className="lg:col-span-4 flex justify-end">
              <button 
                disabled={isSubmitting}
                className="bg-primary text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Salvando...' : 'Criar Selo'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/80 dark:bg-gray-800/50 text-gray-500 text-[10px] uppercase tracking-widest font-black">
              <tr>
                <th className="px-8 py-5">Selo</th>
                <th className="px-8 py-5">Descrição</th>
                <th className="px-8 py-5 text-center">Usos</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse font-black">Carregando selos...</td></tr>
              ) : badgeTypes.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Nenhum selo cadastrado.</td></tr>
              ) : badgeTypes.map(badge => (
                <tr key={badge.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div 
                        className="size-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-gray-100 dark:border-gray-700"
                        style={{ backgroundColor: `${badge.color}15`, color: badge.color }}
                      >
                        {badge.icon}
                      </div>
                      <div>
                        <p className="font-black dark:text-white uppercase tracking-tighter">{badge.name}</p>
                        <p className="text-[10px] font-mono opacity-50 uppercase">{badge.color}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 max-w-xs">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium line-clamp-2">{badge.description || "Sem descrição."}</p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-[12px] font-black">
                      {badge._count?.badges || 0}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <span className={`size-2 rounded-full ${badge.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                       <span className={`text-[10px] font-black uppercase tracking-widest ${badge.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                         {badge.isActive ? 'Ativo' : 'Inativo'}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleToggleActive(badge)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${badge.isActive ? 'text-orange-500 bg-orange-50 hover:bg-orange-100' : 'text-green-500 bg-green-50 hover:bg-green-100'}`}
                      >
                        {badge.isActive ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
