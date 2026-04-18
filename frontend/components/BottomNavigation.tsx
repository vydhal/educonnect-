import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../constants';
import { getMediaUrl } from '../api';

interface BottomNavigationProps {
    activeTab: 'home' | 'network' | 'projects' | 'profile';
    user: any;
    onLogout: () => void;
    onCreatePost: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, user, onLogout, onCreatePost }) => {
    const navigate = useNavigate();

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 px-2 py-2 z-50 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
            <button 
                onClick={() => navigate('/feed')} 
                className={`flex flex-col items-center gap-0.5 w-12 ${activeTab === 'home' ? 'text-primary' : 'text-gray-400'}`}
            >
                <span className={`material-symbols-outlined text-[28px] ${activeTab === 'home' ? 'font-fill-1' : ''}`}>home</span>
                <span className="text-[9px] font-black uppercase tracking-tighter">Início</span>
            </button>

            <button 
                onClick={() => navigate('/network')} 
                className={`flex flex-col items-center gap-0.5 w-12 ${activeTab === 'network' ? 'text-primary' : 'text-gray-400'}`}
            >
                <span className={`material-symbols-outlined text-[28px] ${activeTab === 'network' ? 'font-fill-1' : ''}`}>group</span>
                <span className="text-[9px] font-black uppercase tracking-tighter">Rede</span>
            </button>

            {/* Central Plus Button */}
            <div className="relative -top-6">
                <button 
                    onClick={onCreatePost}
                    className="size-14 bg-primary text-white rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(13,110,253,0.3)] hover:scale-110 active:scale-90 transition-all border-4 border-white dark:border-gray-900"
                >
                    <span className="material-symbols-outlined text-3xl font-black">add</span>
                </button>
            </div>

            <button 
                onClick={() => navigate('/projects')} 
                className={`flex flex-col items-center gap-0.5 w-12 ${activeTab === 'projects' ? 'text-primary' : 'text-gray-400'}`}
            >
                <span className={`material-symbols-outlined text-[28px] ${activeTab === 'projects' ? 'font-fill-1' : ''}`}>school</span>
                <span className="text-[9px] font-black uppercase tracking-tighter">Projetos</span>
            </button>

            <button 
                onClick={() => navigate(user?.id ? `/profile/${user.id}` : '/settings')} 
                className={`flex flex-col items-center gap-0.5 w-12 ${activeTab === 'profile' ? 'text-primary' : 'text-gray-400'}`}
            >
                <div className={`size-7 rounded-full bg-cover bg-center border-2 ${activeTab === 'profile' ? 'border-primary shadow-sm' : 'border-gray-200 opacity-80'}`}
                    style={{ backgroundImage: `url(${getMediaUrl(user?.avatar) || IMAGES.DEFAULT_AVATAR})` }}
                />
                <span className="text-[9px] font-black uppercase tracking-tighter">Perfil</span>
            </button>
        </div>
    );
};
