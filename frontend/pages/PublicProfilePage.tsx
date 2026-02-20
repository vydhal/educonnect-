
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { usersAPI, socialAPI, authAPI, projectsAPI } from '../api';

const PublicProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [profileUser, setProfileUser] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Social data
    const [badges, setBadges] = useState<any>({ PROATIVO: 0, ESPECIAL: 0, HARMONIOSO: 0 });
    const [testimonials, setTestimonials] = useState<any[]>([]);
    const [visitors, setVisitors] = useState<any[]>([]);
    const [followersCount, setFollowersCount] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [pendingTestimonials, setPendingTestimonials] = useState<any[]>([]);

    // UI states
    const [activeTab, setActiveTab] = useState<'info' | 'depoimentos' | 'projetos'>('info');
    const [testimonialContent, setTestimonialContent] = useState('');
    const [isSendingTestimonial, setIsSendingTestimonial] = useState(false);

    const isOwner = currentUser?.id === id || (currentUser?.id && id && currentUser.id.toString() === id.toString());

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                const profile = await usersAPI.getUserProfile(id);
                if (!profile) throw new Error('User not found');
                setProfileUser(profile);
                setFollowersCount(profile._count?.followers || 0);
                setIsFollowing(profile.isFollowing || false);

                // Fetch current user
                const me = await authAPI.getProfile().catch(() => null);
                setCurrentUser(me);

                // Fetch badges
                const badgeData = await socialAPI.getBadges(id);
                setBadges(badgeData);

                // Fetch testimonials
                const testiData = await socialAPI.getTestimonials(id);
                setTestimonials(testiData);

                const realIsOwner = me?.id === id || (me?.id && id && me.id.toString() === id.toString());

                if (realIsOwner) {
                    console.log('User is owner, fetching private data');
                    // Fetch visitors
                    const visitorData = await socialAPI.getRecentVisitors().catch(() => []);
                    setVisitors(visitorData);

                    // Fetch pending testimonials
                    const pendingData = await socialAPI.getPendingTestimonials().catch(() => []);
                    setPendingTestimonials(pendingData || []);
                } else if (me) {
                    // Record view if not owner
                    socialAPI.recordProfileView(id).catch(console.error);
                }

            } catch (error) {
                console.error('Failed to load profile', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleFollow = async () => {
        if (!id || !currentUser) return;
        try {
            const response = await usersAPI.followUser(id);
            setIsFollowing(response.following);
            setFollowersCount(prev => response.following ? prev + 1 : prev - 1);

            // Proactive update of profileUser count if needed
            setProfileUser((prev: any) => prev ? {
                ...prev,
                _count: { ...prev._count, followers: response.following ? (prev._count.followers + 1) : (prev._count.followers - 1) }
            } : null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleGiveBadge = async (type: 'PROATIVO' | 'ESPECIAL' | 'HARMONIOSO') => {
        if (!id || !currentUser) return;
        try {
            await socialAPI.giveBadge(id, type);
            // Refresh counts
            const badgeData = await socialAPI.getBadges(id);
            setBadges(badgeData);
            alert(`Você deu o selo de ${type}!`);
        } catch (error) {
            console.error(error);
            alert('Erro ao dar selo. Talvez você já tenha dado este selo?');
        }
    };

    const handleSendTestimonial = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !testimonialContent) return;

        try {
            setIsSendingTestimonial(true);
            await socialAPI.sendTestimonial(id, testimonialContent);
            setTestimonialContent('');
            alert('Depoimento enviado! Aparecerá após você (o dono do perfil) aprová-lo na aba Depoimentos.');
        } catch (error) {
            console.error(error);
            alert('Erro ao enviar depoimento.');
        } finally {
            setIsSendingTestimonial(false);
        }
    };

    const handleUpdateTestimonial = async (testiId: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            await socialAPI.updateTestimonialStatus(testiId, status);
            // Refresh local state based on status
            if (status === 'APPROVED') {
                // If approving, we need to refresh the main testimonials list
                const testiData = await socialAPI.getTestimonials(id!);
                setTestimonials(testiData);
            }
            // Always refresh pending list
            const pendingData = await socialAPI.getPendingTestimonials();
            setPendingTestimonials(pendingData || []);
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] dark:bg-gray-900"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>;

    return (
        <div className="flex flex-col min-h-screen bg-[#f0f2f5] dark:bg-background-dark">
            <Header activeTab="" onLogout={() => navigate('/login')} user={currentUser} />

            <main className="max-w-[1200px] w-full mx-auto p-6 flex flex-col md:flex-row gap-6">

                {/* Profile Info Sidebar */}
                <aside className="md:w-80 shrink-0 space-y-6">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 text-center relative overflow-hidden">
                        {/* Background subtle gradient */}
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary/10 to-transparent" />

                        <div className="relative z-10">
                            <div className="size-32 rounded-3xl border-4 border-white dark:border-gray-800 shadow-xl mx-auto bg-cover bg-center mb-6"
                                style={{ backgroundImage: `url(${profileUser?.avatar || `https://ui-avatars.com/api/?name=${profileUser?.name}&background=random`})` }} />

                            <h1 className="text-2xl font-black dark:text-white mb-2">{profileUser?.name}</h1>
                            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-wider mb-4 inline-block">
                                {profileUser?.role}
                            </span>

                            <p className="text-sm text-gray-500 mb-6">{profileUser?.bio || 'Sem biografia definida.'}</p>

                            <div className="flex justify-center gap-6 py-4 border-y dark:border-gray-800 mb-6">
                                <div className="text-center">
                                    <p className="text-xl font-black text-primary">{followersCount}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Seguidores</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xl font-black text-primary">{profileUser?._count?.projects || 0}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Projetos</p>
                                </div>
                            </div>

                            {!isOwner && currentUser && (
                                <div className="space-y-4">
                                    <button
                                        onClick={handleFollow}
                                        className={`w-full py-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${isFollowing ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : 'bg-primary text-white shadow-primary/20 hover:brightness-110'}`}
                                    >
                                        <span className="material-symbols-outlined text-sm">{isFollowing ? 'person_remove' : 'person_add'}</span>
                                        {isFollowing ? 'Deixar de Seguir' : 'Seguir Perfil'}
                                    </button>

                                    <div className="pt-4">
                                        <p className="text-xs font-bold text-gray-400 uppercase text-left mb-4">Dar Selo de Reconhecimento</p>
                                        <div className="flex justify-around gap-2">
                                            <BadgeIcon icon="verified_user" label="Proativo" count={badges.PROATIVO} onClick={() => handleGiveBadge('PROATIVO')} />
                                            <BadgeIcon icon="star" label="Especial" count={badges.ESPECIAL} onClick={() => handleGiveBadge('ESPECIAL')} />
                                            <BadgeIcon icon="favorite" label="Harmonia" count={badges.HARMONIOSO} onClick={() => handleGiveBadge('HARMONIOSO')} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isOwner && (
                                <div className="pt-6">
                                    <button onClick={() => navigate('/settings')} className="w-full bg-gray-50 dark:bg-gray-800 py-3 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-sm">settings</span> Editar Perfil
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {isOwner && visitors.length > 0 && (
                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                            <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">visibility</span>
                                Recentemente Visitado
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {visitors.map(visitor => (
                                    <div
                                        key={visitor.id}
                                        title={visitor.name}
                                        onClick={() => navigate(`/profile/${visitor.id}`)}
                                        className="size-10 rounded-xl bg-cover bg-center cursor-pointer hover:brightness-90 transition-all border border-gray-100 shadow-sm"
                                        style={{ backgroundImage: `url(${visitor.avatar || `https://ui-avatars.com/api/?name=${visitor.name}&background=random`})` }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 space-y-6">
                    {/* Display Badge Counts Always */}
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex justify-around">
                        <BadgeDisplay icon="verified_user" label="Proativo" count={badges.PROATIVO} color="text-blue-500" />
                        <BadgeDisplay icon="star" label="Professor Especial" count={badges.ESPECIAL} color="text-yellow-500" />
                        <BadgeDisplay icon="favorite" label="Ugar Harmonioso" count={badges.HARMONIOSO} color="text-pink-500" />
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b dark:border-gray-800">
                        {['info', 'depoimentos', 'projetos'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setActiveTab(tab as any);
                                    if (tab === 'depoimentos') {
                                        const currentIsOwner = currentUser?.id === id || (currentUser?.id && id && currentUser.id.toString() === id.toString());
                                        if (currentIsOwner) {
                                            console.log('FRONTEND: Owners testimonials tab clicked, fetching pending...');
                                            socialAPI.getPendingTestimonials()
                                                .then(data => {
                                                    console.log('FRONTEND: Pending data received:', data);
                                                    setPendingTestimonials(data || []);
                                                })
                                                .catch(err => console.error('FRONTEND: Failed to fetch pending', err));
                                        }
                                    }
                                }}
                                className={`px-8 py-4 text-sm font-bold capitalize transition-all relative ${activeTab === tab ? 'text-primary' : 'text-gray-400'}`}
                            >
                                {tab}
                                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
                            </button>
                        ))}
                    </div>

                    <div className="min-h-[400px]">
                        {activeTab === 'info' && (
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                                    <h3 className="font-black text-xl mb-4 dark:text-white">Sobre a Instituição/Usuário</h3>
                                    <p className="text-gray-500 leading-relaxed whitespace-pre-wrap">{profileUser?.bio || 'Tudo flui melhor com educação.'}</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'depoimentos' && (
                            <div className="space-y-8">
                                {!isOwner && currentUser && (
                                    <form onSubmit={handleSendTestimonial} className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-primary/20">
                                        <h3 className="font-bold text-sm mb-4">Deixar um depoimento</h3>
                                        <textarea
                                            value={testimonialContent}
                                            onChange={(e) => setTestimonialContent(e.target.value)}
                                            placeholder="Escreva algo especial sobre este perfil..."
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary h-32 resize-none mb-4"
                                            required
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                disabled={isSendingTestimonial}
                                                className="bg-primary hover:brightness-110 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                                            >
                                                {isSendingTestimonial ? 'Enviando...' : (
                                                    <><span className="material-symbols-outlined text-sm">send</span> Enviar Depoimento</>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {isOwner && (
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-sm text-yellow-600 flex items-center gap-2">
                                            <span className="material-symbols-outlined">pending_actions</span>
                                            Depoimentos Pendentes de Aprovação ({pendingTestimonials.length})
                                        </h3>
                                        {pendingTestimonials.length === 0 ? (
                                            <div className="p-4 bg-yellow-50/50 dark:bg-yellow-900/5 rounded-2xl border border-dashed border-yellow-200 text-xs text-yellow-600 italic">
                                                Nenhum depoimento pendente no momento.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4">
                                                {pendingTestimonials.map(testi => (
                                                    <div key={testi.id} className="bg-yellow-50 dark:bg-yellow-900/10 p-6 rounded-3xl border border-yellow-200 dark:border-yellow-800 transition-all hover:shadow-md">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="size-10 rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${testi.sender.avatar || `https://ui-avatars.com/api/?name=${testi.sender.name}`})` }} />
                                                            <div>
                                                                <p className="text-sm font-bold dark:text-white">{testi.sender.name}</p>
                                                                <p className="text-[10px] text-gray-500">Enviado em {new Date(testi.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm italic text-gray-700 dark:text-gray-300 mb-6">"{testi.content}"</p>
                                                        <div className="flex gap-2 justify-end">
                                                            <button onClick={() => handleUpdateTestimonial(testi.id, 'REJECTED')} className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-all">Recusar</button>
                                                            <button onClick={() => handleUpdateTestimonial(testi.id, 'APPROVED')} className="px-4 py-2 text-xs font-bold bg-green-500 text-white rounded-lg hover:brightness-110 shadow-lg shadow-green-500/20 transition-all">Aprovar e Exibir</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-6">
                                    <h3 className="font-black text-xl dark:text-white">Relatos da Comunidade</h3>
                                    {testimonials.length === 0 ? (
                                        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border text-gray-400 italic">
                                            Nenhum depoimento exibido ainda. Por que não ser o primeiro?
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {testimonials.map(testi => (
                                                <div key={testi.id} className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 relative">
                                                    <span className="material-symbols-outlined absolute top-6 right-8 text-4xl text-primary/5 select-none">format_quote</span>
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="size-12 rounded-2xl bg-cover bg-center" style={{ backgroundImage: `url(${testi.sender.avatar || `https://ui-avatars.com/api/?name=${testi.sender.name}`})` }} />
                                                        <div>
                                                            <h4 className="font-bold dark:text-white">{testi.sender.name}</h4>
                                                            <p className="text-xs text-gray-500">{new Date(testi.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-600 dark:text-gray-400 italic leading-relaxed">"{testi.content}"</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'projetos' && (
                            <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border text-gray-400">
                                Projetos da instituição estarão disponíveis em breve nesta visualização.
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

const BadgeIcon: React.FC<{ icon: string, label: string, count: number, onClick: () => void }> = ({ icon, label, count, onClick }) => (
    <button
        onClick={onClick}
        title={`Dar selo de ${label}`}
        className="flex flex-col items-center gap-2 group"
    >
        <div className="size-12 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
            <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <span className="text-[10px] font-bold text-gray-500 uppercase">{label}</span>
    </button>
);

const BadgeDisplay: React.FC<{ icon: string, label: string, count: number, color: string }> = ({ icon, label, count, color }) => (
    <div className="flex flex-col items-center gap-2">
        <div className={`size-16 rounded-3xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center ${color} shadow-sm border border-transparent hover:border-primary/20 transition-all`}>
            <span className="material-symbols-outlined text-3xl">{icon}</span>
        </div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
        <span className="text-sm font-black dark:text-white px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-full">{count}</span>
    </div>
);

export default PublicProfilePage;
