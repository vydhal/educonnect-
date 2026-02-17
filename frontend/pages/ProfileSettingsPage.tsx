
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import { Header } from './FeedPage'; // Reuse Header
import { useSettings } from '../contexts/SettingsContext'; // For theme toggle

const ProfileSettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const { darkMode, toggleDarkMode } = useSettings();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'geral' | 'seguranca' | 'aparencia'>('geral');

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
        <div className="flex flex-col min-h-screen bg-[#f0f2f5] dark:bg-background-dark">
            <Header activeTab="home" onLogout={handleLogout} user={user} />

            <main className="max-w-[1000px] w-full mx-auto p-6">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Tabs */}
                    <aside className="md:w-64 flex-shrink-0">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border dark:border-gray-800 overflow-hidden sticky top-24">
                            <div className="p-6 border-b dark:border-gray-800 flex flex-col items-center">
                                <div className="size-24 rounded-full border-4 border-gray-50 dark:border-gray-800 bg-cover bg-center mb-4" style={{ backgroundImage: `url(${user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=random`})` }} />
                                <h2 className="font-bold text-lg text-center dark:text-white">{user?.name}</h2>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mt-1">{user?.role}</p>
                            </div>
                            <nav className="p-2 space-y-1">
                                <button
                                    onClick={() => setActiveTab('geral')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'geral' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                >
                                    <span className="material-symbols-outlined">person</span> Geral
                                </button>
                                <button
                                    onClick={() => setActiveTab('seguranca')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'seguranca' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                >
                                    <span className="material-symbols-outlined">lock</span> Segurança
                                </button>
                                <button
                                    onClick={() => setActiveTab('aparencia')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'aparencia' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                >
                                    <span className="material-symbols-outlined">palette</span> Aparência
                                </button>
                            </nav>
                        </div>
                    </aside>

                    {/* Content Area */}
                    <div className="flex-1">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border dark:border-gray-800 p-8">
                            <h1 className="text-2xl font-black mb-6 dark:text-white">
                                {activeTab === 'geral' && 'Configurações Gerais'}
                                {activeTab === 'seguranca' && 'Segurança da Conta'}
                                {activeTab === 'aparencia' && 'Aparência e Tema'}
                            </h1>

                            {successMsg && (
                                <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-green-600">check_circle</span>
                                    {successMsg}
                                </div>
                            )}

                            {errorMsg && (
                                <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-red-600">error</span>
                                    {errorMsg}
                                </div>
                            )}

                            {activeTab === 'geral' && (
                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nome Completo</label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Bio / Sobre Você</label>
                                            <textarea
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                                rows={3}
                                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none dark:text-white resize-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">URL do Avatar (Imagem)</label>
                                            <input
                                                type="text"
                                                value={avatar}
                                                onChange={(e) => setAvatar(e.target.value)}
                                                placeholder="https://..."
                                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none dark:text-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-4 flex justify-end">
                                        <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all">Salvar Alterações</button>
                                    </div>
                                </form>
                            )}

                            {activeTab === 'seguranca' && (
                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nova Senha</label>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Confirmar Senha</label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none dark:text-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-4 flex justify-end">
                                        <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all" disabled={!password}>Atualizar Senha</button>
                                    </div>
                                </form>
                            )}

                            {activeTab === 'aparencia' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                <span className="material-symbols-outlined dark:text-white">dark_mode</span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold dark:text-white">Modo Escuro</h3>
                                                <p className="text-sm text-gray-500">Alternar entre tema claro e escuro</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                        </label>
                                    </div>
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
