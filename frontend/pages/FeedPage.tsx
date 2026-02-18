import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Post, Comment } from '../types';
import { postsAPI, authAPI, usersAPI } from '../api';
import { ReactionButton } from '../components/ReactionButton';
import { RichPostInput } from '../components/RichPostInput';
import { Header } from '../components/Header';
import { ImageCarousel } from '../components/ImageCarousel';

// Extend Post type locally if not updated in types.ts yet
interface FeedPost extends Post {
  userReaction?: string | null;
  images?: string[];
}

const FeedPage: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<FeedPost | null>(null);
  const [interactionModal, setInteractionModal] = useState<{ type: 'aplause' | 'comment' | 'send' | null, postId: string | null }>({ type: null, postId: null });
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Comments state
  const [activePostComments, setActivePostComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');

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
    authorAvatar: apiPost.author.avatar || `https://ui-avatars.com/api/?name=${apiPost.author.name}&background=random`,
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

  const fetchPosts = async () => {
    try {
      const data = await postsAPI.getPosts();
      setPosts(data.map(formatPost));
    } catch (error) {
      console.error('Failed to fetch posts', error);
    } finally {
      setLoading(false);
    }
  };

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchPosts();
    authAPI.getProfile()
      .then(profile => setUser(profile))
      .catch(err => console.error('Failed to load profile', err));
  }, []);

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
    if (window.confirm('Tem certeza que deseja excluir esta publicação?')) {
      try {
        await postsAPI.deletePost(id);
        fetchPosts();
      } catch (error) {
        console.error('Failed to delete post', error);
        alert('Erro ao excluir publicação');
      }
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !interactionModal.postId) return;
    try {
      const newComment = await postsAPI.addComment(interactionModal.postId, { content: commentText });
      setActivePostComments(prev => [newComment, ...prev]);
      setCommentText('');
      fetchPosts();
    } catch (error) {
      console.error('Failed to send comment', error);
    }
  };

  const renderContent = (content: string) => {
    // Regex for mentions: @word
    const parts = content.split(/(@[\w\u00C0-\u00FF]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return <span key={index} className="text-primary font-bold hover:underline cursor-pointer">{part}</span>;
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f2f5] dark:bg-background-dark">
      <Header activeTab="home" onLogout={handleLogout} user={user} />

      <main className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        {/* Left Sidebar */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border overflow-hidden sticky top-20">
            <div className="h-16 bg-gradient-to-r from-primary to-blue-400"></div>
            <div className="px-4 pb-4 -mt-8 flex flex-col items-center">
              <div className="size-20 rounded-full border-4 border-white dark:border-gray-900 bg-white bg-cover bg-center shadow-md mb-3" style={{ backgroundImage: `url(${user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`})` }} />
              <h3 className="font-bold text-lg dark:text-white text-center">{user?.name || 'Carregando...'}</h3>
              <p className="text-sm text-gray-500 text-center">{user?.role === 'ESCOLA' ? 'Instituição de Ensino' : (user?.bio || 'Membro da Comunidade')}</p>
              {user?.school && <p className="text-xs font-bold text-primary mt-1 text-center">{user.school}</p>}
            </div>
          </div>
        </aside>

        {/* Feed */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border">
            <div className="flex gap-3 items-center">
              <div className="size-11 rounded-full bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`})` }} />
              <button onClick={() => setIsModalOpen(true)} className="w-full text-left bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 rounded-full px-5 py-3 text-sm font-medium transition-colors border border-gray-200 dark:border-gray-700">
                Compartilhe um projeto educacional ou aviso...
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
                    <div className="size-12 rounded-full bg-cover bg-center shrink-0 border" style={{ backgroundImage: `url(${post.authorAvatar})` }} />
                    <div>
                      <div className="flex items-center gap-1">
                        <h4 className="font-bold text-sm dark:text-white">{post.author}</h4>
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
                  <p className="text-sm leading-relaxed dark:text-gray-300 whitespace-pre-wrap">{renderContent(post.content)}</p>
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
                    className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="material-symbols-outlined">chat</span> {post.comments > 0 ? post.comments : 'Comentar'}
                  </button>
                  <button
                    onClick={() => setInteractionModal({ type: 'send', postId: post.id })}
                    className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="material-symbols-outlined">share</span> Enviar
                  </button>
                </div>
              </article>
            )))}
        </div>

        {/* Right Widgets */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border sticky top-20">
            <h3 className="font-bold text-sm mb-4">Escolas em destaque</h3>
            <SchoolSuggest name="EMEF Solon de Lucena" type="Escola Municipal" />
            <SchoolSuggest name="EMEF Vigário Calixto" type="Escola Municipal" />
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
                    <div className="size-8 rounded-full bg-gray-200 shrink-0 bg-cover bg-center" style={{ backgroundImage: `url(${comment.author.avatar || `https://ui-avatars.com/api/?name=${comment.author.name}&background=random`})` }} />
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none text-sm w-full">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-bold text-xs">{comment.author.name}</p>
                        <span className="text-[10px] text-gray-400">{timeAgo(comment.createdAt)}</span>
                      </div>
                      <p>{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t dark:border-gray-800">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-sm"
                placeholder="Escreva um comentário..."
              />
              <button
                onClick={handleSendComment}
                disabled={!commentText.trim()}
                className={`p-2 rounded-xl transition-colors ${commentText.trim() ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </InteractionModal>
      )}

      {interactionModal.type === 'send' && (
        <InteractionModal title="Enviar para" onClose={() => setInteractionModal({ type: null, postId: null })}>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex flex-col items-center gap-3 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all group">
              <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">chat_bubble</span>
              <span className="text-sm font-bold">Mensagem Direta</span>
            </button>
            <button className="flex flex-col items-center gap-3 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all group">
              <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">link</span>
              <span className="text-sm font-bold">Copiar Link</span>
            </button>
          </div>
        </InteractionModal>
      )}
    </div>
  );
};

// Reusable Components

const CreatePostModal: React.FC<{ onClose: () => void, children: React.ReactNode }> = ({ onClose, children }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white dark:bg-gray-900 w-full max-w-[550px] rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
      <div className="px-6 py-4 border-b dark:border-gray-800 flex justify-between items-center shrink-0">
        <h2 className="text-xl font-black">Criar Publicação</h2>
        <button onClick={onClose} className="size-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><span className="material-symbols-outlined">close</span></button>
      </div>
      <div className="p-6 overflow-y-auto custom-scrollbar overflow-x-visible">
        {children}
      </div>
    </div>
  </div>
);

const InteractionModal: React.FC<{ title: string, onClose: () => void, children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white dark:bg-gray-900 w-full max-w-[450px] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
      <div className="px-6 py-4 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
        <h2 className="text-lg font-black">{title}</h2>
        <button onClick={onClose} className="size-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"><span className="material-symbols-outlined">close</span></button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const SchoolSuggest: React.FC<{ name: string, type: string }> = ({ name, type }) => (
  <div className="flex items-center justify-between gap-2 mb-4">
    <div className="flex items-center gap-3 min-w-0">
      <div className="size-9 bg-gray-100 rounded-lg shrink-0 bg-cover bg-center border border-gray-100" style={{ backgroundImage: `url(https://picsum.photos/100?random=${name})` }} />
      <div className="min-w-0">
        <p className="text-xs font-bold truncate">{name}</p>
        <p className="text-[10px] text-gray-500">{type}</p>
      </div>
    </div>
    <button className="border-2 border-primary text-primary hover:bg-primary text-xs font-bold py-1 px-3 rounded-full transition-all hover:text-white">Seguir</button>
  </div>
);

export default FeedPage;
