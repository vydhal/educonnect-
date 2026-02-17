
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../constants';
import { Post } from '../types';

const FeedPage: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [interactionModal, setInteractionModal] = useState<{type: 'aplause' | 'comment' | 'send' | null, postId: string | null}>({type: null, postId: null});
  const [postContent, setPostContent] = useState('');
  
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      author: 'EMEF Raul Córdula',
      authorTitle: 'Instituição Municipal',
      authorAvatar: IMAGES.SCHOOL_LOGO_RAUL,
      content: 'Hoje iniciamos a fase de colheita do nosso Projeto Horta Escolar. Os alunos do 6º ano aplicaram conhecimentos de biologia e sustentabilidade na prática. 🌱🥦',
      timestamp: '2h atrás',
      likes: 42,
      comments: 12,
      shares: 5,
      image: IMAGES.POST_HORTA,
      isVerified: true
    },
    {
      id: '2',
      author: 'Prof. Ricardo Almeida',
      authorTitle: 'História • Escola Tiradentes',
      authorAvatar: 'https://picsum.photos/200?random=10',
      content: 'Trabalho incrível feito pela turma do 9º ano sobre a Revolução Industrial com maquetes em 3D. Orgulho dessa dedicação!',
      timestamp: '5h atrás',
      likes: 85,
      comments: 18,
      shares: 12,
    }
  ]);

  const handleLogout = () => navigate('/login');

  const handleCreatePost = () => {
    if (!postContent.trim()) return;
    const newPost: Post = {
      id: Date.now().toString(),
      author: 'Carlos Oliveira',
      authorTitle: 'Professor • EMEF Raul Córdula',
      authorAvatar: IMAGES.AVATAR_PROFESSOR,
      content: postContent,
      timestamp: 'Agora mesmo',
      likes: 0,
      comments: 0,
      shares: 0,
    };
    setPosts([newPost, ...posts]);
    setPostContent('');
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f2f5] dark:bg-background-dark">
      <Header activeTab="home" onLogout={handleLogout} />

      <main className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        {/* Left Sidebar */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border overflow-hidden sticky top-20">
            <div className="h-16 bg-gradient-to-r from-primary to-blue-400"></div>
            <div className="px-4 pb-4 -mt-8 flex flex-col items-center">
              <div className="size-20 rounded-full border-4 border-white dark:border-gray-900 bg-white bg-cover bg-center shadow-md mb-3" style={{ backgroundImage: `url(${IMAGES.AVATAR_PROFESSOR})` }} />
              <h3 className="font-bold text-lg dark:text-white">Carlos Oliveira</h3>
              <p className="text-sm text-gray-500 text-center">Professor de História</p>
              <p className="text-xs font-bold text-primary mt-1">EMEF Raul Córdula</p>
            </div>
          </div>
        </aside>

        {/* Feed */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border">
            <div className="flex gap-3 items-center">
              <div className="size-11 rounded-full bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${IMAGES.AVATAR_PROFESSOR})` }} />
              <button onClick={() => setIsModalOpen(true)} className="w-full text-left bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 rounded-full px-5 py-3 text-sm font-medium transition-colors border border-gray-200 dark:border-gray-700">
                Compartilhe um projeto educacional ou aviso...
              </button>
            </div>
          </div>

          {posts.map(post => (
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
              </div>
              <div className="px-4 pb-4">
                <p className="text-sm leading-relaxed dark:text-gray-300">{post.content}</p>
              </div>
              {post.image && <div className="w-full aspect-video bg-gray-100 bg-cover bg-center border-y dark:border-gray-800" style={{ backgroundImage: `url(${post.image})` }} />}
              <div className="grid grid-cols-3 p-1">
                <button 
                  onClick={() => setInteractionModal({type: 'aplause', postId: post.id})}
                  className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="material-symbols-outlined">volunteer_activism</span> Aplaudir
                </button>
                <button 
                  onClick={() => setInteractionModal({type: 'comment', postId: post.id})}
                  className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="material-symbols-outlined">chat</span> Comentar
                </button>
                <button 
                  onClick={() => setInteractionModal({type: 'send', postId: post.id})}
                  className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="material-symbols-outlined">share</span> Enviar
                </button>
              </div>
            </article>
          ))}
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
      {isModalOpen && <CreatePostModal onClose={() => setIsModalOpen(false)} content={postContent} setContent={setPostContent} onSubmit={handleCreatePost} />}
      
      {interactionModal.type === 'aplause' && (
        <InteractionModal title="Aplausos" onClose={() => setInteractionModal({type: null, postId: null})}>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-gray-200" />
                  <div>
                    <p className="text-sm font-bold">Professor Exemplo {i}</p>
                    <p className="text-[10px] text-gray-500">EMEF Raul Córdula</p>
                  </div>
                </div>
                <button className="text-primary text-xs font-bold border border-primary px-3 py-1 rounded-full">Seguir</button>
              </div>
            ))}
          </div>
        </InteractionModal>
      )}

      {interactionModal.type === 'comment' && (
        <InteractionModal title="Comentários" onClose={() => setInteractionModal({type: null, postId: null})}>
          <div className="space-y-4">
            <div className="max-h-[300px] overflow-y-auto space-y-4 pr-2">
              <div className="flex gap-3">
                <div className="size-8 rounded-full bg-gray-200 shrink-0" />
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none text-sm">
                  <p className="font-bold text-xs mb-1">Maria Souza</p>
                  <p>Iniciativa maravilhosa! Os alunos adoram esse tipo de aula prática.</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t dark:border-gray-800">
              <input className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-sm" placeholder="Escreva um comentário..." />
              <button className="bg-primary text-white p-2 rounded-xl"><span className="material-symbols-outlined">send</span></button>
            </div>
          </div>
        </InteractionModal>
      )}

      {interactionModal.type === 'send' && (
        <InteractionModal title="Enviar para" onClose={() => setInteractionModal({type: null, postId: null})}>
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
export const Header: React.FC<{activeTab: 'home' | 'network' | 'projects', onLogout: () => void}> = ({ activeTab, onLogout }) => {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b px-6 py-3 shadow-sm">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-primary cursor-pointer" onClick={() => navigate('/')}>
            <span className="material-symbols-outlined text-3xl font-fill-1">auto_awesome</span>
            <h2 className="text-xl font-black hidden lg:block text-[#0d121b] dark:text-white">EduConnect CG</h2>
          </div>
        </div>
        <nav className="flex gap-4 md:gap-8 items-center">
          <NavIcon icon="home" label="Início" active={activeTab === 'home'} onClick={() => navigate('/feed')} />
          <NavIcon icon="group" label="Rede" active={activeTab === 'network'} onClick={() => navigate('/network')} />
          <NavIcon icon="school" label="Projetos" active={activeTab === 'projects'} onClick={() => navigate('/projects')} />
        </nav>
        <div className="flex items-center gap-3 border-l pl-4">
          <button onClick={onLogout} title="Sair" className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
            <span className="material-symbols-outlined">logout</span>
          </button>
          <div className="size-9 rounded-full bg-cover bg-center border border-gray-200 cursor-pointer" style={{ backgroundImage: `url(${IMAGES.AVATAR_PROFESSOR})` }} />
        </div>
      </div>
    </header>
  );
};

const CreatePostModal: React.FC<{onClose: () => void, content: string, setContent: (v: string) => void, onSubmit: () => void}> = ({ onClose, content, setContent, onSubmit }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white dark:bg-gray-900 w-full max-w-[550px] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
      <div className="px-6 py-4 border-b dark:border-gray-800 flex justify-between items-center">
        <h2 className="text-xl font-black">Criar Publicação</h2>
        <button onClick={onClose} className="size-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><span className="material-symbols-outlined">close</span></button>
      </div>
      <div className="p-6">
        <textarea autoFocus value={content} onChange={(e) => setContent(e.target.value)} placeholder="O que você quer compartilhar com a rede?" className="w-full min-h-[180px] text-lg bg-transparent border-none focus:ring-0 resize-none" />
      </div>
      <div className="px-6 pb-6">
        <button onClick={onSubmit} disabled={!content.trim()} className={`w-full py-3.5 rounded-xl font-bold text-lg shadow-lg transition-all ${content.trim() ? 'bg-primary text-white shadow-primary/20' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>Publicar</button>
      </div>
    </div>
  </div>
);

const InteractionModal: React.FC<{title: string, onClose: () => void, children: React.ReactNode}> = ({ title, onClose, children }) => (
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

const NavIcon: React.FC<{icon: string, label: string, active?: boolean, onClick: () => void}> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 group ${active ? 'text-primary' : 'text-gray-500 hover:text-primary transition-colors'}`}>
    <span className={`material-symbols-outlined ${active ? 'font-fill-1' : ''}`}>{icon}</span>
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);

const SchoolSuggest: React.FC<{name: string, type: string}> = ({ name, type }) => (
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
