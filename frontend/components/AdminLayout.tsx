import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { getMediaUrl } from '../api';

const SidebarItem: React.FC<{ icon: string, label: string, path: string, active?: boolean, onClick?: () => void }> = ({ icon, label, path, active, onClick }) => {
    const navigate = useNavigate();
    return (
        <div
            onClick={() => {
                navigate(path);
                if (onClick) onClick();
            }}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all cursor-pointer ${active ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
        >
            <span className={`material-symbols-outlined ${active ? 'font-fill-1' : ''}`}>{icon}</span>
            <span className="text-sm font-bold">{label}</span>
        </div>
    );
};

const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { settings } = useSettings();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const isActive = (path: string) => {
        if (path === '/admin' && (location.pathname === '/admin' || location.pathname === '/admin/stats')) return true;
        return location.pathname.startsWith(path) && path !== '/admin';
    };

    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className="flex min-h-screen bg-[#f6f6f8] dark:bg-gray-950 text-[#0d121b] dark:text-gray-100 overflow-x-hidden transition-colors duration-300">
            {/* Mobile Header Overlay */}
            <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeSidebar} />

            {/* Mobile Header Top Bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b dark:border-gray-800 z-30 flex items-center justify-between px-4">
                <div className="flex items-center gap-2 text-primary cursor-pointer">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg shrink-0">
                        <span className="material-symbols-outlined">menu_open</span>
                    </button>
                    <h2 onClick={() => navigate('/admin')} className="text-sm font-black uppercase tracking-tight">Painel Admin</h2>
                </div>
                <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border border-primary/20">
                    <img src={`https://ui-avatars.com/api/?name=Admin&background=random`} alt="Admin" />
                </div>
            </div>

            {/* Sidebar */}
            <aside className={`w-72 bg-[#0d121b] text-white flex flex-col fixed h-full z-50 shadow-2xl transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-8 flex items-center gap-3">
                    <div className="bg-primary size-10 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden shadow-lg shadow-primary/30" onClick={() => navigate('/admin')}>
                        {settings.LOGO_URL ? (
                            <img src={getMediaUrl(settings.LOGO_URL)} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <span className="material-symbols-outlined text-white font-fill-1">school</span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-white text-base font-black leading-none uppercase tracking-tighter">{settings.APP_NAME || 'EduConnect CG'}</h1>
                        <p className="text-gray-500 text-[10px] mt-1 uppercase tracking-widest font-black opacity-80">Gestão Regional</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 mt-4 space-y-1 overflow-y-auto custom-scrollbar">
                    <SidebarItem icon="dashboard" label="Dashboard" path="/admin" active={isActive('/admin')} onClick={closeSidebar} />
                    <SidebarItem icon="workspace_premium" label="Selos" path="/admin/badges" active={isActive('/admin/badges')} onClick={closeSidebar} />
                    <SidebarItem icon="group" label="Usuários" path="/admin/users" active={isActive('/admin/users')} onClick={closeSidebar} />
                    <SidebarItem icon="school" label="Escolas" path="/admin/schools" active={isActive('/admin/schools')} onClick={closeSidebar} />
                    <SidebarItem icon="calendar_month" label="Eventos" path="/admin/events" active={isActive('/admin/events')} onClick={closeSidebar} />
                    <SidebarItem icon="assessment" label="Relatórios" path="/admin/reports" active={isActive('/admin/reports')} onClick={closeSidebar} />
                    <SidebarItem icon="settings" label="Configurações" path="/admin/settings" active={isActive('/admin/settings')} onClick={closeSidebar} />
                </nav>

                <div className="p-6 border-t border-white/5 space-y-2">
                    <button
                        onClick={() => navigate('/feed')}
                        className="flex items-center gap-3 text-emerald-400 hover:text-white hover:bg-emerald-500/10 transition-colors text-xs font-black uppercase tracking-widest w-full px-4 py-3 rounded-xl border border-emerald-500/10"
                    >
                        <span className="material-symbols-outlined text-xl">public</span>
                        Ver Site
                    </button>

                    <button
                        onClick={() => navigate('/login')}
                        className="flex items-center gap-3 text-red-400 hover:text-white hover:bg-red-500/10 transition-colors text-xs font-black uppercase tracking-widest w-full px-4 py-3 rounded-xl"
                    >
                        <span className="material-symbols-outlined text-xl">logout</span>
                        Sair do Painel
                    </button>
                </div>

                {/* User Mini Profile */}
                <div className="p-4 bg-white/5 mx-4 rounded-2xl flex items-center gap-3 mb-6 border border-white/5 shadow-inner">
                    <div className="size-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold border-2 border-orange-500/20 shadow-sm shrink-0">
                        <img src={`https://ui-avatars.com/api/?name=Admin+User&background=random`} alt="" className="rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">Admin Regional</h4>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider truncate">SME Campina Grande</p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 lg:ml-72 pt-24 lg:pt-10 p-4 md:p-10 transition-all duration-300 min-w-0">
                <div className="max-w-[1200px] mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
