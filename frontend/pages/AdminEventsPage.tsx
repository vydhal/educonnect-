
import React, { useState, useEffect } from 'react';
import { socialAPI } from '../api';

interface WeeklyEvent {
    id: string;
    name: string;
    date: string;
    link?: string;
}

const AdminEventsPage: React.FC = () => {
    const [events, setEvents] = useState<WeeklyEvent[]>([]);
    const [loading, setLoading] = useState(true);
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
            alert('Evento criado com sucesso!');
        } catch (error) {
            console.error(error);
            alert('Erro ao criar evento');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este evento?')) return;
        try {
            await socialAPI.deleteEvent(id);
            fetchEvents();
        } catch (error) {
            console.error(error);
            alert('Erro ao excluir evento');
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Eventos da Semana</h1>
                    <p className="text-gray-500">Gerencie os eventos que aparecem no feed para toda a comunidade.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:brightness-110 shadow-lg shadow-primary/20 transition-all font-bold"
                >
                    <span className="material-symbols-outlined">add</span> Novo Evento
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 border-b">
                        <tr>
                            <th className="p-5 font-bold text-xs uppercase tracking-wider text-gray-500">Evento</th>
                            <th className="p-5 font-bold text-xs uppercase tracking-wider text-gray-500">Data e Hora</th>
                            <th className="p-5 font-bold text-xs uppercase tracking-wider text-gray-500">Link</th>
                            <th className="p-5 font-bold text-xs uppercase tracking-wider text-gray-500 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {events.length > 0 ? events.map(event => (
                            <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-5">
                                    <p className="font-bold text-gray-900">{event.name}</p>
                                </td>
                                <td className="p-5 text-sm text-gray-700">
                                    {new Date(event.date).toLocaleString('pt-BR')}
                                </td>
                                <td className="p-5 text-sm text-blue-600 truncate max-w-[200px]">
                                    {event.link || '—'}
                                </td>
                                <td className="p-5">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleDelete(event.id)}
                                            className="size-8 flex items-center justify-center rounded-lg bg-gray-100 text-red-600 hover:bg-red-50 transition-colors"
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
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6">Novo Evento</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700">Nome do Evento</label>
                                <input
                                    required
                                    value={newEvent.name}
                                    onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                                    className="w-full bg-gray-50 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 outline-none"
                                    placeholder="Ex: Workshop de Robótica"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700">Data e Hora</label>
                                <input
                                    required
                                    type="datetime-local"
                                    value={newEvent.date}
                                    onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                                    className="w-full bg-gray-50 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700">Link (Opcional)</label>
                                <input
                                    type="url"
                                    value={newEvent.link}
                                    onChange={e => setNewEvent({ ...newEvent, link: e.target.value })}
                                    className="w-full bg-gray-50 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 outline-none"
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsCreating(false)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                                <button type="submit" className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity">Criar Evento</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminEventsPage;
