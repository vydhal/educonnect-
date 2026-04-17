import React, { useState, useEffect } from 'react';
import { ModerationItem } from '../types';
import { moderationAPI } from '../api';
import { useModal } from '../contexts/ModalContext';

const AdminModerationPage: React.FC = () => {
    const [items, setItems] = useState<ModerationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { showModal } = useModal();

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const itemsData = await moderationAPI.getItems();
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
                console.error('Failed to fetch moderation items:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, []);

    const handleAction = async (id: string, newStatus: 'APROVADO' | 'REPROVADO') => {
        try {
            if (newStatus === 'APROVADO') {
                await moderationAPI.approveItem(id);
            } else {
                await moderationAPI.rejectItem(id, {});
            }
            setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
        } catch (error) {
            console.error('Error updating item status:', error);
            showModal({ title: 'Erro na Moderação', message: 'Não foi possível processar a ação solicitada. Por favor, tente novamente.', type: 'error' });
        }
    };

    return (
        <div className="animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2 uppercase italic dark:text-gray-100">Moderação de Conteúdo</h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Gerencie o que é publicado na rede EduConnect.</p>
                </div>
                <div className="flex bg-white dark:bg-gray-900 border dark:border-gray-800 p-1 rounded-2xl shadow-sm gap-1 self-stretch md:self-auto">
                    <button className="flex-1 md:flex-none px-6 py-2.5 text-xs font-black uppercase tracking-widest bg-primary text-white rounded-xl shadow-lg shadow-primary/20">Pendentes</button>
                    <button className="flex-1 md:flex-none px-6 py-2.5 text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary hover:bg-primary/5 rounded-xl transition-all">Moderados</button>
                </div>
            </header>

            {/* Moderation Table */}
            <section className="bg-white dark:bg-gray-900 rounded-3xl border dark:border-gray-800 shadow-sm overflow-hidden transition-colors duration-300">
                <div className="p-8 border-b dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight dark:text-gray-100">Publicações para Análise</h2>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest mt-1">Fila de Revisão Prioritária</p>
                    </div>
                    <div className="relative w-full md:w-96">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">search</span>
                        <input className="w-full bg-gray-50 dark:bg-gray-800/50 border-none rounded-2xl py-3 pl-12 text-sm focus:ring-2 focus:ring-primary/20 dark:text-gray-200 transition-all focus:bg-white dark:focus:bg-gray-800" placeholder="Buscar por autor ou conteúdo..." />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/80 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 text-[10px] uppercase tracking-[0.2em] font-black">
                            <tr>
                                <th className="px-8 py-5">Autor</th>
                                <th className="px-8 py-5">Data Envio</th>
                                <th className="px-8 py-5">Conteúdo (Preview)</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5 text-right">Decisão</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-gray-400 dark:text-gray-600 font-black uppercase tracking-widest text-xs animate-pulse">Carregando itens para moderação...</td>
                                </tr>
                            ) : items.filter(i => i.status === 'PENDENTE').length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30 dark:opacity-20 grayscale">
                                            <span className="material-symbols-outlined text-6xl">check_circle</span>
                                            <p className="text-sm font-black uppercase tracking-widest">Tudo limpo! Nenhuma publicação pendente.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : items.filter(i => i.status === 'PENDENTE').map(item => (
                                <tr key={item.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-xs shadow-inner">
                                                {item.author.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black uppercase tracking-tight dark:text-white group-hover:text-primary transition-colors">{item.author}</p>
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase truncate max-w-[150px]">{item.school}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-xs text-gray-400 dark:text-gray-500 font-black uppercase tracking-tighter">{item.date}</td>
                                    <td className="px-8 py-6 max-w-xs">
                                        <p className="text-sm font-medium dark:text-gray-300 line-clamp-1 opacity-80 group-hover:opacity-100 transition-opacity">"{item.contentPreview}"</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1.5 rounded-xl bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-[0.1em] border border-orange-200 dark:border-orange-500/20">
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                            <button
                                                onClick={() => handleAction(item.id, 'APROVADO')}
                                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-green-600/20 active:scale-95"
                                            >
                                                <span className="material-symbols-outlined text-sm font-fill-1">check</span> Aceitar
                                            </button>
                                            <button
                                                onClick={() => handleAction(item.id, 'REPROVADO')}
                                                className="flex items-center gap-2 border-2 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                                            >
                                                <span className="material-symbols-outlined text-sm">block</span> Barrar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-8 py-5 bg-gray-50/50 dark:bg-gray-800/30 border-t dark:border-gray-800 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600">
                    <p>Total na fila: {items.filter(i => i.status === 'PENDENTE').length} solicitações</p>
                    <div className="flex gap-2">
                         <button className="size-8 rounded-lg hover:bg-white dark:hover:bg-gray-700 flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                         </button>
                         <button className="size-8 rounded-lg hover:bg-white dark:hover:bg-gray-700 flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                         </button>
                    </div>
                </div>
            </section>

            {/* Feedback Area */}
            <section className="mt-10 p-8 bg-white dark:bg-gray-900 rounded-3xl border dark:border-gray-800 shadow-sm group">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black uppercase tracking-tight dark:text-gray-100 flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined font-fill-1">feedback</span>
                        </div>
                        Feedback de Moderação
                    </h3>
                </div>
                
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1">
                        <textarea
                            className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-3xl p-6 text-sm dark:text-gray-200 focus:ring-4 focus:ring-primary/10 min-h-[160px] outline-none transition-all focus:bg-white dark:focus:bg-gray-800 focus:border-primary/30"
                            placeholder="Descreva o motivo da decisão ou envie uma orientação pedagógica para o autor..."
                        />
                    </div>
                    <div className="flex flex-col gap-3 min-w-[200px]">
                        <button className="bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 hover:brightness-110 transition-all active:scale-95 text-[10px] uppercase tracking-[0.2em]">
                             Confirmar Feedback
                        </button>
                        <button className="text-gray-400 dark:text-gray-500 font-black py-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-[10px] uppercase tracking-[0.2em] border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                            Limpar Rascunho
                        </button>
                    </div>
                </div>
                <div className="mt-6 flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-600 font-black uppercase tracking-widest">
                    <span className="material-symbols-outlined text-xs">info</span>
                    O autor receberá uma notificação com este texto.
                </div>
            </section>
        </div>
    );
};

export default AdminModerationPage;
