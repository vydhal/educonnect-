import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { usersAPI, socialAPI, authAPI, projectsAPI, badgeTypesAPI, getMediaUrl } from '../api';
import { useModal } from '../contexts/ModalContext';
import { IMAGES } from '../constants';

const PublicProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showModal } = useModal();

    const [profileUser, setProfileUser] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Social data
    const [badges, setBadges] = useState<any[]>([]);
    const [badgeTypes, setBadgeTypes] = useState<any[]>([]);
    const [testimonials, setTestimonials] = useState<any[]>([]);
    const [visitors, setVisitors] = useState<any[]>([]);
    const [followersCount, setFollowersCount] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [friendship, setFriendship] = useState<any>(null);
    const [friendsCount, setFriendsCount] = useState(0);
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
                setFriendship(profile.friendship || null);
                setFriendsCount(profile.friendsCount || 0);

                // Fetch current user
                const me = await authAPI.getProfile().catch(() => null);
                setCurrentUser(me);

                // Fetch badges
                const badgeData = await socialAPI.getBadges(id);
                setBadges(badgeData);

                // Fetch available badge types
                const types = await badgeTypesAPI.getBadgeTypes();
                setBadgeTypes(types);

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
            // Use real count from server to avoid inconsistencies
            if (typeof response.followersCount === 'number') {
                setFollowersCount(response.followersCount);
                setProfileUser((prev: any) => prev ? {
                    ...prev,
                    _count: { ...prev._count, followers: response.followersCount }
                } : null);
            } else {
                // Fallback to optimistic update
                setFollowersCount(prev => response.following ? prev + 1 : prev - 1);
            }
        } catch (error: any) {
            console.error(error);
            showModal({ title: 'Ação Bloqueada', message: error.message || 'Erro ao seguir.', type: 'error' });
        }
    };

    const handleFriendRequest = async () => {
        if (!id || !currentUser) return;
        try {
            const response = await socialAPI.sendFriendRequest(id);
            setFriendship(response);
            showModal({ title: 'Solicitação Enviada', message: 'Sua solicitação de amizade foi enviada com sucesso!', type: 'success' });
        } catch (error: any) {
            console.error(error);
            showModal({ title: 'Erro', message: error.message || 'Não foi possível enviar a solicitação.', type: 'error' });
        }
    };

    const handleAcceptFriend = async () => {
        if (!friendship || !currentUser) return;
        try {
            await socialAPI.updateFriendRequest(friendship.id, 'ACCEPTED');
            setFriendship({ ...friendship, status: 'ACCEPTED' });
            setFriendsCount(prev => prev + 1);
            showModal({ title: 'Sucesso', message: 'Agora vocês são amigos!', type: 'success' });
        } catch (error) {
            console.error(error);
        }
    };

    const handleRemoveFriend = async () => {
        if (!id || !currentUser) return;
        showModal({
            title: 'Remover Amigo',
            message: 'Tem certeza que deseja desfazer esta amizade?',
            type: 'warning',
            confirmLabel: 'Remover',
            onConfirm: async () => {
                try {
                    await socialAPI.removeFriend(id);
                    setFriendship(null);
                    setFriendsCount(prev => prev - 1);
                } catch (error) {
                    console.error(error);
                }
            }
        });
    };

    const handleGiveBadge = async (badgeType: any) => {
        if (!id || !currentUser) return;
        
        const existing = badges.find(b => b.typeId === badgeType.id && b.isGivenByMe);

        if (existing) {
            // Confirmation dialog for removal
            showModal({
                title: 'Retirar Selo?',
                message: `Você deseja remover o selo ${badgeType.icon} ${badgeType.name} deste perfil?`,
                type: 'warning',
                confirmLabel: 'Sim, Retirar',
                onConfirm: async () => {
                    try {
                        await socialAPI.removeBadge(id, badgeType.id);
                        const badgeData = await socialAPI.getBadges(id);
                        setBadges(badgeData);
                        showModal({ title: 'Removido', message: 'Reconhecimento retirado com sucesso.', type: 'success' });
                    } catch (error) {
                        console.error(error);
                        showModal({ title: 'Erro', message: 'Não foi possível retirar o selo.', type: 'error' });
                    }
                }
            });
            return;
        }

        try {
            await socialAPI.giveBadge(id, badgeType.id);
            showModal({ title: 'Reconhecimento Enviado!', message: `Você concedeu o selo ${badgeType.icon} ${badgeType.name} para este perfil. Inspirador!`, type: 'success' });
            
            // Refresh counts
            const badgeData = await socialAPI.getBadges(id);
            setBadges(badgeData);
        } catch (error) {
            console.error(error);
            showModal({ title: 'Ops!', message: 'Não foi possível conceder este selo.', type: 'error' });
        }
    };

    const handleSendTestimonial = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !testimonialContent) return;

        try {
            setIsSendingTestimonial(true);
            await socialAPI.sendTestimonial(id, testimonialContent);
            setTestimonialContent('');
            showModal({ title: 'Depoimento Enviado', message: 'Seu relato foi enviado com sucesso! Ele aparecerá no perfil assim que for aprovado pelo proprietário.', type: 'success' });
        } catch (error) {
            console.error(error);
            showModal({ title: 'Erro ao Enviar', message: 'Ocorreu um problema ao processar seu depoimento. Tente novamente mais tarde.', type: 'error' });
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
            <Header activeTab={isOwner ? 'profile' : 'network'} onLogout={() => navigate('/login')} user={currentUser} />

            <main className="max-w-[1200px] w-full mx-auto p-4 md:p-6 pb-24 md:pb-8 flex flex-col md:flex-row gap-6">

                {/* Profile Info Sidebar */}
                <aside className="md:w-80 shrink-0 space-y-6">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 text-center relative overflow-hidden pb-8 transition-all">
                        {/* Profile Cover Gradient */}
                        <div className="h-32 w-full bg-gradient-to-r from-[#15803d] to-[#1d4ed8]" />

                        <div className="px-8 relative z-10 -mt-16">
                            <div className="size-32 rounded-full border-4 border-white dark:border-gray-800 shadow-xl mx-auto bg-cover bg-center mb-6 ring-4 ring-black/5 bg-white dark:bg-gray-900"
                                 style={{ backgroundImage: `url(${getMediaUrl(profileUser?.avatar) || IMAGES.DEFAULT_AVATAR})` }} />

                            <h1 className="text-2xl font-black dark:text-white mb-2">{profileUser?.name}</h1>
                            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-wider mb-4 inline-block">
                                {profileUser?.role === 'ESCOLA' ? 'Unidade Educacional' : profileUser?.role}
                            </span>

                            {/* Multiple Schools Support */}
                            {profileUser?.schools && profileUser.schools.length > 0 ? (
                                <div className="mb-6">
                                     <div className="flex flex-wrap justify-center gap-1.5">
                                        {profileUser.schools.slice(0, 3).map((s: any) => (
                                            <span key={s.id} className="text-[10px] font-bold text-gray-700 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
                                                {s.name}
                                            </span>
                                        ))}
                                        {profileUser.schools.length > 3 && (
                                            <span className="text-[10px] font-black text-primary bg-primary/5 border border-primary/20 px-2.5 py-1 rounded-lg">
                                                +{profileUser.schools.length - 3} unidades
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : profileUser?.school && (
                                <p className="text-sm text-primary font-bold mb-6">{profileUser.school}</p>
                            )}

                            <div className="flex justify-center gap-6 py-4 border-y dark:border-gray-800 mb-6 font-bold">
                                {profileUser?.role === 'ESCOLA' ? (
                                    <div className="text-center">
                                        <p className="text-xl font-black text-primary">{followersCount}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Favoritos</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <p className="text-xl font-black text-primary">{friendsCount}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Amigos</p>
                                    </div>
                                )}
                                <div className="text-center">
                                    <p className="text-xl font-black text-primary">{profileUser?._count?.projects || 0}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Projetos</p>
                                </div>
                            </div>

                            {!isOwner && currentUser && (
                                <div className="space-y-4">
                                    {profileUser?.role === 'ESCOLA' ? (
                                        <button
                                            onClick={handleFollow}
                                            className={`w-full py-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${isFollowing ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-primary text-white shadow-primary/20 hover:brightness-110'}`}
                                        >
                                            <span className="material-symbols-outlined text-sm font-fill-1">{isFollowing ? 'favorite' : 'favorite'}</span>
                                            {isFollowing ? 'Remover dos Favoritos' : 'Favoritar Unidade'}
                                        </button>
                                    ) : (
                                        <>
                                            {!friendship ? (
                                                <button
                                                    onClick={handleFriendRequest}
                                                    className="w-full py-3 rounded-2xl font-black text-sm bg-primary text-white shadow-lg shadow-primary/20 hover:brightness-110 flex items-center justify-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-sm">person_add</span>
                                                    Fazer Amigo
                                                </button>
                                            ) : friendship.status === 'PENDING' ? (
                                                friendship.senderId === currentUser.id ? (
                                                    <button className="w-full py-3 rounded-2xl font-black text-sm bg-gray-100 text-gray-400 flex items-center justify-center gap-2 cursor-default">
                                                        <span className="material-symbols-outlined text-sm">hourglass_empty</span>
                                                        Solicitação Pendente
                                                    </button>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <button onClick={handleAcceptFriend} className="flex-1 py-3 rounded-2xl font-black text-sm bg-green-500 text-white shadow-lg shadow-green-500/20 hover:brightness-110 flex items-center justify-center gap-2">
                                                            Aceitar
                                                        </button>
                                                        <button 
                                                            onClick={async () => {
                                                                try {
                                                                    await socialAPI.updateFriendRequest(friendship.id, 'REJECTED');
                                                                    setFriendship(null);
                                                                } catch (err) { console.error(err); }
                                                            }} 
                                                            className="flex-1 py-3 rounded-2xl font-black text-sm bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center"
                                                        >
                                                            Recusar
                                                        </button>
                                                    </div>
                                                )
                                            ) : (
                                                <button
                                                    onClick={handleRemoveFriend}
                                                    className="w-full py-3 rounded-2xl font-black text-sm bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-red-500 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-sm">group</span>
                                                    Amigos
                                                </button>
                                            )}
                                        </>
                                    )}

                                    <div className="pt-4">
                                        <p className="text-xs font-bold text-gray-400 uppercase text-center mb-4">Reconhecer este Perfil</p>
                                        <div className="flex flex-wrap justify-center gap-3">
                                            {badgeTypes.map(type => {
                                                const isGiven = badges.find(b => b.typeId === type.id && b.isGivenByMe);
                                                return (
                                                    <BadgeIcon 
                                                        key={type.id}
                                                        icon={type.icon} 
                                                        label={type.name} 
                                                        color={type.color}
                                                        isActive={!!isGiven}
                                                        onClick={() => handleGiveBadge(type)} 
                                                    />
                                                );
                                            })}
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
                                        style={{ backgroundImage: `url(${visitor.avatar || IMAGES.DEFAULT_AVATAR})` }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 space-y-6">
                    {/* Display Badge Counts Always */}
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-wrap justify-around gap-4">
                        {badges.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">Nenhum selo recebido ainda.</p>
                        ) : (
                            badges.map(b => (
                                <BadgeDisplay 
                                    key={b.typeId}
                                    icon={b.icon} 
                                    label={b.name} 
                                    count={b.count} 
                                    color={b.color} 
                                    isGivenByMe={b.isGivenByMe}
                                />
                            ))
                        )}
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
                                                            <div className="size-10 rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${testi.sender.avatar || IMAGES.DEFAULT_AVATAR})` }} />
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
                                        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 text-gray-400 italic">
                                            Nenhum depoimento exibido ainda. Por que não ser o primeiro?
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {testimonials.map(testi => (
                                                <div key={testi.id} className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 relative">
                                                    <span className="material-symbols-outlined absolute top-6 right-8 text-4xl text-primary/5 select-none">format_quote</span>
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="size-12 rounded-2xl bg-cover bg-center" style={{ backgroundImage: `url(${testi.sender.avatar || IMAGES.DEFAULT_AVATAR})` }} />
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
                                <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 text-gray-400 italic">
                                Projetos da instituição estarão disponíveis em breve nesta visualização.
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

const BadgeIcon: React.FC<{ icon: string, label: string, color: string, isActive?: boolean, onClick: () => void }> = ({ icon, label, color, isActive, onClick }) => (
    <button
        onClick={onClick}
        title={isActive ? `Selo já concedido (Clique para retirar)` : `Dar selo de ${label}`}
        className="flex flex-col items-center gap-1.5 group scale-90 hover:scale-105 transition-all relative"
    >
        <div 
           className={`size-11 rounded-2xl flex items-center justify-center transition-all shadow-md border ${isActive ? 'bg-primary/5 border-primary shadow-primary/20 ring-2 ring-primary/10' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm'}`}
           style={{ color: color }}
        >
            <span className={icon.length > 2 ? "material-symbols-outlined text-xl" : "text-xl"}>{icon}</span>
            
            {isActive && (
                <div className="absolute -top-1.5 -right-1.5 size-5 bg-primary text-white rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300 ring-2 ring-white dark:ring-gray-900">
                    <span className="material-symbols-outlined text-[12px] font-black">check</span>
                </div>
            )}
        </div>
        <span className={`text-[9px] font-black uppercase tracking-tighter text-center leading-tight px-1 ${isActive ? 'text-primary' : 'text-gray-400'}`}>{label}</span>
    </button>
);

const BadgeDisplay: React.FC<{ icon: string, label: string, count: number, color: string, isGivenByMe?: boolean }> = ({ icon, label, count, color, isGivenByMe }) => (
    <div className={`flex flex-col items-center gap-2 group transition-all ${isGivenByMe ? 'scale-105' : ''}`}>
        <div 
           className={`size-16 rounded-3xl flex items-center justify-center shadow-sm border transition-all ${isGivenByMe ? 'border-primary shadow-lg shadow-primary/10' : 'bg-gray-50 dark:bg-gray-800 border-transparent hover:border-primary/20'}`}
           style={{ color: color, backgroundColor: isGivenByMe ? `${color}10` : undefined }}
        >
            <span className={icon.length > 2 ? "material-symbols-outlined text-3xl" : "text-3xl"}>{icon}</span>
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest ${isGivenByMe ? 'text-primary' : 'text-gray-400'}`}>{label}</span>
        <span className={`text-sm font-black px-3 py-1 rounded-full transition-all ${isGivenByMe ? 'bg-primary text-white scale-110 shadow-md shadow-primary/20' : 'dark:text-white bg-gray-50 dark:bg-gray-800'}`}>{count}</span>
    </div>
);

export default PublicProfilePage;
