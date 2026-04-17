
import React, { useState, useEffect } from 'react';
import { socialAPI } from '../api';
import { useModal } from '../contexts/ModalContext';

interface WeeklyEvent {
    id: string;
    name: string;
    date: string;
    link?: string;
}

const AdminEventsPage: React.FC = () => {
    const [events, setEvents] = useState<WeeklyEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const { showModal } = useModal();
    const [isCreating, setIsCreating] = useState(false);
    const [newEvent, setNewEvent] = useState({
        name: '',
        date: '',
        link: ''
    });

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const data = await socialAPI.getEvents();
            setEvents(data);
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await socialAPI.createEvent(newEvent);
            setIsCreating(false);
            setNewEvent({ name: '', date: '', link: '' });
            fetchEvents();
            showModal({ title: 'Sucesso', message: 'Evento criado com sucesso e já está visível no feed!', type: 'success' });
        } catch (error) {
            console.error(error);
            showModal({ title: 'Erro ao Criar', message: 'Houve um problema ao salvar o evento. Verifique os dados e tente novamente.', type: 'error' });
        }
    };

    const handleDelete = async (id: string) => {
        showModal({
            title: 'Excluir Evento',
            message: 'Tem certeza que deseja remover este evento permanentemente?',
            type: 'warning',
            confirmLabel: 'Excluir',
            onConfirm: async () => {
                try {
                    await socialAPI.deleteEvent(id);
                    fetchEvents();
                    showModal({ title: 'Sucesso', message: 'Evento removido com sucesso.', type: 'success' });
                } catch (error) {
                    console.error(error);
                    showModal({ title: 'Erro ao Excluir', message: 'Não foi possível remover o evento agora.', type: 'error' });
                }
            }
        });
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold dark:text-white">Eventos da Semana</h1>
                    <p className="text-gray-500">Gerencie os eventos que aparecem no feed para toda a comunidade.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:brightness-110 shadow-lg shadow-primary/20 transition-all font-bold"
                >
                    <span className="material-symbols-outlined">add</span> Novo Evento
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-800">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b dark:border-gray-800">
                        <tr>
                            <th className="p-5 font-bold text-xs uppercase tracking-wider text-gray-500">Evento</th>
                            <th className="p-5 font-bold text-xs uppercase tracking-wider text-gray-500">Data e Hora</th>
                            <th className="p-5 font-bold text-xs uppercase tracking-wider text-gray-500">Link</th>
                            <th className="p-5 font-bold text-xs uppercase tracking-wider text-gray-500 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {events.length > 0 ? events.map(event => (
                            <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <td className="p-5">
                                    <p className="font-bold text-gray-900 dark:text-gray-100">{event.name}</p>
                                </td>
                                <td className="p-5 text-sm text-gray-700 dark:text-gray-300">
                                    {new Date(event.date).toLocaleString('pt-BR')}
                                </td>
                                <td className="p-5 text-sm text-blue-600 truncate max-w-[200px]">
                                    {event.link || '—'}
                                </td>
                                <td className="p-5">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleDelete(event.id)}
                                            className="size-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-gray-500">
                                    {loading ? 'Carregando...' : 'Nenhum evento futuro cadastrado.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isCreating && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-fade-in">
                        <h2 className="text-2xl font-bold mb-6 dark:text-white">Novo Evento</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Nome do Evento</label>
                                <input
                                    required
                                    value={newEvent.name}
                                    onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                                    placeholder="Ex: Workshop de Robótica"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Data e Hora</label>
                                <input
                                    required
                                    type="datetime-local"
                                    value={newEvent.date}
                                    onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Link (Opcional)</label>
                                <input
                                    type="url"
                                    value={newEvent.link}
                                    onChange={e => setNewEvent({ ...newEvent, link: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t dark:border-gray-800">
                                <button type="button" onClick={() => setIsCreating(false)} className="px-5 py-2.5 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">Cancelar</button>
                                <button type="submit" className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20">Criar Evento</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminEventsPage;
