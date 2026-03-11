
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../constants';

interface Notification {
    id: string;
    type: 'FOLLOW' | 'BADGE' | 'TESTIMONIAL' | 'POST_LIKE' | 'POST_COMMENT';
    content: string;
    isRead: boolean;
    createdAt: string;
    sender?: {
        id: string;
        name: string;
        avatar: string | null;
    };
}

export const Header: React.FC<{ activeTab: 'home' | 'network' | 'projects', onLogout: () => void }> = ({ activeTab, onLogout }) => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Simulação de busca de notificações (seria substituído por chamada real à API)
    useEffect(() => {
        // Exemplo de dados iniciais
        const mockNotifications: Notification[] = [
            {
                id: '1',
                type: 'FOLLOW',
                content: 'começou a te seguir',
                isRead: false,
                createdAt: new Date().toISOString(),
                sender: { id: 'u1', name: 'Ana Souza', avatar: null }
            }
        ];
        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.isRead).length);
    }, []);

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    };

    return (
        <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b px-6 py-3 shadow-sm">
            <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-primary cursor-pointer" onClick={() => navigate('/')}>
                        <span className="material-symbols-outlined text-3xl font-fill-1">auto_awesome</span>
                        <h2 className="text-xl font-black hidden lg:block text-[#0d121b] dark:text-white">EduConnect CG</h2>
                    </div>
                </div>

                <nav className="flex gap-4 md:gap-8 items-center">
                    <NavIcon icon="home" label="Início" active={activeTab === 'home'} onClick={() => navigate('/feed')} />
                    <NavIcon icon="group" label="Rede" active={activeTab === 'network'} onClick={() => navigate('/network')} />
                    <NavIcon icon="school" label="Projetos" active={activeTab === 'projects'} onClick={() => navigate('/projects')} />
                </nav>

                <div className="flex items-center gap-3 border-l pl-4">
                    {/* Notifications Bell */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`p-2 rounded-full transition-colors relative ${showNotifications ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 text-gray-500'}`}
                        >
                            <span className="material-symbols-outlined">notifications</span>
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 size-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                                    <h3 className="font-bold text-sm">Notificações</h3>
                                    {unreadCount > 0 && (
                                        <button onClick={markAllAsRead} className="text-[10px] font-bold text-primary hover:underline">Marcar todas como lidas</button>
                                    )}
                                </div>
                                <div className="max-h-[400px] overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-gray-400">
                                            <span className="material-symbols-outlined text-4xl mb-2 opacity-20">notifications_off</span>
                                            <p className="text-xs">Nenhuma notificação por enquanto</p>
                                        </div>
                                    ) : (
                                        notifications.map(notification => (
                                            <div
                                                key={notification.id}
                                                onClick={() => markAsRead(notification.id)}
                                                className={`p-4 border-b dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer flex gap-3 ${!notification.isRead ? 'bg-primary/[0.03]' : ''}`}
                                            >
                                                <div className="size-10 rounded-full bg-cover bg-center shrink-0 border dark:border-gray-600" style={{ backgroundImage: `url(${notification.sender?.avatar || IMAGES.AVATAR_PROFESSOR})` }} />
                                                <div className="min-w-0">
                                                    <p className="text-xs dark:text-gray-200">
                                                        <span className="font-bold">{notification.sender?.name}</span> {notification.content}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 mt-1">há instantes</p>
                                                </div>
                                                {!notification.isRead && <div className="size-2 bg-primary rounded-full shrink-0 mt-1.5" />}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <button onClick={onLogout} title="Sair" className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined">logout</span>
                    </button>

                    <div className="size-9 rounded-full bg-cover bg-center border border-gray-200 cursor-pointer" style={{ backgroundImage: `url(${IMAGES.AVATAR_PROFESSOR})` }} />
                </div>
            </div>
        </header>
    );
};

const NavIcon: React.FC<{ icon: string, label: string, active?: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 group ${active ? 'text-primary' : 'text-gray-500 hover:text-primary transition-colors'}`}>
        <span className={`material-symbols-outlined ${active ? 'font-fill-1' : ''}`}>{icon}</span>
        <span className="text-[10px] font-bold">{label}</span>
    </button>
);
