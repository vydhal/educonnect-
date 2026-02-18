
import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';

const SidebarItem: React.FC<{ icon: string, label: string, path: string, active?: boolean }> = ({ icon, label, path, active }) => {
    const navigate = useNavigate();
    return (
        <div
            onClick={() => navigate(path)}
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

    const isActive = (path: string) => {
        if (path === '/admin' && (location.pathname === '/admin' || location.pathname === '/admin/stats')) return true;
        return location.pathname.startsWith(path) && path !== '/admin';
    };

    return (
        <div className="flex min-h-screen bg-[#f6f6f8] text-[#0d121b]">
            {/* Sidebar */}
            <aside className="w-72 bg-navy-sidebar text-white flex flex-col fixed h-full z-10 shadow-2xl">
                <div className="p-8 flex items-center gap-3">
                    <div className="bg-primary size-10 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden" onClick={() => navigate('/')}>
                        {settings.LOGO_URL ? (
                            <img src={settings.LOGO_URL} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <span className="material-symbols-outlined text-white font-fill-1">school</span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-white text-base font-bold leading-none">{settings.APP_NAME || 'EduConnect CG'}</h1>
                        <p className="text-gray-500 text-[10px] mt-1 uppercase tracking-widest font-bold">Painel Admin</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 mt-4 space-y-1">
                    <SidebarItem icon="dashboard" label="Dashboard" path="/admin" active={isActive('/admin')} />
                    <SidebarItem icon="verified_user" label="Moderação" path="/admin/moderation" active={isActive('/admin/moderation')} />
                    <SidebarItem icon="group" label="Usuários" path="/admin/users" active={isActive('/admin/users')} />
                    <SidebarItem icon="school" label="Escolas" path="/admin/schools" active={isActive('/admin/schools')} />
                    <SidebarItem icon="assessment" label="Relatórios" path="/admin/reports" active={isActive('/admin/reports')} />
                    <SidebarItem icon="settings" label="Configurações" path="/admin/settings" active={isActive('/admin/settings')} />
                </nav>

                <div className="p-6 border-t border-white/5 space-y-2">
                    <button
                        onClick={() => navigate('/feed')}
                        className="flex items-center gap-3 text-emerald-400 hover:text-white hover:bg-emerald-500/10 transition-colors text-sm font-medium w-full px-4 py-3 rounded-xl"
                    >
                        <span className="material-symbols-outlined text-xl">public</span>
                        Ver Site
                    </button>

                    <button className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors text-sm font-medium w-full px-4 py-3 rounded-xl hover:bg-white/5">
                        <span className="material-symbols-outlined text-xl">help_center</span>
                        Suporte
                    </button>

                    <button
                        onClick={() => navigate('/login')}
                        className="flex items-center gap-3 text-red-400 hover:text-white hover:bg-red-500/10 transition-colors text-sm font-medium w-full px-4 py-3 rounded-xl"
                    >
                        <span className="material-symbols-outlined text-xl">logout</span>
                        Sair do Painel
                    </button>
                </div>

                {/* User Mini Profile */}
                <div className="p-6 bg-black/20 m-4 rounded-2xl flex items-center gap-3 mb-6">
                    <div className="size-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold border-2 border-orange-500/20">
                        <img src={`https://ui-avatars.com/api/?name=Admin+User&background=random`} alt="" className="rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">Admin Regional</h4>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider truncate">SME Campina Grande</p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 ml-72 p-10">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
