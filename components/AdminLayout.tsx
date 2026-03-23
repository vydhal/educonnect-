
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IMAGES } from '../constants';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#f6f6f8] text-[#0d121b]">
      {/* Sidebar */}
      <aside className="w-72 bg-navy-sidebar text-white flex flex-col fixed h-full z-10 shadow-2xl">
        <div className="p-8 flex items-center gap-3">
          <div className="bg-primary size-10 rounded-xl flex items-center justify-center cursor-pointer" onClick={() => navigate('/')}>
            <span className="material-symbols-outlined text-white font-fill-1">school</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-white text-base font-bold leading-none">EduConnect CG</h1>
            <p className="text-gray-500 text-[10px] mt-1 uppercase tracking-widest font-bold">Painel Admin</p>
          </div>
        </div>

        <nav className="flex-1 px-4 mt-4 space-y-1">
          <SidebarItem icon="dashboard" label="Dashboard" path="/admin" active={location.pathname === '/admin'} />
          <SidebarItem icon="verified_user" label="Moderação" path="/admin/moderation" active={location.pathname === '/admin/moderation'} />
          <SidebarItem icon="group" label="Usuários" path="/admin/users" active={location.pathname === '/admin/users'} />
          <SidebarItem icon="assessment" label="Relatórios" path="/admin/reports" active={location.pathname === '/admin/reports'} />
          <SidebarItem icon="settings" label="Configurações" path="/admin/settings" active={location.pathname === '/admin/settings'} />
        </nav>

        <div className="p-6 border-t border-white/5 space-y-2">
          <button 
            onClick={() => navigate('/admin/support')}
            className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors text-sm font-medium w-full px-4 py-3 rounded-xl hover:bg-white/5"
          >
            <span className="material-symbols-outlined text-xl">help_center</span>
            Suporte
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-red-400 hover:text-red-300 transition-colors text-sm font-bold w-full px-4 py-3 rounded-xl hover:bg-red-500/10"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            Sair do Painel
          </button>

          <div className="mt-4 flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="size-10 rounded-full bg-cover bg-center border border-white/10" style={{ backgroundImage: `url(${IMAGES.AVATAR_ADMIN})` }} />
            <div>
              <p className="text-xs font-bold">Admin Regional</p>
              <p className="text-[10px] text-gray-500 uppercase">SME Campina Grande</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-72 p-10">
        {children}
      </main>
    </div>
  );
};

const SidebarItem: React.FC<{icon: string, label: string, path: string, active?: boolean}> = ({ icon, label, path, active }) => {
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

export default AdminLayout;
