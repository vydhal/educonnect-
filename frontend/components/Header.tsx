import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';

interface HeaderProps {
    activeTab: 'home' | 'network' | 'projects';
    onLogout: () => void;
    user?: any; // If undefined, component will fetch it. If null, it assumes loading.
}

const NavIcon: React.FC<{ icon: string, label: string, active?: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 group ${active ? 'text-primary' : 'text-gray-500 hover:text-primary transition-colors'}`}>
        <span className={`material-symbols-outlined ${active ? 'font-fill-1' : ''}`}>{icon}</span>
        <span className="text-[10px] font-bold">{label}</span>
    </button>
);

export const Header: React.FC<HeaderProps> = ({ activeTab, onLogout, user: propUser }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(propUser || null);

    useEffect(() => {
        // If propUser is provided (or becomes provided), sync it
        if (propUser !== undefined) {
            setUser(propUser);
        }
    }, [propUser]);

    useEffect(() => {
        // If propUser is strictly undefined (not passed), fetch it ourselves
        if (propUser === undefined) {
            authAPI.getProfile()
                .then(data => setUser(data))
                .catch(err => console.error('Header failed to load profile', err));
        }
    }, [propUser]);

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
                    {user?.role === 'ADMIN' && (
                        <button
                            onClick={() => navigate('/admin')}
                            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-xs font-bold transition-colors mr-2 text-gray-700 dark:text-gray-300"
                            title="Ir para Painel Admin"
                        >
                            <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                            Admin
                        </button>
                    )}
                    <button onClick={onLogout} title="Sair" className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined">logout</span>
                    </button>
                    <div
                        onClick={() => navigate('/settings')}
                        className="size-9 rounded-full bg-cover bg-center border border-gray-200 cursor-pointer hover:ring-2 ring-primary transition-all"
                        style={{ backgroundImage: `url(${user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`})` }}
                    />
                </div>
            </div>
        </header>
    );
};
