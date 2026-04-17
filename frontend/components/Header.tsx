import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, notificationsAPI, socialAPI, getMediaUrl } from '../api';
import { useSettings } from '../contexts/SettingsContext';
import { IMAGES } from '../constants';
import { BottomNavigation } from './BottomNavigation';
import { RichPostInput } from './RichPostInput';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
    activeTab: 'home' | 'network' | 'projects' | 'profile';
    onLogout: () => void;
    user?: any; // If undefined, component will fetch it. If null, it assumes loading.
}

// Reusable Modal Component
const GlobalPostModal: React.FC<{ onClose: () => void, children: React.ReactNode }> = ({ onClose, children }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-900 w-full md:max-w-[600px] h-full md:h-auto rounded-none md:rounded-[32px] shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col md:max-h-[90vh]">
            <div className="px-8 py-6 border-b dark:border-gray-800 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-black">Nova Publicação</h2>
                <button onClick={onClose} className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar overflow-x-visible flex-1">
                {children}
            </div>
        </div>
    </div>
);

const NavIcon: React.FC<{ icon: string, label: string, active?: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 group ${active ? 'text-primary' : 'text-gray-500 hover:text-primary transition-colors'}`}>
        <span className={`material-symbols-outlined ${active ? 'font-fill-1' : ''}`}>{icon}</span>
        <span className="text-[10px] font-bold">{label}</span>
    </button>
);

export const Header: React.FC<HeaderProps> = ({ activeTab, onLogout, user: propUser }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(propUser || null);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [searchLocal, setSearchLocal] = useState('');
    const { settings } = useSettings();

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchLocal.trim()) {
            navigate(`/feed?search=${encodeURIComponent(searchLocal.trim())}`);
        } else {
            navigate('/feed');
        }
    };

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
        <>
            <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b px-6 py-3 shadow-sm">
                <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-primary cursor-pointer" onClick={() => navigate('/feed')}>
                            {settings.LOGO_URL ? (
                                <img src={getMediaUrl(settings.LOGO_URL)} alt="Logo" className="h-8 w-auto object-contain" />
                            ) : (
                                <span className="material-symbols-outlined text-3xl font-fill-1">auto_awesome</span>
                            )}
                            <h2 className="text-xl font-black hidden lg:block text-[#0d121b] dark:text-white">
                                {settings.APP_NAME || 'EduConnect CG'}
                                <span className="text-[8px] align-top text-primary ml-1">(DEV)</span>
                            </h2>
                        </div>

                        {/* Search Bar - Desktop */}
                        <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
                            <form onSubmit={handleSearchSubmit} className="relative w-full">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-light">search</span>
                                <input
                                    type="text"
                                    value={searchLocal}
                                    onChange={(e) => setSearchLocal(e.target.value)}
                                    placeholder="Pesquisar por #hashtags ou pessoas..."
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-2.5 pl-10 pr-4 text-xs font-medium focus:ring-2 ring-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 shadow-inner"
                                />
                            </form>
                        </div>
                    </div>
                    
                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex gap-8 items-center">
                        <NavIcon icon="home" label="Início" active={activeTab === 'home'} onClick={() => navigate('/feed')} />
                        <NavIcon icon="group" label="Rede" active={activeTab === 'network'} onClick={() => navigate('/network')} />
                        <NavIcon icon="school" label="Projetos" active={activeTab === 'projects'} onClick={() => navigate('/projects')} />
                    </nav>

                    <div className="flex items-center gap-3 md:border-l md:pl-4">
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
                        
                        {/* Desktop Actions */}
                        <div className="hidden md:flex items-center gap-3">
                            <NotificationBell notificationsAPI={notificationsAPI} socialAPI={socialAPI} />
                            <button onClick={onLogout} title="Sair" className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                                <span className="material-symbols-outlined">logout</span>
                            </button>
                            <button
                                onClick={() => navigate('/settings')}
                                title="Configurações"
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary transition-colors"
                            >
                                <span className="material-symbols-outlined">settings</span>
                            </button>
                        </div>

                        <div
                            onClick={() => user?.id && navigate(`/profile/${user.id}`)}
                            title="Ver meu perfil público"
                            className="size-9 rounded-full bg-cover bg-center border border-gray-200 cursor-pointer hover:ring-2 ring-primary transition-all shrink-0"
                            style={{ backgroundImage: `url(${getMediaUrl(user?.avatar) || IMAGES.DEFAULT_AVATAR})` }}
                        />

                        {/* Mobile Search Toggle + Notifications */}
                        <div className="lg:hidden flex items-center gap-1">
                            <NotificationBell notificationsAPI={notificationsAPI} socialAPI={socialAPI} />
                            <button 
                                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                            >
                                <span className="material-symbols-outlined">{isMobileSearchOpen ? 'close' : 'search'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Search Bar - Collapsible */}
                {isMobileSearchOpen && (
                    <div className="lg:hidden mt-3 pt-3 border-t dark:border-gray-800 animate-in slide-in-from-top-4 duration-300">
                        <form onSubmit={handleSearchSubmit} className="relative w-full">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-light">search</span>
                            <input
                                autoFocus
                                type="text"
                                value={searchLocal}
                                onChange={(e) => setSearchLocal(e.target.value)}
                                placeholder="Pesquisar hashtags ou pessoas..."
                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-3 pl-10 pr-4 text-sm font-medium focus:ring-2 ring-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 shadow-inner"
                            />
                        </form>
                    </div>
                )}
            </header>

            {/* Mobile Bottom Navigation */}
            <BottomNavigation 
                activeTab={activeTab} 
                user={user} 
                onLogout={onLogout} 
                onCreatePost={() => setIsPostModalOpen(true)}
            />

            {/* Global Post Creation Modal */}
            {isPostModalOpen && (
                <GlobalPostModal onClose={() => setIsPostModalOpen(false)}>
                    <RichPostInput 
                        onPostCreated={() => {
                            setIsPostModalOpen(false);
                            if (window.location.pathname.includes('/feed')) {
                                window.location.reload();
                            } else {
                                navigate('/feed');
                            }
                        }} 
                        userAvatar={user?.avatar} 
                    />
                </GlobalPostModal>
            )}
        </>
    );
};
