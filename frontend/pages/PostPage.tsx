import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Post } from '../types';
import { postsAPI, authAPI, socialAPI, getMediaUrl } from '../api';
import { Header } from '../components/Header';
import { ReactionButton } from '../components/ReactionButton';
import { ImageCarousel } from '../components/ImageCarousel';
import { useModal } from '../contexts/ModalContext';
import { RichCommentInput } from '../components/RichCommentInput';
import { IMAGES } from '../constants';

const PostPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showModal } = useModal();
    const [post, setPost] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activePostComments, setActivePostComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState('');
    const [editingComment, setEditingComment] = useState<any>(null);

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

    const formatPost = (apiPost: any) => ({
        id: apiPost.id,
        author: apiPost.author.name,
        authorId: apiPost.author.id,
        authorTitle: apiPost.author.school || (apiPost.author.role === 'ESCOLA' ? 'Instituição' : 'Educador'),
        authorAvatar: getMediaUrl(apiPost.author.avatar) || IMAGES.DEFAULT_AVATAR,
        content: apiPost.content,
        timestamp: timeAgo(apiPost.createdAt),
        likes: apiPost.likes,
        commentsCount: apiPost.commentsCount || (apiPost.comments ? apiPost.comments.length : 0),
        images: apiPost.images && apiPost.images.length > 0 ? apiPost.images : (apiPost.image ? [apiPost.image] : []),
        isVerified: apiPost.author.verified,
        userReaction: apiPost.userReaction,
        comments: apiPost.comments || []
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const [postData, profile] = await Promise.all([
                    postsAPI.getPost(id),
                    authAPI.getProfile().catch(() => null)
                ]);
                
                setPost(formatPost(postData));
                setActivePostComments(postData.comments || []);
                setUser(profile);
            } catch (error: any) {
                console.error('Failed to load post', error);
                showModal({ title: 'Erro', message: 'Não foi possível carregar esta publicação.', type: 'error' });
                navigate('/feed');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleReaction = async (type: string) => {
        if (!post) return;
        try {
            await postsAPI.likePost(post.id, type);
            // Refresh post info
            const updated = await postsAPI.getPost(post.id);
            setPost(formatPost(updated));
        } catch (error) {
            console.error(error);
        }
    };

    const handleSendComment = async (content: string) => {
        if (!content.trim() || !post) return;
        try {
            const newComment = await postsAPI.addComment(post.id, { content });
            setActivePostComments(prev => [newComment, ...prev]);
            setPost((prev: any) => ({ ...prev, commentsCount: prev.commentsCount + 1 }));
        } catch (error) {
            console.error('Failed to send comment', error);
            showModal({ title: 'Erro', message: 'Falha ao enviar comentário.', type: 'error' });
        }
    };

    const handleUpdateComment = async (content: string) => {
        if (!editingComment || !post) return;
        try {
            const updated = await postsAPI.updateComment(post.id, editingComment.id, { content });
            setActivePostComments(prev => prev.map(c => c.id === updated.id ? updated : c));
            setEditingComment(null);
        } catch (error) {
            console.error('Failed to update comment', error);
            showModal({ title: 'Erro', message: 'Falha ao atualizar comentário.', type: 'error' });
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!post) return;
        if (!window.confirm('Tem certeza que deseja excluir este comentário?')) return;

        try {
            await postsAPI.deleteComment(post.id, commentId);
            setActivePostComments(prev => prev.filter(c => c.id !== commentId));
            setPost((prev: any) => ({ ...prev, commentsCount: Math.max(0, prev.commentsCount - 1) }));
        } catch (error) {
            console.error('Failed to delete comment', error);
            showModal({ title: 'Erro', message: 'Falha ao excluir comentário.', type: 'error' });
        }
    };

    const renderContent = (content: string) => {
        // Simple mention parsing for now, will enhance later
        const parts = content.split(/(@\[[^\]]+\]\([^\)]+\)|@[\w\u00C0-\u00FF]+)/g);
        return (
            <p className="text-base leading-relaxed dark:text-gray-300 whitespace-pre-wrap">
                {parts.map((part, index) => {
                    if (part.startsWith('@[')) {
                        const match = part.match(/@\[([^\]]+)\]\(([^\)]+)\)/);
                        if (match) {
                            return <span key={index} onClick={() => navigate(`/profile/${match[2]}`)} className="text-primary font-bold hover:underline cursor-pointer">{match[1]}</span>;
                        }
                    } else if (part.startsWith('@')) {
                        return <span key={index} className="text-primary font-bold hover:underline cursor-pointer">{part}</span>;
                    }
                    return part;
                })}
            </p>
        );
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] dark:bg-gray-900"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>;
    if (!post) return null;

    return (
        <div className="flex flex-col min-h-screen bg-[#f0f2f5] dark:bg-background-dark">
            <Header activeTab="home" user={user} onLogout={() => navigate('/login')} />

            <main className="max-w-2xl mx-auto w-full p-4 md:p-6 pb-24 md:pb-8">
                <button 
                  onClick={() => navigate(-1)} 
                  className="mb-4 flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold text-sm"
                >
                  <span className="material-symbols-outlined">arrow_back</span> Voltar
                </button>

                <article className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-6 flex items-center justify-between">
                        <div className="flex gap-4">
                            <div
                                onClick={() => navigate(`/profile/${post.authorId}`)}
                                className="size-14 rounded-2xl bg-cover bg-center shrink-0 border-2 border-primary/10 cursor-pointer hover:ring-4 ring-primary/5 transition-all"
                                style={{ backgroundImage: `url(${post.authorAvatar})` }}
                            />
                            <div>
                                <div className="flex items-center gap-1">
                                    <h4
                                        onClick={() => navigate(`/profile/${post.authorId}`)}
                                        className="font-black text-lg dark:text-white cursor-pointer hover:text-primary transition-colors"
                                    >
                                        {post.author}
                                    </h4>
                                    {post.isVerified && <span className="material-symbols-outlined text-primary text-sm font-fill-1">verified</span>}
                                </div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{post.authorTitle} • {post.timestamp}</p>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 pb-6">
                        <div className="text-gray-800 dark:text-gray-200">{renderContent(post.content)}</div>
                    </div>

                    {post.images && post.images.length > 0 && (
                        <div className="px-6 pb-6">
                           <ImageCarousel images={post.images} />
                        </div>
                    )}

                    <div className="px-6 py-4 border-t dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20 flex items-center justify-around">
                        <ReactionButton
                            postId={post.id}
                            currentUserReaction={post.userReaction || null}
                            likesCount={post.likes}
                            onReact={handleReaction}
                        />
                        <button className="flex items-center gap-2 text-gray-400 font-bold text-sm">
                            <span className="material-symbols-outlined">chat</span>
                            {post.commentsCount} Comentários
                        </button>
                    </div>

                    <div className="p-6 border-t dark:border-gray-800">
                        <h3 className="font-black text-sm mb-6 uppercase tracking-widest text-gray-400">Comentários</h3>
                        <div className="space-y-6">
                            {activePostComments.length === 0 ? (
                                <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-dashed text-gray-400 italic text-sm">
                                    Nenhum comentário ainda. Comece a conversa!
                                </div>
                            ) : (
                                activePostComments.map(comment => (
                                    <div key={comment.id} className="flex gap-4 animate-in fade-in duration-300">
                                        <div 
                                          onClick={() => navigate(`/profile/${comment.author.id}`)}
                                          className="size-10 rounded-xl bg-gray-200 shrink-0 bg-cover bg-center cursor-pointer hover:ring-2 ring-primary transition-all" 
                                          style={{ backgroundImage: `url(${comment.author.avatar || IMAGES.DEFAULT_AVATAR})` }} 
                                        />
                                        <div className="bg-gray-100 dark:bg-gray-800/60 p-4 rounded-3xl rounded-tl-none text-sm w-full">
                                            <div className="flex justify-between items-center mb-1">
                                                <p 
                                                  onClick={() => navigate(`/profile/${comment.author.id}`)}
                                                  className="font-black text-xs hover:text-primary cursor-pointer transition-colors"
                                                >
                                                  {comment.author.name}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                   <span className="text-[10px] text-gray-400 font-bold">{timeAgo(comment.createdAt)}</span>
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
                                            <div className="text-gray-600 dark:text-gray-300">{renderContent(comment.content)}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        {user && (
                            <div className="mt-8 pt-6 border-t dark:border-gray-800">
                                {editingComment && (
                                    <div className="bg-primary/5 p-3 rounded-2xl mb-4 flex justify-between items-center animate-in slide-in-from-top-2 duration-300">
                                        <span className="text-xs font-bold text-primary italic">Editando comentário...</span>
                                        <button onClick={() => setEditingComment(null)} className="text-xs font-black text-gray-500 hover:text-red-500">Cancelar</button>
                                    </div>
                                )}
                                <RichCommentInput
                                    onSubmit={editingComment ? handleUpdateComment : handleSendComment}
                                    userAvatar={user.avatar}
                                    initialContent={editingComment?.content || ''}
                                    placeholder={editingComment ? "Edite seu comentário..." : "No que você está pensando?"}
                                    submitLabel={editingComment ? "Salvar" : "Enviar"}
                                    autoFocus={!!editingComment}
                                    onCancel={editingComment ? () => setEditingComment(null) : undefined}
                                    key={editingComment ? `edit-${editingComment.id}` : 'new-comment'}
                                />
                            </div>
                        )}
                    </div>
                </article>
            </main>
        </div>
    );
};

export default PostPage;
