import React, { useState, useEffect } from 'react';
import { supportAPI } from '../api';

const AdminSupportPage: React.FC = () => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const [formType, setFormType] = useState('FAQ');
    const [formTitle, setFormTitle] = useState('');
    const [formContent, setFormContent] = useState('');
    const [formLink, setFormLink] = useState('');
    const [formOrder, setFormOrder] = useState<number>(0);

    const loadItems = async () => {
        setLoading(true);
        try {
            const data = await supportAPI.getSupportItems();
            setItems(data);
        } catch (error) {
            console.error('Error loading support items', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
    }, []);

    const openEditModal = (item?: any) => {
        if (item) {
            setSelectedItem(item);
            setFormType(item.type);
            setFormTitle(item.title);
            setFormContent(item.content);
            setFormLink(item.link || '');
            setFormOrder(item.order);
        } else {
            setSelectedItem(null);
            setFormType('FAQ');
            setFormTitle('');
            setFormContent('');
            setFormLink('');
            setFormOrder(0);
        }
        setIsEditModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const data = {
                type: formType,
                title: formTitle,
                content: formContent,
                link: formLink || null,
                order: formOrder
            };

            if (selectedItem) {
                await supportAPI.updateSupportItem(selectedItem.id, data);
            } else {
                await supportAPI.createSupportItem(data);
            }
            setIsEditModalOpen(false);
            loadItems();
        } catch (error) {
            console.error('Error saving support item', error);
            alert('Não foi possível salvar o item. Verifique os dados e tente novamente.');
        }
    };

    const confirmDelete = async () => {
        if (!selectedItem) return;
        try {
            await supportAPI.deleteSupportItem(selectedItem.id);
            setIsDeleteModalOpen(false);
            loadItems();
        } catch (error) {
            console.error('Error deleting item', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-black text-navy">Suporte: FAQ e Tutoriais</h1>
                    <p className="text-gray-500 text-sm mt-1">Gerencie os conteúdos de ajuda disponíveis para os usuários</p>
                </div>
                <button
                    onClick={() => openEditModal()}
                    className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-xl">add</span>
                    Novo Item
                </button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl">
                        <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                        <p>Nenhum item de suporte cadastrado ainda.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map(item => (
                            <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 gap-4">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                                        <span className={`material-symbols-outlined ${item.type === 'FAQ' ? 'text-blue-500' : 'text-purple-500'}`}>
                                            {item.type === 'FAQ' ? 'help' : 'play_circle'}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${item.type === 'FAQ' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                {item.type}
                                            </span>
                                            <span className="text-xs text-gray-400 font-bold">Ordem: {item.order}</span>
                                        </div>
                                        <h3 className="font-bold text-gray-800 mt-1">{item.title}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.content}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 md:border-l md:pl-4 border-gray-200">
                                    <button
                                        onClick={() => openEditModal(item)}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                        title="Editar"
                                    >
                                        <span className="material-symbols-outlined text-xl">edit</span>
                                    </button>
                                    <button
                                        onClick={() => { setSelectedItem(item); setIsDeleteModalOpen(true); }}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        title="Excluir"
                                    >
                                        <span className="material-symbols-outlined text-xl">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-navy">{selectedItem ? 'Editar Item de Suporte' : 'Novo Item de Suporte'}</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors bg-gray-100 hover:bg-red-50 p-2 rounded-xl">
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo</label>
                                <select value={formType} onChange={(e) => setFormType(e.target.value)} className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none">
                                    <option value="FAQ">FAQ (Pergunta Frequente)</option>
                                    <option value="TUTORIAL">Tutorial / Vídeo</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Título do item</label>
                                <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ex: Como recuperar minha senha?" className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Conteúdo / Resposta</label>
                                <textarea rows={5} value={formContent} onChange={(e) => setFormContent(e.target.value)} placeholder="Explique detalhadamente a resposta ou o foco do tutorial..." className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none resize-none"></textarea>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Link Externo (Opcional - Ex: Link de Vídeo)</label>
                                <input type="text" value={formLink} onChange={(e) => setFormLink(e.target.value)} placeholder="https://youtube.com/..." className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Ordem (menor aparece primeiro)</label>
                                <input type="number" value={formOrder} onChange={(e) => setFormOrder(parseInt(e.target.value) || 0)} className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none" />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-6 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancelar</button>
                            <button onClick={handleSave} className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">save</span>
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center">
                        <div className="size-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mx-auto mb-4">
                            <span className="material-symbols-outlined text-3xl">warning</span>
                        </div>
                        <h2 className="text-xl font-black text-navy mb-2">Tem certeza?</h2>
                        <p className="text-sm text-gray-500 mb-6">Você está prestes a excluir este item de suporte. Esta ação não pode ser desfeita.</p>
                        <div className="flex justify-center gap-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="px-6 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancelar</button>
                            <button onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all">Excluir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSupportPage;
