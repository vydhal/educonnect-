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
            <header className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">Moderação de Conteúdo</h1>
                    <p className="text-gray-500 font-medium">Gerencie o que é publicado na rede EduConnect CG.</p>
                </div>
                <div className="flex bg-white border p-1 rounded-2xl shadow-sm gap-1">
                    <button className="px-4 py-2 text-xs font-bold bg-primary text-white rounded-xl shadow-lg shadow-primary/20">Pendentes</button>
                    <button className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">Analisados</button>
                </div>
            </header>

            {/* Moderation Table */}
            <section className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="p-6 border-b flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-bold">Publicações para Análise</h2>
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
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">Carregando itens para moderação...</td>
                                </tr>
                            ) : items.filter(i => i.status === 'PENDENTE').length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">Nenhuma publicação pendente no momento. 🏖️</td>
                                </tr>
                            ) : items.filter(i => i.status === 'PENDENTE').map(item => (
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
                    <p>Fila de moderação: {items.filter(i => i.status === 'PENDENTE').length} itens pendentes.</p>
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
        </div>
    );
};

export default AdminModerationPage;
