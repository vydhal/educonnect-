import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, supportAPI, getMediaUrl } from '../api';
import { Header } from '../components/Header';
import { useSettings } from '../contexts/SettingsContext';
import { ImageUpload } from '../components/ImageUpload';
import { IMAGES } from '../constants';

const ProfileSettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const { darkMode, toggleDarkMode } = useSettings();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'geral' | 'seguranca' | 'aparencia' | 'suporte'>('geral');
    const [supportItems, setSupportItems] = useState<any[]>([]);

    // Form States
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        authAPI.getProfile()
            .then(profile => {
                setUser(profile);
                setName(profile.name || '');
                setBio(profile.bio || '');
                setAvatar(profile.avatar || '');
            })
            .catch(err => {
                console.error('Failed to load profile', err);
                navigate('/login');
            })
            .finally(() => setLoading(false));
    }, [navigate]);

    useEffect(() => {
        if (activeTab === 'suporte' && supportItems.length === 0) {
            supportAPI.getSupportItems()
                .then((data: any) => setSupportItems(data))
                .catch((err: any) => console.error('Erro ao buscar suporte', err));
        }
    }, [activeTab, supportItems.length]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const data: any = { name, bio, avatar };
            if (activeTab === 'seguranca') {
                if (password !== confirmPassword) {
                    setErrorMsg('As senhas não coincidem');
                    return;
                }
                if (password) data.password = password;
            }

            const updatedUser = await authAPI.updateProfile(data);
            setUser(updatedUser);
            setSuccessMsg('Perfil atualizado com sucesso!');
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Update failed', error);
            setErrorMsg('Erro ao atualizar perfil');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] dark:bg-gray-900"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>;

    return (
        <div className="flex flex-col min-h-screen bg-[#f6f6f8] dark:bg-[#0d121b]">
            <Header activeTab="profile" onLogout={handleLogout} user={user} />

            <main className="max-w-[1100px] w-full mx-auto p-4 md:p-8 pb-32">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Tabs */}
                    <aside className="lg:w-72 flex-shrink-0">
                        <div className="bg-white dark:bg-gray-900 rounded-[32px] shadow-sm border dark:border-gray-800 overflow-hidden sticky top-24 border-gray-100">
                            {/* Profile Header - HIDDEN ON MOBILE */}
                            <div className="hidden lg:flex p-8 border-b dark:border-gray-800 flex-col items-center">
                                <div className="size-24 rounded-[32px] border-4 border-gray-50 dark:border-gray-800 bg-cover bg-center mb-4 shadow-lg" style={{ backgroundImage: `url(${getMediaUrl(user?.avatar) || IMAGES.DEFAULT_AVATAR})` }} />
                                <h2 className="font-black text-lg text-center dark:text-white uppercase tracking-tight">{user?.name}</h2>
                                <div className="mt-2 flex flex-col items-center gap-1 w-full">
                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full">{user?.role}</p>
                                    
                                    {user?.schools && user.schools.length > 0 && (
                                        <div className="mt-2 flex flex-wrap justify-center gap-1 px-4">
                                            {user.schools.slice(0, 3).map((s: any) => (
                                                <span key={s.id} className="text-[9px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                                                    {s.name}
                                                </span>
                                            ))}
                                            {user.schools.length > 3 && (
                                                <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-dashed border-gray-200">
                                                    +{user.schools.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Navigation */}
                            <nav className="p-3 flex lg:flex-col gap-2 overflow-x-auto scrollbar-hide">
                                <button
                                    onClick={() => setActiveTab('geral')}
                                    className={`flex-shrink-0 flex items-center gap-3 px-6 py-4 rounded-[24px] text-[11px] uppercase tracking-widest font-black transition-all ${activeTab === 'geral' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                >
                                    <span className="material-symbols-outlined text-sm font-fill-1">person</span> <span className="whitespace-nowrap">Geral</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('seguranca')}
                                    className={`flex-shrink-0 flex items-center gap-3 px-6 py-4 rounded-[24px] text-[11px] uppercase tracking-widest font-black transition-all ${activeTab === 'seguranca' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                >
                                    <span className="material-symbols-outlined text-sm font-fill-1">lock</span> <span className="whitespace-nowrap">Segurança</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('aparencia')}
                                    className={`flex-shrink-0 flex items-center gap-3 px-6 py-4 rounded-[24px] text-[11px] uppercase tracking-widest font-black transition-all ${activeTab === 'aparencia' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                >
                                    <span className="material-symbols-outlined text-sm font-fill-1">palette</span> <span className="whitespace-nowrap">Aparência</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('suporte')}
                                    className={`flex-shrink-0 flex items-center gap-3 px-6 py-4 rounded-[24px] text-[11px] uppercase tracking-widest font-black transition-all ${activeTab === 'suporte' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                >
                                    <span className="material-symbols-outlined text-sm font-fill-1">help_center</span> <span className="whitespace-nowrap">Suporte</span>
                                </button>
                                
                                <button
                                    onClick={handleLogout}
                                    className="lg:hidden flex-shrink-0 flex items-center gap-3 px-6 py-4 rounded-[24px] text-[11px] uppercase tracking-widest font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm font-fill-1">logout</span> <span className="whitespace-nowrap">Sair</span>
                                </button>
                            </nav>
                            <div className="hidden lg:block p-6 border-t dark:border-gray-800">
                                <button
                                    onClick={() => navigate(`/profile/${user?.id}`)}
                                    className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-[24px] text-[10px] uppercase tracking-widest font-black bg-gray-50 dark:bg-gray-800 text-primary hover:bg-primary hover:text-white transition-all group border border-gray-100 dark:border-gray-700"
                                >
                                    <span className="material-symbols-outlined text-sm transition-transform group-hover:scale-110">visibility</span> Ver Perfil
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Content Area */}
                    <div className="flex-1">
                        <div className="bg-white dark:bg-gray-900 rounded-[32px] shadow-sm border dark:border-gray-800 p-8 lg:p-12 border-gray-100">
                            <h1 className="text-3xl font-black mb-8 dark:text-white uppercase tracking-tighter">
                                {activeTab === 'geral' && 'Configurações do Perfil'}
                                {activeTab === 'seguranca' && 'Segurança & Acesso'}
                                {activeTab === 'aparencia' && 'Experiência Visual'}
                                {activeTab === 'suporte' && 'Central de Ajuda'}
                            </h1>

                            {successMsg && (
                                <div className="bg-green-500 text-white px-6 py-4 rounded-2xl mb-8 flex items-center gap-3 shadow-lg shadow-green-500/20 animate-in fade-in slide-in-from-top-2">
                                    <span className="material-symbols-outlined">check_circle</span>
                                    <p className="text-sm font-black uppercase tracking-widest">{successMsg}</p>
                                </div>
                            )}

                            {errorMsg && (
                                <div className="bg-red-500 text-white px-6 py-4 rounded-2xl mb-8 flex items-center gap-3 shadow-lg shadow-red-500/20 animate-in fade-in slide-in-from-top-2">
                                    <span className="material-symbols-outlined">error</span>
                                    <p className="text-sm font-black uppercase tracking-widest">{errorMsg}</p>
                                </div>
                            )}

                            {activeTab === 'geral' && (
                                <form onSubmit={handleUpdateProfile} className="space-y-8 animate-in fade-in duration-500">
                                    <div className="grid grid-cols-1 gap-8">
                                        <div className="flex flex-col md:flex-row gap-8 items-start">
                                            <div className="w-full md:w-48 shrink-0">
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Avatar do Usuário</label>
                                                <ImageUpload
                                                    currentImage={avatar}
                                                    onImageUploaded={setAvatar}
                                                />
                                            </div>
                                            <div className="flex-1 w-full space-y-6">
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nome Completo</label>
                                                    <input
                                                        type="text"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        className="w-full h-14 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-5 focus:ring-2 focus:ring-primary/20 outline-none dark:text-white font-medium transition-all focus:bg-white"
                                                        placeholder="Como você quer ser chamado?"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Biografia</label>
                                                    <textarea
                                                        value={bio}
                                                        onChange={(e) => setBio(e.target.value)}
                                                        rows={4}
                                                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 outline-none dark:text-white resize-none font-medium transition-all focus:bg-white"
                                                        placeholder="Conte um pouco sobre sua trajetória na educação..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t dark:border-gray-800 flex justify-end">
                                        <button type="submit" className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95">Atualizar Perfil</button>
                                    </div>
                                </form>
                            )}

                            {activeTab === 'seguranca' && (
                                <form onSubmit={handleUpdateProfile} className="space-y-8 animate-in fade-in duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nova Senha</label>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full h-14 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-5 focus:ring-2 focus:ring-primary/20 outline-none dark:text-white font-medium"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Confirmar Senha</label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full h-14 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-5 focus:ring-2 focus:ring-primary/20 outline-none dark:text-white font-medium"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t dark:border-gray-800 flex justify-end">
                                        <button type="submit" className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all disabled:opacity-50" disabled={!password}>Mudar Senha</button>
                                    </div>
                                </form>
                            )}

                            {activeTab === 'aparencia' && (
                                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {/* Light Mode Card */}
                                        <button 
                                            onClick={() => darkMode && toggleDarkMode()}
                                            className={`relative flex flex-col gap-4 p-6 rounded-[32px] border-2 transition-all group ${!darkMode ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-transparent'}`}
                                        >
                                            <div className="aspect-video w-full rounded-2xl bg-[#f6f6f8] border border-gray-200 shadow-inner overflow-hidden flex flex-col p-3 gap-2">
                                                <div className="h-2.5 w-1/2 bg-white rounded-full" />
                                                <div className="h-2.5 w-3/4 bg-white rounded-full opacity-50" />
                                                <div className="mt-auto h-5 w-full bg-primary/20 rounded-lg" />
                                            </div>
                                            <div className="flex items-center justify-between px-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-lg">light_mode</span>
                                                    <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${!darkMode ? 'text-primary' : 'text-gray-400'}`}>Estilo Claro</span>
                                                </div>
                                                {!darkMode && <span className="material-symbols-outlined text-primary text-xl font-fill-1 scale-110">check_circle</span>}
                                            </div>
                                        </button>

                                        {/* Dark Mode Card */}
                                        <button 
                                            onClick={() => !darkMode && toggleDarkMode()}
                                            className={`relative flex flex-col gap-4 p-6 rounded-[32px] border-2 transition-all group ${darkMode ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-transparent'}`}
                                        >
                                            <div className="aspect-video w-full rounded-2xl bg-[#0d121b] border border-white/5 shadow-inner overflow-hidden flex flex-col p-3 gap-2">
                                                <div className="h-2.5 w-1/2 bg-white/20 rounded-full" />
                                                <div className="h-2.5 w-3/4 bg-white/10 rounded-full opacity-50" />
                                                <div className="mt-auto h-5 w-full bg-primary/40 rounded-lg" />
                                            </div>
                                            <div className="flex items-center justify-between px-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-lg">dark_mode</span>
                                                    <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-primary' : 'text-gray-400'}`}>Estilo Escuro</span>
                                                </div>
                                                {darkMode && <span className="material-symbols-outlined text-primary text-xl font-fill-1 scale-110">check_circle</span>}
                                            </div>
                                        </button>
                                    </div>

                                    <div className="p-8 bg-gray-50 dark:bg-gray-800/50 rounded-[32px] border dark:border-gray-800 border-dashed border-2">
                                        <div className="flex items-start gap-5">
                                            <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                                                <span className="material-symbols-outlined text-primary text-2xl font-fill-1">auto_awesome</span>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black dark:text-white uppercase tracking-tight">Preferência Visual Global</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">Suas configurações de aparência serão sincronizadas em todos os seus dispositivos. Escolha o tema que melhor se adapta ao seu ambiente de trabalho e estudo.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'suporte' && (
                                <div className="space-y-10 animate-in fade-in duration-500">
                                    <div className="p-8 bg-primary/5 rounded-[32px] border border-primary/10">
                                        <div className="flex items-start gap-5">
                                            <span className="material-symbols-outlined text-primary text-4xl">live_help</span>
                                            <div>
                                                <h3 className="text-lg font-black text-primary uppercase tracking-tight">Central de Ajuda</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">Encontre respostas rápidas e tutoriais passo-a-passo para aproveitar o EduConnect ao máximo.</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {supportItems.length === 0 ? (
                                        <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-[32px] border-2 border-dashed dark:border-gray-800">
                                            <span className="material-symbols-outlined text-6xl text-gray-200 mb-4">auto_stories</span>
                                            <p className="text-gray-400 text-sm font-black uppercase tracking-widest">Aguardando conteúdos...</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-6">
                                            {supportItems.map(item => (
                                                <div key={item.id} className="bg-white dark:bg-gray-800 p-8 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-xl ${item.type === 'FAQ' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'}`}>
                                                                <span className="material-symbols-outlined text-xl">
                                                                    {item.type === 'FAQ' ? 'quiz' : 'play_lesson'}
                                                                </span>
                                                            </div>
                                                            <span className={`text-[10px] font-black uppercase tracking-widest ${item.type === 'FAQ' ? 'text-blue-500' : 'text-purple-500'}`}>{item.type}</span>
                                                        </div>
                                                    </div>
                                                    <h4 className="text-xl font-black text-gray-800 dark:text-white mb-3 tracking-tight">{item.title}</h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                                                    {item.link && (
                                                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-primary font-black uppercase tracking-widest mt-6 hover:gap-3 transition-all">
                                                            Acessar Conteúdo <span className="material-symbols-outlined text-sm">arrow_right_alt</span>
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfileSettingsPage;
