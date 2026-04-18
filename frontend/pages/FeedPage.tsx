import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Post, Comment } from '../types';
import { postsAPI, authAPI, usersAPI, socialAPI, externalAPI, getMediaUrl } from '../api';
import { ReactionButton } from '../components/ReactionButton';
import { RichPostInput } from '../components/RichPostInput';
import { RichCommentInput } from '../components/RichCommentInput';
import { IMAGES } from '../constants';
import { Header } from '../components/Header';
import { ImageCarousel } from '../components/ImageCarousel';
import { useModal } from '../contexts/ModalContext';

// Extend Post type locally if not updated in types.ts yet
interface FeedPost extends Post {
  userReaction?: string | null;
  images?: string[];
}

// Reusable Components
const CreatePostModal: React.FC<{ onClose: () => void, children: React.ReactNode }> = ({ onClose, children }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white dark:bg-gray-900 w-[80vw] h-[90vh] rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col overflow-hidden">
      <div className="px-6 py-5 border-b dark:border-gray-800 flex justify-between items-center shrink-0">
        <h2 className="text-xl font-black">Criar Publicação</h2>
        <button onClick={onClose} className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><span className="material-symbols-outlined">close</span></button>
      </div>
      <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar overflow-x-visible flex-1 h-full flex flex-col">
        {children}
      </div>
    </div>
  </div>
);

const InteractionModal: React.FC<{ title: string, onClose: () => void, children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white dark:bg-gray-900 w-full md:max-w-[450px] rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:zoom-in duration-300">
      <div className="px-6 py-5 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
        <h2 className="text-lg font-black">{title}</h2>
        <button onClick={onClose} className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"><span className="material-symbols-outlined">close</span></button>
      </div>
      <div className="p-6 pb-12 md:pb-6">{children}</div>
    </div>
  </div>
);

const SchoolSuggest: React.FC<{ id: string, name: string, type: string, avatar?: string, initialFollowing?: boolean }> = ({ id, name, type, avatar, initialFollowing = false }) => {
  const navigate = useNavigate();
  const [followed, setFollowed] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();

  useEffect(() => {
    setFollowed(initialFollowing);
  }, [initialFollowing]);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await usersAPI.followUser(id);
      setFollowed(res.following);
    } catch (error: any) {
      console.error('Follow failed', error);
      showModal({ title: 'Erro', message: error.message || 'Não foi possível favoritar esta unidade.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 group/item">
      <div
        onClick={() => navigate(`/profile/${id}`)}
        className="flex items-center gap-3 min-w-0 cursor-pointer group flex-1"
      >
        <div
          className="size-10 bg-white dark:bg-gray-900 rounded-full shrink-0 bg-cover bg-center border border-gray-100 dark:border-gray-800 group-hover:ring-4 ring-primary transition-all duration-300 shadow-sm"
          style={{ backgroundImage: `url(${getMediaUrl(avatar) || IMAGES.DEFAULT_AVATAR})` }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black truncate group-hover:text-primary transition-colors uppercase tracking-tight leading-tight">{name}</p>
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest opacity-60 truncate">{type}</p>
        </div>
      </div>
      <button
        onClick={handleFollow}
        disabled={loading}
        className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${followed
            ? 'bg-red-50 text-red-500 border border-red-100 hover:bg-red-100'
            : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white shadow-lg shadow-primary/10'
          }`}
      >
        {loading ? '...' : (followed ? 'Favoritado' : 'Favoritar')}
      </button>
    </div>
  );
};

const MilestonesWidget: React.FC = () => {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await externalAPI.getMilestones();
        setMilestones(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <div className="animate-pulse h-20 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4"></div>;
  if (milestones.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 mb-4 overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <span className="material-symbols-outlined text-6xl text-primary rotate-12">auto_awesome</span>
      </div>

      <h3 className="font-bold text-xs mb-4 flex items-center gap-2 text-primary uppercase tracking-wider">
        <span className="material-symbols-outlined text-sm">celebration</span>
        Marcos da Rede
      </h3>

      <div className="space-y-4">
        {milestones.map(m => (
          <div key={m.id} className="relative z-10 bg-primary/5 dark:bg-primary/20 p-3 rounded-xl border border-primary/10">
            <h4 className="text-xs font-black text-primary mb-1">{m.title}</h4>
            <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed italic line-clamp-2">"{m.message}"</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const FeedPage: React.FC = () => {
  const navigate = useNavigate();
  const { showModal } = useModal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<FeedPost | null>(null);
  const [interactionModal, setInteractionModal] = useState<{ type: 'aplause' | 'comment' | 'send' | null, postId: string | null }>({ type: null, postId: null });
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredSchools, setFeaturedSchools] = useState<any[]>([]);

  // Comments state
  const [activePostComments, setActivePostComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [editingComment, setEditingComment] = useState<any>(null);
  const [recentVisitors, setRecentVisitors] = useState<any[]>([]);
  const [trendingTags, setTrendingTags] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  // Time ago helper
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " anos atrás";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " meses atrás";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " dias atrás";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h atrás";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m atrás";
    return "Agora mesmo";
  };

  const formatPost = (apiPost: any): FeedPost => ({
    id: apiPost.id,
    author: apiPost.author.name,
    authorId: apiPost.author.id,
    authorTitle: apiPost.author.school || (apiPost.author.role === 'ESCOLA' ? 'Instituição' : 'Educador'),
    authorAvatar: getMediaUrl(apiPost.author.avatar) || IMAGES.DEFAULT_AVATAR,
    content: apiPost.content,
    timestamp: timeAgo(apiPost.createdAt),
    likes: apiPost.likes,
    comments: apiPost.comments,
    shares: 0,
    image: apiPost.image, // Legacy
    images: apiPost.images && apiPost.images.length > 0 ? apiPost.images : (apiPost.image ? [apiPost.image] : []),
    isVerified: apiPost.author.verified,
    userReaction: apiPost.userReaction
  });

  const fetchPosts = async (filters?: { tag?: string, search?: string }) => {
    try {
      setLoading(true);
      const data = await postsAPI.getPosts(filters);
      setPosts(data.map(formatPost));
    } catch (error) {
      console.error('Failed to fetch posts', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavoriteSchools = async (userId: string) => {
    try {
      const data = await usersAPI.getFollowing(userId);
      setFeaturedSchools(data);
    } catch (error) {
      console.error('Failed to fetch favorite schools', error);
    }
  };

  const [user, setUser] = useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTag = searchParams.get('tag');
  const searchQuery = searchParams.get('search');

  useEffect(() => {
    fetchPosts({
      tag: activeTag || undefined,
      search: searchQuery || undefined
    });
    socialAPI.getTrendingTags().then(setTrendingTags).catch(console.error);
    socialAPI.getEvents().then(setEvents).catch(console.error);

    authAPI.getProfile()
      .then(profile => {
        setUser(profile);
        if (profile) {
          socialAPI.getRecentVisitors().then(setRecentVisitors).catch(console.error);
          fetchFavoriteSchools(profile.id);
        }
      })
      .catch(err => console.error('Failed to load profile', err));
  }, [activeTag, searchQuery, setSearchParams]);

  // Load comments when modal opens
  useEffect(() => {
    if (interactionModal.type === 'comment' && interactionModal.postId) {
      setLoadingComments(true);
      postsAPI.getPost(interactionModal.postId)
        .then(post => {
          if (post.comments) {
            setActivePostComments(post.comments);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoadingComments(false));
    } else {
      setActivePostComments([]);
      setCommentText('');
    }
  }, [interactionModal.type, interactionModal.postId]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handlePostCreated = () => {
    setIsModalOpen(false);
    fetchPosts();
  };

  const handlePostUpdated = (updatedPost: any) => {
    setEditingPost(null);
    // Optimistic update or refresh
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? formatPost(updatedPost) : p));
  };


  const handleReaction = async (id: string, type: string) => {
    try {
      setPosts(prev => prev.map(p => {
        if (p.id === id) {
          const wasLiked = !!p.userReaction;
          const isToggleOff = wasLiked && p.userReaction === type;
          return {
            ...p,
            userReaction: isToggleOff ? null : type,
            likes: isToggleOff ? p.likes - 1 : (wasLiked ? p.likes : p.likes + 1)
          };
        }
        return p;
      }));
      await postsAPI.likePost(id, type);
      fetchPosts();
    } catch (error) {
      console.error(error);
      fetchPosts();
    }
  };

  const handleDeletePost = async (id: string) => {
    showModal({
      title: 'Excluir Publicação',
      message: 'Tem certeza que deseja remover esta postagem permanentemente?',
      type: 'warning',
      confirmLabel: 'Excluir',
      onConfirm: async () => {
        try {
          await postsAPI.deletePost(id);
          fetchPosts();
          showModal({ title: 'Removida', message: 'A publicação foi excluída com sucesso.', type: 'success' });
        } catch (error) {
          console.error('Failed to delete post', error);
          showModal({ title: 'Erro', message: 'Não foi possível excluir a publicação. Tente novamente.', type: 'error' });
        }
      }
    });
  };

  const handleCommentSubmit = async (content: string) => {
    if (!content.trim() || !interactionModal.postId) return;
    try {
      const newComment = await postsAPI.addComment(interactionModal.postId, { content });
      setActivePostComments(prev => [newComment, ...prev]);
      fetchPosts();
    } catch (error) {
      console.error('Failed to send comment', error);
      showModal({ title: 'Erro', message: 'Falha ao enviar comentário.', type: 'error' });
    }
  };

  const handleUpdateComment = async (content: string) => {
    if (!editingComment || !interactionModal.postId) return;
    try {
      const updated = await postsAPI.updateComment(interactionModal.postId, editingComment.id, { content });
      setActivePostComments(prev => prev.map(c => c.id === updated.id ? updated : c));
      setEditingComment(null);
    } catch (error) {
      console.error('Failed to update comment', error);
      showModal({ title: 'Erro', message: 'Falha ao atualizar comentário.', type: 'error' });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!interactionModal.postId) return;

    // Simple confirmation using window.confirm for now, or use showModal if complex logic needed
    if (!window.confirm('Tem certeza que deseja excluir este comentário?')) return;

    try {
      await postsAPI.deleteComment(interactionModal.postId, commentId);
      setActivePostComments(prev => prev.filter(c => c.id !== commentId));
      setPosts(prev => prev.map(p => p.id === interactionModal.postId ? { ...p, comments: p.comments - 1 } : p));
    } catch (error) {
      console.error('Failed to delete comment', error);
      showModal({ title: 'Erro', message: 'Falha ao excluir comentário.', type: 'error' });
    }
  };

  const renderContent = (content: string) => {
    // Regex for mentions: @[Name](id) or simple @word AND Hashtags: #word
    const parts = content.split(/(@\[[^\]]+\]\([^\)]+\)|@[\w\u00C0-\u00FF]+|#[\w\u00C0-\u00FF]+)/g);

    // Check for YouTube links
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const youtubeMatch = content.match(youtubeRegex);
    let youtubeEmbed = null;

    if (youtubeMatch && youtubeMatch[1]) {
      youtubeEmbed = (
        <div className="mt-3 w-full aspect-video rounded-xl overflow-hidden shadow-sm">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      );
    }

    return (
      <>
        <div className="text-sm leading-relaxed dark:text-gray-300 whitespace-pre-wrap">
          {parts.map((part, index) => {
            if (part.startsWith('@[')) {
              const match = part.match(/@\[([^\]]+)\]\(([^\)]+)\)/);
              if (match) {
                return (
                  <span
                    key={index}
                    onClick={(e) => { e.stopPropagation(); navigate(`/profile/${match[2]}`); }}
                    className="text-primary font-bold hover:underline cursor-pointer"
                  >
                    {match[1]}
                  </span>
                );
              }
            } else if (part.startsWith('@')) {
              return <span key={index} className="text-primary font-bold hover:underline cursor-pointer">{part}</span>;
            } else if (part.startsWith('#')) {
              const tag = part.substring(1);
              return (
                <span
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchParams({ tag });
                  }}
                  className="text-primary font-black hover:bg-primary/10 px-1 rounded transition-colors cursor-pointer"
                >
                  {part}
                </span>
              );
            }
            return part;
          })}
        </div>
        {youtubeEmbed}
      </>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f2f5] dark:bg-background-dark">
      <Header activeTab="home" onLogout={handleLogout} user={user} />

      <main className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6 pb-24 md:pb-8">
        {/* Left Sidebar - Hidden on mobile */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-20 space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="h-16 bg-gradient-to-r from-primary to-blue-400"></div>
            <div className="px-4 pb-4 -mt-8 flex flex-col items-center">
              <div className="size-20 rounded-full border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-900 bg-cover bg-center shadow-xl ring-4 ring-black/5 mb-3" style={{ backgroundImage: `url(${getMediaUrl(user?.avatar) || IMAGES.DEFAULT_AVATAR})` }} />
              <h3 className="font-bold text-lg dark:text-white text-center">{user?.name || 'Carregando...'}</h3>
              <p className="text-sm text-gray-500 text-center">{user?.role === 'ESCOLA' ? 'Instituição de Ensino' : (user?.bio || 'Membro da Comunidade')}</p>
              
              {/* Refined School Display for Multiple Units */}
              {user?.schools && user.schools.length > 0 ? (
                <div className="mt-2 text-center">
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Unidades Vinculadas</p>
                  <div className="flex flex-wrap justify-center gap-1 px-4">
                    {user.schools.slice(0, 3).map((s: any) => (
                      <span key={s.id} className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                        {s.name}
                      </span>
                    ))}
                    {user.schools.length > 3 && (
                      <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-dashed border-gray-200">
                        +{user.schools.length - 3} unidades
                      </span>
                    )}
                  </div>
                </div>
              ) : user?.school && (
                <p className="text-xs font-bold text-primary mt-1 text-center">{user.school}</p>
              )}
              <button
                onClick={() => navigate(`/profile/${user?.id}`)}
                className="mt-4 w-full py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-all border border-primary/20"
              >
                Ver Perfil Completo
              </button>
            </div>
          </div>

            {user && (
              <div className="space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-xs mb-4 flex items-center gap-2 text-gray-400 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-sm text-primary">visibility</span>
                  Visitantes Recentes
                </h3>
                {recentVisitors.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {recentVisitors.map(visitor => (
                      <div
                        key={visitor.id}
                        title={visitor.name}
                        onClick={() => navigate(`/profile/${visitor.id}`)}
                        className="size-10 rounded-full bg-cover bg-center border border-gray-100 dark:border-gray-800 cursor-pointer hover:ring-4 ring-primary/20 transition-all shadow-sm bg-white dark:bg-gray-900"
                        style={{ backgroundImage: `url(${getMediaUrl(visitor.avatar) || IMAGES.DEFAULT_AVATAR})` }}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400 text-center py-2 italic">Ninguém visitou seu perfil ainda.</p>
                )}
              </div>

              {/* Tópicos Recentes Widget */}
              <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-xs mb-4 flex items-center gap-2 text-gray-400 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-sm text-primary">tag</span>
                  Tópicos Recentes
                </h3>
                <div className="space-y-3">
                  {trendingTags.length > 0 ? (
                    trendingTags.map(tag => (
                      <button
                        key={tag.name}
                        onClick={() => setSearchParams({ tag: tag.name })}
                        className="flex items-center justify-between w-full group text-left"
                      >
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">#{tag.name}</span>
                        <span className="text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-full group-hover:bg-primary/20 group-hover:text-primary transition-all">{tag.count} posts</span>
                      </button>
                    ))
                  ) : (
                    <p className="text-[10px] text-gray-400 italic">Use hashtags nos seus posts!</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

        {/* Feed */}
        <div className="lg:col-span-6 space-y-4">
          {/* Active Filter Indicator */}
          {(activeTag || searchQuery) && (
            <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300 border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">{activeTag ? 'tag' : 'search'}</span>
                </div>
                <div>
                  <p className="text-[10px] text-primary font-black uppercase tracking-widest">Filtrando por</p>
                  <p className="text-sm font-bold dark:text-white">
                    {activeTag ? `#${activeTag}` : `"${searchQuery}"`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSearchParams({})}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-100 rounded-xl text-xs font-black transition-all shadow-sm border border-gray-100 dark:border-gray-700"
              >
                Limpar Filtro
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 rounded-2xl md:rounded-xl p-4 md:p-5 shadow-sm border dark:border-gray-800">
            <div className="flex gap-4 items-center">
              <div className="size-10 md:size-11 rounded-full bg-cover bg-center shrink-0 shadow-md border-2 border-white dark:border-gray-800 ring-2 ring-black/5 bg-white dark:bg-gray-900" style={{ backgroundImage: `url(${getMediaUrl(user?.avatar) || IMAGES.DEFAULT_AVATAR})` }} />
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex-1 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-2xl px-5 py-3.5 text-xs md:text-sm font-medium transition-all border border-gray-100 dark:border-gray-700 shadow-inner"
              >
                No que você está pensando hoje?
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-8"><span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span></div>
          ) : posts.length === 0 ? (
            <div className="text-center p-8 text-gray-500">Nenhuma publicação ainda. Seja o primeiro!</div>
          ) : (
            posts.map(post => (
              <article key={post.id} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex gap-3">
                    <div
                      onClick={() => navigate(`/profile/${post.authorId}`)}
                      className="size-12 rounded-full bg-cover bg-center shrink-0 border-2 border-white dark:border-gray-800 cursor-pointer hover:ring-4 ring-primary transition-all shadow-md bg-white dark:bg-gray-900 ring-2 ring-black/5"
                      style={{ backgroundImage: `url(${getMediaUrl(post.authorAvatar)})` }}
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <h4
                          onClick={() => navigate(`/profile/${post.authorId}`)}
                          className="font-bold text-sm dark:text-white cursor-pointer hover:text-primary transition-colors"
                        >
                          {post.author}
                        </h4>
                        {post.isVerified && <span className="material-symbols-outlined text-primary text-sm font-fill-1">verified</span>}
                      </div>
                      <p className="text-[11px] text-gray-500">{post.authorTitle} • {post.timestamp}</p>
                    </div>
                  </div>
                  {user && (user.id === post.authorId || user.role === 'ADMIN') && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingPost(post)}
                        className="text-gray-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        title="Editar publicação"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Excluir publicação"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  )}
                </div>
                <div className="px-4 pb-4">
                  <div className="text-sm leading-relaxed dark:text-gray-300 whitespace-pre-wrap">{renderContent(post.content)}</div>
                </div>

                {/* GALLERY / CAROUSEL */}
                {post.images && post.images.length > 0 && (
                  <ImageCarousel images={post.images} />
                )}

                <div className="grid grid-cols-3 p-1 border-t dark:border-gray-800 mt-2">
                  <div className="flex justify-center">
                    <ReactionButton
                      postId={post.id}
                      currentUserReaction={post.userReaction || null}
                      likesCount={post.likes}
                      onReact={(type) => handleReaction(post.id, type)}
                    />
                  </div>
                  <button
                    onClick={() => setInteractionModal({ type: 'comment', postId: post.id })}
                    className="flex items-center justify-center gap-1.5 py-3 text-[10px] md:text-sm font-black uppercase tracking-tight text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl md:text-2xl">chat</span>
                    <span>{post.comments > 0 ? `(${post.comments})` : 'Comentar'}</span>
                  </button>
                  <button
                    onClick={() => setInteractionModal({ type: 'send', postId: post.id })}
                    className="flex items-center justify-center gap-1.5 py-3 text-[10px] md:text-sm font-black uppercase tracking-tight text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl md:text-2xl">share</span>
                    <span>Enviar</span>
                  </button>
                </div>
              </article>
            )))}
        </div>

        {/* Right Sidebar - Hidden on mobile */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-20 space-y-4">
            <MilestonesWidget />

            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-primary">favorite</span>
                Minhas Unidades Favoritas
              </h3>
              <div className="space-y-4">
                {featuredSchools.length > 0 ? (
                  featuredSchools.map(school => (
                    <SchoolSuggest
                      key={school.id}
                      id={school.id}
                      name={school.name}
                      type={school.schoolType || 'Instituição'}
                      avatar={school.avatar}
                      initialFollowing={true}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <span className="material-symbols-outlined text-3xl text-gray-200">explore</span>
                    <p className="text-[10px] text-gray-400 font-medium">Você ainda não favoritou nenhuma unidade.</p>
                    <button
                      onClick={() => navigate('/network')}
                      className="text-[10px] font-black text-primary hover:underline"
                    >
                      Explorar Unidades
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Eventos da Semana Widget */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400 mb-4 flex items-center justify-between">
                <span>Eventos da Semana</span>
                <span className="material-symbols-outlined text-primary text-sm">calendar_month</span>
              </h3>
              <div className="space-y-4">
                {events.length > 0 ? (
                  events.map(event => (
                    <div key={event.id} className="flex gap-3 group cursor-pointer" onClick={() => event.link && window.open(event.link, '_blank')}>
                      <div className="size-12 shrink-0 bg-blue-50 dark:bg-primary/10 rounded-xl flex flex-col items-center justify-center p-1 border border-blue-100 dark:border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                        <span className="text-[10px] font-bold uppercase">{new Date(event.date).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                        <span className="text-lg font-black leading-none">{new Date(event.date).getDate()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">{event.name}</p>
                        <p className="text-[10px] text-gray-500">{new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {event.link ? 'Online' : 'Presencial'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-gray-400 italic text-center py-4">Nenhum evento programado.</p>
                )}
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* MODALS */}
      {isModalOpen && (
        <CreatePostModal onClose={() => setIsModalOpen(false)}>
          <RichPostInput onPostCreated={handlePostCreated} userAvatar={user?.avatar} />
        </CreatePostModal>
      )}

      {editingPost && (
        <CreatePostModal onClose={() => setEditingPost(null)}>
          <div className="mb-4">
            <h3 className="text-lg font-bold mb-2">Editar Publicação</h3>
          </div>
          <RichPostInput
            onPostCreated={handlePostUpdated}
            userAvatar={user?.avatar}
            initialContent={editingPost.content}
            initialImages={editingPost.images}
            postId={editingPost.id}
            submitLabel="Salvar Edição"
          />
        </CreatePostModal>
      )}

      {interactionModal.type === 'aplause' && (
        <InteractionModal title="Aplausos" onClose={() => setInteractionModal({ type: null, postId: null })}>
          {/* Mock content for now */}
          <div className="p-4 text-center text-gray-500">Em breve: Lista de quem aplaudiu.</div>
        </InteractionModal>
      )}

      {interactionModal.type === 'comment' && (
        <InteractionModal title="Comentários" onClose={() => setInteractionModal({ type: null, postId: null })}>
          <div className="space-y-4">
            <div className="max-h-[300px] overflow-y-auto space-y-4 pr-2">
              {loadingComments ? (
                <div className="flex justify-center p-4"><span className="material-symbols-outlined animate-spin text-primary">progress_activity</span></div>
              ) : activePostComments.length === 0 ? (
                <div className="text-center p-4 text-gray-500 text-sm">Seja o primeiro a comentar!</div>
              ) : (
                activePostComments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="size-8 rounded-full bg-gray-200 shrink-0 bg-cover bg-center" style={{ backgroundImage: `url(${getMediaUrl(comment.author.avatar) || IMAGES.DEFAULT_AVATAR})` }} />
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none text-sm w-full">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-bold text-xs">{comment.author.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">{timeAgo(comment.createdAt)}</span>
                          {user && (user.id === comment.author.id || user.role === 'ADMIN') && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => setEditingComment(comment)}
                                className="text-gray-400 hover:text-primary transition-colors"
                                title="Editar"
                              >
                                <span className="material-symbols-outlined text-xs">edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                                title="Excluir"
                              >
                                <span className="material-symbols-outlined text-xs">delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-gray-700 dark:text-gray-300">{renderContent(comment.content)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t dark:border-gray-800">
              {editingComment ? (
                <div className="bg-primary/5 p-3 rounded-2xl mb-2 flex justify-between items-center animate-in slide-in-from-top-2 duration-300">
                  <span className="text-xs font-bold text-primary italic">Editando comentário...</span>
                  <button onClick={() => setEditingComment(null)} className="text-xs font-black text-gray-500 hover:text-red-500">Cancelar</button>
                </div>
              ) : null}

              <RichCommentInput
                onSubmit={editingComment ? handleUpdateComment : handleCommentSubmit}
                userAvatar={getMediaUrl(user?.avatar)}
                initialContent={editingComment?.content || ''}
                placeholder={editingComment ? "Edite seu comentário..." : "Escreva um comentário..."}
                submitLabel={editingComment ? "Salvar" : "Enviar"}
                autoFocus={!!editingComment}
                onCancel={editingComment ? () => setEditingComment(null) : undefined}
                key={editingComment ? `edit-${editingComment.id}` : 'new-comment'}
              />
            </div>
          </div>
        </InteractionModal>
      )}

      {interactionModal.type === 'send' && (
        <InteractionModal title="Compartilhar" onClose={() => setInteractionModal({ type: null, postId: null })}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-2">
            <button
              onClick={() => {
                const postUrl = `${window.location.origin}/#/post/${interactionModal.postId}`;
                window.open(`https://api.whatsapp.com/send?text=Confira este post no EduConnect: ${postUrl}`, '_blank');
              }}
              className="flex flex-col items-center gap-2 group transition-all"
            >
              <div className="size-14 md:size-16 rounded-2xl bg-emerald-50 content-center dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                <span className="material-symbols-outlined text-3xl filled">chat</span>
              </div>
              <span className="text-[11px] font-black uppercase text-gray-500 group-hover:text-emerald-500">WhatsApp</span>
            </button>

            <button
              onClick={() => {
                const postUrl = `${window.location.origin}/#/post/${interactionModal.postId}`;
                navigator.clipboard.writeText(postUrl);
                showModal({ title: 'Copiado!', message: 'O link da postagem foi copiado para sua área de transferência.', type: 'success' });
              }}
              className="flex flex-col items-center gap-2 group transition-all"
            >
              <div className="size-14 md:size-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm">
                <span className="material-symbols-outlined text-3xl">link</span>
              </div>
              <span className="text-[11px] font-black uppercase text-gray-500 group-hover:text-blue-500">Copiar Link</span>
            </button>

            <button
              onClick={() => {
                const postUrl = `${window.location.origin}/#/post/${interactionModal.postId}`;
                if (navigator.share) {
                  navigator.share({
                    title: 'EduConnect',
                    text: 'Confira este conteúdo no EduConnect!',
                    url: postUrl,
                  }).catch(console.error);
                } else {
                  showModal({ title: 'Indisponível', message: 'Seu navegador não suporta compartilhamento nativo.', type: 'info' });
                }
              }}
              className="flex flex-col items-center gap-2 group transition-all"
            >
              <div className="size-14 md:size-16 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 group-hover:bg-gray-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all shadow-sm">
                <span className="material-symbols-outlined text-3xl">ios_share</span>
              </div>
              <span className="text-[11px] font-black uppercase text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white">Mais</span>
            </button>
          </div>
        </InteractionModal>
      )}
    </div>
  );
};


export default FeedPage;
